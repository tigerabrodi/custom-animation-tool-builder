import { useCallback, useRef, useState } from 'react'
import * as THREE from 'three'
import { parseSkeletonFromScene } from '../services/skeletonParser'
import type {
  BoneName,
  BoneTransform,
  CoordinateSpace,
  TransformMode,
} from '../types'

export interface SkeletonEditorState {
  // Skeleton data
  bones: Map<BoneName, THREE.Bone> | null
  bindPose: Record<BoneName, BoneTransform> | null
  skinnedMesh: THREE.SkinnedMesh | null

  // Selection
  selectedBone: BoneName | null

  // Transform settings
  transformMode: TransformMode
  coordinateSpace: CoordinateSpace
  hipsLocked: boolean

  // Actions
  setSelectedBone: (bone: BoneName | null) => void
  setTransformMode: (mode: TransformMode) => void
  setCoordinateSpace: (space: CoordinateSpace) => void
  setHipsLocked: (locked: boolean) => void

  // Skeleton actions
  initializeSkeleton: (scene: THREE.Object3D) => boolean
  resetBone: (bone: BoneName) => void
  resetAllBones: () => void
  getBoneTransform: (bone: BoneName) => BoneTransform | null
  setBoneTransform: (bone: BoneName, transform: Partial<BoneTransform>) => void
}

export function useSkeletonEditor(): SkeletonEditorState {
  // Skeleton data - using refs for THREE objects to avoid unnecessary re-renders
  const bonesRef = useRef<Map<BoneName, THREE.Bone> | null>(null)
  const bindPoseRef = useRef<Record<BoneName, BoneTransform> | null>(null)
  const skinnedMeshRef = useRef<THREE.SkinnedMesh | null>(null)

  // State that triggers re-renders
  const [bonesState, setBonesState] = useState<Map<
    BoneName,
    THREE.Bone
  > | null>(null)
  const [bindPoseState, setBindPoseState] = useState<Record<
    BoneName,
    BoneTransform
  > | null>(null)
  const [skinnedMeshState, setSkinnedMeshState] =
    useState<THREE.SkinnedMesh | null>(null)

  // Selection state
  const [selectedBone, setSelectedBone] = useState<BoneName | null>(null)

  // Transform settings
  const [transformMode, setTransformMode] = useState<TransformMode>('ROTATE')
  const [coordinateSpace, setCoordinateSpace] =
    useState<CoordinateSpace>('LOCAL')
  const [hipsLocked, setHipsLocked] = useState<boolean>(true)

  /**
   * Initialize skeleton from a Three.js scene
   * Returns true if skeleton was successfully parsed
   */
  const initializeSkeleton = useCallback((scene: THREE.Object3D): boolean => {
    const parsed = parseSkeletonFromScene(scene)

    if (!parsed) {
      console.error('Failed to parse skeleton from scene')
      return false
    }

    // Update refs
    bonesRef.current = parsed.bones
    bindPoseRef.current = parsed.bindPose
    skinnedMeshRef.current = parsed.skinnedMesh

    // Update state to trigger re-render
    setBonesState(parsed.bones)
    setBindPoseState(parsed.bindPose)
    setSkinnedMeshState(parsed.skinnedMesh)

    // Clear selection when loading new skeleton
    setSelectedBone(null)

    console.log(`Skeleton initialized with ${parsed.bones.size} bones`)
    return true
  }, [])

  /**
   * Reset a single bone to its bind pose
   */
  const resetBone = useCallback((boneName: BoneName) => {
    const bones = bonesRef.current
    const bindPose = bindPoseRef.current

    if (!bones || !bindPose) {
      console.warn('No skeleton loaded')
      return
    }

    const bone = bones.get(boneName)
    const pose = bindPose[boneName]

    if (!bone || !pose) {
      console.warn(`Bone "${boneName}" not found`)
      return
    }

    // Reset position
    bone.position.set(pose.position.x, pose.position.y, pose.position.z)

    // Reset rotation (quaternion)
    bone.quaternion.set(
      pose.rotation.x,
      pose.rotation.y,
      pose.rotation.z,
      pose.rotation.w
    )

    // Reset scale
    bone.scale.set(pose.scale.x, pose.scale.y, pose.scale.z)

    // Update matrix
    bone.updateMatrix()
    bone.updateMatrixWorld(true)
  }, [])

  /**
   * Reset all bones to their bind pose
   */
  const resetAllBones = useCallback(() => {
    const bones = bonesRef.current
    const bindPose = bindPoseRef.current

    if (!bones || !bindPose) {
      console.warn('No skeleton loaded')
      return
    }

    bones.forEach((bone, boneName) => {
      const pose = bindPose[boneName]
      if (pose) {
        bone.position.set(pose.position.x, pose.position.y, pose.position.z)
        bone.quaternion.set(
          pose.rotation.x,
          pose.rotation.y,
          pose.rotation.z,
          pose.rotation.w
        )
        bone.scale.set(pose.scale.x, pose.scale.y, pose.scale.z)
        bone.updateMatrix()
      }
    })

    // Update the entire skeleton
    const skinnedMesh = skinnedMeshRef.current
    if (skinnedMesh) {
      skinnedMesh.skeleton.update()
    }
  }, [])

  /**
   * Get the current transform of a bone
   */
  const getBoneTransform = useCallback(
    (boneName: BoneName): BoneTransform | null => {
      const bones = bonesRef.current

      if (!bones) {
        return null
      }

      const bone = bones.get(boneName)
      if (!bone) {
        return null
      }

      return {
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
    },
    []
  )

  /**
   * Set the transform of a bone
   * Respects hipsLocked setting for the Hips bone (only blocks position changes)
   */
  const setBoneTransform = useCallback(
    (boneName: BoneName, transform: Partial<BoneTransform>) => {
      const bones = bonesRef.current

      if (!bones) {
        console.warn('No skeleton loaded')
        return
      }

      const bone = bones.get(boneName)
      if (!bone) {
        console.warn(`Bone "${boneName}" not found`)
        return
      }

      // Apply position if provided (respects hipsLocked - only blocks position, not rotation)
      if (transform.position) {
        if (boneName === 'Hips' && hipsLocked) {
          console.warn('Hips position is locked')
        } else {
          bone.position.set(
            transform.position.x,
            transform.position.y,
            transform.position.z
          )
        }
      }

      // Apply rotation if provided
      if (transform.rotation) {
        bone.quaternion.set(
          transform.rotation.x,
          transform.rotation.y,
          transform.rotation.z,
          transform.rotation.w
        )
      }

      // Apply scale if provided
      if (transform.scale) {
        bone.scale.set(transform.scale.x, transform.scale.y, transform.scale.z)
      }

      // Update the bone's matrix
      bone.updateMatrix()
      bone.updateMatrixWorld(true)

      // Update the skeleton to reflect changes in the mesh
      const skinnedMesh = skinnedMeshRef.current
      if (skinnedMesh) {
        skinnedMesh.skeleton.update()
      }
    },
    [hipsLocked]
  )

  return {
    // Skeleton data (from state for reactivity)
    bones: bonesState,
    bindPose: bindPoseState,
    skinnedMesh: skinnedMeshState,

    // Selection
    selectedBone,

    // Transform settings
    transformMode,
    coordinateSpace,
    hipsLocked,

    // Actions
    setSelectedBone,
    setTransformMode,
    setCoordinateSpace,
    setHipsLocked,

    // Skeleton actions
    initializeSkeleton,
    resetBone,
    resetAllBones,
    getBoneTransform,
    setBoneTransform,
  }
}
