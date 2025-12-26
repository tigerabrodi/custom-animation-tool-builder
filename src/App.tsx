import { Suspense, useCallback, useEffect, useState, type ChangeEvent } from 'react'
import * as THREE from 'three'
import { BoneTree } from './components/bone-tree'
import {
  ClipListPanel,
  ClipPropertiesPanel,
  PlaybackControls,
  TransformPanel,
} from './components/panels'
import { Timeline, TimelineControls } from './components/timeline'
import { Viewport } from './components/viewport/Viewport'
import { useClips } from './hooks/useClips'
import { useKeyframes } from './hooks/useKeyframes'
import { useModelLoader } from './hooks/useModelLoader'
import { usePlayback } from './hooks/usePlayback'
import { useSkeletonEditor } from './hooks/useSkeletonEditor'
import { useTimelineZoom } from './hooks/useTimelineZoom'

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

  // Animation hooks
  const {
    keyframes,
    selectedKeyframeId,
    addKeyframe,
    deleteKeyframe,
    updateKeyframeTime,
    selectKeyframe,
  } = useKeyframes()

  const {
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
  } = useClips()

  const {
    isPlaying,
    currentTime,
    speedMultiplier,
    loopMode,
    play,
    pause,
    stop,
    setCurrentTime,
    setSpeedMultiplier,
    setLoopMode,
    tick,
  } = usePlayback()

  // Timeline zoom and snap
  const { zoom, zoomIn, zoomOut } = useTimelineZoom()
  const [snapInterval, setSnapInterval] = useState<number | null>(null)

  // Get active clip data
  const activeClip = getActiveClip()
  const activeKeyframes = activeClip?.keyframes ?? []
  const activeInterpolation = activeClip?.interpolation ?? 'LINEAR'
  const activeDuration = activeClip?.duration ?? 0

  // Sync keyframes to active clip when they change
  useEffect(() => {
    if (activeClipId) {
      updateClipKeyframes(activeClipId, keyframes)
    }
  }, [activeClipId, keyframes, updateClipKeyframes])

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      await loadModel(file)
    }
  }

  const handleClearModel = useCallback(() => {
    clearModel()
    setSelectedBone(null)
    stop()
  }, [clearModel, setSelectedBone, stop])

  const handleSceneLoaded = useCallback(
    (scene: THREE.Object3D) => {
      initializeSkeleton(scene)
    },
    [initializeSkeleton]
  )

  // Add keyframe at current playhead time
  const handleAddKeyframe = useCallback(() => {
    if (!bones || !activeClipId) return
    addKeyframe(currentTime, bones)
  }, [bones, activeClipId, currentTime, addKeyframe])

  // Delete selected keyframe
  const handleDeleteKeyframe = useCallback(() => {
    if (selectedKeyframeId) {
      deleteKeyframe(selectedKeyframeId)
    }
  }, [selectedKeyframeId, deleteKeyframe])

  // Create clip and auto-select it
  const handleCreateClip = useCallback(
    (name: string) => {
      const clip = createClip(name)
      if (clip) {
        setActiveClip(clip.id)
      }
      return clip
    },
    [createClip, setActiveClip]
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

        {/* Keyframe controls */}
        {bones && activeClipId && (
          <>
            <div className="w-px h-6 bg-gray-600" />
            <button
              onClick={handleAddKeyframe}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
            >
              + Keyframe
            </button>
            {selectedKeyframeId && (
              <button
                onClick={handleDeleteKeyframe}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-sm"
              >
                Delete KF
              </button>
            )}
          </>
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
        {/* Left Panel - Bone Tree + Clips */}
        <div className="w-64 border-r border-gray-700 flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto">
            <BoneTree
              selectedBone={selectedBone}
              onSelectBone={setSelectedBone}
              disabled={!bones}
            />
          </div>
          <div className="border-t border-gray-700 h-64 overflow-y-auto">
            <ClipListPanel
              clips={clips}
              activeClipId={activeClipId}
              onSelectClip={setActiveClip}
              onCreateClip={handleCreateClip}
              onDuplicateClip={duplicateClip}
              onDeleteClip={deleteClip}
            />
          </div>
        </div>

        {/* Center - Viewport */}
        <div className="flex-1 flex flex-col">
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
                isPlaying={isPlaying}
                currentTime={currentTime}
                keyframes={activeKeyframes}
                interpolation={activeInterpolation}
                duration={activeDuration}
                onTick={tick}
              />
            </Suspense>
          </div>

          {/* Timeline */}
          {bones && activeClipId && (
            <div className="border-t border-gray-700">
              <div className="flex items-center justify-between px-2 py-1 bg-gray-800 border-b border-gray-700">
                <span className="text-xs text-gray-400">Timeline</span>
                <TimelineControls
                  zoom={zoom}
                  snapInterval={snapInterval}
                  onZoomIn={zoomIn}
                  onZoomOut={zoomOut}
                  onSnapChange={setSnapInterval}
                />
              </div>
              <Timeline
                duration={activeDuration}
                currentTime={currentTime}
                keyframes={activeKeyframes}
                selectedKeyframeId={selectedKeyframeId}
                onTimeChange={setCurrentTime}
                onKeyframeSelect={selectKeyframe}
                onKeyframeMove={updateKeyframeTime}
                zoom={zoom}
                snapInterval={snapInterval}
              />
            </div>
          )}

          {/* Playback Controls */}
          {bones && (
            <PlaybackControls
              isPlaying={isPlaying}
              currentTime={currentTime}
              speedMultiplier={speedMultiplier}
              loopMode={loopMode}
              onPlay={play}
              onPause={pause}
              onStop={stop}
              onSpeedChange={setSpeedMultiplier}
              onLoopModeChange={setLoopMode}
            />
          )}
        </div>

        {/* Right Panel - Transform + Clip Properties */}
        <div className="w-72 border-l border-gray-700 flex flex-col shrink-0">
          <div className="flex-1 overflow-y-auto">
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
          <div className="border-t border-gray-700 h-64 overflow-y-auto">
            <ClipPropertiesPanel
              clip={activeClip}
              onRenameClip={renameClip}
              onSetInterpolation={setClipInterpolation}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
