import React, { useRef, useCallback, useState } from 'react';
import type { Keyframe } from '../../types/animation';
import { TimeRuler } from './TimeRuler';
import { KeyframeTrack } from './KeyframeTrack';
import { Playhead } from './Playhead';

export interface TimelineProps {
  duration: number;
  currentTime: number;
  keyframes: Keyframe[];
  selectedKeyframeId: string | null;
  onTimeChange: (time: number) => void;
  onKeyframeSelect: (id: string | null) => void;
  onKeyframeMove: (id: string, newTime: number) => void;
  zoom?: number;
  snapInterval?: number | null;
}

const TIMELINE_HEIGHT = 120;
const TIME_RULER_HEIGHT = 24;
const DEFAULT_ZOOM = 100; // pixels per second
const MIN_DISPLAY_DURATION = 5; // minimum timeline length in seconds

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  keyframes,
  selectedKeyframeId,
  onTimeChange,
  onKeyframeSelect,
  onKeyframeMove,
  zoom = DEFAULT_ZOOM,
  snapInterval = null,
}) => {
  // Use minimum duration for display, but allow extending beyond
  const displayDuration = Math.max(duration, MIN_DISPLAY_DURATION, currentTime + 1);

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Track drag state for keyframe retiming
  const [draggingKeyframeId, setDraggingKeyframeId] = useState<string | null>(null);
  const dragStartTimeRef = useRef<number>(0);

  // Snap time value to grid if snap interval is set
  const snapTime = useCallback(
    (time: number): number => {
      if (snapInterval && snapInterval > 0) {
        return Math.round(time / snapInterval) * snapInterval;
      }
      return time;
    },
    [snapInterval]
  );

  // Clamp time to valid range (allow up to display duration for playhead)
  const clampTime = useCallback(
    (time: number): number => {
      return Math.max(0, Math.min(displayDuration, time));
    },
    [displayDuration]
  );

  // Keyframe drag handlers
  const handleKeyframeDragStart = useCallback((id: string) => {
    console.log('[Timeline] handleKeyframeDragStart - id:', id)
    const keyframe = keyframes.find(kf => kf.id === id);
    if (keyframe) {
      setDraggingKeyframeId(id);
      dragStartTimeRef.current = keyframe.time;
      console.log('[Timeline] handleKeyframeDragStart - started at time:', keyframe.time)
    }
  }, [keyframes]);

  const handleKeyframeDrag = useCallback((id: string, deltaX: number) => {
    if (draggingKeyframeId !== id) return;
    const deltaTime = deltaX / zoom;
    let newTime = dragStartTimeRef.current + deltaTime;
    newTime = snapTime(newTime);
    newTime = clampTime(newTime);
    console.log('[Timeline] handleKeyframeDrag - id:', id, 'deltaX:', deltaX, 'newTime:', newTime)
    onKeyframeMove(id, newTime);
  }, [draggingKeyframeId, zoom, snapTime, clampTime, onKeyframeMove]);

  const handleKeyframeDragEnd = useCallback(() => {
    setDraggingKeyframeId(null);
  }, []);

  // Handle click on timeline to set playhead position
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      console.log('[Timeline] handleTimelineClick - target:', (e.target as HTMLElement).className)
      if (!trackRef.current) {
        console.log('[Timeline] handleTimelineClick ABORTED - no trackRef')
        return;
      }

      const rect = trackRef.current.getBoundingClientRect();
      const scrollLeft = trackRef.current.parentElement?.scrollLeft || 0;
      const clickX = e.clientX - rect.left + scrollLeft;
      const time = clickX / zoom;

      const snappedTime = snapTime(time);
      const clampedTime = clampTime(snappedTime);

      console.log('[Timeline] handleTimelineClick - clickX:', clickX, 'time:', time, 'snappedTime:', snappedTime, 'clampedTime:', clampedTime)
      onTimeChange(clampedTime);
    },
    [zoom, snapTime, clampTime, onTimeChange]
  );

  // Calculate total content width based on display duration
  const contentWidth = Math.max(displayDuration * zoom, 100);

  // Track height (total height minus ruler)
  const trackHeight = TIMELINE_HEIGHT - TIME_RULER_HEIGHT;

  return (
    <div
      ref={containerRef}
      className="relative bg-gray-800 border-t border-gray-700 select-none"
      style={{ height: TIMELINE_HEIGHT }}
    >
      {/* Horizontally scrollable container */}
      <div
        className="overflow-x-auto overflow-y-hidden h-full"
        style={{ scrollbarGutter: 'stable' }}
      >
        {/* Content wrapper with minimum width */}
        <div
          ref={trackRef}
          className="relative"
          style={{
            minWidth: contentWidth,
            height: TIMELINE_HEIGHT,
          }}
          onClick={handleTimelineClick}
        >
          {/* Time ruler at top */}
          <TimeRuler
            duration={displayDuration}
            pixelsPerSecond={zoom}
            height={TIME_RULER_HEIGHT}
          />

          {/* Keyframe track */}
          <div style={{ height: trackHeight }} className="relative">
            <KeyframeTrack
              keyframes={keyframes}
              selectedKeyframeId={selectedKeyframeId}
              pixelsPerSecond={zoom}
              duration={displayDuration}
              onKeyframeSelect={onKeyframeSelect}
              onKeyframeDragStart={handleKeyframeDragStart}
              onKeyframeDrag={handleKeyframeDrag}
              onKeyframeDragEnd={handleKeyframeDragEnd}
            />
          </div>

          {/* Playhead overlay */}
          <Playhead
            currentTime={currentTime}
            pixelsPerSecond={zoom}
            height={TIMELINE_HEIGHT}
          />

          {/* Snap grid visualization (subtle lines) */}
          {snapInterval && snapInterval > 0 && (
            <div className="absolute inset-0 pointer-events-none" style={{ top: TIME_RULER_HEIGHT }}>
              {Array.from({ length: Math.ceil(displayDuration / snapInterval) + 1 }).map((_, i) => {
                const time = i * snapInterval;
                if (time > displayDuration) return null;
                return (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px bg-gray-600 opacity-30"
                    style={{ transform: `translateX(${time * zoom}px)` }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Duration indicator - show actual duration or keyframe count */}
      <div className="absolute bottom-1 right-2 text-xs text-gray-500 pointer-events-none">
        {keyframes.length > 0
          ? `${duration.toFixed(1)}s (${keyframes.length} KF)`
          : 'No keyframes'}
      </div>
    </div>
  );
};

export default Timeline;
