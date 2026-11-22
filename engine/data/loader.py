"""Load and validate the NusaFleet input files in data/."""

from pathlib import Path

import pandas as pd
import yaml

from engine.data.models import (
    Assumption,
    Inputs,
    Port,
    Route,
    Scenario,
    Sweeps,
    TableNote,
    VesselType,
    WaveMonth,
)


DEFAULT_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"


def _read_csv(path: Path) -> list[dict]:
    df = pd.read_csv(path, dtype=str, keep_default_na=False)
    return df.to_dict(orient="records")


def _read_yaml(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_inputs(data_dir: Path | None = None) -> Inputs:
    """Read every input file and return one validated Inputs object."""
    d = data_dir or DEFAULT_DATA_DIR

    scenarios_raw = _read_yaml(d / "scenarios.yaml")
    assumptions_raw = _read_yaml(d / "assumptions.yaml")

    return Inputs(
        routes=[Route(**row) for row in _read_csv(d / "routes.csv")],
        ports=[Port(**row) for row in _read_csv(d / "ports.csv")],
        vessel_types=[VesselType(**row) for row in _read_csv(d / "vessel_types.csv")],
        wave_climate=[WaveMonth(**row) for row in _read_csv(d / "wave_climate.csv")],
        scenarios=[Scenario(id=sid, **body) for sid, body in scenarios_raw.items()],
        assumptions={
            key: Assumption(**body) for key, body in assumptions_raw["values"].items()
        },
        tables={
            key: TableNote(**body) for key, body in assumptions_raw["tables"].items()
        },
        sweeps=Sweeps(**assumptions_raw["sweeps"]),
    )
