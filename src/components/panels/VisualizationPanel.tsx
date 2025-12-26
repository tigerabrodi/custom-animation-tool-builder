import type { VisualizationMode } from '../../types';

interface VisualizationPanelProps {
  mode: VisualizationMode;
  onModeChange: (mode: VisualizationMode) => void;
}

const MODES: { value: VisualizationMode; label: string; icon: string }[] = [
  { value: 'MESH', label: 'Mesh', icon: 'M' },
  { value: 'SKELETON', label: 'Skeleton', icon: 'S' },
  { value: 'BOTH', label: 'Both', icon: 'B' },
];

export function VisualizationPanel({ mode, onModeChange }: VisualizationPanelProps) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-2">
      <div className="text-xs text-gray-400 mb-2">View Mode</div>
      <div className="flex gap-1">
        {MODES.map(({ value, label, icon }) => {
          const isActive = mode === value;
          return (
            <button
              key={value}
              onClick={() => onModeChange(value)}
              className={`
                flex-1 px-3 py-1.5 text-xs font-medium rounded transition-colors
                ${isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                }
              `}
              title={label}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{icon}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
