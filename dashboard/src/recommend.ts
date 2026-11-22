// Saved alternatives and the recommendation rule. The rule is deliberately
// simple and is applied identically to every supply scenario, so the tool
// stays neutral about where the electricity comes from.
import type { FleetRow, Kpis, ParetoPoint, Route, RouteKpi, ScenarioResult } from './types';
import type { Overrides } from './live';

/** A plan the user pinned so it can be compared with others and put in the report. */
export interface Alternative {
  id: string;
  name: string;
  scenarioId: string;
  plan: ParetoPoint;
  /** Today's fleet priced the same way as the plan, for like-for-like deltas. */
  base: Kpis;
  /** Frontier index for a precomputed plan, or the price overrides of a live simulation. */
  index: number | null;
  overrides: Overrides | null;
}

export interface Recommendation {
  index: number;
  point: ParetoPoint;
  /** noRegret: cleanest plan that costs no more than today. cheapest: nothing beats today on cost. */
  rule: 'noRegret' | 'cheapest';
}

/** Rule: the cleanest plan whose annual cost does not exceed today's fleet; otherwise the cheapest plan. */
export function recommend(result: ScenarioResult): Recommendation {
  const todayCost = result.baseline.kpis.annual_cost_rp;
  let best = -1;
  result.pareto.forEach((p, i) => {
    if (p.cost_rp <= todayCost && (best < 0 || p.co2_t < result.pareto[best].co2_t)) best = i;
  });
  if (best >= 0) return { index: best, point: result.pareto[best], rule: 'noRegret' };
  return { index: 0, point: result.pareto[0], rule: 'cheapest' };
}

export function tripsAvoided(plan: ParetoPoint, base: Kpis): number {
  return ((plan.reliability_pct - base.reliability_pct) / 100) * base.scheduled_trips_per_year;
}

export interface RouteChange {
  route: Route;
  from: FleetRow[];
  to: FleetRow[];
  changed: boolean;
  today: RouteKpi | undefined;
  plan: RouteKpi | undefined;
}

/** What happens on each route: today's vessels, the plan's vessels, and whether they differ. */
export function routeChanges(routes: Route[], todayFleet: FleetRow[], todayRoutes: RouteKpi[], plan: ParetoPoint): RouteChange[] {
  const key = (rows: FleetRow[]) =>
    rows
      .map((r) => `${r.vessel_type}:${r.count}:${r.daily_trips}`)
      .sort()
      .join('|');
  return routes.map((route) => {
    const from = todayFleet.filter((r) => r.route_id === route.route_id);
    const to = plan.fleet_plan.filter((r) => r.route_id === route.route_id);
    return {
      route,
      from,
      to,
      changed: key(from) !== key(to),
      today: todayRoutes.find((r) => r.route_id === route.route_id),
      plan: plan.routes.find((r) => r.route_id === route.route_id),
    };
  });
}
