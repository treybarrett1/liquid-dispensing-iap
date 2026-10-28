import { randomUUID } from 'node:crypto';

export class DomainError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function requirePositiveFinite(label, value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new DomainError(`${label} must be a finite number greater than zero.`);
  }
}

export function validateTarget(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new DomainError('Enter a target and usable bottle capacity.');
  }
  const { targetMl, usableCapacityMl } = input;
  requirePositiveFinite('Target', targetMl);
  requirePositiveFinite('Usable capacity', usableCapacityMl);
  if (targetMl > usableCapacityMl) {
    throw new DomainError('Target exceeds usable bottle capacity.');
  }
  return { targetMl, usableCapacityMl };
}

// Developer record lifecycle only. No sensor readiness or pump authorization.
export class RunHistory {
  constructor(store) {
    this.store = store;
  }

  create(input) {
    const values = validateTarget(input);
    return this.store.createPending({ runId: randomUUID(), ...values });
  }

  cancel(runId) {
    return this.store.cancel(runId);
  }

  list() {
    return this.store.list();
  }

  recover() {
    return this.store.recoverPending();
  }
}
