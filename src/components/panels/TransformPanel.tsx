import { useCallback, useEffect, useState, useRef } from 'react';
import type { BoneName, BoneTransform, TransformMode, CoordinateSpace } from '../../types';
import { Panel } from '../layout/Panel';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Toggle } from '../ui/Toggle';

interface TransformPanelProps {
  selectedBone: BoneName | null;
  transformMode: TransformMode;
  coordinateSpace: CoordinateSpace;
  hipsLocked: boolean;
  getBoneTransform: (bone: BoneName) => BoneTransform | null;
  onTransformModeChange: (mode: TransformMode) => void;
  onCoordinateSpaceChange: (space: CoordinateSpace) => void;
  onHipsLockedChange: (locked: boolean) => void;
  onResetBone: (bone: BoneName) => void;
  onResetAllBones: () => void;
}

const TRANSFORM_MODE_OPTIONS = [
  { value: 'ROTATE', label: 'Rotate' },
  { value: 'TRANSLATE', label: 'Translate' },
  { value: 'SCALE', label: 'Scale' },
];

const COORDINATE_SPACE_OPTIONS = [
  { value: 'LOCAL', label: 'Local' },
  { value: 'WORLD', label: 'World' },
];

export function TransformPanel({
  selectedBone,
  transformMode,
  coordinateSpace,
  hipsLocked,
  getBoneTransform,
  onTransformModeChange,
  onCoordinateSpaceChange,
  onHipsLockedChange,
  onResetBone,
  onResetAllBones,
}: TransformPanelProps) {
  const [, forceUpdate] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Set up polling when bone is selected
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (selectedBone) {
      intervalRef.current = setInterval(() => {
        forceUpdate((n) => n + 1);
      }, 100);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [selectedBone]);

  // Compute transform on each render (polling triggers re-render)
  const currentTransform = selectedBone ? getBoneTransform(selectedBone) : null;

  const handleResetBone = useCallback(() => {
    if (selectedBone) {
      onResetBone(selectedBone);
    }
  }, [selectedBone, onResetBone]);

  const formatNumber = (n: number) => n.toFixed(3);

  return (
    <Panel title="Transform" className="h-full">
      <div className="flex flex-col gap-4 p-2">
        {/* Transform Mode */}
        <Select
          label="Mode"
          value={transformMode}
          onChange={(v) => onTransformModeChange(v as TransformMode)}
          options={TRANSFORM_MODE_OPTIONS}
        />

        {/* Coordinate Space */}
        <Select
          label="Space"
          value={coordinateSpace}
          onChange={(v) => onCoordinateSpaceChange(v as CoordinateSpace)}
          options={COORDINATE_SPACE_OPTIONS}
        />

        {/* Hips Lock */}
        <Toggle
          label="Lock Hips Position"
          checked={hipsLocked}
          onChange={onHipsLockedChange}
        />

        <div className="border-t border-gray-700 my-2" />

        {/* Selected Bone Info */}
        {selectedBone ? (
          <>
            <div className="text-sm text-gray-300">
              Selected: <span className="font-mono text-white">{selectedBone}</span>
            </div>

            {currentTransform && (
              <div className="space-y-3 text-xs">
                {/* Position */}
                <div>
                  <div className="text-gray-400 mb-1">Position</div>
                  <div className="grid grid-cols-3 gap-1">
                    <Input
                      value={formatNumber(currentTransform.position.x)}
                      onChange={() => {}}
                      disabled
                      className="text-xs"
                    />
                    <Input
                      value={formatNumber(currentTransform.position.y)}
                      onChange={() => {}}
                      disabled
                      className="text-xs"
                    />
                    <Input
                      value={formatNumber(currentTransform.position.z)}
                      onChange={() => {}}
                      disabled
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-gray-500 text-center mt-0.5">
                    <span>X</span>
                    <span>Y</span>
                    <span>Z</span>
                  </div>
                </div>

                {/* Rotation (showing quaternion) */}
                <div>
                  <div className="text-gray-400 mb-1">Rotation (Quaternion)</div>
                  <div className="grid grid-cols-4 gap-1">
                    <Input
                      value={formatNumber(currentTransform.rotation.x)}
                      onChange={() => {}}
                      disabled
                      className="text-xs"
                    />
                    <Input
                      value={formatNumber(currentTransform.rotation.y)}
                      onChange={() => {}}
                      disabled
                      className="text-xs"
                    />
                    <Input
                      value={formatNumber(currentTransform.rotation.z)}
                      onChange={() => {}}
                      disabled
                      className="text-xs"
                    />
                    <Input
                      value={formatNumber(currentTransform.rotation.w)}
                      onChange={() => {}}
                      disabled
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-gray-500 text-center mt-0.5">
                    <span>X</span>
                    <span>Y</span>
                    <span>Z</span>
                    <span>W</span>
                  </div>
                </div>

                {/* Scale */}
                <div>
                  <div className="text-gray-400 mb-1">Scale</div>
                  <div className="grid grid-cols-3 gap-1">
                    <Input
                      value={formatNumber(currentTransform.scale.x)}
                      onChange={() => {}}
                      disabled
                      className="text-xs"
                    />
                    <Input
                      value={formatNumber(currentTransform.scale.y)}
                      onChange={() => {}}
                      disabled
                      className="text-xs"
                    />
                    <Input
                      value={formatNumber(currentTransform.scale.z)}
                      onChange={() => {}}
                      disabled
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-gray-500 text-center mt-0.5">
                    <span>X</span>
                    <span>Y</span>
                    <span>Z</span>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={handleResetBone}
              className="mt-2"
            >
              Reset Bone
            </Button>
          </>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No bone selected
          </div>
        )}

        <div className="border-t border-gray-700 my-2" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onResetAllBones}
        >
          Reset All Bones
        </Button>
      </div>
    </Panel>
  );
}
