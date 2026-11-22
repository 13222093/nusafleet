"""NusaFleet API.

GET  /scenarios        list scenarios with their precomputed headline numbers
GET  /scenarios/{id}   full precomputed result for one scenario
POST /solve            solve one scenario live with price and budget overrides
"""

import json
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from engine.data.loader import load_inputs
from engine.data.models import Inputs
from engine.optimization.solver import solve_plan
from engine.optimization.types import SolveParams
from engine.pipeline import compare_to_baseline, solve_baseline


OUTPUTS = Path(__file__).resolve().parent.parent / "outputs"

app = FastAPI(title="NusaFleet API", version="0.1.0")
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


@lru_cache(maxsize=1)
def _inputs() -> Inputs:
    return load_inputs()


def _read(name: str) -> dict:
    path = OUTPUTS / f"{name}.json"
    if not path.exists():
        raise HTTPException(
            status_code=503,
            detail="Precomputed results not found. Run `make demo` first.",
        )
    with path.open(encoding="utf-8") as f:
        return json.load(f)


class SolveRequest(BaseModel):
    scenario_id: str
    diesel_price_rp_per_l: float | None = Field(default=None, gt=0)
    elec_price_rp_per_kwh: float | None = Field(default=None, gt=0)
    carbon_price_rp_per_tco2: float | None = Field(default=None, ge=0)
    budget_rp: float | None = Field(default=None, ge=0)
    min_avg_safety: float | None = Field(default=None, ge=1, le=5)


@app.get("/scenarios")
def list_scenarios() -> dict:
    summary = _read("summary")
    return {"scenarios": summary["scenario_table"]}


@app.get("/scenarios/{scenario_id}")
def get_scenario(scenario_id: str) -> dict:
    if scenario_id not in {s.id for s in _inputs().scenarios}:
        raise HTTPException(status_code=404, detail=f"Unknown scenario: {scenario_id}")
    return _read(scenario_id)


@app.post("/solve")
def solve(request: SolveRequest) -> dict:
    inputs = _inputs()
    try:
        scenario = inputs.scenario(request.scenario_id)
    except KeyError as exc:
        raise HTTPException(
            status_code=404, detail=f"Unknown scenario: {request.scenario_id}"
        ) from exc

    params = SolveParams(**request.model_dump(exclude={"scenario_id"}))
    plan = solve_plan(inputs, scenario, params)
    baseline = solve_baseline(inputs, scenario, params)
    return {
        "scenario_id": scenario.id,
        "status": plan.status,
        "message": plan.message,
        "fleet_plan": [row.model_dump() for row in plan.fleet_plan],
        "chargers": [row.model_dump() for row in plan.chargers],
        "routes": [row.model_dump() for row in plan.routes],
        "kpis": plan.kpis.model_dump(),
        "baseline_comparison": compare_to_baseline(baseline, plan),
    }
