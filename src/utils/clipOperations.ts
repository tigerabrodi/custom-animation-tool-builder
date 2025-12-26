import type { Keyframe } from '../types'

/**
 * Scale all keyframe times by a factor.
 * Example: scaleFactor=2 doubles the duration, scaleFactor=0.5 halves it.
 * @param keyframes - Array of keyframes to scale
 * @param scaleFactor - Factor to multiply times by (must be > 0)
 * @returns New array of keyframes with scaled times
 */
export function scaleKeyframeTimes(
  keyframes: Keyframe[],
  scaleFactor: number
): Keyframe[] {
  // Validate scale factor
  if (scaleFactor <= 0) {
    return keyframes
  }

  // Create new array with scaled times
  const scaledKeyframes = keyframes.map((kf) => ({
    ...kf,
    time: kf.time * scaleFactor,
  }))

  // Sort by time ascending
  return scaledKeyframes.sort((a, b) => a.time - b.time)
}

/**
 * Offset all keyframe times by a delta.
 * Clamps to minimum of 0 (no negative times).
 * @param keyframes - Array of keyframes to offset
 * @param offsetSeconds - Seconds to add (can be negative)
 * @returns New array of keyframes with offset times
 */
export function offsetKeyframeTimes(
  keyframes: Keyframe[],
  offsetSeconds: number
): Keyframe[] {
  // Create new array with offset times, clamped to 0
  const offsetKeyframes = keyframes.map((kf) => ({
    ...kf,
    time: Math.max(0, kf.time + offsetSeconds),
  }))

  // Sort by time ascending
  return offsetKeyframes.sort((a, b) => a.time - b.time)
}

/**
 * Reverse the order of keyframes in time.
 * First becomes last, last becomes first.
 * @param keyframes - Array of keyframes to reverse
 * @returns New array with reversed timing
 */
export function reverseKeyframeTimes(keyframes: Keyframe[]): Keyframe[] {
  if (keyframes.length === 0) {
    return []
  }

  // Find the duration (max time)
  const duration = calculateDuration(keyframes)

  // Reverse times: newTime = duration - oldTime
  const reversedKeyframes = keyframes.map((kf) => ({
    ...kf,
    time: duration - kf.time,
  }))

  // Sort by time ascending
  return reversedKeyframes.sort((a, b) => a.time - b.time)
}

/**
 * Calculate the total duration from keyframes.
 * @param keyframes - Array of keyframes
 * @returns Duration in seconds (time of last keyframe, or 0 if empty)
 */
export function calculateDuration(keyframes: Keyframe[]): number {
  if (keyframes.length === 0) {
    return 0
  }

  return Math.max(...keyframes.map((kf) => kf.time))
}
