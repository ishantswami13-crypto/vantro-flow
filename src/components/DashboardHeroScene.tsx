"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, Sparkles } from "@react-three/drei";
import type { Group, Mesh } from "three";

function SculptureCluster() {
  const clusterRef = useRef<Group | null>(null);
  const ringRef = useRef<Mesh | null>(null);
  const accentRef = useRef<Mesh | null>(null);

  useFrame((state, delta) => {
    if (clusterRef.current) {
      clusterRef.current.rotation.y += delta * 0.18;
      clusterRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.08;
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.45;
    }

    if (accentRef.current) {
      accentRef.current.position.y = 1 + Math.sin(state.clock.elapsedTime * 1.35) * 0.12;
    }
  });

  return (
    <group ref={clusterRef}>
      <Float speed={1.5} rotationIntensity={0.45} floatIntensity={0.65}>
        <mesh>
          <icosahedronGeometry args={[1.05, 10]} />
          <meshPhysicalMaterial
            color="#f6f7fb"
            roughness={0.14}
            metalness={0.2}
            transmission={0.74}
            thickness={1.8}
            clearcoat={1}
            clearcoatRoughness={0.12}
          />
        </mesh>
      </Float>

      <mesh ref={ringRef} rotation={[1.1, 0.1, 0.45]}>
        <torusGeometry args={[1.72, 0.08, 32, 200]} />
        <meshStandardMaterial color="#d4d6df" metalness={0.92} roughness={0.12} />
      </mesh>

      <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.9}>
        <mesh position={[-1.8, -0.55, 0.1]} rotation={[0.2, 0.28, -0.2]}>
          <boxGeometry args={[0.34, 1.2, 0.34]} />
          <meshStandardMaterial color="#f5f7fb" metalness={0.42} roughness={0.22} />
        </mesh>
      </Float>

      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.75}>
        <mesh position={[-1.2, -0.18, 0.45]} rotation={[0.2, 0.1, 0.12]}>
          <boxGeometry args={[0.34, 1.8, 0.34]} />
          <meshStandardMaterial color="#d8dde8" metalness={0.52} roughness={0.2} />
        </mesh>
      </Float>

      <Float speed={1.25} rotationIntensity={0.2} floatIntensity={0.75}>
        <mesh position={[-0.55, 0.22, 0.7]} rotation={[0.2, 0.1, 0.08]}>
          <boxGeometry args={[0.34, 2.3, 0.34]} />
          <meshStandardMaterial color="#a3c8ff" metalness={0.46} roughness={0.18} />
        </mesh>
      </Float>

      <mesh ref={accentRef} position={[1.55, 1.02, -0.3]}>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#8abfff" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

export default function DashboardHeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 5.8]} fov={34} />
        <ambientLight intensity={1.45} />
        <directionalLight position={[4, 6, 5]} intensity={2.3} color="#ffffff" />
        <pointLight position={[-3, -2, 2]} intensity={1.25} color="#8abfff" />
        <Sparkles count={20} scale={4.6} size={2.2} speed={0.35} color="#c8dcff" />
        <SculptureCluster />
      </Canvas>
    </div>
  );
}
