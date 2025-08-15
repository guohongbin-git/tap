# -*- coding: utf-8 -*-
"""
Unit tests for the synthetic_generator module.
"""

import geopandas as gpd
import pytest
from shapely.geometry import Polygon, Point

from src.common.schemas import (
    DataGeneratorConfig,
    VoronoiConfig,
    HomogeneousPoissonConfig,
    InhomogeneousPoissonConfig,
    NeymanScottConfig,
)
from src.data_processing.synthetic_generator import generate_data

# --- Fixtures ---

@pytest.fixture
def base_config():
    """Returns a base configuration for the data generator."""
    return DataGeneratorConfig(
        voronoi_config=VoronoiConfig(
            num_units=10,
            bounding_box=(0, 0, 10, 10)
        ),
        random_seed=42
    )

# --- Test Cases ---

def test_generator_reproducibility(base_config):
    """Tests if the generator produces identical results with the same seed."""
    base_config.distribution_config = HomogeneousPoissonConfig(intensity=0.5)
    
    # Generate data twice with the same config
    base_units_gdf1, customers_gdf1 = generate_data(base_config)
    base_units_gdf2, customers_gdf2 = generate_data(base_config)

    # Check for equality
    assert base_units_gdf1.equals(base_units_gdf2)
    assert customers_gdf1.equals(customers_gdf2)

def test_homogeneous_poisson_generation(base_config):
    """Tests data generation with a homogeneous Poisson distribution."""
    base_config.distribution_config = HomogeneousPoissonConfig(intensity=1.0)
    
    base_units, customers = generate_data(base_config)

    assert isinstance(base_units, gpd.GeoDataFrame)
    assert isinstance(customers, gpd.GeoDataFrame)
    assert "unit_id" in base_units.columns
    assert "customer_id" in customers.columns
    assert "unit_id" in customers.columns
    assert not customers.empty

def test_inhomogeneous_poisson_generation(base_config):
    """Tests data generation with an inhomogeneous Poisson distribution."""
    base_config.distribution_config = InhomogeneousPoissonConfig(
        intensity_peaks=[(2, 2, 20, 1), (8, 8, 30, 2)]
    )
    
    base_units, customers = generate_data(base_config)

    assert isinstance(base_units, gpd.GeoDataFrame)
    assert isinstance(customers, gpd.GeoDataFrame)
    assert len(customers) > 40 # Expecting around 50 points

def test_neyman_scott_generation(base_config):
    """Tests data generation with a Neyman-Scott process."""
    base_config.distribution_config = NeymanScottConfig(
        parent_intensity=0.1,
        offspring_per_parent=5,
        offspring_radius=1.0
    )
    
    base_units, customers = generate_data(base_config)

    assert isinstance(base_units, gpd.GeoDataFrame)
    assert isinstance(customers, gpd.GeoDataFrame)
    assert not customers.empty

def test_no_distribution_config_raises_error(base_config):
    """Tests that an error is raised if no distribution or sampling config is given."""
    with pytest.raises(ValueError):
        generate_data(base_config)
