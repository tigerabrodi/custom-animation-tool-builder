# Skeleton Animation Editor

A browser-based animation editor for creating and editing skeletal animations on GLB models. Load a rigged 3D model, pose bones, create keyframes, and export animations back to GLB format.

## Features

- **GLB Model Loading**: Import any GLB file with a skeletal rig
- **Interactive Bone Manipulation**: Select and transform bones using translate/rotate/scale gizmos
- **Keyframe Animation**: Create keyframes at specific times, capturing full skeleton poses
- **Timeline Editor**: Visual timeline with draggable keyframes and snapping
- **Multiple Animation Clips**: Create, duplicate, rename, and manage multiple animation clips
- **Playback Controls**: Play, pause, stop with adjustable speed (0.1x - 4x)
- **Loop Modes**: Once, Loop, and Ping-Pong playback modes
- **Interpolation**: Linear and Step interpolation between keyframes
- **Clip Operations**: Scale duration, offset timing, reverse animations
- **GLB Export**: Export model with embedded animations in standard GLB format

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Three.js** - 3D rendering
- **React Three Fiber** - React bindings for Three.js
- **React Three Drei** - Useful R3F helpers (OrbitControls, TransformControls)
- **Tailwind CSS** - Styling
- **Vite** - Build tool

## Architecture

### State Management

The application uses React hooks for state management, with each domain having its own hook:

- `useModelLoader` - Handles GLB file loading and URL management
- `useSkeletonEditor` - Manages bone selection, transform modes, and skeleton state
- `useKeyframes` - Manages keyframe CRUD operations and selection
- `useClips` - Manages animation clips with bidirectional sync to keyframes
- `usePlayback` - Handles playback state (time, speed, loop mode, direction)
- `useAnimationLoop` - Connects playback to Three.js render loop via `useFrame`

### Data Flow

```
User poses skeleton
        ↓
Click "+ Keyframe" at playhead position
        ↓
useKeyframes.addKeyframe() captures bone transforms
        ↓
Sync effect updates active clip's keyframes
        ↓
Duration auto-calculated from max keyframe time
        ↓
On play: useAnimationLoop ticks time forward
        ↓
interpolatePoseAtTime() computes intermediate poses
        ↓
applyPose() sets bone transforms in Three.js scene
```

### Key Files

```
src/
├── App.tsx                 # Main app orchestration
├── components/
│   ├── viewport/
│   │   └── Viewport.tsx    # 3D canvas and scene setup
│   ├── timeline/
│   │   ├── Timeline.tsx    # Timeline container
│   │   ├── TimeRuler.tsx   # Time markers
│   │   ├── KeyframeTrack.tsx # Keyframe diamonds
│   │   └── Playhead.tsx    # Current time indicator
│   ├── panels/
│   │   ├── PlaybackControls.tsx
│   │   ├── ClipListPanel.tsx
│   │   └── TransformPanel.tsx
│   └── bone-tree/          # Hierarchy browser
├── hooks/
│   ├── useModelLoader.ts   # GLB loading
│   ├── useSkeletonEditor.ts # Bone manipulation
│   ├── useKeyframes.ts     # Keyframe state
│   ├── useClips.ts         # Clip management
│   ├── usePlayback.ts      # Time/play state
│   └── useAnimationLoop.ts # R3F render loop
├── utils/
│   ├── interpolation.ts    # Pose interpolation (linear, step, slerp)
│   ├── clipOperations.ts   # Scale, offset, reverse
│   └── exportGlb.ts        # GLB export with animations
└── types/
    └── animation.ts        # TypeScript types
```

### Interpolation

Poses are interpolated between keyframes using:

- **Linear interpolation** for positions and scales
- **Spherical linear interpolation (SLERP)** for rotations (quaternions)
- **Step interpolation** option for snappy transitions

## Usage

### Basic Workflow

1. **Load Model**: Click "Load GLB" and select a rigged 3D model
2. **Create Clip**: Click "+ Clip" in the clips panel to create an animation clip
3. **Position Playhead**: Click on the timeline to set the current time
4. **Pose Character**: Select bones from the hierarchy and use transform gizmos
5. **Add Keyframe**: Click "+ Keyframe" to capture the pose at current time
6. **Repeat**: Move playhead to different times and create more keyframes
7. **Preview**: Use playback controls to preview the animation
8. **Export**: Click "Export GLB" to download with embedded animations

### Keyboard Shortcuts

- `W` - Translate mode
- `E` - Rotate mode
- `R` - Scale mode

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Type check
bun run tsc

# Build for production
bun run build
```

## GLB Export Format

Exported animations follow the glTF 2.0 specification:

- Each clip becomes a separate animation
- Clip names are used as animation names
- Keyframes are converted to animation samplers
- Supports position, rotation (quaternion), and scale tracks
- Linear interpolation is used in the export

## License

MIT
