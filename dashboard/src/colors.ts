// The palette of an Indonesian nautical chart (Pushidrosal, INT 1 symbols):
// white deep water, a blue shallow band, buff land, black ink, and chart
// magenta, which on real charts marks lights, cables and anything a
// navigator must not miss. Here magenta marks what plugs in: electric and
// hybrid hulls, charging stations, ports on the Halmahera Utara supply.
// Ferry routes are dashed, as the chart symbol is; the dash tells the hull type.
export const UI = {
  bg: '#f4f7f8',
  surface: '#ffffff',
  ink: '#0f1417',
  muted: '#52606a',
  faint: '#8d9aa3',
  line: '#d6dee3',
  lineStrong: '#b4c2ca',
  accent: '#b5157a',
  accentSoft: '#f7deec',
  land: '#efdc9c',
  shallow: '#c4e1f0',
  worse: '#9c4410',
} as const;

export const FONT = '"Archivo Variable", "Archivo", "Arial Narrow", system-ui, sans-serif';
/** Numbers use the same family with tabular figures; no mono labels. */
export const MONO = FONT;

export const VESSEL_ORDER = [
  "diesel_old",
  "diesel_new",
  "hybrid",
  "electric",
  "fastcraft",
] as const;

export const VESSEL_COLOR: Record<string, string> = {
  diesel_old: "#8d9aa3",
  diesel_new: "#0f1417",
  hybrid: "#d46aa8",
  electric: "#b5157a",
  fastcraft: "#3b5a6e",
};

// Same set on the map and in 3D
export const VESSEL_COLOR_MAP: Record<string, string> = VESSEL_COLOR;

/** Dash per type, read like the chart's ferry-route symbol; electric is the one solid line. */
export const VESSEL_DASH: Record<string, number[] | null> = {
  diesel_old: [3, 3],
  diesel_new: [8, 4],
  hybrid: [8, 4],
  electric: null,
  fastcraft: [1.5, 3],
};

export const NO_SERVICE_COLOR = "#b4c2ca";
export const CHARGER_COLOR = "#b5157a";

// Sequential ramp for the cost heatmap: chart depth tints, white to deep blue
export const SEQ_BLUE = [
  "#f6fafb",
  "#e3f0f6",
  "#cde4ef",
  "#b2d4e6",
  "#93c1da",
  "#71a9ca",
  "#518fb6",
  "#37739b",
  "#22577c",
];
