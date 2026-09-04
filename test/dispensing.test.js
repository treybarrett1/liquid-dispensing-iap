import { describe, expect, it } from 'vitest';

import { calculateDispenseTime } from '../src/dispensing.js';

describe('calculateDispenseTime', () => {
  it('calculates dispensing time in minutes', () => {
    expect(calculateDispenseTime(500, 100)).toBe(5);
  });

  it('supports decimal measurements', () => {
    expect(calculateDispenseTime(37.5, 15)).toBe(2.5);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, '500'])(
    'rejects an invalid volume: %s',
    (volume) => {
      expect(() => calculateDispenseTime(volume, 100)).toThrow(
        'Volume must be a finite number greater than zero.',
      );
    },
  );

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY, '100'])(
    'rejects an invalid flow rate: %s',
    (flowRate) => {
      expect(() => calculateDispenseTime(500, flowRate)).toThrow(
        'Flow rate must be a finite number greater than zero.',
      );
    },
  );
});
