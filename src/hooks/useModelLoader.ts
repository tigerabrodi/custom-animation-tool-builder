import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { loadGLBFile } from '../services/glbLoader'

interface UseModelLoaderResult {
  modelUrl: string | null
  modelData: ArrayBuffer | null
  modelFileName: string
  isLoading: boolean
  error: string | null
  loadedScene: THREE.Object3D | null
  loadModel: (file: File) => Promise<void>
  clearModel: () => void
  setLoadedScene: (scene: THREE.Object3D | null) => void
}

export function useModelLoader(): UseModelLoaderResult {
  const [modelUrl, setModelUrl] = useState<string | null>(null)
  const [modelData, setModelData] = useState<ArrayBuffer | null>(null)
  const [modelFileName, setModelFileName] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadedScene, setLoadedScene] = useState<THREE.Object3D | null>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const clearModel = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    setModelUrl(null)
    setModelData(null)
    setModelFileName('')
    setError(null)
    setLoadedScene(null)
  }, [])

  const loadModel = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)

    // Clean up previous model
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    try {
      // Read the file as ArrayBuffer for export later
      const arrayBuffer = await file.arrayBuffer()

      const result = await loadGLBFile(file)

      if (!result) {
        setError('Invalid GLB file. Please select a valid .glb file.')
        setModelUrl(null)
        setModelData(null)
        setModelFileName('')
        return
      }

      cleanupRef.current = result.cleanup
      setModelUrl(result.url)
      setModelData(arrayBuffer)
      setModelFileName(file.name)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load model'
      setError(message)
      setModelUrl(null)
      setModelData(null)
      setModelFileName('')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
    }
  }, [])

  return {
    modelUrl,
    modelData,
    modelFileName,
    isLoading,
    error,
    loadedScene,
    loadModel,
    clearModel,
    setLoadedScene,
  }
}
