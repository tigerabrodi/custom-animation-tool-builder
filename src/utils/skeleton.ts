import type { BoneName } from '../types';
import { SKELETON_HIERARCHY, BONE_NAMES } from '../constants/skeleton';

/**
 * Get all direct children of a bone in the skeleton hierarchy
 * @param bone - The parent bone name
 * @returns Array of bone names that are direct children of the given bone
 */
export function getBoneChildren(bone: BoneName): BoneName[] {
  return BONE_NAMES.filter(
    (boneName) => SKELETON_HIERARCHY[boneName] === bone
  );
}

/**
 * Check if a bone is a leaf node (has no children)
 * @param bone - The bone name to check
 * @returns True if the bone has no children
 */
export function isBoneLeaf(bone: BoneName): boolean {
  return getBoneChildren(bone).length === 0;
}
