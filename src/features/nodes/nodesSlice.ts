import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { NodesState } from '../../types/redux';
import { KedroNode, NodeType } from '../../types/kedro';

const initialState: NodesState = {
  byId: {},
  allIds: [],
  selected: [],  // Array for multi-select
  hovered: null,
};

const nodesSlice = createSlice({
  name: 'nodes',
  initialState,
  reducers: {
    addNode: (state, action: PayloadAction<{ type: NodeType; position: { x: number; y: number } }>) => {
      const id = `node-${Date.now()}`;
      const newNode: KedroNode = {
        id,
        name: 'Unnamed Node',
        type: action.payload.type,
        inputs: [],
        outputs: [],
        position: action.payload.position,
      };
      state.byId[id] = newNode;
      state.allIds.push(id);
    },
    updateNode: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<KedroNode> }>
    ) => {
      const { id, changes } = action.payload;
      if (state.byId[id]) {
        state.byId[id] = {
          ...state.byId[id],
          ...changes,
        };
      }
    },
    updateNodePosition: (
      state,
      action: PayloadAction<{ id: string; position: { x: number; y: number } }>
    ) => {
      const { id, position } = action.payload;
      if (state.byId[id]) {
        state.byId[id].position = position;
      }
    },
    deleteNode: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      delete state.byId[id];
      state.allIds = state.allIds.filter((nodeId) => nodeId !== id);
      // Remove from selected array
      state.selected = state.selected.filter((nodeId) => nodeId !== id);
      if (state.hovered === id) {
        state.hovered = null;
      }
    },
    deleteNodes: (state, action: PayloadAction<string[]>) => {
      const ids = action.payload;
      ids.forEach((id) => {
        delete state.byId[id];
        state.allIds = state.allIds.filter((nodeId) => nodeId !== id);
        state.selected = state.selected.filter((nodeId) => nodeId !== id);
      });
      if (ids.includes(state.hovered || '')) {
        state.hovered = null;
      }
    },
    selectNode: (state, action: PayloadAction<string>) => {
      // Single selection - replace all
      state.selected = [action.payload];
    },
    toggleNodeSelection: (state, action: PayloadAction<string>) => {
      // Multi-select toggle
      const id = action.payload;
      if (state.selected.includes(id)) {
        state.selected = state.selected.filter((nodeId) => nodeId !== id);
      } else {
        state.selected.push(id);
      }
    },
    selectNodes: (state, action: PayloadAction<string[]>) => {
      // Set multiple selected
      state.selected = action.payload;
    },
    clearSelection: (state) => {
      state.selected = [];
    },
    hoverNode: (state, action: PayloadAction<string | null>) => {
      state.hovered = action.payload;
    },
  },
});

export const {
  addNode,
  updateNode,
  updateNodePosition,
  deleteNode,
  deleteNodes,
  selectNode,
  toggleNodeSelection,
  selectNodes,
  clearSelection,
  hoverNode,
} = nodesSlice.actions;

export default nodesSlice.reducer;
