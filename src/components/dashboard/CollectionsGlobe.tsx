"use client";

import Link from "next/link";
import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Line } from "@react-three/drei";
import globePointCloud from "@/generated/globe-point-cloud.json";
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Group,
  MathUtils,
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

type RoutePoint = Coordinates & {
  city: string;
  country: string;
};

type GlobeRoute = NetworkRoute & {
  color: string;
  destination: RoutePoint;
};

type GlobePoint = [number, number, number, number, number];

type GlobePointCloudPayload = {
  meta: {
    count: number;
    actualElevationPoints: number;
    riverPoints: number;
    etopoTiles: string[];
  };
  points: GlobePoint[];
};

const ROUTE_COLORS = ["#8ed7ff", "#f4fbff", "#70b9ff", "#98f7ff", "#b8d5ff", "#e3f3ff"];
const globePayload = globePointCloud as GlobePointCloudPayload;

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

const STARFIELD = Array.from({ length: 64 }, (_, index) => ({
  left: `${8 + pseudoRandom(index + 11) * 84}%`,
  top: `${6 + pseudoRandom(index + 71) * 54}%`,
  size: 1 + pseudoRandom(index + 131) * 2.8,
  opacity: 0.12 + pseudoRandom(index + 191) * 0.68,
  delay: `${pseudoRandom(index + 251) * 5.4}s`,
  duration: `${2.4 + pseudoRandom(index + 311) * 3.6}s`,
}));

const POINT_VERTEX_SHADER = `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aRandom;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uTime;

  void main() {
    vec3 displaced = position;
    float wave = sin(uTime * 0.32 + aRandom * 18.0) * 0.008;
    float shimmer = smoothstep(0.28, 1.0, fract(uTime * 0.022 + aRandom));

    displaced += normalize(position) * wave;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * (420.0 / -mvPosition.z);
    vColor = aColor;
    vAlpha = 0.42 + shimmer * 0.58;
  }
`;

const POINT_FRAGMENT_SHADER = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    float d = distance(gl_PointCoord, vec2(0.5));
    float alpha = smoothstep(0.5, 0.06, d);
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
    float fresnel = pow(0.98 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.8);
    gl_FragColor = vec4(0.32, 0.68, 1.0, fresnel * 0.62);
  }
`;

const CLOUD_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CLOUD_FRAGMENT_SHADER = `
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float uTime;

  float cloudField(vec2 uv) {
    float waveA = sin(uv.x * 22.0 + uTime * 0.1) * 0.5 + 0.5;
    float waveB = cos(uv.y * 17.0 - uTime * 0.08) * 0.5 + 0.5;
    float waveC = sin((uv.x + uv.y) * 28.0 + uTime * 0.06) * 0.5 + 0.5;
    return (waveA * 0.42 + waveB * 0.28 + waveC * 0.3);
  }

  void main() {
    float clouds = smoothstep(0.7, 0.92, cloudField(vUv));
    float rim = pow(0.96 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.4);
    float alpha = clouds * 0.08 + rim * 0.045;
    gl_FragColor = vec4(0.78, 0.91, 1.0, alpha);
  }
`;

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

  for (const [lat, lon, elevation, isRiver, isActual] of globePayload.points) {
    const vector = latLonToVector(lat, lon, 1.006 + elevation * 0.104 + isRiver * 0.008);
    const depthBoost = clamp(elevation * 0.9 + isActual * 0.16, 0, 1);
    const color = isRiver
      ? new Color().lerpColors(new Color("#6fd6ff"), new Color("#dcfcff"), 0.64 + depthBoost * 0.2)
      : new Color().lerpColors(new Color("#143e7a"), new Color("#f2fbff"), 0.18 + depthBoost * 0.72);

    positions.push(vector.x, vector.y, vector.z);
    colors.push(color.r, color.g, color.b);
    sizes.push((isRiver ? 2.1 : 1.3) + elevation * 2.5 + isActual * 0.28);
    randoms.push(pseudoRandom((lat + 90) * 97 + (lon + 180) * 131));
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
    <mesh scale={1.092}>
      <sphereGeometry args={[1, 96, 96]} />
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

function CloudShell() {
  const materialRef = useRef<ShaderMaterial>(null);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
    <mesh scale={1.028}>
      <sphereGeometry args={[1, 96, 96]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={CLOUD_VERTEX_SHADER}
        fragmentShader={CLOUD_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </mesh>
  );
}

function RouteArc({
  origin,
  destination,
  color,
  offset,
}: {
  origin: RoutePoint;
  destination: RoutePoint;
  color: string;
  offset: number;
}) {
  const start = latLonToVector(origin.lat, origin.lon, 1.02);
  const end = latLonToVector(destination.lat, destination.lon, 1.02);
  const midpoint = start.clone().add(end).normalize().multiplyScalar(1.23 + offset * 0.028);
  const points = new CatmullRomCurve3([start, midpoint, end]).getPoints(90);
  const pulseRef = useRef<Object3D>(null);

  useFrame(({ clock }) => {
    if (!pulseRef.current) {
      return;
    }

    const travel = (clock.getElapsedTime() * 0.12 + offset * 0.15) % 1;
    const index = Math.floor(travel * (points.length - 1));
    pulseRef.current.position.copy(points[index]);
  });

  return (
    <group>
      <Line points={points} color={color} lineWidth={2.8} transparent opacity={0.12} />
      <Line points={points} color={color} lineWidth={0.85} transparent opacity={0.76} />
      <mesh position={end}>
        <sphereGeometry args={[0.017, 22, 22]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.012, 18, 18]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function GlobeRig({ originPoint, routes }: { originPoint: RoutePoint; routes: GlobeRoute[] }) {
  const rigRef = useRef<Group>(null);
  const globeRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (rigRef.current) {
      rigRef.current.rotation.x = MathUtils.damp(
        rigRef.current.rotation.x,
        -0.1 + state.pointer.y * 0.16,
        3.2,
        delta,
      );
      rigRef.current.rotation.y = MathUtils.damp(
        rigRef.current.rotation.y,
        state.pointer.x * 0.48,
        3.2,
        delta,
      );
    }

    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.06;
    }
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      <directionalLight position={[0, 6.4, 4.4]} color="#b9e4ff" intensity={4.8} />
      <directionalLight position={[-4.5, 1.8, 3.1]} color="#52a0ff" intensity={2.2} />
      <pointLight position={[0, -1.6, 3.6]} color="#62c6ff" intensity={9} distance={14} />

      <group ref={rigRef}>
        <group ref={globeRef} position={[0, -3.25, -0.25]} scale={3.34} rotation={[0.44, -1.82, 0]}>
          <mesh scale={0.995}>
            <sphereGeometry args={[1, 96, 96]} />
            <meshStandardMaterial
              color="#020c18"
              emissive="#0f58a8"
              emissiveIntensity={0.2}
              roughness={0.92}
              metalness={0.02}
            />
          </mesh>
          <mesh scale={1.045}>
            <sphereGeometry args={[1, 96, 96]} />
            <meshBasicMaterial color="#3f9dff" transparent opacity={0.06} />
          </mesh>
          <AtmosphereShell />
          <CloudShell />
          <PointCloud />

          <mesh position={latLonToVector(originPoint.lat, originPoint.lon, 1.022)}>
            <sphereGeometry args={[0.019, 18, 18]} />
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
      </group>

      <EffectComposer enableNormalPass={false}>
        <Bloom mipmapBlur intensity={1.65} luminanceThreshold={0.06} luminanceSmoothing={0.92} />
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
    <section className="relative isolate overflow-hidden bg-[#01050d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(167,220,255,0.22),transparent_16%),radial-gradient(circle_at_52%_45%,rgba(42,103,196,0.3),transparent_38%),linear-gradient(180deg,#020611_0%,#020917_34%,#01050d_68%,#010308_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_100%,rgba(64,154,255,0.24),transparent_34%)]" />
      <div className="globe-stage-drift absolute left-[-8%] top-[8%] h-80 w-80 rounded-full bg-[rgba(75,130,255,0.14)] blur-3xl" />
      <div className="globe-stage-drift-delayed absolute right-[-4%] top-[10%] h-[22rem] w-[22rem] rounded-full bg-[rgba(122,208,255,0.1)] blur-3xl" />
      <div className="blob-fog-a absolute left-[8%] top-[18%] h-44 w-72 rounded-full bg-[rgba(90,140,255,0.08)] blur-3xl" />
      <div className="blob-fog-b absolute right-[8%] top-[20%] h-56 w-80 rounded-full bg-[rgba(81,193,255,0.07)] blur-3xl" />
      <div className="blob-fog-c absolute bottom-[18%] left-[24%] h-40 w-96 rounded-full bg-[rgba(40,110,255,0.08)] blur-3xl" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {STARFIELD.map((star, index) => (
          <span
            key={index}
            className="star-twinkle absolute rounded-full bg-white"
            style={{
              left: star.left,
              top: star.top,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: star.delay,
              animationDuration: star.duration,
              boxShadow: `0 0 ${star.size * 12}px rgba(155, 214, 255, 0.25)`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto min-h-[calc(100svh-56px)] max-w-[1700px] px-6 pb-10 pt-8 sm:px-10 lg:px-14">
        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="absolute left-0 top-0 max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.34em] text-white/48">Natural Earth + ETOPO</p>
            <h2
              className="mt-5 max-w-3xl text-5xl font-normal leading-[0.94] text-white sm:text-6xl lg:text-[6rem]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Money moving
              <br />
              across the globe.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/58 sm:text-base">
              Real land geometry from the files you dropped in, routed to customer cities and countries with a full-width
              horizon globe that reacts to the mouse.
            </p>
          </div>

          <div className="absolute right-0 top-0 hidden gap-3 lg:flex">
            <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/56 backdrop-blur-sm">
              move mouse to rotate
            </div>
            <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/56 backdrop-blur-sm">
              {globePayload.meta.count} terrain lights
            </div>
          </div>

          <div className="pointer-events-auto absolute bottom-8 left-0 max-w-sm rounded-[1.9rem] border border-white/10 bg-white/6 px-5 py-5 backdrop-blur-xl">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/44">Active exposure</p>
            <p
              className="mt-3 text-4xl font-normal text-white sm:text-5xl"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Rs {formatCurrency(totalOutstanding)}
            </p>
            <p className="mt-2 text-sm text-white/54">
              {preparedRoutes.length} live routes across{" "}
              {new Set(preparedRoutes.map((route) => route.country || "Unknown")).size} countries
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-white/46">
              <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
                {globePayload.meta.etopoTiles.length} ETOPO tile
                {globePayload.meta.etopoTiles.length === 1 ? "" : "s"}
              </span>
              <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
                {globePayload.meta.actualElevationPoints} sampled elevations
              </span>
            </div>
          </div>

          <div className="pointer-events-auto absolute bottom-8 right-0 hidden w-full max-w-[24rem] lg:block">
            <div className="rounded-[2rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/44">Route ledger</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">City / Country</p>
              </div>

              <div className="space-y-2">
                {preparedRoutes.slice(0, 4).map((route) => (
                  <Link
                    key={route.customerId}
                    href={`/customers/${route.customerId}`}
                    className="group flex items-center justify-between gap-4 rounded-[1.35rem] border border-white/8 bg-white/4 px-4 py-3 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-white/8"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full shadow-[0_0_18px_currentColor]"
                        style={{ color: route.color, background: route.color }}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-white">{route.customerName}</div>
                        <div className="mt-1 truncate text-[11px] text-white/46">
                          {route.destination.city}, {route.destination.country}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="text-sm font-semibold text-white">Rs {formatCurrency(route.outstanding)}</div>
                      <div className="mt-1 text-[11px] text-white/38">
                        {route.invoiceCount} invoice{route.invoiceCount === 1 ? "" : "s"}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-[34rem] sm:h-[40rem] lg:h-[48rem]">
          <Canvas
            camera={{ position: [0, 0.1, 5.4], fov: 28 }}
            dpr={[1, 1.75]}
            gl={{ antialias: true, powerPreference: "high-performance" }}
            className="absolute inset-0"
          >
            <GlobeRig originPoint={originPoint} routes={preparedRoutes} />
          </Canvas>
        </div>
      </div>
    </section>
  );
}
