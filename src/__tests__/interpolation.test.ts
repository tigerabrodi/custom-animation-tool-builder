import { describe, it, expect } from 'vitest'
import {
  findSurroundingKeyframes,
  findCubicSurroundingKeyframes,
  interpolatePoseAtTime,
} from '../utils/interpolation'
import {
  catmullRomInterpolate,
  catmullRomVector3,
  squadInterpolate,
  squadIntermediate,
} from '../utils/math'
import type { BoneName, BoneTransform, Keyframe } from '../types'
import type { Vector3, Quaternion } from '../types/math'

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
    it('should fallback to LINEAR with only 2 keyframes', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
        createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(10, 20, 30)),
      ]
      const result = interpolatePoseAtTime(keyframes, 1.0, 'CUBICSPLINE')

      expect(result).not.toBeNull()
      // Should behave like LINEAR with < 4 keyframes
      expect(result!.Hips.position.x).toBeCloseTo(5)
      expect(result!.Hips.position.y).toBeCloseTo(10)
      expect(result!.Hips.position.z).toBeCloseTo(15)
    })

    it('should fallback to LINEAR with 3 keyframes', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
        createKeyframe('kf2', 1.0, 'Hips', createBoneTransform(5, 10, 15)),
        createKeyframe('kf3', 2.0, 'Hips', createBoneTransform(10, 20, 30)),
      ]
      const result = interpolatePoseAtTime(keyframes, 0.5, 'CUBICSPLINE')

      expect(result).not.toBeNull()
      // Should behave like LINEAR with < 4 keyframes
      expect(result!.Hips.position.x).toBeCloseTo(2.5)
      expect(result!.Hips.position.y).toBeCloseTo(5)
      expect(result!.Hips.position.z).toBeCloseTo(7.5)
    })

    it('should use cubic interpolation with 4+ keyframes', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
        createKeyframe('kf2', 1.0, 'Hips', createBoneTransform(10, 0, 0)),
        createKeyframe('kf3', 2.0, 'Hips', createBoneTransform(20, 0, 0)),
        createKeyframe('kf4', 3.0, 'Hips', createBoneTransform(30, 0, 0)),
      ]
      const result = interpolatePoseAtTime(keyframes, 1.5, 'CUBICSPLINE')

      expect(result).not.toBeNull()
      // Cubic interpolation should produce a value
      // For a linear motion, Catmull-Rom should give approximately linear result
      expect(result!.Hips.position.x).toBeCloseTo(15, 0)
    })

    it('should return exact keyframe pose at keyframe time', () => {
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
        createKeyframe('kf2', 1.0, 'Hips', createBoneTransform(100, 200, 300)),
        createKeyframe('kf3', 2.0, 'Hips', createBoneTransform(200, 400, 600)),
        createKeyframe('kf4', 3.0, 'Hips', createBoneTransform(300, 600, 900)),
      ]
      // At exactly time 1.0, should return kf2's pose (via edge case handling)
      const result = interpolatePoseAtTime(keyframes, 1.0, 'CUBICSPLINE')

      expect(result).not.toBeNull()
      expect(result!.Hips.position).toEqual({ x: 100, y: 200, z: 300 })
    })

    it('should produce smooth curves through control points', () => {
      // Create a curved path
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
        createKeyframe('kf2', 1.0, 'Hips', createBoneTransform(0, 10, 0)),
        createKeyframe('kf3', 2.0, 'Hips', createBoneTransform(10, 10, 0)),
        createKeyframe('kf4', 3.0, 'Hips', createBoneTransform(10, 0, 0)),
      ]

      // Sample at multiple points to verify smoothness
      const samples = [
        interpolatePoseAtTime(keyframes, 1.25, 'CUBICSPLINE'),
        interpolatePoseAtTime(keyframes, 1.5, 'CUBICSPLINE'),
        interpolatePoseAtTime(keyframes, 1.75, 'CUBICSPLINE'),
      ]

      // All samples should exist
      samples.forEach((s) => expect(s).not.toBeNull())

      // Cubic interpolation should produce smooth intermediate values
      // The x values should be increasing from 0 to 10
      expect(samples[0]!.Hips.position.x).toBeGreaterThan(0)
      expect(samples[1]!.Hips.position.x).toBeGreaterThan(samples[0]!.Hips.position.x)
      expect(samples[2]!.Hips.position.x).toBeGreaterThan(samples[1]!.Hips.position.x)
    })

    it('should maintain unit quaternions during squad interpolation', () => {
      // Different rotations at each keyframe
      const keyframes: Keyframe[] = [
        createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0, 0, 0, 0, 1)),
        createKeyframe(
          'kf2',
          1.0,
          'Hips',
          createBoneTransform(0, 0, 0, 0, 0.3827, 0, 0.9239)
        ), // 45 deg Y
        createKeyframe(
          'kf3',
          2.0,
          'Hips',
          createBoneTransform(0, 0, 0, 0, 0.7071, 0, 0.7071)
        ), // 90 deg Y
        createKeyframe(
          'kf4',
          3.0,
          'Hips',
          createBoneTransform(0, 0, 0, 0, 0.9239, 0, 0.3827)
        ), // 135 deg Y
      ]

      // Sample at multiple points
      const sampleTimes = [1.25, 1.5, 1.75]
      sampleTimes.forEach((time) => {
        const result = interpolatePoseAtTime(keyframes, time, 'CUBICSPLINE')
        expect(result).not.toBeNull()

        const q = result!.Hips.rotation
        const length = Math.sqrt(q.x ** 2 + q.y ** 2 + q.z ** 2 + q.w ** 2)
        expect(length).toBeCloseTo(1, 5)
      })
    })
  })
})

describe('findCubicSurroundingKeyframes', () => {
  it('should return null for empty keyframes', () => {
    const result = findCubicSurroundingKeyframes([], 1.0)
    expect(result).toBeNull()
  })

  it('should return null for single keyframe', () => {
    const keyframes: Keyframe[] = [
      createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
    ]
    const result = findCubicSurroundingKeyframes(keyframes, 0.5)
    expect(result).toBeNull()
  })

  it('should return null when time is before first keyframe', () => {
    const keyframes: Keyframe[] = [
      createKeyframe('kf1', 1.0, 'Hips', createBoneTransform(0, 0, 0)),
      createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(1, 1, 1)),
    ]
    const result = findCubicSurroundingKeyframes(keyframes, 0.5)
    expect(result).toBeNull()
  })

  it('should return correct keyframes with duplication at edges', () => {
    const keyframes: Keyframe[] = [
      createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
      createKeyframe('kf2', 1.0, 'Hips', createBoneTransform(10, 10, 10)),
      createKeyframe('kf3', 2.0, 'Hips', createBoneTransform(20, 20, 20)),
      createKeyframe('kf4', 3.0, 'Hips', createBoneTransform(30, 30, 30)),
    ]

    // Between kf1 and kf2 - k0 should be duplicated from k1
    const result1 = findCubicSurroundingKeyframes(keyframes, 0.5)
    expect(result1).not.toBeNull()
    expect(result1!.k0.id).toBe('kf1') // duplicated
    expect(result1!.k1.id).toBe('kf1')
    expect(result1!.k2.id).toBe('kf2')
    expect(result1!.k3.id).toBe('kf3')

    // Between kf2 and kf3 - all 4 distinct keyframes
    const result2 = findCubicSurroundingKeyframes(keyframes, 1.5)
    expect(result2).not.toBeNull()
    expect(result2!.k0.id).toBe('kf1')
    expect(result2!.k1.id).toBe('kf2')
    expect(result2!.k2.id).toBe('kf3')
    expect(result2!.k3.id).toBe('kf4')

    // Between kf3 and kf4 - k3 should be duplicated from k2
    const result3 = findCubicSurroundingKeyframes(keyframes, 2.5)
    expect(result3).not.toBeNull()
    expect(result3!.k0.id).toBe('kf2')
    expect(result3!.k1.id).toBe('kf3')
    expect(result3!.k2.id).toBe('kf4')
    expect(result3!.k3.id).toBe('kf4') // duplicated
  })

  it('should calculate factor correctly', () => {
    const keyframes: Keyframe[] = [
      createKeyframe('kf1', 0, 'Hips', createBoneTransform(0, 0, 0)),
      createKeyframe('kf2', 2.0, 'Hips', createBoneTransform(1, 1, 1)),
      createKeyframe('kf3', 4.0, 'Hips', createBoneTransform(2, 2, 2)),
      createKeyframe('kf4', 6.0, 'Hips', createBoneTransform(3, 3, 3)),
    ]

    const result = findCubicSurroundingKeyframes(keyframes, 3.0)
    expect(result).not.toBeNull()
    expect(result!.factor).toBeCloseTo(0.5)
  })
})

describe('Catmull-Rom interpolation', () => {
  it('should return p1 when t=0', () => {
    const result = catmullRomInterpolate(0, 10, 20, 30, 0)
    expect(result).toBeCloseTo(10)
  })

  it('should return p2 when t=1', () => {
    const result = catmullRomInterpolate(0, 10, 20, 30, 1)
    expect(result).toBeCloseTo(20)
  })

  it('should produce smooth intermediate values', () => {
    // For a linear sequence, should produce approximately linear result
    const result = catmullRomInterpolate(0, 10, 20, 30, 0.5)
    expect(result).toBeCloseTo(15, 0)
  })

  it('should produce curves for non-linear control points', () => {
    // Create a curve: low, high, low, high
    // At t=0.5, should be somewhere around the middle but affected by curve
    const result = catmullRomInterpolate(0, 100, 0, 100, 0.5)
    // The exact value depends on the spline, but should be between p1 and p2
    expect(result).toBeLessThan(100)
    expect(result).toBeGreaterThan(0)
  })

  describe('catmullRomVector3', () => {
    it('should interpolate all components', () => {
      const v0: Vector3 = { x: 0, y: 0, z: 0 }
      const v1: Vector3 = { x: 10, y: 20, z: 30 }
      const v2: Vector3 = { x: 20, y: 40, z: 60 }
      const v3: Vector3 = { x: 30, y: 60, z: 90 }

      const result = catmullRomVector3(v0, v1, v2, v3, 0.5)

      expect(result.x).toBeCloseTo(15, 0)
      expect(result.y).toBeCloseTo(30, 0)
      expect(result.z).toBeCloseTo(45, 0)
    })
  })
})

describe('Squad interpolation', () => {
  it('should return q1 when t=0', () => {
    const q0: Quaternion = { x: 0, y: 0, z: 0, w: 1 }
    const q1: Quaternion = { x: 0, y: 0.3827, z: 0, w: 0.9239 }
    const q2: Quaternion = { x: 0, y: 0.7071, z: 0, w: 0.7071 }
    const q3: Quaternion = { x: 0, y: 0.9239, z: 0, w: 0.3827 }

    const result = squadInterpolate(q0, q1, q2, q3, 0)

    expect(result.x).toBeCloseTo(q1.x, 3)
    expect(result.y).toBeCloseTo(q1.y, 3)
    expect(result.z).toBeCloseTo(q1.z, 3)
    expect(result.w).toBeCloseTo(q1.w, 3)
  })

  it('should return q2 when t=1', () => {
    const q0: Quaternion = { x: 0, y: 0, z: 0, w: 1 }
    const q1: Quaternion = { x: 0, y: 0.3827, z: 0, w: 0.9239 }
    const q2: Quaternion = { x: 0, y: 0.7071, z: 0, w: 0.7071 }
    const q3: Quaternion = { x: 0, y: 0.9239, z: 0, w: 0.3827 }

    const result = squadInterpolate(q0, q1, q2, q3, 1)

    expect(result.x).toBeCloseTo(q2.x, 3)
    expect(result.y).toBeCloseTo(q2.y, 3)
    expect(result.z).toBeCloseTo(q2.z, 3)
    expect(result.w).toBeCloseTo(q2.w, 3)
  })

  it('should produce unit quaternions', () => {
    const q0: Quaternion = { x: 0, y: 0, z: 0, w: 1 }
    const q1: Quaternion = { x: 0.5, y: 0.5, z: 0.5, w: 0.5 }
    const q2: Quaternion = { x: -0.5, y: 0.5, z: 0.5, w: 0.5 }
    const q3: Quaternion = { x: -0.5, y: -0.5, z: 0.5, w: 0.5 }

    const samples = [0.25, 0.5, 0.75]
    samples.forEach((t) => {
      const result = squadInterpolate(q0, q1, q2, q3, t)
      const length = Math.sqrt(
        result.x ** 2 + result.y ** 2 + result.z ** 2 + result.w ** 2
      )
      expect(length).toBeCloseTo(1, 5)
    })
  })

  it('should produce smooth interpolation between keyframes', () => {
    // Progressive rotation around Y axis
    const q0: Quaternion = { x: 0, y: 0, z: 0, w: 1 } // 0 deg
    const q1: Quaternion = { x: 0, y: 0.3827, z: 0, w: 0.9239 } // 45 deg
    const q2: Quaternion = { x: 0, y: 0.7071, z: 0, w: 0.7071 } // 90 deg
    const q3: Quaternion = { x: 0, y: 0.9239, z: 0, w: 0.3827 } // 135 deg

    const t25 = squadInterpolate(q0, q1, q2, q3, 0.25)
    const t50 = squadInterpolate(q0, q1, q2, q3, 0.5)
    const t75 = squadInterpolate(q0, q1, q2, q3, 0.75)

    // Y component should increase progressively (representing increasing rotation)
    expect(t25.y).toBeGreaterThan(q1.y)
    expect(t50.y).toBeGreaterThan(t25.y)
    expect(t75.y).toBeGreaterThan(t50.y)
    expect(t75.y).toBeLessThan(q2.y)
  })
})

describe('squadIntermediate', () => {
  it('should return a unit quaternion', () => {
    const qPrev: Quaternion = { x: 0, y: 0, z: 0, w: 1 }
    const qCurr: Quaternion = { x: 0, y: 0.3827, z: 0, w: 0.9239 }
    const qNext: Quaternion = { x: 0, y: 0.7071, z: 0, w: 0.7071 }

    const result = squadIntermediate(qPrev, qCurr, qNext)
    const length = Math.sqrt(
      result.x ** 2 + result.y ** 2 + result.z ** 2 + result.w ** 2
    )
    expect(length).toBeCloseTo(1, 5)
  })

  it('should be close to qCurr for smooth transitions', () => {
    // For a smooth uniform rotation, the intermediate should be close to qCurr
    const qPrev: Quaternion = { x: 0, y: 0, z: 0, w: 1 }
    const qCurr: Quaternion = { x: 0, y: 0.3827, z: 0, w: 0.9239 }
    const qNext: Quaternion = { x: 0, y: 0.7071, z: 0, w: 0.7071 }

    const result = squadIntermediate(qPrev, qCurr, qNext)

    // The intermediate should be reasonably close to qCurr
    // (exact closeness depends on the tangent calculation)
    const dotWithCurr =
      result.x * qCurr.x +
      result.y * qCurr.y +
      result.z * qCurr.z +
      result.w * qCurr.w
    expect(Math.abs(dotWithCurr)).toBeGreaterThan(0.9)
  })
})
