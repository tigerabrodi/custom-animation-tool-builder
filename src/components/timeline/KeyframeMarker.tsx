import React, { useRef, useEffect } from 'react';
import type { Keyframe } from '../../types/animation';

export interface KeyframeMarkerProps {
  keyframe: Keyframe;
  isSelected: boolean;
  pixelsPerSecond: number;
  onSelect: () => void;
  onDragStart?: () => void;
  onDrag?: (deltaX: number) => void;
  onDragEnd?: () => void;
}

export const KeyframeMarker: React.FC<KeyframeMarkerProps> = ({
  keyframe,
  isSelected,
  pixelsPerSecond,
  onSelect,
  onDragStart,
  onDrag,
  onDragEnd,
}) => {
  const leftPosition = keyframe.time * pixelsPerSecond;
  const isDraggingRef = useRef(false);
  const didDragRef = useRef(false); // Track if actual dragging occurred
  const startXRef = useRef(0);

  // Diamond shape size
  const size = 12;
  const halfSize = size / 2;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only select if we didn't actually drag (click fires after mouseup)
    if (!didDragRef.current) {
      onSelect();
    }
    didDragRef.current = false;
  };

  // Store handlers in refs to avoid circular dependencies and stale closures
  const handlersRef = useRef<{
    move: ((e: MouseEvent) => void) | null;
    up: (() => void) | null;
  }>({ move: null, up: null });

  // Set up drag handlers
  useEffect(() => {
    const moveHandler = (e: MouseEvent) => {
      if (!isDraggingRef.current || !onDrag) return;
      const deltaX = e.clientX - startXRef.current;
      // Mark that actual dragging occurred (mouse moved while button down)
      if (Math.abs(deltaX) > 2) {
        didDragRef.current = true;
      }
      onDrag(deltaX);
    };

    const upHandler = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        onDragEnd?.();
      }
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };

    handlersRef.current.move = moveHandler;
    handlersRef.current.up = upHandler;

    return () => {
      // Cleanup on unmount
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };
  }, [onDrag, onDragEnd]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    onDragStart?.();
    if (handlersRef.current.move) {
      document.addEventListener('mousemove', handlersRef.current.move);
    }
    if (handlersRef.current.up) {
      document.addEventListener('mouseup', handlersRef.current.up);
    }
  };

  return (
    <div
      className="absolute cursor-pointer group"
      style={{
        transform: `translateX(${leftPosition}px) translateX(-${halfSize}px)`,
        top: '50%',
        marginTop: -halfSize,
      }}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      title={keyframe.label || `Keyframe at ${keyframe.time.toFixed(2)}s`}
    >
      {/* Diamond shape (rotated square) */}
      <div
        className={`
          transform rotate-45 transition-all duration-100
          ${isSelected
            ? 'bg-cyan-400 ring-2 ring-cyan-300 ring-offset-1 ring-offset-gray-800'
            : 'bg-amber-500 hover:bg-amber-400 group-hover:ring-1 group-hover:ring-amber-400'
          }
        `}
        style={{
          width: size,
          height: size,
        }}
      />

      {/* Label tooltip on hover */}
      {keyframe.label && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <span className="text-xs bg-gray-900 text-gray-200 px-1.5 py-0.5 rounded whitespace-nowrap">
            {keyframe.label}
          </span>
        </div>
      )}
    </div>
  );
};

export default KeyframeMarker;
