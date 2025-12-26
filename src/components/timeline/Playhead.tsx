import React from 'react';

export interface PlayheadProps {
  currentTime: number;
  pixelsPerSecond: number;
  height: number;
}

export const Playhead: React.FC<PlayheadProps> = ({
  currentTime,
  pixelsPerSecond,
  height,
}) => {
  const leftPosition = currentTime * pixelsPerSecond;

  return (
    <div
      className="absolute top-0 pointer-events-none z-20"
      style={{
        transform: `translateX(${leftPosition}px)`,
        height,
      }}
    >
      {/* Triangle handle at top */}
      <div
        className="absolute -translate-x-1/2"
        style={{ top: 0 }}
      >
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          className="fill-red-500"
        >
          <polygon points="0,0 12,0 6,8" />
        </svg>
      </div>

      {/* Vertical line */}
      <div
        className="absolute -translate-x-1/2 bg-red-500"
        style={{
          width: 2,
          top: 8,
          height: height - 8,
        }}
      />
    </div>
  );
};

export default Playhead;
