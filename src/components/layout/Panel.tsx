import React from 'react';

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  children,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col bg-gray-900 border border-gray-700 rounded-lg overflow-hidden
        ${className}
      `.trim()}
    >
      {/* Title bar */}
      <div className="flex-shrink-0 px-3 py-2 bg-gray-800 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-100">{title}</h3>
      </div>
      {/* Scrollable content area */}
      <div className="flex-1 overflow-auto p-3">
        {children}
      </div>
    </div>
  );
};

export default Panel;
