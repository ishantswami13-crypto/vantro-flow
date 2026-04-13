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
            color="#ffffff"
            roughness={0.08}
            metalness={0.08}
            transmission={0.82}
            thickness={1.8}
            clearcoat={1}
            clearcoatRoughness={0.08}
          />
        </mesh>
      </Float>

      <mesh ref={ringRef} rotation={[1.1, 0.1, 0.45]}>
        <torusGeometry args={[1.72, 0.08, 32, 200]} />
        <meshStandardMaterial color="#0A8F84" metalness={0.8} roughness={0.2} />
      </mesh>

      <Float speed={1.6} rotationIntensity={0.25} floatIntensity={0.9}>
        <mesh position={[-1.8, -0.55, 0.1]} rotation={[0.2, 0.28, -0.2]}>
          <boxGeometry args={[0.34, 1.2, 0.34]} />
          <meshStandardMaterial color="#CDEDEA" metalness={0.28} roughness={0.3} />
        </mesh>
      </Float>

      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.75}>
        <mesh position={[-1.2, -0.18, 0.45]} rotation={[0.2, 0.1, 0.12]}>
          <boxGeometry args={[0.34, 1.8, 0.34]} />
          <meshStandardMaterial color="#0DC4B4" metalness={0.35} roughness={0.24} />
        </mesh>
      </Float>

      <Float speed={1.25} rotationIntensity={0.2} floatIntensity={0.75}>
        <mesh position={[-0.55, 0.22, 0.7]} rotation={[0.2, 0.1, 0.08]}>
          <boxGeometry args={[0.34, 2.3, 0.34]} />
          <meshStandardMaterial color="#7C3AED" metalness={0.35} roughness={0.22} />
        </mesh>
      </Float>

      <mesh ref={accentRef} position={[1.55, 1.02, -0.3]}>
        <sphereGeometry args={[0.24, 32, 32]} />
        <meshStandardMaterial color="#ffffff" emissive="#d7f7f4" emissiveIntensity={0.65} />
      </mesh>
    </group>
  );
}

export default function DashboardHeroScene() {
  return (
    <div className="absolute inset-0">
      <Canvas dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}>
        <PerspectiveCamera makeDefault position={[0, 0, 5.8]} fov={34} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} color="#ffffff" />
        <pointLight position={[-3, -2, 2]} intensity={1.3} color="#0DC4B4" />
        <Sparkles count={28} scale={4.6} size={2.5} speed={0.5} color="#0DC4B4" />
        <SculptureCluster />
      </Canvas>
    </div>
  );
}
