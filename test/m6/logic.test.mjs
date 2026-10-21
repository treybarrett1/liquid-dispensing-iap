import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { calculateDispenseTime } from '../../src/dispensing.js';
import { DomainError, RunHistory, validateTarget } from '../../src/run-history.js';
import { SqliteHistory } from '../../src/sqlite-history.js';

function withDatabase(check) {
  const directory = mkdtempSync(join(tmpdir(), 'iap-m6-unit-'));
  const filename = join(directory, 'history.sqlite');
  let store = new SqliteHistory(filename);
  try {
    check({ filename, store, history: new RunHistory(store), reopen() {
      store.close();
      store = new SqliteHistory(filename);
      return new RunHistory(store);
    } });
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
}

test('an exactly full bottle is allowed (inclusive capacity boundary)', () => {
  assert.deepEqual(validateTarget({ targetMl: 120, usableCapacityMl: 120 }), {
    targetMl: 120, usableCapacityMl: 120,
  });
});

test('fractional amount immediately above capacity is rejected', () => {
  assert.throws(
    () => validateTarget({ targetMl: 120.01, usableCapacityMl: 120 }),
    error => error instanceof DomainError && error.message.includes('exceeds'),
  );
});

test('fractional target below capacity is accepted without rounding', () => {
  assert.deepEqual(validateTarget({ targetMl: 120.5, usableCapacityMl: 150 }), {
    targetMl: 120.5, usableCapacityMl: 150,
  });
});

for (const invalid of [0, -0.1, -1, NaN, Infinity, '120', null, undefined]) {
  test(`target ${String(invalid)} is rejected`, () => {
    assert.throws(
      () => validateTarget({ targetMl: invalid, usableCapacityMl: 150 }),
      /Target must be a finite number greater than zero/,
    );
  });
}

for (const invalid of [0, -1, Infinity, '150', null]) {
  test(`capacity ${String(invalid)} is rejected`, () => {
    assert.throws(
      () => validateTarget({ targetMl: 120, usableCapacityMl: invalid }),
      /Usable capacity must be a finite number greater than zero/,
    );
  });
}

test('missing or array input is rejected as malformed', () => {
  assert.throws(() => validateTarget(null), DomainError);
  assert.throws(() => validateTarget([]), DomainError);
});

test('one committed Pending record preserves exact volumes and run identity', () => {
  withDatabase(({ history, store }) => {
    const record = history.create({ targetMl: 120, usableCapacityMl: 120 });
    assert.equal(record.status, 'Pending');
    assert.equal(record.targetMl, 120);
    assert.equal(record.usableCapacityMl, 120);
    assert.match(record.runId, /^[0-9a-f-]{36}$/);
    assert.deepEqual(store.get(record.runId), record);
  });
});

test('an invalid over-capacity request writes no record', () => {
  withDatabase(({ history }) => {
    assert.throws(
      () => history.create({ targetMl: 120.01, usableCapacityMl: 120 }),
      DomainError,
    );
    assert.deepEqual(history.list(), []);
  });
});

test('only one pending record is allowed and cancellation is idempotent', () => {
  withDatabase(({ history }) => {
    const first = history.create({ targetMl: 60, usableCapacityMl: 120 });
    assert.throws(
      () => history.create({ targetMl: 20, usableCapacityMl: 120 }),
      error => error instanceof DomainError && error.status === 409,
    );
    assert.equal(history.cancel(first.runId).status, 'Cancelled');
    assert.equal(history.cancel(first.runId).status, 'Cancelled');
    assert.equal(history.list().length, 1);
  });
});

test('cancelled record remains cancelled after file reopen', () => {
  withDatabase(({ history, reopen }) => {
    const created = history.create({ targetMl: 60, usableCapacityMl: 120 });
    history.cancel(created.runId);
    const opened = reopen();
    assert.equal(opened.list()[0].runId, created.runId);
    assert.equal(opened.list()[0].status, 'Cancelled');
    assert.equal(opened.list()[0].reason, 'operator_cancelled');
  });
});

test('restart recovery fails pending run under same id exactly once', () => {
  withDatabase(({ history, reopen }) => {
    const created = history.create({ targetMl: 120.5, usableCapacityMl: 150 });
    const opened = reopen();
    assert.equal(opened.recover(), 1);
    assert.equal(opened.recover(), 0);
    assert.deepEqual(opened.list()[0], {
      ...created, status: 'Failed', reason: 'interrupted',
      updatedAt: opened.list()[0].updatedAt,
    });
    assert.equal(opened.list().length, 1);
    assert.throws(
      () => opened.cancel(created.runId),
      error => error instanceof DomainError && error.status === 409,
    );
  });
});

test('unknown id cannot be cancelled and existing row is unchanged', () => {
  withDatabase(({ history }) => {
    assert.throws(
      () => history.cancel('00000000-0000-4000-8000-000000000000'),
      error => error instanceof DomainError && error.status === 404,
    );
    assert.deepEqual(history.list(), []);
  });
});

test('SQL write failure is rolled back without false success', () => {
  withDatabase(({ history, store }) => {
    store.db.exec('PRAGMA query_only = ON');
    assert.throws(() => history.create({ targetMl: 60, usableCapacityMl: 100 }));
    assert.deepEqual(history.list(), []);
    store.db.exec('PRAGMA query_only = OFF');
    assert.equal(history.create({ targetMl: 60, usableCapacityMl: 100 }).status, 'Pending');
  });
});

test('time estimate follows observable volume and flow rate', () => {
  assert.equal(calculateDispenseTime(120, 60), 2);
  assert.equal(calculateDispenseTime(150, 50), 3);
  assert.equal(calculateDispenseTime(37.5, 25), 1.5);
  assert.throws(() => calculateDispenseTime(0, 60), RangeError);
  assert.throws(() => calculateDispenseTime(120, Infinity), RangeError);
});
