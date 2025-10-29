import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { RootState } from '../../store/store';
import nodesReducer from '../../features/nodes/nodesSlice';
import datasetsReducer from '../../features/datasets/datasetsSlice';
import connectionsReducer from '../../features/connections/connectionsSlice';
import uiReducer from '../../features/ui/uiSlice';
import projectReducer from '../../features/project/projectSlice';
import validationReducer from '../../features/validation/validationSlice';
import appReducer from '../../features/app/appSlice';

/**
 * Creates a mock Redux store for testing
 * @param preloadedState - Initial state to populate the store
 * @returns Configured Redux store
 */
export function createMockStore(preloadedState?: PreloadedState<RootState>) {
  return configureStore({
    reducer: {
      nodes: nodesReducer,
      datasets: datasetsReducer,
      connections: connectionsReducer,
      ui: uiReducer,
      project: projectReducer,
      validation: validationReducer,
      app: appReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
}

/**
 * Creates a minimal valid state for testing
 */
export function createMockState(overrides?: Partial<RootState>): PreloadedState<RootState> {
  return {
    nodes: {
      byId: {},
      allIds: [],
    },
    datasets: {
      byId: {},
      allIds: [],
    },
    connections: {
      byId: {},
      allIds: [],
    },
    ui: {
      selectedNodeIds: [],
      selectedDatasetIds: [],
      isPanMode: false,
      zoom: 1,
      showMiniMap: true,
      showControls: true,
      sidebarTab: 'nodes',
    },
    project: {
      name: 'Test Project',
      description: '',
      pythonVersion: '3.10',
      kedroVersion: '0.19.0',
    },
    validation: {
      errors: [],
      warnings: [],
    },
    app: {
      theme: 'light',
      isWalkthroughComplete: false,
      showWalkthrough: false,
    },
    ...overrides,
  };
}
