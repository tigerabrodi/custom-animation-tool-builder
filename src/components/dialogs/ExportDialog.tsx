import React, { useEffect, useState } from 'react'
import {
  downloadGlb,
  exportGlbWithAnimations,
  getExportPreview,
} from '../../services/glbExporter'
import type { AnimationClip } from '../../types'
import type { ExportPreview } from '../../utils/exportUtils'
import { Button } from '../ui/Button'

interface ExportDialogProps {
  isOpen: boolean
  onClose: () => void
  clips: AnimationClip[]
  originalGlbData: ArrayBuffer | null
  originalFileName: string
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  clips,
  originalGlbData,
  originalFileName,
}) => {
  const [preview, setPreview] = useState<ExportPreview | null>(null)
  const [selectedClipIds, setSelectedClipIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load preview when dialog opens
  useEffect(() => {
    if (isOpen && originalGlbData && clips.length > 0) {
      setIsLoading(true)
      setError(null)

      // Select all clips by default
      setSelectedClipIds(new Set(clips.map((c) => c.id)))

      getExportPreview(originalGlbData, clips)
        .then((p) => {
          setPreview(p)
          setIsLoading(false)
        })
        .catch((err) => {
          setError(
            err instanceof Error ? err.message : 'Failed to load preview'
          )
          setIsLoading(false)
        })
    }
  }, [isOpen, originalGlbData, clips])

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setPreview(null)
      setSelectedClipIds(new Set())
      setError(null)
    }
  }, [isOpen])

  const handleClipToggle = (clipId: string) => {
    setSelectedClipIds((prev) => {
      const next = new Set(prev)
      if (next.has(clipId)) {
        next.delete(clipId)
      } else {
        next.add(clipId)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedClipIds(new Set(clips.map((c) => c.id)))
  }

  const handleSelectNone = () => {
    setSelectedClipIds(new Set())
  }

  const handleExport = async () => {
    if (!originalGlbData || selectedClipIds.size === 0) return

    setIsExporting(true)
    setError(null)

    try {
      const clipsToExport = clips.filter((c) => selectedClipIds.has(c.id))
      const result = await exportGlbWithAnimations(
        originalGlbData,
        clipsToExport
      )

      // Generate filename
      const baseName = originalFileName.replace(/\.glb$/i, '')
      const filename = `${baseName}_animated.glb`

      downloadGlb(result.glbData, filename)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  const selectedClips = clips.filter((c) => selectedClipIds.has(c.id))
  const hasClipsWithKeyframes = selectedClips.some(
    (c) => c.keyframes.length > 0
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            Export GLB with Animations
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400">Loading preview...</div>
            </div>
          ) : error ? (
            <div className="bg-red-900/30 border border-red-700 rounded-md p-4">
              <p className="text-red-400">{error}</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Existing Animations */}
              {preview && preview.originalAnimations.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">
                    Existing Animations in File
                  </h3>
                  <div className="bg-gray-900 rounded-md p-3 space-y-1">
                    {preview.originalAnimations.map((anim, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-300">
                          {anim.name || '(unnamed)'}
                        </span>
                        <span className="text-gray-500">
                          {anim.duration.toFixed(2)}s, {anim.channelCount}{' '}
                          channels
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clips to Export */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-300">
                    Clips to Export ({selectedClipIds.size}/{clips.length})
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleSelectNone}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Select None
                    </button>
                  </div>
                </div>

                {clips.length === 0 ? (
                  <div className="bg-gray-900 rounded-md p-4 text-center text-gray-500">
                    No animation clips to export
                  </div>
                ) : (
                  <div className="bg-gray-900 rounded-md divide-y divide-gray-800">
                    {clips.map((clip) => {
                      const isSelected = selectedClipIds.has(clip.id)
                      const willOverwrite =
                        preview?.overwrittenAnimations.includes(clip.name)
                      const hasKeyframes = clip.keyframes.length > 0

                      return (
                        <label
                          key={clip.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-800/50 transition-colors ${
                            !hasKeyframes ? 'opacity-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleClipToggle(clip.id)}
                            disabled={!hasKeyframes}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-800"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-200 font-medium truncate">
                                {clip.name}
                              </span>
                              {willOverwrite && (
                                <span className="px-1.5 py-0.5 text-xs bg-yellow-900/50 text-yellow-400 rounded">
                                  Overwrites
                                </span>
                              )}
                              {!hasKeyframes && (
                                <span className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-400 rounded">
                                  No keyframes
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {clip.duration.toFixed(2)}s,{' '}
                              {clip.keyframes.length} keyframes,{' '}
                              {clip.interpolation}
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Export Summary */}
              {preview && selectedClipIds.size > 0 && (
                <div className="bg-blue-900/20 border border-blue-800 rounded-md p-4">
                  <h4 className="text-sm font-medium text-blue-300 mb-2">
                    Export Summary
                  </h4>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>
                      Exporting{' '}
                      {
                        selectedClips.filter((c) => c.keyframes.length > 0)
                          .length
                      }{' '}
                      animation(s)
                    </li>
                    {preview.preservedAnimations.length > 0 && (
                      <li>
                        Preserving {preview.preservedAnimations.length} existing
                        animation(s)
                      </li>
                    )}
                    {preview.overwrittenAnimations.filter((name) =>
                      selectedClips.some((c) => c.name === name)
                    ).length > 0 && (
                      <li className="text-yellow-400">
                        Overwriting{' '}
                        {
                          preview.overwrittenAnimations.filter((name) =>
                            selectedClips.some((c) => c.name === name)
                          ).length
                        }{' '}
                        animation(s)
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-700">
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={
              isExporting ||
              selectedClipIds.size === 0 ||
              !hasClipsWithKeyframes
            }
          >
            {isExporting ? 'Exporting...' : 'Export GLB'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ExportDialog
