import { describe, it, expect } from 'vitest';
import {
  vector3Lerp,
  quaternionSlerp,
  quaternionNormalize,
  quaternionDot,
} from '../utils/math';
import type { Vector3, Quaternion } from '../types/math';

describe('vector3Lerp', () => {
  it('should return first vector when t=0', () => {
    const a: Vector3 = { x: 0, y: 0, z: 0 };
    const b: Vector3 = { x: 10, y: 20, z: 30 };
    const result = vector3Lerp(a, b, 0);
    expect(result).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('should return second vector when t=1', () => {
    const a: Vector3 = { x: 0, y: 0, z: 0 };
    const b: Vector3 = { x: 10, y: 20, z: 30 };
    const result = vector3Lerp(a, b, 1);
    expect(result).toEqual({ x: 10, y: 20, z: 30 });
  });

  it('should return midpoint when t=0.5', () => {
    const a: Vector3 = { x: 0, y: 0, z: 0 };
    const b: Vector3 = { x: 10, y: 20, z: 30 };
    const result = vector3Lerp(a, b, 0.5);
    expect(result).toEqual({ x: 5, y: 10, z: 15 });
  });

  it('should handle negative values', () => {
    const a: Vector3 = { x: -10, y: -20, z: -30 };
    const b: Vector3 = { x: 10, y: 20, z: 30 };
    const result = vector3Lerp(a, b, 0.5);
    expect(result).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('should extrapolate beyond t=1', () => {
    const a: Vector3 = { x: 0, y: 0, z: 0 };
    const b: Vector3 = { x: 10, y: 10, z: 10 };
    const result = vector3Lerp(a, b, 2);
    expect(result).toEqual({ x: 20, y: 20, z: 20 });
  });

  it('should extrapolate below t=0', () => {
    const a: Vector3 = { x: 10, y: 10, z: 10 };
    const b: Vector3 = { x: 20, y: 20, z: 20 };
    const result = vector3Lerp(a, b, -1);
    expect(result).toEqual({ x: 0, y: 0, z: 0 });
  });
});

describe('quaternionDot', () => {
  it('should compute dot product correctly', () => {
    const a: Quaternion = { x: 1, y: 0, z: 0, w: 0 };
    const b: Quaternion = { x: 1, y: 0, z: 0, w: 0 };
    expect(quaternionDot(a, b)).toBe(1);
  });

  it('should return 0 for orthogonal quaternions', () => {
    const a: Quaternion = { x: 1, y: 0, z: 0, w: 0 };
    const b: Quaternion = { x: 0, y: 1, z: 0, w: 0 };
    expect(quaternionDot(a, b)).toBe(0);
  });

  it('should return 1 for identity quaternion dotted with itself', () => {
    const identity: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
    expect(quaternionDot(identity, identity)).toBe(1);
  });

  it('should handle general case', () => {
    const a: Quaternion = { x: 1, y: 2, z: 3, w: 4 };
    const b: Quaternion = { x: 5, y: 6, z: 7, w: 8 };
    // 1*5 + 2*6 + 3*7 + 4*8 = 5 + 12 + 21 + 32 = 70
    expect(quaternionDot(a, b)).toBe(70);
  });
});

describe('quaternionNormalize', () => {
  it('should normalize a quaternion to unit length', () => {
    const q: Quaternion = { x: 0, y: 0, z: 0, w: 2 };
    const result = quaternionNormalize(q);
    expect(result).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  });

  it('should keep already normalized quaternion unchanged', () => {
    const q: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
    const result = quaternionNormalize(q);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(0);
    expect(result.w).toBeCloseTo(1);
  });

  it('should normalize general quaternion', () => {
    const q: Quaternion = { x: 1, y: 1, z: 1, w: 1 };
    const result = quaternionNormalize(q);
    const length = Math.sqrt(
      result.x ** 2 + result.y ** 2 + result.z ** 2 + result.w ** 2
    );
    expect(length).toBeCloseTo(1);
  });

  it('should return identity for zero quaternion', () => {
    const q: Quaternion = { x: 0, y: 0, z: 0, w: 0 };
    const result = quaternionNormalize(q);
    expect(result).toEqual({ x: 0, y: 0, z: 0, w: 1 });
  });

  it('should handle negative values', () => {
    const q: Quaternion = { x: -1, y: -1, z: -1, w: -1 };
    const result = quaternionNormalize(q);
    const length = Math.sqrt(
      result.x ** 2 + result.y ** 2 + result.z ** 2 + result.w ** 2
    );
    expect(length).toBeCloseTo(1);
  });
});

describe('quaternionSlerp', () => {
  it('should return first quaternion when t=0', () => {
    const a: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
    const b: Quaternion = { x: 0, y: 0.7071, z: 0, w: 0.7071 };
    const result = quaternionSlerp(a, b, 0);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
    expect(result.z).toBeCloseTo(0);
    expect(result.w).toBeCloseTo(1);
  });

  it('should return second quaternion when t=1', () => {
    const a: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
    const b: Quaternion = { x: 0, y: 0.7071, z: 0, w: 0.7071 };
    const result = quaternionSlerp(a, b, 1);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0.7071, 3);
    expect(result.z).toBeCloseTo(0);
    expect(result.w).toBeCloseTo(0.7071, 3);
  });

  it('should return interpolated quaternion at t=0.5', () => {
    const a: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
    // 90 degree rotation around Y
    const b: Quaternion = { x: 0, y: 0.7071067811865476, z: 0, w: 0.7071067811865476 };
    const result = quaternionSlerp(a, b, 0.5);
    // Should be ~45 degree rotation around Y
    const length = Math.sqrt(
      result.x ** 2 + result.y ** 2 + result.z ** 2 + result.w ** 2
    );
    expect(length).toBeCloseTo(1);
  });

  it('should take the shortest path (negate if dot < 0)', () => {
    const a: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
    // Same as a but negated (represents same rotation)
    const b: Quaternion = { x: 0, y: 0, z: 0, w: -1 };
    const result = quaternionSlerp(a, b, 0.5);
    // Should stay near identity since they represent the same rotation
    expect(result.w).toBeCloseTo(1, 1);
  });

  it('should handle nearly identical quaternions', () => {
    const a: Quaternion = { x: 0, y: 0, z: 0, w: 1 };
    const b: Quaternion = { x: 0.0001, y: 0, z: 0, w: 0.99999995 };
    const result = quaternionSlerp(a, b, 0.5);
    const length = Math.sqrt(
      result.x ** 2 + result.y ** 2 + result.z ** 2 + result.w ** 2
    );
    expect(length).toBeCloseTo(1);
  });

  it('should return normalized quaternion', () => {
    const a: Quaternion = { x: 0.5, y: 0.5, z: 0.5, w: 0.5 };
    const b: Quaternion = { x: -0.5, y: 0.5, z: 0.5, w: 0.5 };
    const result = quaternionSlerp(a, b, 0.3);
    const length = Math.sqrt(
      result.x ** 2 + result.y ** 2 + result.z ** 2 + result.w ** 2
    );
    expect(length).toBeCloseTo(1);
  });
});
