import { TransformControls } from '@react-three/drei'
import type * as THREE from 'three'
import type { BoneName, CoordinateSpace, TransformMode } from '../../types'

interface TransformGizmoProps {
  bones: Map<BoneName, THREE.Bone> | null
  selectedBone: BoneName | null
  mode: TransformMode // 'TRANSLATE' | 'ROTATE' | 'SCALE'
  space: CoordinateSpace // 'LOCAL' | 'WORLD'
  hipsLocked?: boolean
  onTransformChange?: () => void
}

// Map our type definitions to TransformControls expected values
function mapMode(mode: TransformMode): 'translate' | 'rotate' | 'scale' {
  switch (mode) {
    case 'TRANSLATE':
      return 'translate'
    case 'ROTATE':
      return 'rotate'
    case 'SCALE':
      return 'scale'
    default:
      return 'rotate'
  }
}

function mapSpace(space: CoordinateSpace): 'local' | 'world' {
  switch (space) {
    case 'LOCAL':
      return 'local'
    case 'WORLD':
      return 'world'
    default:
      return 'local'
  }
}

export function TransformGizmo({
  bones,
  selectedBone,
  mode,
  space,
  hipsLocked = false,
  onTransformChange,
}: TransformGizmoProps) {
  // Get the selected bone object
  const selectedBoneObject =
    selectedBone && bones ? bones.get(selectedBone) : null

  // Don't render if no bone is selected or bones not loaded
  if (!selectedBoneObject || !bones) {
    return null
  }

  // Don't render translate controls for Hips when locked
  if (selectedBone === 'Hips' && hipsLocked && mode === 'TRANSLATE') {
    return null
  }

  return (
    <TransformControls
      object={selectedBoneObject}
      mode={mapMode(mode)}
      space={mapSpace(space)}
      size={0.75}
      onChange={onTransformChange}
    />
  )
}
