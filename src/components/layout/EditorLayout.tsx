import React from 'react'

interface EditorLayoutProps {
  toolbar: React.ReactNode
  leftPanel: React.ReactNode
  viewport: React.ReactNode
  bottomPanel: React.ReactNode
  rightPanel?: React.ReactNode
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  toolbar,
  leftPanel,
  viewport,
  bottomPanel,
  rightPanel,
}) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-gray-100 overflow-hidden">
      {/* Toolbar - full width at top */}
      <div className="flex-shrink-0 h-12 border-b border-gray-700 bg-gray-800">
        {toolbar}
      </div>

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left panel - bone tree (~250px) */}
        <div className="flex-shrink-0 w-[250px] border-r border-gray-700 overflow-hidden">
          {leftPanel}
        </div>

        {/* Center and bottom area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0 min-h-0">
          {/* Viewport - fills remaining center space */}
          <div className="flex-1 overflow-hidden min-h-0">{viewport}</div>

          {/* Bottom panel - timeline (~200px) */}
          <div className="flex-shrink-0 h-[200px] border-t border-gray-700 overflow-hidden">
            {bottomPanel}
          </div>
        </div>

        {/* Optional right panel - properties */}
        {rightPanel && (
          <div className="flex-shrink-0 w-[280px] border-l border-gray-700 overflow-hidden">
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  )
}

export default EditorLayout
