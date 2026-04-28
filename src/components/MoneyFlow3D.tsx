"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COIN_COUNT = 40;

type CoinProps = {
  position: [number, number, number];
  color: string;
  emissive: string;
  speed: number;
  offset: number;
  rotSpeed: [number, number];
};

function Coin({ position, color, emissive, speed, offset, rotSpeed }: CoinProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const origin = useRef(new THREE.Vector3(...position));

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    meshRef.current.position.x = origin.current.x + Math.sin(t * speed + offset) * 0.6;
    meshRef.current.position.y = origin.current.y + Math.cos(t * speed * 0.7 + offset * 1.3) * 0.5;
    meshRef.current.position.z = origin.current.z + Math.sin(t * speed * 0.5 + offset * 0.8) * 0.3;
    meshRef.current.rotation.x += rotSpeed[0];
    meshRef.current.rotation.y += rotSpeed[1];
  });

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
      <meshStandardMaterial
        color={color}
        emissive={emissive}
        emissiveIntensity={0.4}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function Scene() {
  const coins = useMemo<CoinProps[]>(() => {
    const result: CoinProps[] = [];
    for (let i = 0; i < COIN_COUNT; i++) {
      const isGold = i % 2 === 0;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 5;
      result.push({
        position: [
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi),
        ],
        color: isGold ? "#F5C842" : "#22C55E",
        emissive: isGold ? "#B8860B" : "#15803D",
        speed: 0.15 + Math.random() * 0.2,
        offset: Math.random() * Math.PI * 2,
        rotSpeed: [
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.008,
        ],
      });
    }
    return result;
  }, []);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="white" />
      {coins.map((coin, i) => (
        <Coin key={i} {...coin} />
      ))}
    </>
  );
}

export default function MoneyFlow3D() {
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      if (!gl) setWebglAvailable(false);
    } catch {
      setWebglAvailable(false);
    }
  }, []);

  if (!webglAvailable) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 12], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        frameloop="always"
        performance={{ min: 0.5 }}
        style={{ background: "transparent" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
