"""Sensitivity analysis for the ferry fleet.

Follows the upstream Kopibara pattern (sensitivity.py): re-solve the MILP over a
grid of prices. Upstream used carbon price x safety threshold; here the heatmap
is diesel price x electricity tariff, plus a carbon price sweep.
"""

from engine.data.models import Inputs, Scenario
from engine.optimization.solver import solve_plan
from engine.optimization.types import PlanResult, SolveParams


def _mix_share(result: PlanResult) -> dict[str, float]:
    """Share of daily trips by vessel type."""
    total = sum(row.daily_trips for row in result.fleet_plan)
    shares: dict[str, float] = {}
    for row in result.fleet_plan:
        shares[row.vessel_type] = shares.get(row.vessel_type, 0.0) + (
            100.0 * row.daily_trips / total if total else 0.0
        )
    return shares


def run_price_heatmap(
    inputs: Inputs, scenario: Scenario, base: SolveParams | None = None
) -> dict:
    """Grid over diesel price x electricity tariff."""
    base = base or SolveParams()
    cells: list[dict] = []
    for diesel in inputs.sweeps.diesel_price_rp_per_l:
        for elec in inputs.sweeps.elec_price_rp_per_kwh:
            result = solve_plan(
                inputs,
                scenario,
                base.model_copy(
                    update={
                        "diesel_price_rp_per_l": diesel,
                        "elec_price_rp_per_kwh": elec,
                    }
                ),
            )
            cells.append(
                {
                    "diesel_price_rp_per_l": diesel,
                    "elec_price_rp_per_kwh": elec,
                    "feasible": result.feasible,
                    "cost_rp": result.kpis.annual_cost_rp,
                    "co2_t": result.kpis.co2_t,
                    "plug_in_trip_share_pct": result.kpis.plug_in_trip_share_pct,
                    "mix_share_pct": _mix_share(result),
                }
            )
    return {
        "diesel_prices": inputs.sweeps.diesel_price_rp_per_l,
        "elec_prices": inputs.sweeps.elec_price_rp_per_kwh,
        "cells": cells,
    }


def run_carbon_sweep(
    inputs: Inputs, scenario: Scenario, base: SolveParams | None = None
) -> list[dict]:
    """Re-solve at each carbon price to show how the fleet changes."""
    base = base or SolveParams()
    points: list[dict] = []
    for price in inputs.sweeps.carbon_price_rp_per_tco2:
        result = solve_plan(
            inputs,
            scenario,
            base.model_copy(update={"carbon_price_rp_per_tco2": price}),
        )
        points.append(
            {
                "carbon_price_rp_per_tco2": price,
                "feasible": result.feasible,
                "cost_rp": result.kpis.annual_cost_rp,
                "co2_t": result.kpis.co2_t,
                "plug_in_trip_share_pct": result.kpis.plug_in_trip_share_pct,
                "mix_share_pct": _mix_share(result),
            }
        )
    return points
