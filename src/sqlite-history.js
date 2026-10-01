import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DomainError } from './run-history.js';

function record(row) {
  return {
    runId: row.run_id,
    recordSequence: row.sequence,
    targetMl: row.target_ml,
    usableCapacityMl: row.capacity_ml,
    status: row.status,
    reason: row.reason,
    measurementKind: 'Unavailable',
    volumeMl: null,
    manualAdditions: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SqliteHistory {
  constructor(filename) {
    mkdirSync(dirname(filename), { recursive: true });
    this.db = new DatabaseSync(filename);
    this.db.exec('PRAGMA busy_timeout = 3000; PRAGMA journal_mode = WAL; PRAGMA synchronous = FULL;');
    const version = this.db.prepare('PRAGMA user_version').get().user_version;
    if (version !== 0 && version !== 1) {
      this.db.close();
      throw new Error(`Unsupported history schema version ${version}`);
    }
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        sequence INTEGER PRIMARY KEY AUTOINCREMENT,
        run_id TEXT NOT NULL UNIQUE,
        target_ml REAL NOT NULL CHECK(target_ml > 0),
        capacity_ml REAL NOT NULL CHECK(capacity_ml >= target_ml),
        status TEXT NOT NULL CHECK(status IN ('Pending', 'Cancelled', 'Failed')),
        reason TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        CHECK((status = 'Pending' AND reason IS NULL)
          OR (status = 'Cancelled' AND reason = 'operator_cancelled')
          OR (status = 'Failed' AND reason = 'interrupted'))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS one_pending_run ON runs(status) WHERE status = 'Pending';
      PRAGMA user_version = 1;
    `);
  }

  transaction(action) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = action();
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  get(runId) {
    const row = this.db.prepare('SELECT * FROM runs WHERE run_id = ?').get(runId);
    return row ? record(row) : null;
  }

  list() {
    return this.db.prepare('SELECT * FROM runs ORDER BY sequence DESC').all().map(record);
  }

  createPending({ runId, targetMl, usableCapacityMl }) {
    this.transaction(() => {
      if (this.db.prepare("SELECT 1 FROM runs WHERE status = 'Pending'").get()) {
        throw new DomainError('Cancel the pending record before creating another.', 409);
      }
      const now = new Date().toISOString();
      this.db.prepare(`INSERT INTO runs(run_id, target_ml, capacity_ml, status, created_at, updated_at)
        VALUES (?, ?, ?, 'Pending', ?, ?)`).run(runId, targetMl, usableCapacityMl, now, now);
    });
    // Read the committed row back; never echo the request as evidence of persistence.
    return this.get(runId);
  }

  trim() {
    this.db.exec(`DELETE FROM runs WHERE status <> 'Pending' AND sequence NOT IN
      (SELECT sequence FROM runs WHERE status <> 'Pending' ORDER BY sequence DESC LIMIT 50)`);
  }

  cancel(runId) {
    this.transaction(() => {
      const current = this.get(runId);
      if (!current) throw new DomainError('Run record was not found.', 404);
      if (current.status === 'Cancelled') return; // Retry is idempotent.
      if (current.status !== 'Pending') throw new DomainError('This run already has a terminal outcome.', 409);
      this.db.prepare("UPDATE runs SET status = 'Cancelled', reason = 'operator_cancelled', updated_at = ? WHERE run_id = ?")
        .run(new Date().toISOString(), runId);
      this.trim();
    });
    return this.get(runId);
  }

  recoverPending() {
    return this.transaction(() => {
      const result = this.db.prepare("UPDATE runs SET status = 'Failed', reason = 'interrupted', updated_at = ? WHERE status = 'Pending'")
        .run(new Date().toISOString());
      this.trim();
      return Number(result.changes);
    });
  }

  close() {
    this.db.close();
  }
}
