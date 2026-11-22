"""Type definitions for ferry fleet optimization."""

from typing import Literal

from pydantic import BaseModel


class SolveParams(BaseModel):
    """Overrides for one solve. None means: use the value in data/."""

    diesel_price_rp_per_l: float | None = None
    elec_price_rp_per_kwh: float | None = None
    carbon_price_rp_per_tco2: float | None = None
    budget_rp: float | None = None
    min_avg_safety: float | None = None
    service_level: float | None = None
    demand_multiplier: float = 1.0
    allow_chargers: bool = True
    port_kw_override: float | None = None
    allowed_types: list[str] | None = None
    # Fix the fleet to {route_id: {vessel_type: count}} and only evaluate it.
    fixed_fleet: dict[str, dict[str, int]] | None = None
    co2_cap_t: float | None = None
    objective: Literal["cost", "co2"] = "cost"


class FleetRow(BaseModel):
    route_id: str
    route_name: str
    vessel_type: str
    count: int
    daily_trips: int
    operable_days: float


class ChargerRow(BaseModel):
    port_id: str
    port_name: str
    kw_used: float
    kw_available: float


class RouteKpi(BaseModel):
    route_id: str
    route_name: str
    reliability_pct: float
    scheduled_trips_per_year: float
    cancelled_trips_per_year: float
    unmet_demand_pct: float
    co2_t: float
    cost_rp: float


class Kpis(BaseModel):
    annual_cost_rp: float
    capex_rp: float
    capex_annualized_rp: float
    opex_rp: float
    maintenance_rp: float
    energy_cost_rp: float
    carbon_cost_rp: float
    co2_t: float
    diesel_litres: float
    grid_kwh: float
    reliability_pct: float
    scheduled_trips_per_year: float
    cancelled_trips_per_year: float
    avg_safety_score: float
    fleet_size: int
    plug_in_trip_share_pct: float
    unmet_demand_pct: float


class PlanResult(BaseModel):
    """A solved (or evaluated) fleet and charging plan."""

    status: Literal["Optimal", "Infeasible", "Evaluated"]
    message: str
    fleet_plan: list[FleetRow]
    chargers: list[ChargerRow]
    routes: list[RouteKpi]
    kpis: Kpis

    @property
    def feasible(self) -> bool:
        return self.status in ("Optimal", "Evaluated")
