import React from 'react';
import type { Keyframe } from '../../types/animation';
import { KeyframeMarker } from './KeyframeMarker';

export interface KeyframeTrackProps {
  keyframes: Keyframe[];
  selectedKeyframeId: string | null;
  pixelsPerSecond: number;
  duration: number;
  onKeyframeSelect: (id: string | null) => void;
  onKeyframeDragStart?: (id: string) => void;
  onKeyframeDrag?: (id: string, deltaX: number) => void;
  onKeyframeDragEnd?: (id: string) => void;
}

export const KeyframeTrack: React.FC<KeyframeTrackProps> = ({
  keyframes,
  selectedKeyframeId,
  pixelsPerSecond,
  duration,
  onKeyframeSelect,
  onKeyframeDragStart,
  onKeyframeDrag,
  onKeyframeDragEnd,
}) => {
  // Calculate total width
  const totalWidth = Math.max(duration * pixelsPerSecond, 100);

  // Handle click on empty track area (deselect keyframe)
  const handleTrackClick = (e: React.MouseEvent) => {
    // Only trigger if clicking directly on the track, not a keyframe
    if (e.target === e.currentTarget) {
      onKeyframeSelect(null);
    }
  };

  return (
    <div
      className="relative bg-gray-700 flex-1"
      style={{ minWidth: totalWidth }}
      onClick={handleTrackClick}
    >
      {/* Empty state message */}
      {keyframes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm pointer-events-none">
          No keyframes
        </div>
      )}

      {/* Keyframe markers */}
      {keyframes.map((keyframe) => (
        <KeyframeMarker
          key={keyframe.id}
          keyframe={keyframe}
          isSelected={keyframe.id === selectedKeyframeId}
          pixelsPerSecond={pixelsPerSecond}
          onSelect={() => onKeyframeSelect(keyframe.id)}
          onDragStart={
            onKeyframeDragStart
              ? () => onKeyframeDragStart(keyframe.id)
              : undefined
          }
          onDrag={
            onKeyframeDrag
              ? (deltaX) => onKeyframeDrag(keyframe.id, deltaX)
              : undefined
          }
          onDragEnd={
            onKeyframeDragEnd
              ? () => onKeyframeDragEnd(keyframe.id)
              : undefined
          }
        />
      ))}
    </div>
  );
};

export default KeyframeTrack;
