import { useGLTF } from '@react-three/drei'
import { memo, useEffect, useRef } from 'react'
import type * as THREE from 'three'

interface ModelRendererProps {
  url: string
  onSceneLoaded?: (scene: THREE.Object3D) => void
  visible?: boolean
}

export const ModelRenderer = memo(
  function ModelRenderer({
    url,
    onSceneLoaded,
    visible = true,
  }: ModelRendererProps) {
    const { scene } = useGLTF(url)
    const initializedRef = useRef(false)

    useEffect(() => {
      if (!initializedRef.current && scene) {
        initializedRef.current = true
        onSceneLoaded?.(scene)
      }
    }, [scene, onSceneLoaded])

    // Reset when URL changes
    useEffect(() => {
      initializedRef.current = false
    }, [url])

    return (
      <group visible={visible}>
        <primitive object={scene} />
      </group>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.url === nextProps.url && prevProps.visible === nextProps.visible
    )
  }
)
