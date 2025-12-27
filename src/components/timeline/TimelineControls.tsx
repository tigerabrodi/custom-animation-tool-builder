import React from 'react'

export interface TimelineControlsProps {
  /** Current zoom level in pixels per second */
  zoom: number
  /** Current snap interval in seconds, or null for no snapping */
  snapInterval: number | null
  /** Callback to zoom in */
  onZoomIn: () => void
  /** Callback to zoom out */
  onZoomOut: () => void
  /** Callback when snap interval changes */
  onSnapChange: (interval: number | null) => void
  /** Optional callback for fit-to-view */
  onFitToView?: () => void
}

/** Available snap interval options */
const SNAP_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Off', value: null },
  { label: '0.05s', value: 0.05 },
  { label: '0.1s', value: 0.1 },
  { label: '0.25s', value: 0.25 },
  { label: '0.5s', value: 0.5 },
  { label: '1.0s', value: 1.0 },
]

/**
 * Converts zoom level (pixels per second) to a percentage for display.
 * Uses 100 px/s as the baseline (100%).
 */
function zoomToPercent(zoom: number): number {
  return Math.round((zoom / 100) * 100)
}

/**
 * Timeline controls component with zoom and snap options.
 */
export const TimelineControls: React.FC<TimelineControlsProps> = ({
  zoom,
  snapInterval,
  onZoomIn,
  onZoomOut,
  onSnapChange,
  onFitToView,
}) => {
  const handleSnapChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'null') {
      onSnapChange(null)
    } else {
      onSnapChange(parseFloat(value))
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomOut}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-200 transition-colors"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>

        <span className="w-12 text-center text-sm text-gray-300 tabular-nums">
          {zoomToPercent(zoom)}%
        </span>

        <button
          onClick={onZoomIn}
          className="w-7 h-7 flex items-center justify-center rounded bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-gray-200 transition-colors"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-600" />

      {/* Snap Controls */}
      <div className="flex items-center gap-2">
        <label htmlFor="snap-select" className="text-sm text-gray-400">
          Snap:
        </label>
        <select
          id="snap-select"
          value={snapInterval === null ? 'null' : snapInterval.toString()}
          onChange={handleSnapChange}
          className="h-7 px-2 rounded bg-gray-700 text-sm text-gray-200 border border-gray-600 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {SNAP_OPTIONS.map((option) => (
            <option
              key={option.label}
              value={option.value === null ? 'null' : option.value.toString()}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Fit to View Button (Optional) */}
      {onFitToView && (
        <>
          {/* Divider */}
          <div className="w-px h-5 bg-gray-600" />

          <button
            onClick={onFitToView}
            className="h-7 px-3 flex items-center gap-1 rounded bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-sm text-gray-200 transition-colors"
            title="Fit timeline to view"
            aria-label="Fit to view"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5"
              />
            </svg>
            <span>Fit</span>
          </button>
        </>
      )}
    </div>
  )
}

export default TimelineControls
