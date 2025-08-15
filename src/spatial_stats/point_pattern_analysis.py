# -*- coding: utf-8 -*-
"""
This module provides functions for spatial point pattern analysis.
"""

from typing import Dict, Any, List, Tuple

import geopandas as gpd
import numpy as np
from pointpats import k_test

def analyze_k_function(
    points_gdf: gpd.GeoDataFrame,
    area: float, # This is kept for API consistency but hull is used for calculation
    steps: int = 100,
    permutations: int = 99,
) -> Dict[str, Any]:
    """
    Performs Ripley's K-function analysis on a set of points.

    This function evaluates the spatial distribution of points to determine if they
    are clustered, dispersed, or randomly distributed.

    Args:
        points_gdf: A GeoDataFrame containing the point data. The geometry column
                    must contain Shapely Point objects.
        area: The total area of the study region. (Note: for k_test, the convex
              hull of the points is used as the study area).
        steps: The number of distance steps at which to calculate the K-function.
        permutations: The number of permutations to run for generating the
                      confidence envelope, which helps in assessing statistical
                      significance.

    Returns:
        A dictionary containing the results of the analysis, with the following keys:
        - "r": A list of distance radii used for the analysis.
        - "k_values": The observed K-values for each distance radius.
        - "k_expected": The expected K-values under CSR (from simulations).
        - "confidence_envelope": A list of tuples, where each tuple contains the
                                 lower and upper bounds of the confidence envelope
                                 for each distance radius.
        - "pattern": A string summarizing the overall spatial pattern, which can be
                     "Clustered", "Random", or "Dispersed".
    """
    if not isinstance(points_gdf, gpd.GeoDataFrame) or points_gdf.empty:
        raise ValueError("Input must be a non-empty GeoDataFrame.")
    if not all(points_gdf.geom_type == 'Point'):
        raise ValueError("All geometries in the GeoDataFrame must be Points.")

    # The k_test function uses the convex hull of the points as the study area.
    hull = points_gdf.union_all().convex_hull

    # Perform Ripley's K-test
    k_result = k_test(points_gdf.geometry, support=steps, hull=hull, n_simulations=permutations)

    observed_k = k_result.statistic
    
    # The theoretical K value for a CSR process is pi * r^2
    theoretical_k = np.pi * np.array(k_result.support)**2

    if k_result.simulations is not None:
        expected_k = k_result.simulations.mean(axis=0)
        lower_env = np.percentile(k_result.simulations, 2.5, axis=0)
        upper_env = np.percentile(k_result.simulations, 97.5, axis=0)
        
        # Determine the overall pattern
        if np.all(observed_k > upper_env):
            pattern = "Clustered"
        elif np.all(observed_k < lower_env):
            pattern = "Dispersed"
        else:
            pattern = "Random" # Or mixed
            
        confidence_envelope = list(zip(lower_env, upper_env))
    else:
        # Fallback if simulations are not returned
        expected_k = theoretical_k
        pattern = "Unknown (simulations not available)"
        confidence_envelope = []


    return {
        "r": list(k_result.support),
        "k_values": list(observed_k),
        "k_expected": list(expected_k),
        "confidence_envelope": confidence_envelope,
        "pattern": pattern,
    }