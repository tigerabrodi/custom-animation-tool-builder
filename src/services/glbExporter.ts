import {
  Accessor,
  Animation,
  Document,
  Buffer as GltfBuffer,
  Node,
  NodeIO,
} from '@gltf-transform/core'
import type { AnimationClip } from '../types'
import {
  buildExportPreview,
  clipToBoneAnimationData,
  toGltfInterpolation,
  type ExistingAnimationInfo,
  type ExportPreview,
} from '../utils/exportUtils'

/**
 * Reads a GLB file and returns the gltf-transform Document.
 */
export async function readGlbDocument(glbData: ArrayBuffer): Promise<Document> {
  const io = new NodeIO()
  const document = await io.readBinary(new Uint8Array(glbData))
  return document
}

/**
 * Gets information about existing animations in a document.
 */
export function getExistingAnimations(
  document: Document
): ExistingAnimationInfo[] {
  const root = document.getRoot()
  const animations = root.listAnimations()

  return animations.map((anim) => {
    const channels = anim.listChannels()
    let maxTime = 0

    for (const channel of channels) {
      const sampler = channel.getSampler()
      if (sampler) {
        const input = sampler.getInput()
        if (input) {
          const times = input.getArray()
          if (times && times.length > 0) {
            maxTime = Math.max(maxTime, times[times.length - 1])
          }
        }
      }
    }

    return {
      name: anim.getName(),
      duration: maxTime,
      channelCount: channels.length,
    }
  })
}

/**
 * Finds a node (bone) by name in the document.
 */
function findNodeByName(document: Document, name: string): Node | null {
  const root = document.getRoot()
  const nodes = root.listNodes()

  for (const node of nodes) {
    if (node.getName() === name) {
      return node
    }
  }

  return null
}

/**
 * Creates or gets a buffer for animation data.
 */
function getOrCreateBuffer(document: Document): GltfBuffer {
  const root = document.getRoot()
  const buffers = root.listBuffers()

  if (buffers.length > 0) {
    return buffers[0]
  }

  return document.createBuffer()
}

/**
 * Adds an animation clip to the document.
 */
function addAnimationToDocument(
  document: Document,
  clip: AnimationClip,
  buffer: GltfBuffer
): Animation | null {
  const boneData = clipToBoneAnimationData(clip)

  if (boneData.length === 0) {
    return null
  }

  const animation = document.createAnimation(clip.name)
  const interpolation = toGltfInterpolation(clip.interpolation)

  // Create shared time accessor (all bones share the same keyframe times)
  const timeAccessor = document
    .createAccessor()
    .setType(Accessor.Type.SCALAR)
    .setArray(boneData[0].times)
    .setBuffer(buffer)

  for (const data of boneData) {
    const node = findNodeByName(document, data.boneName)
    if (!node) {
      console.warn(`Bone "${data.boneName}" not found in GLB, skipping...`)
      continue
    }

    // Translation channel
    const translationAccessor = document
      .createAccessor()
      .setType(Accessor.Type.VEC3)
      .setArray(data.translations)
      .setBuffer(buffer)

    const translationSampler = document
      .createAnimationSampler()
      .setInput(timeAccessor)
      .setOutput(translationAccessor)
      .setInterpolation(interpolation)

    const translationChannel = document
      .createAnimationChannel()
      .setTargetNode(node)
      .setTargetPath('translation')
      .setSampler(translationSampler)

    animation.addSampler(translationSampler)
    animation.addChannel(translationChannel)

    // Rotation channel
    const rotationAccessor = document
      .createAccessor()
      .setType(Accessor.Type.VEC4)
      .setArray(data.rotations)
      .setBuffer(buffer)

    const rotationSampler = document
      .createAnimationSampler()
      .setInput(timeAccessor)
      .setOutput(rotationAccessor)
      .setInterpolation(interpolation)

    const rotationChannel = document
      .createAnimationChannel()
      .setTargetNode(node)
      .setTargetPath('rotation')
      .setSampler(rotationSampler)

    animation.addSampler(rotationSampler)
    animation.addChannel(rotationChannel)

    // Scale channel
    const scaleAccessor = document
      .createAccessor()
      .setType(Accessor.Type.VEC3)
      .setArray(data.scales)
      .setBuffer(buffer)

    const scaleSampler = document
      .createAnimationSampler()
      .setInput(timeAccessor)
      .setOutput(scaleAccessor)
      .setInterpolation(interpolation)

    const scaleChannel = document
      .createAnimationChannel()
      .setTargetNode(node)
      .setTargetPath('scale')
      .setSampler(scaleSampler)

    animation.addSampler(scaleSampler)
    animation.addChannel(scaleChannel)
  }

  return animation
}

/**
 * Result of an export operation.
 */
export interface ExportResult {
  glbData: Uint8Array
  preview: ExportPreview
}

/**
 * Exports clips to a GLB file, merging with existing animations.
 *
 * @param originalGlb - The original GLB file data
 * @param clips - Animation clips to export
 * @returns The new GLB file data and export preview
 */
export async function exportGlbWithAnimations(
  originalGlb: ArrayBuffer,
  clips: AnimationClip[]
): Promise<ExportResult> {
  const document = await readGlbDocument(originalGlb)
  const existingAnimations = getExistingAnimations(document)

  // Build preview before making changes
  const preview = buildExportPreview(existingAnimations, clips)

  // Remove animations that will be overwritten
  const root = document.getRoot()
  const clipNames = new Set(clips.map((c) => c.name))

  for (const anim of root.listAnimations()) {
    if (clipNames.has(anim.getName())) {
      anim.dispose()
    }
  }

  // Get or create buffer for new animation data
  const buffer = getOrCreateBuffer(document)

  // Add new animations
  for (const clip of clips) {
    if (clip.keyframes.length > 0) {
      addAnimationToDocument(document, clip, buffer)
    }
  }

  // Export to GLB
  const io = new NodeIO()
  const glbData = await io.writeBinary(document)

  return {
    glbData,
    preview,
  }
}

/**
 * Triggers a browser download of a GLB file.
 *
 * @param glbData - The GLB file data
 * @param filename - The filename for the download
 */
export function downloadGlb(glbData: Uint8Array, filename: string): void {
  // Create a new ArrayBuffer from the Uint8Array to ensure compatibility
  const buffer = new Uint8Array(glbData).buffer
  const blob = new Blob([buffer], { type: 'model/gltf-binary' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.glb') ? filename : `${filename}.glb`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Gets a preview of what an export operation will do without actually exporting.
 *
 * @param originalGlb - The original GLB file data
 * @param clips - Animation clips to export
 * @returns Preview information
 */
export async function getExportPreview(
  originalGlb: ArrayBuffer,
  clips: AnimationClip[]
): Promise<ExportPreview> {
  const document = await readGlbDocument(originalGlb)
  const existingAnimations = getExistingAnimations(document)
  return buildExportPreview(existingAnimations, clips)
}
