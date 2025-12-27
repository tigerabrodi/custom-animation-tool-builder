import { useState, useCallback, useEffect, useRef, type RefObject } from 'react'
import { timeToPixels } from '../utils/timelineUtils'

export interface UseTimelineScrollOptions {
  /** Reference to the scrollable container element */
  containerRef: RefObject<HTMLDivElement | null>
  /** Current playback time in seconds */
  currentTime: number
  /** Zoom level in pixels per second */
  pixelsPerSecond: number
  /** Whether to automatically scroll to keep the playhead visible during playback */
  followPlayhead?: boolean
}

export interface UseTimelineScrollReturn {
  /** Current horizontal scroll position in pixels */
  scrollLeft: number
  /** Scroll to show a specific time position */
  scrollTo: (time: number) => void
  /** Scroll to center the current playhead position */
  scrollToPlayhead: () => void
}

/**
 * Hook for managing horizontal scroll position in the timeline.
 * Supports auto-scrolling to keep the playhead visible during playback.
 */
export function useTimelineScroll(
  options: UseTimelineScrollOptions
): UseTimelineScrollReturn {
  const {
    containerRef,
    currentTime,
    pixelsPerSecond,
    followPlayhead = false,
  } = options

  const [scrollLeft, setScrollLeft] = useState(0)
  const lastScrollUpdateRef = useRef<number>(0)

  // Sync scroll state with the container's scroll position
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      setScrollLeft(container.scrollLeft)
    }

    container.addEventListener('scroll', handleScroll)
    // Initialize with current scroll position
    setScrollLeft(container.scrollLeft)

    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [containerRef])

  const scrollTo = useCallback(
    (time: number) => {
      const container = containerRef.current
      if (!container) return

      const pixelPosition = timeToPixels(time, pixelsPerSecond)
      const containerWidth = container.clientWidth

      // Center the time position in the view
      const targetScroll = pixelPosition - containerWidth / 2

      container.scrollTo({
        left: Math.max(0, targetScroll),
        behavior: 'smooth',
      })
    },
    [containerRef, pixelsPerSecond]
  )

  const scrollToPlayhead = useCallback(() => {
    scrollTo(currentTime)
  }, [scrollTo, currentTime])

  // Auto-scroll to follow playhead when enabled
  useEffect(() => {
    if (!followPlayhead) return

    const container = containerRef.current
    if (!container) return

    const playheadPixel = timeToPixels(currentTime, pixelsPerSecond)
    const containerWidth = container.clientWidth
    const currentScrollLeft = container.scrollLeft

    // Define visible region with some padding
    const padding = containerWidth * 0.15 // 15% padding on each side
    const visibleStart = currentScrollLeft + padding
    const visibleEnd = currentScrollLeft + containerWidth - padding

    // Check if playhead is outside the visible region
    if (playheadPixel < visibleStart || playheadPixel > visibleEnd) {
      // Throttle scroll updates to avoid jitter
      const now = Date.now()
      if (now - lastScrollUpdateRef.current > 100) {
        lastScrollUpdateRef.current = now

        // Scroll to center playhead
        const targetScroll = playheadPixel - containerWidth / 2
        container.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'auto', // Use instant scroll during playback for smoothness
        })
      }
    }
  }, [followPlayhead, currentTime, pixelsPerSecond, containerRef])

  return {
    scrollLeft,
    scrollTo,
    scrollToPlayhead,
  }
}

export default useTimelineScroll
