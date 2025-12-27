import React, { useState } from 'react'
import { Panel } from '../layout/Panel'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import type { AnimationClip, InterpolationMode } from '../../types/animation'
import { validatePascalCase } from '../../utils/validation'

interface ClipPropertiesPanelProps {
  clip: AnimationClip | null
  onRenameClip: (clipId: string, newName: string) => boolean
  onSetInterpolation: (clipId: string, mode: InterpolationMode) => boolean
}

const interpolationOptions = [
  { value: 'LINEAR', label: 'Linear' },
  { value: 'STEP', label: 'Step' },
  { value: 'CUBICSPLINE', label: 'Cubic Spline' },
]

// Inner component that resets when clip ID changes (via key prop)
const ClipPropertiesContent: React.FC<{
  clip: AnimationClip
  onRenameClip: (clipId: string, newName: string) => boolean
  onSetInterpolation: (clipId: string, mode: InterpolationMode) => boolean
}> = ({ clip, onRenameClip, onSetInterpolation }) => {
  // Initialize with the clip's current name - will reset when key changes (new clip)
  const [editingName, setEditingName] = useState(clip.name)
  const [nameError, setNameError] = useState<string | null>(null)

  const handleNameBlur = () => {
    // If name hasn't changed, do nothing
    if (editingName === clip.name) {
      setNameError(null)
      return
    }

    // Validate PascalCase
    if (!validatePascalCase(editingName)) {
      setNameError('Name must be PascalCase (e.g., WalkCycle)')
      return
    }

    // Attempt to rename
    const success = onRenameClip(clip.id, editingName)
    if (success) {
      setNameError(null)
    } else {
      setNameError('Failed to rename clip')
    }
  }

  const handleInterpolationChange = (value: string) => {
    onSetInterpolation(clip.id, value as InterpolationMode)
  }

  const formatDuration = (duration: number): string => {
    return `${duration.toFixed(2)} seconds`
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Name field */}
      <div className="flex flex-col gap-1">
        <Input
          label="Name"
          value={editingName}
          onChange={(value) => {
            setEditingName(value)
            setNameError(null)
          }}
        />
        {nameError && <p className="text-xs text-red-400">{nameError}</p>}
        {/* Blur handler button */}
        <div className="mt-1">
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-gray-300"
            onClick={handleNameBlur}
          >
            Apply name change
          </button>
        </div>
      </div>

      {/* Duration display (read-only) */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-300">Duration</label>
        <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100">
          {formatDuration(clip.duration)}
        </div>
        <p className="text-xs text-gray-500">
          Computed from last keyframe time
        </p>
      </div>

      {/* Interpolation mode dropdown */}
      <Select
        label="Interpolation Mode"
        value={clip.interpolation}
        onChange={handleInterpolationChange}
        options={interpolationOptions}
      />

      {/* Additional info */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex flex-col gap-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Keyframes:</span>
            <span className="text-gray-100">{clip.keyframes.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Loop Mode:</span>
            <span className="text-gray-100">{clip.loopMode}</span>
          </div>
          <div className="flex justify-between">
            <span>Clip ID:</span>
            <span className="text-gray-500 text-xs font-mono truncate max-w-[150px]">
              {clip.id}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export const ClipPropertiesPanel: React.FC<ClipPropertiesPanelProps> = ({
  clip,
  onRenameClip,
  onSetInterpolation,
}) => {
  return (
    <Panel title="Clip Properties" className="h-full">
      {!clip ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>No clip selected</p>
        </div>
      ) : (
        <ClipPropertiesContent
          key={clip.id}
          clip={clip}
          onRenameClip={onRenameClip}
          onSetInterpolation={onSetInterpolation}
        />
      )}
    </Panel>
  )
}

export default ClipPropertiesPanel
