import type { AnimationClip, BoneName, Keyframe } from '../types'

/**
 * Flattens keyframe times into a Float32Array for GLTF animation sampler input.
 * @param keyframes - Array of keyframes (must be sorted by time ascending)
 * @returns Float32Array of keyframe times
 */
export function flattenTimes(keyframes: Keyframe[]): Float32Array {
  return new Float32Array(keyframes.map((kf) => kf.time))
}

/**
 * Transform path types supported by GLTF animations.
 */
export type TransformPath = 'translation' | 'rotation' | 'scale'

/**
 * Flattens a specific transform property across all keyframes for a bone.
 * Returns the data in the format expected by GLTF samplers.
 *
 * @param keyframes - Array of keyframes (must be sorted by time ascending)
 * @param boneName - Name of the bone to extract transforms for
 * @param path - Which transform component to extract
 * @returns Float32Array of transform values (3 components for translation/scale, 4 for rotation)
 */
export function flattenTransformPath(
  keyframes: Keyframe[],
  boneName: BoneName,
  path: TransformPath
): Float32Array {
  const componentCount = path === 'rotation' ? 4 : 3
  const result = new Float32Array(keyframes.length * componentCount)

  keyframes.forEach((kf, index) => {
    const transform = kf.bones[boneName]
    if (!transform) {
      // Use identity transform if bone not present in this keyframe
      if (path === 'rotation') {
        result[index * 4] = 0 // x
        result[index * 4 + 1] = 0 // y
        result[index * 4 + 2] = 0 // z
        result[index * 4 + 3] = 1 // w
      } else if (path === 'translation') {
        result[index * 3] = 0
        result[index * 3 + 1] = 0
        result[index * 3 + 2] = 0
      } else {
        // scale
        result[index * 3] = 1
        result[index * 3 + 1] = 1
        result[index * 3 + 2] = 1
      }
      return
    }

    if (path === 'rotation') {
      const offset = index * 4
      result[offset] = transform.rotation.x
      result[offset + 1] = transform.rotation.y
      result[offset + 2] = transform.rotation.z
      result[offset + 3] = transform.rotation.w
    } else if (path === 'translation') {
      const offset = index * 3
      result[offset] = transform.position.x
      result[offset + 1] = transform.position.y
      result[offset + 2] = transform.position.z
    } else {
      // scale
      const offset = index * 3
      result[offset] = transform.scale.x
      result[offset + 1] = transform.scale.y
      result[offset + 2] = transform.scale.z
    }
  })

  return result
}

/**
 * Gets the set of bone names that have any animation data in the keyframes.
 * A bone is considered "animated" if it exists in at least one keyframe.
 *
 * @param keyframes - Array of keyframes
 * @returns Set of bone names that are animated
 */
export function getAnimatedBones(keyframes: Keyframe[]): Set<BoneName> {
  const bones = new Set<BoneName>()

  for (const kf of keyframes) {
    for (const boneName of Object.keys(kf.bones) as BoneName[]) {
      bones.add(boneName)
    }
  }

  return bones
}

/**
 * Checks if a bone has non-identity transforms (actually animated, not just present).
 * This is useful to avoid exporting bones that don't actually move.
 *
 * @param keyframes - Array of keyframes
 * @param boneName - Bone to check
 * @returns true if the bone has any non-identity transforms
 */
export function boneHasAnimation(
  keyframes: Keyframe[],
  boneName: BoneName
): boolean {
  const EPSILON = 0.0001

  for (const kf of keyframes) {
    const transform = kf.bones[boneName]
    if (!transform) continue

    // Check if position is non-zero (only Hips typically moves)
    if (
      Math.abs(transform.position.x) > EPSILON ||
      Math.abs(transform.position.y) > EPSILON ||
      Math.abs(transform.position.z) > EPSILON
    ) {
      return true
    }

    // Check if rotation is non-identity
    if (
      Math.abs(transform.rotation.x) > EPSILON ||
      Math.abs(transform.rotation.y) > EPSILON ||
      Math.abs(transform.rotation.z) > EPSILON ||
      Math.abs(transform.rotation.w - 1) > EPSILON
    ) {
      return true
    }

    // Check if scale is non-identity
    if (
      Math.abs(transform.scale.x - 1) > EPSILON ||
      Math.abs(transform.scale.y - 1) > EPSILON ||
      Math.abs(transform.scale.z - 1) > EPSILON
    ) {
      return true
    }
  }

  return false
}

/**
 * Converts our InterpolationMode to GLTF interpolation string.
 */
export function toGltfInterpolation(
  mode: AnimationClip['interpolation']
): 'LINEAR' | 'STEP' | 'CUBICSPLINE' {
  return mode // They happen to match exactly
}

/**
 * Represents animation data for a single bone, ready for GLTF export.
 */
export interface BoneAnimationData {
  boneName: BoneName
  times: Float32Array
  translations: Float32Array
  rotations: Float32Array
  scales: Float32Array
}

/**
 * Converts a clip to animation data structures ready for GLTF export.
 *
 * @param clip - The animation clip to convert
 * @returns Array of bone animation data, one per animated bone
 */
export function clipToBoneAnimationData(
  clip: AnimationClip
): BoneAnimationData[] {
  const { keyframes } = clip

  if (keyframes.length === 0) {
    return []
  }

  const animatedBones = getAnimatedBones(keyframes)
  const times = flattenTimes(keyframes)
  const result: BoneAnimationData[] = []

  for (const boneName of animatedBones) {
    result.push({
      boneName,
      times,
      translations: flattenTransformPath(keyframes, boneName, 'translation'),
      rotations: flattenTransformPath(keyframes, boneName, 'rotation'),
      scales: flattenTransformPath(keyframes, boneName, 'scale'),
    })
  }

  return result
}

/**
 * Information about existing animations in a GLB file.
 */
export interface ExistingAnimationInfo {
  name: string
  duration: number
  channelCount: number
}

/**
 * Preview information for an export operation.
 */
export interface ExportPreview {
  originalAnimations: ExistingAnimationInfo[]
  clipsToExport: {
    name: string
    duration: number
    boneCount: number
    willOverwrite: boolean
  }[]
  preservedAnimations: string[]
  overwrittenAnimations: string[]
}

/**
 * Builds a preview of what an export operation will do.
 *
 * @param existingAnimations - Info about animations already in the file
 * @param clipsToExport - Clips that will be exported
 * @returns Preview information
 */
export function buildExportPreview(
  existingAnimations: ExistingAnimationInfo[],
  clipsToExport: AnimationClip[]
): ExportPreview {
  const existingNames = new Set(existingAnimations.map((a) => a.name))
  const exportNames = new Set(clipsToExport.map((c) => c.name))

  const overwrittenAnimations: string[] = []
  const preservedAnimations: string[] = []

  for (const existing of existingAnimations) {
    if (exportNames.has(existing.name)) {
      overwrittenAnimations.push(existing.name)
    } else {
      preservedAnimations.push(existing.name)
    }
  }

  return {
    originalAnimations: existingAnimations,
    clipsToExport: clipsToExport.map((clip) => ({
      name: clip.name,
      duration: clip.duration,
      boneCount: getAnimatedBones(clip.keyframes).size,
      willOverwrite: existingNames.has(clip.name),
    })),
    preservedAnimations,
    overwrittenAnimations,
  }
}
