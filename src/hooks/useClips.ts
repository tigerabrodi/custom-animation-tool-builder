import { useCallback, useState } from 'react'
import type {
  AnimationClip,
  InterpolationMode,
  Keyframe,
} from '../types/animation'
import { validatePascalCase } from '../utils/validation'

interface UseClipsReturn {
  clips: AnimationClip[]
  activeClipId: string | null
  createClip: (name: string) => AnimationClip | null
  duplicateClip: (clipId: string, newName: string) => AnimationClip | null
  renameClip: (clipId: string, newName: string) => boolean
  deleteClip: (clipId: string) => boolean
  setActiveClip: (clipId: string | null) => void
  getActiveClip: () => AnimationClip | null
  updateClipKeyframes: (clipId: string, keyframes: Keyframe[]) => boolean
  setClipInterpolation: (clipId: string, mode: InterpolationMode) => boolean
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

      const sourceClip = clips.find((clip) => clip.id === clipId)
      if (!sourceClip) {
        return null
      }

      const duplicatedClip: AnimationClip = {
        ...sourceClip,
        id: crypto.randomUUID(),
        name: newName,
        keyframes: sourceClip.keyframes.map((kf) => ({
          ...kf,
          id: crypto.randomUUID(),
          bones: { ...kf.bones },
        })),
      }

      setClips((prev) => [...prev, duplicatedClip])
      return duplicatedClip
    },
    [clips]
  )

  const renameClip = useCallback(
    (clipId: string, newName: string): boolean => {
      if (!validatePascalCase(newName)) {
        return false
      }

      const clipExists = clips.some((clip) => clip.id === clipId)
      if (!clipExists) {
        return false
      }

      setClips((prev) =>
        prev.map((clip) =>
          clip.id === clipId ? { ...clip, name: newName } : clip
        )
      )
      return true
    },
    [clips]
  )

  const deleteClip = useCallback(
    (clipId: string): boolean => {
      const clipExists = clips.some((clip) => clip.id === clipId)
      if (!clipExists) {
        return false
      }

      setClips((prev) => prev.filter((clip) => clip.id !== clipId))

      // Clear active clip if we're deleting it
      if (activeClipId === clipId) {
        setActiveClipId(null)
      }

      return true
    },
    [clips, activeClipId]
  )

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
      const clipExists = clips.some((clip) => clip.id === clipId)
      if (!clipExists) {
        return false
      }

      // Calculate duration from last keyframe time
      const duration =
        keyframes.length > 0 ? Math.max(...keyframes.map((kf) => kf.time)) : 0

      setClips((prev) =>
        prev.map((clip) =>
          clip.id === clipId ? { ...clip, keyframes, duration } : clip
        )
      )
      return true
    },
    [clips]
  )

  const setClipInterpolation = useCallback(
    (clipId: string, mode: InterpolationMode): boolean => {
      const clipExists = clips.some((clip) => clip.id === clipId)
      if (!clipExists) {
        return false
      }

      setClips((prev) =>
        prev.map((clip) =>
          clip.id === clipId ? { ...clip, interpolation: mode } : clip
        )
      )
      return true
    },
    [clips]
  )

  return {
    clips,
    activeClipId,
    createClip,
    duplicateClip,
    renameClip,
    deleteClip,
    setActiveClip,
    getActiveClip,
    updateClipKeyframes,
    setClipInterpolation,
  }
}

export default useClips
