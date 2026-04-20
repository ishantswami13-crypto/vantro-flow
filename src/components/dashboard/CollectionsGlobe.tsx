"use client";

import Link from "next/link";

interface NetworkRoute {
  customerId: number;
  customerName: string;
  city: string | null;
  country: string | null;
  outstanding: number;
  invoiceCount: number;
}

interface Props {
  originCity: string | null;
  originCountry: string | null;
  routes: NetworkRoute[];
  totalOutstanding: number;
}

const LOCATION_COORDINATES: Record<string, { lat: number; lon: number; country: string }> = {
  delhi: { lat: 28.6139, lon: 77.209, country: "India" },
  new_delhi: { lat: 28.6139, lon: 77.209, country: "India" },
  mumbai: { lat: 19.076, lon: 72.8777, country: "India" },
  bangalore: { lat: 12.9716, lon: 77.5946, country: "India" },
  bengaluru: { lat: 12.9716, lon: 77.5946, country: "India" },
  chennai: { lat: 13.0827, lon: 80.2707, country: "India" },
  hyderabad: { lat: 17.385, lon: 78.4867, country: "India" },
  pune: { lat: 18.5204, lon: 73.8567, country: "India" },
  kolkata: { lat: 22.5726, lon: 88.3639, country: "India" },
  ahmedabad: { lat: 23.0225, lon: 72.5714, country: "India" },
  surat: { lat: 21.1702, lon: 72.8311, country: "India" },
  jaipur: { lat: 26.9124, lon: 75.7873, country: "India" },
  dubai: { lat: 25.2048, lon: 55.2708, country: "United Arab Emirates" },
  singapore: { lat: 1.3521, lon: 103.8198, country: "Singapore" },
  london: { lat: 51.5072, lon: -0.1276, country: "United Kingdom" },
  paris: { lat: 48.8566, lon: 2.3522, country: "France" },
  berlin: { lat: 52.52, lon: 13.405, country: "Germany" },
  tokyo: { lat: 35.6762, lon: 139.6503, country: "Japan" },
  hong_kong: { lat: 22.3193, lon: 114.1694, country: "Hong Kong" },
  sydney: { lat: -33.8688, lon: 151.2093, country: "Australia" },
  new_york: { lat: 40.7128, lon: -74.006, country: "United States" },
  san_francisco: { lat: 37.7749, lon: -122.4194, country: "United States" },
  toronto: { lat: 43.6532, lon: -79.3832, country: "Canada" },
};

const ROUTE_COLORS = ["#6EE7DF", "#5EEAD4", "#34D399", "#FBBF24", "#FB7185", "#A78BFA"];
const FALLBACK_COORDINATES = [
  { lat: 24, lon: 64 },
  { lat: 8, lon: 93 },
  { lat: 35, lon: 102 },
  { lat: 41, lon: 24 },
  { lat: -10, lon: 118 },
  { lat: 46, lon: -12 },
];

function normalizeLocation(value: string | null | undefined) {
  return value
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function formatCurrency(value: number) {
  return `Rs ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value || 0)}`;
}

function initials(value: string) {
  return value
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function resolveRouteLocation(route: NetworkRoute, index: number) {
  const normalizedCity = normalizeLocation(route.city);

  if (normalizedCity && LOCATION_COORDINATES[normalizedCity]) {
    return {
      ...LOCATION_COORDINATES[normalizedCity],
      city: route.city,
      country: route.country ?? LOCATION_COORDINATES[normalizedCity].country,
    };
  }

  const fallback = FALLBACK_COORDINATES[index % FALLBACK_COORDINATES.length];
  return {
    lat: fallback.lat,
    lon: fallback.lon,
    city: route.city ?? "Location pending",
    country: route.country ?? (route.city ? "India" : "Awaiting tag"),
  };
}

function projectToGlobe(lat: number, lon: number, radius = 214, centerLon = 68, centerLat = 18) {
  const lambda = ((lon - centerLon) * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const phi0 = (centerLat * Math.PI) / 180;
  const visible = Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(lambda);
  const x = radius * Math.cos(phi) * Math.sin(lambda);
  const y = radius * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(lambda));

  return {
    x: 320 + x,
    y: 320 - y,
    visible: visible > -0.24,
  };
}

function createRoutePath(start: { x: number; y: number }, end: { x: number; y: number }) {
  const centerX = 320;
  const centerY = 320;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;
  const vectorX = midX - centerX;
  const vectorY = midY - centerY;
  const vectorLength = Math.max(Math.hypot(vectorX, vectorY), 1);
  const curveLift = 70;
  const curveX = midX + (vectorX / vectorLength) * 36;
  const curveY = midY + (vectorY / vectorLength) * 24 - curveLift;

  return `M ${start.x} ${start.y} Q ${curveX} ${curveY} ${end.x} ${end.y}`;
}

export default function CollectionsGlobe({ originCity, originCountry, routes, totalOutstanding }: Props) {
  const originMeta = LOCATION_COORDINATES[normalizeLocation(originCity) ?? ""] ?? LOCATION_COORDINATES.delhi;
  const originProjection = projectToGlobe(originMeta.lat, originMeta.lon);

  const projectedRoutes = routes.map((route, index) => {
    const location = resolveRouteLocation(route, index);
    const destination = projectToGlobe(location.lat, location.lon);
    const labelVectorX = destination.x - 320;
    const labelVectorY = destination.y - 320;
    const labelLength = Math.max(Math.hypot(labelVectorX, labelVectorY), 1);

    return {
      ...route,
      ...location,
      destination,
      path: createRoutePath(originProjection, destination),
      tone: ROUTE_COLORS[index % ROUTE_COLORS.length],
      labelX: destination.x + (labelVectorX / labelLength) * 30 + (labelVectorX >= 0 ? 22 : -22),
      labelY: destination.y + (labelVectorY / labelLength) * 18,
    };
  });

  const visibleRoutes = projectedRoutes.filter((route) => route.destination.visible).slice(0, 5);
  const citiesCovered = new Set(projectedRoutes.map((route) => route.city)).size;
  const countriesCovered = new Set(projectedRoutes.map((route) => route.country)).size;
  const largestRoute = projectedRoutes[0]?.outstanding ?? 0;

  return (
    <section
      className="relative overflow-hidden rounded-[42px] border px-6 py-7 sm:px-8 sm:py-9"
      style={{
        background:
          "radial-gradient(circle at 14% 18%, rgba(84,255,228,0.24), transparent 28%), radial-gradient(circle at 88% 16%, rgba(252,116,152,0.18), transparent 26%), radial-gradient(circle at 56% 84%, rgba(94,234,212,0.14), transparent 24%), linear-gradient(140deg, #040B0A 0%, #071614 26%, #081B18 48%, #06110F 68%, #030807 100%)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 32px 80px rgba(2,8,7,0.34)",
      }}
    >
      <div className="scan-sheen absolute inset-y-0 left-[-12%] w-[34%] rounded-full blur-3xl" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }} />
      <div className="blob-fog-a absolute left-[-10%] top-[6%] h-[220px] w-[340px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(94,234,212,0.22), transparent 68%)" }} />
      <div className="blob-fog-b absolute right-[-8%] top-[14%] h-[260px] w-[360px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(255,143,173,0.16), transparent 70%)" }} />
      <div className="blob-fog-c absolute bottom-[-6%] left-[30%] h-[220px] w-[420px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(84,255,228,0.16), transparent 72%)" }} />
      <div className="pointer-events-none absolute inset-0 opacity-60">
        {[12, 22, 35, 48, 64, 78, 84, 91, 28, 58, 72].map((value, index) => (
          <span
            key={`${value}-${index}`}
            className="star-twinkle absolute h-1 w-1 rounded-full bg-white"
            style={{
              left: `${value}%`,
              top: `${(index * 9 + 11) % 88}%`,
              animationDelay: `${index * 0.36}s`,
            }}
          />
        ))}
      </div>

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,0.68fr)_minmax(460px,1.32fr)] xl:items-center">
        <div className="max-w-xl">
          <p className="mb-3 text-[11px] uppercase tracking-[0.24em]" style={{ color: "rgba(248,248,246,0.52)" }}>
            Collections network
          </p>
          <h2 className="max-w-lg text-4xl font-normal leading-[0.94] sm:text-5xl" style={{ fontFamily: "var(--font-heading)", color: "var(--white)" }}>
            A living route field for every unpaid account.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 sm:text-base" style={{ color: "rgba(248,248,246,0.72)" }}>
            The route core now behaves like a luminous object instead of a flat chart, while still showing the customer, city, and country behind each flow.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Open routes", value: `${projectedRoutes.length}` },
              { label: "Cities covered", value: `${citiesCovered}` },
              { label: "Largest route", value: formatCurrency(largestRoute) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[20px] border px-4 py-4 backdrop-blur-md"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
              >
                <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "rgba(248,248,246,0.48)" }}>
                  {item.label}
                </div>
                <div className="mt-2 text-lg font-semibold tracking-[-0.04em]" style={{ color: "var(--white)" }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs" style={{ color: "rgba(248,248,246,0.72)" }}>
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: "rgba(110,231,223,0.24)", background: "rgba(110,231,223,0.08)" }}>
              <span className="live-dot h-2 w-2 rounded-full bg-[#6EE7DF]" />
              Flow engine live
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
              {countriesCovered} countries visible
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5" style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}>
              {formatCurrency(totalOutstanding)} at risk
            </span>
          </div>

          <div className="mt-8 space-y-3">
            {projectedRoutes.length === 0 ? (
              <div
                className="rounded-[24px] border px-5 py-5"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
              >
                <div className="text-sm font-semibold" style={{ color: "var(--white)" }}>
                  No route data yet
                </div>
                <div className="mt-2 text-sm leading-6" style={{ color: "rgba(248,248,246,0.68)" }}>
                  Add customer cities to light up the route field and place real destinations on the globe.
                </div>
              </div>
            ) : (
              projectedRoutes.map((route) => (
                <div
                  key={route.customerId}
                  className="rounded-[24px] border px-4 py-4 backdrop-blur-md"
                  style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                        style={{ background: `${route.tone}20`, color: route.tone, border: `1px solid ${route.tone}26` }}
                      >
                        {initials(route.customerName)}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold" style={{ color: "var(--white)" }}>
                          {route.customerName}
                        </div>
                        <div className="truncate text-xs" style={{ color: "rgba(248,248,246,0.62)" }}>
                          {route.city}
                          {route.country ? `, ${route.country}` : ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: "var(--white)" }}>
                        {formatCurrency(route.outstanding)}
                      </div>
                      <div className="text-[11px]" style={{ color: "rgba(248,248,246,0.52)" }}>
                        {route.invoiceCount} invoice{route.invoiceCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 h-[2px] overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <div className="route-swell h-full rounded-full" style={{ width: `${Math.min((route.outstanding / Math.max(totalOutstanding, 1)) * 240, 100)}%`, background: `linear-gradient(90deg, ${route.tone}, rgba(255,255,255,0.5))` }} />
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <Link href="/customers" className="apple-button px-5 py-3 text-sm font-semibold" style={{ background: "var(--white)", color: "var(--ink)" }}>
              Open customer ledger
            </Link>
            <Link
              href="/analytics"
              className="apple-button px-5 py-3 text-sm font-semibold"
              style={{ background: "rgba(255,255,255,0.06)", color: "var(--white)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              View analytics
            </Link>
          </div>
        </div>

        <div className="relative min-h-[620px]">
          <div className="network-halo absolute inset-[7%] rounded-full blur-3xl" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.08), rgba(255,255,255,0.01) 56%, transparent 70%)" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 640 640" className="h-full w-full max-w-[690px]" role="img" aria-label="Collections globe">
              <defs>
                <radialGradient id="globe-core" cx="50%" cy="42%" r="62%">
                  <stop offset="0%" stopColor="rgba(114,255,235,0.34)" />
                  <stop offset="22%" stopColor="rgba(31,117,102,0.92)" />
                  <stop offset="58%" stopColor="rgba(8,31,28,0.98)" />
                  <stop offset="100%" stopColor="rgba(2,8,7,1)" />
                </radialGradient>
                <radialGradient id="globe-shine" cx="34%" cy="26%" r="56%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
                  <stop offset="26%" stopColor="rgba(136,255,236,0.18)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </radialGradient>
                <linearGradient id="globe-rim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#AAFFF5" />
                  <stop offset="38%" stopColor="#45F0D0" />
                  <stop offset="84%" stopColor="#18463E" />
                  <stop offset="100%" stopColor="#0B1917" />
                </linearGradient>
                <linearGradient id="route-white" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
                  <stop offset="48%" stopColor="rgba(255,255,255,0.68)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
                </linearGradient>
                <linearGradient id="cloud-band" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="18%" stopColor="rgba(196,255,247,0.08)" />
                  <stop offset="48%" stopColor="rgba(255,255,255,0.26)" />
                  <stop offset="72%" stopColor="rgba(196,255,247,0.12)" />
                  <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                </linearGradient>
                <clipPath id="globe-clip">
                  <circle cx="320" cy="320" r="214" />
                </clipPath>
                <filter id="route-glow" x="-140%" y="-140%" width="380%" height="380%">
                  <feGaussianBlur stdDeviation="4.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="soft-blur" x="-120%" y="-120%" width="340%" height="340%">
                  <feGaussianBlur stdDeviation="20" />
                </filter>
                <filter id="cloud-distort" x="-140%" y="-140%" width="380%" height="380%">
                  <feTurbulence type="fractalNoise" baseFrequency="0.012 0.026" numOctaves="2" seed="7" result="noise">
                    <animate attributeName="baseFrequency" values="0.012 0.026;0.015 0.02;0.012 0.026" dur="22s" repeatCount="indefinite" />
                  </feTurbulence>
                  <feDisplacementMap in="SourceGraphic" in2="noise" scale="20" xChannelSelector="R" yChannelSelector="G" />
                  <feGaussianBlur stdDeviation="10" />
                </filter>
              </defs>

              <g className="blob-shell">
                <circle cx="320" cy="320" r="276" fill="rgba(110,231,223,0.04)" />
                <circle cx="320" cy="320" r="246" fill="rgba(110,231,223,0.06)" />
                <circle cx="320" cy="320" r="228" fill="rgba(255,255,255,0.03)" />
                <circle cx="320" cy="320" r="214" fill="url(#globe-core)" stroke="url(#globe-rim)" strokeWidth="2.8" />
                <circle cx="320" cy="320" r="214" fill="url(#globe-shine)" opacity="0.68" />
              </g>

              <g clipPath="url(#globe-clip)">
                <g opacity="0.24">
                  <path
                    d="M146 248c20-24 46-36 73-38 27-2 48 10 60 22 12 12 15 28 6 39-8 10-25 13-40 18-18 6-29 17-44 23-26 9-56 3-75-11-23-16-37-37-25-53 9-12 22-20 45-30z"
                    fill="rgba(110,231,223,0.95)"
                  />
                  <path
                    d="M282 176c24-16 51-22 73-17 20 4 42 18 57 35 10 12 14 28 6 40-9 15-30 18-49 24-21 7-38 18-60 16-23-2-44-15-53-31-11-20-5-50 26-67z"
                    fill="rgba(94,234,212,0.74)"
                  />
                  <path
                    d="M288 284c25-11 56-9 78 6 23 14 38 42 38 69 1 26-12 53-31 70-20 18-47 28-73 25-27-3-48-16-64-37-15-20-18-47-11-71 8-28 29-51 63-62z"
                    fill="rgba(52,211,153,0.56)"
                  />
                  <path
                    d="M420 214c24-12 53-14 79-5 24 9 46 30 58 53 9 18 9 37-5 49-15 13-39 14-59 20-18 5-34 18-57 16-25-3-48-19-57-42-11-25 2-60 41-91z"
                    fill="rgba(251,191,36,0.38)"
                  />
                </g>

                <g className="orbit-spin" opacity="0.18">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <ellipse
                      key={`lat-${index}`}
                      cx="320"
                      cy="320"
                      rx="214"
                      ry={38 + index * 28}
                      fill="none"
                      stroke="rgba(255,255,255,0.18)"
                      strokeWidth="1"
                    />
                  ))}
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <ellipse
                      key={`lon-${index}`}
                      cx="320"
                      cy="320"
                      rx={32 + index * 30}
                      ry="214"
                      fill="none"
                      stroke="rgba(255,255,255,0.14)"
                      strokeWidth="1"
                    />
                  ))}
                </g>

                <g filter="url(#soft-blur)" opacity="0.24">
                  <ellipse cx="278" cy="226" rx="132" ry="54" fill="rgba(255,255,255,0.18)">
                    <animateTransform attributeName="transform" type="translate" values="-16 2;18 -12;-16 2" dur="19s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="376" cy="274" rx="114" ry="42" fill="rgba(123,255,240,0.14)">
                    <animateTransform attributeName="transform" type="translate" values="10 -4;-14 10;10 -4" dur="23s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="322" cy="410" rx="154" ry="68" fill="rgba(255,255,255,0.1)">
                    <animateTransform attributeName="transform" type="translate" values="-12 0;16 -8;-12 0" dur="20s" repeatCount="indefinite" />
                  </ellipse>
                </g>

                <g filter="url(#cloud-distort)" opacity="0.52">
                  <ellipse cx="326" cy="250" rx="184" ry="42" fill="url(#cloud-band)">
                    <animateTransform attributeName="transform" type="translate" values="-10 0;18 -8;-10 0" dur="18s" repeatCount="indefinite" />
                  </ellipse>
                  <ellipse cx="300" cy="356" rx="168" ry="38" fill="url(#cloud-band)">
                    <animateTransform attributeName="transform" type="translate" values="12 -4;-16 10;12 -4" dur="21s" repeatCount="indefinite" />
                  </ellipse>
                </g>

                <g filter="url(#soft-blur)" opacity="0.72">
                  <ellipse cx="248" cy="200" rx="84" ry="52" fill="rgba(255,255,255,0.16)" />
                  <ellipse cx="374" cy="438" rx="112" ry="58" fill="rgba(95,240,208,0.12)" />
                </g>
              </g>

              <ellipse cx="320" cy="522" rx="168" ry="38" fill="rgba(0,0,0,0.38)" filter="url(#soft-blur)" />

              {visibleRoutes.map((route, index) => (
                <g key={`route-${route.customerId}`}>
                  <defs>
                    <linearGradient id={`route-gradient-${route.customerId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.06)" />
                      <stop offset="24%" stopColor={route.tone} />
                      <stop offset="52%" stopColor="#FFFFFF" />
                      <stop offset="78%" stopColor={route.tone} />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.06)" />
                    </linearGradient>
                  </defs>
                  <path
                    d={route.path}
                    fill="none"
                    stroke={route.tone}
                    strokeOpacity="0.24"
                    strokeWidth="7"
                    strokeLinecap="round"
                    filter="url(#route-glow)"
                  />
                  <path
                    d={route.path}
                    fill="none"
                    stroke={`url(#route-gradient-${route.customerId})`}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeDasharray="12 18"
                    className="route-stream"
                    style={{ animationDelay: `${index * 0.45}s` }}
                  />
                  <path d={route.path} fill="none" stroke="url(#route-white)" strokeWidth="0.9" strokeLinecap="round" opacity="0.46" />

                  <circle cx={route.destination.x} cy={route.destination.y} r="5.5" fill={route.tone} filter="url(#route-glow)">
                    <animate attributeName="r" values="5.5;8.5;5.5" dur="3.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={route.destination.x} cy={route.destination.y} r="13" fill="none" stroke={route.tone} strokeOpacity="0.26">
                    <animate attributeName="r" values="8;18;8" dur="3.8s" repeatCount="indefinite" />
                    <animate attributeName="stroke-opacity" values="0.38;0.08;0.38" dur="3.8s" repeatCount="indefinite" />
                  </circle>

                  <circle r="5" fill="#FFFFFF" opacity="0.95">
                    <animateMotion dur={`${5.2 + index * 0.6}s`} repeatCount="indefinite" path={route.path} rotate="auto" />
                    <animate attributeName="opacity" values="0;1;1;0" dur={`${5.2 + index * 0.6}s`} repeatCount="indefinite" />
                  </circle>
                  <circle r="3.2" fill={route.tone} opacity="0.88">
                    <animateMotion dur={`${4.4 + index * 0.5}s`} repeatCount="indefinite" path={route.path} rotate="auto" />
                    <animate attributeName="opacity" values="0;0.88;0.88;0" dur={`${4.4 + index * 0.5}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              ))}

              <g transform={`translate(${originProjection.x - 82} ${originProjection.y + 28})`} className="globe-label-float">
                <rect width="164" height="60" rx="20" fill="rgba(2,8,7,0.8)" stroke="rgba(255,255,255,0.16)" />
                <text x="16" y="21" fill="rgba(248,248,246,0.5)" fontSize="10" letterSpacing="2.6">
                  ORIGIN
                </text>
                <text x="16" y="40" fill="#FFFFFF" fontSize="15" fontWeight="600">
                  {originCity ?? "HQ"} {originCountry ? `, ${originCountry}` : ""}
                </text>
              </g>

              {visibleRoutes.map((route, index) => (
                <g
                  key={`label-${route.customerId}`}
                  transform={`translate(${route.labelX - 78} ${route.labelY - 30})`}
                  className="globe-label-float"
                  style={{ animationDelay: `${index * 0.3}s` }}
                >
                  <rect width="156" height="62" rx="20" fill="rgba(2,8,7,0.84)" stroke={`${route.tone}36`} />
                  <text x="14" y="19" fill="rgba(248,248,246,0.46)" fontSize="9" letterSpacing="2.2">
                    CUSTOMER
                  </text>
                  <text x="14" y="36" fill="#FFFFFF" fontSize="13.4" fontWeight="600">
                    {route.customerName.length > 16 ? `${route.customerName.slice(0, 16)}...` : route.customerName}
                  </text>
                  <text x="14" y="52" fill="rgba(248,248,246,0.64)" fontSize="10.4">
                    {route.city}
                    {route.country ? `, ${route.country}` : ""}
                  </text>
                </g>
              ))}

              <g transform="translate(228 76)">
                <rect width="184" height="72" rx="22" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.1)" />
                <text x="18" y="24" fill="rgba(248,248,246,0.52)" fontSize="10" letterSpacing="2.8">
                  ACTIVE EXPOSURE
                </text>
                <text x="18" y="48" fill="#FFFFFF" fontSize="26" fontWeight="600">
                  {formatCurrency(totalOutstanding)}
                </text>
                <text x="18" y="64" fill="rgba(248,248,246,0.56)" fontSize="10.6">
                  flowing across {citiesCovered} city nodes
                </text>
              </g>
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
