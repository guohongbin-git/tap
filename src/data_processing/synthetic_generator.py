# -*- coding: utf-8 -*-
"""
This module is responsible for generating synthetic geographic datasets.

It can generate data from scratch using spatial point process models or
sample from existing real-world data to create semi-synthetic datasets.
"""

from typing import Tuple, Union

import geopandas as gpd
import numpy as np
import pandas as pd
from scipy.spatial import Voronoi
from shapely.geometry import box, Point, Polygon
from sklearn.datasets import make_blobs

from src.common.schemas import (
    DataGeneratorConfig,
    VoronoiConfig,
    SamplingConfig,
    HomogeneousPoissonConfig,
    InhomogeneousPoissonConfig,
    NeymanScottConfig
)

def _generate_voronoi_units(config: VoronoiConfig) -> gpd.GeoDataFrame:
    """Generates a GeoDataFrame of Voronoi cells within a bounding box."""
    min_x, min_y, max_x, max_y = config.bounding_box
    x_coords = np.random.uniform(min_x, max_x, config.num_units)
    y_coords = np.random.uniform(min_y, max_y, config.num_units)
    points = np.vstack([x_coords, y_coords]).T

    # Add points at the corners of the bounding box to ensure the Voronoi cells cover the entire area
    # This is a common technique to handle infinite Voronoi regions
    points = np.concatenate([points, [[min_x, min_y], [min_x, max_y], [max_x, min_y], [max_x, max_y]]])

    vor = Voronoi(points)
    
    bounding_box_poly = box(*config.bounding_box)
    polygons = []
    for region in vor.regions:
        if not region or -1 in region:
            continue
        
        polygon_vertices = [vor.vertices[i] for i in region]
        if len(polygon_vertices) > 2:
            # Create a shapely Polygon and clip it to the bounding box
            shape = Polygon(polygon_vertices)
            if shape.is_valid:
                clipped_shape = shape.intersection(bounding_box_poly)
                if not clipped_shape.is_empty:
                    polygons.append(clipped_shape)

    units_gdf = gpd.GeoDataFrame(geometry=polygons, crs="EPSG:4326")
    # Filter out any potential empty geometries that might have been created
    units_gdf = units_gdf[~units_gdf.is_empty]
    units_gdf["unit_id"] = range(len(units_gdf))
    return units_gdf

def _generate_points_from_distribution(
    config: Union[HomogeneousPoissonConfig, InhomogeneousPoissonConfig, NeymanScottConfig],
    bounding_box: Tuple[float, float, float, float]
) -> gpd.GeoDataFrame:
    """Generates customer points based on a specified distribution model."""
    min_x, min_y, max_x, max_y = bounding_box
    area = (max_x - min_x) * (max_y - min_y)
    points = []

    if isinstance(config, HomogeneousPoissonConfig):
        num_points = np.random.poisson(config.intensity * area)
        x_coords = np.random.uniform(min_x, max_x, num_points)
        y_coords = np.random.uniform(min_y, max_y, num_points)
        points = np.vstack([x_coords, y_coords]).T

    elif isinstance(config, InhomogeneousPoissonConfig):
        # Using make_blobs is a reasonable approximation for clustered distributions
        centers = [peak[:2] for peak in config.intensity_peaks]
        # Treat peak value as number of samples for simplicity
        n_samples = [int(peak[2]) for peak in config.intensity_peaks]
        cluster_std = [peak[3] for peak in config.intensity_peaks]

        points, _ = make_blobs(
            n_samples=n_samples,
            centers=centers,
            cluster_std=cluster_std
        )

    elif isinstance(config, NeymanScottConfig):
        # 1. Generate parent points
        num_parents = np.random.poisson(config.parent_intensity * area)
        parent_x = np.random.uniform(min_x, max_x, num_parents)
        parent_y = np.random.uniform(min_y, max_y, num_parents)

        # 2. Generate offspring for each parent
        for i in range(num_parents):
            # Generate random angles and radii for offspring
            angles = np.random.uniform(0, 2 * np.pi, config.offspring_per_parent)
            radii = np.random.uniform(0, config.offspring_radius, config.offspring_per_parent)
            
            offspring_x = parent_x[i] + radii * np.cos(angles)
            offspring_y = parent_y[i] + radii * np.sin(angles)
            points.extend(zip(offspring_x, offspring_y))
        
        points = np.array(points)

    else:
        raise NotImplementedError(f"Distribution type {type(config)} not yet implemented.")

    if len(points) == 0:
        # Return empty GeoDataFrame with correct columns if no points were generated
        return gpd.GeoDataFrame({
            'geometry': [],
            'sales_potential': [],
            'workload': []
        }, crs="EPSG:4326")

    # Filter points to be strictly within the bounding box
    points = points[(points[:, 0] >= min_x) & (points[:, 0] <= max_x) &
                    (points[:, 1] >= min_y) & (points[:, 1] <= max_y)]

    customers_df = pd.DataFrame(points, columns=["lon", "lat"])
    customers_gdf = gpd.GeoDataFrame(
        customers_df,
        geometry=gpd.points_from_xy(customers_df.lon, customers_df.lat),
        crs="EPSG:4326"
    )
    # Add mock business data
    customers_gdf["sales_potential"] = np.random.uniform(1000, 10000, size=len(customers_gdf)).round(2)
    customers_gdf["workload"] = np.random.uniform(1, 10, size=len(customers_gdf)).round(2)
    return customers_gdf

def _generate_points_from_sampling(config: SamplingConfig) -> gpd.GeoDataFrame:
    """Generates customer points by sampling from a source file."""
    source_df = pd.read_csv(config.source_filepath)
    # Assuming source_df has 'latitude' and 'longitude' columns
    sampled_df = source_df.sample(frac=config.fraction, random_state=42) # Using fixed seed for sampling part
    
    customers_gdf = gpd.GeoDataFrame(
        sampled_df,
        geometry=gpd.points_from_xy(sampled_df.longitude, sampled_df.latitude),
        crs="EPSG:4326"
    )
    return customers_gdf

def _assign_units_to_points(
    customers_gdf: gpd.GeoDataFrame, units_gdf: gpd.GeoDataFrame
) -> gpd.GeoDataFrame:
    """Spatially joins customer points to the generated Voronoi units."""
    # Perform the spatial join
    # This adds an 'index_right' column which corresponds to the index of the units_gdf
    joined_gdf = gpd.sjoin(customers_gdf, units_gdf, how="inner", predicate="within")
    
    # Rename 'index_right' to 'unit_id' from the units GeoDataFrame
    # Note: The original unit_id column in units_gdf is used for the join's index.
    joined_gdf = joined_gdf.drop(columns=["unit_id"])
    joined_gdf = joined_gdf.rename(columns={"index_right": "unit_id"})
    joined_gdf["customer_id"] = range(len(joined_gdf))
    return joined_gdf

def generate_data(
    config: DataGeneratorConfig,
) -> Tuple[gpd.GeoDataFrame, gpd.GeoDataFrame]:
    """Main function to generate a complete synthetic dataset."""
    # 1. Set random seed for reproducibility
    np.random.seed(config.random_seed)

    # 2. Generate base geographic units
    print("Generating Voronoi base units...")
    base_units_gdf = _generate_voronoi_units(config.voronoi_config)

    # 3. Generate customer points based on the selected mode
    if config.sampling_config:
        print("Generating customer points from sampling...")
        customers_gdf = _generate_points_from_sampling(config.sampling_config)
    elif config.distribution_config:
        print("Generating customer points from distribution model...")
        customers_gdf = _generate_points_from_distribution(
            config.distribution_config, config.voronoi_config.bounding_box
        )
    else:
        raise ValueError("Either distribution_config or sampling_config must be provided.")

    # 4. Assign customers to the base units
    print("Assigning customers to base units...")
    final_customers_gdf = _assign_units_to_points(customers_gdf, base_units_gdf)

    print("Synthetic data generation complete.")
    return base_units_gdf, final_customers_gdf
