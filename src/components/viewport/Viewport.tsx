import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { ModelRenderer } from './ModelRenderer';

interface ViewportProps {
  modelUrl: string | null;
}

function Scene({ modelUrl }: ViewportProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />

      {/* Ground Grid */}
      <Grid
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#374151"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />

      {/* Model */}
      {modelUrl && <ModelRenderer url={modelUrl} />}

      {/* Camera Controls */}
      <OrbitControls
        makeDefault
        minDistance={1}
        maxDistance={20}
        target={[0, 0.9, 0]}
      />
    </>
  );
}

export function Viewport({ modelUrl }: ViewportProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{
          position: [3, 2, 5],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        shadows
      >
        <Scene modelUrl={modelUrl} />
      </Canvas>
    </div>
  );
}
