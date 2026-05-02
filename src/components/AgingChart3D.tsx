"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Billboard, OrbitControls, Text } from "@react-three/drei";
import * as THREE from "three";

export type AgingBarData = {
  label: string;
  value: number;
  color: string;
};

const DEFAULT_DATA: AgingBarData[] = [
  { label: "Current", value: 3.2, color: "#22C55E" },
  { label: "1–30d", value: 1.8, color: "#F59E0B" },
  { label: "31–60d", value: 3.5, color: "#F97316" },
  { label: "60+d", value: 4.5, color: "#EF4444" },
];

function Bar({
  color,
  targetHeight,
  index,
  value,
}: {
  color: string;
  targetHeight: number;
  index: number;
  label: string;
  value: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    if (startTime.current === null) {
      startTime.current = t + index * 0.2;
    }
    const elapsed = t - startTime.current;
    if (elapsed <= 0) {
      meshRef.current.scale.y = 0.001;
      meshRef.current.position.y = 0;
      return;
    }
    const progress = Math.min(elapsed / 1.2, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    meshRef.current.scale.y = Math.max(eased, 0.001);
    meshRef.current.position.y = (targetHeight * eased) / 2;
  });

  return (
    <>
      <mesh ref={meshRef} scale={[1, 0.001, 1]}>
        <boxGeometry args={[0.8, targetHeight, 0.8]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.4} />
      </mesh>
      <Billboard position={[0, targetHeight + 0.5, 0]}>
        <Text fontSize={0.26} color="white" anchorX="center" anchorY="middle">
          {`₹${value}L`}
        </Text>
      </Billboard>
    </>
  );
}

function Scene({ data }: { data: AgingBarData[] }) {
  const groupRef = useRef<THREE.Group>(null);
  const maxValue = Math.max(...data.map((d) => d.value), 1);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.003;
    }
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <group ref={groupRef}>
        {data.map((bar, i) => (
          <group key={bar.label} position={[i * 1.4 - (data.length - 1) * 0.7, 0, 0]}>
            <Bar
              index={i}
              color={bar.color}
              targetHeight={(bar.value / maxValue) * 4}
              label={bar.label}
              value={bar.value}
            />
          </group>
        ))}
      </group>
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
}

export default function AgingChart3D({ data = DEFAULT_DATA }: { data?: AgingBarData[] }) {
  const [webglAvailable, setWebglAvailable] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const markUnavailable = () => {
      window.setTimeout(() => {
        if (!cancelled) setWebglAvailable(false);
      }, 0);
    };

    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      if (!gl) markUnavailable();
    } catch {
      markUnavailable();
    }

    return () => {
      cancelled = true;
    };
  }, []);

  if (!webglAvailable) {
    return (
      <div
        className="flex items-center justify-center rounded-xl"
        style={{ background: "#0F172A", height: 300 }}
      >
        <p style={{ color: "#94A3B8", fontSize: "0.875rem" }}>
          3D chart unavailable — WebGL not supported
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          width: "100%",
          height: 300,
          borderRadius: "0.75rem",
          overflow: "hidden",
          background: "#0F172A",
        }}
      >
        <Canvas
          camera={{ position: [0, 3, 8], fov: 50 }}
          dpr={[1, 1.5]}
          performance={{ min: 0.5 }}
          style={{ background: "#0F172A" }}
        >
          <Scene data={data} />
        </Canvas>
      </div>

      {/* HTML legend */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5">
            <div
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: d.color }}
            />
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
