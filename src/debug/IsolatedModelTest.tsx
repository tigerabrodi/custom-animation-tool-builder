/**
 * ISOLATED MODEL TEST
 *
 * This is a minimal reproduction test to determine if the WebGL crash
 * is caused by our app structure or by the model + Three.js itself.
 *
 * To use: Replace App component in main.tsx with this component
 */
import { OrbitControls, useGLTF } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef, useState, type ChangeEvent } from 'react';

// Minimal model renderer - no callbacks, no effects except frame counting
function MinimalModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const frameCount = useRef(0);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 60 === 0) {
      console.log(`[MinimalModel] Frame ${frameCount.current}`);
    }
  });

  console.log('[MinimalModel] Rendering primitive');

  return <primitive object={scene} />;
}

// Completely isolated test - no connection to main app
export function IsolatedModelTest() {
  const [modelUrl, setModelUrl] = useState<string | null>(null);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Revoke old URL if exists
      if (modelUrl) {
        URL.revokeObjectURL(modelUrl);
      }
      const url = URL.createObjectURL(file);
      console.log('[IsolatedTest] Created URL:', url);
      setModelUrl(url);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <div style={{ padding: '10px', background: '#333' }}>
        <label style={{ color: 'white', cursor: 'pointer' }}>
          Load GLB (Isolated Test)
          <input
            type="file"
            accept=".glb"
            onChange={handleFileChange}
            style={{ marginLeft: '10px' }}
          />
        </label>
        {modelUrl && (
          <span style={{ color: '#0f0', marginLeft: '20px' }}>
            Model loaded - watching for crash...
          </span>
        )}
      </div>

      <div style={{ width: '100%', height: 'calc(100% - 50px)' }}>
        <Canvas
          camera={{ position: [3, 2, 5], fov: 50 }}
          onCreated={({ gl }) => {
            console.log('[IsolatedTest] Canvas created');
            const canvas = gl.domElement;
            canvas.addEventListener('webglcontextlost', (e) => {
              e.preventDefault();
              console.error('[IsolatedTest] 💥 CONTEXT LOST');
            });
            canvas.addEventListener('webglcontextrestored', () => {
              console.log('[IsolatedTest] Context restored');
            });
          }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={1} />
          <gridHelper args={[10, 10]} />

          {modelUrl && (
            <Suspense fallback={null}>
              <MinimalModel url={modelUrl} />
            </Suspense>
          )}

          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}

export default IsolatedModelTest;
