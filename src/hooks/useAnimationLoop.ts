import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { BoneName, BoneTransform, InterpolationMode, Keyframe } from '../types'
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

  // Log once every 60 frames to avoid spam
  const frameCountRef = useRef(0)
  const poseAppliedCountRef = useRef(0)

  useFrame((_, delta) => {
    frameCountRef.current++
    const shouldLog = frameCountRef.current % 60 === 0

    // When playing, advance time via tick
    if (isPlaying) {
      if (shouldLog) {
        console.log('[useAnimationLoop] tick called - isPlaying:', isPlaying, 'duration:', duration, 'keyframes:', keyframes.length)
      }
      tick(delta, duration)
    }

    // Compute and apply pose if time has changed and we have keyframes
    if (keyframes.length > 0 && currentTime !== lastAppliedTimeRef.current) {
      poseAppliedCountRef.current++
      const pose = interpolatePoseAtTime(keyframes, currentTime, interpolation)

      // Log first few pose applications and then every 60
      if (poseAppliedCountRef.current <= 3 || shouldLog) {
        console.log('[useAnimationLoop] APPLYING POSE #' + poseAppliedCountRef.current, {
          currentTime: currentTime.toFixed(4),
          keyframeCount: keyframes.length,
          keyframeTimes: keyframes.map(kf => kf.time),
          poseExists: !!pose,
          // Log one bone's position to verify pose data
          sampleBone: pose ? Object.keys(pose)[0] : null,
          samplePosition: pose ? pose[Object.keys(pose)[0] as keyof typeof pose]?.position : null
        })
      }

      if (pose) {
        applyPose(pose)
      } else {
        console.log('[useAnimationLoop] ERROR: pose is NULL!')
      }
      lastAppliedTimeRef.current = currentTime
    }
  })
}

export default useAnimationLoop
