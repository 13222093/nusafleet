"""Sanity tests for the ferry MILP (MODEL_SPEC validation section)."""

import pytest

from engine.data.loader import load_inputs
from engine.optimization.pareto import run_pareto_cost_co2
from engine.optimization.solver import solve_plan
from engine.optimization.types import SolveParams
from engine.pipeline import solve_baseline


@pytest.fixture(scope="module")
def inputs():
    return load_inputs()


def test_inputs_load_and_every_assumption_is_traceable(inputs):
    assert 4 <= len(inputs.routes) <= 6
    assert len(inputs.scenarios) == 3
    for assumption in inputs.assumptions.values():
        assert assumption.source or assumption.rationale


def test_cheap_diesel_no_chargers_gives_all_diesel(inputs):
    result = solve_plan(
        inputs,
        inputs.scenario("A_grid"),
        SolveParams(
            carbon_price_rp_per_tco2=0,
            diesel_price_rp_per_l=3000,
            allow_chargers=False,
        ),
    )
    assert result.status == "Optimal"
    assert result.chargers == []
    assert all(not inputs.vessel(r.vessel_type).plugs_in for r in result.fleet_plan)


def test_expensive_diesel_cheap_power_raises_electric_share(inputs):
    scenario = inputs.scenario("C_floating_nuclear")
    base = solve_plan(inputs, scenario)
    shifted = solve_plan(
        inputs,
        scenario,
        SolveParams(
            diesel_price_rp_per_l=40000,
            elec_price_rp_per_kwh=300,
            port_kw_override=20000,
            budget_rp=2e12,
        ),
    )
    assert shifted.status == "Optimal"
    assert shifted.kpis.plug_in_trip_share_pct > base.kpis.plug_in_trip_share_pct
    assert len(shifted.chargers) >= 1


def test_infeasible_demand_names_the_route(inputs):
    result = solve_plan(
        inputs, inputs.scenario("A_grid"), SolveParams(demand_multiplier=100)
    )
    assert result.status == "Infeasible"
    assert "Ternate" in result.message


def test_plan_respects_budget_safety_and_port_power(inputs):
    for scenario in inputs.scenarios:
        result = solve_plan(inputs, scenario)
        assert result.status == "Optimal"
        assert result.kpis.capex_rp <= inputs.a("budget_rp") + 1
        assert result.kpis.avg_safety_score >= inputs.a("min_avg_safety") - 1e-6
        for charger in result.chargers:
            assert charger.kw_used <= charger.kw_available + 1e-6


def test_electric_never_assigned_beyond_battery_range(inputs):
    result = solve_plan(
        inputs,
        inputs.scenario("C_floating_nuclear"),
        SolveParams(objective="co2", port_kw_override=20000, budget_rp=2e12),
    )
    distance = {r.route_id: r.distance_nm for r in inputs.routes}
    for row in result.fleet_plan:
        vessel = inputs.vessel(row.vessel_type)
        if vessel.battery_only:
            assert distance[row.route_id] <= vessel.battery_range_nm


def test_baseline_is_todays_diesel_fleet(inputs):
    baseline = solve_baseline(inputs, inputs.scenario("A_grid"))
    assert baseline.status == "Evaluated"
    assert {r.vessel_type for r in baseline.fleet_plan} == {"diesel_old"}
    assert baseline.kpis.capex_rp == 0


def test_pareto_trades_cost_for_co2(inputs):
    points = run_pareto_cost_co2(inputs, inputs.scenario("C_floating_nuclear"))
    assert len(points) >= 2
    assert points[-1]["co2_t"] < points[0]["co2_t"]
    assert points[-1]["cost_rp"] >= points[0]["cost_rp"]
