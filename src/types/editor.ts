import type { BoneName } from './skeleton'
import type { AnimationClip, PlaybackState } from './animation'

export type VisualizationMode = 'SKELETON' | 'MESH' | 'BOTH'

export type TransformMode = 'TRANSLATE' | 'ROTATE' | 'SCALE'

export type CoordinateSpace = 'LOCAL' | 'WORLD'

export interface UIState {
  selectedBone: BoneName | null
  transformMode: TransformMode
  coordinateSpace: CoordinateSpace
  visualizationMode: VisualizationMode
  showGrid: boolean
  showBoneLabels: boolean
  timelineZoom: number
  timelineScroll: number
}

export interface LoadedModel {
  id: string
  name: string
  url: string
  blobUrl?: string
  loadedAt: number
}

export interface EditorSession {
  id: string
  model: LoadedModel | null
  clips: AnimationClip[]
  activeClipId: string | null
  playbackState: PlaybackState
  uiState: UIState
  undoStack: unknown[]
  redoStack: unknown[]
}
