// Scene frame of the 3D twin. Must match scripts/twin/make_dem.py (FRAME) and
// build_twin.py: 1 unit = 1 km, Y up, north towards -Z.
export const FRAME = {
  lonMin: 126.2,
  lonMax: 128.6,
  latMin: 0.35,
  latMax: 2.35,
  lat0: 1.35,
  lon0: 127.4,
} as const;

const KX = 111.32 * Math.cos((FRAME.lat0 * Math.PI) / 180);
const KY = 110.574;

export function toScene(lat: number, lon: number, y = 0): [number, number, number] {
  return [(lon - FRAME.lon0) * KX, y, -(lat - FRAME.lat0) * KY];
}

/** Width and depth of the model in scene units, and its centre. */
export const FRAME_SIZE = {
  w: (FRAME.lonMax - FRAME.lonMin) * KX,
  d: (FRAME.latMax - FRAME.latMin) * KY,
  cx: ((FRAME.lonMin + FRAME.lonMax) / 2 - FRAME.lon0) * KX,
  cz: -((FRAME.latMin + FRAME.latMax) / 2 - FRAME.lat0) * KY,
};

/** Quadratic arc between two ports in lat/lon, the same lanes as the 2D map. */
export function arcLatLon(a: [number, number], b: [number, number], bend: number, steps = 64): [number, number][] {
  const cLat = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend;
  const cLon = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const points: [number, number][] = [];
  for (let i = 0; i <= steps; i += 1) {
    const s = i / steps;
    points.push([
      (1 - s) * (1 - s) * a[0] + 2 * (1 - s) * s * cLat + s * s * b[0],
      (1 - s) * (1 - s) * a[1] + 2 * (1 - s) * s * cLon + s * s * b[1],
    ]);
  }
  return points;
}
