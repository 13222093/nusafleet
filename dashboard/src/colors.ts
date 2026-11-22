// Categorical colours follow the vessel type, in a fixed order (never by rank).
// Validated for colour-vision deficiency on the light surface; three of them are
// below 3:1 contrast, so every use is paired with a text label or a table.
export const VESSEL_ORDER = [
  "diesel_old",
  "diesel_new",
  "hybrid",
  "electric",
  "fastcraft",
] as const;

export const VESSEL_COLOR: Record<string, string> = {
  diesel_old: "#2a78d6",
  diesel_new: "#eb6834",
  hybrid: "#1baf7a",
  electric: "#eda100",
  fastcraft: "#e87ba4",
};

export const NO_SERVICE_COLOR = "#8a8984";
export const CHARGER_COLOR = "#0ca30c";

// Sequential blue ramp, light to dark, for the cost heatmap.
export const SEQ_BLUE = [
  "#cde2fb",
  "#b7d3f6",
  "#9ec5f4",
  "#86b6ef",
  "#6da7ec",
  "#5598e7",
  "#3987e5",
  "#2a78d6",
  "#256abf",
];
