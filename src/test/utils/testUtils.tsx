import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { RootState, store } from '../../store/store';
import nodesReducer from '../../features/nodes/nodesSlice';
import datasetsReducer from '../../features/datasets/datasetsSlice';
import connectionsReducer from '../../features/connections/connectionsSlice';
import uiReducer from '../../features/ui/uiSlice';
import projectReducer from '../../features/project/projectSlice';
import validationReducer from '../../features/validation/validationSlice';
import appReducer from '../../features/app/appSlice';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>;
  store?: typeof store;
}

/**
 * Custom render function that wraps components with Redux Provider
 * and other necessary providers for testing
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = configureStore({
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
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Re-export everything
export * from '@testing-library/react';
export { renderWithProviders as render };
