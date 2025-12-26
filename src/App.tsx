import { Suspense, type ChangeEvent } from 'react';
import { Viewport } from './components/viewport/Viewport';
import { useModelLoader } from './hooks/useModelLoader';

function App() {
  const { modelUrl, isLoading, error, loadModel, clearModel } = useModelLoader();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await loadModel(file);
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 bg-gray-800 border-b border-gray-700">
        <label className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
          Load GLB
          <input
            type="file"
            accept=".glb"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {modelUrl && (
          <button
            onClick={clearModel}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
          >
            Clear Model
          </button>
        )}

        {isLoading && (
          <span className="text-gray-300">Loading...</span>
        )}

        {error && (
          <span className="text-red-400">{error}</span>
        )}
      </div>

      {/* 3D Viewport */}
      <div className="flex-1">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            Loading 3D viewer...
          </div>
        }>
          <Viewport modelUrl={modelUrl} />
        </Suspense>
      </div>
    </div>
  );
}

export default App;
