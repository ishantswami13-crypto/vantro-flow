from __future__ import annotations

import argparse
import json
import math
import shutil
import zipfile
from pathlib import Path

import geopandas as gpd
import rasterio
from shapely.geometry import Point
from shapely.ops import unary_union
from shapely.prepared import prep


REPO_ROOT = Path(__file__).resolve().parents[2]
DOWNLOADS_DIR = Path.home() / "Downloads"
VECTOR_ZIP_PATH = DOWNLOADS_DIR / "natural_earth_vector.zip"
ETOPO_GLOB = "ETOPO_2022_v1_15s_*_surface.tif"
OUTPUT_PATH = REPO_ROOT / "public" / "generated" / "globe-point-cloud.json"
SCRATCH_ROOT = Path.home() / "AppData" / "Local" / "Temp" / "vantro-flow-globe-build"

LAND_BASE = "10m_physical/ne_10m_land"
LAKES_BASE = "10m_physical/ne_10m_lakes"
RIVERS_BASE = "10m_physical/ne_10m_rivers_lake_centerlines"
SHAPEFILE_EXTENSIONS = (".shp", ".shx", ".dbf", ".prj", ".cpg")

DEFAULT_SAMPLE_COUNT = 540000
MAX_ELEVATION_METERS = 6000.0
RIVER_BUFFER_METERS = 6000.0


def pseudo_random(seed: int) -> float:
    value = math.sin(seed * 127.1 + 311.7) * 43758.5453
    return value - math.floor(value)


def synthetic_elevation(lat: float, lon: float) -> float:
    lat_wave = (math.sin(math.radians(lat * 2.3)) + math.cos(math.radians(lat * 1.7 + lon * 0.6))) * 0.5
    lon_wave = (math.cos(math.radians(lon * 1.8)) + math.sin(math.radians(lon * 0.8 - lat * 1.2))) * 0.5
    normalized = max(0.0, min(1.0, (lat_wave + lon_wave + 1.2) / 2.4))
    return normalized * 2200.0


def fibonacci_sphere(index: int, total: int) -> tuple[float, float]:
    y = 1 - (index / float(total - 1)) * 2
    radius = math.sqrt(max(0.0, 1 - y * y))
    theta = math.pi * (3 - math.sqrt(5)) * index
    x = math.cos(theta) * radius
    z = math.sin(theta) * radius
    lat = math.degrees(math.asin(y))
    lon = math.degrees(math.atan2(z, x))
    return lat, lon


def extract_shapefile_set(zip_path: Path, base_path: str, destination: Path) -> Path:
    destination.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path) as archive:
        for extension in SHAPEFILE_EXTENSIONS:
            member = f"{base_path}{extension}"
            target = destination / Path(member).name
            with archive.open(member) as source, target.open("wb") as output:
                shutil.copyfileobj(source, output)

    return destination / f"{Path(base_path).name}.shp"


def build_geometries(vector_zip_path: Path, temp_dir: Path):
    land_path = extract_shapefile_set(vector_zip_path, LAND_BASE, temp_dir / "land")
    lakes_path = extract_shapefile_set(vector_zip_path, LAKES_BASE, temp_dir / "lakes")
    rivers_path = extract_shapefile_set(vector_zip_path, RIVERS_BASE, temp_dir / "rivers")

    land = gpd.read_file(land_path)
    lakes = gpd.read_file(lakes_path)
    rivers = gpd.read_file(rivers_path)

    land_union = unary_union(land.geometry)
    lakes_union = unary_union(lakes.geometry)
    land_minus_lakes = land_union.difference(lakes_union)

    river_buffers = rivers.to_crs(3857).buffer(RIVER_BUFFER_METERS)
    rivers_wide = gpd.GeoSeries(river_buffers, crs=3857).to_crs(4326)
    rivers_union = unary_union(rivers_wide.geometry)

    return prep(land_minus_lakes), prep(rivers_union)


def build_tile_index(tile_paths: list[Path]):
    tiles = []
    for path in tile_paths:
        dataset = rasterio.open(path)
        tiles.append(
            {
                "path": path,
                "dataset": dataset,
                "bounds": dataset.bounds,
                "name": path.name,
            }
        )
    return tiles


def sample_elevation(tiles, lon: float, lat: float) -> tuple[float, bool]:
    for tile in tiles:
        bounds = tile["bounds"]
        if bounds.left <= lon <= bounds.right and bounds.bottom <= lat <= bounds.top:
            value = next(tile["dataset"].sample([(lon, lat)]))[0]
            if value is None:
                break
            elevation = max(0.0, float(value))
            return elevation, True
    return synthetic_elevation(lat, lon), False


def normalize_elevation(elevation_meters: float) -> float:
    clamped = max(0.0, min(MAX_ELEVATION_METERS, elevation_meters))
    return math.sqrt(clamped / MAX_ELEVATION_METERS)


def build_point_cloud(vector_zip_path: Path, tile_paths: list[Path], sample_count: int):
    SCRATCH_ROOT.mkdir(parents=True, exist_ok=True)
    scratch_dir = SCRATCH_ROOT / "working"
    shutil.rmtree(scratch_dir, ignore_errors=True)
    scratch_dir.mkdir(parents=True, exist_ok=True)

    try:
        land_geometry, river_geometry = build_geometries(vector_zip_path, scratch_dir)
        tiles = build_tile_index(tile_paths)

        points = []
        actual_count = 0
        river_count = 0

        for index in range(sample_count):
            lat, lon = fibonacci_sphere(index, sample_count)
            point = Point(lon, lat)
            is_river = river_geometry.contains(point)
            is_land = land_geometry.contains(point)

            if not is_land and not is_river:
                continue

            elevation_meters, is_actual = sample_elevation(tiles, lon, lat)
            if is_actual:
                actual_count += 1
            if is_river:
                river_count += 1

            points.append(
                [
                    round(lat, 5),
                    round(lon, 5),
                    round(normalize_elevation(elevation_meters), 6),
                    1 if is_river else 0,
                    1 if is_actual else 0,
                ]
            )

        for tile in tiles:
            tile["dataset"].close()
    finally:
        shutil.rmtree(scratch_dir, ignore_errors=True)

    return {
        "meta": {
            "count": len(points),
            "sampleCount": sample_count,
            "actualElevationPoints": actual_count,
            "riverPoints": river_count,
            "etopoTiles": [path.name for path in tile_paths],
        },
        "points": points,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build the globe point-cloud payload from Natural Earth + ETOPO data.")
    parser.add_argument(
        "--samples",
        type=int,
        default=DEFAULT_SAMPLE_COUNT,
        help=f"Number of fibonacci samples to test before land/water filtering. Default: {DEFAULT_SAMPLE_COUNT}",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=OUTPUT_PATH,
        help=f"Output JSON path. Default: {OUTPUT_PATH}",
    )
    return parser.parse_args()


def main():
    args = parse_args()

    if args.samples < 1000:
        raise ValueError("--samples must be at least 1000")

    if not VECTOR_ZIP_PATH.exists():
        raise FileNotFoundError(f"Missing Natural Earth zip: {VECTOR_ZIP_PATH}")

    tile_paths = sorted(DOWNLOADS_DIR.glob(ETOPO_GLOB))
    if not tile_paths:
        raise FileNotFoundError(
            f"No ETOPO tiles found in {DOWNLOADS_DIR} matching {ETOPO_GLOB}"
        )

    print(f"Using Natural Earth archive: {VECTOR_ZIP_PATH}")
    print(f"Using {len(tile_paths)} ETOPO tile(s)")
    for tile_path in tile_paths:
        print(f"  - {tile_path.name}")

    print(f"Using sample count: {args.samples}")

    payload = build_point_cloud(VECTOR_ZIP_PATH, tile_paths, args.samples)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")

    print(f"Wrote globe data to {args.output}")
    print(
        f"Points: {payload['meta']['count']} | Actual elevation coverage: {payload['meta']['actualElevationPoints']}"
    )
    if len(tile_paths) < 4:
        print("Warning: only a partial ETOPO set is present, so non-covered regions use synthetic relief.")


if __name__ == "__main__":
    main()
