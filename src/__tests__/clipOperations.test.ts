import { describe, it, expect } from 'vitest'
import {
  scaleKeyframeTimes,
  offsetKeyframeTimes,
  reverseKeyframeTimes,
  calculateDuration,
} from '../utils/clipOperations'
import type { Keyframe, BoneTransform, BoneName } from '../types'

// Helper to create a simple bone transform
function createBoneTransform(): BoneTransform {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
    scale: { x: 1, y: 1, z: 1 },
  }
}

// Helper to create a keyframe with a specific time
function createKeyframe(id: string, time: number, label?: string): Keyframe {
  return {
    id,
    time,
    ...(label !== undefined && { label }),
    bones: { Hips: createBoneTransform() } as Record<BoneName, BoneTransform>,
  }
}

describe('scaleKeyframeTimes', () => {
  it('should return empty array for empty input', () => {
    const result = scaleKeyframeTimes([], 2)
    expect(result).toEqual([])
  })

  it('should scale times by factor of 2', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
      createKeyframe('kf3', 2),
    ]

    const result = scaleKeyframeTimes(keyframes, 2)

    expect(result).toHaveLength(3)
    expect(result[0].time).toBe(0)
    expect(result[1].time).toBe(2)
    expect(result[2].time).toBe(4)
  })

  it('should scale times by factor of 0.5', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 2),
      createKeyframe('kf3', 4),
    ]

    const result = scaleKeyframeTimes(keyframes, 0.5)

    expect(result).toHaveLength(3)
    expect(result[0].time).toBe(0)
    expect(result[1].time).toBe(1)
    expect(result[2].time).toBe(2)
  })

  it('should preserve keyframe IDs', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
    ]

    const result = scaleKeyframeTimes(keyframes, 2)

    expect(result[0].id).toBe('kf1')
    expect(result[1].id).toBe('kf2')
  })

  it('should preserve keyframe labels', () => {
    const keyframes = [
      createKeyframe('kf1', 0, 'Start'),
      createKeyframe('kf2', 1, 'End'),
    ]

    const result = scaleKeyframeTimes(keyframes, 2)

    expect(result[0].label).toBe('Start')
    expect(result[1].label).toBe('End')
  })

  it('should return unchanged array for scale factor of 1', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
    ]

    const result = scaleKeyframeTimes(keyframes, 1)

    expect(result[0].time).toBe(0)
    expect(result[1].time).toBe(1)
  })

  it('should return original array for invalid scale factor (0)', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
    ]

    const result = scaleKeyframeTimes(keyframes, 0)

    expect(result).toBe(keyframes)
  })

  it('should return original array for invalid scale factor (negative)', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
    ]

    const result = scaleKeyframeTimes(keyframes, -1)

    expect(result).toBe(keyframes)
  })

  it('should maintain sort order after scaling', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 0.5),
      createKeyframe('kf3', 1),
    ]

    const result = scaleKeyframeTimes(keyframes, 3)

    expect(result[0].time).toBeLessThan(result[1].time)
    expect(result[1].time).toBeLessThan(result[2].time)
  })

  it('should create new array (immutability)', () => {
    const keyframes = [createKeyframe('kf1', 1)]

    const result = scaleKeyframeTimes(keyframes, 2)

    expect(result).not.toBe(keyframes)
    expect(result[0]).not.toBe(keyframes[0])
  })
})

describe('offsetKeyframeTimes', () => {
  it('should return empty array for empty input', () => {
    const result = offsetKeyframeTimes([], 1)
    expect(result).toEqual([])
  })

  it('should offset times by positive amount', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
      createKeyframe('kf3', 2),
    ]

    const result = offsetKeyframeTimes(keyframes, 1)

    expect(result[0].time).toBe(1)
    expect(result[1].time).toBe(2)
    expect(result[2].time).toBe(3)
  })

  it('should offset times by negative amount', () => {
    const keyframes = [
      createKeyframe('kf1', 2),
      createKeyframe('kf2', 3),
      createKeyframe('kf3', 4),
    ]

    const result = offsetKeyframeTimes(keyframes, -1)

    expect(result[0].time).toBe(1)
    expect(result[1].time).toBe(2)
    expect(result[2].time).toBe(3)
  })

  it('should clamp times to 0 (no negative times)', () => {
    const keyframes = [
      createKeyframe('kf1', 1),
      createKeyframe('kf2', 2),
      createKeyframe('kf3', 3),
    ]

    const result = offsetKeyframeTimes(keyframes, -2)

    expect(result[0].time).toBe(0)
    expect(result[1].time).toBe(0)
    expect(result[2].time).toBe(1)
  })

  it('should handle zero offset', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
    ]

    const result = offsetKeyframeTimes(keyframes, 0)

    expect(result[0].time).toBe(0)
    expect(result[1].time).toBe(1)
  })

  it('should preserve keyframe IDs', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
    ]

    const result = offsetKeyframeTimes(keyframes, 1)

    expect(result[0].id).toBe('kf1')
    expect(result[1].id).toBe('kf2')
  })

  it('should preserve keyframe labels', () => {
    const keyframes = [
      createKeyframe('kf1', 0, 'Start'),
      createKeyframe('kf2', 1, 'End'),
    ]

    const result = offsetKeyframeTimes(keyframes, 1)

    expect(result[0].label).toBe('Start')
    expect(result[1].label).toBe('End')
  })

  it('should maintain sort order after offset', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
      createKeyframe('kf3', 2),
    ]

    const result = offsetKeyframeTimes(keyframes, 5)

    expect(result[0].time).toBeLessThanOrEqual(result[1].time)
    expect(result[1].time).toBeLessThanOrEqual(result[2].time)
  })

  it('should create new array (immutability)', () => {
    const keyframes = [createKeyframe('kf1', 1)]

    const result = offsetKeyframeTimes(keyframes, 1)

    expect(result).not.toBe(keyframes)
    expect(result[0]).not.toBe(keyframes[0])
  })

  it('should handle fractional offset', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
    ]

    const result = offsetKeyframeTimes(keyframes, 0.5)

    expect(result[0].time).toBe(0.5)
    expect(result[1].time).toBe(1.5)
  })
})

describe('reverseKeyframeTimes', () => {
  it('should return empty array for empty input', () => {
    const result = reverseKeyframeTimes([])
    expect(result).toEqual([])
  })

  it('should handle single keyframe', () => {
    const keyframes = [createKeyframe('kf1', 0)]

    const result = reverseKeyframeTimes(keyframes)

    expect(result).toHaveLength(1)
    expect(result[0].time).toBe(0)
    expect(result[0].id).toBe('kf1')
  })

  it('should reverse two keyframes', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 2),
    ]

    const result = reverseKeyframeTimes(keyframes)

    // kf1 was at 0, should now be at 2 - 0 = 2
    // kf2 was at 2, should now be at 2 - 2 = 0
    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('kf2')
    expect(result[0].time).toBe(0)
    expect(result[1].id).toBe('kf1')
    expect(result[1].time).toBe(2)
  })

  it('should reverse multiple keyframes correctly', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
      createKeyframe('kf3', 2),
      createKeyframe('kf4', 4),
    ]

    const result = reverseKeyframeTimes(keyframes)

    // Duration is 4
    // kf1: 0 -> 4 - 0 = 4
    // kf2: 1 -> 4 - 1 = 3
    // kf3: 2 -> 4 - 2 = 2
    // kf4: 4 -> 4 - 4 = 0
    expect(result).toHaveLength(4)
    expect(result[0].id).toBe('kf4')
    expect(result[0].time).toBe(0)
    expect(result[1].id).toBe('kf3')
    expect(result[1].time).toBe(2)
    expect(result[2].id).toBe('kf2')
    expect(result[2].time).toBe(3)
    expect(result[3].id).toBe('kf1')
    expect(result[3].time).toBe(4)
  })

  it('should preserve keyframe IDs', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 2),
    ]

    const result = reverseKeyframeTimes(keyframes)

    const ids = result.map((kf) => kf.id)
    expect(ids).toContain('kf1')
    expect(ids).toContain('kf2')
  })

  it('should preserve keyframe labels', () => {
    const keyframes = [
      createKeyframe('kf1', 0, 'Start'),
      createKeyframe('kf2', 2, 'End'),
    ]

    const result = reverseKeyframeTimes(keyframes)

    const startKf = result.find((kf) => kf.id === 'kf1')
    const endKf = result.find((kf) => kf.id === 'kf2')
    expect(startKf?.label).toBe('Start')
    expect(endKf?.label).toBe('End')
  })

  it('should maintain sort order (ascending by time)', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
      createKeyframe('kf3', 3),
    ]

    const result = reverseKeyframeTimes(keyframes)

    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].time).toBeLessThanOrEqual(result[i + 1].time)
    }
  })

  it('should create new array (immutability)', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 2),
    ]

    const result = reverseKeyframeTimes(keyframes)

    expect(result).not.toBe(keyframes)
    expect(result[0]).not.toBe(keyframes[0])
    expect(result[1]).not.toBe(keyframes[1])
  })

  it('should preserve duration after reversal', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
      createKeyframe('kf3', 5),
    ]

    const originalDuration = calculateDuration(keyframes)
    const result = reverseKeyframeTimes(keyframes)
    const newDuration = calculateDuration(result)

    expect(newDuration).toBe(originalDuration)
  })
})

describe('calculateDuration', () => {
  it('should return 0 for empty array', () => {
    const result = calculateDuration([])
    expect(result).toBe(0)
  })

  it('should return time of single keyframe', () => {
    const keyframes = [createKeyframe('kf1', 2.5)]

    const result = calculateDuration(keyframes)

    expect(result).toBe(2.5)
  })

  it('should return max time for multiple keyframes', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 1),
      createKeyframe('kf3', 3),
    ]

    const result = calculateDuration(keyframes)

    expect(result).toBe(3)
  })

  it('should handle unsorted keyframes', () => {
    const keyframes = [
      createKeyframe('kf1', 2),
      createKeyframe('kf2', 5),
      createKeyframe('kf3', 1),
    ]

    const result = calculateDuration(keyframes)

    expect(result).toBe(5)
  })

  it('should handle keyframes starting at time 0', () => {
    const keyframes = [
      createKeyframe('kf1', 0),
      createKeyframe('kf2', 0),
    ]

    const result = calculateDuration(keyframes)

    expect(result).toBe(0)
  })

  it('should handle fractional times', () => {
    const keyframes = [
      createKeyframe('kf1', 0.5),
      createKeyframe('kf2', 1.75),
      createKeyframe('kf3', 2.25),
    ]

    const result = calculateDuration(keyframes)

    expect(result).toBe(2.25)
  })
})
