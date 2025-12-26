import { describe, it, expect } from 'vitest'
import {
  findSurroundingKeyframes,
  interpolatePoseAtTime,
} from '../utils/interpolation'
import type { BoneName, BoneTransform, Keyframe } from '../types'

// Helper to create a simple bone transform
function createBoneTransform(
  px: number,
  py: number,
  pz: number,
  qx = 0,
  qy = 0,
  qz = 0,
  qw = 1
): BoneTransform {
  return {
    position: { x: px, y: py, z: pz },
    rotation: { x: qx, y: qy, z: qz, w: qw },
    scale: { x: 1, y: 1, z: 1 },
  }
}

// Helper to create a keyframe with a single bone
function createKeyframe(
  id: string,
  time: number,
  boneName: BoneName,
  transform: BoneTransform
): Keyframe {
  return {
    id,
    time,
    bones: { [boneName]: transform } as Record<BoneName, BoneTransform>,
  }
}

// Helper to create a keyframe with multiple bones
function createMultiBoneKeyframe(
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

describe('findSurroundingKeyframes', () => {
  it('should return null for empty keyframes', () => {
    const result = findSurroundingKeyframes([], 1.0)
    expect(result).toBeNull()
  })

  it('should return null for single keyframe', () => {
    const keyframes: Keyframe[] = [
      createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
    ]
    const result = findSurroundingKeyframes(keyframes, 0.5)
    expect(result).toBeNull()
  })

  it('should return null when time is before first keyframe', () => {
    const keyframes: Keyframe[] = [
      createKeyframe('kf1', 1.0, 'Hips', createBoneTransform(0, 0, 0)),
      createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(1, 1, 1)),
    ]
    const result = findSurroundingKeyframes(keyframes, 0.5)
    expect(result).toBeNull()
  })

  it('should return null when time equals first keyframe', () => {
    const keyframes: Keyframe[] = [
      createKeyframe('kf1', 1.0, 'Hips', createBoneTransform(0, 0, 0)),
      createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(1, 1, 1)),
    ]
    const result = findSurroundingKeyframes(keyframes, 1.0)
    expect(result).toBeNull()
  })

  it('should return null when time is at or after last keyframe', () => {
    const keyframes: Keyframe[] = [
      createKeyframe('kf1', 1.0, 'Hips', createBoneTransform(0, 0, 0)),
      createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(1, 1, 1)),
    ]
    expect(findSurroundingKeyframes(keyframes, 2.0)).toBeNull()
    expect(findSurroundingKeyframes(keyframes, 3.0)).toBeNull()
  })

  it('should find surrounding keyframes correctly', () => {
    const keyframes: Keyframe[] = [
      createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
      createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(2, 2, 2)),
    ]
    const result = findSurroundingKeyframes(keyframes, 1.0)

    expect(result).not.toBeNull()
    expect(result!.prev.id).toBe('kf1')
    expect(result!.next.id).toBe('kf2')
    expect(result!.factor).toBeCloseTo(0.5)
  })

  it('should calculate factor correctly at 25%', () => {
    const keyframes: Keyframe[] = [
      createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
      createKeyframe('kf2', 4.0, 'Hips', createBoneTransform(4, 4, 4)),
    ]
    const result = findSurroundingKeyframes(keyframes, 1.0)

    expect(result).not.toBeNull()
    expect(result!.factor).toBeCloseTo(0.25)
  })

  it('should handle multiple keyframes and find correct pair', () => {
    const keyframes: Keyframe[] = [
      createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
      createKeyframe('kf2', 1.0, 'Hips', createBoneTransform(1, 1, 1)),
      createKeyframe('kf3', 2.0, 'Hips', createBoneTransform(2, 2, 2)),
      createKeyframe('kf4', 3.0, 'Hips', createBoneTransform(3, 3, 3)),
    ]

    const result = findSurroundingKeyframes(keyframes, 1.5)

    expect(result).not.toBeNull()
    expect(result!.prev.id).toBe('kf2')
    expect(result!.next.id).toBe('kf3')
    expect(result!.factor).toBeCloseTo(0.5)
  })
})

describe('interpolatePoseAtTime', () => {
  describe('edge cases', () => {
    it('should return null for empty keyframes', () => {
      const result = interpolatePoseAtTime([], 1.0, 'LINEAR')
      expect(result).toBeNull()
    })

    it('should return first keyframe pose when time is before first keyframe', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 1.0, 'Hips', createBoneTransform(10, 20, 30)),
        createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(40, 50, 60)),
      ]
      const result = interpolatePoseAtTime(keyframes, 0.5, 'LINEAR')

      expect(result).not.toBeNull()
      expect(result!.Hips.position).toEqual({ x: 10, y: 20, z: 30 })
    })

    it('should return last keyframe pose when time is after last keyframe', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 1.0, 'Hips', createBoneTransform(10, 20, 30)),
        createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(40, 50, 60)),
      ]
      const result = interpolatePoseAtTime(keyframes, 3.0, 'LINEAR')

      expect(result).not.toBeNull()
      expect(result!.Hips.position).toEqual({ x: 40, y: 50, z: 60 })
    })

    it('should return first keyframe pose when time equals first keyframe time', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 1.0, 'Hips', createBoneTransform(10, 20, 30)),
        createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(40, 50, 60)),
      ]
      const result = interpolatePoseAtTime(keyframes, 1.0, 'LINEAR')

      expect(result).not.toBeNull()
      expect(result!.Hips.position).toEqual({ x: 10, y: 20, z: 30 })
    })

    it('should return last keyframe pose when time equals last keyframe time', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 1.0, 'Hips', createBoneTransform(10, 20, 30)),
        createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(40, 50, 60)),
      ]
      const result = interpolatePoseAtTime(keyframes, 2.0, 'LINEAR')

      expect(result).not.toBeNull()
      expect(result!.Hips.position).toEqual({ x: 40, y: 50, z: 60 })
    })

    it('should handle single keyframe', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 1.0, 'Hips', createBoneTransform(10, 20, 30)),
      ]
      const result = interpolatePoseAtTime(keyframes, 5.0, 'LINEAR')

      expect(result).not.toBeNull()
      expect(result!.Hips.position).toEqual({ x: 10, y: 20, z: 30 })
    })
  })

  describe('LINEAR interpolation', () => {
    it('should interpolate position at 50%', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
        createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(10, 20, 30)),
      ]
      const result = interpolatePoseAtTime(keyframes, 1.0, 'LINEAR')

      expect(result).not.toBeNull()
      expect(result!.Hips.position.x).toBeCloseTo(5)
      expect(result!.Hips.position.y).toBeCloseTo(10)
      expect(result!.Hips.position.z).toBeCloseTo(15)
    })

    it('should interpolate position at 25%', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
        createKeyframe('kf2', 4.0, 'Hips', createBoneTransform(100, 200, 300)),
      ]
      const result = interpolatePoseAtTime(keyframes, 1.0, 'LINEAR')

      expect(result).not.toBeNull()
      expect(result!.Hips.position.x).toBeCloseTo(25)
      expect(result!.Hips.position.y).toBeCloseTo(50)
      expect(result!.Hips.position.z).toBeCloseTo(75)
    })

    it('should interpolate scale linearly', () => {
      const kf1Transform = createBoneTransform(0, 0, 0)
      kf1Transform.scale = { x: 1, y: 1, z: 1 }

      const kf2Transform = createBoneTransform(0, 0, 0)
      kf2Transform.scale = { x: 2, y: 3, z: 4 }

      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', kf1Transform),
        createKeyframe('kf2', 2.0, 'Hips', kf2Transform),
      ]
      const result = interpolatePoseAtTime(keyframes, 1.0, 'LINEAR')

      expect(result).not.toBeNull()
      expect(result!.Hips.scale.x).toBeCloseTo(1.5)
      expect(result!.Hips.scale.y).toBeCloseTo(2)
      expect(result!.Hips.scale.z).toBeCloseTo(2.5)
    })

    it('should slerp rotation', () => {
      // Identity quaternion to 90 degree Y rotation
      const kf1Transform = createBoneTransform(0, 0, 0, 0, 0, 0, 1)
      const kf2Transform = createBoneTransform(
        0,
        0,
        0,
        0,
        0.7071067811865476,
        0,
        0.7071067811865476
      )

      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', kf1Transform),
        createKeyframe('kf2', 2.0, 'Hips', kf2Transform),
      ]
      const result = interpolatePoseAtTime(keyframes, 1.0, 'LINEAR')

      expect(result).not.toBeNull()
      // At 50%, should be approximately 45 degree rotation around Y
      // sin(22.5 deg) ~= 0.3827, cos(22.5 deg) ~= 0.9239
      const rotation = result!.Hips.rotation
      const length = Math.sqrt(
        rotation.x ** 2 + rotation.y ** 2 + rotation.z ** 2 + rotation.w ** 2
      )
      expect(length).toBeCloseTo(1) // Should be normalized
    })

    it('should handle multiple bones', () => {
      const keyframes: Keyframe[] = [
        createMultiBoneKeyframe('kf1', 0, {
          Hips: createBoneTransform(0, 0, 0),
          Spine: createBoneTransform(0, 1, 0),
          Head: createBoneTransform(0, 2, 0),
        }),
        createMultiBoneKeyframe('kf2', 2.0, {
          Hips: createBoneTransform(10, 0, 0),
          Spine: createBoneTransform(10, 1, 0),
          Head: createBoneTransform(10, 2, 0),
        }),
      ]
      const result = interpolatePoseAtTime(keyframes, 1.0, 'LINEAR')

      expect(result).not.toBeNull()
      expect(result!.Hips.position.x).toBeCloseTo(5)
      expect(result!.Spine.position.x).toBeCloseTo(5)
      expect(result!.Head.position.x).toBeCloseTo(5)
    })
  })

  describe('STEP interpolation', () => {
    it('should return previous keyframe pose exactly at 50%', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
        createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(10, 20, 30)),
      ]
      const result = interpolatePoseAtTime(keyframes, 1.0, 'STEP')

      expect(result).not.toBeNull()
      expect(result!.Hips.position).toEqual({ x: 0, y: 0, z: 0 })
    })

    it('should return previous keyframe pose exactly at 99%', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
        createKeyframe('kf2', 1.0, 'Hips', createBoneTransform(10, 20, 30)),
      ]
      const result = interpolatePoseAtTime(keyframes, 0.99, 'STEP')

      expect(result).not.toBeNull()
      expect(result!.Hips.position).toEqual({ x: 0, y: 0, z: 0 })
    })

    it('should return exact keyframe pose at keyframe time', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
        createKeyframe('kf2', 1.0, 'Hips', createBoneTransform(10, 20, 30)),
        createKeyframe('kf3', 2.0, 'Hips', createBoneTransform(100, 200, 300)),
      ]
      // At time 1.0, should return kf2's pose (via the time <= firstKeyframe check)
      const result = interpolatePoseAtTime(keyframes, 2.0, 'STEP')

      expect(result).not.toBeNull()
      expect(result!.Hips.position).toEqual({ x: 100, y: 200, z: 300 })
    })

    it('should return previous rotation exactly (no slerp)', () => {
      const kf1Transform = createBoneTransform(0, 0, 0, 0, 0, 0, 1)
      const kf2Transform = createBoneTransform(
        0,
        0,
        0,
        0,
        0.7071067811865476,
        0,
        0.7071067811865476
      )

      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', kf1Transform),
        createKeyframe('kf2', 2.0, 'Hips', kf2Transform),
      ]
      const result = interpolatePoseAtTime(keyframes, 1.0, 'STEP')

      expect(result).not.toBeNull()
      expect(result!.Hips.rotation).toEqual({ x: 0, y: 0, z: 0, w: 1 })
    })
  })

  describe('CUBICSPLINE interpolation', () => {
    it('should fallback to LINEAR for now', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
        createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(10, 20, 30)),
      ]
      const result = interpolatePoseAtTime(keyframes, 1.0, 'CUBICSPLINE')

      expect(result).not.toBeNull()
      // Should behave like LINEAR for now
      expect(result!.Hips.position.x).toBeCloseTo(5)
      expect(result!.Hips.position.y).toBeCloseTo(10)
      expect(result!.Hips.position.z).toBeCloseTo(15)
    })
  })
})
