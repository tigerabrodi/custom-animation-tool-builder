import React, { useMemo } from 'react'

export interface TimeRulerProps {
  duration: number
  pixelsPerSecond: number
  height?: number
}

interface TickMark {
  time: number
  isMajor: boolean
  label?: string
}

export const TimeRuler: React.FC<TimeRulerProps> = ({
  duration,
  pixelsPerSecond,
  height = 24,
}) => {
  // Calculate tick interval based on zoom level
  const tickConfig = useMemo(() => {
    // Determine appropriate intervals based on pixels per second
    // Goal: major ticks should be ~80-150px apart
    if (pixelsPerSecond >= 200) {
      return { major: 0.5, minor: 0.25 }
    } else if (pixelsPerSecond >= 100) {
      return { major: 1, minor: 0.5 }
    } else if (pixelsPerSecond >= 50) {
      return { major: 2, minor: 1 }
    } else {
      return { major: 5, minor: 1 }
    }
  }, [pixelsPerSecond])

  // Generate tick marks
  const ticks = useMemo(() => {
    const result: TickMark[] = []

    // Handle edge case: duration = 0
    if (duration <= 0) {
      return [{ time: 0, isMajor: true, label: '0.0s' }]
    }

    const { major, minor } = tickConfig

    // Generate minor ticks
    for (let time = 0; time <= duration; time += minor) {
      const roundedTime = Math.round(time * 1000) / 1000 // Avoid floating point issues
      const isMajor =
        Math.abs(roundedTime % major) < 0.001 ||
        Math.abs((roundedTime % major) - major) < 0.001

      result.push({
        time: roundedTime,
        isMajor,
        label: isMajor ? `${roundedTime.toFixed(1)}s` : undefined,
      })
    }

    return result
  }, [duration, tickConfig])

  // Calculate total width
  const totalWidth = Math.max(duration * pixelsPerSecond, 100)

  return (
    <div
      className="relative bg-gray-800 border-b border-gray-700 select-none pointer-events-none"
      style={{ height, minWidth: totalWidth }}
    >
      {ticks.map((tick, index) => {
        const left = tick.time * pixelsPerSecond
        const tickHeight = tick.isMajor ? 10 : 6

        return (
          <div
            key={index}
            className="absolute bottom-0"
            style={{ transform: `translateX(${left}px)` }}
          >
            {/* Tick line */}
            <div
              className={`w-px ${tick.isMajor ? 'bg-gray-400' : 'bg-gray-600'}`}
              style={{ height: tickHeight }}
            />

            {/* Label for major ticks */}
            {tick.label && (
              <div
                className="absolute text-xs text-gray-400 whitespace-nowrap"
                style={{
                  bottom: tickHeight + 2,
                  left: 2,
                }}
              >
                {tick.label}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default TimeRuler
