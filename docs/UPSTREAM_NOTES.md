# Upstream notes: Kopibara engine

Source: https://github.com/oadultradeepfield/maritime-hackathon-2026 (MIT license), commit `1bf1401`.
The full upstream source is kept untouched in `engine/_legacy/`. Nothing was deleted.
Upstream's dataset is not in their repo and is not used here.

Solver library: PuLP with the bundled CBC solver. We pin `pulp<3` because PuLP 4 changed the API and no longer bundles a solver.

## What upstream does

Picks a set of tankers (one binary variable per vessel) to move a monthly tonnage at minimum cost, with an average safety score floor and one vessel per fuel type. Costs come from AIS movement data (operating mode, load factor, fuel use, CO2eq), then it runs Pareto, sensitivity, Shapley and MCMC analysis.

## Module map

| Upstream module | What it does | In NusaFleet |
| --- | --- | --- |
| `optimization/solver.py` | Binary selection MILP in PuLP | Replaced by `engine/optimization/solver.py`: integer vessels per route, daily trips, charger siting. Same library, same linear form for the average safety floor, same build and extract pattern. |
| `optimization/pareto.py` | Epsilon-constraint sweep over the safety threshold | Adapted in `engine/optimization/pareto.py`: sweep over a CO2 cap, safety sweep kept. |
| `optimization/sensitivity.py` | Re-solve over carbon price x safety grid | Adapted in `engine/optimization/sensitivity.py`: diesel price x electricity tariff, plus carbon sweep. |
| `cost/calculator.py` | Fuel, carbon, ownership (capital recovery factor), risk premium | Capital recovery factor formula reused in `engine/cost/calculator.py`. Tanker price tables dropped. |
| `emissions/calculator.py` | CO2eq with low-load adjustment factors | Replaced by a simple diesel plus grid factor in `engine/emissions/calculator.py`. |
| `fuel/consumption.py` | Fuel from engine power and specific fuel consumption | Replaced by per-trip litres and kWh in `engine/fuel/consumption.py`. |
| `processing/*` | AIS mode classification, activity hours, load factor | Dropped (tanker AIS specific). New `engine/processing/operability.py` computes wave operability. |
| `data/loader.py` | Reads the hackathon CSV and XLSX files | Replaced by `engine/data/loader.py` and pydantic models. |
| `output/exporter.py` | CSV and JSON exporters | Replaced by a small JSON exporter in `engine/output/exporter.py`. |
| `cli/console.py` | Rich console helpers | Reused as-is in `engine/cli/console.py`. |
| `optimization/shapley.py`, `optimization/mcmc.py` | Per-vessel Shapley values, MCMC robustness | Not ported yet (optional in the PRD). Kept in `_legacy` for a later port. |
| `aggregation/vessel.py` | Per-vessel aggregation of movements | Dropped. |
