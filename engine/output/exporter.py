"""Write scenario results as JSON (one file per scenario plus a summary)."""

import json
from pathlib import Path


def write_json(payload: dict, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)


def export_outputs(
    scenario_outputs: dict[str, dict], summary: dict, output_dirs: list[Path]
) -> list[Path]:
    """Write <scenario>.json and summary.json into each output directory."""
    written: list[Path] = []
    for out_dir in output_dirs:
        for sid, payload in scenario_outputs.items():
            path = out_dir / f"{sid}.json"
            write_json(payload, path)
            written.append(path)
        path = out_dir / "summary.json"
        write_json(summary, path)
        written.append(path)
    return written
