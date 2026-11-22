"""Pareto frontier analysis for the ferry fleet.

Same epsilon-constraint method as upstream Kopibara (pareto.py). Upstream swept
the safety threshold; here the main sweep is a cap on total CO2, and the safety
sweep is kept as a second frontier.
"""

from engine.data.models import Inputs, Scenario
from engine.optimization.solver import solve_plan
from engine.optimization.types import PlanResult, SolveParams


def _point(result: PlanResult, **extra: float | str | None) -> dict:
    return {
        **extra,
        "cost_rp": result.kpis.annual_cost_rp,
        "co2_t": result.kpis.co2_t,
        "capex_rp": result.kpis.capex_rp,
        "reliability_pct": result.kpis.reliability_pct,
        "avg_safety_score": result.kpis.avg_safety_score,
        "plug_in_trip_share_pct": result.kpis.plug_in_trip_share_pct,
        "fleet_plan": [row.model_dump() for row in result.fleet_plan],
        "chargers": [row.model_dump() for row in result.chargers],
        "routes": [row.model_dump() for row in result.routes],
    }


def run_pareto_cost_co2(
    inputs: Inputs,
    scenario: Scenario,
    base: SolveParams | None = None,
    n_points: int | None = None,
) -> list[dict]:
    """Cost vs CO2 frontier: minimize cost under a tightening CO2 cap."""
    base = base or SolveParams()
    n_points = n_points or inputs.sweeps.pareto_points

    cheapest = solve_plan(inputs, scenario, base)
    if not cheapest.feasible:
        return []
    cleanest = solve_plan(
        inputs, scenario, base.model_copy(update={"objective": "co2"})
    )
    co2_hi, co2_lo = cheapest.kpis.co2_t, cleanest.kpis.co2_t

    points = [_point(cheapest, co2_cap_t=None, label="least_cost")]
    if not cleanest.feasible or co2_hi - co2_lo < 1.0:
        return points

    for i in range(1, n_points):
        cap = co2_hi - (co2_hi - co2_lo) * i / (n_points - 1)
        # Small tolerance so the cleanest plan itself stays feasible
        result = solve_plan(
            inputs, scenario, base.model_copy(update={"co2_cap_t": cap + 0.5})
        )
        if not result.feasible:
            continue
        last = points[-1]
        same = (
            abs(result.kpis.co2_t - last["co2_t"]) < 0.5
            and abs(result.kpis.annual_cost_rp - last["cost_rp"]) < 1e6
        )
        if not same:
            points.append(_point(result, co2_cap_t=cap, label=None))

    points[-1]["label"] = "lowest_co2"
    if len(points) >= 3:
        points[len(points) // 2]["label"] = "balanced"
    return points


def run_pareto_cost_safety(
    inputs: Inputs,
    scenario: Scenario,
    base: SolveParams | None = None,
) -> list[dict]:
    """Cost vs safety frontier: minimize cost at each average-safety floor."""
    base = base or SolveParams()
    points: list[dict] = []
    for threshold in inputs.sweeps.safety_threshold:
        result = solve_plan(
            inputs, scenario, base.model_copy(update={"min_avg_safety": threshold})
        )
        points.append(
            {
                "safety_threshold": threshold,
                "feasible": result.feasible,
                "cost_rp": result.kpis.annual_cost_rp if result.feasible else None,
                "co2_t": result.kpis.co2_t if result.feasible else None,
                "avg_safety_score": (
                    result.kpis.avg_safety_score if result.feasible else None
                ),
            }
        )
    return points
