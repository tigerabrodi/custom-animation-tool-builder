import { useCallback } from 'react'
import * as THREE from 'three'
import type { BoneName, BoneTransform, InterpolationMode, Keyframe } from '../../types'
import { useAnimationLoop, type Pose } from '../../hooks/useAnimationLoop'

interface AnimationControllerProps {
  bones: Map<BoneName, THREE.Bone> | null
  isPlaying: boolean
  currentTime: number
  keyframes: Keyframe[]
  interpolation: InterpolationMode
  duration: number
  tick: (deltaTime: number, duration: number) => void
}

/**
 * Component that runs the animation loop inside the R3F Canvas.
 * Applies interpolated poses to the skeleton bones.
 */
export function AnimationController({
  bones,
  isPlaying,
  currentTime,
  keyframes,
  interpolation,
  duration,
  tick,
}: AnimationControllerProps) {
  // Apply pose to THREE.js bones
  const applyPose = useCallback(
    (pose: Pose) => {
      if (!bones) return

      Object.entries(pose).forEach(([boneName, transform]) => {
        const bone = bones.get(boneName as BoneName)
        if (bone && transform) {
          const t = transform as BoneTransform
          bone.position.set(t.position.x, t.position.y, t.position.z)
          bone.quaternion.set(t.rotation.x, t.rotation.y, t.rotation.z, t.rotation.w)
          bone.scale.set(t.scale.x, t.scale.y, t.scale.z)
        }
      })
    },
    [bones]
  )

  // Use the animation loop hook
  useAnimationLoop({
    isPlaying,
    tick,
    currentTime,
    keyframes,
    interpolation,
    duration,
    applyPose,
  })

  // This component doesn't render anything visible
  return null
}
