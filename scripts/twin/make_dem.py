"""Build the terrain inputs for the 3D twin from Copernicus GLO-90 tiles.

Usage:
    uv run --with tifffile --with imagecodecs --with numpy --with pillow --with scipy \
        python -I scripts/twin/make_dem.py <tile_dir> <build_dir>

Tiles: https://copernicus-dem-90m.s3.amazonaws.com/ (Copernicus DEM GLO-90,
(c) DLR e.V. 2010-2014 and (c) Airbus Defence and Space GmbH 2014-2018,
provided under COPERNICUS by the European Union and ESA).

Writes to <build_dir>:
    heights.npy      float32 metres, north-up grid over the scene frame, sea = 0
    land_color.png   albedo for the land: plaster tones, hillshade, 250 m contours
    sea_color.png    sea chart: shelf tint near the coast, coastline, half-degree grid
    frame.json       the frame below, so Blender and the web use the same numbers
"""

import json
import sys
from pathlib import Path

import numpy as np
import tifffile
from PIL import Image
from scipy import ndimage

# Scene frame, shared with dashboard/src/twin/geo.ts
FRAME = {
    "lon_min": 126.2,
    "lon_max": 128.6,
    "lat_min": 0.35,
    "lat_max": 2.35,
    "lat0": 1.35,
    "lon0": 127.4,
    "km_per_unit": 1.0,
    "vertical_exaggeration": 5.0,
}
TILE_PX = 1200  # GLO-90 tiles below 50 degrees latitude
STEP = 4  # 1200/4 = 300 px per degree, about 370 m per cell


def load_mosaic(tile_dir: Path) -> tuple[np.ndarray, float, float]:
    lats = range(0, 3)
    lons = range(126, 129)
    mosaic = np.zeros((len(lats) * TILE_PX, len(lons) * TILE_PX), dtype=np.float32)
    for i, lat in enumerate(sorted(lats, reverse=True)):
        for j, lon in enumerate(lons):
            name = f"Copernicus_DSM_COG_30_N{lat:02d}_00_E{lon:03d}_00_DEM"
            path = tile_dir / f"{name}.tif"
            if not path.exists():
                continue  # open sea tiles are not published
            data = tifffile.imread(path).astype(np.float32)
            if data.shape != (TILE_PX, TILE_PX):
                raise SystemExit(f"{name}: unexpected shape {data.shape}")
            mosaic[i * TILE_PX:(i + 1) * TILE_PX, j * TILE_PX:(j + 1) * TILE_PX] = data
    # Top-left corner of the mosaic
    return mosaic, max(lats) + 1.0, float(min(lons))


def crop(mosaic: np.ndarray, top_lat: float, left_lon: float) -> np.ndarray:
    r0 = round((top_lat - FRAME["lat_max"]) * TILE_PX)
    r1 = round((top_lat - FRAME["lat_min"]) * TILE_PX)
    c0 = round((FRAME["lon_min"] - left_lon) * TILE_PX)
    c1 = round((FRAME["lon_max"] - left_lon) * TILE_PX)
    sub = mosaic[r0:r1, c0:c1]
    h, w = sub.shape
    sub = sub[: h - h % STEP, : w - w % STEP]
    # Block mean keeps small islands that a plain stride would drop
    return sub.reshape(sub.shape[0] // STEP, STEP, sub.shape[1] // STEP, STEP).mean(axis=(1, 3))


def hillshade(z: np.ndarray, cell_m: float, azimuth=315.0, altitude=40.0) -> np.ndarray:
    gy, gx = np.gradient(z, cell_m)
    slope = np.arctan(np.hypot(gx, gy) * 2.0)
    aspect = np.arctan2(-gx, gy)
    az, alt = np.radians(azimuth), np.radians(altitude)
    shade = np.sin(alt) * np.cos(slope) + np.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    return np.clip(shade, 0, 1)


def mix(a, b, t):
    t = np.clip(t, 0, 1)[..., None]
    return a * (1 - t) + b * t


def land_texture(z: np.ndarray, size: tuple[int, int]) -> Image.Image:
    zi = np.array(Image.fromarray(z).resize(size, Image.BICUBIC))
    cell_m = (FRAME["lon_max"] - FRAME["lon_min"]) * 111_320 / size[0]
    low = np.array([246, 232, 168], np.float32)  # chart land buff
    high = np.array([226, 205, 140], np.float32)
    base = mix(low, high, zi / 1500.0)
    shade = hillshade(zi, cell_m)[..., None]
    rgb = base * (0.86 + 0.20 * shade)
    # 250 m contours as hairlines, the way a relief model is drawn
    band = np.floor(zi / 250.0)
    edge = (np.abs(np.diff(band, axis=0, prepend=band[:1])) + np.abs(np.diff(band, axis=1, prepend=band[:, :1]))) > 0
    edge &= zi > 10
    rgb[edge] = rgb[edge] * 0.80
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))


def sea_texture(z: np.ndarray, size: tuple[int, int]) -> Image.Image:
    land = np.array(Image.fromarray((z > 0.5).astype(np.uint8) * 255).resize(size, Image.BILINEAR)) > 127
    cell_km = (FRAME["lon_max"] - FRAME["lon_min"]) * 111.32 / size[0]
    dist_km = ndimage.distance_transform_edt(~land) * cell_km
    deep = np.array([250, 252, 252], np.float32)  # chart deep water: white
    shelf = np.array([196, 225, 240], np.float32)  # chart shallow tint
    rgb = mix(shelf, deep, np.clip((dist_km - 0.6) / 2.4, 0, 1) ** 0.8)
    # Two faint lines offshore, 1 km and 3 km, like chart shoreline offsets
    for d, k in ((3.4, 0.93),):
        ring = np.abs(dist_km - d) < cell_km * 0.6
        rgb[ring] *= k
    coast = (dist_km > 0) & (dist_km < cell_km * 1.5)
    rgb[coast] = np.array([60, 66, 70], np.float32)
    # Half-degree graticule
    w, h = size
    for lon in np.arange(126.5, FRAME["lon_max"], 0.5):
        x = round((lon - FRAME["lon_min"]) / (FRAME["lon_max"] - FRAME["lon_min"]) * w)
        rgb[:, max(0, x - 1):x + 1] *= 0.90
    for lat in np.arange(0.5, FRAME["lat_max"], 0.5):
        y = round((FRAME["lat_max"] - lat) / (FRAME["lat_max"] - FRAME["lat_min"]) * h)
        rgb[max(0, y - 1):y + 1, :] *= 0.90
    rgb[land] = np.array([236, 220, 160], np.float32)  # hidden under the land mesh
    return Image.fromarray(np.clip(rgb, 0, 255).astype(np.uint8))


def main() -> None:
    tile_dir, build_dir = Path(sys.argv[1]), Path(sys.argv[2])
    build_dir.mkdir(parents=True, exist_ok=True)
    mosaic, top, left = load_mosaic(tile_dir)
    z = crop(mosaic, top, left)
    z[z < 0.5] = 0.0
    np.save(build_dir / "heights.npy", z.astype(np.float32))
    land_texture(z, (2048, 1707)).save(build_dir / "land_color.png")
    sea_texture(z, (2048, 1707)).save(build_dir / "sea_color.png")
    (build_dir / "frame.json").write_text(json.dumps({**FRAME, "grid": list(z.shape)}, indent=2))
    print("grid", z.shape, "max m", float(z.max()), "land share", float((z > 0).mean()))


if __name__ == "__main__":
    main()
