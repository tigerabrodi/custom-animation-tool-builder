import React, { useState } from 'react';
import { Panel } from '../layout/Panel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ClipOperationsPanelProps {
  clipId: string | null;
  duration: number;
  onScaleDuration: (clipId: string, factor: number) => void;
  onOffsetTiming: (clipId: string, offset: number) => void;
  onReverseClip: (clipId: string) => void;
}

export const ClipOperationsPanel: React.FC<ClipOperationsPanelProps> = ({
  clipId,
  duration,
  onScaleDuration,
  onOffsetTiming,
  onReverseClip,
}) => {
  const [customScale, setCustomScale] = useState<string>('1');
  const [customOffset, setCustomOffset] = useState<string>('0');

  const formatDuration = (seconds: number): string => {
    return `${seconds.toFixed(2)}s`;
  };

  const handleScaleClick = (factor: number) => {
    if (clipId) {
      onScaleDuration(clipId, factor);
    }
  };

  const handleCustomScale = () => {
    if (clipId) {
      const factor = parseFloat(customScale);
      if (!isNaN(factor) && factor > 0) {
        onScaleDuration(clipId, factor);
      }
    }
  };

  const handleOffsetClick = (offset: number) => {
    if (clipId) {
      onOffsetTiming(clipId, offset);
    }
  };

  const handleCustomOffset = () => {
    if (clipId) {
      const offset = parseFloat(customOffset);
      if (!isNaN(offset)) {
        onOffsetTiming(clipId, offset);
      }
    }
  };

  const handleReverse = () => {
    if (clipId) {
      onReverseClip(clipId);
    }
  };

  return (
    <Panel title="Clip Operations" className="h-full">
      {!clipId ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <p>No clip selected</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Current Duration Display */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-300">
              Current Duration
            </label>
            <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-100 text-lg font-mono">
              {formatDuration(duration)}
            </div>
          </div>

          {/* Scale Duration Section */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-300">
              Scale Duration
            </label>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleScaleClick(0.5)}
              >
                0.5x
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleScaleClick(2)}
              >
                2x
              </Button>
            </div>
            <div className="flex gap-2 items-end">
              <Input
                label="Custom factor"
                type="number"
                value={customScale}
                onChange={(value) => setCustomScale(value)}
                placeholder="e.g., 1.5"
                className="flex-1 min-w-0"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCustomScale}
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Offset Timing Section */}
          <div className="flex flex-col gap-2 pt-4 border-t border-gray-700">
            <label className="text-sm font-medium text-gray-300">
              Offset Timing
            </label>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOffsetClick(-0.5)}
              >
                -0.5s
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOffsetClick(0.5)}
              >
                +0.5s
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleOffsetClick(1)}
              >
                +1s
              </Button>
            </div>
            <div className="flex gap-2 items-end">
              <Input
                label="Custom offset (seconds)"
                type="number"
                value={customOffset}
                onChange={(value) => setCustomOffset(value)}
                placeholder="e.g., -1.5"
                className="flex-1 min-w-0"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCustomOffset}
              >
                Apply
              </Button>
            </div>
          </div>

          {/* Reverse Section */}
          <div className="flex flex-col gap-2 pt-4 border-t border-gray-700">
            <label className="text-sm font-medium text-gray-300">
              Reverse Clip
            </label>
            <p className="text-xs text-gray-500">
              Reverses the timing of all keyframes. The first keyframe becomes
              the last, and vice versa.
            </p>
            <Button
              variant="secondary"
              size="md"
              onClick={handleReverse}
            >
              Reverse Keyframe Order
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
};

export default ClipOperationsPanel;
