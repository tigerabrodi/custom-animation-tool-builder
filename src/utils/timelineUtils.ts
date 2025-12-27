/**
 * Timeline utility functions for pixel/time conversions, snapping, and calculations.
 */

/**
 * Snaps time to the nearest grid interval.
 * Returns the original time if interval is null or <= 0.
 *
 * @param time - The time value in seconds
 * @param interval - The snap interval in seconds, or null for no snapping
 * @returns The snapped time value
 */
export function snapToGrid(time: number, interval: number | null): number {
  if (interval === null || interval <= 0) {
    return time
  }
  return Math.round(time / interval) * interval
}

/**
 * Converts pixel position to time.
 *
 * @param pixels - The pixel position
 * @param pixelsPerSecond - The zoom level (pixels per second)
 * @returns Time in seconds
 */
export function pixelsToTime(pixels: number, pixelsPerSecond: number): number {
  if (pixelsPerSecond <= 0) {
    return 0
  }
  return pixels / pixelsPerSecond
}

/**
 * Converts time to pixel position.
 *
 * @param time - Time in seconds
 * @param pixelsPerSecond - The zoom level (pixels per second)
 * @returns Pixel position
 */
export function timeToPixels(time: number, pixelsPerSecond: number): number {
  return time * pixelsPerSecond
}

/**
 * Gets appropriate tick intervals based on zoom level.
 * Major ticks are labeled, minor ticks are smaller markers.
 *
 * @param pixelsPerSecond - The zoom level (pixels per second)
 * @returns Object with major and minor tick intervals in seconds
 */
export function getTickInterval(pixelsPerSecond: number): {
  major: number
  minor: number
} {
  // Target approximately 100-200 pixels between major ticks
  // and 20-40 pixels between minor ticks
  const targetMajorPixels = 150
  const targetMajorSeconds = targetMajorPixels / pixelsPerSecond

  // Snap to nice intervals: 0.1, 0.25, 0.5, 1, 2, 5, 10, etc.
  const niceIntervals = [0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60]

  let major = niceIntervals[niceIntervals.length - 1]
  for (const interval of niceIntervals) {
    if (interval >= targetMajorSeconds) {
      major = interval
      break
    }
  }

  // Minor ticks: subdivide major into 2, 4, 5, or 10 parts
  let minor: number
  if (major >= 10) {
    minor = major / 10
  } else if (major >= 1) {
    minor = major / 5
  } else if (major >= 0.5) {
    minor = major / 5
  } else {
    minor = major / 5
  }

  return { major, minor }
}

/**
 * Calculates the visible time range given scroll position and container width.
 *
 * @param scrollLeft - The horizontal scroll position in pixels
 * @param containerWidth - The width of the visible container in pixels
 * @param pixelsPerSecond - The zoom level (pixels per second)
 * @returns Object with start and end times in seconds
 */
export function getVisibleTimeRange(
  scrollLeft: number,
  containerWidth: number,
  pixelsPerSecond: number
): { start: number; end: number } {
  if (pixelsPerSecond <= 0) {
    return { start: 0, end: 0 }
  }

  const start = scrollLeft / pixelsPerSecond
  const end = (scrollLeft + containerWidth) / pixelsPerSecond

  return { start, end }
}

/**
 * Clamps a value between min and max bounds.
 *
 * @param value - The value to clamp
 * @param min - Minimum bound
 * @param max - Maximum bound
 * @returns The clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Formats time in seconds to a display string (e.g., "1.25s" or "1:30.5").
 *
 * @param time - Time in seconds
 * @param showMinutes - Whether to show minutes for times >= 60s
 * @returns Formatted time string
 */
export function formatTime(time: number, showMinutes = true): string {
  if (showMinutes && time >= 60) {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes}:${seconds.toFixed(1).padStart(4, '0')}`
  }
  return `${time.toFixed(2)}s`
}
