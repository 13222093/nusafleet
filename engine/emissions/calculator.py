"""CO2 emissions per trip from diesel and grid electricity."""


def trip_co2_kg(
    fuel_litres: float,
    grid_kwh: float,
    diesel_ef_kgco2_per_l: float,
    grid_ef_kgco2_per_kwh: float,
) -> float:
    """Operational CO2 for one trip: tank-to-wake diesel plus grid electricity."""
    return fuel_litres * diesel_ef_kgco2_per_l + grid_kwh * grid_ef_kgco2_per_kwh
