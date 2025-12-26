import React from 'react'
import type { LoopMode } from '../../types'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'

interface PlaybackControlsProps {
  isPlaying: boolean
  currentTime: number
  speedMultiplier: number
  loopMode: LoopMode
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSpeedChange: (speed: number) => void
  onLoopModeChange: (mode: LoopMode) => void
}

const SPEED_OPTIONS = [
  { value: '0.1', label: '0.1x' },
  { value: '0.25', label: '0.25x' },
  { value: '0.5', label: '0.5x' },
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '4', label: '4x' },
]

const LOOP_MODE_OPTIONS: { value: LoopMode; label: string }[] = [
  { value: 'ONCE', label: 'Once' },
  { value: 'LOOP', label: 'Loop' },
  { value: 'PING_PONG', label: 'Ping-pong' },
]

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  currentTime,
  speedMultiplier,
  loopMode,
  onPlay,
  onPause,
  onStop,
  onSpeedChange,
  onLoopModeChange,
}) => {
  const handlePlayPauseClick = () => {
    if (isPlaying) {
      onPause()
    } else {
      onPlay()
    }
  }

  const handleSpeedChange = (value: string) => {
    onSpeedChange(parseFloat(value))
  }

  const handleLoopModeChange = (value: string) => {
    onLoopModeChange(value as LoopMode)
  }

  const formatTime = (time: number): string => {
    return `${time.toFixed(2)}s`
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-800 border-t border-gray-700">
      {/* Play/Pause Button */}
      <Button
        onClick={handlePlayPauseClick}
        variant="primary"
        size="sm"
        className="min-w-[70px]"
      >
        {isPlaying ? 'Pause' : 'Play'}
      </Button>

      {/* Stop Button */}
      <Button onClick={onStop} variant="secondary" size="sm">
        Stop
      </Button>

      {/* Current Time Display */}
      <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-md min-w-[80px]">
        <span className="text-sm font-mono text-gray-100">
          {formatTime(currentTime)}
        </span>
      </div>

      {/* Speed Selector */}
      <Select
        value={speedMultiplier.toString()}
        onChange={handleSpeedChange}
        options={SPEED_OPTIONS}
        className="w-24"
      />

      {/* Loop Mode Selector */}
      <Select
        value={loopMode}
        onChange={handleLoopModeChange}
        options={LOOP_MODE_OPTIONS}
        className="w-32"
      />
    </div>
  )
}

export default PlaybackControls
