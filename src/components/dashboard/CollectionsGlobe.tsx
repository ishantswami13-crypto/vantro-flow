"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Group,
  MathUtils,
  NormalBlending,
  Object3D,
  SRGBColorSpace,
  Vector3,
} from "three";
import { MeshBasicNodeMaterial, PointsNodeMaterial, RenderPipeline, WebGPURenderer } from "three/webgpu";
import { attribute, float, mix, normalView, pass, pointUV, positionLocal, positionViewDirection, smoothstep, time, vec3 } from "three/tsl";
import { getFallbackGeoPoint, lookupGeoPoint, type ResolvedGeoPoint } from "@/lib/geo";

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

type RoutePoint = ResolvedGeoPoint;

type GlobeRoute = NetworkRoute & {
  color: string;
  destination: RoutePoint;
};

type GlobePoint = [number, number, number, number, number];

type GlobePointCloudPayload = {
  meta: {
    count: number;
    sampleCount?: number;
    actualElevationPoints: number;
    riverPoints: number;
    etopoTiles: string[];
  };
  points: GlobePoint[];
};

const GLOBE_DATA_URL = "/generated/globe-point-cloud.json";
const ROUTE_COLORS = ["#8ed7ff", "#f4fbff", "#70b9ff", "#98f7ff", "#b8d5ff", "#e3f3ff"];

const STARFIELD = Array.from({ length: 64 }, (_, index) => ({
  left: `${8 + pseudoRandom(index + 11) * 84}%`,
  top: `${6 + pseudoRandom(index + 71) * 54}%`,
  size: 1 + pseudoRandom(index + 131) * 2.8,
  opacity: 0.12 + pseudoRandom(index + 191) * 0.68,
  delay: `${pseudoRandom(index + 251) * 5.4}s`,
  duration: `${2.4 + pseudoRandom(index + 311) * 3.6}s`,
}));

let cachedGeometry: BufferGeometry | null = null;
let cachedGeometryKey = "";
let cachedPointMaterial: PointsNodeMaterial | null = null;
let cachedAtmosphereMaterial: MeshBasicNodeMaterial | null = null;
let cachedHaloMaterial: MeshBasicNodeMaterial | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, value || 0));
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("en-IN").format(Math.max(0, value || 0));
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
  const resolved = lookupGeoPoint(city, country);
  if (resolved) {
    return resolved;
  }

  return getFallbackGeoPoint(index);
}

function getPointCloudGeometry(payload: GlobePointCloudPayload) {
  const geometryKey = `${payload.meta.count}:${payload.meta.actualElevationPoints}:${payload.meta.riverPoints}`;
  if (cachedGeometry && cachedGeometryKey === geometryKey) {
    return cachedGeometry;
  }

  if (cachedGeometry) {
    cachedGeometry.dispose();
  }

  const positions: number[] = [];
  const colors: number[] = [];
  const elevations: number[] = [];
  const randoms: number[] = [];
  const actuals: number[] = [];

  for (const [lat, lon, elevation, isRiver, isActual] of payload.points) {
    const vector = latLonToVector(lat, lon, 1.004 + elevation * 0.115 + isRiver * 0.008);
    const relief = clamp(elevation * 0.92 + isActual * 0.12, 0, 1);
    const color = isRiver
      ? new Color().lerpColors(new Color("#2c8dcb"), new Color("#b5efff"), 0.28 + relief * 0.26)
      : new Color().lerpColors(new Color("#0a2b55"), new Color("#84d7ff"), 0.08 + relief * 0.34);

    positions.push(vector.x, vector.y, vector.z);
    colors.push(color.r, color.g, color.b);
    elevations.push(elevation);
    randoms.push(pseudoRandom((lat + 90) * 97 + (lon + 180) * 131));
    actuals.push(isActual);
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("terrainColor", new Float32BufferAttribute(colors, 3));
  geometry.setAttribute("elevation", new Float32BufferAttribute(elevations, 1));
  geometry.setAttribute("random", new Float32BufferAttribute(randoms, 1));
  geometry.setAttribute("actual", new Float32BufferAttribute(actuals, 1));
  geometry.computeBoundingSphere();

  cachedGeometry = geometry;
  cachedGeometryKey = geometryKey;
  return geometry;
}

function getPointMaterial() {
  if (cachedPointMaterial) {
    return cachedPointMaterial;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const terrainColor = attribute("terrainColor", "vec3") as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const elevation = attribute("elevation", "float") as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const random = attribute("random", "float") as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actual = attribute("actual", "float") as any;
  const pulse = time.mul(0.22).add(random.mul(17.0)).sin().mul(0.5).add(0.5);
  const wave = time
    .mul(0.3)
    .add(random.mul(19.0))
    .sin()
    .mul(0.0038)
    .mul(elevation.add(actual.mul(0.06)).add(0.08));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sprite = float(1.0).sub(smoothstep(float(0.12), float(1.0), (pointUV as any).sub(0.5).mul(2.0).length()));

  const material = new PointsNodeMaterial();
  material.positionNode = positionLocal.add(positionLocal.normalize().mul(wave));
  material.colorNode = terrainColor.mul(float(0.42).add(pulse.mul(0.18)));
  material.opacityNode = sprite.mul(float(0.02).add(elevation.mul(0.05)).add(actual.mul(0.02)).add(pulse.mul(0.03)));
  material.transparent = true;
  material.depthWrite = false;
  material.blending = NormalBlending;
  material.toneMapped = false;

  cachedPointMaterial = material;
  return material;
}

function getAtmosphereMaterial() {
  if (cachedAtmosphereMaterial) {
    return cachedAtmosphereMaterial;
  }

  const fresnel = positionViewDirection.dot(normalView).abs().oneMinus().pow(float(3.8));
  const material = new MeshBasicNodeMaterial();
  material.colorNode = mix(vec3(0.04, 0.1, 0.22), vec3(0.36, 0.62, 0.88), fresnel);
  material.opacityNode = fresnel.mul(0.18);
  material.transparent = true;
  material.depthWrite = false;
  material.side = BackSide;
  material.blending = AdditiveBlending;
  material.toneMapped = false;

  cachedAtmosphereMaterial = material;
  return material;
}

function getHaloMaterial() {
  if (cachedHaloMaterial) {
    return cachedHaloMaterial;
  }

  const fresnel = positionViewDirection.dot(normalView).abs().oneMinus().pow(float(2.2));
  const material = new MeshBasicNodeMaterial();
  material.colorNode = mix(vec3(0.05, 0.12, 0.24), vec3(0.28, 0.54, 0.9), fresnel);
  material.opacityNode = fresnel.mul(0.045);
  material.transparent = true;
  material.depthWrite = false;
  material.blending = AdditiveBlending;
  material.toneMapped = false;

  cachedHaloMaterial = material;
  return material;
}

function TerrainPointCloud({ payload }: { payload: GlobePointCloudPayload | null }) {
  if (!payload) {
    return null;
  }

  return <points geometry={getPointCloudGeometry(payload)} material={getPointMaterial()} frustumCulled={false} />;
}

function AtmosphereShell() {
  return (
    <>
      <mesh scale={1.08} material={getAtmosphereMaterial()}>
        <sphereGeometry args={[1, 96, 96]} />
      </mesh>
      <mesh scale={1.12} material={getHaloMaterial()}>
        <sphereGeometry args={[1, 96, 96]} />
      </mesh>
    </>
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
  const start = latLonToVector(origin.lat, origin.lon, 1.025);
  const end = latLonToVector(destination.lat, destination.lon, 1.025);
  const midpoint = start.clone().add(end).normalize().multiplyScalar(1.22 + offset * 0.022);
  const curvePoints = new CatmullRomCurve3([start, midpoint, end]).getPoints(70);
  const positions = new Float32Array(curvePoints.length * 3);
  const pulseRef = useRef<Object3D>(null);

  for (let index = 0; index < curvePoints.length; index += 1) {
    const point = curvePoints[index];
    positions[index * 3] = point.x;
    positions[index * 3 + 1] = point.y;
    positions[index * 3 + 2] = point.z;
  }

  useFrame(({ clock }) => {
    if (!pulseRef.current) {
      return;
    }

    const travel = (clock.getElapsedTime() * 0.11 + offset * 0.14) % 1;
    const index = Math.floor(travel * (curvePoints.length - 1));
    pulseRef.current.position.copy(curvePoints[index]);
  });

  return (
    <group>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.24} toneMapped={false} />
      </line>

      <mesh position={end}>
        <sphereGeometry args={[0.012, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.009, 16, 16]} />
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </mesh>
    </group>
  );
}

function RenderPipelineComposer() {
  const gl = useThree((state) => state.gl) as unknown as WebGPURenderer;
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const pipelineRef = useRef<RenderPipeline | null>(null);

  useEffect(() => {
    const renderPipeline = new RenderPipeline(gl);
    const scenePass = pass(scene, camera);
    const scenePassColor = scenePass.getTextureNode("output");
    const bloomPass = bloom(scenePassColor, 0.42, 0.14, 0.34);

    renderPipeline.outputNode = scenePassColor.add(bloomPass);
    pipelineRef.current = renderPipeline;

    return () => {
      pipelineRef.current = null;
      renderPipeline.dispose();
    };
  }, [camera, gl, scene]);

  useFrame(() => {
    pipelineRef.current?.render();
  }, 1);

  return null;
}

function GlobeRig({
  payload,
  originPoint,
  routes,
}: {
  payload: GlobePointCloudPayload | null;
  originPoint: RoutePoint;
  routes: GlobeRoute[];
}) {
  const rigRef = useRef<Group>(null);
  const globeRef = useRef<Group>(null);

  useFrame((state, delta) => {
    if (rigRef.current) {
      rigRef.current.rotation.x = MathUtils.damp(
        rigRef.current.rotation.x,
        -0.08 + state.pointer.y * 0.16,
        3.2,
        delta,
      );
      rigRef.current.rotation.y = MathUtils.damp(
        rigRef.current.rotation.y,
        state.pointer.x * 0.46,
        3.2,
        delta,
      );
    }

    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.055;
    }
  });

  return (
    <>
      <RenderPipelineComposer />

      <group ref={rigRef}>
        <group ref={globeRef} position={[0, -3.2, -0.2]} scale={3.34} rotation={[0.46, -1.8, 0]}>
          <mesh scale={0.994}>
            <sphereGeometry args={[1, 96, 96]} />
            <meshBasicMaterial color="#010611" />
          </mesh>

          <mesh scale={1.02}>
            <sphereGeometry args={[1, 96, 96]} />
            <meshBasicMaterial color="#17406d" transparent opacity={0.06} toneMapped={false} />
          </mesh>

          <AtmosphereShell />
          <TerrainPointCloud payload={payload} />

          <mesh position={latLonToVector(originPoint.lat, originPoint.lon, 1.028)}>
            <sphereGeometry args={[0.016, 18, 18]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
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
    </>
  );
}

export default function CollectionsGlobe({
  originCity,
  originCountry,
  routes,
  totalOutstanding,
}: CollectionsGlobeProps) {
  const [terrainPayload, setTerrainPayload] = useState<GlobePointCloudPayload | null>(null);
  const [terrainError, setTerrainError] = useState<string | null>(null);
  const originPoint = resolvePoint(originCity, originCountry, 0);
  const preparedRoutes: GlobeRoute[] = routes.slice(0, 5).map((route, index) => ({
    ...route,
    color: ROUTE_COLORS[index % ROUTE_COLORS.length],
    destination: resolvePoint(route.city, route.country, index + 1),
  }));
  const routeCountries = new Set(preparedRoutes.map((route) => route.destination.country)).size;
  const hasRoutes = preparedRoutes.length > 0;

  useEffect(() => {
    const controller = new AbortController();

    async function loadTerrain() {
      try {
        setTerrainError(null);
        const response = await fetch(GLOBE_DATA_URL, { signal: controller.signal, cache: "force-cache" });

        if (!response.ok) {
          throw new Error(`Terrain file not found at ${GLOBE_DATA_URL}`);
        }

        const payload = (await response.json()) as GlobePointCloudPayload;
        setTerrainPayload(payload);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        const message = error instanceof Error ? error.message : "Unable to load terrain point cloud";
        setTerrainError(message);
      }
    }

    loadTerrain();

    return () => controller.abort();
  }, []);

  const terrainStatus = terrainPayload
    ? `${formatInteger(terrainPayload.meta.count)} terrain points`
    : terrainError
      ? "terrain missing"
      : "loading terrain";

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
            <p className="text-[11px] uppercase tracking-[0.34em] text-white/48">Natural Earth + ETOPO + WebGPU</p>
            <h2
              className="mt-5 max-w-[16rem] text-[3.4rem] font-normal leading-[0.9] text-white sm:max-w-[22rem] sm:text-[4.8rem] lg:max-w-[30rem] lg:text-[5.1rem]"
              style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
            >
              Money moving
              <br />
              through a point cloud.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/58 sm:text-base">
              Built from the Natural Earth archive and the ETOPO relief tile in your Downloads folder, then rendered
              as a WebGPU terrain globe with TSL bloom and live customer routes.
            </p>
          </div>

          <div className="absolute right-0 top-0 hidden gap-3 lg:flex">
            <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/56 backdrop-blur-sm">
              move mouse to rotate
            </div>
            <div className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/56 backdrop-blur-sm">
              {terrainStatus}
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
            <div className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/46">
              Origin hub: {originPoint.city}, {originPoint.country}
            </div>
            <p className="mt-3 text-sm text-white/54">
              {terrainError
                ? "Terrain data is missing, so the globe is running without the processed point cloud right now."
                : hasRoutes
                  ? `${preparedRoutes.length} live routes across ${routeCountries} countries`
                  : "Add customer cities to light up destination routes from your origin hub."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.18em] text-white/46">
              <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
                {terrainPayload?.meta.sampleCount
                  ? `${formatInteger(terrainPayload.meta.sampleCount)} sample checks`
                  : "terrain pending"}
              </span>

              <span className="rounded-full border border-white/8 bg-white/4 px-3 py-1.5">
                {terrainPayload
                  ? `${formatInteger(terrainPayload.meta.actualElevationPoints)} sampled elevations`
                  : "awaiting point cloud"}
              </span>
            </div>

            {terrainError ? (
              <p className="mt-4 text-xs leading-6 text-white/42">
                Run <code>python src/scripts/build_globe_data.py</code> after keeping the Natural Earth zip and ETOPO
                tile in <code>Downloads</code>.
              </p>
            ) : null}
          </div>

          <div className="pointer-events-auto absolute bottom-8 right-0 hidden w-full max-w-[24rem] lg:block">
            <div className="rounded-[2rem] border border-white/10 bg-white/6 p-4 backdrop-blur-xl">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/44">Route ledger</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/32">City / Country</p>
              </div>

              <div className="space-y-2">
                {hasRoutes ? (
                  preparedRoutes.slice(0, 4).map((route) => (
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
                  ))
                ) : (
                  <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/4 px-4 py-4 text-sm text-white/50">
                    Customer cities are empty, so the globe is holding on the origin hub for now.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="relative h-[34rem] sm:h-[40rem] lg:h-[48rem]">
          <Canvas
            camera={{ position: [0, 0.08, 5.4], fov: 28 }}
            dpr={[1, 1.6]}
            frameloop="always"
            gl={async (props) => {
              const renderer = new WebGPURenderer({
                canvas: props.canvas as HTMLCanvasElement,
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
              });

              await renderer.init();
              renderer.outputColorSpace = SRGBColorSpace;
              renderer.toneMapping = ACESFilmicToneMapping;
              renderer.toneMappingExposure = 0.78;
              renderer.setClearColor(0x000000, 0);

              return renderer as never;
            }}
            className="absolute inset-0"
          >
            <GlobeRig payload={terrainPayload} originPoint={originPoint} routes={preparedRoutes} />
          </Canvas>
        </div>

        <div className="relative z-20 mt-4 lg:hidden">
          {hasRoutes ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {preparedRoutes.map((route) => (
                <Link
                  key={route.customerId}
                  href={`/customers/${route.customerId}`}
                  className="min-w-[15rem] rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-xl"
                >
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-white/40">
                    <span
                      className="h-2 w-2 rounded-full shadow-[0_0_16px_currentColor]"
                      style={{ color: route.color, background: route.color }}
                    />
                    Route
                  </div>
                  <div className="mt-3 text-sm font-medium text-white">{route.customerName}</div>
                  <div className="mt-1 text-xs text-white/48">
                    {route.destination.city}, {route.destination.country}
                  </div>
                  <div className="mt-3 text-xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Rs {formatCurrency(route.outstanding)}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/6 px-4 py-4 text-sm text-white/54 backdrop-blur-xl">
              Add or import customer cities to turn this from a terrain globe into a live route map.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
