/**
 * @vitest-environment node
 */
import { describe, it, expect } from 'vitest';
import datasetsReducer, { addDataset, updateDataset, deleteDataset, selectDataset, clearDatasets } from './datasetsSlice';
import { DatasetsState } from '../../types/redux';
import { KedroDataset } from '../../types/kedro';

describe('datasetsSlice', () => {
  const initialState: DatasetsState = {
    byId: {},
    allIds: [],
    selected: null,
  };

  const mockDataset: KedroDataset = {
    id: 'dataset-1',
    name: 'raw_data',
    type: 'csv',
    filepath: 'data/01_raw/raw_data.csv',
    position: { x: 100, y: 200 },
  };

  describe('addDataset', () => {
    it('should add dataset to empty state', () => {
      const state = datasetsReducer(initialState, addDataset(mockDataset));

      expect(state.allIds).toHaveLength(1);
      expect(state.allIds).toContain('dataset-1');
      expect(state.byId['dataset-1']).toEqual(mockDataset);
    });

    it('should add multiple datasets', () => {
      let state = datasetsReducer(initialState, addDataset(mockDataset));
      const mockDataset2 = { ...mockDataset, id: 'dataset-2', name: 'processed_data' };
      state = datasetsReducer(state, addDataset(mockDataset2));

      expect(state.allIds).toHaveLength(2);
      expect(state.byId['dataset-2']).toBeDefined();
    });

    it('should not duplicate dataset IDs', () => {
      let state = datasetsReducer(initialState, addDataset(mockDataset));
      state = datasetsReducer(state, addDataset(mockDataset));

      expect(state.allIds).toHaveLength(1);
    });
  });

  describe('updateDataset', () => {
    it('should update dataset properties', () => {
      const stateWithDataset = {
        ...initialState,
        byId: { 'dataset-1': mockDataset },
        allIds: ['dataset-1'],
      };

      const state = datasetsReducer(
        stateWithDataset,
        updateDataset({ id: 'dataset-1', changes: { name: 'updated_data', versioned: true } })
      );

      expect(state.byId['dataset-1'].name).toBe('updated_data');
      expect(state.byId['dataset-1'].versioned).toBe(true);
      expect(state.byId['dataset-1'].type).toBe('csv'); // Other props unchanged
    });

    it('should handle updating non-existent dataset', () => {
      const state = datasetsReducer(
        initialState,
        updateDataset({ id: 'non-existent', changes: { name: 'test' } })
      );

      expect(state).toEqual(initialState);
    });
  });

  describe('deleteDataset', () => {
    it('should remove dataset from state', () => {
      const stateWithDataset = {
        ...initialState,
        byId: { 'dataset-1': mockDataset },
        allIds: ['dataset-1'],
      };

      const state = datasetsReducer(stateWithDataset, deleteDataset('dataset-1'));

      expect(state.allIds).toHaveLength(0);
      expect(state.byId['dataset-1']).toBeUndefined();
    });

    it('should clear selected if deleted dataset was selected', () => {
      const stateWithDataset = {
        ...initialState,
        byId: { 'dataset-1': mockDataset },
        allIds: ['dataset-1'],
        selected: 'dataset-1',
      };

      const state = datasetsReducer(stateWithDataset, deleteDataset('dataset-1'));

      expect(state.selected).toBeNull();
    });
  });

  describe('selectDataset', () => {
    it('should select dataset', () => {
      const state = datasetsReducer(initialState, selectDataset('dataset-1'));

      expect(state.selected).toBe('dataset-1');
    });

    it('should clear selection with null', () => {
      const stateWithSelection = {
        ...initialState,
        selected: 'dataset-1',
      };

      const state = datasetsReducer(stateWithSelection, selectDataset(null));

      expect(state.selected).toBeNull();
    });
  });

  describe('clearDatasets', () => {
    it('should clear all datasets and selection', () => {
      const stateWithData = {
        byId: {
          'dataset-1': mockDataset,
          'dataset-2': { ...mockDataset, id: 'dataset-2' },
        },
        allIds: ['dataset-1', 'dataset-2'],
        selected: 'dataset-1',
      };

      const state = datasetsReducer(stateWithData, clearDatasets());

      expect(state.allIds).toHaveLength(0);
      expect(Object.keys(state.byId)).toHaveLength(0);
      expect(state.selected).toBeNull();
    });
  });
});
