import { RootState } from '../../store';
import { KedroNode } from '../../types/kedro';

export const selectAllNodes = (state: RootState): KedroNode[] => {
  return state.nodes.allIds.map((id) => state.nodes.byId[id]);
};

export const selectNodeById = (state: RootState, nodeId: string): KedroNode | undefined => {
  return state.nodes.byId[nodeId];
};

export const selectSelectedNode = (state: RootState): KedroNode | null => {
  const selectedId = state.nodes.selected;
  return selectedId ? state.nodes.byId[selectedId] : null;
};

export const selectNodesCount = (state: RootState): number => {
  return state.nodes.allIds.length;
};
