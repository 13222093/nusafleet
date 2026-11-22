export type Lang = "id" | "en";

export interface FleetRow {
  route_id: string;
  route_name: string;
  vessel_type: string;
  count: number;
  daily_trips: number;
  operable_days: number;
}

export interface ChargerRow {
  port_id: string;
  port_name: string;
  kw_used: number;
  kw_available: number;
}

export interface Kpis {
  annual_cost_rp: number;
  capex_rp: number;
  energy_cost_rp: number;
  co2_t: number;
  reliability_pct: number;
  scheduled_trips_per_year: number;
  cancelled_trips_per_year: number;
  avg_safety_score: number;
  fleet_size: number;
  plug_in_trip_share_pct: number;
}

export interface RouteKpi {
  route_id: string;
  route_name: string;
  reliability_pct: number;
  scheduled_trips_per_year: number;
  cancelled_trips_per_year: number;
  unmet_demand_pct: number;
  co2_t: number;
  cost_rp: number;
}

export interface ParetoPoint {
  label: "least_cost" | "balanced" | "lowest_co2" | null;
  cost_rp: number;
  co2_t: number;
  capex_rp: number;
  reliability_pct: number;
  avg_safety_score: number;
  plug_in_trip_share_pct: number;
  fleet_plan: FleetRow[];
  chargers: ChargerRow[];
  routes: RouteKpi[];
}

export interface HeatCell {
  diesel_price_rp_per_l: number;
  elec_price_rp_per_kwh: number;
  feasible: boolean;
  cost_rp: number;
  co2_t: number;
  plug_in_trip_share_pct: number;
}

export interface ScenarioMeta {
  id: string;
  label_en: string;
  label_id: string;
  elec_price_rp_per_kwh: number;
  grid_ef_kgco2_per_kwh: number;
  available_from_year: number;
  rationale: string | null;
  note: string | null;
}

export interface ScenarioResult {
  scenario: ScenarioMeta;
  status: string;
  message: string;
  kpis: Kpis;
  baseline: { message: string; fleet_plan: FleetRow[]; routes: RouteKpi[]; kpis: Kpis };
  pareto: ParetoPoint[];
  sensitivity: {
    diesel_prices: number[];
    elec_prices: number[];
    cells: HeatCell[];
  };
  carbon_sweep: {
    carbon_price_rp_per_tco2: number;
    feasible: boolean;
    cost_rp: number;
    co2_t: number;
    plug_in_trip_share_pct: number;
  }[];
}

export interface Route {
  route_id: string;
  name: string;
  port_a: string;
  port_b: string;
  distance_nm: number;
  daily_pax: number;
  current_vessels: number;
  confidence: string;
  notes: string | null;
}

export interface Port {
  port_id: string;
  name: string;
  lat: number;
  lon: number;
  connected_to_halut_supply: boolean;
  notes: string | null;
}

export interface VesselType {
  type: string;
  label_id: string;
  label_en: string;
  cap_pax: number;
  speed_kn: number;
  fuel_lph: number;
  kwh_per_nm: number;
  battery_range_nm: number | null;
  hs_max_m: number;
  capex_rp: number;
  safety_score: number;
  charge_kw: number;
  turnaround_h: number;
  notes: string | null;
  source: string | null;
}

export interface Assumption {
  value: number;
  unit: string;
  source: string | null;
  rationale: string | null;
  confidence: string;
}

export interface TableNote {
  file: string;
  source: string | null;
  rationale: string | null;
  confidence: string;
}

export interface Summary {
  scenario_ids: string[];
  routes: Route[];
  ports: Port[];
  vessel_types: VesselType[];
  scenarios: ScenarioMeta[];
  assumptions: Record<string, Assumption>;
  tables: Record<string, TableNote>;
  wave_climate_is_placeholder: boolean;
}
