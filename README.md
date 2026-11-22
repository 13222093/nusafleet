# NusaFleet

Fleet and charging-site planner for inter-island ferries in North Maluku (Maluku Utara), Indonesia.

For a set of routes, vessel types and candidate charging ports, NusaFleet chooses how many vessels of each type run on each route and which ports get chargers, at the lowest annual cost, subject to passenger demand, battery range, wave limits, port power, budget and a fleet safety floor. It compares three power-supply scenarios with the same numbers: the PLN grid as it is, the grid plus port solar, and a floating power unit supply for Halmahera Utara. The tool is supply-neutral.

All results are scenario estimates. Most inputs are documented assumptions, listed in `data/assumptions.yaml` and logged in `DATA_LOG.md`.

## Quick start

Needs Python 3.12+, [uv](https://docs.astral.sh/uv/) and Node 20+ (for the dashboard).

```bash
uv sync
uv run python main.py          # same as: make demo
```

This solves today's fleet plus the three scenarios and writes `outputs/<scenario>.json` and `outputs/summary.json` (also copied to `dashboard/public/data/`).

| Task | With make | Without make (Windows) |
| --- | --- | --- |
| Solve everything | `make demo` | `uv run python main.py` |
| Print one plan | `make run` | `uv run python main.py --scenario A_grid --quick` |
| Lint and tests | `make check` | `uv run ruff check .` then `uv run pytest -q` |
| API | `make api` | `uv run uvicorn api.main:app --port 8000` |
| Dashboard | `make dashboard` | `cd dashboard`, `npm install`, `npm run dev` |

The dashboard reads the precomputed JSON, so it works as a static site. The "What if prices change?" sliders are the exception: they call `POST /solve`, so the API must be running (default `http://localhost:8000`, or set `VITE_API_URL` when building the dashboard). Without the API those sliders are disabled and everything else still works.

## What is inside

```
data/         routes, ports, vessel types, wave climate, scenarios, assumptions
engine/       the optimization engine (see below)
  _legacy/    untouched upstream Kopibara source, for reference
api/          FastAPI: GET /scenarios, GET /scenarios/{id}, POST /solve
dashboard/    React + Vite + TypeScript + Material UI dashboard (built on the Kopibara dashboard)
scripts/      fetch_waves.py (wave climate from Copernicus, or a placeholder)
tests/        model sanity tests and API tests
```

## The model in short

- Decision variables: vessels of each type per route, daily trips per type per route, a charger at each port (yes or no).
- Objective: annualized capex + maintenance + diesel and electricity + carbon cost.
- Constraints: annual demand on days the sea state allows sailing, battery range, chargers at one or both route ends for plug-in vessels, port power per scenario, capital budget, size of the existing fleet, average safety score.
- Analysis: cost vs CO2 Pareto frontier (epsilon-constraint), cost vs safety, diesel price x electricity tariff heatmap, carbon price sweep, comparison with today's fleet.

## Limits

- Demand, distances, vessel parameters, grid capacity and prices are estimates until replaced by sourced figures.
- The wave climate is a seasonal placeholder until `scripts/fetch_waves.py` is run with Copernicus Marine credentials.
- Vessel types are parameterized archetypes, not designs. Vehicles are not modeled yet, only passengers.
- Single period: no phasing over years.

## Attribution

Optimization engine adapted from team Kopibara (NUS Maritime Hackathon 2026), MIT license.
Upstream repository: https://github.com/oadultradeepfield/maritime-hackathon-2026

Dashboard built on the Kopibara results dashboard (https://github.com/Spchdt/maritime-hackathon-2026): its React, Material UI and Recharts stack, theme, navigation rail layout, KPI card and chart and table styling. Their result data files are not included.

In the engine we reuse the structure, the PuLP and CBC solver setup, the capital recovery factor, the average-safety constraint form and the epsilon-constraint and sensitivity patterns. Their dataset is not used. Details are in `docs/UPSTREAM_NOTES.md`.

## License

MIT. See `LICENSE` (includes the original Kopibara copyright line).
