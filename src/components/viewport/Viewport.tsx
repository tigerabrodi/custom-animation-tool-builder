import { Grid, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import type { BoneName, CoordinateSpace, TransformMode } from '../../types'
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
}: SceneProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

      {/* Ground Grid */}
      <Grid
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      {/* Model */}
      {modelUrl && (
        <ModelRenderer url={modelUrl} onSceneLoaded={onSceneLoaded} />
      )}

      {/* Bone Overlay - visual representation of skeleton */}
      {bones && (
        <BoneOverlay
          bones={bones}
          selectedBone={selectedBone ?? null}
          visible={showBoneOverlay}
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
}: ViewportProps) {
  // Handle clicking on empty space to deselect
  const handlePointerMissed = () => {
    onSelectBone?.(null)
  }

  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [3, 2, 5],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        shadows
        onPointerMissed={handlePointerMissed}
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
        />
      </Canvas>
    </div>
  )
}
