import type { BoneName } from '../types/skeleton'

export const BONE_NAMES: BoneName[] = [
  'Hips',
  'LeftUpLeg',
  'LeftLeg',
  'LeftFoot',
  'LeftToeBase',
  'RightUpLeg',
  'RightLeg',
  'RightFoot',
  'RightToeBase',
  'Spine02',
  'Spine01',
  'Spine',
  'LeftShoulder',
  'LeftArm',
  'LeftForeArm',
  'LeftHand',
  'RightShoulder',
  'RightArm',
  'RightForeArm',
  'RightHand',
  'neck',
  'Head',
  'head_end',
  'headfront',
]

export const SKELETON_HIERARCHY: Record<BoneName, BoneName | null> = {
  // Root
  Hips: null,

  // Left leg chain
  LeftUpLeg: 'Hips',
  LeftLeg: 'LeftUpLeg',
  LeftFoot: 'LeftLeg',
  LeftToeBase: 'LeftFoot',

  // Right leg chain
  RightUpLeg: 'Hips',
  RightLeg: 'RightUpLeg',
  RightFoot: 'RightLeg',
  RightToeBase: 'RightFoot',

  // Spine chain (Hips → Spine02 → Spine01 → Spine)
  Spine02: 'Hips',
  Spine01: 'Spine02',
  Spine: 'Spine01',

  // Left arm chain (hangs off Spine)
  LeftShoulder: 'Spine',
  LeftArm: 'LeftShoulder',
  LeftForeArm: 'LeftArm',
  LeftHand: 'LeftForeArm',

  // Right arm chain (hangs off Spine)
  RightShoulder: 'Spine',
  RightArm: 'RightShoulder',
  RightForeArm: 'RightArm',
  RightHand: 'RightForeArm',

  // Head chain (hangs off Spine)
  neck: 'Spine',
  Head: 'neck',
  head_end: 'Head',
  headfront: 'Head',
}
