"""Fuel and electricity use per one-way trip, and trips a vessel can make per day."""

import math

from engine.data.models import Route, VesselType


def trip_hours(vessel: VesselType, route: Route) -> float:
    """Underway time for a one-way trip."""
    return route.distance_nm / vessel.speed_kn


def max_daily_trips(
    vessel: VesselType, route: Route, operating_hours_per_day: float
) -> int:
    """One-way trips one vessel can make in a day (sailing plus turnaround)."""
    cycle_h = trip_hours(vessel, route) + vessel.turnaround_h
    return math.floor(operating_hours_per_day / cycle_h)


def trip_fuel_litres(
    vessel: VesselType, route: Route, idle_fuel_fraction: float
) -> float:
    """Diesel burned per one-way trip, including idling during turnaround."""
    underway = vessel.fuel_lph * trip_hours(vessel, route)
    idle = vessel.fuel_lph * idle_fuel_fraction * vessel.turnaround_h
    return underway + idle


def trip_grid_kwh(
    vessel: VesselType, route: Route, charging_efficiency: float
) -> float:
    """Grid electricity drawn per one-way trip (battery energy / charging efficiency)."""
    return vessel.kwh_per_nm * route.distance_nm / charging_efficiency
