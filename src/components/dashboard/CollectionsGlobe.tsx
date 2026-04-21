"use client";

import Link from "next/link";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Line, OrbitControls } from "@react-three/drei";
import { geoContains } from "d3-geo";
import landTopology from "world-atlas/land-110m.json";
import { feature } from "topojson-client";
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  ShaderMaterial,
  Vector3,
  type Object3D,
} from "three";

type NetworkRoute = {
  customerId: number;
  customerName: string;
  city: string | null;
  country: string | null;
  outstanding: number;
  invoiceCount: number;
};

type CollectionsGlobeProps = {
  originCity: string | null;
  originCountry: string | null;
  routes: NetworkRoute[];
  totalOutstanding: number;
};

type Coordinates = {
  lat: number;
  lon: number;
};

type GlobeRoute = NetworkRoute & {
  color: string;
  destination: RoutePoint;
};

type RoutePoint = Coordinates & {
  city: string;
  country: string;
};

const ROUTE_COLORS = ["#9cd8ff", "#d9f2ff", "#6fbfff", "#7ad9ff", "#c5ebff", "#b7d6ff"];
const LAND_FEATURE = feature(
  landTopology as never,
  (landTopology as unknown as { objects: { land: unknown } }).objects.land as never,
);

const LOCATION_COORDINATES: Record<string, Coordinates> = {
  delhi: { lat: 28.6139, lon: 77.209 },
  new_delhi: { lat: 28.6139, lon: 77.209 },
  gurgaon: { lat: 28.4595, lon: 77.0266 },
  noida: { lat: 28.5355, lon: 77.391 },
  mumbai: { lat: 19.076, lon: 72.8777 },
  pune: { lat: 18.5204, lon: 73.8567 },
  bangalore: { lat: 12.9716, lon: 77.5946 },
  bengaluru: { lat: 12.9716, lon: 77.5946 },
  chennai: { lat: 13.0827, lon: 80.2707 },
  hyderabad: { lat: 17.385, lon: 78.4867 },
  kolkata: { lat: 22.5726, lon: 88.3639 },
  ahmedabad: { lat: 23.0225, lon: 72.5714 },
  jaipur: { lat: 26.9124, lon: 75.7873 },
  surat: { lat: 21.1702, lon: 72.8311 },
  dubai: { lat: 25.2048, lon: 55.2708 },
  singapore: { lat: 1.3521, lon: 103.8198 },
  london: { lat: 51.5072, lon: -0.1276 },
  paris: { lat: 48.8566, lon: 2.3522 },
  berlin: { lat: 52.52, lon: 13.405 },
  tokyo: { lat: 35.6762, lon: 139.6503 },
  hong_kong: { lat: 22.3193, lon: 114.1694 },
  sydney: { lat: -33.8688, lon: 151.2093 },
  melbourne: { lat: -37.8136, lon: 144.9631 },
  new_york: { lat: 40.7128, lon: -74.006 },
  san_francisco: { lat: 37.7749, lon: -122.4194 },
  toronto: { lat: 43.6532, lon: -79.3832 },
  johannesburg: { lat: -26.2041, lon: 28.0473 },
  nairobi: { lat: -1.2921, lon: 36.8219 },
};

const FALLBACK_POINTS: RoutePoint[] = [
  { city: "Mumbai", country: "India", lat: 19.076, lon: 72.8777 },
  { city: "Dubai", country: "United Arab Emirates", lat: 25.2048, lon: 55.2708 },
  { city: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198 },
  { city: "London", country: "United Kingdom", lat: 51.5072, lon: -0.1276 },
  { city: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503 },
  { city: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093 },
];

let cachedGeometry: BufferGeometry | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, value || 0));
}

function normalizeLocation(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function latLonToVector(lat: number, lon: number, radius = 1) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  const cosLat = Math.cos(latRad);
  return new Vector3(
    cosLat * Math.cos(lonRad) * radius,
    Math.sin(latRad) * radius,
    cosLat * Math.sin(lonRad) * radius,
  );
}

function elevationNoise(lat: number, lon: number) {
  const latWave = (Math.sin(lat * 0.11) + Math.cos(lat * 0.07 + lon * 0.03)) * 0.5;
  const lonWave = (Math.cos(lon * 0.09) + Math.sin(lon * 0.05 - lat * 0.08)) * 0.5;
  return clamp((latWave + lonWave + 1.2) / 2.4, 0, 1);
}

function resolvePoint(city: string | null, country: string | null, index: number): RoutePoint {
  const normalized = normalizeLocation(city);
  const fromMap = normalized ? LOCATION_COORDINATES[normalized] : null;

  if (fromMap) {
    return {
      city: city ?? "Unknown city",
      country: country ?? "Unknown country",
      lat: fromMap.lat,
      lon: fromMap.lon,
    };
  }

  const fallback = FALLBACK_POINTS[index % FALLBACK_POINTS.length];
  return {
    city: city ?? fallback.city,
    country: country ?? fallback.country,
    lat: fallback.lat,
    lon: fallback.lon,
  };
}

function getPointCloudGeometry() {
  if (cachedGeometry) {
    return cachedGeometry;
  }

  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];
  const randoms: number[] = [];
  const targetPoints = 30000;

  for (let index = 0; index < targetPoints; index += 1) {
    const t = index / targetPoints;
    const y = 1 - t * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = Math.PI * (3 - Math.sqrt(5)) * index;
    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;
    const lat = (Math.asin(y) * 180) / Math.PI;
    const lon = (Math.atan2(z, x) * 180) / Math.PI;

    if (!geoContains(LAND_FEATURE, [lon, lat])) {
      continue;
    }

    const elevation = elevationNoise(lat, lon);
    const pointRadius = 1.015 + elevation * 0.08;
    const color = new Color().lerpColors(new Color("#6dbdff"), new Color("#eef8ff"), 0.25 + elevation * 0.75);

    positions.push(x * pointRadius, y * pointRadius, z * pointRadius);
    colors.push(color.r, color.g, color.b);
    sizes.push(1.05 + elevation * 2.2);
    randoms.push(pseudoRandom(index + 1));
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("aColor", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new Float32BufferAttribute(sizes, 1));
  geometry.setAttribute("aRandom", new Float32BufferAttribute(randoms, 1));
  geometry.computeBoundingSphere();
  cachedGeometry = geometry;
  return geometry;
}

const POINT_VERTEX_SHADER = `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aRandom;
  uniform float uTime;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec3 displaced = position;
    float wave = sin(uTime * 0.85 + aRandom * 18.0) * 0.012;
    float phase = fract(uTime * 0.06 + aRandom);
    float reveal = smoothstep(0.0, 0.18, phase) * (1.0 - smoothstep(0.76, 1.0, phase));

    displaced += normalize(position) * wave;
    displaced += vec3(
      sin(uTime * 0.34 + aRandom * 20.0),
      cos(uTime * 0.29 + aRandom * 16.0),
      sin(uTime * 0.26 + aRandom * 12.0)
    ) * 0.0028;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * (340.0 / -mvPosition.z);
    vColor = aColor;
    vAlpha = 0.54 + reveal * 0.46;
  }
`;

const POINT_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float alpha = smoothstep(0.5, 0.05, d);
    if (alpha <= 0.01) discard;
    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

const ATMOSPHERE_VERTEX_SHADER = `
  varying vec3 vNormal;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMOSPHERE_FRAGMENT_SHADER = `
  varying vec3 vNormal;

  void main() {
    float intensity = pow(0.82 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.2);
    gl_FragColor = vec4(0.34, 0.69, 1.0, intensity * 0.42);
  }
`;

function PointCloud() {
  const materialRef = useRef<ShaderMaterial>(null);
  const geometry = getPointCloudGeometry();

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={POINT_VERTEX_SHADER}
        fragmentShader={POINT_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

function AtmosphereShell() {
  return (
    <mesh scale={1.13}>
      <sphereGeometry args={[1, 64, 64]} />
      <shaderMaterial
        vertexShader={ATMOSPHERE_VERTEX_SHADER}
        fragmentShader={ATMOSPHERE_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        side={BackSide}
      />
    </mesh>
  );
}

function RouteArc({ origin, destination, color, offset }: { origin: RoutePoint; destination: RoutePoint; color: string; offset: number }) {
  const start = latLonToVector(origin.lat, origin.lon, 1.02);
  const end = latLonToVector(destination.lat, destination.lon, 1.02);
  const midpoint = start.clone().add(end).normalize().multiplyScalar(1.28 + offset * 0.01);
  const points = new CatmullRomCurve3([start, midpoint, end]).getPoints(72);
  const pulseRef = useRef<Object3D>(null);

  useFrame(({ clock }) => {
    if (!pulseRef.current) {
      return;
    }

    const travel = (clock.getElapsedTime() * 0.16 + offset * 0.11) % 1;
    const index = Math.floor(travel * (points.length - 1));
    pulseRef.current.position.copy(points[index]);
  });

  return (
    <group>
      <Line points={points} color={color} lineWidth={0.9} transparent opacity={0.5} />
      <mesh position={end}>
        <sphereGeometry args={[0.018, 18, 18]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.013, 14, 14]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function GlobeScene({ originPoint, routes }: { originPoint: RoutePoint; routes: GlobeRoute[] }) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[2.8, 1.1, 2.4]} color="#9ad7ff" intensity={3.5} />
      <directionalLight position={[-2.2, -1.5, -2.4]} color="#315dff" intensity={1.6} />

      <group>
        <mesh scale={0.985}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial color="#071226" emissive="#163777" emissiveIntensity={0.65} roughness={0.92} metalness={0.02} transparent opacity={0.94} />
        </mesh>
        <AtmosphereShell />
        <PointCloud />
        <mesh position={latLonToVector(originPoint.lat, originPoint.lon, 1.02)}>
          <sphereGeometry args={[0.022, 18, 18]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        {routes.map((route, index) => (
          <RouteArc
            key={route.customerId}
            origin={originPoint}
            destination={route.destination}
            color={route.color}
            offset={index}
          />
        ))}
      </group>

      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.38} minDistance={3.6} maxDistance={3.6} />
      <EffectComposer enableNormalPass={false}>
        <Bloom mipmapBlur intensity={1.25} luminanceThreshold={0.14} luminanceSmoothing={0.75} />
      </EffectComposer>
    </>
  );
}

export default function CollectionsGlobe({
  originCity,
  originCountry,
  routes,
  totalOutstanding,
}: CollectionsGlobeProps) {
  const originPoint = resolvePoint(originCity, originCountry, 0);
  const preparedRoutes: GlobeRoute[] = routes.slice(0, 5).map((route, index) => ({
    ...route,
    color: ROUTE_COLORS[index % ROUTE_COLORS.length],
    destination: resolvePoint(route.city, route.country, index + 1),
  }));

  return (
    <section className="relative isolate overflow-hidden bg-[#020611] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(88,160,255,0.18),transparent_24%),radial-gradient(circle_at_50%_50%,rgba(41,86,196,0.16),transparent_35%),linear-gradient(180deg,#020611_0%,#04091a_40%,#02040c_100%)]" />
      <div className="globe-stage-drift absolute left-[-6%] top-[8%] h-72 w-72 rounded-full bg-[rgba(54,117,255,0.1)] blur-3xl" />
      <div className="globe-stage-drift-delayed absolute right-[-4%] top-[12%] h-80 w-80 rounded-full bg-[rgba(109,205,255,0.09)] blur-3xl" />

      <div className="relative mx-auto min-h-[calc(100svh-56px)] max-w-[1600px] px-6 pb-10 pt-10 sm:px-10 lg:px-14">
        <div className="pointer-events-none absolute inset-x-0 top-10 z-10 text-center">
          <p className="text-[11px] uppercase tracking-[0.34em] text-white/52">Collections Earth</p>
          <h2
            className="mt-4 text-4xl font-normal leading-none text-white sm:text-5xl lg:text-[4.5rem]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            3D live globe
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/56 sm:text-base">
            Three.js point cloud inspired by the Yoa 3D tutorial, adapted to show your customer routes, cities, and exposure.
          </p>
        </div>

        <div className="relative h-[30rem] sm:h-[38rem] lg:h-[46rem]">
          <Canvas
            camera={{ position: [0, 0, 3.6], fov: 28 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            className="absolute inset-0"
          >
            <GlobeScene originPoint={originPoint} routes={preparedRoutes} />
          </Canvas>
        </div>

        <div className="absolute bottom-8 left-6 z-10 space-y-3 sm:left-10 lg:left-14">
          <div className="rounded-[1.8rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/46">Active exposure</p>
            <p
              className="mt-2 text-3xl font-normal text-white sm:text-4xl"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Rs {formatCurrency(totalOutstanding)}
            </p>
            <p className="mt-1 text-xs text-white/46">
              {preparedRoutes.length} routes across {new Set(preparedRoutes.map((route) => route.country || "Unknown")).size} countries
            </p>
          </div>

          <div className="grid gap-2 sm:max-w-sm">
            {preparedRoutes.slice(0, 3).map((route) => (
              <Link
                key={route.customerId}
                href={`/customers/${route.customerId}`}
                className="group rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{route.customerName}</div>
                    <div className="mt-1 truncate text-[11px] text-white/48">
                      {route.destination.city}, {route.destination.country}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-white">Rs {formatCurrency(route.outstanding)}</div>
                    <div className="mt-1 text-[11px] text-white/42">
                      {route.invoiceCount} invoice{route.invoiceCount === 1 ? "" : "s"}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/42">
                  <span className="h-2 w-2 rounded-full" style={{ background: route.color }} />
                  route live
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-8 right-6 z-10 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/52 backdrop-blur-sm sm:right-10 lg:right-14">
          drag to rotate
        </div>
      </div>
    </section>
  );
}
