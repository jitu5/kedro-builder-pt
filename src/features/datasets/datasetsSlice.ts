import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DatasetsState } from '../../types/redux';
import { KedroDataset } from '../../types/kedro';

const initialState: DatasetsState = {
  byId: {},
  allIds: [],
  selected: null,
};

const datasetsSlice = createSlice({
  name: 'datasets',
  initialState,
  reducers: {
    addDataset: (state, action: PayloadAction<Omit<KedroDataset, 'id'>>) => {
      const id = `dataset-${Date.now()}`;
      const newDataset: KedroDataset = {
        id,
        ...action.payload,
      };
      state.byId[id] = newDataset;
      state.allIds.push(id);
    },
    updateDataset: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<KedroDataset> }>
    ) => {
      const { id, changes } = action.payload;
      if (state.byId[id]) {
        state.byId[id] = {
          ...state.byId[id],
          ...changes,
        };
      }
    },
    updateDatasetPosition: (
      state,
      action: PayloadAction<{ id: string; position: { x: number; y: number } }>
    ) => {
      const { id, position } = action.payload;
      if (state.byId[id]) {
        state.byId[id].position = position;
      }
    },
    deleteDataset: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.byId[id];
      state.allIds = state.allIds.filter((datasetId) => datasetId !== id);
      if (state.selected === id) {
        state.selected = null;
      }
    },
    selectDataset: (state, action: PayloadAction<string | null>) => {
      state.selected = action.payload;
    },
  },
});

export const {
  addDataset,
  updateDataset,
  updateDatasetPosition,
  deleteDataset,
  selectDataset,
} = datasetsSlice.actions;

export default datasetsSlice.reducer;
