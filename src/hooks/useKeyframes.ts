import { useCallback, useState } from 'react'
import * as THREE from 'three'
import type { BoneName, BoneTransform, Keyframe } from '../types'

export interface KeyframesState {
  // State
  keyframes: Keyframe[]
  selectedKeyframeId: string | null

  // Actions
  addKeyframe: (time: number, bones: Map<BoneName, THREE.Bone>) => string
  deleteKeyframe: (id: string) => void
  updateKeyframe: (id: string, bones: Map<BoneName, THREE.Bone>) => void
  updateKeyframeTime: (id: string, newTime: number) => void
  selectKeyframe: (id: string | null) => void
  getKeyframeById: (id: string) => Keyframe | undefined
  duplicateKeyframe: (id: string, newTime: number) => string | null
  updateKeyframeLabel: (id: string, label: string | undefined) => void
  getKeyframeTimes: () => number[]
}

/**
 * Extracts BoneTransform from a THREE.Bone
 */
function extractBoneTransform(bone: THREE.Bone): BoneTransform {
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
}

/**
 * Captures the current pose from all bones
 */
function capturePose(
  bones: Map<BoneName, THREE.Bone>
): Record<BoneName, BoneTransform> {
  const pose: Partial<Record<BoneName, BoneTransform>> = {}

  bones.forEach((bone, boneName) => {
    pose[boneName] = extractBoneTransform(bone)
  })

  return pose as Record<BoneName, BoneTransform>
}

/**
 * Sorts keyframes by time ascending
 */
function sortKeyframes(keyframes: Keyframe[]): Keyframe[] {
  return [...keyframes].sort((a, b) => a.time - b.time)
}

/**
 * Hook for managing keyframes in the animation editor.
 * Keyframes are always kept sorted by time ascending.
 */
export function useKeyframes(): KeyframesState {
  const [keyframes, setKeyframes] = useState<Keyframe[]>([])
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(
    null
  )

  /**
   * Adds a new keyframe at the specified time, capturing the current bone transforms.
   * Returns the ID of the newly created keyframe.
   */
  const addKeyframe = useCallback(
    (time: number, bones: Map<BoneName, THREE.Bone>): string => {
      const id = crypto.randomUUID()
      const newKeyframe: Keyframe = {
        id,
        time,
        bones: capturePose(bones),
      }

      setKeyframes((prev) => sortKeyframes([...prev, newKeyframe]))

      return id
    },
    []
  )

  /**
   * Deletes a keyframe by its ID.
   * If the deleted keyframe was selected, clears the selection.
   */
  const deleteKeyframe = useCallback(
    (id: string) => {
      setKeyframes((prev) => prev.filter((kf) => kf.id !== id))

      // Clear selection if the deleted keyframe was selected
      if (selectedKeyframeId === id) {
        setSelectedKeyframeId(null)
      }
    },
    [selectedKeyframeId]
  )

  /**
   * Updates an existing keyframe by re-capturing the bone transforms.
   * The keyframe's time remains unchanged.
   */
  const updateKeyframe = useCallback(
    (id: string, bones: Map<BoneName, THREE.Bone>) => {
      setKeyframes((prev) =>
        prev.map((kf) => {
          if (kf.id === id) {
            return {
              ...kf,
              bones: capturePose(bones),
            }
          }
          return kf
        })
      )
    },
    []
  )

  /**
   * Updates an existing keyframe's time.
   * Re-sorts the keyframes after updating.
   */
  const updateKeyframeTime = useCallback((id: string, newTime: number) => {
    setKeyframes((prev) =>
      sortKeyframes(
        prev.map((kf) => {
          if (kf.id === id) {
            return { ...kf, time: newTime }
          }
          return kf
        })
      )
    )
  }, [])

  /**
   * Selects a keyframe by ID, or clears selection if null is passed.
   */
  const selectKeyframe = useCallback((id: string | null) => {
    setSelectedKeyframeId(id)
  }, [])

  /**
   * Gets a keyframe by its ID.
   */
  const getKeyframeById = useCallback(
    (id: string): Keyframe | undefined => {
      return keyframes.find((kf) => kf.id === id)
    },
    [keyframes]
  )

  /**
   * Duplicates an existing keyframe to a new time.
   * Returns the ID of the new keyframe, or null if the source keyframe doesn't exist.
   */
  const duplicateKeyframe = useCallback(
    (id: string, newTime: number): string | null => {
      const sourceKeyframe = keyframes.find((kf) => kf.id === id)
      if (!sourceKeyframe) {
        return null
      }

      const newId = crypto.randomUUID()
      const duplicatedKeyframe: Keyframe = {
        id: newId,
        time: newTime,
        label: sourceKeyframe.label,
        bones: { ...sourceKeyframe.bones },
      }

      setKeyframes((prev) => sortKeyframes([...prev, duplicatedKeyframe]))

      return newId
    },
    [keyframes]
  )

  /**
   * Updates an existing keyframe's label.
   * Pass undefined to remove the label.
   */
  const updateKeyframeLabel = useCallback(
    (id: string, label: string | undefined) => {
      setKeyframes((prev) =>
        prev.map((kf) => {
          if (kf.id === id) {
            if (label === undefined) {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { label: _unusedLabel, ...rest } = kf
              return rest as Keyframe
            }
            return { ...kf, label }
          }
          return kf
        })
      )
    },
    []
  )

  /**
   * Gets all keyframe times in ascending order.
   * Useful for timeline rendering.
   */
  const getKeyframeTimes = useCallback((): number[] => {
    return keyframes.map((kf) => kf.time)
  }, [keyframes])

  return {
    keyframes,
    selectedKeyframeId,
    addKeyframe,
    deleteKeyframe,
    updateKeyframe,
    updateKeyframeTime,
    selectKeyframe,
    getKeyframeById,
    duplicateKeyframe,
    updateKeyframeLabel,
    getKeyframeTimes,
  }
}
