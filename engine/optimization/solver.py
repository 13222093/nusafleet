"""MILP solver for ferry fleet and charging-site selection.

Use solve_plan() as the entry point. This replaces the upstream Kopibara
optimize_fleet() (binary pick of tankers) with integer vessel counts per route,
daily trip counts, and charger siting. The solver library (PuLP + CBC), the
average-safety constraint form and the result-extraction pattern follow upstream.
"""

from dataclasses import dataclass

import pulp

from engine.constants import DAYS_PER_YEAR, RP_PER_BN, UNMET_DEMAND_PENALTY_BN
from engine.cost.calculator import (
    annual_fixed_cost_rp,
    annual_ownership_cost_rp,
    capital_recovery_factor,
    trip_energy_cost_rp,
)
from engine.data.models import Inputs, Route, Scenario, VesselType
from engine.emissions.calculator import trip_co2_kg
from engine.fuel.consumption import max_daily_trips, trip_fuel_litres, trip_grid_kwh
from engine.optimization.types import (
    ChargerRow,
    FleetRow,
    Kpis,
    PlanResult,
    RouteKpi,
    SolveParams,
)
from engine.processing.operability import operable_days


@dataclass(frozen=True)
class Pair:
    """Pre-computed coefficients for one (vessel type, route) pair."""

    vessel: VesselType
    route: Route
    opdays: float
    trips_max: int
    fuel_l_per_trip: float
    kwh_per_trip: float
    # Number of route endpoints that need a charger: 0, 1 or 2.
    chargers_needed: int


@dataclass(frozen=True)
class Resolved:
    """Parameters after applying overrides on top of data/."""

    p_diesel: float
    p_elec: float
    p_carbon: float
    ef_diesel: float
    ef_grid: float
    discount_rate: float
    budget_rp: float
    min_avg_safety: float
    service_level: float
    load_factor: float
    min_daily_trips: int
    max_count: int
    charger_capex_rp: float
    charger_annual_rp: float


def resolve_params(inputs: Inputs, scenario: Scenario, params: SolveParams) -> Resolved:
    def pick(override: float | None, key: str) -> float:
        return override if override is not None else inputs.a(key)

    discount_rate = inputs.a("discount_rate")
    charger_capex = inputs.a("charger_capex_rp")
    return Resolved(
        p_diesel=pick(params.diesel_price_rp_per_l, "diesel_price_rp_per_l"),
        p_elec=(
            params.elec_price_rp_per_kwh
            if params.elec_price_rp_per_kwh is not None
            else scenario.elec_price_rp_per_kwh
        ),
        p_carbon=pick(params.carbon_price_rp_per_tco2, "carbon_price_rp_per_tco2"),
        ef_diesel=inputs.a("diesel_ef_kgco2_per_l"),
        ef_grid=scenario.grid_ef_kgco2_per_kwh,
        discount_rate=discount_rate,
        budget_rp=pick(params.budget_rp, "budget_rp"),
        min_avg_safety=pick(params.min_avg_safety, "min_avg_safety"),
        service_level=pick(params.service_level, "service_level"),
        load_factor=inputs.a("load_factor"),
        min_daily_trips=int(inputs.a("min_daily_trips")),
        max_count=int(inputs.a("max_vessels_per_type_route")),
        charger_capex_rp=charger_capex,
        charger_annual_rp=charger_capex
        * capital_recovery_factor(discount_rate, int(inputs.a("charger_life_years"))),
    )


def _chargers_needed(vessel: VesselType, route: Route) -> int | None:
    """Endpoints that need a charger, or None if the vessel cannot do the route."""
    if not vessel.plugs_in:
        return 0
    if not vessel.battery_only:
        return 1  # plug-in hybrid: charge at one end, diesel covers the rest
    assert vessel.battery_range_nm is not None
    if route.distance_nm > vessel.battery_range_nm:
        return None
    if 2 * route.distance_nm <= vessel.battery_range_nm:
        return 1  # a round trip fits in one charge
    return 2


def build_pairs(inputs: Inputs, params: SolveParams) -> list[Pair]:
    """All feasible (vessel type, route) pairs with their coefficients."""
    pairs: list[Pair] = []
    for route in inputs.routes:
        waves = [w for w in inputs.wave_climate if w.route_id == route.route_id]
        for vessel in inputs.vessel_types:
            if (
                params.allowed_types is not None
                and vessel.type not in params.allowed_types
            ):
                continue
            needed = _chargers_needed(vessel, route)
            if needed is None:
                continue
            if needed > 0 and not params.allow_chargers:
                continue
            trips_max = max_daily_trips(
                vessel, route, inputs.a("operating_hours_per_day")
            )
            opdays = operable_days(waves, vessel.hs_max_m)
            if trips_max < 1 or opdays <= 0:
                continue
            pairs.append(
                Pair(
                    vessel=vessel,
                    route=route,
                    opdays=opdays,
                    trips_max=trips_max,
                    fuel_l_per_trip=trip_fuel_litres(
                        vessel, route, inputs.a("idle_fuel_fraction")
                    ),
                    kwh_per_trip=trip_grid_kwh(
                        vessel, route, inputs.a("charging_efficiency")
                    ),
                    chargers_needed=needed,
                )
            )
    return pairs


def _annual_demand(route: Route, rp: Resolved, params: SolveParams) -> float:
    return route.daily_pax * params.demand_multiplier * DAYS_PER_YEAR * rp.service_level


def solve_plan(
    inputs: Inputs, scenario: Scenario, params: SolveParams | None = None
) -> PlanResult:
    """Solve the fleet and charging plan for one supply scenario."""
    params = params or SolveParams()
    rp = resolve_params(inputs, scenario, params)
    pairs = build_pairs(inputs, params)
    evaluating = params.fixed_fleet is not None

    prob = pulp.LpProblem("Ferry_Fleet_Renewal", pulp.LpMinimize)

    def key(p: Pair) -> tuple[str, str]:
        return (p.vessel.type, p.route.route_id)

    x = {
        key(p): pulp.LpVariable(
            f"x_{p.vessel.type}_{p.route.route_id}",
            lowBound=0,
            upBound=rp.max_count,
            cat=pulp.LpInteger,
        )
        for p in pairs
    }
    n = {
        key(p): pulp.LpVariable(
            f"n_{p.vessel.type}_{p.route.route_id}", lowBound=0, cat=pulp.LpInteger
        )
        for p in pairs
    }
    y = {
        port.port_id: pulp.LpVariable(f"y_{port.port_id}", cat=pulp.LpBinary)
        for port in inputs.ports
    }
    # c[v, r, port]: vessels of type v on route r that charge at this port
    c: dict[tuple[str, str, str], pulp.LpVariable] = {}
    for p in pairs:
        if p.chargers_needed > 0:
            for port_id in (p.route.port_a, p.route.port_b):
                c[(*key(p), port_id)] = pulp.LpVariable(
                    f"c_{p.vessel.type}_{p.route.route_id}_{port_id}",
                    lowBound=0,
                    upBound=rp.max_count,
                    cat=pulp.LpInteger,
                )
    # u[r]: share of required demand left unserved (only for diagnosis)
    u = {
        r.route_id: pulp.LpVariable(f"u_{r.route_id}", lowBound=0, upBound=1)
        for r in inputs.routes
    }

    # Per-unit coefficients
    fixed_bn = {
        key(p): annual_fixed_cost_rp(p.vessel, rp.discount_rate) / RP_PER_BN
        for p in pairs
    }
    co2_t_per_daily_trip = {
        key(p): p.opdays
        * trip_co2_kg(p.fuel_l_per_trip, p.kwh_per_trip, rp.ef_diesel, rp.ef_grid)
        / 1000.0
        for p in pairs
    }
    var_bn = {
        key(p): (
            p.opdays
            * trip_energy_cost_rp(
                p.fuel_l_per_trip, p.kwh_per_trip, rp.p_diesel, rp.p_elec
            )
            + rp.p_carbon * co2_t_per_daily_trip[key(p)]
        )
        / RP_PER_BN
        for p in pairs
    }

    cost_expr = (
        pulp.lpSum(fixed_bn[k] * x[k] for k in x)
        + pulp.lpSum(var_bn[k] * n[k] for k in n)
        + pulp.lpSum((rp.charger_annual_rp / RP_PER_BN) * y[pid] for pid in y)
    )
    co2_expr = pulp.lpSum(co2_t_per_daily_trip[k] * n[k] for k in n)
    penalty = UNMET_DEMAND_PENALTY_BN * pulp.lpSum(u.values())

    if params.objective == "co2":
        prob += co2_expr + 1e-3 * cost_expr + penalty
    else:
        prob += cost_expr + penalty

    for p in pairs:
        prob += n[key(p)] <= p.trips_max * x[key(p)], f"trips_{'_'.join(key(p))}"

    for route in inputs.routes:
        rid = route.route_id
        route_pairs = [p for p in pairs if p.route.route_id == rid]
        demand = _annual_demand(route, rp, params)
        # 1. Demand (wave operability enters through operable days)
        prob += (
            pulp.lpSum(
                n[key(p)] * p.vessel.cap_pax * rp.load_factor * p.opdays
                for p in route_pairs
            )
            + u[rid] * demand
            >= demand,
            f"demand_{rid}",
        )
        if route_pairs and not evaluating:
            prob += (
                pulp.lpSum(n[key(p)] for p in route_pairs) >= rp.min_daily_trips,
                f"min_service_{rid}",
            )

    # 3. Charging: plug-in vessels need a charger at one or both endpoints
    for p in pairs:
        if p.chargers_needed == 0:
            continue
        ca = c[(*key(p), p.route.port_a)]
        cb = c[(*key(p), p.route.port_b)]
        tag = "_".join(key(p))
        if p.chargers_needed == 1:
            prob += ca + cb >= x[key(p)], f"charge_one_{tag}"
        else:
            prob += ca >= x[key(p)], f"charge_a_{tag}"
            prob += cb >= x[key(p)], f"charge_b_{tag}"
    for (vtype, rid, pid), var in c.items():
        prob += var <= rp.max_count * y[pid], f"site_{vtype}_{rid}_{pid}"

    # 4. Port power
    kw_avail: dict[str, float] = {}
    for port in inputs.ports:
        kw = (
            params.port_kw_override
            if params.port_kw_override is not None
            else port.kw_available(scenario.grid_column)
        )
        kw_avail[port.port_id] = kw
        users = [(k, var) for k, var in c.items() if k[2] == port.port_id]
        if users:
            prob += (
                pulp.lpSum(inputs.vessel(k[0]).charge_kw * var for k, var in users)
                <= kw,
                f"port_power_{port.port_id}",
            )
        if not params.allow_chargers or not users:
            prob += y[port.port_id] == 0, f"no_charger_{port.port_id}"

    if evaluating:
        assert params.fixed_fleet is not None
        for k, var in x.items():
            vtype, rid = k
            count = params.fixed_fleet.get(rid, {}).get(vtype, 0)
            prob += var == count, f"fixed_{vtype}_{rid}"
    else:
        # 5. Budget for new vessels and chargers
        prob += (
            pulp.lpSum((p.vessel.capex_rp / RP_PER_BN) * x[key(p)] for p in pairs)
            + pulp.lpSum((rp.charger_capex_rp / RP_PER_BN) * y[pid] for pid in y)
            <= rp.budget_rp / RP_PER_BN,
            "budget",
        )
        # 6. Existing fleet
        n_existing = sum(r.current_vessels for r in inputs.routes)
        old = [x[k] for k in x if k[0] == "diesel_old"]
        if old:
            prob += pulp.lpSum(old) <= n_existing, "existing_fleet"
        # 7. Safety floor (same linear form as upstream min_avg_safety)
        prob += (
            pulp.lpSum(
                (p.vessel.safety_score - rp.min_avg_safety) * x[key(p)] for p in pairs
            )
            >= 0,
            "min_avg_safety",
        )

    if params.co2_cap_t is not None:
        prob += co2_expr <= params.co2_cap_t, "co2_cap"

    prob.solve(pulp.PULP_CBC_CMD(msg=0))

    return _extract_result(
        prob, inputs, rp, params, pairs, x, n, y, c, u, kw_avail, evaluating
    )


def _round(var: pulp.LpVariable) -> int:
    return round(var.varValue or 0)


def _extract_result(
    prob: pulp.LpProblem,
    inputs: Inputs,
    rp: Resolved,
    params: SolveParams,
    pairs: list[Pair],
    x: dict,
    n: dict,
    y: dict,
    c: dict,
    u: dict,
    kw_avail: dict[str, float],
    evaluating: bool,
) -> PlanResult:
    """Turn the solved MILP into fleet rows, charger rows and KPIs."""
    solver_status = pulp.LpStatus[prob.status]
    unmet = {rid: max(0.0, var.varValue or 0.0) for rid, var in u.items()}
    short_routes = {rid: s for rid, s in unmet.items() if s > 1e-6}

    fleet: list[FleetRow] = []
    route_kpis: list[RouteKpi] = []
    totals = {
        "ownership": 0.0,
        "maint": 0.0,
        "energy": 0.0,
        "co2": 0.0,
        "litres": 0.0,
        "kwh": 0.0,
        "capex": 0.0,
        "sched": 0.0,
        "cancelled": 0.0,
        "plug_trips": 0.0,
        "trips": 0.0,
        "safety_sum": 0.0,
        "vessels": 0,
    }

    for route in inputs.routes:
        r_cost = r_co2 = r_sched = r_cancel = 0.0
        for p in pairs:
            if p.route.route_id != route.route_id:
                continue
            k = (p.vessel.type, p.route.route_id)
            count, trips = _round(x[k]), _round(n[k])
            if count == 0:
                continue
            fleet.append(
                FleetRow(
                    route_id=route.route_id,
                    route_name=route.name,
                    vessel_type=p.vessel.type,
                    count=count,
                    daily_trips=trips,
                    operable_days=round(p.opdays, 1),
                )
            )
            ownership = count * annual_ownership_cost_rp(p.vessel, rp.discount_rate)
            maint = count * p.vessel.maint_rp_per_year
            litres = trips * p.opdays * p.fuel_l_per_trip
            kwh = trips * p.opdays * p.kwh_per_trip
            energy = litres * rp.p_diesel + kwh * rp.p_elec
            co2 = (litres * rp.ef_diesel + kwh * rp.ef_grid) / 1000.0
            sched = trips * DAYS_PER_YEAR
            cancelled = trips * (DAYS_PER_YEAR - p.opdays)

            totals["ownership"] += ownership
            totals["maint"] += maint
            totals["energy"] += energy
            totals["co2"] += co2
            totals["litres"] += litres
            totals["kwh"] += kwh
            totals["capex"] += count * p.vessel.capex_rp
            totals["sched"] += sched
            totals["cancelled"] += cancelled
            totals["trips"] += trips
            totals["plug_trips"] += trips if p.vessel.plugs_in else 0
            totals["safety_sum"] += count * p.vessel.safety_score
            totals["vessels"] += count
            r_cost += ownership + maint + energy + rp.p_carbon * co2
            r_co2 += co2
            r_sched += sched
            r_cancel += cancelled
        route_kpis.append(
            RouteKpi(
                route_id=route.route_id,
                route_name=route.name,
                reliability_pct=(
                    100.0 * (1 - r_cancel / r_sched) if r_sched > 0 else 0.0
                ),
                scheduled_trips_per_year=r_sched,
                cancelled_trips_per_year=r_cancel,
                unmet_demand_pct=100.0 * unmet[route.route_id],
                co2_t=r_co2,
                cost_rp=r_cost,
            )
        )

    chargers: list[ChargerRow] = []
    for port in inputs.ports:
        if _round(y[port.port_id]) != 1:
            continue
        kw_used = sum(
            inputs.vessel(k[0]).charge_kw * _round(var)
            for k, var in c.items()
            if k[2] == port.port_id
        )
        if kw_used <= 0:
            continue
        chargers.append(
            ChargerRow(
                port_id=port.port_id,
                port_name=port.name,
                kw_used=kw_used,
                kw_available=kw_avail[port.port_id],
            )
        )

    charger_capex = len(chargers) * rp.charger_capex_rp
    charger_annual = len(chargers) * rp.charger_annual_rp
    carbon_cost = rp.p_carbon * totals["co2"]
    capex_annualized = totals["ownership"] + charger_annual
    opex = totals["maint"] + totals["energy"]
    total_demand = sum(_annual_demand(r, rp, params) for r in inputs.routes)
    unmet_total = sum(
        unmet[r.route_id] * _annual_demand(r, rp, params) for r in inputs.routes
    )

    kpis = Kpis(
        annual_cost_rp=capex_annualized + opex + carbon_cost,
        capex_rp=totals["capex"] + charger_capex,
        capex_annualized_rp=capex_annualized,
        opex_rp=opex,
        maintenance_rp=totals["maint"],
        energy_cost_rp=totals["energy"],
        carbon_cost_rp=carbon_cost,
        co2_t=totals["co2"],
        diesel_litres=totals["litres"],
        grid_kwh=totals["kwh"],
        reliability_pct=(
            100.0 * (1 - totals["cancelled"] / totals["sched"])
            if totals["sched"] > 0
            else 0.0
        ),
        scheduled_trips_per_year=totals["sched"],
        cancelled_trips_per_year=totals["cancelled"],
        avg_safety_score=(
            totals["safety_sum"] / totals["vessels"] if totals["vessels"] else 0.0
        ),
        fleet_size=int(totals["vessels"]),
        plug_in_trip_share_pct=(
            100.0 * totals["plug_trips"] / totals["trips"] if totals["trips"] else 0.0
        ),
        unmet_demand_pct=100.0 * unmet_total / total_demand if total_demand else 0.0,
    )

    names = {r.route_id: r.name for r in inputs.routes}
    if solver_status != "Optimal":
        status, message = "Infeasible", f"Solver status: {solver_status}."
        if params.co2_cap_t is not None:
            message += " The CO2 cap cannot be met."
    elif short_routes:
        detail = ", ".join(
            f"{names[rid]} ({100 * s:.0f}% short)" for rid, s in short_routes.items()
        )
        message = f"Demand cannot be met on: {detail}."
        status = "Evaluated" if evaluating else "Infeasible"
    else:
        status = "Evaluated" if evaluating else "Optimal"
        message = "All route demand is met."

    return PlanResult(
        status=status,
        message=message,
        fleet_plan=fleet,
        chargers=chargers,
        routes=route_kpis,
        kpis=kpis,
    )
