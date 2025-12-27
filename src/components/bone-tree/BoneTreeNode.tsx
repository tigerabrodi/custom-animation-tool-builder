import React, { useState } from 'react';
import type { BoneName } from '../../types';
import { getBoneChildren, isBoneLeaf } from '../../utils/skeleton';

interface BoneTreeNodeProps {
  boneName: BoneName;
  selectedBone: BoneName | null;
  onSelectBone: (bone: BoneName) => void;
  depth?: number;
}

export const BoneTreeNode: React.FC<BoneTreeNodeProps> = ({
  boneName,
  selectedBone,
  onSelectBone,
  depth = 0,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const children = getBoneChildren(boneName);
  const isLeaf = isBoneLeaf(boneName);
  const isSelected = selectedBone === boneName;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleSelectBone = () => {
    onSelectBone(boneName);
  };

  // Calculate indentation based on depth
  const indentStyle = { paddingLeft: `${depth * 16}px` };

  return (
    <div className="select-none">
      <div
        className={`
          flex items-center py-1 px-2 cursor-pointer
          text-sm font-mono
          transition-colors duration-150
          ${isSelected
            ? 'bg-blue-600 text-white'
            : 'text-gray-100 hover:bg-gray-700'
          }
        `.trim()}
        style={indentStyle}
      >
        {/* Expand/collapse arrow */}
        <button
          onClick={handleToggleExpand}
          className={`
            w-4 h-4 flex items-center justify-center mr-1
            text-gray-400
            transition-transform duration-150
            ${!isLeaf ? 'visible' : 'invisible'}
            ${isExpanded ? 'rotate-90' : 'rotate-0'}
          `.trim()}
          aria-label={isExpanded ? 'Collapse' : 'Expand'}
          disabled={isLeaf}
        >
          <svg
            className="w-3 h-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Bone name */}
        <span
          onClick={handleSelectBone}
          className="flex-1 min-w-0 truncate"
        >
          {boneName}
        </span>
      </div>

      {/* Children nodes */}
      {!isLeaf && isExpanded && (
        <div>
          {children.map((childBone) => (
            <BoneTreeNode
              key={childBone}
              boneName={childBone}
              selectedBone={selectedBone}
              onSelectBone={onSelectBone}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BoneTreeNode;
