/* eslint-disable react-hooks/refs */
// Debug utilities intentionally access refs during render for debugging purposes

import { useFrame } from '@react-three/fiber'
import { useEffect, useId, useRef, type ReactNode } from 'react'

// ============================================
// 1. LIFECYCLE DEBUG WRAPPER
// Tracks mount/unmount/render of any component
// ============================================
interface DebugWrapperProps {
  name: string
  children: ReactNode
}

export function DebugLifecycle({ name, children }: DebugWrapperProps) {
  const instanceId = useId()
  const renderCount = useRef(0)
  renderCount.current++

  console.log(
    `%c[${name}:${instanceId}] Render #${renderCount.current}`,
    'color: #888'
  )

  useEffect(() => {
    const id = instanceId
    console.log(
      `%c[${name}:${id}] ✅ MOUNTED`,
      'color: #0f0; font-weight: bold'
    )
    return () => {
      console.log(
        `%c[${name}:${id}] ❌ UNMOUNTED`,
        'color: #f00; font-weight: bold'
      )
    }
  }, [name, instanceId])

  return <>{children}</>
}

// ============================================
// 2. R3F FRAME COUNTER
// Tracks if render loop is running before crash
// ============================================
export function DebugFrameCounter() {
  const frameCount = useRef(0)
  const lastLogTime = useRef<number | null>(null)

  useFrame(() => {
    frameCount.current++
    const now = Date.now()

    // Initialize on first frame
    if (lastLogTime.current === null) {
      lastLogTime.current = now
    }

    // Log every 500ms
    if (now - lastLogTime.current > 500) {
      console.log(
        `%c[FrameCounter] ${frameCount.current} frames rendered`,
        'color: #0ff'
      )
      lastLogTime.current = now
    }
  })

  useEffect(() => {
    const count = frameCount
    console.log('%c[FrameCounter] Started', 'color: #0ff; font-weight: bold')
    return () => {
      console.log(
        `%c[FrameCounter] Stopped after ${count.current} frames`,
        'color: #f80; font-weight: bold'
      )
    }
  }, [])

  return null
}

// ============================================
// 3. WEBGL STATE LOGGER
// Logs WebGL context state
// ============================================
export function DebugWebGLState({
  gl,
}: {
  gl: WebGLRenderingContext | WebGL2RenderingContext
}) {
  useEffect(() => {
    const logState = () => {
      const ext = gl.getExtension('WEBGL_lose_context')
      console.log('%c[WebGL State]', 'color: #f0f', {
        isContextLost: gl.isContextLost(),
        drawingBufferWidth: gl.drawingBufferWidth,
        drawingBufferHeight: gl.drawingBufferHeight,
        MAX_TEXTURE_SIZE: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        MAX_VERTEX_UNIFORM_VECTORS: gl.getParameter(
          gl.MAX_VERTEX_UNIFORM_VECTORS
        ),
        hasLoseContextExt: !!ext,
      })
    }

    logState()
    const interval = setInterval(logState, 1000)
    return () => clearInterval(interval)
  }, [gl])

  return null
}
