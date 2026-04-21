"use client";

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
  glowX: number;
  glowY: number;
};

type ProjectedPoint = {
  x: number;
  y: number;
  depth: number;
  visible: boolean;
};

type StageRoute = NetworkRoute & {
  color: string;
  destination: RoutePoint;
  path: string;
  endPoint: ProjectedPoint;
  stageX: number;
  stageY: number;
  labelX: number;
  labelY: number;
  labelWidth: number;
  particles: ProjectedPoint[];
};

const VIEWBOX_SIZE = 760;
const GLOBE_CENTER = VIEWBOX_SIZE / 2;
const GLOBE_RADIUS = 252;
const STAGE_WIDTH = 1600;
const STAGE_HEIGHT = 900;
const STAGE_SCALE = 3;
const STAGE_OFFSET_X = STAGE_WIDTH / 2 - GLOBE_CENTER * STAGE_SCALE;
const STAGE_OFFSET_Y = 0;

const ROUTE_COLORS = ["#9AD8FF", "#DDF4FF", "#6CB9FF", "#B8E8FF", "#78CAFF", "#F3FBFF"];

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

const LATITUDE_LINES = [-60, -30, 0, 30, 60];
const LONGITUDE_LINES = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

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
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function createClusterPoints(centerLat: number, centerLon: number, spreadLat: number, spreadLon: number, density: number) {
  return Array.from({ length: density }, (_, index) => {
    const seed = centerLat * 10 + centerLon * 10 + index;
    return {
      lat: centerLat + (pseudoRandom(seed) - 0.5) * spreadLat,
      lon: centerLon + (pseudoRandom(seed + 11) - 0.5) * spreadLon,
      size: 0.7 + pseudoRandom(seed + 21) * 1.25,
    };
  });
}

const LAND_POINTS = [
  ...createClusterPoints(50, -40, 18, 34, 54),
  ...createClusterPoints(48, 24, 18, 30, 56),
  ...createClusterPoints(24, 76, 18, 24, 54),
  ...createClusterPoints(8, 104, 18, 26, 42),
  ...createClusterPoints(-12, 132, 14, 22, 20),
];

const STAR_POINTS = Array.from({ length: 40 }, (_, index) => ({
  x: 40 + pseudoRandom(index + 1) * 1520,
  y: 30 + pseudoRandom(index + 51) * 470,
  r: 0.8 + pseudoRandom(index + 103) * 2,
  delay: `${(index % 7) * 0.4}s`,
}));

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
  if (angle < 0.0001) return left;

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

  return {
    x: GLOBE_CENTER + radius * Math.cos(phi) * Math.sin(lambda),
    y: GLOBE_CENTER - radius * (Math.sin(phi) * Math.cos(phi0) - Math.cos(phi) * Math.cos(lambda) * Math.sin(phi0)),
    depth,
    visible: depth > -0.08,
  };
}

function buildGeoPath(points: Coordinates[], centerLon: number, centerLat: number, radius = GLOBE_RADIUS) {
  const commands: string[] = [];
  let open = false;

  points.forEach((point) => {
    const projected = projectToGlobe(point.lat, point.lon, radius, centerLon, centerLat);
    if (!projected.visible) {
      open = false;
      return;
    }

    commands.push(`${open ? "L" : "M"}${projected.x.toFixed(2)},${projected.y.toFixed(2)}`);
    open = true;
  });

  return commands.join(" ");
}

function buildLatitudePoints(lat: number) {
  return Array.from({ length: 97 }, (_, index) => ({ lat, lon: -180 + index * 3.75 }));
}

function buildLongitudePoints(lon: number) {
  return Array.from({ length: 81 }, (_, index) => ({ lat: -80 + index * 2, lon }));
}

function createRouteSamples(start: RoutePoint, end: RoutePoint, steps = 52) {
  const startVector = toVector(start);
  const endVector = toVector(end);

  return Array.from({ length: steps + 1 }, (_, index) => {
    const t = index / steps;
    const point = toLatLon(mixVectors(startVector, endVector, t));

    return {
      lat: point.lat,
      lon: point.lon,
      altitude: 1 + 0.14 * Math.sin(Math.PI * t),
    };
  });
}

function buildAltitudePath(samples: Array<Coordinates & { altitude: number }>, centerLon: number, centerLat: number) {
  const commands: string[] = [];
  let open = false;

  samples.forEach((sample) => {
    const projected = projectToGlobe(sample.lat, sample.lon, GLOBE_RADIUS * sample.altitude, centerLon, centerLat);
    if (!projected.visible) {
      open = false;
      return;
    }

    commands.push(`${open ? "L" : "M"}${projected.x.toFixed(2)},${projected.y.toFixed(2)}`);
    open = true;
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

function toStagePoint(point: ProjectedPoint) {
  return {
    x: STAGE_OFFSET_X + point.x * STAGE_SCALE,
    y: STAGE_OFFSET_Y + point.y * STAGE_SCALE,
  };
}

export default function CollectionsGlobe({
  originCity,
  originCountry,
  routes,
  totalOutstanding,
}: CollectionsGlobeProps) {
  const originPoint = resolvePoint(originCity, originCountry, 0);
  const baseLon = originPoint.lon + 10;
  const baseLat = clamp(originPoint.lat * 0.28 + 8, -6, 28);

  const containerRef = useRef<HTMLElement | null>(null);
  const pointerActiveRef = useRef(false);
  const targetRef = useRef<MotionState>({ lon: baseLon, lat: baseLat, glowX: 52, glowY: 28 });
  const [motion, setMotion] = useState<MotionState>({ lon: baseLon, lat: baseLat, glowX: 52, glowY: 28 });
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let frame = 0;

    const loop = (time: number) => {
      if (!pointerActiveRef.current) {
        const idle = time / 1000;
        targetRef.current = {
          lon: baseLon + Math.sin(idle * 0.19) * 9,
          lat: baseLat + Math.cos(idle * 0.14) * 3,
          glowX: 52 + Math.sin(idle * 0.16) * 7,
          glowY: 28 + Math.cos(idle * 0.18) * 4,
        };
      }

      setMotion((previous) => ({
        lon: previous.lon + (targetRef.current.lon - previous.lon) * 0.055,
        lat: previous.lat + (targetRef.current.lat - previous.lat) * 0.055,
        glowX: previous.glowX + (targetRef.current.glowX - previous.glowX) * 0.06,
        glowY: previous.glowY + (targetRef.current.glowY - previous.glowY) * 0.06,
      }));

      frame = window.requestAnimationFrame(loop);
    };

    frame = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(frame);
  }, [baseLat, baseLon]);

  function handlePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const nx = px * 2 - 1;
    const ny = py * 2 - 1;

    pointerActiveRef.current = true;
    targetRef.current = {
      lon: baseLon - nx * 28,
      lat: clamp(baseLat + ny * 10, -10, 34),
      glowX: clamp(px * 100, 10, 90),
      glowY: clamp(py * 100, 10, 52),
    };
  }

  function handlePointerLeave() {
    pointerActiveRef.current = false;
  }

  const originSurface = projectToGlobe(originPoint.lat, originPoint.lon, GLOBE_RADIUS, motion.lon, motion.lat);
  const preparedRoutes: StageRoute[] = routes.slice(0, 6).map((route, index) => {
    const destination = resolvePoint(route.city, route.country, index + 1);
    const samples = createRouteSamples(originPoint, destination);
    const endPoint = projectToGlobe(destination.lat, destination.lon, GLOBE_RADIUS, motion.lon, motion.lat);
    const stagePoint = toStagePoint(endPoint);
    const labelWidth = Math.min(268, Math.max(194, route.customerName.length * 6.5 + 110));
    const placeLeft = stagePoint.x > STAGE_WIDTH / 2;

    return {
      ...route,
      color: ROUTE_COLORS[index % ROUTE_COLORS.length],
      destination,
      path: buildAltitudePath(samples, motion.lon, motion.lat),
      endPoint,
      stageX: stagePoint.x,
      stageY: stagePoint.y,
      labelX: clamp(stagePoint.x + (placeLeft ? -labelWidth - 34 : 34), 56, STAGE_WIDTH - labelWidth - 56),
      labelY: clamp(stagePoint.y - 142, 136, 404),
      labelWidth,
      particles: [0.22, 0.5, 0.78].map((fraction) => pickProjectedPoint(samples, fraction, motion.lon, motion.lat)),
    };
  });

  const labelRoutes = preparedRoutes
    .filter((route) => route.endPoint.visible && route.stageY > 360 && route.stageY < STAGE_HEIGHT - 24)
    .slice(0, 4);

  const graticulePaths = [
    ...LATITUDE_LINES.map((lat) => buildGeoPath(buildLatitudePoints(lat), motion.lon, motion.lat)),
    ...LONGITUDE_LINES.map((lon) => buildGeoPath(buildLongitudePoints(lon), motion.lon, motion.lat)),
  ].filter(Boolean);

  const projectedLand = LAND_POINTS.map((point) => ({
    ...projectToGlobe(point.lat, point.lon, GLOBE_RADIUS * 0.998, motion.lon, motion.lat),
    size: point.size,
  })).filter((point) => point.visible);

  const topRoute = routes[0];
  const citiesVisible = new Set(routes.map((route) => route.city || "Pending")).size;
  const countriesVisible = new Set(routes.map((route) => route.country || "Unknown")).size;
  const liveTime = now
    ? now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "--:--";

  return (
    <section
      ref={containerRef}
      className="relative isolate overflow-hidden bg-[#020712] text-white"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at ${motion.glowX}% ${motion.glowY}%, rgba(101, 187, 255, 0.22), transparent 22%),
            radial-gradient(circle at 50% 32%, rgba(52, 96, 214, 0.18), transparent 30%),
            linear-gradient(180deg, #020611 0%, #030818 40%, #02050d 100%)
          `,
        }}
      />
      <div className="globe-stage-drift absolute left-[-8%] top-[10%] h-64 w-64 rounded-full bg-[rgba(76,132,255,0.08)] blur-3xl" />
      <div className="globe-stage-drift-delayed absolute right-[-4%] top-[14%] h-80 w-80 rounded-full bg-[rgba(125,214,255,0.08)] blur-3xl" />
      <div className="blob-fog-a absolute left-[12%] top-[26%] h-28 w-56 rounded-full bg-[rgba(106,155,255,0.07)] blur-3xl" />
      <div className="blob-fog-b absolute right-[20%] top-[20%] h-28 w-64 rounded-full bg-[rgba(80,140,255,0.06)] blur-3xl" />

      <div className="pointer-events-none absolute inset-x-0 top-8 z-10 px-6 text-center sm:top-10">
        <p className="text-[11px] uppercase tracking-[0.34em] text-white/54">Vantro Flow</p>
        <h1
          className="mt-4 text-4xl font-normal leading-none text-white sm:text-5xl lg:text-[4.5rem]"
          style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
        >
          Collections Earth
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/54 sm:text-base">
          Real-time customer exposure across cities and countries. Move your cursor to rotate the horizon.
        </p>
      </div>

      <div className="relative mx-auto min-h-[35rem] max-w-[1600px] sm:min-h-[42rem] lg:min-h-[54rem]">
        <svg viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          <defs>
            <radialGradient id="earth-fill" cx="50%" cy="8%" r="76%">
              <stop offset="0%" stopColor="rgba(236,247,255,0.96)" />
              <stop offset="18%" stopColor="rgba(191,225,255,0.88)" />
              <stop offset="34%" stopColor="rgba(70,142,255,0.58)" />
              <stop offset="58%" stopColor="rgba(11,33,79,0.94)" />
              <stop offset="100%" stopColor="rgba(1,6,17,1)" />
            </radialGradient>
            <radialGradient id="rim-glow" cx="50%" cy="50%" r="58%">
              <stop offset="0%" stopColor="rgba(146,221,255,0.95)" />
              <stop offset="30%" stopColor="rgba(92,170,255,0.22)" />
              <stop offset="100%" stopColor="rgba(92,170,255,0)" />
            </radialGradient>
            <radialGradient id="ice-cap" cx="50%" cy="4%" r="34%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.78)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
            <filter id="planet-blur">
              <feGaussianBlur stdDeviation="22" />
            </filter>
            <filter id="soft-glow">
              <feGaussianBlur stdDeviation="8" />
            </filter>
            <filter id="label-shadow">
              <feDropShadow dx="0" dy="10" stdDeviation="16" floodColor="rgba(0,0,0,0.4)" />
            </filter>
            <clipPath id="earth-clip">
              <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} />
            </clipPath>
          </defs>

          {STAR_POINTS.map((star, index) => (
            <circle
              key={`star-${index}`}
              cx={star.x}
              cy={star.y}
              r={star.r}
              fill="rgba(214,233,255,0.72)"
              className="star-twinkle"
              style={{ animationDelay: star.delay }}
            />
          ))}

          <ellipse cx="800" cy="504" rx="720" ry="62" fill="none" stroke="rgba(109,198,255,0.48)" strokeWidth="8" filter="url(#soft-glow)" />
          <ellipse cx="800" cy="388" rx="540" ry="120" fill="url(#rim-glow)" opacity="0.82" />

          <g transform={`translate(${STAGE_OFFSET_X} ${STAGE_OFFSET_Y}) scale(${STAGE_SCALE})`}>
            <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS + 18} fill="url(#rim-glow)" opacity="0.82" />
            <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS + 7} fill="none" stroke="rgba(130,217,255,0.74)" strokeWidth="2.6" />
            <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} fill="url(#earth-fill)" />

            <g clipPath="url(#earth-clip)">
              <ellipse cx={GLOBE_CENTER} cy={GLOBE_CENTER - 110} rx="146" ry="70" fill="rgba(255,255,255,0.18)" filter="url(#planet-blur)" className="cloud-band-a" />
              <ellipse cx={GLOBE_CENTER + 46} cy={GLOBE_CENTER - 36} rx="182" ry="78" fill="rgba(99,166,255,0.14)" filter="url(#planet-blur)" className="cloud-band-b" />
              <ellipse cx={GLOBE_CENTER - 128} cy={GLOBE_CENTER - 8} rx="152" ry="68" fill="rgba(255,255,255,0.08)" filter="url(#planet-blur)" className="cloud-band-c" />
              <circle cx={GLOBE_CENTER} cy={GLOBE_CENTER} r={GLOBE_RADIUS} fill="url(#ice-cap)" opacity="0.82" />

              {graticulePaths.map((path, index) => (
                <path key={`grid-${index}`} d={path} fill="none" stroke="rgba(190,222,255,0.08)" strokeWidth="0.85" />
              ))}

              {projectedLand.map((point, index) => (
                <circle
                  key={`land-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={point.size + point.depth * 0.28}
                  fill={point.depth > 0.38 ? "rgba(245,251,255,0.86)" : "rgba(162,211,255,0.42)"}
                  opacity={0.24 + point.depth * 0.74}
                />
              ))}
            </g>

            {preparedRoutes.map((route, index) =>
              route.path ? (
                <g key={route.customerId}>
                  <path d={route.path} fill="none" stroke="rgba(93,181,255,0.16)" strokeWidth="1.5" filter="url(#soft-glow)" />
                  <path
                    d={route.path}
                    fill="none"
                    stroke={route.color}
                    strokeWidth="1.1"
                    opacity="0.8"
                    strokeDasharray="8 12"
                    className="route-stream"
                    style={{ animationDelay: `${index * 0.35}s` }}
                  />
                  {route.particles.filter((particle) => particle.visible).map((particle, particleIndex) => (
                    <circle
                      key={`${route.customerId}-${particleIndex}`}
                      cx={particle.x}
                      cy={particle.y}
                      r={particleIndex === 1 ? 2.4 : 1.8}
                      fill="rgba(255,255,255,0.92)"
                      className="route-swell"
                      style={{ animationDelay: `${particleIndex * 0.4}s` }}
                    />
                  ))}
                </g>
              ) : null,
            )}

            {originSurface.visible ? (
              <>
                <circle cx={originSurface.x} cy={originSurface.y} r="9" fill="rgba(120,216,255,0.18)" filter="url(#soft-glow)" />
                <circle cx={originSurface.x} cy={originSurface.y} r="3.2" fill="rgba(207,241,255,0.95)" />
              </>
            ) : null}

            {preparedRoutes.map((route) =>
              route.endPoint.visible ? (
                <g key={`node-${route.customerId}`}>
                  <circle cx={route.endPoint.x} cy={route.endPoint.y} r="8" fill={`${route.color}22`} filter="url(#soft-glow)" />
                  <circle cx={route.endPoint.x} cy={route.endPoint.y} r="3" fill={route.color} />
                </g>
              ) : null,
            )}
          </g>

          {labelRoutes.map((route) => {
            const connectorX = route.labelX + (route.stageX > STAGE_WIDTH / 2 ? route.labelWidth - 26 : 26);
            const connectorY = route.labelY + 70;

            return (
              <g key={`label-${route.customerId}`} className="globe-label-float" filter="url(#label-shadow)">
                <path
                  d={`M ${route.stageX} ${route.stageY - 8} C ${route.stageX} ${route.stageY - 52}, ${connectorX} ${connectorY + 20}, ${connectorX} ${connectorY}`}
                  fill="none"
                  stroke="rgba(167,221,255,0.46)"
                  strokeWidth="1.4"
                />
                <g transform={`translate(${route.labelX} ${route.labelY})`}>
                  <rect width={route.labelWidth} height="74" rx="22" fill="rgba(5,12,27,0.72)" stroke="rgba(156,214,255,0.16)" />
                  <text x="18" y="24" fill="rgba(180,210,255,0.48)" fontSize="9" letterSpacing="2.8">CUSTOMER</text>
                  <text x="18" y="42" fill="white" fontSize="15" fontWeight="600" style={{ fontFamily: "var(--font-body)" }}>
                    {route.customerName.length > 24 ? `${route.customerName.slice(0, 24)}...` : route.customerName}
                  </text>
                  <text x="18" y="58" fill="rgba(207,226,255,0.6)" fontSize="11" style={{ fontFamily: "var(--font-body)" }}>
                    {route.destination.city}, {route.destination.country}
                  </text>
                  <text x={route.labelWidth - 18} y="42" fill={route.color} fontSize="18" textAnchor="end" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
                    Rs {formatCurrency(route.outstanding)}
                  </text>
                </g>
              </g>
            );
          })}

          <g transform="translate(546 738)" filter="url(#label-shadow)">
            <rect width="508" height="88" rx="30" fill="rgba(5,12,27,0.54)" stroke="rgba(167,221,255,0.12)" />
            <text x="36" y="28" fill="rgba(193,216,255,0.44)" fontSize="10" letterSpacing="3.6">ACTIVE EXPOSURE</text>
            <text x="36" y="58" fill="white" fontSize="34" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              Rs {formatCurrency(totalOutstanding)}
            </text>
            <text x="258" y="28" fill="rgba(193,216,255,0.44)" fontSize="10" letterSpacing="3.6">ROUTES</text>
            <text x="258" y="58" fill="white" fontSize="30" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{routes.length || 0}</text>
            <text x="344" y="28" fill="rgba(193,216,255,0.44)" fontSize="10" letterSpacing="3.6">CITIES</text>
            <text x="344" y="58" fill="white" fontSize="30" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>{citiesVisible}</text>
            <text x="432" y="28" fill="rgba(193,216,255,0.44)" fontSize="10" letterSpacing="3.6">LIVE</text>
            <text x="432" y="58" fill="white" fontSize="24" style={{ fontFamily: "var(--font-body)" }}>{liveTime}</text>
          </g>

          <g transform="translate(110 716)" filter="url(#label-shadow)">
            <rect width="260" height="70" rx="26" fill="rgba(5,12,27,0.46)" stroke="rgba(167,221,255,0.1)" />
            <text x="26" y="27" fill="rgba(193,216,255,0.42)" fontSize="10" letterSpacing="3.2">ORIGIN</text>
            <text x="26" y="50" fill="white" fontSize="20" style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}>
              {originPoint.city}, {originPoint.country}
            </text>
          </g>
        </svg>

        {topRoute ? (
          <div className="pointer-events-none absolute left-6 top-6 z-10 hidden rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/52 backdrop-blur-sm lg:block">
            Largest route Rs {formatCurrency(topRoute.outstanding)} across {countriesVisible} countries
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-6 right-6 z-10 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/52 backdrop-blur-sm">
          move cursor to rotate
        </div>
      </div>
    </section>
  );
}
