import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SqliteHistory } from '../src/sqlite-history.js';
import { RunHistory } from '../src/run-history.js';

describe('run history with a real SQLite file', () => {
  let directory, filename, store, history;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), 'iap-history-'));
    filename = join(directory, 'history.sqlite');
    store = new SqliteHistory(filename);
    history = new RunHistory(store);
  });
  afterEach(() => { store.close(); rmSync(directory, { recursive: true, force: true }); });

  it.each([0, -1, NaN, Infinity, '120', null])('rejects invalid target %s without inserting', targetMl => {
    expect(() => history.create({ targetMl, usableCapacityMl: 150 })).toThrow();
    expect(history.list()).toEqual([]);
  });

  it('rejects over-capacity and invalid capacity without inserting', () => {
    expect(() => history.create({ targetMl: 151, usableCapacityMl: 150 })).toThrow('capacity');
    expect(() => history.create({ targetMl: 120, usableCapacityMl: '150' })).toThrow('finite');
    expect(history.list()).toEqual([]);
  });

  it('reopens a file and recovers the same pending identity exactly once', () => {
    const pending = history.create({ targetMl: 120.5, usableCapacityMl: 150 });
    expect(pending.status).toBe('Pending');
    store.close();
    store = new SqliteHistory(filename);
    history = new RunHistory(store);
    expect(history.list()[0].runId).toBe(pending.runId);
    expect(history.recover()).toBe(1);
    expect(history.recover()).toBe(0);
    expect(history.list()).toEqual([expect.objectContaining({ runId: pending.runId, targetMl: 120.5,
      status: 'Failed', reason: 'interrupted', volumeMl: null, measurementKind: 'Unavailable' })]);
  });

  it('allows one pending record, cancels idempotently, and rejects terminal overwrites', () => {
    const first = history.create({ targetMl: 120, usableCapacityMl: 150 });
    expect(() => history.create({ targetMl: 60, usableCapacityMl: 100 })).toThrow('pending');
    expect(history.cancel(first.runId).status).toBe('Cancelled');
    expect(history.cancel(first.runId).status).toBe('Cancelled');
    const second = history.create({ targetMl: 60, usableCapacityMl: 100 });
    history.recover();
    expect(() => history.cancel(second.runId)).toThrow('terminal');
    expect(history.list()).toHaveLength(2);
  });

  it('keeps the latest 50 terminal outcomes plus a pending record', () => {
    const ids = [];
    for (let i = 0; i < 52; i++) {
      const created = history.create({ targetMl: i + 1, usableCapacityMl: 100 });
      ids.push(created.runId);
      history.cancel(created.runId);
    }
    const pending = history.create({ targetMl: 75, usableCapacityMl: 100 });
    expect(history.list()).toHaveLength(51);
    expect(store.get(ids[0])).toBeNull();
    expect(store.get(ids[1])).toBeNull();
    expect(store.get(ids[2]).status).toBe('Cancelled');
    expect(store.get(pending.runId).status).toBe('Pending');
    history.recover();
    expect(history.list()).toHaveLength(50);
    expect(store.get(ids[2])).toBeNull();
    expect(store.get(pending.runId).status).toBe('Failed');
  });

  it('rolls back a failed write instead of returning success', () => {
    store.db.exec('PRAGMA query_only = ON');
    expect(() => history.create({ targetMl: 120, usableCapacityMl: 150 })).toThrow();
    expect(history.list()).toEqual([]);
    store.db.exec('PRAGMA query_only = OFF');
    expect(history.create({ targetMl: 120, usableCapacityMl: 150 }).status).toBe('Pending');
  });
});
