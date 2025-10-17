import { RootState } from '../../store';
import { KedroConnection } from '../../types/kedro';

export const selectAllConnections = (state: RootState): KedroConnection[] => {
  return state.connections.allIds.map((id) => state.connections.byId[id]);
};

export const selectConnectionById = (state: RootState, connectionId: string): KedroConnection | undefined => {
  return state.connections.byId[connectionId];
};

export const selectConnectionsCount = (state: RootState): number => {
  return state.connections.allIds.length;
};
