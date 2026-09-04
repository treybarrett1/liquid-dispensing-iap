import { requirePositiveMeasurement } from './volume.js';

/**
 * Calculate how many minutes it takes to dispense a volume of liquid.
 *
 * @param {number} volumeMl volume to dispense, in milliliters
 * @param {number} flowRateMlPerMinute flow rate, in milliliters per minute
 * @returns {number} dispensing time in minutes
 */
export function calculateDispenseTime(volumeMl, flowRateMlPerMinute) {
  requirePositiveMeasurement(volumeMl, 'Volume');
  requirePositiveMeasurement(flowRateMlPerMinute, 'Flow rate');

  return volumeMl / flowRateMlPerMinute;
}
