import { Suspense, useCallback, type ChangeEvent } from 'react'
import * as THREE from 'three'
import { BoneTree } from './components/bone-tree'
import { TransformPanel } from './components/panels'
import { Viewport } from './components/viewport/Viewport'
import { useModelLoader } from './hooks/useModelLoader'
import { useSkeletonEditor } from './hooks/useSkeletonEditor'

function App() {
  const { modelUrl, isLoading, error, loadModel, clearModel } = useModelLoader()
  const {
    bones,
    selectedBone,
    transformMode,
    coordinateSpace,
    hipsLocked,
    setSelectedBone,
    setTransformMode,
    setCoordinateSpace,
    setHipsLocked,
    initializeSkeleton,
    resetBone,
    resetAllBones,
    getBoneTransform,
  } = useSkeletonEditor()

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await loadModel(file)
    }
  }

  const handleClearModel = useCallback(() => {
    clearModel()
    setSelectedBone(null)
  }, [clearModel, setSelectedBone])

  const handleSceneLoaded = useCallback(
    (scene: THREE.Object3D) => {
      initializeSkeleton(scene)
    },
    [initializeSkeleton]
  )

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm">
          Load GLB
          <input
            type="file"
            accept=".glb"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {modelUrl && (
          <button
            onClick={handleClearModel}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
          >
            Clear Model
          </button>
        )}

        {isLoading && <span className="text-gray-300 text-sm">Loading...</span>}

        {error && <span className="text-red-400 text-sm">{error}</span>}

        {bones && (
          <span className="text-gray-400 text-sm ml-auto">
            {bones.size} bones loaded
          </span>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Bone Tree */}
        <div className="w-64 border-r border-gray-700 overflow-y-auto shrink-0">
          <BoneTree
            selectedBone={selectedBone}
            onSelectBone={setSelectedBone}
            disabled={!bones}
          />
        </div>

        {/* Center - Viewport */}
        <div className="flex-1 relative">
          <Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Loading 3D viewer...
              </div>
            }
          >
            <Viewport
              modelUrl={modelUrl}
              bones={bones}
              selectedBone={selectedBone}
              transformMode={transformMode}
              coordinateSpace={coordinateSpace}
              hipsLocked={hipsLocked}
              onSelectBone={setSelectedBone}
              onSceneLoaded={handleSceneLoaded}
              showBoneOverlay={!!bones}
            />
          </Suspense>
        </div>

        {/* Right Panel - Transform */}
        <div className="w-72 border-l border-gray-700 overflow-y-auto shrink-0">
          <TransformPanel
            selectedBone={selectedBone}
            transformMode={transformMode}
            coordinateSpace={coordinateSpace}
            hipsLocked={hipsLocked}
            getBoneTransform={getBoneTransform}
            onTransformModeChange={setTransformMode}
            onCoordinateSpaceChange={setCoordinateSpace}
            onHipsLockedChange={setHipsLocked}
            onResetBone={resetBone}
            onResetAllBones={resetAllBones}
          />
        </div>
      </div>
    </div>
  )
}

export default App
