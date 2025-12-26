/**
 * Snaps a time value to the nearest grid position.
 *
 * @param time - The time value to snap
 * @param gridSize - The size of each grid cell
 * @returns The snapped time value
 */
export function snapToGrid(time: number, gridSize: number): number {
  if (gridSize <= 0) {
    return time;
  }
  return Math.round(time / gridSize) * gridSize;
}

/**
 * Scales all keyframe times proportionally to fit a target duration.
 * Preserves the relative timing of keyframes.
 *
 * @param keyframes - Array of objects with a time property
 * @param targetDuration - The desired total duration
 * @returns New array with scaled time values
 */
export function scaleKeyframeTimes<T extends { time: number }>(
  keyframes: T[],
  targetDuration: number
): T[] {
  if (keyframes.length === 0) {
    return [];
  }

  const currentDuration = getClipDuration(keyframes);

  if (currentDuration === 0) {
    // All keyframes at time 0, return as-is
    return keyframes.map((kf) => ({ ...kf }));
  }

  const scale = targetDuration / currentDuration;

  return keyframes.map((kf) => ({
    ...kf,
    time: kf.time * scale,
  }));
}

/**
 * Offsets all keyframe times by a fixed amount.
 *
 * @param keyframes - Array of objects with a time property
 * @param offset - The time offset to apply (can be negative)
 * @returns New array with offset time values
 */
export function offsetKeyframeTimes<T extends { time: number }>(
  keyframes: T[],
  offset: number
): T[] {
  return keyframes.map((kf) => ({
    ...kf,
    time: kf.time + offset,
  }));
}

/**
 * Gets the total duration of a clip based on keyframe times.
 * Duration is the maximum time value among all keyframes.
 *
 * @param keyframes - Array of objects with a time property
 * @returns The duration (maximum time value), or 0 if no keyframes
 */
export function getClipDuration<T extends { time: number }>(keyframes: T[]): number {
  if (keyframes.length === 0) {
    return 0;
  }

  return Math.max(...keyframes.map((kf) => kf.time));
}
