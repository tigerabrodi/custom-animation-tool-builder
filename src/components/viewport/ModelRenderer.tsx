import { useGLTF } from '@react-three/drei';
import { useEffect } from 'react';

interface ModelRendererProps {
  url: string;
}

export function ModelRenderer({ url }: ModelRendererProps) {
  const { scene } = useGLTF(url);

  useEffect(() => {
    // Center the model at origin
    scene.position.set(0, 0, 0);
  }, [scene]);

  return <primitive object={scene} />;
}
