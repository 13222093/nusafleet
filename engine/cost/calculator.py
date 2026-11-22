"""Cost components: annualized ownership, maintenance, energy.

The capital recovery factor is the same formula the upstream Kopibara engine
uses in its ownership cost (engine/_legacy/src/cost/calculator.py).
"""

from engine.data.models import VesselType


def capital_recovery_factor(discount_rate: float, life_years: int) -> float:
    """Annual payment per rupiah of capex over the asset life."""
    if discount_rate == 0:
        return 1.0 / life_years
    factor = (1 + discount_rate) ** life_years
    return discount_rate * factor / (factor - 1)


def annual_ownership_cost_rp(vessel: VesselType, discount_rate: float) -> float:
    """Annualized capex of one vessel (zero for the already-owned fleet)."""
    return vessel.capex_rp * capital_recovery_factor(discount_rate, vessel.life_years)


def annual_fixed_cost_rp(vessel: VesselType, discount_rate: float) -> float:
    """Annualized capex plus annual maintenance for one vessel."""
    return annual_ownership_cost_rp(vessel, discount_rate) + vessel.maint_rp_per_year


def trip_energy_cost_rp(
    fuel_litres: float,
    grid_kwh: float,
    diesel_price_rp_per_l: float,
    elec_price_rp_per_kwh: float,
) -> float:
    """Diesel plus electricity cost for one trip."""
    return fuel_litres * diesel_price_rp_per_l + grid_kwh * elec_price_rp_per_kwh
