import type { RootState } from '../../store';
import type { KedroNode } from '../../types/kedro';

export const selectAllNodes = (state: RootState): KedroNode[] => {
  return state.nodes.allIds.map((id) => state.nodes.byId[id]);
};

export const selectNodeById = (state: RootState, nodeId: string): KedroNode | undefined => {
  return state.nodes.byId[nodeId];
};

export const selectSelectedNode = (state: RootState): KedroNode | null => {
  const selectedIds = state.nodes.selected;
  return selectedIds.length > 0 ? state.nodes.byId[selectedIds[0]] : null;
};

export const selectNodesCount = (state: RootState): number => {
  return state.nodes.allIds.length;
};
