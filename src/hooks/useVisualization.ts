import { useState, useMemo } from 'react'
import type { VisualizationMode } from '../types'

export interface UseVisualizationReturn {
  mode: VisualizationMode
  setMode: (mode: VisualizationMode) => void
  showMesh: boolean
  showSkeleton: boolean
}

export function useVisualization(
  defaultMode: VisualizationMode = 'BOTH'
): UseVisualizationReturn {
  const [mode, setMode] = useState<VisualizationMode>(defaultMode)

  const { showMesh, showSkeleton } = useMemo(
    () => ({
      showMesh: mode === 'MESH' || mode === 'BOTH',
      showSkeleton: mode === 'SKELETON' || mode === 'BOTH',
    }),
    [mode]
  )

  return {
    mode,
    setMode,
    showMesh,
    showSkeleton,
  }
}
