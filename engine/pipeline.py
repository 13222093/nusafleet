"""Scenario runner: baseline, recommended plan and the analysis layer."""

from engine.data.models import Inputs, Scenario
from engine.optimization.pareto import run_pareto_cost_co2, run_pareto_cost_safety
from engine.optimization.sensitivity import run_carbon_sweep, run_price_heatmap
from engine.optimization.solver import solve_plan
from engine.optimization.types import PlanResult, SolveParams


def baseline_params(inputs: Inputs) -> SolveParams:
    """Today's fleet: the existing diesel ferries on each route, nothing new."""
    return SolveParams(
        allowed_types=["diesel_old"],
        allow_chargers=False,
        fixed_fleet={
            r.route_id: {"diesel_old": r.current_vessels} for r in inputs.routes
        },
    )


def solve_baseline(
    inputs: Inputs, scenario: Scenario, overrides: SolveParams | None = None
) -> PlanResult:
    params = baseline_params(inputs)
    if overrides is not None:
        params = params.model_copy(
            update={
                "diesel_price_rp_per_l": overrides.diesel_price_rp_per_l,
                "carbon_price_rp_per_tco2": overrides.carbon_price_rp_per_tco2,
                "demand_multiplier": overrides.demand_multiplier,
                "service_level": overrides.service_level,
            }
        )
    return solve_plan(inputs, scenario, params)


def compare_to_baseline(baseline: PlanResult, plan: PlanResult) -> dict:
    """Headline deltas: recommended plan vs today's fleet."""
    b, p = baseline.kpis, plan.kpis
    reliability_gain = p.reliability_pct - b.reliability_pct
    return {
        "baseline": b.model_dump(),
        "recommended": p.model_dump(),
        "annual_cost_change_rp": p.annual_cost_rp - b.annual_cost_rp,
        "energy_cost_saving_rp": b.energy_cost_rp - p.energy_cost_rp,
        "co2_saving_t": b.co2_t - p.co2_t,
        "co2_saving_pct": 100.0 * (b.co2_t - p.co2_t) / b.co2_t if b.co2_t else 0.0,
        "reliability_gain_pct_points": reliability_gain,
        # Applied to today's schedule so the two fleets are compared like for like
        "cancelled_trips_avoided": reliability_gain
        / 100.0
        * b.scheduled_trips_per_year,
        "cancelled_trips_reduction_pct": (
            100.0 * (1 - (100.0 - p.reliability_pct) / (100.0 - b.reliability_pct))
            if b.reliability_pct < 100.0
            else 0.0
        ),
        "charger_count": len(plan.chargers),
    }


def run_scenario(inputs: Inputs, scenario: Scenario, quick: bool = False) -> dict:
    """Everything the dashboard needs for one supply scenario."""
    plan = solve_plan(inputs, scenario)
    baseline = solve_baseline(inputs, scenario)

    out: dict = {
        "scenario": scenario.model_dump(),
        "status": plan.status,
        "message": plan.message,
        "fleet_plan": [row.model_dump() for row in plan.fleet_plan],
        "chargers": [row.model_dump() for row in plan.chargers],
        "routes": [row.model_dump() for row in plan.routes],
        "kpis": plan.kpis.model_dump(),
        "baseline": {
            "message": baseline.message,
            "fleet_plan": [row.model_dump() for row in baseline.fleet_plan],
            "routes": [row.model_dump() for row in baseline.routes],
            "kpis": baseline.kpis.model_dump(),
        },
        "baseline_comparison": compare_to_baseline(baseline, plan),
    }
    if not quick:
        out["pareto"] = run_pareto_cost_co2(inputs, scenario)
        out["pareto_safety"] = run_pareto_cost_safety(inputs, scenario)
        out["sensitivity"] = run_price_heatmap(inputs, scenario)
        out["carbon_sweep"] = run_carbon_sweep(inputs, scenario)
    return out


def build_summary(inputs: Inputs, scenario_outputs: dict[str, dict]) -> dict:
    """Cross-scenario summary plus the reference data shown in the dashboard."""
    table = []
    for sid, out in scenario_outputs.items():
        cmp = out["baseline_comparison"]
        lowest = out.get("pareto", [])[-1] if out.get("pareto") else None
        table.append(
            {
                "scenario_id": sid,
                "label_en": out["scenario"]["label_en"],
                "label_id": out["scenario"]["label_id"],
                "available_from_year": out["scenario"]["available_from_year"],
                "status": out["status"],
                "annual_cost_rp": out["kpis"]["annual_cost_rp"],
                "capex_rp": out["kpis"]["capex_rp"],
                "co2_t": out["kpis"]["co2_t"],
                "reliability_pct": out["kpis"]["reliability_pct"],
                "plug_in_trip_share_pct": out["kpis"]["plug_in_trip_share_pct"],
                "charger_count": cmp["charger_count"],
                "co2_saving_t": cmp["co2_saving_t"],
                "energy_cost_saving_rp": cmp["energy_cost_saving_rp"],
                "cancelled_trips_avoided": cmp["cancelled_trips_avoided"],
                "lowest_co2_t": lowest["co2_t"] if lowest else None,
                "lowest_co2_cost_rp": lowest["cost_rp"] if lowest else None,
            }
        )
    return {
        "scenario_ids": list(scenario_outputs.keys()),
        "scenario_table": table,
        "routes": [r.model_dump() for r in inputs.routes],
        "ports": [p.model_dump() for p in inputs.ports],
        "vessel_types": [v.model_dump() for v in inputs.vessel_types],
        "scenarios": [s.model_dump() for s in inputs.scenarios],
        "assumptions": {k: a.model_dump() for k, a in inputs.assumptions.items()},
        "tables": {k: t.model_dump() for k, t in inputs.tables.items()},
        "wave_climate_is_placeholder": all(
            w.source is None for w in inputs.wave_climate
        ),
    }
