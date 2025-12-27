import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type {
  BoneName,
  BoneTransform,
  InterpolationMode,
  Keyframe,
} from '../types'
import { interpolatePoseAtTime } from '../utils/interpolation'

export type Pose = Record<BoneName, BoneTransform>

interface UseAnimationLoopParams {
  isPlaying: boolean
  tick: (deltaTime: number, duration: number) => void
  currentTime: number
  keyframes: Keyframe[]
  interpolation: InterpolationMode
  duration: number
  applyPose: (pose: Pose) => void
}

/**
 * Hook that connects playback to Three.js rendering loop.
 * IMPORTANT: This hook must be used inside a component within the R3F Canvas context.
 *
 * @param params - Animation loop parameters
 */
export function useAnimationLoop({
  isPlaying,
  tick,
  currentTime,
  keyframes,
  interpolation,
  duration,
  applyPose,
}: UseAnimationLoopParams): void {
  // Use ref to track last applied time to avoid redundant pose applications
  const lastAppliedTimeRef = useRef<number>(-1)

  useFrame((_, delta) => {
    // When playing, advance time via tick
    if (isPlaying) {
      tick(delta, duration)
    }

    // Compute and apply pose if time has changed and we have keyframes
    if (keyframes.length > 0 && currentTime !== lastAppliedTimeRef.current) {
      const pose = interpolatePoseAtTime(keyframes, currentTime, interpolation)

      if (pose) {
        applyPose(pose)
      }
      lastAppliedTimeRef.current = currentTime
    }
  })
}

export default useAnimationLoop
