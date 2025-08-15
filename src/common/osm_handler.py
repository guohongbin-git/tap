# -*- coding: utf-8 -*-
"""
This module handles all interactions with OpenStreetMap (OSM) data.

It provides a centralized, cached, and robust way to fetch geospatial data
from the OSM API (via osmnx) or from local PBF files (via pyrosm).
"""

import hashlib
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional

import geopandas as gpd
import networkx as nx
import osmnx as ox
from pyrosm import OSM
from shapely.geometry import Polygon

# --- Constants & Configuration ---
DEFAULT_CACHE_DIR = Path(os.getenv("TAP_CACHE_DIR", "data/cache/osm"))


def _get_cache_key(params: Dict[str, Any]) -> str:
    """Generates a stable SHA256 hash for a dictionary of parameters."""
    # Sort the dict to ensure consistent ordering
    sorted_params_str = json.dumps(params, sort_keys=True)
    return hashlib.sha256(sorted_params_str.encode("utf-8")).hexdigest()


def get_boundary_from_api(query: str, tags: Dict[str, str]) -> gpd.GeoDataFrame:
    """
    Fetches administrative boundaries from the OSM API (Nominatim) via osmnx.

    Results are cached locally to avoid repeated API calls.
    """
    DEFAULT_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    params = {"query": query, "tags": tags}
    cache_key = _get_cache_key(params)
    cache_path = DEFAULT_CACHE_DIR / f"{cache_key}_boundary.feather"

    if cache_path.exists():
        print(f"Cache hit. Loading boundary from {cache_path}")
        return gpd.read_feather(cache_path)

    print("Cache miss. Fetching boundary from OSM API...")
    gdf = ox.geocode_to_gdf(query, by_osmid=False, by_polygon=False, **tags)
    
    # Save to cache
    gdf.to_feather(cache_path)
    print(f"Saved boundary to cache: {cache_path}")

    return gdf


def extract_from_pbf(
    pbf_path: str,
    feature_type: str,
    tags: Optional[Dict[str, Any]] = None
) -> gpd.GeoDataFrame:
    """
    Extracts specified features from a local .osm.pbf file.

    Results are cached to avoid repeated parsing of large PBF files.
    """
    DEFAULT_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    
    # Create a params dict for caching
    pbf_file = Path(pbf_path)
    if not pbf_file.exists():
        raise FileNotFoundError(f"PBF file not found at: {pbf_path}")

    params = {
        "pbf_path": str(pbf_file.resolve()),
        "mtime": pbf_file.stat().st_mtime,
        "feature_type": feature_type,
        "tags": tags or {},
    }
    cache_key = _get_cache_key(params)
    cache_path = DEFAULT_CACHE_DIR / f"{cache_key}_{feature_type}.feather"

    if cache_path.exists():
        print(f"Cache hit. Loading {feature_type} from {cache_path}")
        return gpd.read_feather(cache_path)

    print(f"Cache miss. Parsing {feature_type} from PBF file...")
    osm = OSM(pbf_path)
    gdf = None

    if feature_type == "boundaries":
        gdf = osm.get_boundaries()
    elif feature_type == "roads":
        gdf = osm.get_network(network_type="driving")
    # Add more feature types as needed, e.g., pois
    else:
        raise ValueError(f"Unsupported feature_type: {feature_type}")

    if gdf is None or gdf.empty:
        raise ValueError(f"No {feature_type} found in PBF with specified tags.")

    # Save to cache
    gdf.to_feather(cache_path)
    print(f"Saved {feature_type} to cache: {cache_path}")

    return gdf


def get_road_network_from_api(
    polygon: Polygon,
    network_type: str = "drive",
    truncate_by_polygon: bool = True,
) -> nx.MultiDiGraph:
    """
    Fetches a road network graph from the OSM API within a given polygon.

    Results are cached locally to avoid repeated API calls. The cache key is
    generated from the polygon's geometry and the network type.

    Args:
        polygon: The shapely Polygon to define the area of interest.
        network_type: The type of network (e.g., 'drive', 'walk', 'bike').
        truncate_by_polygon: Whether to truncate the graph to the polygon's
                             boundary. Defaults to True.

    Returns:
        A NetworkX MultiDiGraph representing the road network.
    """
    DEFAULT_CACHE_DIR.mkdir(parents=True, exist_ok=True)

    # Use WKT representation for stable hashing of the geometry
    params = {
        "polygon_wkt": polygon.wkt,
        "network_type": network_type,
        "truncate_by_polygon": truncate_by_polygon,
    }
    cache_key = _get_cache_key(params)
    cache_path = DEFAULT_CACHE_DIR / f"{cache_key}_road_network.graphml"

    if cache_path.exists():
        print(f"Cache hit. Loading road network from {cache_path}")
        return ox.load_graphml(cache_path)

    print("Cache miss. Fetching road network from OSM API...")
    graph = ox.graph_from_polygon(
        polygon,
        network_type=network_type,
        truncate_by_polygon=truncate_by_polygon,
        retain_all=True,
        simplify=True,
    )

    # Save to cache
    ox.save_graphml(graph, filepath=cache_path)
    print(f"Saved road network to cache: {cache_path}")

    return graph
