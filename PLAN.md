# Skeleton Animation Editor - Implementation Plan

## Project Overview

Client-side web app for creating custom animations for rigged 3D GLB models (Meshy humanoids with 24 bones). Users load a model, pose bones, capture keyframes, preview animations, and export GLB with baked animations.

## Tech Stack

- Runtime: Bun
- Build: Vite
- Framework: React
- Language: TypeScript (strict)
- 3D: Three.js, @react-three/fiber, @react-three/drei
- GLB Export: @gltf-transform/core
- Testing: Vitest

## Meshy Skeleton Hierarchy (24 bones)

```
Hips (root)
  ├─ LeftUpLeg → LeftLeg → LeftFoot → LeftToeBase
  ├─ RightUpLeg → RightLeg → RightFoot → RightToeBase
  └─ Spine02 → Spine01 → Spine
                          ├─ LeftShoulder → LeftArm → LeftForeArm → LeftHand
                          ├─ RightShoulder → RightArm → RightForeArm → RightHand
                          └─ neck → Head → (head_end, headfront)
```

---

## Implementation Stages

### Stage 1: Foundation (Phase 1) - COMPLETED

- [x] Vite + React + TypeScript + Tailwind setup
- [x] @react-three/fiber and @react-three/drei
- [x] GLB file loading (useModelLoader, glbLoader service)
- [x] Model display in viewport (ModelRenderer)
- [x] Orbit camera controls
- [x] Types (skeleton.ts, animation.ts, editor.ts)
- [x] Constants (BONE_NAMES, SKELETON_HIERARCHY)
- [x] Pure utility functions with tests (math.ts, validation.ts)
- [x] UI component library (Button, Input, Select, Toggle, Panel, Toast)

### Stage 2: Skeleton System (Phases 2-3) - COMPLETED

- [x] Skeleton parsing from loaded model (skeletonParser.ts)
- [x] Bone overlay visualization (BoneOverlay.tsx - lines + spheres)
- [x] Bone tree panel UI (BoneTree, BoneTreeNode)
- [x] Bone selection (tree click + viewport click)
- [x] TransformControls on selected bone (TransformGizmo.tsx)
- [x] Rotate/translate/scale modes
- [x] Transform panel with numeric inputs (TransformPanel.tsx)
- [x] Reset bone / Reset all functions
- [x] Hips lock toggle (blocks translation only, allows rotation)
- [x] useSkeletonEditor hook

### Stage 3: Animation Core (Phases 4, 6, 8) - FULLY COMPLETED

#### Agent A: Keyframes
- [x] Keyframe type: `{ id, time, label?, bones: Record<BoneName, BoneTransform> }`
- [x] useKeyframes hook (src/hooks/useKeyframes.ts)
- [x] Add keyframe (capture current pose at time)
- [x] Delete keyframe
- [x] Update keyframe (re-capture pose)
- [x] Select keyframe
- [x] `interpolatePoseAtTime` function (LINEAR, STEP modes)
- [x] `findSurroundingKeyframes` helper
- [x] Tests: src/__tests__/interpolation.test.ts

#### Agent B: Clips
- [x] AnimationClip: `{ id, name, duration, keyframes, loopMode, interpolation }`
- [x] useClips hook (src/hooks/useClips.ts)
- [x] Create/duplicate/rename/delete clip (PascalCase validation)
- [x] Switch active clip
- [x] ClipListPanel UI (src/components/panels/ClipListPanel.tsx)
- [x] ClipPropertiesPanel UI (src/components/panels/ClipPropertiesPanel.tsx)

#### Agent C: Playback
- [x] usePlayback hook (src/hooks/usePlayback.ts)
- [x] PlaybackState: isPlaying, currentTime, speedMultiplier, loopMode, direction
- [x] Play/pause/stop controls
- [x] Loop modes: ONCE, LOOP, PING_PONG
- [x] Speed multiplier (0.1x to 4x)
- [x] useAnimationLoop hook for R3F integration (src/hooks/useAnimationLoop.ts)
- [x] PlaybackControls UI (src/components/panels/PlaybackControls.tsx)

#### Integration Status - COMPLETED
- [x] Wire up useKeyframes + useClips + usePlayback in App.tsx
- [x] Add ClipListPanel and ClipPropertiesPanel to UI
- [x] Add PlaybackControls to UI
- [x] Connect animation loop in viewport (AnimationController.tsx)

### Stage 4: Timeline UI (Phase 5) - FULLY COMPLETED

**Parallelized 2 agents:**

#### Agent A: Timeline Core - COMPLETED
- [x] Timeline.tsx main component
- [x] TimeRuler.tsx (time markers, grid)
- [x] KeyframeTrack.tsx (keyframe display area)
- [x] KeyframeMarker.tsx (diamond markers with selection)
- [x] Playhead.tsx (vertical red line with handle)
- [x] Time labels (dynamic intervals based on zoom)

#### Agent B: Timeline Interactions - COMPLETED
- [x] Click timeline to move playhead
- [x] Drag keyframes to retime
- [x] useTimelineDrag hook for smooth dragging
- [x] useTimelineZoom hook (25, 50, 100, 200, 400 px/s)
- [x] useTimelineScroll hook for scroll management
- [x] TimelineControls.tsx (zoom buttons, snap dropdown)
- [x] Snap-to-grid (off, 0.05s, 0.1s, 0.25s, 0.5s, 1.0s)
- [x] Horizontal scroll when zoomed
- [x] timelineUtils.ts with tests

### Stage 5: Advanced Features (Phases 7, 9, 11) - NOT STARTED

**Can parallelize 3 agents:**

#### Agent A: Advanced Interpolation
- [ ] STEP interpolation (instant snap)
- [ ] CUBICSPLINE interpolation
- [ ] Auto tangent calculation (Catmull-Rom style)
- [ ] `calculateCubicTangents` function
- [ ] Per-clip interpolation mode selector UI

#### Agent B: Timeline Operations
- [ ] Scale clip duration (`scaleKeyframeTimes`)
- [ ] Offset clip timing (`offsetKeyframeTimes`)
- [ ] Duplicate keyframe to new time
- [ ] Keyframe labels/notes

#### Agent C: Visualization Modes
- [ ] Toggle mesh visibility
- [ ] Skeleton-only view mode
- [ ] VisualizationMode selector UI

### Stage 6: Export System (Phase 10) - NOT STARTED

**Sequential (depends on animation core):**

- [ ] Install @gltf-transform/core
- [ ] `clipToGltfAnimationData` conversion
- [ ] `flattenTransformPath` for rotation/translation/scale
- [ ] `flattenTimes` helper
- [ ] `getAnimatedBones` helper
- [ ] Read original GLB into gltf-transform Document
- [ ] Create Animation nodes for each clip
- [ ] Create channels + samplers per bone
- [ ] Handle name conflicts (overwrite existing with same name)
- [ ] Preserve non-conflicting existing animations
- [ ] `buildExportPreview` function
- [ ] ExportDialog UI
- [ ] Trigger browser download

### Stage 7: Persistence & Polish (Phases 12-14) - NOT STARTED

**Can parallelize 3 agents:**

#### Agent A: Session Persistence
- [ ] `serializeSession` / `deserializeSession`
- [ ] `arrayBufferToBase64` / `base64ToArrayBuffer`
- [ ] Auto-save to localStorage (every 30s)
- [ ] Restore session prompt on load
- [ ] Manual "Save Session" (JSON download)
- [ ] Manual "Load Session" (JSON upload)

#### Agent B: Keyboard Shortcuts
- [ ] R - Transform mode: Rotate
- [ ] G - Transform mode: Translate
- [ ] S - Transform mode: Scale
- [ ] Space - Play/Pause toggle
- [ ] K - Add keyframe at playhead
- [ ] Delete - Delete selected keyframe
- [ ] F - Focus camera on selected bone
- [ ] 0 - Reset camera to default view
- [ ] Keyboard shortcut cheat sheet UI

#### Agent C: Polish
- [ ] Error handling throughout
- [ ] Loading states
- [ ] Toast notifications for actions
- [ ] Edge case handling
- [ ] UI polish

### Stage 8: Undo/Redo (Phase 15) - OPTIONAL

- [ ] Action history stack (max 50)
- [ ] Track: bone transform, keyframe CRUD, clip CRUD, settings changes
- [ ] Undo (Ctrl+Z)
- [ ] Redo (Ctrl+Shift+Z)

---

## Key Files Reference

### Types
- `src/types/skeleton.ts` - BoneName, BoneTransform
- `src/types/animation.ts` - Keyframe, AnimationClip, PlaybackState
- `src/types/editor.ts` - UIState, TransformMode, CoordinateSpace

### Constants
- `src/constants/skeleton.ts` - BONE_NAMES, SKELETON_HIERARCHY

### Hooks
- `src/hooks/useModelLoader.ts` - GLB file loading
- `src/hooks/useSkeletonEditor.ts` - Bone selection, transforms, bind pose
- `src/hooks/useKeyframes.ts` - Keyframe CRUD, selection
- `src/hooks/useClips.ts` - Clip management, active clip switching
- `src/hooks/usePlayback.ts` - Play/pause/stop, speed, loop modes
- `src/hooks/useAnimationLoop.ts` - R3F animation frame loop
- `src/hooks/useTimelineZoom.ts` - Timeline zoom level management
- `src/hooks/useTimelineDrag.ts` - Timeline drag interactions
- `src/hooks/useTimelineScroll.ts` - Timeline scroll management

### Components
- `src/components/viewport/Viewport.tsx` - Main 3D canvas
- `src/components/viewport/BoneOverlay.tsx` - Skeleton visualization
- `src/components/viewport/TransformGizmo.tsx` - TransformControls wrapper
- `src/components/viewport/AnimationController.tsx` - Animation loop inside R3F
- `src/components/bone-tree/` - Bone hierarchy tree
- `src/components/panels/TransformPanel.tsx` - Transform controls
- `src/components/panels/ClipListPanel.tsx` - Clip list and management
- `src/components/panels/ClipPropertiesPanel.tsx` - Active clip properties
- `src/components/panels/PlaybackControls.tsx` - Play/pause, speed, loop
- `src/components/timeline/Timeline.tsx` - Main timeline component
- `src/components/timeline/TimeRuler.tsx` - Time markers and labels
- `src/components/timeline/KeyframeTrack.tsx` - Keyframe display area
- `src/components/timeline/KeyframeMarker.tsx` - Individual keyframe marker
- `src/components/timeline/Playhead.tsx` - Current time indicator
- `src/components/timeline/TimelineControls.tsx` - Zoom and snap controls

### Services
- `src/services/glbLoader.ts` - GLB validation + loading
- `src/services/skeletonParser.ts` - Extract skeleton from scene

### Utils
- `src/utils/math.ts` - quaternionSlerp, vector3Lerp, etc.
- `src/utils/validation.ts` - validatePascalCase
- `src/utils/interpolation.ts` - interpolatePoseAtTime, findSurroundingKeyframes
- `src/utils/timelineUtils.ts` - snapToGrid, pixelsToTime, timeToPixels, getTickInterval

---

## Notes

- hipsLocked only blocks translation, NOT rotation
- All interpolation uses quaternion slerp for rotations
- Clip names must be PascalCase (validated)
- Only Hips bone needs position animation for locomotion
- Export preserves existing animations unless name conflicts
