import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useCallback } from 'react'
import * as THREE from 'three'
import type {
  BoneName,
  CoordinateSpace,
  InterpolationMode,
  Keyframe,
  TransformMode,
  VisualizationMode,
} from '../../types'
import { AnimationController } from './AnimationController'
import { BoneOverlay } from './BoneOverlay'
import { ModelRenderer } from './ModelRenderer'
import { TransformGizmo } from './TransformGizmo'

interface ViewportProps {
  modelUrl: string | null
  bones?: Map<BoneName, THREE.Bone> | null
  selectedBone?: BoneName | null
  transformMode?: TransformMode
  coordinateSpace?: CoordinateSpace
  hipsLocked?: boolean
  onSelectBone?: (bone: BoneName | null) => void
  onSceneLoaded?: (scene: THREE.Object3D) => void
  showBoneOverlay?: boolean
  visualizationMode?: VisualizationMode
  // Animation props
  isPlaying?: boolean
  currentTime?: number
  keyframes?: Keyframe[]
  interpolation?: InterpolationMode
  duration?: number
  onTick?: (deltaTime: number, duration: number) => void
}

type SceneProps = ViewportProps

function Scene({
  modelUrl,
  bones,
  selectedBone,
  transformMode = 'ROTATE',
  coordinateSpace = 'LOCAL',
  hipsLocked = false,
  onSelectBone,
  onSceneLoaded,
  showBoneOverlay = true,
  visualizationMode = 'BOTH',
  isPlaying = false,
  currentTime = 0,
  keyframes = [],
  interpolation = 'LINEAR',
  duration = 0,
  onTick,
}: SceneProps) {
  // Derive visibility from visualization mode
  const showMesh = visualizationMode === 'MESH' || visualizationMode === 'BOTH'
  const showSkeleton =
    visualizationMode === 'SKELETON' || visualizationMode === 'BOTH'

  // Combine showBoneOverlay prop with visualization mode
  const skeletonVisible = showBoneOverlay && showSkeleton

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />

      {/* Ground Grid - Simple grid to avoid GPU issues */}
      <gridHelper args={[20, 40, '#374151', '#4b5563']} />

      {/* Model */}
      {modelUrl && (
        <ModelRenderer
          url={modelUrl}
          onSceneLoaded={onSceneLoaded}
          visible={showMesh}
        />
      )}

      {/* Bone Overlay - visual representation of skeleton */}
      {bones && (
        <BoneOverlay
          bones={bones}
          selectedBone={selectedBone ?? null}
          visible={skeletonVisible}
          onSelectBone={onSelectBone}
        />
      )}

      {/* Transform Gizmo - for manipulating selected bone */}
      {bones && selectedBone && (
        <TransformGizmo
          bones={bones}
          selectedBone={selectedBone}
          mode={transformMode}
          space={coordinateSpace}
          hipsLocked={hipsLocked}
        />
      )}

      {/* Animation Controller - handles playback */}
      {bones && onTick && (
        <AnimationController
          bones={bones}
          isPlaying={isPlaying}
          currentTime={currentTime}
          keyframes={keyframes}
          interpolation={interpolation}
          duration={duration}
          tick={onTick}
        />
      )}

      {/* Camera Controls */}
      <OrbitControls
        makeDefault
        minDistance={1}
        maxDistance={20}
        target={[0, 0.9, 0]}
      />
    </>
  )
}

export function Viewport({
  modelUrl,
  bones,
  selectedBone,
  transformMode,
  coordinateSpace,
  hipsLocked,
  onSelectBone,
  onSceneLoaded,
  showBoneOverlay,
  visualizationMode,
  isPlaying,
  currentTime,
  keyframes,
  interpolation,
  duration,
  onTick,
}: ViewportProps) {
  // Handle clicking on empty space to deselect
  const handlePointerMissed = () => {
    onSelectBone?.(null)
  }

  // Handle WebGL context loss
  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement
    canvas.addEventListener('webglcontextlost', (event) => {
      event.preventDefault()
      console.error('WebGL context lost! Attempting to restore...')
    })
    canvas.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored')
    })
  }, [])

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [3, 2, 5],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        onPointerMissed={handlePointerMissed}
        onCreated={handleCreated}
      >
        <Scene
          modelUrl={modelUrl}
          bones={bones}
          selectedBone={selectedBone}
          transformMode={transformMode}
          coordinateSpace={coordinateSpace}
          hipsLocked={hipsLocked}
          onSelectBone={onSelectBone}
          onSceneLoaded={onSceneLoaded}
          showBoneOverlay={showBoneOverlay}
          visualizationMode={visualizationMode}
          isPlaying={isPlaying}
          currentTime={currentTime}
          keyframes={keyframes}
          interpolation={interpolation}
          duration={duration}
          onTick={onTick}
        />
      </Canvas>
    </div>
  )
}
