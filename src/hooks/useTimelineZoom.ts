import { useState, useCallback, useMemo } from 'react';

export interface UseTimelineZoomOptions {
  /** Minimum zoom level in pixels per second (default: 20) */
  minZoom?: number;
  /** Maximum zoom level in pixels per second (default: 500) */
  maxZoom?: number;
  /** Default zoom level in pixels per second (default: 100) */
  defaultZoom?: number;
}

export interface UseTimelineZoomReturn {
  /** Current zoom level in pixels per second */
  zoom: number;
  /** Increase zoom level (zoom in) */
  zoomIn: () => void;
  /** Decrease zoom level (zoom out) */
  zoomOut: () => void;
  /** Set zoom to a specific value */
  setZoom: (zoom: number) => void;
  /** Reset zoom to default level */
  resetZoom: () => void;
}

// Predefined zoom levels that roughly double/halve
const ZOOM_LEVELS = [25, 50, 100, 200, 400];

/**
 * Hook for managing timeline zoom level.
 * Provides zoom in/out functionality with predefined levels that roughly double/halve.
 */
export function useTimelineZoom(
  options: UseTimelineZoomOptions = {}
): UseTimelineZoomReturn {
  const { minZoom = 20, maxZoom = 500, defaultZoom = 100 } = options;

  const [zoom, setZoomState] = useState(defaultZoom);

  // Get available zoom levels within min/max bounds
  const availableLevels = useMemo(() => {
    return ZOOM_LEVELS.filter((level) => level >= minZoom && level <= maxZoom);
  }, [minZoom, maxZoom]);

  const zoomIn = useCallback(() => {
    setZoomState((currentZoom) => {
      // Find the next higher zoom level
      const higherLevels = availableLevels.filter(
        (level) => level > currentZoom
      );
      if (higherLevels.length > 0) {
        return higherLevels[0];
      }
      // Already at max, stay at current
      return Math.min(currentZoom, maxZoom);
    });
  }, [availableLevels, maxZoom]);

  const zoomOut = useCallback(() => {
    setZoomState((currentZoom) => {
      // Find the next lower zoom level
      const lowerLevels = availableLevels.filter(
        (level) => level < currentZoom
      );
      if (lowerLevels.length > 0) {
        return lowerLevels[lowerLevels.length - 1];
      }
      // Already at min, stay at current
      return Math.max(currentZoom, minZoom);
    });
  }, [availableLevels, minZoom]);

  const setZoom = useCallback(
    (newZoom: number) => {
      // Clamp to bounds
      const clampedZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
      setZoomState(clampedZoom);
    },
    [minZoom, maxZoom]
  );

  const resetZoom = useCallback(() => {
    setZoomState(defaultZoom);
  }, [defaultZoom]);

  return {
    zoom,
    zoomIn,
    zoomOut,
    setZoom,
    resetZoom,
  };
}

export default useTimelineZoom;
