import { describe, it, expect } from 'vitest';
import {
  snapToGrid,
  scaleKeyframeTimes,
  offsetKeyframeTimes,
  getClipDuration,
} from '../utils/timeline';

describe('snapToGrid', () => {
  it('should snap to nearest grid position', () => {
    expect(snapToGrid(0.23, 0.25)).toBe(0.25);
    expect(snapToGrid(0.12, 0.25)).toBe(0);
    expect(snapToGrid(0.13, 0.25)).toBe(0.25);
  });

  it('should return exact value when on grid', () => {
    expect(snapToGrid(0.5, 0.25)).toBe(0.5);
    expect(snapToGrid(1.0, 0.25)).toBe(1.0);
  });

  it('should handle zero time', () => {
    expect(snapToGrid(0, 0.25)).toBe(0);
  });

  it('should handle larger grid sizes', () => {
    expect(snapToGrid(2.3, 1)).toBe(2);
    expect(snapToGrid(2.7, 1)).toBe(3);
  });

  it('should handle small grid sizes', () => {
    expect(snapToGrid(0.123, 0.1)).toBeCloseTo(0.1);
    expect(snapToGrid(0.156, 0.1)).toBeCloseTo(0.2);
  });

  it('should return original time when gridSize is 0', () => {
    expect(snapToGrid(0.123, 0)).toBe(0.123);
  });

  it('should return original time when gridSize is negative', () => {
    expect(snapToGrid(0.123, -0.25)).toBe(0.123);
  });

  it('should handle negative time values', () => {
    expect(snapToGrid(-0.3, 0.25)).toBe(-0.25);
    expect(snapToGrid(-0.13, 0.25)).toBe(-0.25);
  });
});

describe('getClipDuration', () => {
  it('should return 0 for empty array', () => {
    expect(getClipDuration([])).toBe(0);
  });

  it('should return single keyframe time', () => {
    expect(getClipDuration([{ time: 2.5 }])).toBe(2.5);
  });

  it('should return max time from multiple keyframes', () => {
    const keyframes = [{ time: 0 }, { time: 1 }, { time: 2 }, { time: 1.5 }];
    expect(getClipDuration(keyframes)).toBe(2);
  });

  it('should handle keyframes at time 0', () => {
    const keyframes = [{ time: 0 }, { time: 0 }, { time: 0 }];
    expect(getClipDuration(keyframes)).toBe(0);
  });

  it('should preserve extra properties', () => {
    const keyframes = [{ time: 1, name: 'test' }, { time: 2, name: 'test2' }];
    expect(getClipDuration(keyframes)).toBe(2);
  });
});

describe('scaleKeyframeTimes', () => {
  it('should return empty array for empty input', () => {
    expect(scaleKeyframeTimes([], 10)).toEqual([]);
  });

  it('should scale keyframes to target duration', () => {
    const keyframes = [{ time: 0 }, { time: 1 }, { time: 2 }];
    const result = scaleKeyframeTimes(keyframes, 4);
    expect(result[0].time).toBe(0);
    expect(result[1].time).toBe(2);
    expect(result[2].time).toBe(4);
  });

  it('should handle scaling down', () => {
    const keyframes = [{ time: 0 }, { time: 2 }, { time: 4 }];
    const result = scaleKeyframeTimes(keyframes, 2);
    expect(result[0].time).toBe(0);
    expect(result[1].time).toBe(1);
    expect(result[2].time).toBe(2);
  });

  it('should preserve extra properties', () => {
    const keyframes = [
      { time: 0, boneName: 'Hips' },
      { time: 1, boneName: 'LeftArm' },
    ];
    const result = scaleKeyframeTimes(keyframes, 2);
    expect(result[0].boneName).toBe('Hips');
    expect(result[1].boneName).toBe('LeftArm');
  });

  it('should not mutate original array', () => {
    const keyframes = [{ time: 0 }, { time: 1 }];
    const result = scaleKeyframeTimes(keyframes, 2);
    expect(keyframes[1].time).toBe(1);
    expect(result[1].time).toBe(2);
    expect(result).not.toBe(keyframes);
  });

  it('should handle all keyframes at time 0', () => {
    const keyframes = [{ time: 0 }, { time: 0 }];
    const result = scaleKeyframeTimes(keyframes, 2);
    expect(result[0].time).toBe(0);
    expect(result[1].time).toBe(0);
  });

  it('should handle non-integer scaling', () => {
    const keyframes = [{ time: 0 }, { time: 3 }];
    const result = scaleKeyframeTimes(keyframes, 1);
    expect(result[0].time).toBeCloseTo(0);
    expect(result[1].time).toBeCloseTo(1);
  });
});

describe('offsetKeyframeTimes', () => {
  it('should return empty array for empty input', () => {
    expect(offsetKeyframeTimes([], 5)).toEqual([]);
  });

  it('should add positive offset', () => {
    const keyframes = [{ time: 0 }, { time: 1 }, { time: 2 }];
    const result = offsetKeyframeTimes(keyframes, 5);
    expect(result[0].time).toBe(5);
    expect(result[1].time).toBe(6);
    expect(result[2].time).toBe(7);
  });

  it('should add negative offset', () => {
    const keyframes = [{ time: 5 }, { time: 6 }, { time: 7 }];
    const result = offsetKeyframeTimes(keyframes, -5);
    expect(result[0].time).toBe(0);
    expect(result[1].time).toBe(1);
    expect(result[2].time).toBe(2);
  });

  it('should handle zero offset', () => {
    const keyframes = [{ time: 1 }, { time: 2 }];
    const result = offsetKeyframeTimes(keyframes, 0);
    expect(result[0].time).toBe(1);
    expect(result[1].time).toBe(2);
  });

  it('should preserve extra properties', () => {
    const keyframes = [
      { time: 0, name: 'first' },
      { time: 1, name: 'second' },
    ];
    const result = offsetKeyframeTimes(keyframes, 10);
    expect(result[0].name).toBe('first');
    expect(result[1].name).toBe('second');
  });

  it('should not mutate original array', () => {
    const keyframes = [{ time: 0 }, { time: 1 }];
    const result = offsetKeyframeTimes(keyframes, 5);
    expect(keyframes[0].time).toBe(0);
    expect(result[0].time).toBe(5);
    expect(result).not.toBe(keyframes);
  });

  it('should handle fractional offset', () => {
    const keyframes = [{ time: 0 }, { time: 1 }];
    const result = offsetKeyframeTimes(keyframes, 0.5);
    expect(result[0].time).toBe(0.5);
    expect(result[1].time).toBe(1.5);
  });
});
