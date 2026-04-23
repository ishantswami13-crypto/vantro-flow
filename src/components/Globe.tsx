"use client"
import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

interface GlobePoint { lat: number; lng: number; elev: number }

function latLngToVec3(lat: number, lng: number, radius: number): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  ]
}

function PointCloud({ points }: { points: GlobePoint[] }) {
  const meshRef = useRef<THREE.Points>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.06
    }
  })

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(points.length * 3)
    const colors = new Float32Array(points.length * 3)
    let seed = 1

    function rng() {
      seed = (seed * 16807 + 0) % 2147483647
      return (seed - 1) / 2147483646
    }

    points.forEach((p, i) => {
      const r = 1.0 + p.elev
      const [x, y, z] = latLngToVec3(p.lat, p.lng, r)
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z

      // Teal color with slight brightness variation
      const brightness = 0.5 + rng() * 0.5
      colors[i * 3] = 0.04 * brightness      // R
      colors[i * 3 + 1] = 0.56 * brightness  // G
      colors[i * 3 + 2] = 0.52 * brightness  // B
    })

    return { positions, colors }
  }, [points])

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [positions, colors])

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        size={0.007}
        vertexColors
        transparent
        opacity={0.95}
        sizeAttenuation
      />
    </points>
  )
}

function Atmosphere() {
  return (
    <>
      <mesh>
        <sphereGeometry args={[1.04, 64, 64]} />
        <meshBasicMaterial color="#0D9488" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.08, 64, 64]} />
        <meshBasicMaterial color="#14B8A6" transparent opacity={0.02} side={THREE.BackSide} />
      </mesh>
    </>
  )
}

function GlobeScene({ points }: { points: GlobePoint[] }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#0D9488" />
      {points.length > 0 && <PointCloud points={points} />}
      <Atmosphere />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI * 3 / 4}
        rotateSpeed={0.4}
      />
    </>
  )
}

export default function Globe() {
  const [points, setPoints] = useState<GlobePoint[]>([])

  useEffect(() => {
    fetch('/globe-points.json')
      .then(r => r.json())
      .then(setPoints)
      .catch(console.error)
  }, [])

  return (
    <div style={{ width: 440, height: 440, flexShrink: 0 }}>
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 42 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <GlobeScene points={points} />
      </Canvas>
    </div>
  )
}
