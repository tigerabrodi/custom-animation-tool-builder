import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { SKELETON_HIERARCHY } from '../../constants/skeleton'
import type { BoneName } from '../../types'

interface BoneOverlayProps {
  bones: Map<BoneName, THREE.Bone> | null
  selectedBone: BoneName | null
  visible?: boolean
  onSelectBone?: (bone: BoneName | null) => void
}

// Sphere sizes
const SELECTED_SPHERE_RADIUS = 0.025
const DEFAULT_SPHERE_RADIUS = 0.015

// Colors
const SELECTED_COLOR = new THREE.Color(0x00ffff) // cyan
const DEFAULT_COLOR = new THREE.Color(0xffffff) // white
const LINE_COLOR = new THREE.Color(0x888888) // gray

export function BoneOverlay({
  bones,
  selectedBone,
  visible = true,
  onSelectBone,
}: BoneOverlayProps) {
  const groupRef = useRef<THREE.Group>(null)
  const sphereRefs = useRef<Map<BoneName, THREE.Mesh>>(new Map())
  const lineRef = useRef<THREE.LineSegments | null>(null)

  // Reusable vectors to avoid allocation in useFrame
  const worldPosRef = useRef(new THREE.Vector3())
  const parentPosRef = useRef(new THREE.Vector3())

  // Create geometries and materials once
  const {
    selectedGeometry,
    defaultGeometry,
    selectedMaterial,
    defaultMaterial,
    lineMaterial,
    lineGeometry,
  } = useMemo(() => {
    const lineGeo = new THREE.BufferGeometry()
    // Pre-allocate for max possible lines (24 bones)
    lineGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(new Float32Array(24 * 6), 3)
    )

    return {
      selectedGeometry: new THREE.SphereGeometry(
        SELECTED_SPHERE_RADIUS,
        16,
        16
      ),
      defaultGeometry: new THREE.SphereGeometry(DEFAULT_SPHERE_RADIUS, 12, 12),
      selectedMaterial: new THREE.MeshBasicMaterial({
        color: SELECTED_COLOR,
        transparent: true,
        opacity: 1.0,
        depthTest: false,
      }),
      defaultMaterial: new THREE.MeshBasicMaterial({
        color: DEFAULT_COLOR,
        transparent: true,
        opacity: 0.5,
        depthTest: false,
      }),
      lineMaterial: new THREE.LineBasicMaterial({
        color: LINE_COLOR,
        transparent: true,
        opacity: 0.3,
        depthTest: false,
      }),
      lineGeometry: lineGeo,
    }
  }, [])

  // Update sphere positions each frame to follow bone animations
  useFrame(() => {
    if (!bones || !visible) return

    const worldPos = worldPosRef.current
    const parentPos = parentPosRef.current

    // Update sphere positions
    sphereRefs.current.forEach((mesh, boneName) => {
      const bone = bones.get(boneName)
      if (bone) {
        bone.getWorldPosition(worldPos)
        mesh.position.copy(worldPos)

        // Update geometry and material based on selection
        const isSelected = boneName === selectedBone
        mesh.geometry = isSelected ? selectedGeometry : defaultGeometry
        mesh.material = isSelected ? selectedMaterial : defaultMaterial
      }
    })

    // Update line positions
    if (lineRef.current && lineRef.current.geometry) {
      const positions: number[] = []

      bones.forEach((bone, boneName) => {
        const parentName = SKELETON_HIERARCHY[boneName]
        if (parentName) {
          const parentBone = bones.get(parentName)
          if (parentBone) {
            bone.getWorldPosition(worldPos)
            parentBone.getWorldPosition(parentPos)

            positions.push(worldPos.x, worldPos.y, worldPos.z)
            positions.push(parentPos.x, parentPos.y, parentPos.z)
          }
        }
      })

      const geometry = lineRef.current.geometry
      geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      )
      geometry.attributes.position.needsUpdate = true
    }
  })

  // Handle click on sphere to select bone
  const handleSphereClick = (
    boneName: BoneName,
    event: ThreeEvent<MouseEvent>
  ) => {
    event.stopPropagation()
    onSelectBone?.(boneName)
  }

  if (!bones || !visible) {
    return null
  }

  // Get bone names from the map
  const boneNames = Array.from(bones.keys())

  return (
    <group ref={groupRef} renderOrder={999}>
      {/* Bone spheres */}
      {boneNames.map((boneName) => {
        const isSelected = boneName === selectedBone
        return (
          <mesh
            key={boneName}
            ref={(mesh) => {
              if (mesh) {
                sphereRefs.current.set(boneName, mesh)
              } else {
                sphereRefs.current.delete(boneName)
              }
            }}
            geometry={isSelected ? selectedGeometry : defaultGeometry}
            material={isSelected ? selectedMaterial : defaultMaterial}
            onClick={(e) => handleSphereClick(boneName, e)}
            onPointerOver={(e) => {
              e.stopPropagation()
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={() => {
              document.body.style.cursor = 'auto'
            }}
          />
        )
      })}

      {/* Bone connection lines */}
      <lineSegments
        ref={lineRef}
        material={lineMaterial}
        geometry={lineGeometry}
      />
    </group>
  )
}
