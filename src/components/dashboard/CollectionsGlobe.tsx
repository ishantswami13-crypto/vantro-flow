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
  "new_delhi": { lat: 28.6139, lon: 77.209, country: "India" },
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
  "hong_kong": { lat: 22.3193, lon: 114.1694, country: "Hong Kong" },
  sydney: { lat: -33.8688, lon: 151.2093, country: "Australia" },
  "new_york": { lat: 40.7128, lon: -74.006, country: "United States" },
  "san_francisco": { lat: 37.7749, lon: -122.4194, country: "United States" },
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
      missingCity: false,
    };
  }

  const fallback = FALLBACK_COORDINATES[index % FALLBACK_COORDINATES.length];
  return {
    lat: fallback.lat,
    lon: fallback.lon,
    city: route.city ?? "Location pending",
    country: route.country ?? (route.city ? "India" : "Awaiting tag"),
    missingCity: !route.city,
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
    visible: visible > -0.2,
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
  const curveLift = 58;
  const curveX = midX + (vectorX / vectorLength) * 32;
  const curveY = midY + (vectorY / vectorLength) * 22 - curveLift;

  return `M ${start.x} ${start.y} Q ${curveX} ${curveY} ${end.x} ${end.y}`;
}

export default function CollectionsGlobe({ originCity, originCountry, routes, totalOutstanding }: Props) {
  const originMeta =
    LOCATION_COORDINATES[normalizeLocation(originCity) ?? ""] ??
    LOCATION_COORDINATES.delhi;
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
      labelX: destination.x + (labelVectorX / labelLength) * 28 + (labelVectorX >= 0 ? 18 : -18),
      labelY: destination.y + (labelVectorY / labelLength) * 14,
    };
  });

  const visibleRoutes = projectedRoutes.filter((route) => route.destination.visible).slice(0, 5);
  const citiesCovered = new Set(projectedRoutes.map((route) => route.city)).size;
  const countriesCovered = new Set(projectedRoutes.map((route) => route.country)).size;
  const largestRoute = projectedRoutes[0]?.outstanding ?? 0;

  return (
    <section
      className="relative overflow-hidden rounded-[38px] border px-6 py-6 sm:px-8 sm:py-8"
      style={{
        background:
          "radial-gradient(circle at 18% 18%, rgba(10,143,132,0.28), transparent 30%), radial-gradient(circle at 80% 20%, rgba(214,64,69,0.2), transparent 34%), linear-gradient(135deg, #051310 0%, #081d19 24%, #071613 56%, #020807 100%)",
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 28px 60px rgba(2, 8, 7, 0.24)",
      }}
    >
      <div
        className="scan-sheen absolute inset-y-0 left-[-12%] w-[32%] rounded-full blur-2xl"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)" }}
      />
      <div className="pointer-events-none absolute inset-0 opacity-60">
        {[12, 22, 35, 48, 64, 78, 84, 91].map((value, index) => (
          <span
            key={value}
            className="star-twinkle absolute h-1 w-1 rounded-full bg-white"
            style={{
              left: `${value}%`,
              top: `${(index * 11 + 9) % 86}%`,
              animationDelay: `${index * 0.4}s`,
            }}
          />
        ))}
      </div>

      <div className="relative grid gap-8 xl:grid-cols-[minmax(0,0.72fr)_minmax(420px,1.28fr)] xl:items-center">
        <div className="max-w-xl">
          <p className="mb-3 text-[11px] uppercase tracking-[0.24em]" style={{ color: "rgba(248,248,246,0.56)" }}>
            Collections network
          </p>
          <h2
            className="max-w-lg text-4xl font-normal leading-[0.96] sm:text-5xl"
            style={{ fontFamily: "var(--font-heading)", color: "var(--white)" }}
          >
            Money in motion, city by city.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 sm:text-base" style={{ color: "rgba(248,248,246,0.72)" }}>
            A live route view from {originCity ?? "your HQ"}, {originCountry ?? "India"} to every high-value customer account still carrying open exposure.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: "Open routes", value: `${projectedRoutes.length}` },
              { label: "Cities covered", value: `${citiesCovered}` },
              { label: "Largest route", value: formatCurrency(largestRoute) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[20px] border px-4 py-4 backdrop-blur-sm"
                style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
              >
                <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "rgba(248,248,246,0.52)" }}>
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
              Route engine live
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
                  Add customer cities to light up the globe and show where outstanding balances are concentrated.
                </div>
              </div>
            ) : (
              projectedRoutes.map((route) => (
                <div
                  key={route.customerId}
                  className="flex items-center justify-between gap-4 rounded-[22px] border px-4 py-4 backdrop-blur-sm"
                  style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.04)" }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold"
                      style={{ background: `${route.tone}22`, color: route.tone, border: `1px solid ${route.tone}26` }}
                    >
                      {initials(route.customerName)}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold" style={{ color: "var(--white)" }}>
                        {route.customerName}
                      </div>
                      <div className="truncate text-xs" style={{ color: "rgba(248,248,246,0.62)" }}>
                        {route.city} {route.country ? `, ${route.country}` : ""}
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

        <div className="relative min-h-[560px]">
          <div
            className="network-halo absolute inset-[8%] rounded-full blur-2xl"
            style={{
              border: "1px solid rgba(255,255,255,0.08)",
              background: "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.08), rgba(255,255,255,0.01) 56%, transparent 70%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg viewBox="0 0 640 640" className="h-full w-full max-w-[680px]" role="img" aria-label="Collections globe">
              <defs>
                <radialGradient id="globe-core" cx="50%" cy="45%" r="58%">
                  <stop offset="0%" stopColor="rgba(110,231,223,0.32)" />
                  <stop offset="38%" stopColor="rgba(11,64,57,0.94)" />
                  <stop offset="100%" stopColor="rgba(2,8,7,1)" />
                </radialGradient>
                <linearGradient id="globe-rim" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#78FFF2" />
                  <stop offset="42%" stopColor="#2EE8B8" />
                  <stop offset="100%" stopColor="#1A3A33" />
                </linearGradient>
                <clipPath id="globe-clip">
                  <circle cx="320" cy="320" r="214" />
                </clipPath>
                <filter id="route-glow" x="-120%" y="-120%" width="340%" height="340%">
                  <feGaussianBlur stdDeviation="3.4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <circle cx="320" cy="320" r="250" fill="rgba(110,231,223,0.06)" />
              <circle cx="320" cy="320" r="232" fill="rgba(110,231,223,0.08)" />
              <circle cx="320" cy="320" r="214" fill="url(#globe-core)" stroke="url(#globe-rim)" strokeWidth="2.5" />

              <g clipPath="url(#globe-clip)">
                <g className="orbit-spin" opacity="0.36">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <ellipse
                      key={`lat-${index}`}
                      cx="320"
                      cy="320"
                      rx="214"
                      ry={34 + index * 30}
                      fill="none"
                      stroke="rgba(255,255,255,0.16)"
                      strokeWidth="1"
                    />
                  ))}
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <ellipse
                      key={`lon-${index}`}
                      cx="320"
                      cy="320"
                      rx={36 + index * 28}
                      ry="214"
                      fill="none"
                      stroke="rgba(255,255,255,0.14)"
                      strokeWidth="1"
                    />
                  ))}
                </g>

                <g opacity="0.22">
                  <path
                    d="M156 248c22-18 40-28 67-26 23 2 46 13 56 22 10 8 16 22 9 30-6 7-22 10-30 16-12 8-18 17-28 21-24 10-49-6-62-19-18-17-29-34-12-44z"
                    fill="rgba(110,231,223,0.9)"
                  />
                  <path
                    d="M300 180c18-12 36-14 55-9 15 5 34 15 45 29 7 9 8 20 4 28-8 15-29 18-44 24-17 6-31 17-51 14-18-3-33-15-39-28-8-16 1-42 30-58z"
                    fill="rgba(94,234,212,0.75)"
                  />
                  <path
                    d="M290 276c24-10 54-8 73 8 16 13 24 34 25 53 1 23-8 44-20 58-15 17-34 29-56 31-22 2-42-8-56-23-14-15-22-39-18-61 4-24 24-54 52-66z"
                    fill="rgba(52,211,153,0.58)"
                  />
                  <path
                    d="M418 216c21-10 44-11 63-4 25 10 49 31 59 54 7 16 7 33-6 44-14 12-37 12-53 17-17 5-31 18-51 16-23-2-45-20-53-39-8-18 0-54 41-88z"
                    fill="rgba(251,191,36,0.42)"
                  />
                </g>

                {[0, 1, 2, 3, 4].map((index) => (
                  <circle
                    key={`grid-dot-${index}`}
                    cx={188 + index * 74}
                    cy={224 + (index % 2) * 58}
                    r="3"
                    fill="rgba(255,255,255,0.18)"
                  />
                ))}
              </g>

              {visibleRoutes.map((route, index) => (
                <g key={`route-${route.customerId}`}>
                  <defs>
                    <linearGradient id={`route-gradient-${route.customerId}`} x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
                      <stop offset="52%" stopColor={route.tone} />
                      <stop offset="100%" stopColor="rgba(255,255,255,0.18)" />
                    </linearGradient>
                  </defs>
                  <path
                    d={route.path}
                    fill="none"
                    stroke={`url(#route-gradient-${route.customerId})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="10 12"
                    className="route-stream"
                    style={{ animationDelay: `${index * 0.6}s` }}
                    filter="url(#route-glow)"
                    opacity="0.92"
                  />
                  <circle cx={route.destination.x} cy={route.destination.y} r="4.5" fill={route.tone}>
                    <animate attributeName="r" values="4.5;7;4.5" dur="3.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={originProjection.x} cy={originProjection.y} r="5.5" fill="#FFFFFF">
                    <animate attributeName="r" values="5.5;8;5.5" dur="3s" repeatCount="indefinite" />
                  </circle>
                  <circle r="4.5" fill="#FFFFFF" opacity="0.95">
                    <animateMotion dur={`${4.8 + index * 0.7}s`} repeatCount="indefinite" path={route.path} />
                    <animate attributeName="opacity" values="0;1;1;0" dur={`${4.8 + index * 0.7}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              ))}

              <g transform={`translate(${originProjection.x - 78} ${originProjection.y + 24})`}>
                <rect width="156" height="56" rx="18" fill="rgba(2,8,7,0.76)" stroke="rgba(255,255,255,0.14)" />
                <text x="16" y="21" fill="rgba(248,248,246,0.54)" fontSize="10" letterSpacing="2.8">
                  ORIGIN
                </text>
                <text x="16" y="38" fill="#FFFFFF" fontSize="15" fontWeight="600">
                  {originCity ?? "HQ"} {originCountry ? `, ${originCountry}` : ""}
                </text>
              </g>

              {visibleRoutes.map((route) => (
                <g key={`label-${route.customerId}`} transform={`translate(${route.labelX - 74} ${route.labelY - 28})`}>
                  <rect width="148" height="58" rx="18" fill="rgba(2,8,7,0.84)" stroke={`${route.tone}33`} />
                  <text x="14" y="19" fill="rgba(248,248,246,0.52)" fontSize="9" letterSpacing="2.4">
                    CUSTOMER
                  </text>
                  <text x="14" y="35" fill="#FFFFFF" fontSize="13.5" fontWeight="600">
                    {route.customerName.length > 16 ? `${route.customerName.slice(0, 16)}...` : route.customerName}
                  </text>
                  <text x="14" y="50" fill="rgba(248,248,246,0.62)" fontSize="10.5">
                    {route.city}
                    {route.country ? `, ${route.country}` : ""}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
}
