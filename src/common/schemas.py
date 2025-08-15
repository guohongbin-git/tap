# -*- coding: utf-8 -*-
"""
This module defines the core configuration schemas for the TAP Toolbox.

These dataclasses are used to configure the behavior of various components,
particularly the data generator and the orchestration pipeline.
"""

from dataclasses import dataclass, field
from typing import List, Tuple, Optional, Union


@dataclass
class VoronoiConfig:
    """Configuration for generating the base geographic units (Voronoi cells)."""
    num_units: int
    bounding_box: Tuple[float, float, float, float] = (0, 0, 100, 100)


@dataclass
class HomogeneousPoissonConfig:
    """Configuration for a Homogeneous Poisson Process distribution."""
    intensity: float


@dataclass
class InhomogeneousPoissonConfig:
    """Configuration for an Inhomogeneous Poisson Process distribution."""
    # A list of peaks defined by [center_x, center_y, peak_value, std_dev]
    intensity_peaks: List[Tuple[float, float, float, float]]


@dataclass
class NeymanScottConfig:
    """Configuration for a Neyman-Scott cluster process."""
    parent_intensity: float
    offspring_per_parent: int
    offspring_radius: float


@dataclass
class SamplingConfig:
    """Configuration for sampling from an existing dataset."""
    source_filepath: str
    method: str = "proportional"
    fraction: float = 0.5


@dataclass
class DataGeneratorConfig:
    """Top-level configuration for the data generator module."""
    voronoi_config: VoronoiConfig
    random_seed: int = 42

    # The customer generation mode is determined by which of these is provided.
    # The system will prioritize sampling_config if both are present.
    distribution_config: Optional[Union[HomogeneousPoissonConfig, InhomogeneousPoissonConfig, NeymanScottConfig]] = None
    sampling_config: Optional[SamplingConfig] = None
