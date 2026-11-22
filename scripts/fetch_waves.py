"""Build data/wave_climate.csv.

Two modes:

1. Reanalysis (needs the `copernicusmarine` package and the environment variables
   COPERNICUSMARINE_SERVICE_USERNAME / COPERNICUSMARINE_SERVICE_PASSWORD):
   samples significant wave height at the mid-point of each route from the
   Copernicus Marine global wave reanalysis and computes monthly exceedance.
   This branch has not been run yet (no credentials on the build machine).

2. Placeholder (default when credentials are missing): a seasonal estimate.
   Monthly mean wave height follows a monsoon-shaped curve scaled by the route
   `exposure` factor in routes.csv; daily values are assumed log-normal.
   Rows are written with an empty source and must be shown as estimates.

Usage: uv run python scripts/fetch_waves.py [--force-placeholder]
"""

import argparse
import csv
import math
import os
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
THRESHOLDS = (1.0, 1.5, 2.0)

# Placeholder shape: open-sea monthly mean Hs (m) for exposure = 1.0.
# Rougher in the northwest monsoon (Dec to Feb) and southeast monsoon (Jul, Aug).
BASE_HS_MEAN = [1.15, 1.05, 0.85, 0.65, 0.65, 0.85, 1.05, 1.05, 0.85, 0.65, 0.75, 1.05]
LOG_SIGMA = 0.45

COPERNICUS_DATASET = "cmems_mod_glo_wav_my_0.2deg_PT3H-i"
COPERNICUS_SOURCE = (
    "Copernicus Marine Service, Global Ocean Waves Reanalysis "
    "(GLOBAL_MULTIYEAR_WAV_001_032), variable VHM0, daily maximum at route mid-point"
)


def _exceedance(median: float, threshold: float) -> float:
    """P(Hs > threshold) for a log-normal daily Hs with the given median."""
    z = (math.log(threshold) - math.log(median)) / LOG_SIGMA
    return 0.5 * (1.0 - math.erf(z / math.sqrt(2.0)))


def placeholder_rows(routes: list[dict[str, str]]) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for route in routes:
        exposure = float(route["exposure"])
        for month, base in enumerate(BASE_HS_MEAN, start=1):
            mean = base * exposure
            median = mean / math.exp(LOG_SIGMA**2 / 2.0)
            p90 = median * math.exp(1.2816 * LOG_SIGMA)
            row: dict[str, object] = {
                "route_id": route["route_id"],
                "month": month,
                "hs_mean_m": round(mean, 2),
                "hs_p90_m": round(p90, 2),
            }
            for thr in THRESHOLDS:
                key = f"pct_days_hs_above_{str(thr).replace('.', '_')}"
                row[key] = round(100.0 * _exceedance(median, thr), 1)
            row["source"] = ""
            rows.append(row)
    return rows


def reanalysis_rows(
    routes: list[dict[str, str]], ports: dict[str, tuple[float, float]]
) -> list[dict[str, object]]:
    import copernicusmarine  # type: ignore[import-not-found]

    rows: list[dict[str, object]] = []
    for route in routes:
        lat_a, lon_a = ports[route["port_a"]]
        lat_b, lon_b = ports[route["port_b"]]
        lat, lon = (lat_a + lat_b) / 2.0, (lon_a + lon_b) / 2.0
        ds = copernicusmarine.open_dataset(
            dataset_id=COPERNICUS_DATASET,
            variables=["VHM0"],
            minimum_latitude=lat - 0.2,
            maximum_latitude=lat + 0.2,
            minimum_longitude=lon - 0.2,
            maximum_longitude=lon + 0.2,
            start_datetime="2014-01-01T00:00:00",
            end_datetime="2023-12-31T21:00:00",
        )
        series = ds["VHM0"].mean(dim=["latitude", "longitude"]).to_series().dropna()
        daily = series.resample("1D").max().dropna()
        for month in range(1, 13):
            sample = daily[daily.index.month == month]
            row: dict[str, object] = {
                "route_id": route["route_id"],
                "month": month,
                "hs_mean_m": round(float(sample.mean()), 2),
                "hs_p90_m": round(float(sample.quantile(0.9)), 2),
            }
            for thr in THRESHOLDS:
                key = f"pct_days_hs_above_{str(thr).replace('.', '_')}"
                row[key] = round(100.0 * float((sample > thr).mean()), 1)
            row["source"] = COPERNICUS_SOURCE
            rows.append(row)
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--force-placeholder", action="store_true")
    args = parser.parse_args()

    with (DATA_DIR / "routes.csv").open(newline="", encoding="utf-8") as f:
        routes = list(csv.DictReader(f))
    with (DATA_DIR / "ports.csv").open(newline="", encoding="utf-8") as f:
        ports = {
            r["port_id"]: (float(r["lat"]), float(r["lon"])) for r in csv.DictReader(f)
        }

    has_credentials = bool(
        os.environ.get("COPERNICUSMARINE_SERVICE_USERNAME")
        and os.environ.get("COPERNICUSMARINE_SERVICE_PASSWORD")
    )
    if has_credentials and not args.force_placeholder:
        rows = reanalysis_rows(routes, ports)
        mode = "Copernicus Marine reanalysis"
    else:
        rows = placeholder_rows(routes)
        mode = "seasonal placeholder (no Copernicus credentials found)"

    out = DATA_DIR / "wave_climate.csv"
    with out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)
    print(f"Wrote {len(rows)} rows to {out} using: {mode}")


if __name__ == "__main__":
    main()
