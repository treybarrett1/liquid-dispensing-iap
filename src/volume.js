/**
 * Ensure a measurement is a finite number greater than zero.
 *
 * @param {number} value measurement to validate
 * @param {string} label human-readable measurement name
 */
export function requirePositiveMeasurement(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be a finite number greater than zero.`);
  }
}
