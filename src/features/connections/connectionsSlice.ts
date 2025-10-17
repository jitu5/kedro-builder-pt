import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ConnectionsState } from '../../types/redux';
import { KedroConnection } from '../../types/kedro';

const initialState: ConnectionsState = {
  byId: {},
  allIds: [],
  selected: [],  // Array for multi-select
};

const connectionsSlice = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    addConnection: (state, action: PayloadAction<KedroConnection>) => {
      const connection = action.payload;
      state.byId[connection.id] = connection;
      // Only add to allIds if it doesn't already exist
      if (!state.allIds.includes(connection.id)) {
        state.allIds.push(connection.id);
      }
    },
    updateConnection: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<KedroConnection> }>
    ) => {
      const { id, changes } = action.payload;
      if (state.byId[id]) {
        state.byId[id] = {
          ...state.byId[id],
          ...changes,
        };
      }
    },
    deleteConnection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.byId[id];
      state.allIds = state.allIds.filter((connId) => connId !== id);
      state.selected = state.selected.filter((connId) => connId !== id);
    },
    deleteConnections: (state, action: PayloadAction<string[]>) => {
      const ids = action.payload;
      ids.forEach((id) => {
        delete state.byId[id];
        state.allIds = state.allIds.filter((connId) => connId !== id);
        state.selected = state.selected.filter((connId) => connId !== id);
      });
    },
    selectConnection: (state, action: PayloadAction<string>) => {
      // Single selection
      state.selected = [action.payload];
    },
    toggleConnectionSelection: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.selected.includes(id)) {
        state.selected = state.selected.filter((connId) => connId !== id);
      } else {
        state.selected.push(id);
      }
    },
    clearConnectionSelection: (state) => {
      state.selected = [];
    },
    clearConnections: (state) => {
      state.byId = {};
      state.allIds = [];
      state.selected = [];
    },
  },
});

export const {
  addConnection,
  updateConnection,
  deleteConnection,
  deleteConnections,
  selectConnection,
  toggleConnectionSelection,
  clearConnectionSelection,
  clearConnections,
} = connectionsSlice.actions;

export default connectionsSlice.reducer;
