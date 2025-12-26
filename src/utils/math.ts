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

/**
 * Catmull-Rom interpolation for a single value.
 * Uses the standard Catmull-Rom spline formula with tension = 0.5.
 *
 * @param p0 - Value at point before start
 * @param p1 - Value at start point
 * @param p2 - Value at end point
 * @param p3 - Value at point after end
 * @param t - Interpolation factor (0 = p1, 1 = p2)
 * @returns Interpolated value
 */
export function catmullRomInterpolate(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number
): number {
  const t2 = t * t;
  const t3 = t2 * t;

  // Catmull-Rom spline coefficients
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * Catmull-Rom interpolation for Vector3.
 *
 * @param v0 - Vector at point before start
 * @param v1 - Vector at start point
 * @param v2 - Vector at end point
 * @param v3 - Vector at point after end
 * @param t - Interpolation factor (0 = v1, 1 = v2)
 * @returns Interpolated vector
 */
export function catmullRomVector3(
  v0: Vector3,
  v1: Vector3,
  v2: Vector3,
  v3: Vector3,
  t: number
): Vector3 {
  return {
    x: catmullRomInterpolate(v0.x, v1.x, v2.x, v3.x, t),
    y: catmullRomInterpolate(v0.y, v1.y, v2.y, v3.y, t),
    z: catmullRomInterpolate(v0.z, v1.z, v2.z, v3.z, t),
  };
}

/**
 * Multiplies two quaternions.
 *
 * @param a - First quaternion
 * @param b - Second quaternion
 * @returns Product quaternion (a * b)
 */
export function quaternionMultiply(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  };
}

/**
 * Computes the conjugate (inverse for unit quaternions) of a quaternion.
 *
 * @param q - Quaternion to conjugate
 * @returns Conjugate quaternion
 */
export function quaternionConjugate(q: Quaternion): Quaternion {
  return {
    x: -q.x,
    y: -q.y,
    z: -q.z,
    w: q.w,
  };
}

/**
 * Scales a quaternion by a scalar value.
 *
 * @param q - Quaternion to scale
 * @param s - Scalar value
 * @returns Scaled quaternion
 */
export function quaternionScale(q: Quaternion, s: number): Quaternion {
  return {
    x: q.x * s,
    y: q.y * s,
    z: q.z * s,
    w: q.w * s,
  };
}

/**
 * Adds two quaternions component-wise.
 *
 * @param a - First quaternion
 * @param b - Second quaternion
 * @returns Sum quaternion
 */
export function quaternionAdd(a: Quaternion, b: Quaternion): Quaternion {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
    z: a.z + b.z,
    w: a.w + b.w,
  };
}

/**
 * Computes the natural logarithm of a unit quaternion.
 * Used for squad interpolation.
 *
 * @param q - Unit quaternion
 * @returns Logarithm (pure quaternion)
 */
export function quaternionLog(q: Quaternion): Quaternion {
  // For unit quaternions, q = [cos(theta), sin(theta) * axis]
  // log(q) = [0, theta * axis]
  const sinAngle = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z);

  if (sinAngle < 0.0001) {
    // Near identity, return zero quaternion
    return { x: 0, y: 0, z: 0, w: 0 };
  }

  const angle = Math.atan2(sinAngle, q.w);
  const scale = angle / sinAngle;

  return {
    x: q.x * scale,
    y: q.y * scale,
    z: q.z * scale,
    w: 0,
  };
}

/**
 * Computes the exponential of a pure quaternion.
 * Used for squad interpolation.
 *
 * @param q - Pure quaternion (w should be 0 or near 0)
 * @returns Exponential (unit quaternion)
 */
export function quaternionExp(q: Quaternion): Quaternion {
  // For pure quaternion q = [0, v], exp(q) = [cos(|v|), sin(|v|) * v/|v|]
  const angle = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z);

  if (angle < 0.0001) {
    // Near zero, return identity
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  const sinAngle = Math.sin(angle);
  const scale = sinAngle / angle;

  return {
    x: q.x * scale,
    y: q.y * scale,
    z: q.z * scale,
    w: Math.cos(angle),
  };
}

/**
 * Calculates the intermediate control quaternion for squad interpolation.
 * This is used to create smooth spline curves through quaternion keyframes.
 *
 * @param qPrev - Previous quaternion
 * @param qCurr - Current quaternion
 * @param qNext - Next quaternion
 * @returns Intermediate control quaternion
 */
export function squadIntermediate(
  qPrev: Quaternion,
  qCurr: Quaternion,
  qNext: Quaternion
): Quaternion {
  // Ensure quaternions are in the same hemisphere as qCurr
  let prev = qPrev;
  let next = qNext;

  if (quaternionDot(qCurr, qPrev) < 0) {
    prev = { x: -qPrev.x, y: -qPrev.y, z: -qPrev.z, w: -qPrev.w };
  }
  if (quaternionDot(qCurr, qNext) < 0) {
    next = { x: -qNext.x, y: -qNext.y, z: -qNext.z, w: -qNext.w };
  }

  // s_i = q_i * exp(-(log(q_i^-1 * q_{i-1}) + log(q_i^-1 * q_{i+1})) / 4)
  const qCurrInv = quaternionConjugate(qCurr);
  const logPrev = quaternionLog(quaternionMultiply(qCurrInv, prev));
  const logNext = quaternionLog(quaternionMultiply(qCurrInv, next));

  const sum: Quaternion = {
    x: -(logPrev.x + logNext.x) / 4,
    y: -(logPrev.y + logNext.y) / 4,
    z: -(logPrev.z + logNext.z) / 4,
    w: 0,
  };

  return quaternionNormalize(quaternionMultiply(qCurr, quaternionExp(sum)));
}

/**
 * Squad (Spherical Quadrangle) interpolation for quaternions.
 * Provides smooth cubic interpolation on the quaternion hypersphere.
 *
 * @param q0 - Quaternion before start (for tangent calculation)
 * @param q1 - Start quaternion
 * @param q2 - End quaternion
 * @param q3 - Quaternion after end (for tangent calculation)
 * @param t - Interpolation factor (0 = q1, 1 = q2)
 * @returns Interpolated quaternion (normalized)
 */
export function squadInterpolate(
  q0: Quaternion,
  q1: Quaternion,
  q2: Quaternion,
  q3: Quaternion,
  t: number
): Quaternion {
  // Calculate intermediate control points
  const s1 = squadIntermediate(q0, q1, q2);
  const s2 = squadIntermediate(q1, q2, q3);

  // Squad(q1, q2, s1, s2, t) = slerp(slerp(q1, q2, t), slerp(s1, s2, t), 2t(1-t))
  const slerpQ = quaternionSlerp(q1, q2, t);
  const slerpS = quaternionSlerp(s1, s2, t);

  return quaternionNormalize(quaternionSlerp(slerpQ, slerpS, 2 * t * (1 - t)));
}
