import * as THREE from 'three'
import type { BoneName, BoneTransform } from '../types'
import { BONE_NAMES } from '../constants/skeleton'

export interface ParsedSkeleton {
  bones: Map<BoneName, THREE.Bone>
  bindPose: Record<BoneName, BoneTransform>
  skinnedMesh: THREE.SkinnedMesh | null
}

/**
 * Find the skeleton in a loaded GLTF scene
 * Traverses the scene to find SkinnedMesh and extracts skeleton data
 */
export function parseSkeletonFromScene(
  scene: THREE.Object3D
): ParsedSkeleton | null {
  let skinnedMesh: THREE.SkinnedMesh | null = null

  // Traverse scene to find the first SkinnedMesh
  scene.traverse((object) => {
    if (!skinnedMesh && object instanceof THREE.SkinnedMesh) {
      skinnedMesh = object
    }
  })

  if (!skinnedMesh) {
    console.warn('No SkinnedMesh found in scene')
    return null
  }

  // TypeScript needs explicit typing here due to closure in traverse
  const mesh = skinnedMesh as THREE.SkinnedMesh
  const skeleton = mesh.skeleton
  if (!skeleton) {
    console.warn('SkinnedMesh has no skeleton')
    return null
  }
  const bones = new Map<BoneName, THREE.Bone>()

  // Create a set of valid bone names for quick lookup
  const validBoneNames = new Set<string>(BONE_NAMES)

  // Map skeleton bones to our BoneName types
  for (const bone of skeleton.bones) {
    if (validBoneNames.has(bone.name)) {
      bones.set(bone.name as BoneName, bone)
    }
  }

  // Extract bind pose from the bones
  const bindPose = extractBindPose(bones)

  return {
    bones,
    bindPose,
    skinnedMesh,
  }
}

/**
 * Extract bind pose (rest position) from bones
 * Captures the current position, rotation, and scale of each bone
 */
export function extractBindPose(
  bones: Map<BoneName, THREE.Bone>
): Record<BoneName, BoneTransform> {
  const bindPose: Partial<Record<BoneName, BoneTransform>> = {}

  bones.forEach((bone, boneName) => {
    bindPose[boneName] = {
      position: {
        x: bone.position.x,
        y: bone.position.y,
        z: bone.position.z,
      },
      rotation: {
        x: bone.quaternion.x,
        y: bone.quaternion.y,
        z: bone.quaternion.z,
        w: bone.quaternion.w,
      },
      scale: {
        x: bone.scale.x,
        y: bone.scale.y,
        z: bone.scale.z,
      },
    }
  })

  return bindPose as Record<BoneName, BoneTransform>
}

/**
 * Validate that the skeleton has the expected Meshy bone structure
 * Returns validation result and list of missing bones
 */
export function validateSkeleton(bones: Map<BoneName, THREE.Bone>): {
  valid: boolean
  missing: BoneName[]
} {
  const missing: BoneName[] = []

  for (const boneName of BONE_NAMES) {
    if (!bones.has(boneName)) {
      missing.push(boneName)
    }
  }

  // Consider skeleton valid if it has at least the essential bones
  // Essential bones: Hips, Spine chain, and at least one limb
  const essentialBones: BoneName[] = ['Hips', 'Spine', 'Spine01', 'Spine02']
  const hasEssentials = essentialBones.every((bone) => bones.has(bone))

  return {
    valid: hasEssentials && missing.length < BONE_NAMES.length / 2,
    missing,
  }
}

/**
 * Helper function to get a bone by name from the parsed skeleton
 */
export function getBoneByName(
  skeleton: ParsedSkeleton,
  boneName: BoneName
): THREE.Bone | undefined {
  return skeleton.bones.get(boneName)
}

/**
 * Helper function to check if a bone name is valid
 */
export function isValidBoneName(name: string): name is BoneName {
  return BONE_NAMES.includes(name as BoneName)
}
