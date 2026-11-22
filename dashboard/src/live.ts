// Live re-solve through the NusaFleet API (POST /solve), used by the what-if sliders.
import { useEffect, useState } from 'react';

import type { ChargerRow, FleetRow, Kpis, ParetoPoint, RouteKpi } from './types';

export const API_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000';

export interface Overrides {
  diesel?: number;
  elec?: number;
  carbon?: number;
}

export type LiveState = 'off' | 'loading' | 'ready' | 'error';

export interface LiveResult {
  plan: ParetoPoint;
  base: Kpis;
  baseFleet: FleetRow[];
  baseRoutes: RouteKpi[];
}

interface SolveResponse {
  status: string;
  message: string;
  fleet_plan: FleetRow[];
  chargers: ChargerRow[];
  routes: RouteKpi[];
  kpis: Kpis & { capex_rp: number };
  baseline: { fleet_plan: FleetRow[]; routes: RouteKpi[]; kpis: Kpis };
}

export function useLiveSolve(scenarioId: string, overrides: Overrides) {
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [state, setState] = useState<LiveState>('off');
  const [result, setResult] = useState<LiveResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const { diesel, elec, carbon } = overrides;

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => setApiOnline(r.ok))
      .catch(() => setApiOnline(false));
  }, []);

  useEffect(() => {
    const active = diesel !== undefined || elec !== undefined || carbon !== undefined;
    if (!active || !scenarioId) {
      setState('off');
      setResult(null);
      setMessage(null);
      return undefined;
    }
    const controller = new AbortController();
    setState('loading');
    // Wait until the slider settles before asking the solver
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/solve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            scenario_id: scenarioId,
            diesel_price_rp_per_l: diesel ?? null,
            elec_price_rp_per_kwh: elec ?? null,
            carbon_price_rp_per_tco2: carbon ?? null,
          }),
        });
        if (!response.ok) throw new Error(`API ${response.status}`);
        const body = (await response.json()) as SolveResponse;
        setApiOnline(true);
        if (body.status !== 'Optimal') {
          setResult(null);
          setMessage(body.message);
          setState('error');
          return;
        }
        setResult({
          plan: {
            label: null,
            cost_rp: body.kpis.annual_cost_rp,
            co2_t: body.kpis.co2_t,
            capex_rp: body.kpis.capex_rp,
            reliability_pct: body.kpis.reliability_pct,
            avg_safety_score: body.kpis.avg_safety_score,
            plug_in_trip_share_pct: body.kpis.plug_in_trip_share_pct,
            fleet_plan: body.fleet_plan,
            chargers: body.chargers,
            routes: body.routes,
          },
          base: body.baseline.kpis,
          baseFleet: body.baseline.fleet_plan,
          baseRoutes: body.baseline.routes,
        });
        setMessage(null);
        setState('ready');
      } catch (error) {
        if (controller.signal.aborted) return;
        setResult(null);
        setApiOnline(false);
        setMessage(error instanceof Error ? error.message : String(error));
        setState('error');
      }
    }, 350);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [scenarioId, diesel, elec, carbon]);

  return { apiOnline, state, result, message };
}
