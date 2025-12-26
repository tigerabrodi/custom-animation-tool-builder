import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';
import type * as THREE from 'three';

interface ModelRendererProps {
  url: string;
  onSceneLoaded?: (scene: THREE.Object3D) => void;
  visible?: boolean;
}

export function ModelRenderer({ url, onSceneLoaded, visible = true }: ModelRendererProps) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    // Center the model at origin
    scene.position.set(0, 0, 0);

    // Notify parent that scene is loaded
    onSceneLoaded?.(scene);
  }, [scene, onSceneLoaded]);

  // Wrap in a group to control visibility without mutating scene
  return (
    <group visible={visible}>
      <primitive object={scene} />
    </group>
  );
}
