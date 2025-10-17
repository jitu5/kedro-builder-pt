/**
 * Core Kedro Builder type definitions
 * These types represent the domain model for Kedro pipelines
 */

export type NodeType =
  | 'data_ingestion'
  | 'data_processing'
  | 'model_training'
  | 'model_evaluation'
  | 'custom';

export type DatasetType =
  | 'csv'
  | 'parquet'
  | 'json'
  | 'excel'
  | 'pickle'
  | 'memory'
  | 'sql';

export type DataLayer =
  | '01_raw'
  | '02_intermediate'
  | '03_primary'
  | '04_feature'
  | '05_model_input'
  | '06_models'
  | '07_model_output'
  | '08_reporting';

export interface KedroProject {
  id: string;
  name: string;
  description: string;
  pythonPackage: string;
  pipelineName: string;
  createdAt: number;
  updatedAt: number;
}

export interface KedroNode {
  id: string;
  name: string;
  type: NodeType;
  inputs: string[];
  outputs: string[];
  functionCode?: string;
  description?: string;
  parameters?: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface KedroDataset {
  id: string;
  name: string;
  type: DatasetType;
  filepath?: string;
  layer?: DataLayer;
  catalogConfig?: Record<string, unknown>;
  description?: string;
  position: { x: number; y: number };
}

export interface KedroConnection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  datasetName?: string;
}

export interface ValidationError {
  id: string;
  severity: 'error' | 'warning';
  componentId: string;
  componentType: 'node' | 'dataset' | 'connection' | 'pipeline';
  field?: string;
  message: string;
  suggestion?: string;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  updatedAt: number;
  storageType: 'localStorage' | 'indexedDB';
}
