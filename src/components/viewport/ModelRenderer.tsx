import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import type * as THREE from 'three';

interface ModelRendererProps {
  url: string;
  onSceneLoaded?: (scene: THREE.Object3D) => void;
}

export function ModelRenderer({ url, onSceneLoaded }: ModelRendererProps) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    // Center the model at origin
    scene.position.set(0, 0, 0);

    // Notify parent that scene is loaded
    onSceneLoaded?.(scene);
  }, [scene, onSceneLoaded]);

  return <primitive object={scene} />;
}
