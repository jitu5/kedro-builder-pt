/**
 * Redux middleware for auto-saving project state to localStorage
 */

import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '../../types/redux';
import { saveProjectToLocalStorage } from '../../utils/localStorage';

// Debounce timer
let saveTimeout: NodeJS.Timeout | null = null;
const DEBOUNCE_DELAY = 500; // 500ms delay before saving

/**
 * Actions that trigger auto-save
 */
const SAVE_TRIGGER_ACTIONS = [
  // Project actions
  'project/createProject',
  'project/updateProject',

  // Node actions
  'nodes/addNode',
  'nodes/updateNode',
  'nodes/updateNodePosition',
  'nodes/deleteNode',
  'nodes/deleteNodes',

  // Dataset actions
  'datasets/addDataset',
  'datasets/updateDataset',
  'datasets/updateDatasetPosition',
  'datasets/deleteDataset',

  // Connection actions
  'connections/addConnection',
  'connections/deleteConnection',
  'connections/deleteConnections',
];

/**
 * Auto-save middleware
 * Debounces saves to avoid excessive localStorage writes
 */
export const autoSaveMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);

  // Check if this action should trigger a save
  const shouldSave = SAVE_TRIGGER_ACTIONS.some(trigger =>
    action.type.startsWith(trigger)
  );

  if (shouldSave) {
    // Clear existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set new timeout for debounced save
    saveTimeout = setTimeout(() => {
      const state = store.getState();
      saveProjectToLocalStorage(state);
      console.log('📦 Project auto-saved to localStorage');
    }, DEBOUNCE_DELAY);
  }

  return result;
};
