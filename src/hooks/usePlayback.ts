import { useCallback, useState } from 'react'
import type { LoopMode } from '../types'

export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  speedMultiplier: number
  loopMode: LoopMode
  direction: 1 | -1
}

export const SPEED_PRESETS = [0.1, 0.25, 0.5, 1, 2, 4] as const

export interface UsePlaybackReturn extends PlaybackState {
  play: () => void
  pause: () => void
  stop: () => void
  setCurrentTime: (time: number) => void
  setSpeedMultiplier: (speed: number) => void
  setLoopMode: (mode: LoopMode) => void
  tick: (deltaTime: number, duration: number) => void
}

export function usePlayback(): UsePlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTimeState] = useState(0)
  const [speedMultiplier, setSpeedMultiplierState] = useState(1)
  const [loopMode, setLoopModeState] = useState<LoopMode>('LOOP')
  const [direction, setDirection] = useState<1 | -1>(1)

  const play = useCallback(() => {
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  const stop = useCallback(() => {
    setIsPlaying(false)
    setCurrentTimeState(0)
    setDirection(1)
  }, [])

  const setCurrentTime = useCallback((time: number) => {
    setCurrentTimeState(Math.max(0, time))
  }, [])

  const setSpeedMultiplier = useCallback((speed: number) => {
    // Clamp speed between 0.1 and 4
    const clampedSpeed = Math.max(0.1, Math.min(4, speed))
    setSpeedMultiplierState(clampedSpeed)
  }, [])

  const setLoopMode = useCallback((mode: LoopMode) => {
    setLoopModeState(mode)
  }, [])

  const tick = useCallback(
    (deltaTime: number, duration: number) => {
      if (!isPlaying || duration <= 0) {
        return
      }

      // Calculate the time delta based on speed and direction
      const timeDelta = deltaTime * speedMultiplier * direction
      const newTime = currentTime + timeDelta

      switch (loopMode) {
        case 'ONCE':
          // Clamp at duration or 0, stop playing when reaching the end
          if (direction === 1 && newTime >= duration) {
            setCurrentTimeState(duration)
            setIsPlaying(false)
            return
          } else if (direction === -1 && newTime <= 0) {
            setCurrentTimeState(0)
            setIsPlaying(false)
            return
          }
          setCurrentTimeState(newTime)
          return

        case 'LOOP':
          // Wrap time using modulo
          if (newTime >= duration) {
            setCurrentTimeState(newTime % duration)
          } else if (newTime < 0) {
            // Handle negative wrap-around
            setCurrentTimeState(duration + (newTime % duration))
          } else {
            setCurrentTimeState(newTime)
          }
          return

        case 'PING_PONG':
          // Reverse direction at boundaries
          if (newTime >= duration) {
            setDirection(-1)
            // Reflect the overshoot
            setCurrentTimeState(duration - (newTime - duration))
          } else if (newTime <= 0) {
            setDirection(1)
            // Reflect the undershoot
            setCurrentTimeState(Math.abs(newTime))
          } else {
            setCurrentTimeState(newTime)
          }
          return

        default:
          setCurrentTimeState(newTime)
      }
    },
    [isPlaying, speedMultiplier, direction, loopMode, currentTime]
  )

  return {
    // State
    isPlaying,
    currentTime,
    speedMultiplier,
    loopMode,
    direction,

    // Actions
    play,
    pause,
    stop,
    setCurrentTime,
    setSpeedMultiplier,
    setLoopMode,
    tick,
  }
}

export default usePlayback
