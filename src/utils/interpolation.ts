import type {
  BoneName,
  BoneTransform,
  InterpolationMode,
  Keyframe,
} from '../types'
import {
  quaternionSlerp,
  vector3Lerp,
  catmullRomVector3,
  squadInterpolate,
} from './math'

export interface SurroundingKeyframes {
  prev: Keyframe
  next: Keyframe
  factor: number
}

export interface CubicSurroundingKeyframes {
  k0: Keyframe // Keyframe before prev (or duplicated prev for edge case)
  k1: Keyframe // Prev keyframe
  k2: Keyframe // Next keyframe
  k3: Keyframe // Keyframe after next (or duplicated next for edge case)
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
 * Finds 4 surrounding keyframes for cubic spline interpolation.
 * For edge cases, duplicates the endpoint keyframes.
 *
 * @param keyframes - Array of keyframes (must be sorted by time ascending)
 * @param time - The time to find surrounding keyframes for
 * @returns Object with k0, k1, k2, k3 keyframes and factor, or null if not enough keyframes
 */
export function findCubicSurroundingKeyframes(
  keyframes: Keyframe[],
  time: number
): CubicSurroundingKeyframes | null {
  // Need at least 2 keyframes for interpolation
  if (keyframes.length < 2) {
    return null
  }

  const firstKeyframe = keyframes[0]
  const lastKeyframe = keyframes[keyframes.length - 1]

  // Time is before the first keyframe or at/after the last
  if (time <= firstKeyframe.time || time >= lastKeyframe.time) {
    return null
  }

  // Find the surrounding keyframes (k1 and k2)
  let prevIndex = 0
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (keyframes[i].time <= time && keyframes[i + 1].time > time) {
      prevIndex = i
      break
    }
  }

  const k1 = keyframes[prevIndex]
  const k2 = keyframes[prevIndex + 1]

  // For k0, use the keyframe before k1, or duplicate k1 if at the start
  const k0 = prevIndex > 0 ? keyframes[prevIndex - 1] : k1

  // For k3, use the keyframe after k2, or duplicate k2 if at the end
  const k3 = prevIndex + 2 < keyframes.length ? keyframes[prevIndex + 2] : k2

  // Calculate interpolation factor (0 to 1)
  const timeDelta = k2.time - k1.time
  const factor = timeDelta > 0 ? (time - k1.time) / timeDelta : 0

  return { k0, k1, k2, k3, factor }
}

/**
 * Interpolates a bone transform between two transforms using linear interpolation.
 *
 * @param prev - Previous bone transform
 * @param next - Next bone transform
 * @param factor - Interpolation factor (0 = prev, 1 = next)
 * @returns Interpolated bone transform
 */
function interpolateBoneTransformLinear(
  prev: BoneTransform,
  next: BoneTransform,
  factor: number
): BoneTransform {
  return {
    position: vector3Lerp(prev.position, next.position, factor),
    rotation: quaternionSlerp(prev.rotation, next.rotation, factor),
    scale: vector3Lerp(prev.scale, next.scale, factor),
  }
}

/**
 * Interpolates a bone transform using cubic spline interpolation.
 * Uses Catmull-Rom for positions and scales, and Squad for quaternion rotations.
 *
 * @param t0 - Transform from keyframe before prev
 * @param t1 - Transform at prev keyframe
 * @param t2 - Transform at next keyframe
 * @param t3 - Transform from keyframe after next
 * @param factor - Interpolation factor (0 = t1, 1 = t2)
 * @returns Interpolated bone transform
 */
function interpolateBoneTransformCubic(
  t0: BoneTransform,
  t1: BoneTransform,
  t2: BoneTransform,
  t3: BoneTransform,
  factor: number
): BoneTransform {
  return {
    position: catmullRomVector3(
      t0.position,
      t1.position,
      t2.position,
      t3.position,
      factor
    ),
    rotation: squadInterpolate(
      t0.rotation,
      t1.rotation,
      t2.rotation,
      t3.rotation,
      factor
    ),
    scale: catmullRomVector3(
      t0.scale,
      t1.scale,
      t2.scale,
      t3.scale,
      factor
    ),
  }
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

  // LINEAR mode (CUBICSPLINE is handled separately with 4 keyframes)
  return interpolateBoneTransformLinear(prev, next, factor)
}

/**
 * Interpolates the pose at a given time based on keyframes.
 *
 * Edge cases:
 * - Empty keyframes: returns null
 * - Time before first keyframe: returns first keyframe's pose
 * - Time after last keyframe: returns last keyframe's pose
 * - Time exactly on a keyframe: returns that keyframe's pose
 * - CUBICSPLINE with < 4 keyframes: falls back to LINEAR
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

  // For CUBICSPLINE mode, we need at least 4 keyframes for true cubic interpolation
  // With fewer keyframes, fall back to LINEAR
  const effectiveMode =
    mode === 'CUBICSPLINE' && keyframes.length < 4 ? 'LINEAR' : mode

  // Handle CUBICSPLINE with 4+ keyframes
  if (effectiveMode === 'CUBICSPLINE') {
    const cubicSurrounding = findCubicSurroundingKeyframes(keyframes, time)

    if (cubicSurrounding) {
      const { k0, k1, k2, k3, factor } = cubicSurrounding
      const result: Partial<Record<BoneName, BoneTransform>> = {}

      // Get all bone names from the main interpolation keyframes
      const boneNames = new Set<BoneName>([
        ...(Object.keys(k1.bones) as BoneName[]),
        ...(Object.keys(k2.bones) as BoneName[]),
      ])

      for (const boneName of boneNames) {
        const t0 = k0.bones[boneName]
        const t1 = k1.bones[boneName]
        const t2 = k2.bones[boneName]
        const t3 = k3.bones[boneName]

        if (t1 && t2) {
          // Both main keyframes have this bone - use cubic interpolation
          // For k0 and k3, use k1 or k2 as fallbacks if the bone doesn't exist
          result[boneName] = interpolateBoneTransformCubic(
            t0 || t1,
            t1,
            t2,
            t3 || t2,
            factor
          )
        } else if (t1) {
          // Only k1 has this bone - use k1
          result[boneName] = { ...t1 }
        } else if (t2) {
          // Only k2 has this bone - use k2
          result[boneName] = { ...t2 }
        }
      }

      return result as Record<BoneName, BoneTransform>
    }
  }

  // Find surrounding keyframes for LINEAR and STEP modes
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
        effectiveMode
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
