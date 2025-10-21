/**
 * Generate Kedro pipeline registry and settings
 */

import type { ProjectMetadata } from './staticFilesGenerator';

/**
 * Generate pipeline_registry.py
 */
export function generatePipelineRegistry(metadata: ProjectMetadata): string {
  const { pythonPackage, pipelineName } = metadata;

  return `"""Project pipelines registry.

This module registers all pipelines in the project. Each pipeline should be
imported and added to the dictionary returned by register_pipelines().
"""

from typing import Dict
from kedro.pipeline import Pipeline
from ${pythonPackage}.pipelines import ${pipelineName}


def register_pipelines() -> Dict[str, Pipeline]:
    """
    Register the project's pipelines.

    Returns:
        A mapping from pipeline names to Pipeline objects.
    """
    ${pipelineName}_pipeline = ${pipelineName}.create_pipeline()

    return {
        "__default__": ${pipelineName}_pipeline,
        "${pipelineName}": ${pipelineName}_pipeline,
    }
`;
}

/**
 * Generate settings.py
 */
export function generateSettings(): string {
  return `"""Project settings.

This file configures Kedro's behavior for this project. You can override
default Kedro settings here.
"""

from kedro.config import OmegaConfigLoader

# Instantiate and list your project hooks here
HOOKS = ()

# List the installed plugins for which to disable auto-registry
DISABLE_HOOKS_FOR_PLUGINS = ()

# Define where to store data from different data layers
DATA_LAYER_MAPPING = {
    "raw": ["01_raw"],
    "intermediate": ["02_intermediate"],
    "primary": ["03_primary"],
    "feature": ["04_feature"],
    "model_input": ["05_model_input"],
    "models": ["06_models"],
    "model_output": ["07_model_output"],
    "reporting": ["08_reporting"],
}

# Configure the OmegaConfigLoader
CONFIG_LOADER_CLASS = OmegaConfigLoader
CONFIG_LOADER_ARGS = {
    "base_env": "base",
    "default_run_env": "local",
}
`;
}

/**
 * Generate pipeline __init__.py
 */
export function generatePipelineInit(pipelineName: string): string {
  return `"""
${pipelineName} pipeline.
"""

from .pipeline import create_pipeline

__all__ = ["create_pipeline"]
`;
}
