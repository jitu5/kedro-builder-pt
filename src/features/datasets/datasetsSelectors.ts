import { RootState } from '../../store';
import { KedroDataset } from '../../types/kedro';

export const selectAllDatasets = (state: RootState): KedroDataset[] => {
  return state.datasets.allIds.map((id) => state.datasets.byId[id]);
};

export const selectDatasetById = (state: RootState, datasetId: string): KedroDataset | undefined => {
  return state.datasets.byId[datasetId];
};

export const selectSelectedDataset = (state: RootState): KedroDataset | null => {
  const selectedId = state.datasets.selected;
  return selectedId ? state.datasets.byId[selectedId] : null;
};

export const selectDatasetsCount = (state: RootState): number => {
  return state.datasets.allIds.length;
};
