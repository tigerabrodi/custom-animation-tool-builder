import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, type ReactNode } from 'react'

// ============================================
// 1. LIFECYCLE DEBUG WRAPPER
// Tracks mount/unmount/render of any component
// ============================================
interface DebugWrapperProps {
  name: string
  children: ReactNode
}

export function DebugLifecycle({ name, children }: DebugWrapperProps) {
  const instanceId = useRef(Math.random().toString(36).slice(2, 8))
  const renderCount = useRef(0)
  renderCount.current++

  console.log(
    `%c[${name}:${instanceId.current}] Render #${renderCount.current}`,
    'color: #888'
  )

  useEffect(() => {
    console.log(
      `%c[${name}:${instanceId.current}] ✅ MOUNTED`,
      'color: #0f0; font-weight: bold'
    )
    return () => {
      console.log(
        `%c[${name}:${instanceId.current}] ❌ UNMOUNTED`,
        'color: #f00; font-weight: bold'
      )
    }
  }, [name])

  return <>{children}</>
}

// ============================================
// 2. R3F FRAME COUNTER
// Tracks if render loop is running before crash
// ============================================
export function DebugFrameCounter() {
  const frameCount = useRef(0)
  const lastLogTime = useRef(Date.now())

  useFrame(() => {
    frameCount.current++
    const now = Date.now()

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
    console.log('%c[FrameCounter] Started', 'color: #0ff; font-weight: bold')
    return () => {
      console.log(
        `%c[FrameCounter] Stopped after ${frameCount.current} frames`,
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
