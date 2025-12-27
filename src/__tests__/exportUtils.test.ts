import { describe, expect, it } from 'vitest'
import type { AnimationClip, BoneName, BoneTransform, Keyframe } from '../types'
import {
  boneHasAnimation,
  buildExportPreview,
  clipToBoneAnimationData,
  flattenTimes,
  flattenTransformPath,
  getAnimatedBones,
  toGltfInterpolation,
} from '../utils/exportUtils'

// Helper to create a bone transform
function createBoneTransform(
  px = 0,
  py = 0,
  pz = 0,
  qx = 0,
  qy = 0,
  qz = 0,
  qw = 1,
  sx = 1,
  sy = 1,
  sz = 1
): BoneTransform {
  return {
    position: { x: px, y: py, z: pz },
    rotation: { x: qx, y: qy, z: qz, w: qw },
    scale: { x: sx, y: sy, z: sz },
  }
}

// Helper to create a keyframe
function createKeyframe(
  id: string,
  time: number,
  bones: Partial<Record<BoneName, BoneTransform>>
): Keyframe {
  return {
    id,
    time,
    bones: bones as Record<BoneName, BoneTransform>,
  }
}

// Helper to create a clip
function createClip(
  name: string,
  keyframes: Keyframe[],
  interpolation: AnimationClip['interpolation'] = 'LINEAR'
): AnimationClip {
  const duration =
    keyframes.length > 0 ? Math.max(...keyframes.map((k) => k.time)) : 0
  return {
    id: crypto.randomUUID(),
    name,
    duration,
    keyframes,
    loopMode: 'ONCE',
    interpolation,
  }
}

describe('flattenTimes', () => {
  it('should return empty array for no keyframes', () => {
    const result = flattenTimes([])
    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(0)
  })

  it('should flatten keyframe times', () => {
    const keyframes = [
      createKeyframe('kf1', 0, { Hips: createBoneTransform() }),
      createKeyframe('kf2', 1.5, { Hips: createBoneTransform() }),
      createKeyframe('kf3', 3.0, { Hips: createBoneTransform() }),
    ]

    const result = flattenTimes(keyframes)

    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(3)
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(1.5)
    expect(result[2]).toBe(3.0)
  })
})

describe('flattenTransformPath', () => {
  it('should flatten translation values', () => {
    const keyframes = [
      createKeyframe('kf1', 0, { Hips: createBoneTransform(1, 2, 3) }),
      createKeyframe('kf2', 1, { Hips: createBoneTransform(4, 5, 6) }),
    ]

    const result = flattenTransformPath(keyframes, 'Hips', 'translation')

    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(6) // 2 keyframes * 3 components
    expect(Array.from(result)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('should flatten rotation values', () => {
    const keyframes = [
      createKeyframe('kf1', 0, {
        Hips: createBoneTransform(0, 0, 0, 0, 0, 0, 1),
      }),
      createKeyframe('kf2', 1, {
        Hips: createBoneTransform(0, 0, 0, 0.5, 0.5, 0.5, 0.5),
      }),
    ]

    const result = flattenTransformPath(keyframes, 'Hips', 'rotation')

    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(8) // 2 keyframes * 4 components
    expect(Array.from(result)).toEqual([0, 0, 0, 1, 0.5, 0.5, 0.5, 0.5])
  })

  it('should flatten scale values', () => {
    const keyframes = [
      createKeyframe('kf1', 0, {
        Hips: createBoneTransform(0, 0, 0, 0, 0, 0, 1, 1, 1, 1),
      }),
      createKeyframe('kf2', 1, {
        Hips: createBoneTransform(0, 0, 0, 0, 0, 0, 1, 2, 3, 4),
      }),
    ]

    const result = flattenTransformPath(keyframes, 'Hips', 'scale')

    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(6) // 2 keyframes * 3 components
    expect(Array.from(result)).toEqual([1, 1, 1, 2, 3, 4])
  })

  it('should use identity transform for missing bones', () => {
    const keyframes = [
      createKeyframe('kf1', 0, { Hips: createBoneTransform(1, 2, 3) }),
      createKeyframe('kf2', 1, {}), // No bones
    ]

    const translation = flattenTransformPath(keyframes, 'Hips', 'translation')
    expect(Array.from(translation)).toEqual([1, 2, 3, 0, 0, 0])

    const rotation = flattenTransformPath(keyframes, 'Hips', 'rotation')
    expect(Array.from(rotation)).toEqual([0, 0, 0, 1, 0, 0, 0, 1])

    const scale = flattenTransformPath(keyframes, 'Hips', 'scale')
    expect(Array.from(scale)).toEqual([1, 1, 1, 1, 1, 1])
  })
})

describe('getAnimatedBones', () => {
  it('should return empty set for no keyframes', () => {
    const result = getAnimatedBones([])
    expect(result.size).toBe(0)
  })

  it('should return all bones present in keyframes', () => {
    const keyframes = [
      createKeyframe('kf1', 0, {
        Hips: createBoneTransform(),
        Spine: createBoneTransform(),
      }),
      createKeyframe('kf2', 1, {
        Hips: createBoneTransform(),
        Head: createBoneTransform(),
      }),
    ]

    const result = getAnimatedBones(keyframes)

    expect(result.size).toBe(3)
    expect(result.has('Hips')).toBe(true)
    expect(result.has('Spine')).toBe(true)
    expect(result.has('Head')).toBe(true)
  })
})

describe('boneHasAnimation', () => {
  it('should return false for identity transforms', () => {
    const keyframes = [
      createKeyframe('kf1', 0, { Hips: createBoneTransform() }),
      createKeyframe('kf2', 1, { Hips: createBoneTransform() }),
    ]

    expect(boneHasAnimation(keyframes, 'Hips')).toBe(false)
  })

  it('should return true for non-zero position', () => {
    const keyframes = [
      createKeyframe('kf1', 0, { Hips: createBoneTransform(0, 0, 0) }),
      createKeyframe('kf2', 1, { Hips: createBoneTransform(1, 0, 0) }),
    ]

    expect(boneHasAnimation(keyframes, 'Hips')).toBe(true)
  })

  it('should return true for non-identity rotation', () => {
    const keyframes = [
      createKeyframe('kf1', 0, {
        Hips: createBoneTransform(0, 0, 0, 0, 0.707, 0, 0.707),
      }),
    ]

    expect(boneHasAnimation(keyframes, 'Hips')).toBe(true)
  })

  it('should return true for non-identity scale', () => {
    const keyframes = [
      createKeyframe('kf1', 0, {
        Hips: createBoneTransform(0, 0, 0, 0, 0, 0, 1, 2, 1, 1),
      }),
    ]

    expect(boneHasAnimation(keyframes, 'Hips')).toBe(true)
  })

  it('should return false for bone not in keyframes', () => {
    const keyframes = [
      createKeyframe('kf1', 0, { Hips: createBoneTransform(1, 2, 3) }),
    ]

    expect(boneHasAnimation(keyframes, 'Head')).toBe(false)
  })
})

describe('toGltfInterpolation', () => {
  it('should map LINEAR', () => {
    expect(toGltfInterpolation('LINEAR')).toBe('LINEAR')
  })

  it('should map STEP', () => {
    expect(toGltfInterpolation('STEP')).toBe('STEP')
  })

  it('should map CUBICSPLINE', () => {
    expect(toGltfInterpolation('CUBICSPLINE')).toBe('CUBICSPLINE')
  })
})

describe('clipToBoneAnimationData', () => {
  it('should return empty array for clip with no keyframes', () => {
    const clip = createClip('Empty', [])
    const result = clipToBoneAnimationData(clip)
    expect(result).toEqual([])
  })

  it('should convert clip to bone animation data', () => {
    const keyframes = [
      createKeyframe('kf1', 0, {
        Hips: createBoneTransform(0, 0, 0),
        Spine: createBoneTransform(0, 1, 0),
      }),
      createKeyframe('kf2', 1, {
        Hips: createBoneTransform(0, 1, 0),
        Spine: createBoneTransform(0, 2, 0),
      }),
    ]
    const clip = createClip('Walk', keyframes)

    const result = clipToBoneAnimationData(clip)

    expect(result.length).toBe(2)

    const hipsData = result.find((d) => d.boneName === 'Hips')
    expect(hipsData).toBeDefined()
    expect(hipsData!.times.length).toBe(2)
    expect(hipsData!.translations.length).toBe(6)
    expect(hipsData!.rotations.length).toBe(8)
    expect(hipsData!.scales.length).toBe(6)

    const spineData = result.find((d) => d.boneName === 'Spine')
    expect(spineData).toBeDefined()
  })

  it('should share the same times array reference', () => {
    const keyframes = [
      createKeyframe('kf1', 0, {
        Hips: createBoneTransform(),
        Spine: createBoneTransform(),
      }),
      createKeyframe('kf2', 1, {
        Hips: createBoneTransform(),
        Spine: createBoneTransform(),
      }),
    ]
    const clip = createClip('Test', keyframes)

    const result = clipToBoneAnimationData(clip)

    // All bones should share the same times array
    expect(result[0].times).toBe(result[1].times)
  })
})

describe('buildExportPreview', () => {
  it('should handle empty inputs', () => {
    const result = buildExportPreview([], [])

    expect(result.originalAnimations).toEqual([])
    expect(result.clipsToExport).toEqual([])
    expect(result.preservedAnimations).toEqual([])
    expect(result.overwrittenAnimations).toEqual([])
  })

  it('should identify preserved animations', () => {
    const existing = [
      { name: 'Walk', duration: 2, channelCount: 24 },
      { name: 'Run', duration: 1.5, channelCount: 24 },
    ]
    const clips = [createClip('Jump', [])]

    const result = buildExportPreview(existing, clips)

    expect(result.preservedAnimations).toEqual(['Walk', 'Run'])
    expect(result.overwrittenAnimations).toEqual([])
  })

  it('should identify overwritten animations', () => {
    const existing = [
      { name: 'Walk', duration: 2, channelCount: 24 },
      { name: 'Run', duration: 1.5, channelCount: 24 },
    ]
    const clips = [createClip('Walk', [])] // Same name as existing

    const result = buildExportPreview(existing, clips)

    expect(result.preservedAnimations).toEqual(['Run'])
    expect(result.overwrittenAnimations).toEqual(['Walk'])
  })

  it('should include clip info in clipsToExport', () => {
    const existing = [{ name: 'Idle', duration: 2, channelCount: 24 }]
    const keyframes = [
      createKeyframe('kf1', 0, { Hips: createBoneTransform() }),
      createKeyframe('kf2', 1, { Hips: createBoneTransform() }),
    ]
    const clips = [
      createClip('Idle', keyframes), // Will overwrite
      createClip('Walk', keyframes), // New
    ]

    const result = buildExportPreview(existing, clips)

    expect(result.clipsToExport.length).toBe(2)

    const idleExport = result.clipsToExport.find((c) => c.name === 'Idle')
    expect(idleExport).toBeDefined()
    expect(idleExport!.willOverwrite).toBe(true)
    expect(idleExport!.boneCount).toBe(1)

    const walkExport = result.clipsToExport.find((c) => c.name === 'Walk')
    expect(walkExport).toBeDefined()
    expect(walkExport!.willOverwrite).toBe(false)
  })
})
