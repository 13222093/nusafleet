"""Pydantic models for every NusaFleet input file."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


Confidence = Literal["low", "med", "high"]


def _blank_to_none(value: object) -> object:
    if value is None:
        return None
    if isinstance(value, float) and value != value:  # NaN from pandas
        return None
    if isinstance(value, str) and value.strip() == "":
        return None
    return value


class Route(BaseModel):
    route_id: str
    name: str
    port_a: str
    port_b: str
    distance_nm: float = Field(gt=0)
    daily_pax: float = Field(ge=0)
    daily_vehicles: float = Field(ge=0)
    current_vessels: int = Field(ge=0)
    exposure: float = Field(gt=0)
    confidence: Confidence
    notes: str | None = None
    source: str | None = None

    _clean = field_validator("notes", "source", mode="before")(_blank_to_none)


class Port(BaseModel):
    port_id: str
    name: str
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)
    grid_kw_available_A: float = Field(ge=0)
    grid_kw_available_B: float = Field(ge=0)
    grid_kw_available_C: float = Field(ge=0)
    connected_to_halut_supply: bool
    notes: str | None = None
    source: str | None = None

    _clean = field_validator("notes", "source", mode="before")(_blank_to_none)

    def kw_available(self, grid_column: str) -> float:
        return float(getattr(self, f"grid_kw_available_{grid_column}"))


class VesselType(BaseModel):
    type: str
    label_id: str
    label_en: str
    cap_pax: int = Field(gt=0)
    speed_kn: float = Field(gt=0)
    fuel_lph: float = Field(ge=0)
    kwh_per_nm: float = Field(ge=0)
    battery_range_nm: float | None = None
    hs_max_m: float = Field(gt=0)
    capex_rp: float = Field(ge=0)
    life_years: int = Field(gt=0)
    maint_rp_per_year: float = Field(ge=0)
    safety_score: float = Field(ge=1, le=5)
    charge_kw: float = Field(ge=0)
    turnaround_h: float = Field(ge=0)
    notes: str | None = None
    source: str | None = None

    _clean = field_validator("notes", "source", "battery_range_nm", mode="before")(
        _blank_to_none
    )

    @property
    def plugs_in(self) -> bool:
        """True when the vessel takes shore power (hybrid or electric)."""
        return self.kwh_per_nm > 0

    @property
    def battery_only(self) -> bool:
        """True when the vessel has no diesel engine and is range-limited."""
        return self.kwh_per_nm > 0 and self.fuel_lph == 0

    @model_validator(mode="after")
    def _battery_needs_range(self) -> "VesselType":
        if self.battery_only and self.battery_range_nm is None:
            raise ValueError(f"{self.type}: battery vessel needs battery_range_nm")
        if self.plugs_in and self.charge_kw <= 0:
            raise ValueError(f"{self.type}: plug-in vessel needs charge_kw > 0")
        return self


class WaveMonth(BaseModel):
    route_id: str
    month: int = Field(ge=1, le=12)
    hs_mean_m: float = Field(ge=0)
    hs_p90_m: float = Field(ge=0)
    pct_days_hs_above_1_0: float = Field(ge=0, le=100)
    pct_days_hs_above_1_5: float = Field(ge=0, le=100)
    pct_days_hs_above_2_0: float = Field(ge=0, le=100)
    source: str | None = None

    _clean = field_validator("source", mode="before")(_blank_to_none)


class Scenario(BaseModel):
    id: str
    label_en: str
    label_id: str
    grid_column: Literal["A", "B", "C"]
    elec_price_rp_per_kwh: float = Field(gt=0)
    grid_ef_kgco2_per_kwh: float = Field(ge=0)
    available_from_year: int
    source: str | None = None
    rationale: str | None = None
    confidence: Confidence
    note: str | None = None

    @model_validator(mode="after")
    def _traceable(self) -> "Scenario":
        if not self.source and not self.rationale:
            raise ValueError(f"scenario {self.id}: needs a source or a rationale")
        return self


class Assumption(BaseModel):
    value: float
    unit: str
    source: str | None = None
    rationale: str | None = None
    confidence: Confidence

    @model_validator(mode="after")
    def _traceable(self) -> "Assumption":
        if not self.source and not self.rationale:
            raise ValueError("assumption needs a source or a rationale")
        return self


class TableNote(BaseModel):
    file: str
    source: str | None = None
    rationale: str | None = None
    confidence: Confidence

    @model_validator(mode="after")
    def _traceable(self) -> "TableNote":
        if not self.source and not self.rationale:
            raise ValueError(f"table {self.file}: needs a source or a rationale")
        return self


class Sweeps(BaseModel):
    diesel_price_rp_per_l: list[float]
    elec_price_rp_per_kwh: list[float]
    carbon_price_rp_per_tco2: list[float]
    safety_threshold: list[float]
    pareto_points: int = Field(ge=2)


class Inputs(BaseModel):
    """All validated inputs for one solve."""

    routes: list[Route]
    ports: list[Port]
    vessel_types: list[VesselType]
    wave_climate: list[WaveMonth]
    scenarios: list[Scenario]
    assumptions: dict[str, Assumption]
    tables: dict[str, TableNote]
    sweeps: Sweeps

    def a(self, key: str) -> float:
        """Shortcut for an assumption value."""
        return self.assumptions[key].value

    def scenario(self, scenario_id: str) -> Scenario:
        for s in self.scenarios:
            if s.id == scenario_id:
                return s
        raise KeyError(f"unknown scenario: {scenario_id}")

    def port(self, port_id: str) -> Port:
        for p in self.ports:
            if p.port_id == port_id:
                return p
        raise KeyError(f"unknown port: {port_id}")

    def vessel(self, type_id: str) -> VesselType:
        for v in self.vessel_types:
            if v.type == type_id:
                return v
        raise KeyError(f"unknown vessel type: {type_id}")

    @model_validator(mode="after")
    def _cross_checks(self) -> "Inputs":
        port_ids = {p.port_id for p in self.ports}
        for r in self.routes:
            missing = {r.port_a, r.port_b} - port_ids
            if missing:
                raise ValueError(f"route {r.route_id}: unknown port(s) {missing}")
            months = {w.month for w in self.wave_climate if w.route_id == r.route_id}
            if months != set(range(1, 13)):
                raise ValueError(
                    f"route {r.route_id}: wave climate needs all 12 months"
                )
        if "diesel_old" not in {v.type for v in self.vessel_types}:
            raise ValueError("vessel_types must include diesel_old (existing fleet)")
        return self
