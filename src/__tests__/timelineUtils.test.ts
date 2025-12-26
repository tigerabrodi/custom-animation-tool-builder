import { describe, it, expect } from 'vitest';
import {
  snapToGrid,
  pixelsToTime,
  timeToPixels,
  getTickInterval,
  getVisibleTimeRange,
  clamp,
  formatTime,
} from '../utils/timelineUtils';

describe('snapToGrid', () => {
  it('should snap to nearest grid interval', () => {
    expect(snapToGrid(0.23, 0.25)).toBe(0.25);
    expect(snapToGrid(0.12, 0.25)).toBe(0);
    expect(snapToGrid(0.13, 0.25)).toBe(0.25);
  });

  it('should return exact value when on grid', () => {
    expect(snapToGrid(0.5, 0.25)).toBe(0.5);
    expect(snapToGrid(1.0, 0.25)).toBe(1.0);
    expect(snapToGrid(0, 0.25)).toBe(0);
  });

  it('should handle larger intervals', () => {
    expect(snapToGrid(2.3, 1)).toBe(2);
    expect(snapToGrid(2.7, 1)).toBe(3);
  });

  it('should handle small intervals', () => {
    expect(snapToGrid(0.123, 0.1)).toBeCloseTo(0.1);
    expect(snapToGrid(0.156, 0.1)).toBeCloseTo(0.2);
    expect(snapToGrid(0.074, 0.05)).toBeCloseTo(0.05);
  });

  it('should return original time when interval is null', () => {
    expect(snapToGrid(0.123, null)).toBe(0.123);
    expect(snapToGrid(5.678, null)).toBe(5.678);
  });

  it('should return original time when interval is 0 or negative', () => {
    expect(snapToGrid(0.123, 0)).toBe(0.123);
    expect(snapToGrid(0.123, -0.25)).toBe(0.123);
  });

  it('should handle negative time values', () => {
    expect(snapToGrid(-0.3, 0.25)).toBe(-0.25);
    expect(snapToGrid(-0.13, 0.25)).toBe(-0.25);
    expect(snapToGrid(-0.37, 0.25)).toBe(-0.25);
    expect(snapToGrid(-0.38, 0.25)).toBe(-0.5);
  });
});

describe('pixelsToTime', () => {
  it('should convert pixels to time correctly', () => {
    // At 100 px/s, 100 pixels = 1 second
    expect(pixelsToTime(100, 100)).toBe(1);
    expect(pixelsToTime(200, 100)).toBe(2);
    expect(pixelsToTime(50, 100)).toBe(0.5);
  });

  it('should handle different zoom levels', () => {
    // At 50 px/s, 100 pixels = 2 seconds
    expect(pixelsToTime(100, 50)).toBe(2);
    // At 200 px/s, 100 pixels = 0.5 seconds
    expect(pixelsToTime(100, 200)).toBe(0.5);
  });

  it('should handle zero pixels', () => {
    expect(pixelsToTime(0, 100)).toBe(0);
  });

  it('should handle negative pixels', () => {
    expect(pixelsToTime(-100, 100)).toBe(-1);
  });

  it('should return 0 for zero or negative pixelsPerSecond', () => {
    expect(pixelsToTime(100, 0)).toBe(0);
    expect(pixelsToTime(100, -100)).toBe(0);
  });
});

describe('timeToPixels', () => {
  it('should convert time to pixels correctly', () => {
    // At 100 px/s, 1 second = 100 pixels
    expect(timeToPixels(1, 100)).toBe(100);
    expect(timeToPixels(2, 100)).toBe(200);
    expect(timeToPixels(0.5, 100)).toBe(50);
  });

  it('should handle different zoom levels', () => {
    // At 50 px/s, 1 second = 50 pixels
    expect(timeToPixels(1, 50)).toBe(50);
    // At 200 px/s, 1 second = 200 pixels
    expect(timeToPixels(1, 200)).toBe(200);
  });

  it('should handle zero time', () => {
    expect(timeToPixels(0, 100)).toBe(0);
  });

  it('should handle negative time', () => {
    expect(timeToPixels(-1, 100)).toBe(-100);
  });

  it('should be inverse of pixelsToTime', () => {
    const testCases = [
      { pixels: 150, zoom: 100 },
      { pixels: 200, zoom: 50 },
      { pixels: 75, zoom: 200 },
    ];

    for (const { pixels, zoom } of testCases) {
      const time = pixelsToTime(pixels, zoom);
      expect(timeToPixels(time, zoom)).toBeCloseTo(pixels);
    }
  });
});

describe('getTickInterval', () => {
  it('should return appropriate intervals for low zoom (zoomed out)', () => {
    const result = getTickInterval(25);
    expect(result.major).toBeGreaterThanOrEqual(1);
    expect(result.minor).toBeLessThan(result.major);
  });

  it('should return appropriate intervals for medium zoom', () => {
    const result = getTickInterval(100);
    expect(result.major).toBeGreaterThan(0);
    expect(result.minor).toBeLessThan(result.major);
    expect(result.minor).toBeGreaterThan(0);
  });

  it('should return appropriate intervals for high zoom (zoomed in)', () => {
    const result = getTickInterval(400);
    expect(result.major).toBeLessThanOrEqual(1);
    expect(result.minor).toBeLessThan(result.major);
  });

  it('should return smaller intervals as zoom increases', () => {
    const lowZoom = getTickInterval(25);
    const highZoom = getTickInterval(400);
    expect(lowZoom.major).toBeGreaterThanOrEqual(highZoom.major);
  });

  it('should always have minor < major', () => {
    const zoomLevels = [25, 50, 100, 200, 400];
    for (const zoom of zoomLevels) {
      const result = getTickInterval(zoom);
      expect(result.minor).toBeLessThan(result.major);
    }
  });

  it('should return nice intervals (not arbitrary decimals)', () => {
    const niceValues = [0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10, 12, 30, 60];
    const zoomLevels = [25, 50, 100, 200, 400];

    for (const zoom of zoomLevels) {
      const result = getTickInterval(zoom);
      // Major should be close to one of the nice values
      const isNiceMajor = niceValues.some(
        (v) => Math.abs(result.major - v) < 0.001
      );
      expect(isNiceMajor).toBe(true);
    }
  });
});

describe('getVisibleTimeRange', () => {
  it('should calculate visible range correctly', () => {
    // At 100 px/s, scrolled to 0, with 500px width
    // Visible: 0s to 5s
    const result = getVisibleTimeRange(0, 500, 100);
    expect(result.start).toBe(0);
    expect(result.end).toBe(5);
  });

  it('should handle scroll offset', () => {
    // At 100 px/s, scrolled 200px right, with 500px width
    // Visible: 2s to 7s
    const result = getVisibleTimeRange(200, 500, 100);
    expect(result.start).toBe(2);
    expect(result.end).toBe(7);
  });

  it('should handle different zoom levels', () => {
    // At 50 px/s, scrolled to 0, with 500px width
    // Visible: 0s to 10s
    const result = getVisibleTimeRange(0, 500, 50);
    expect(result.start).toBe(0);
    expect(result.end).toBe(10);
  });

  it('should handle zoomed in view', () => {
    // At 200 px/s, scrolled to 0, with 500px width
    // Visible: 0s to 2.5s
    const result = getVisibleTimeRange(0, 500, 200);
    expect(result.start).toBe(0);
    expect(result.end).toBe(2.5);
  });

  it('should handle combined scroll and zoom', () => {
    // At 200 px/s, scrolled 400px right, with 600px width
    // Start: 400/200 = 2s, End: (400+600)/200 = 5s
    const result = getVisibleTimeRange(400, 600, 200);
    expect(result.start).toBe(2);
    expect(result.end).toBe(5);
  });

  it('should return zero range for zero pixelsPerSecond', () => {
    const result = getVisibleTimeRange(100, 500, 0);
    expect(result.start).toBe(0);
    expect(result.end).toBe(0);
  });

  it('should return zero range for negative pixelsPerSecond', () => {
    const result = getVisibleTimeRange(100, 500, -100);
    expect(result.start).toBe(0);
    expect(result.end).toBe(0);
  });
});

describe('clamp', () => {
  it('should clamp values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('should clamp values below min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(-100, 0, 10)).toBe(0);
  });

  it('should clamp values above max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(100, 0, 10)).toBe(10);
  });

  it('should handle negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-15, -10, -1)).toBe(-10);
    expect(clamp(0, -10, -1)).toBe(-1);
  });
});

describe('formatTime', () => {
  it('should format short times in seconds', () => {
    expect(formatTime(0)).toBe('0.00s');
    expect(formatTime(1)).toBe('1.00s');
    expect(formatTime(1.5)).toBe('1.50s');
    expect(formatTime(59.99)).toBe('59.99s');
  });

  it('should format times >= 60s with minutes', () => {
    expect(formatTime(60)).toBe('1:00.0');
    expect(formatTime(90)).toBe('1:30.0');
    expect(formatTime(125.5)).toBe('2:05.5');
  });

  it('should respect showMinutes option', () => {
    expect(formatTime(90, true)).toBe('1:30.0');
    expect(formatTime(90, false)).toBe('90.00s');
  });
});
