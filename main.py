"""NusaFleet demo pipeline.

Solves today's fleet (baseline) plus the three power-supply scenarios and writes
outputs/<scenario>.json and outputs/summary.json. If the dashboard folder
exists, the same files are copied to dashboard/public/data.
"""

import argparse
import sys
from pathlib import Path

from rich.table import Table

from engine.cli.console import (
    console,
    print_info,
    print_phase_header,
    print_success,
    print_title,
    print_warning,
)
from engine.data.loader import load_inputs
from engine.output.exporter import export_outputs
from engine.pipeline import build_summary, run_scenario


ROOT = Path(__file__).resolve().parent


def _bn(rp: float) -> str:
    return f"Rp {rp / 1e9:,.1f} bn"


def _print_plan(out: dict) -> None:
    table = Table(title="Fleet plan (estimate)", show_lines=False)
    table.add_column("Route")
    table.add_column("Vessel type")
    table.add_column("Vessels", justify="right")
    table.add_column("Trips/day", justify="right")
    table.add_column("Operable days", justify="right")
    for row in out["fleet_plan"]:
        table.add_row(
            row["route_name"],
            row["vessel_type"],
            str(row["count"]),
            str(row["daily_trips"]),
            f"{row['operable_days']:.0f}",
        )
    console.print(table)

    k, cmp = out["kpis"], out["baseline_comparison"]
    chargers = ", ".join(c["port_name"] for c in out["chargers"]) or "none"
    print_info(f"Charging ports: {chargers}")
    print_info(
        f"Annual cost {_bn(k['annual_cost_rp'])} | capex {_bn(k['capex_rp'])} | "
        f"CO2 {k['co2_t']:,.0f} t | reliability {k['reliability_pct']:.1f}%"
    )
    print_info(
        f"vs today: energy cost {_bn(-cmp['energy_cost_saving_rp'])} change, "
        f"CO2 {-cmp['co2_saving_t']:,.0f} t change, "
        f"{cmp['cancelled_trips_avoided']:,.0f} cancelled trips avoided per year"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--scenario", help="Solve only this scenario id")
    parser.add_argument(
        "--quick", action="store_true", help="Skip Pareto and sensitivity"
    )
    args = parser.parse_args()

    # Windows consoles default to cp1252, which cannot print the status glyphs
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print_title("NusaFleet: ferry fleet and charging-site planner (North Maluku)")
    print_phase_header(1, "Loading data")
    inputs = load_inputs()
    print_success(
        f"{len(inputs.routes)} routes, {len(inputs.ports)} ports, "
        f"{len(inputs.vessel_types)} vessel types, {len(inputs.scenarios)} scenarios"
    )
    if all(w.source is None for w in inputs.wave_climate):
        print_warning("Wave climate is a seasonal placeholder (estimate).")

    scenarios = [s for s in inputs.scenarios if args.scenario in (None, s.id)]
    if not scenarios:
        raise SystemExit(f"Unknown scenario: {args.scenario}")

    outputs: dict[str, dict] = {}
    for idx, scenario in enumerate(scenarios, start=2):
        print_phase_header(idx, f"Scenario {scenario.id}: {scenario.label_en}")
        out = run_scenario(inputs, scenario, quick=args.quick)
        outputs[scenario.id] = out
        if out["status"] == "Optimal":
            print_success(out["message"])
        else:
            print_warning(f"{out['status']}: {out['message']}")
        _print_plan(out)

    if args.quick or args.scenario:
        return

    print_phase_header(len(scenarios) + 2, "Writing outputs")
    out_dirs = [ROOT / "outputs"]
    if (ROOT / "dashboard").exists():
        out_dirs.append(ROOT / "dashboard" / "public" / "data")
    written = export_outputs(outputs, build_summary(inputs, outputs), out_dirs)
    for path in written:
        print_success(str(path.relative_to(ROOT)))


if __name__ == "__main__":
    main()
