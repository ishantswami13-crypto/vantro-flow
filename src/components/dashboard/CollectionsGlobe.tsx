"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

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

type MotionState = {
  lon: number;
  lat: number;
  tiltX: number;
  tiltY: number;
  glowX: number;
  glowY: number;
};

type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
  visible: boolean;
};

type GlobeRoute = NetworkRoute & {
  color: string;
  destination: RoutePoint;
  path: string;
  endPoint: ProjectedPoint;
  labelX: number;
  labelY: number;
  labelWidth: number;
  particles: ProjectedPoint[];
};

const VIEWBOX_SIZE = 760;
const GLOBE_CENTER = VIEWBOX_SIZE / 2;
const GLOBE_RADIUS = 252;

const ROUTE_COLORS = ["#6DF2E7", "#F5C457", "#F38A61", "#FF6D8A", "#89E76E", "#9DA7FF"];

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
  lagos: { lat: 6.5244, lon: 3.3792 },
};

const FALLBACK_COORDINATES: RoutePoint[] = [
  { city: "Mumbai", country: "India", lat: 19.076, lon: 72.8777 },
  { city: "Dubai", country: "United Arab Emirates", lat: 25.2048, lon: 55.2708 },
  { city: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198 },
  { city: "London", country: "United Kingdom", lat: 51.5072, lon: -0.1276 },
  { city: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503 },
  { city: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093 },
];

const STAR_POINTS = Array.from({ length: 18 }, (_, index) => ({
  cx: 80 + (index * 137) % 620,
  cy: 60 + (index * 83) % 600,
  r: 1.4 + ((index * 29) % 10) / 10,
  delay: `${(index % 6) * 0.45}s`,
}));

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.max(0, value || 0));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeLocation(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createClusterPoints(centerLat: number, centerLon: number, spreadLat: number, spreadLon: number, density: number) {
  return Array.from({ length: density }, (_, index) => {
    const seed = centerLat * 10 + centerLon * 10 + index;
    const latOffset = (pseudoRandom(seed) - 0.5) * spreadLat;
    const lonOffset = (pseudoRandom(seed + 11) - 0.5) * spreadLon;
    const size = 0.7 + pseudoRandom(seed + 21) * 1.4;

    return {
      lat: centerLat + latOffset,
      lon: centerLon + lonOffset,
      size,
    };
  });
}

const LAND_POINTS = [
  ...createClusterPoints(22, 79, 18, 24, 64),
  ...createClusterPoints(12, 104, 18, 28, 54),
  ...createClusterPoints(45, 11, 18, 24, 56),
  ...createClusterPoints(4, 19, 38, 28, 52),
  ...createClusterPoints(37, -95, 22, 54, 48),
  ...createClusterPoints(-15, -60, 28, 26, 36),
  ...createClusterPoints(-24, 134, 18, 26, 24),
];

const LATITUDE_LINES = [-60, -30, 0, 30, 60];
const LONGITUDE_LINES = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

function toVector({ lat, lon }: Coordinates) {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;

  return {
    x: Math.cos(latRad) * Math.cos(lonRad),
    y: Math.sin(latRad),
    z: Math.cos(latRad) * Math.sin(lonRad),
  };
}

function toLatLon(vector: { x: number; y: number; z: number }): Coordinates {
  return {
    lat: (Math.asin(clamp(vector.y, -1, 1)) * 180) / Math.PI,
    lon: (Math.atan2(vector.z, vector.x) * 180) / Math.PI,
  };
}

function mixVectors(left: { x: number; y: number; z: number }, right: { x: number; y: number; z: number }, t: number) {
  const dot = clamp(left.x * right.x + left.y * right.y + left.z * right.z, -1, 1);
  const angle = Math.acos(dot);

  if (angle < 0.0001) {
    return { x: left.x, y: left.y, z: left.z };
  }

  const sinAngle = Math.sin(angle);
  const leftWeight = Math.sin((1 - t) * angle) / sinAngle;
  const rightWeight = Math.sin(t * angle) / sinAngle;

  return {
    x: left.x * leftWeight + right.x * rightWeight,
    y: left.y * leftWeight + right.y * rightWeight,
    z: left.z * leftWeight + right.z * rightWeight,
  };
}

function projectToGlobe(lat: number, lon: number, radius: number, centerLon: number, centerLat: number): ProjectedPoint {
  const phi = (lat * Math.PI) / 180;
  const lambda = ((lon - centerLon) * Math.PI) / 180;
  const phi0 = (centerLat * Math.PI) / 180;

  const depth = Math.sin(phi) * Math.sin(phi0) + Math.cos(phi) * Math.cos(phi0) * Math.cos(lambda);
  const x = radius * Math.cos(phi) * Math.sin(lambda);
  const y = -radius * (Math.sin(phi) * Math.cos(phi0) - Math.cos(phi) * Math.cos(lambda) * Math.sin(phi0));

  return {
    x: GLOBE_CENTER + x,
    y: GLOBE_CENTER + y,
    depth,
    visible: depth > -0.08,
  };
}

function buildGeoPath(points: Coordinates[], centerLon: number, centerLat: number, radius = GLOBE_RADIUS) {
  const commands: string[] = [];
  let openSegment = false;

  points.forEach((point) => {
    const projected = projectToGlobe(point.lat, point.lon, radius, centerLon, centerLat);

    if (!projected.visible) {
      openSegment = false;
      return;
    }

    commands.push(`${openSegment ? "L" : "M"}${projected.x.toFixed(2)},${projected.y.toFixed(2)}`);
    openSegment = true;
  });

  return commands.join(" ");
}

function createRouteSamples(start: RoutePoint, end: RoutePoint, steps = 52) {
  const startVector = toVector(start);
  const endVector = toVector(end);

  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const mixed = mixVectors(startVector, endVector, t);
    const point = toLatLon(mixed);
    return {
      lat: point.lat,
      lon: point.lon,
      altitude: 1 + 0.14 * Math.sin(Math.PI * t),
    };
  });
}

function buildAltitudePath(samples: Array<Coordinates & { altitude: number }>, centerLon: number, centerLat: number) {
  const commands: string[] = [];
  let openSegment = false;

  samples.forEach((sample) => {
    const projected = projectToGlobe(sample.lat, sample.lon, GLOBE_RADIUS * sample.altitude, centerLon, centerLat);

    if (!projected.visible) {
      openSegment = false;
      return;
    }

    commands.push(`${openSegment ? "L" : "M"}${projected.x.toFixed(2)},${projected.y.toFixed(2)}`);
    openSegment = true;
  });

  return commands.join(" ");
}

function pickProjectedPoint(
  samples: Array<Coordinates & { altitude: number }>,
  fraction: number,
  centerLon: number,
  centerLat: number,
) {
  const index = clamp(Math.round((samples.length - 1) * fraction), 0, samples.length - 1);
  const sample = samples[index];
  return projectToGlobe(sample.lat, sample.lon, GLOBE_RADIUS * sample.altitude, centerLon, centerLat);
}

function resolvePoint(city: string | null, country: string | null, index: number): RoutePoint {
  const normalized = normalizeLocation(city);

  if (normalized && LOCATION_COORDINATES[normalized]) {
    const point = LOCATION_COORDINATES[normalized];
    return {
      city: city ?? "Untagged city",
      country: country ?? "Unknown country",
      lat: point.lat,
      lon: point.lon,
    };
  }

  const fallback = FALLBACK_COORDINATES[index % FALLBACK_COORDINATES.length];
  return {
    city: city ?? fallback.city,
    country: country ?? fallback.country,
    lat: fallback.lat,
    lon: fallback.lon,
  };
}

function buildLatitudePoints(lat: number) {
  return Array.from({ length: 97 }, (_, index) => ({ lat, lon: -180 + index * 3.75 }));
}

function buildLongitudePoints(lon: number) {
  return Array.from({ length: 81 }, (_, index) => ({ lat: -80 + index * 2, lon }));
}

export default function CollectionsGlobe({
  originCity,
  originCountry,
  routes,
  totalOutstanding,
}: CollectionsGlobeProps) {
  const originPoint = resolvePoint(originCity, originCountry, 0);
  const baseLon = originPoint.lon + 8;
  const baseLat = clamp(originPoint.lat * 0.3, -18, 18);
  const initialMotion: MotionState = {
    lon: baseLon,
    lat: baseLat,
    tiltX: -10,
    tiltY: 8,
    glowX: 52,
    glowY: 46,
  };

  const containerRef = useRef<HTMLElement | null>(null);
  const pointerActiveRef = useRef(false);
  const targetRef = useRef<MotionState>(initialMotion);
  const [motion, setMotion] = useState<MotionState>(initialMotion);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timeInterval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    let frame = 0;

    const loop = (time: number) => {
      if (!pointerActiveRef.current) {
        const idle = time / 1000;
        targetRef.current = {
          lon: initialMotion.lon + Math.sin(idle * 0.28) * 10,
          lat: initialMotion.lat + Math.cos(idle * 0.23) * 5,
          tiltX: -9 + Math.cos(idle * 0.3) * 1.8,
          tiltY: 8 + Math.sin(idle * 0.27) * 3.2,
          glowX: 52 + Math.sin(idle * 0.21) * 8,
          glowY: 46 + Math.cos(idle * 0.24) * 6,
        };
      }

      setMotion((previous) => ({
        lon: previous.lon + (targetRef.current.lon - previous.lon) * 0.06,
        lat: previous.lat + (targetRef.current.lat - previous.lat) * 0.06,
        tiltX: previous.tiltX + (targetRef.current.tiltX - previous.tiltX) * 0.07,
        tiltY: previous.tiltY + (targetRef.current.tiltY - previous.tiltY) * 0.07,
        glowX: previous.glowX + (targetRef.current.glowX - previous.glowX) * 0.05,
        glowY: previous.glowY + (targetRef.current.glowY - previous.glowY) * 0.05,
      }));

      frame = window.requestAnimationFrame(loop);
    };

    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, [baseLat, baseLon]);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!containerRef.current) {
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    const normalizedX = relativeX * 2 - 1;
    const normalizedY = relativeY * 2 - 1;

    pointerActiveRef.current = true;
    targetRef.current = {
      lon: initialMotion.lon - normalizedX * 42,
      lat: clamp(initialMotion.lat + normalizedY * 24, -42, 42),
      tiltX: clamp(-8 - normalizedY * 8, -18, 6),
      tiltY: clamp(8 + normalizedX * 12, -12, 18),
      glowX: clamp(relativeX * 100, 12, 88),
      glowY: clamp(relativeY * 100, 18, 82),
    };
  }

  function handlePointerLeave() {
    pointerActiveRef.current = false;
  }

  const preparedRoutes: GlobeRoute[] = routes.slice(0, 6).map((route, index) => {
    const destination = resolvePoint(route.city, route.country, index + 1);
    const samples = createRouteSamples(originPoint, destination);
    const endPoint = projectToGlobe(destination.lat, destination.lon, GLOBE_RADIUS, motion.lon, motion.lat);
    const labelOffset = endPoint.x >= GLOBE_CENTER ? 20 : -20;
    const labelWidth = Math.min(228, Math.max(136, route.customerName.length * 6.3 + 78));

    return {
      ...route,
      color: ROUTE_COLORS[index % ROUTE_COLORS.length],
      destination,
      path: buildAltitudePath(samples, motion.lon, motion.lat),
      endPoint,
      labelX: clamp(
        endPoint.x + labelOffset - (endPoint.x >= GLOBE_CENTER ? 0 : labelWidth),
        24,
        VIEWBOX_SIZE - labelWidth - 24,
      ),
      labelY: clamp(endPoint.y - 44, 54, VIEWBOX_SIZE - 110),
      labelWidth,
      particles: [0.22, 0.5, 0.78].map((fraction) => pickProjectedPoint(samples, fraction, motion.lon, motion.lat)),
    };
  });

  const graticulePaths = [
    ...LATITUDE_LINES.map((lat) => buildGeoPath(buildLatitudePoints(lat), motion.lon, motion.lat)),
    ...LONGITUDE_LINES.map((lon) => buildGeoPath(buildLongitudePoints(lon), motion.lon, motion.lat)),
  ].filter(Boolean);

  const projectedLand = LAND_POINTS.map((point) => ({
    ...projectToGlobe(point.lat, point.lon, GLOBE_RADIUS * 0.997, motion.lon, motion.lat),
    size: point.size,
  })).filter((point) => point.visible);

  const topRoute = routes[0];
  const countriesVisible = new Set(routes.map((route) => route.country || "Unknown")).size;
  const citiesVisible = new Set(routes.map((route) => route.city || "Pending")).size;
  const liveTime = now
    ? now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "--:--";

  return (
    <section
      ref={containerRef}
      className="relative isolate overflow-hidden bg-[#061416] text-white"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at ${motion.glowX}% ${motion.glowY}%, rgba(85, 244, 232, 0.18), transparent 26%),
            radial-gradient(circle at 74% 24%, rgba(113, 117, 255, 0.14), transparent 28%),
            radial-gradient(circle at 18% 82%, rgba(252, 180, 71, 0.1), transparent 22%),
            linear-gradient(180deg, #081719 0%, #061113 50%, #050b0d 100%)
          `,
        }}
      />

      <div className="globe-stage-drift absolute -left-20 top-10 h-72 w-72 rounded-full bg-[rgba(10,143,132,0.12)] blur-3xl" />
      <div className="globe-stage-drift-delayed absolute right-[-8%] top-[16%] h-[26rem] w-[26rem] rounded-full bg-[rgba(122,173,255,0.16)] blur-3xl" />
      <div className="blob-fog-a absolute left-[8%] top-[54%] h-40 w-64 rounded-full bg-[rgba(84,249,234,0.12)] blur-3xl" />
      <div className="blob-fog-b absolute right-[14%] top-[18%] h-56 w-72 rounded-full bg-[rgba(169,110,255,0.08)] blur-3xl" />
      <div className="blob-fog-c absolute bottom-[8%] left-[46%] h-44 w-72 rounded-full bg-[rgba(255,188,115,0.08)] blur-3xl" />

      <div className="relative mx-auto grid min-h-[calc(100svh-56px)] max-w-[1600px] items-center gap-10 px-6 pb-14 pt-10 sm:px-10 lg:grid-cols-[minmax(320px,480px)_1fr] lg:px-14 lg:pb-20 lg:pt-12">
        <div className="relative z-10 max-w-xl">
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/6 px-4 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/65 backdrop-blur-sm">
              Dashboard
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(109,242,231,0.18)] bg-[rgba(11,57,59,0.6)] px-4 py-1.5 text-[11px] font-medium text-[rgba(151,255,246,0.92)] backdrop-blur-sm">
              <span className="live-dot h-2 w-2 rounded-full bg-[rgba(109,242,231,0.95)]" />
              Live {liveTime}
            </span>
          </div>

          <h1
            className="max-w-lg text-5xl font-normal leading-[0.94] text-white sm:text-6xl lg:text-[5.5rem]"
            style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
          >
            Money in motion,
            <br />
            across your book.
          </h1>

          <p className="mt-5 max-w-md text-sm leading-7 text-white/62 sm:text-base">
            A floating collections globe showing which customer, city, and country is holding exposure right now.
            Move your cursor and rotate the network in place.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { label: "Live routes", value: String(routes.length || 0) },
              { label: "Cities visible", value: String(citiesVisible || 0) },
              { label: "Countries", value: String(countriesVisible || 0) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.35rem] border border-white/10 bg-white/6 px-4 py-4 backdrop-blur-sm"
              >
                <p className="text-[10px] uppercase tracking-[0.18em] text-white/42">{item.label}</p>
                <p
                  className="mt-2 text-3xl font-normal text-white"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-xs text-white/64">
            <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2 backdrop-blur-sm">
              Origin {originPoint.city}, {originPoint.country}
            </span>
            <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2 backdrop-blur-sm">
              Largest route {topRoute ? `Rs ${formatCurrency(topRoute.outstanding)}` : "Rs 0"}
            </span>
            <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2 backdrop-blur-sm">
              Cursor driven rotation
            </span>
          </div>

          <div className="mt-10 space-y-3">
            {preparedRoutes.slice(0, 4).map((route) => (
              <Link
                key={route.customerId}
                href={`/customers/${route.customerId}`}
                className="group flex items-center gap-4 rounded-[1.6rem] border border-white/10 bg-white/6 px-4 py-3 backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-white/18 hover:bg-white/8"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    background: `${route.color}24`,
                    color: route.color,
                    boxShadow: `0 0 0 1px ${route.color}2E`,
                  }}
                >
                  {initials(route.customerName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{route.customerName}</div>
                  <div className="mt-1 truncate text-xs text-white/50">
                    {route.destination.city}, {route.destination.country}
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className="text-xl font-normal text-white"
                    style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                  >
                    Rs {formatCurrency(route.outstanding)}
                  </div>
                  <div className="mt-1 text-[11px] text-white/46">
                    {route.invoiceCount} invoice{route.invoiceCount === 1 ? "" : "s"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="relative min-h-[28rem] sm:min-h-[34rem] lg:min-h-[52rem]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative h-[88vw] w-[88vw] max-h-[54rem] max-w-[54rem] lg:h-[52rem] lg:w-[52rem]"
              style={{
                transform: `perspective(1800px) rotateX(${motion.tiltX}deg) rotateY(${motion.tiltY}deg) translateZ(0)`,
                transition: "transform 0.12s linear",
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="network-halo absolute inset-[8%] rounded-full blur-2xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(124,255,244,0.2) 0%, rgba(76,232,224,0.12) 34%, rgba(10,18,20,0) 70%)",
                }}
              />
              <div
                className="globe-shell absolute inset-[15%] rounded-full border border-white/5"
                style={{
                  background: `
                    radial-gradient(circle at 38% 30%, rgba(255,255,255,0.12), transparent 32%),
                    radial-gradient(circle at 54% 55%, rgba(45,215,193,0.22), transparent 34%),
                    radial-gradient(circle at 72% 58%, rgba(245,196,87,0.1), transparent 24%)
                  `,
                }}
              />
              <div
                className="scan-sheen absolute left-[14%] top-[16%] h-[68%] w-[20%] skew-x-[-18deg] rounded-full blur-xl"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                }}
              />

              <svg
                viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
                className="absolute inset-0 h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <radialGradient id="hero-sphere-fill" cx="38%" cy="28%" r="76%">
                    <stop offset="0%" stopColor="rgba(150,255,242,0.95)" />
                    <stop offset="20%" stopColor="rgba(85,235,223,0.56)" />
                    <stop offset="48%" stopColor="rgba(10,42,46,0.92)" />
                    <stop offset="84%" stopColor="rgba(4,10,12,1)" />
                    <stop offset="100%" stopColor="rgba(2,6,8,1)" />
                  </radialGradient>
                  <radialGradient id="hero-atmosphere" cx="50%" cy="50%" r="55%">
                    <stop offset="72%" stopColor="rgba(109,242,231,0)" />
                    <stop offset="86%" stopColor="rgba(96,244,231,0.26)" />
                    <stop offset="100%" stopColor="rgba(101,252,239,0.56)" />
                  </radialGradient>
                  <radialGradient id="hero-core-highlight" cx="36%" cy="30%" r="44%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                  </radialGradient>
                  <filter id="globe-blur">
                    <feGaussianBlur stdDeviation="22" />
                  </filter>
                  <filter id="soft-glow">
                    <feGaussianBlur stdDeviation="10" />
                  </filter>
                  <filter id="label-shadow">
                    <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="rgba(0,0,0,0.36)" />
                  </filter>
                  <clipPath id="hero-globe-clip">
                    <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} />
                  </clipPath>
                </defs>

                {STAR_POINTS.map((star, index) => (
                  <circle
                    key={`star-${index}`}
                    cx={star.cx}
                    cy={star.cy}
                    r={star.r}
                    fill="rgba(255,255,255,0.52)"
                    className="star-twinkle"
                    style={{ animationDelay: star.delay }}
                  />
                ))}

                <circle
                  cx={GLOBE_CENTER}
                  cy={GLOBE_CENTER}
                  r={GLOBE_RADIUS + 52}
                  fill="url(#hero-atmosphere)"
                  opacity="0.92"
                />
                <circle
                  cx={GLOBE_CENTER}
                  cy={GLOBE_CENTER}
                  r={GLOBE_RADIUS + 32}
                  fill="none"
                  stroke="rgba(109,242,231,0.24)"
                  strokeWidth="2"
                />
                <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} fill="url(#hero-sphere-fill)" />

                <g clipPath="url(#hero-globe-clip)">
                  <circle
                    cx={GLOBE_CENTER - 72}
                    cy={GLOBE_CENTER - 68}
                    r="170"
                    fill="rgba(95,255,240,0.12)"
                    filter="url(#globe-blur)"
                  />
                  <ellipse
                    cx={GLOBE_CENTER - 22}
                    cy={GLOBE_CENTER + 64}
                    rx="138"
                    ry="112"
                    fill="rgba(125,255,232,0.16)"
                    filter="url(#globe-blur)"
                    className="cloud-band-a"
                  />
                  <ellipse
                    cx={GLOBE_CENTER + 116}
                    cy={GLOBE_CENTER - 8}
                    rx="162"
                    ry="76"
                    fill="rgba(255,207,92,0.12)"
                    filter="url(#globe-blur)"
                    className="cloud-band-b"
                  />
                  <ellipse
                    cx={GLOBE_CENTER - 130}
                    cy={GLOBE_CENTER - 44}
                    rx="142"
                    ry="70"
                    fill="rgba(135,222,255,0.14)"
                    filter="url(#globe-blur)"
                    className="cloud-band-c"
                  />
                  <circle
                    cx={GLOBE_CENTER}
                    cy={GLOBE_CENTER}
                    r={GLOBE_RADIUS}
                    fill="url(#hero-core-highlight)"
                    opacity="0.46"
                  />

                  {graticulePaths.map((path, index) => (
                    <path
                      key={`grid-${index}`}
                      d={path}
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="1"
                    />
                  ))}

                  {projectedLand.map((point, index) => (
                    <circle
                      key={`land-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r={point.size + point.depth * 0.55}
                      fill={point.depth > 0.42 ? "rgba(214,255,247,0.92)" : "rgba(118,255,244,0.52)"}
                      opacity={0.28 + point.depth * 0.72}
                    />
                  ))}
                </g>

                {preparedRoutes.map((route, index) =>
                  route.path ? (
                    <g key={route.customerId}>
                      <path
                        d={route.path}
                        fill="none"
                        stroke={route.color}
                        strokeWidth="1.5"
                        opacity="0.16"
                        filter="url(#soft-glow)"
                      />
                      <path
                        d={route.path}
                        fill="none"
                        stroke={route.color}
                        strokeWidth="2.4"
                        opacity="0.68"
                        strokeDasharray="10 12"
                        className="route-stream"
                        style={{ animationDelay: `${index * 0.4}s` }}
                      />
                      <path
                        d={route.path}
                        fill="none"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="0.9"
                        opacity="0.28"
                      />
                      {route.particles
                        .filter((particle) => particle.visible)
                        .map((particle, particleIndex) => (
                          <circle
                            key={`${route.customerId}-${particleIndex}`}
                            cx={particle.x}
                            cy={particle.y}
                            r={particleIndex === 1 ? 6 : 4.6}
                            fill="white"
                            opacity={0.82 - particleIndex * 0.14}
                            className="route-swell"
                            style={{ animationDelay: `${particleIndex * 0.45}s` }}
                          />
                        ))}
                    </g>
                  ) : null,
                )}

                {preparedRoutes.map((route) => {
                  const originSurface = projectToGlobe(
                    originPoint.lat,
                    originPoint.lon,
                    GLOBE_RADIUS,
                    motion.lon,
                    motion.lat,
                  );

                  return (
                    <g key={`node-${route.customerId}`}>
                      {originSurface.visible ? (
                        <>
                          <circle
                            cx={originSurface.x}
                            cy={originSurface.y}
                            r="24"
                            fill="rgba(109,242,231,0.16)"
                            filter="url(#soft-glow)"
                          />
                          <circle cx={originSurface.x} cy={originSurface.y} r="8" fill="rgba(109,242,231,0.95)" />
                        </>
                      ) : null}

                      {route.endPoint.visible ? (
                        <>
                          <circle
                            cx={route.endPoint.x}
                            cy={route.endPoint.y}
                            r="24"
                            fill={`${route.color}26`}
                            filter="url(#soft-glow)"
                          />
                          <circle cx={route.endPoint.x} cy={route.endPoint.y} r="9" fill={route.color} />
                        </>
                      ) : null}
                    </g>
                  );
                })}

                {preparedRoutes
                  .filter((route) => route.endPoint.visible)
                  .slice(0, 4)
                  .map((route) => (
                    <g
                      key={`label-${route.customerId}`}
                      transform={`translate(${route.labelX} ${route.labelY})`}
                      className="globe-label-float"
                      filter="url(#label-shadow)"
                    >
                      <rect
                        width={route.labelWidth}
                        height="54"
                        rx="18"
                        fill="rgba(4,10,12,0.72)"
                        stroke="rgba(255,255,255,0.12)"
                      />
                      <text x="16" y="20" fill="rgba(255,255,255,0.42)" fontSize="9" letterSpacing="2.8">
                        CUSTOMER
                      </text>
                      <text
                        x="16"
                        y="34"
                        fill="white"
                        fontSize="15"
                        fontWeight="600"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {route.customerName.length > 22 ? `${route.customerName.slice(0, 22)}...` : route.customerName}
                      </text>
                      <text
                        x="16"
                        y="47"
                        fill="rgba(255,255,255,0.56)"
                        fontSize="11"
                        style={{ fontFamily: "var(--font-body)" }}
                      >
                        {route.destination.city}, {route.destination.country}
                      </text>
                    </g>
                  ))}

                <g transform="translate(448 84)" filter="url(#label-shadow)">
                  <rect
                    width="214"
                    height="86"
                    rx="28"
                    fill="rgba(255,255,255,0.08)"
                    stroke="rgba(255,255,255,0.12)"
                  />
                  <text x="28" y="28" fill="rgba(255,255,255,0.48)" fontSize="10" letterSpacing="4.2">
                    ACTIVE EXPOSURE
                  </text>
                  <text
                    x="28"
                    y="54"
                    fill="white"
                    fontSize="34"
                    fontWeight="500"
                    style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                  >
                    Rs {formatCurrency(totalOutstanding)}
                  </text>
                  <text
                    x="28"
                    y="70"
                    fill="rgba(255,255,255,0.5)"
                    fontSize="12"
                    style={{ fontFamily: "var(--font-body)" }}
                  >
                    flowing across {routes.length || 0} customer routes
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <div className="absolute right-3 top-4 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/58 backdrop-blur-sm lg:right-12 lg:top-10">
            move cursor to rotate
          </div>
        </div>
      </div>
    </section>
  );
}
