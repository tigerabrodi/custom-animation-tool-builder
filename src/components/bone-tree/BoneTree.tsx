import React from 'react';
import type { BoneName } from '../../types';
import { Panel } from '../layout/Panel';
import { BoneTreeNode } from './BoneTreeNode';

interface BoneTreeProps {
  selectedBone: BoneName | null;
  onSelectBone: (bone: BoneName) => void;
  disabled?: boolean;
}

export const BoneTree: React.FC<BoneTreeProps> = ({
  selectedBone,
  onSelectBone,
  disabled = false,
}) => {
  return (
    <Panel title="Bone Hierarchy" className="h-full">
      {disabled ? (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-gray-400 text-center">
            No model loaded.
            <br />
            Load a model to view bone hierarchy.
          </p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded">
          <BoneTreeNode
            boneName="Hips"
            selectedBone={selectedBone}
            onSelectBone={onSelectBone}
            depth={0}
          />
        </div>
      )}
    </Panel>
  );
};

export default BoneTree;
