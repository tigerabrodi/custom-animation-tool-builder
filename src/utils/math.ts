import type { Vector3, Quaternion } from '../types/math';

/**
 * Linearly interpolates between two Vector3 values.
 *
 * @param a - Start vector
 * @param b - End vector
 * @param t - Interpolation factor (0 = a, 1 = b)
 * @returns Interpolated vector
 */
export function vector3Lerp(a: Vector3, b: Vector3, t: number): Vector3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

/**
 * Computes the dot product of two quaternions.
 *
 * @param a - First quaternion
 * @param b - Second quaternion
 * @returns Dot product
 */
export function quaternionDot(a: Quaternion, b: Quaternion): number {
  return a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
}

/**
 * Normalizes a quaternion to unit length.
 *
 * @param q - Quaternion to normalize
 * @returns Normalized quaternion
 */
export function quaternionNormalize(q: Quaternion): Quaternion {
  const length = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);

  if (length === 0) {
    // Return identity quaternion for zero-length input
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  return {
    x: q.x / length,
    y: q.y / length,
    z: q.z / length,
    w: q.w / length,
  };
}

/**
 * Spherical linear interpolation between two quaternions.
 * Takes the shortest path on the 4D hypersphere.
 *
 * @param a - Start quaternion
 * @param b - End quaternion
 * @param t - Interpolation factor (0 = a, 1 = b)
 * @returns Interpolated quaternion (normalized)
 */
export function quaternionSlerp(a: Quaternion, b: Quaternion, t: number): Quaternion {
  // Compute dot product
  let dot = quaternionDot(a, b);

  // If the dot product is negative, negate one quaternion to take the shorter path
  let bx = b.x;
  let by = b.y;
  let bz = b.z;
  let bw = b.w;

  if (dot < 0) {
    dot = -dot;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }

  // If the quaternions are very close, use linear interpolation to avoid numerical issues
  const DOT_THRESHOLD = 0.9995;
  if (dot > DOT_THRESHOLD) {
    const result: Quaternion = {
      x: a.x + (bx - a.x) * t,
      y: a.y + (by - a.y) * t,
      z: a.z + (bz - a.z) * t,
      w: a.w + (bw - a.w) * t,
    };
    return quaternionNormalize(result);
  }

  // Compute the angle between the quaternions
  const theta0 = Math.acos(dot);
  const theta = theta0 * t;

  const sinTheta0 = Math.sin(theta0);
  const sinTheta = Math.sin(theta);

  const s0 = Math.cos(theta) - (dot * sinTheta) / sinTheta0;
  const s1 = sinTheta / sinTheta0;

  return {
    x: a.x * s0 + bx * s1,
    y: a.y * s0 + by * s1,
    z: a.z * s0 + bz * s1,
    w: a.w * s0 + bw * s1,
  };
}
