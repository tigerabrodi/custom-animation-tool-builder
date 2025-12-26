import React, { useState } from 'react';
import { Panel } from '../layout/Panel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { AnimationClip } from '../../types/animation';
import { validatePascalCase } from '../../utils/validation';

interface ClipListPanelProps {
  clips: AnimationClip[];
  activeClipId: string | null;
  onSelectClip: (clipId: string | null) => void;
  onCreateClip: (name: string) => AnimationClip | null;
  onDuplicateClip: (clipId: string, newName: string) => AnimationClip | null;
  onDeleteClip: (clipId: string) => boolean;
}

export const ClipListPanel: React.FC<ClipListPanelProps> = ({
  clips,
  activeClipId,
  onSelectClip,
  onCreateClip,
  onDuplicateClip,
  onDeleteClip,
}) => {
  const [newClipName, setNewClipName] = useState('');
  const [showNewClipInput, setShowNewClipInput] = useState(false);
  const [showDuplicateInput, setShowDuplicateInput] = useState<string | null>(null);
  const [duplicateName, setDuplicateName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateClip = () => {
    if (!validatePascalCase(newClipName)) {
      setError('Name must be PascalCase (e.g., WalkCycle, IdleAnimation)');
      return;
    }

    const result = onCreateClip(newClipName);
    if (result) {
      setNewClipName('');
      setShowNewClipInput(false);
      setError(null);
    } else {
      setError('Failed to create clip');
    }
  };

  const handleDuplicateClip = (clipId: string) => {
    if (!validatePascalCase(duplicateName)) {
      setError('Name must be PascalCase (e.g., WalkCycle, IdleAnimation)');
      return;
    }

    const result = onDuplicateClip(clipId, duplicateName);
    if (result) {
      setDuplicateName('');
      setShowDuplicateInput(null);
      setError(null);
    } else {
      setError('Failed to duplicate clip');
    }
  };

  const handleDeleteClip = (clipId: string) => {
    onDeleteClip(clipId);
  };

  const formatDuration = (duration: number): string => {
    return `${duration.toFixed(2)}s`;
  };

  return (
    <Panel title="Animation Clips" className="h-full">
      <div className="flex flex-col gap-3">
        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => {
              setShowNewClipInput(true);
              setError(null);
            }}
          >
            New Clip
          </Button>
        </div>

        {/* New clip input */}
        {showNewClipInput && (
          <div className="flex flex-col gap-2 p-2 bg-gray-800 rounded-md">
            <Input
              value={newClipName}
              onChange={setNewClipName}
              placeholder="ClipName (PascalCase)"
              label="New Clip Name"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateClip}>
                Create
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowNewClipInput(false);
                  setNewClipName('');
                  setError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Clips list */}
        {clips.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No clips</p>
            <p className="text-sm mt-1">Create a new clip to get started</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {clips.map((clip) => {
              const isActive = clip.id === activeClipId;
              const keyframeCount = clip.keyframes.length;
              const duration = clip.duration;

              return (
                <div key={clip.id} className="flex flex-col gap-1">
                  <div
                    onClick={() => onSelectClip(isActive ? null : clip.id)}
                    className={`
                      p-3 rounded-md cursor-pointer transition-colors
                      ${
                        isActive
                          ? 'bg-blue-600 border border-blue-500'
                          : 'bg-gray-800 border border-gray-700 hover:bg-gray-750 hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4
                          className={`font-medium truncate ${
                            isActive ? 'text-white' : 'text-gray-100'
                          }`}
                        >
                          {clip.name}
                        </h4>
                        <div
                          className={`text-xs mt-1 ${
                            isActive ? 'text-blue-200' : 'text-gray-400'
                          }`}
                        >
                          <span>{formatDuration(duration)}</span>
                          <span className="mx-2">|</span>
                          <span>
                            {keyframeCount} keyframe{keyframeCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDuplicateInput(clip.id);
                            setDuplicateName(`${clip.name}Copy`);
                            setError(null);
                          }}
                        >
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClip(clip.id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Duplicate input */}
                  {showDuplicateInput === clip.id && (
                    <div className="flex flex-col gap-2 p-2 bg-gray-800 rounded-md ml-4">
                      <Input
                        value={duplicateName}
                        onChange={setDuplicateName}
                        placeholder="NewClipName (PascalCase)"
                        label="Duplicate Name"
                      />
                      {error && <p className="text-xs text-red-400">{error}</p>}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDuplicateClip(clip.id)}
                        >
                          Duplicate
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setShowDuplicateInput(null);
                            setDuplicateName('');
                            setError(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Panel>
  );
};

export default ClipListPanel;
