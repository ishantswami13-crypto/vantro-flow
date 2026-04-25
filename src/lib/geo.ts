export type Coordinates = {
  lat: number;
  lon: number;
};

export type ResolvedGeoPoint = Coordinates & {
  city: string;
  country: string;
};

const CITY_POINTS: Record<string, ResolvedGeoPoint> = {
  delhi: { city: "Delhi", country: "India", lat: 28.6139, lon: 77.209 },
  delhi_ncr: { city: "Delhi NCR", country: "India", lat: 28.6139, lon: 77.209 },
  new_delhi: { city: "New Delhi", country: "India", lat: 28.6139, lon: 77.209 },
  gurgaon: { city: "Gurgaon", country: "India", lat: 28.4595, lon: 77.0266 },
  gurugram: { city: "Gurugram", country: "India", lat: 28.4595, lon: 77.0266 },
  noida: { city: "Noida", country: "India", lat: 28.5355, lon: 77.391 },
  mumbai: { city: "Mumbai", country: "India", lat: 19.076, lon: 72.8777 },
  pune: { city: "Pune", country: "India", lat: 18.5204, lon: 73.8567 },
  bangalore: { city: "Bangalore", country: "India", lat: 12.9716, lon: 77.5946 },
  bengaluru: { city: "Bengaluru", country: "India", lat: 12.9716, lon: 77.5946 },
  chennai: { city: "Chennai", country: "India", lat: 13.0827, lon: 80.2707 },
  hyderabad: { city: "Hyderabad", country: "India", lat: 17.385, lon: 78.4867 },
  kolkata: { city: "Kolkata", country: "India", lat: 22.5726, lon: 88.3639 },
  ahmedabad: { city: "Ahmedabad", country: "India", lat: 23.0225, lon: 72.5714 },
  jaipur: { city: "Jaipur", country: "India", lat: 26.9124, lon: 75.7873 },
  surat: { city: "Surat", country: "India", lat: 21.1702, lon: 72.8311 },
  dubai: { city: "Dubai", country: "United Arab Emirates", lat: 25.2048, lon: 55.2708 },
  singapore: { city: "Singapore", country: "Singapore", lat: 1.3521, lon: 103.8198 },
  london: { city: "London", country: "United Kingdom", lat: 51.5072, lon: -0.1276 },
  paris: { city: "Paris", country: "France", lat: 48.8566, lon: 2.3522 },
  berlin: { city: "Berlin", country: "Germany", lat: 52.52, lon: 13.405 },
  tokyo: { city: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503 },
  hong_kong: { city: "Hong Kong", country: "Hong Kong", lat: 22.3193, lon: 114.1694 },
  sydney: { city: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093 },
  melbourne: { city: "Melbourne", country: "Australia", lat: -37.8136, lon: 144.9631 },
  new_york: { city: "New York", country: "United States", lat: 40.7128, lon: -74.006 },
  san_francisco: { city: "San Francisco", country: "United States", lat: 37.7749, lon: -122.4194 },
  toronto: { city: "Toronto", country: "Canada", lat: 43.6532, lon: -79.3832 },
  johannesburg: { city: "Johannesburg", country: "South Africa", lat: -26.2041, lon: 28.0473 },
  nairobi: { city: "Nairobi", country: "Kenya", lat: -1.2921, lon: 36.8219 },
};

const COUNTRY_POINTS: Record<string, Coordinates> = {
  india: { lat: 20.5937, lon: 78.9629 },
  united_arab_emirates: { lat: 23.4241, lon: 53.8478 },
  singapore: { lat: 1.3521, lon: 103.8198 },
  united_kingdom: { lat: 55.3781, lon: -3.436 },
  france: { lat: 46.2276, lon: 2.2137 },
  germany: { lat: 51.1657, lon: 10.4515 },
  japan: { lat: 36.2048, lon: 138.2529 },
  hong_kong: { lat: 22.3193, lon: 114.1694 },
  australia: { lat: -25.2744, lon: 133.7751 },
  united_states: { lat: 39.8283, lon: -98.5795 },
  canada: { lat: 56.1304, lon: -106.3468 },
  south_africa: { lat: -30.5595, lon: 22.9375 },
  kenya: { lat: -0.0236, lon: 37.9062 },
};

const DEFAULT_ROUTE_POINTS: ResolvedGeoPoint[] = [
  CITY_POINTS.delhi,
  CITY_POINTS.mumbai,
  CITY_POINTS.dubai,
  CITY_POINTS.singapore,
  CITY_POINTS.london,
  CITY_POINTS.tokyo,
];

function titleCase(value: string) {
  return value
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function looseMatch(input: string, key: string) {
  const compactInput = input.replace(/_/g, "");
  const compactKey = key.replace(/_/g, "");

  return (
    input === key ||
    input.includes(key) ||
    key.includes(input) ||
    compactInput.includes(compactKey) ||
    compactKey.includes(compactInput)
  );
}

export function normalizeGeoKey(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_") ?? "";
}

export function getFallbackGeoPoint(index = 0): ResolvedGeoPoint {
  const fallback = DEFAULT_ROUTE_POINTS[index % DEFAULT_ROUTE_POINTS.length];
  return { ...fallback };
}

export function lookupGeoPoint(city: string | null | undefined, country?: string | null): ResolvedGeoPoint | null {
  const normalizedCity = normalizeGeoKey(city);

  if (normalizedCity) {
    const exact = CITY_POINTS[normalizedCity];
    if (exact) {
      return {
        ...exact,
        city: city?.trim() || exact.city,
      };
    }

    const partialMatch = Object.entries(CITY_POINTS).find(([key]) => looseMatch(normalizedCity, key));
    if (partialMatch) {
      const [, point] = partialMatch;
      return {
        ...point,
        city: city?.trim() || point.city,
      };
    }
  }

  const normalizedCountry = normalizeGeoKey(country);
  if (normalizedCountry) {
    const countryPoint = COUNTRY_POINTS[normalizedCountry];
    if (countryPoint) {
      return {
        ...countryPoint,
        city: city?.trim() || titleCase(normalizedCountry),
        country: country?.trim() || titleCase(normalizedCountry),
      };
    }
  }

  return null;
}

export function resolveCountryFromCity(city: string | null | undefined, fallbackCountry?: string | null) {
  const resolved = lookupGeoPoint(city, fallbackCountry);
  if (resolved) {
    return resolved.country;
  }

  if (fallbackCountry?.trim()) {
    return fallbackCountry.trim();
  }

  return null;
}
