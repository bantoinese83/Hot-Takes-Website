export type ApproxCoords = {
  lat: number;
  lng: number;
};

const TIMEOUT_MS = 3500;

/** City-level approximate coords for waitlist map (no precise GPS prompt). */
export async function fetchApproximateCoords(): Promise<ApproxCoords | null> {
  const fromGeoJs = await tryGeoJson('https://get.geojs.io/v1/ip/geo.json', (j) => {
    const lat = Number(j.latitude);
    const lng = Number(j.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  });
  if (fromGeoJs) return fromGeoJs;

  return tryGeoJson('https://ipapi.co/json/', (j) => {
    const lat = Number(j.latitude);
    const lng = Number(j.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  });
}

async function tryGeoJson<T>(
  url: string,
  parse: (data: Record<string, unknown>) => T | null,
): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, { signal: controller.signal });
    window.clearTimeout(timer);
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return parse(data);
  } catch {
    return null;
  }
}
