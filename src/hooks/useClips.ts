import { useCallback, useState } from 'react'
import type {
  AnimationClip,
  InterpolationMode,
  Keyframe,
} from '../types/animation'
import {
  calculateDuration,
  offsetKeyframeTimes,
  reverseKeyframeTimes,
  scaleKeyframeTimes,
} from '../utils/clipOperations'
import { validatePascalCase } from '../utils/validation'

interface UseClipsReturn {
  clips: AnimationClip[]
  activeClipId: string | null
  createClip: (name: string) => AnimationClip | null
  duplicateClip: (clipId: string, newName: string) => AnimationClip | null
  renameClip: (clipId: string, newName: string) => boolean
  deleteClip: (clipId: string) => boolean
  clearAllClips: () => void
  setActiveClip: (clipId: string | null) => void
  getActiveClip: () => AnimationClip | null
  updateClipKeyframes: (clipId: string, keyframes: Keyframe[]) => boolean
  setClipInterpolation: (clipId: string, mode: InterpolationMode) => boolean
  scaleClipDuration: (clipId: string, scaleFactor: number) => void
  offsetClipTiming: (clipId: string, offsetSeconds: number) => void
  reverseClip: (clipId: string) => void
}

export function useClips(): UseClipsReturn {
  const [clips, setClips] = useState<AnimationClip[]>([])
  const [activeClipId, setActiveClipId] = useState<string | null>(null)

  const createClip = useCallback((name: string): AnimationClip | null => {
    if (!validatePascalCase(name)) {
      return null
    }

    const newClip: AnimationClip = {
      id: crypto.randomUUID(),
      name,
      duration: 0,
      keyframes: [],
      loopMode: 'ONCE',
      interpolation: 'LINEAR',
    }

    setClips((prev) => [...prev, newClip])
    return newClip
  }, [])

  const duplicateClip = useCallback(
    (clipId: string, newName: string): AnimationClip | null => {
      if (!validatePascalCase(newName)) {
        return null
      }

      let duplicatedClip: AnimationClip | null = null
      setClips((prev) => {
        const sourceClip = prev.find((clip) => clip.id === clipId)
        if (!sourceClip) {
          return prev
        }

        duplicatedClip = {
          ...sourceClip,
          id: crypto.randomUUID(),
          name: newName,
          keyframes: sourceClip.keyframes.map((kf) => ({
            ...kf,
            id: crypto.randomUUID(),
            bones: { ...kf.bones },
          })),
        }

        return [...prev, duplicatedClip]
      })
      return duplicatedClip
    },
    []
  )

  const renameClip = useCallback((clipId: string, newName: string): boolean => {
    if (!validatePascalCase(newName)) {
      return false
    }

    let found = false
    setClips((prev) => {
      const clipExists = prev.some((clip) => clip.id === clipId)
      if (!clipExists) {
        return prev
      }
      found = true
      return prev.map((clip) =>
        clip.id === clipId ? { ...clip, name: newName } : clip
      )
    })
    return found
  }, [])

  const deleteClip = useCallback((clipId: string): boolean => {
    let found = false
    setClips((prev) => {
      const clipExists = prev.some((clip) => clip.id === clipId)
      if (!clipExists) {
        return prev
      }
      found = true
      return prev.filter((clip) => clip.id !== clipId)
    })

    // Clear active clip if we're deleting it
    if (found) {
      setActiveClipId((prevId) => (prevId === clipId ? null : prevId))
    }

    return found
  }, [])

  const clearAllClips = useCallback(() => {
    setClips([])
    setActiveClipId(null)
  }, [])

  const setActiveClip = useCallback((clipId: string | null) => {
    setActiveClipId(clipId)
  }, [])

  const getActiveClip = useCallback((): AnimationClip | null => {
    if (!activeClipId) {
      return null
    }
    return clips.find((clip) => clip.id === activeClipId) ?? null
  }, [clips, activeClipId])

  const updateClipKeyframes = useCallback(
    (clipId: string, keyframes: Keyframe[]): boolean => {
      // Calculate duration from last keyframe time
      const duration =
        keyframes.length > 0 ? Math.max(...keyframes.map((kf) => kf.time)) : 0

      let found = false
      setClips((prev) => {
        const clipExists = prev.some((clip) => clip.id === clipId)
        if (!clipExists) {
          return prev
        }
        found = true
        return prev.map((clip) =>
          clip.id === clipId ? { ...clip, keyframes, duration } : clip
        )
      })
      return found
    },
    []
  )

  const setClipInterpolation = useCallback(
    (clipId: string, mode: InterpolationMode): boolean => {
      let found = false
      setClips((prev) => {
        const clipExists = prev.some((clip) => clip.id === clipId)
        if (!clipExists) {
          return prev
        }
        found = true
        return prev.map((clip) =>
          clip.id === clipId ? { ...clip, interpolation: mode } : clip
        )
      })
      return found
    },
    []
  )

  /**
   * Scale the duration of a clip by multiplying all keyframe times by scaleFactor.
   * @param clipId - ID of the clip to scale
   * @param scaleFactor - Factor to multiply times by (must be > 0)
   */
  const scaleClipDuration = useCallback(
    (clipId: string, scaleFactor: number) => {
      if (scaleFactor <= 0) {
        return
      }

      setClips((prev) =>
        prev.map((clip) => {
          if (clip.id === clipId) {
            const scaledKeyframes = scaleKeyframeTimes(
              clip.keyframes,
              scaleFactor
            )
            const duration = calculateDuration(scaledKeyframes)
            return { ...clip, keyframes: scaledKeyframes, duration }
          }
          return clip
        })
      )
    },
    []
  )

  /**
   * Offset all keyframe times in a clip by a given number of seconds.
   * @param clipId - ID of the clip to offset
   * @param offsetSeconds - Seconds to add (can be negative, but times will be clamped to 0)
   */
  const offsetClipTiming = useCallback(
    (clipId: string, offsetSeconds: number) => {
      setClips((prev) =>
        prev.map((clip) => {
          if (clip.id === clipId) {
            const offsetKeyframes = offsetKeyframeTimes(
              clip.keyframes,
              offsetSeconds
            )
            const duration = calculateDuration(offsetKeyframes)
            return { ...clip, keyframes: offsetKeyframes, duration }
          }
          return clip
        })
      )
    },
    []
  )

  /**
   * Reverse the keyframe timing in a clip (first becomes last, last becomes first).
   * @param clipId - ID of the clip to reverse
   */
  const reverseClip = useCallback((clipId: string) => {
    setClips((prev) =>
      prev.map((clip) => {
        if (clip.id === clipId) {
          const reversedKeyframes = reverseKeyframeTimes(clip.keyframes)
          const duration = calculateDuration(reversedKeyframes)
          return { ...clip, keyframes: reversedKeyframes, duration }
        }
        return clip
      })
    )
  }, [])

  return {
    clips,
    activeClipId,
    createClip,
    duplicateClip,
    renameClip,
    deleteClip,
    clearAllClips,
    setActiveClip,
    getActiveClip,
    updateClipKeyframes,
    setClipInterpolation,
    scaleClipDuration,
    offsetClipTiming,
    reverseClip,
  }
}

export default useClips
