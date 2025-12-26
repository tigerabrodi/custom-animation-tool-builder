import type { Quaternion, Vector3 } from './math'
import type { BoneName } from './skeleton'

export interface BoneTransform {
  position: Vector3
  rotation: Quaternion
  scale: Vector3
}

export type InterpolationMode = 'LINEAR' | 'STEP' | 'CUBICSPLINE'

export interface Keyframe {
  id: string
  time: number
  label?: string
  bones: Record<BoneName, BoneTransform>
}

export interface AnimationClip {
  id: string
  name: string
  duration: number
  keyframes: Keyframe[]
  loopMode: LoopMode
  interpolation: InterpolationMode
}

export type LoopMode = 'ONCE' | 'LOOP' | 'PING_PONG'

export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  playbackSpeed: number
  loopMode: LoopMode
}
