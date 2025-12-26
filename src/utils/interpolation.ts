import type {
  BoneName,
  BoneTransform,
  InterpolationMode,
  Keyframe,
} from '../types'
import { quaternionSlerp, vector3Lerp } from './math'

export interface SurroundingKeyframes {
  prev: Keyframe
  next: Keyframe
  factor: number
}

/**
 * Finds the surrounding keyframes for a given time.
 * Returns the previous and next keyframes along with the interpolation factor.
 *
 * @param keyframes - Array of keyframes (must be sorted by time ascending)
 * @param time - The time to find surrounding keyframes for
 * @returns Object with prev/next keyframes and factor, or null if not enough keyframes
 */
export function findSurroundingKeyframes(
  keyframes: Keyframe[],
  time: number
): SurroundingKeyframes | null {
  // Need at least 2 keyframes to interpolate
  if (keyframes.length < 2) {
    return null
  }

  const firstKeyframe = keyframes[0]
  const lastKeyframe = keyframes[keyframes.length - 1]

  // Time is before the first keyframe
  if (time <= firstKeyframe.time) {
    return null
  }

  // Time is at or after the last keyframe
  if (time >= lastKeyframe.time) {
    return null
  }

  // Find the surrounding keyframes
  let prevIndex = 0
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (keyframes[i].time <= time && keyframes[i + 1].time > time) {
      prevIndex = i
      break
    }
  }

  const prev = keyframes[prevIndex]
  const next = keyframes[prevIndex + 1]

  // Calculate interpolation factor (0 to 1)
  const timeDelta = next.time - prev.time
  const factor = timeDelta > 0 ? (time - prev.time) / timeDelta : 0

  return { prev, next, factor }
}

/**
 * Interpolates a bone transform between two transforms.
 *
 * @param prev - Previous bone transform
 * @param next - Next bone transform
 * @param factor - Interpolation factor (0 = prev, 1 = next)
 * @param mode - Interpolation mode
 * @returns Interpolated bone transform
 */
function interpolateBoneTransform(
  prev: BoneTransform,
  next: BoneTransform,
  factor: number,
  mode: InterpolationMode
): BoneTransform {
  if (mode === 'STEP') {
    // STEP mode: return previous keyframe's pose exactly
    return {
      position: { ...prev.position },
      rotation: { ...prev.rotation },
      scale: { ...prev.scale },
    }
  }

  // LINEAR mode (and fallback for CUBICSPLINE until implemented)
  return {
    position: vector3Lerp(prev.position, next.position, factor),
    rotation: quaternionSlerp(prev.rotation, next.rotation, factor),
    scale: vector3Lerp(prev.scale, next.scale, factor),
  }
}

/**
 * Interpolates the pose at a given time based on keyframes.
 *
 * Edge cases:
 * - Empty keyframes: returns null
 * - Time before first keyframe: returns first keyframe's pose
 * - Time after last keyframe: returns last keyframe's pose
 * - Time exactly on a keyframe: returns that keyframe's pose
 *
 * @param keyframes - Array of keyframes (must be sorted by time ascending)
 * @param time - The time to interpolate at
 * @param mode - Interpolation mode
 * @returns Interpolated pose, or null if no keyframes
 */
export function interpolatePoseAtTime(
  keyframes: Keyframe[],
  time: number,
  mode: InterpolationMode
): Record<BoneName, BoneTransform> | null {
  // Empty keyframes
  if (keyframes.length === 0) {
    return null
  }

  const firstKeyframe = keyframes[0]
  const lastKeyframe = keyframes[keyframes.length - 1]

  // Time is at or before the first keyframe
  if (time <= firstKeyframe.time) {
    // Return a copy of the first keyframe's bones
    return { ...firstKeyframe.bones }
  }

  // Time is at or after the last keyframe
  if (time >= lastKeyframe.time) {
    // Return a copy of the last keyframe's bones
    return { ...lastKeyframe.bones }
  }

  // Find surrounding keyframes
  const surrounding = findSurroundingKeyframes(keyframes, time)

  if (!surrounding) {
    // Fallback (shouldn't happen if keyframes are properly sorted)
    return { ...firstKeyframe.bones }
  }

  const { prev, next, factor } = surrounding

  // Interpolate each bone
  const result: Partial<Record<BoneName, BoneTransform>> = {}

  // Get all bone names from both keyframes to handle potential mismatches
  const boneNames = new Set<BoneName>([
    ...(Object.keys(prev.bones) as BoneName[]),
    ...(Object.keys(next.bones) as BoneName[]),
  ])

  for (const boneName of boneNames) {
    const prevTransform = prev.bones[boneName]
    const nextTransform = next.bones[boneName]

    if (prevTransform && nextTransform) {
      // Both keyframes have this bone - interpolate
      result[boneName] = interpolateBoneTransform(
        prevTransform,
        nextTransform,
        factor,
        mode
      )
    } else if (prevTransform) {
      // Only prev has this bone - use prev
      result[boneName] = { ...prevTransform }
    } else if (nextTransform) {
      // Only next has this bone - use next
      result[boneName] = { ...nextTransform }
    }
  }

  return result as Record<BoneName, BoneTransform>
}
