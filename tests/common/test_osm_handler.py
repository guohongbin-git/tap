# -*- coding: utf-8 -*-
"""
Unit tests for the osm_handler module.
"""

import geopandas as gpd
import networkx as nx
import pandas as pd
import pytest
from shapely.geometry import Polygon, Point
from unittest.mock import patch, MagicMock

from src.common.osm_handler import (
    get_boundary_from_api,
    get_road_network_from_api,
    extract_from_pbf,
)

# --- Fixtures ---

@pytest.fixture
def mock_polygon():
    """Returns a simple square polygon for testing."""
    return Polygon([(0, 0), (1, 0), (1, 1), (0, 1)])

@pytest.fixture
def mock_gdf():
    """Returns a simple GeoDataFrame for mocking."""
    return gpd.GeoDataFrame({
        'geometry': [Point(0.5, 0.5)],
        'name': ['test_point']
    }, crs="EPSG:4326")

@pytest.fixture
def mock_graph():
    """Returns a simple NetworkX graph for mocking."""
    G = nx.MultiDiGraph()
    G.add_node(1, x=0, y=0)
    G.add_node(2, x=1, y=1)
    G.add_edge(1, 2)
    return G

# --- Tests for get_boundary_from_api ---

@patch('src.common.osm_handler.ox.geocode_to_gdf')
@patch('src.common.osm_handler.gpd.read_feather')
@patch('src.common.osm_handler.Path.exists', return_value=False)
@patch('src.common.osm_handler.gpd.GeoDataFrame.to_feather')
def test_get_boundary_from_api_cache_miss(mock_to_feather, mock_exists, mock_read_feather, mock_geocode, mock_gdf):
    """Test get_boundary_from_api when cache is missed."""
    mock_geocode.return_value = mock_gdf
    
    query = "Test City"
    tags = {"admin_level": "8"}
    
    result_gdf = get_boundary_from_api(query, tags)
    
    mock_geocode.assert_called_once_with(query, by_osmid=False, by_polygon=False, **tags)
    mock_to_feather.assert_called_once()
    assert not mock_read_feather.called
    pd.testing.assert_frame_equal(result_gdf, mock_gdf)

@patch('src.common.osm_handler.ox.geocode_to_gdf')
@patch('src.common.osm_handler.gpd.read_feather')
@patch('src.common.osm_handler.Path.exists', return_value=True)
def test_get_boundary_from_api_cache_hit(mock_exists, mock_read_feather, mock_geocode, mock_gdf):
    """Test get_boundary_from_api when cache is hit."""
    mock_read_feather.return_value = mock_gdf

    query = "Test City"
    tags = {"admin_level": "8"}

    result_gdf = get_boundary_from_api(query, tags)

    mock_read_feather.assert_called_once()
    assert not mock_geocode.called
    pd.testing.assert_frame_equal(result_gdf, mock_gdf)


# --- Tests for get_road_network_from_api ---

@patch('src.common.osm_handler.ox.graph_from_polygon')
@patch('src.common.osm_handler.ox.load_graphml')
@patch('src.common.osm_handler.Path.exists', return_value=False)
@patch('src.common.osm_handler.ox.save_graphml')
def test_get_road_network_from_api_cache_miss(mock_save_graphml, mock_exists, mock_load_graphml, mock_graph_from_polygon, mock_polygon, mock_graph):
    """Test get_road_network_from_api on cache miss."""
    mock_graph_from_polygon.return_value = mock_graph

    result_graph = get_road_network_from_api(mock_polygon)

    mock_graph_from_polygon.assert_called_once()
    mock_save_graphml.assert_called_once()
    assert not mock_load_graphml.called
    assert result_graph == mock_graph

@patch('src.common.osm_handler.ox.load_graphml')
@patch('src.common.osm_handler.Path.exists', return_value=True)
def test_get_road_network_from_api_cache_hit(mock_exists, mock_load_graphml, mock_polygon, mock_graph):
    """Test get_road_network_from_api on cache hit."""
    mock_load_graphml.return_value = mock_graph

    result_graph = get_road_network_from_api(mock_polygon)

    mock_load_graphml.assert_called_once()
    assert result_graph == mock_graph


# --- Tests for extract_from_pbf ---

@patch('src.common.osm_handler.OSM')
@patch('src.common.osm_handler.gpd.read_feather')
@patch('src.common.osm_handler.gpd.GeoDataFrame.to_feather')
def test_extract_from_pbf_cache_miss(mock_to_feather, mock_read_feather, mock_osm_class, mock_gdf, tmp_path):
    """Test extract_from_pbf on cache miss using a temporary cache directory."""
    # Create a fake PBF file
    pbf_path = tmp_path / "fake.pbf"
    pbf_path.touch()

    # Mock the OSM class
    mock_osm_instance = MagicMock()
    mock_osm_instance.get_boundaries.return_value = mock_gdf
    mock_osm_class.return_value = mock_osm_instance

    # Patch the cache directory to use the temporary one
    with patch('src.common.osm_handler.DEFAULT_CACHE_DIR', tmp_path):
        result_gdf = extract_from_pbf(str(pbf_path), "boundaries")

    mock_osm_class.assert_called_once_with(str(pbf_path))
    mock_osm_instance.get_boundaries.assert_called_once()
    mock_to_feather.assert_called_once()
    assert not mock_read_feather.called
    pd.testing.assert_frame_equal(result_gdf, mock_gdf)
