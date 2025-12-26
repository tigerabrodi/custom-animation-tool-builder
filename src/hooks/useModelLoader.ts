import { useState, useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { loadGLBFile } from '../services/glbLoader';

interface UseModelLoaderResult {
  modelUrl: string | null;
  isLoading: boolean;
  error: string | null;
  loadedScene: THREE.Object3D | null;
  loadModel: (file: File) => Promise<void>;
  clearModel: () => void;
  setLoadedScene: (scene: THREE.Object3D | null) => void;
}

export function useModelLoader(): UseModelLoaderResult {
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedScene, setLoadedScene] = useState<THREE.Object3D | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const clearModel = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    setModelUrl(null);
    setError(null);
    setLoadedScene(null);
  }, []);

  const loadModel = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    // Clean up previous model
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    try {
      const result = await loadGLBFile(file);

      if (!result) {
        setError('Invalid GLB file. Please select a valid .glb file.');
        setModelUrl(null);
        return;
      }

      cleanupRef.current = result.cleanup;
      setModelUrl(result.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load model';
      setError(message);
      setModelUrl(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    modelUrl,
    isLoading,
    error,
    loadedScene,
    loadModel,
    clearModel,
    setLoadedScene,
  };
}
