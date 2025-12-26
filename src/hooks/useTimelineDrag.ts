import { useState, useCallback, useEffect, useRef } from 'react';
import { snapToGrid, pixelsToTime, clamp } from '../utils/timelineUtils';

export interface UseTimelineDragOptions {
  /** Zoom level in pixels per second */
  pixelsPerSecond: number;
  /** Snap interval in seconds, or null for no snapping */
  snapInterval: number | null;
  /** Minimum allowed time value */
  minTime?: number;
  /** Maximum allowed time value */
  maxTime?: number;
  /** Callback fired during drag with new time value */
  onDrag: (newTime: number) => void;
  /** Callback fired when drag ends */
  onDragEnd?: () => void;
}

export interface UseTimelineDragReturn {
  /** Whether a drag operation is currently in progress */
  isDragging: boolean;
  /** Handler to start dragging from a mouse event */
  handleMouseDown: (e: React.MouseEvent, startTime: number) => void;
}

/**
 * Hook for handling drag interactions on the timeline.
 * Supports snap-to-grid, min/max bounds, and smooth dragging even when
 * the mouse leaves the timeline element.
 */
export function useTimelineDrag(
  options: UseTimelineDragOptions
): UseTimelineDragReturn {
  const [isDragging, setIsDragging] = useState(false);

  // Store values in refs to avoid stale closures in event handlers
  const dragStateRef = useRef<{
    startX: number;
    startTime: number;
  } | null>(null);

  const optionsRef = useRef(options);

  // Update options ref in effect to avoid ref update during render
  useEffect(() => {
    optionsRef.current = options;
  });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current) return;

    const { startX, startTime } = dragStateRef.current;
    const { pixelsPerSecond, snapInterval, minTime = 0, maxTime = Infinity, onDrag } =
      optionsRef.current;

    // Calculate pixel delta from start position
    const deltaX = e.clientX - startX;

    // Convert pixel delta to time delta
    const deltaTime = pixelsToTime(deltaX, pixelsPerSecond);

    // Calculate new time
    let newTime = startTime + deltaTime;

    // Apply snap-to-grid if enabled
    newTime = snapToGrid(newTime, snapInterval);

    // Clamp to bounds
    newTime = clamp(newTime, minTime, maxTime);

    onDrag(newTime);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStateRef.current = null;

    const { onDragEnd } = optionsRef.current;
    if (onDragEnd) {
      onDragEnd();
    }
  }, []);

  // Set up and clean up document-level event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, startTime: number) => {
      // Prevent text selection during drag
      e.preventDefault();

      dragStateRef.current = {
        startX: e.clientX,
        startTime,
      };

      setIsDragging(true);
    },
    []
  );

  return {
    isDragging,
    handleMouseDown,
  };
}

export default useTimelineDrag;
