import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { Node, Edge, NodeMouseHandler } from '@xyflow/react';
import { useAppDispatch } from '../../../store/hooks';
import {
  addNode,
  updateNodePosition,
  selectNode,
  toggleNodeSelection,
  clearSelection,
  deleteNodes,
} from '../../../features/nodes/nodesSlice';
import {
  addDataset,
  updateDatasetPosition,
  deleteDataset,
} from '../../../features/datasets/datasetsSlice';
import { openConfigPanel, closeConfigPanel, setPendingComponent } from '../../../features/ui/uiSlice';
import { clearConnectionSelection } from '../../../features/connections/connectionsSlice';
import type { NodeType, DatasetType } from '../../../types/kedro';

interface NodeHandlersProps {
  onNodesChange: (changes: any[]) => void;
  setIsDraggingOver: React.Dispatch<React.SetStateAction<boolean>>;
  isDraggingOver: boolean;
  isEmpty: boolean;
}

/**
 * Custom hook for handling node-related events (CRUD operations)
 */
export const useNodeHandlers = ({ onNodesChange, setIsDraggingOver, isDraggingOver, isEmpty }: NodeHandlersProps) => {
  const dispatch = useAppDispatch();
  const { screenToFlowPosition } = useReactFlow();

  // Handle ReactFlow node deletion (triggered by Delete key via ReactFlow)
  const handleNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      console.log('[Delete] Nodes to delete:', nodesToDelete.map((n) => n.id));

      // Show confirmation dialog for multi-delete
      if (nodesToDelete.length > 1) {
        const confirmMessage = `Delete ${nodesToDelete.length} selected items? This cannot be undone.`;
        if (!window.confirm(confirmMessage)) {
          return; // User cancelled
        }
      }

      // Separate nodes and datasets
      const nodeIdsToDelete: string[] = [];
      const datasetIdsToDelete: string[] = [];

      nodesToDelete.forEach((node) => {
        if (node.id.startsWith('node-')) {
          nodeIdsToDelete.push(node.id);
        } else if (node.id.startsWith('dataset-')) {
          datasetIdsToDelete.push(node.id);
        }
      });

      // Delete nodes (all at once)
      if (nodeIdsToDelete.length > 0) {
        console.log('[Delete] Deleting nodes:', nodeIdsToDelete);
        dispatch(deleteNodes(nodeIdsToDelete));
      }

      // Delete datasets (one by one - since deleteDataset takes a single ID)
      if (datasetIdsToDelete.length > 0) {
        console.log('[Delete] Deleting datasets:', datasetIdsToDelete);
        datasetIdsToDelete.forEach((id) => {
          dispatch(deleteDataset(id));
        });
      }

      // Clear selection and close config panel after deletion
      dispatch(clearSelection());
      dispatch(closeConfigPanel());
    },
    [dispatch]
  );

  // Sync position changes to Redux (immediate for smooth edges)
  const handleNodesChange = useCallback(
    (changes: any[]) => {
      onNodesChange(changes);

      // Update Redux immediately during and after dragging for smooth edge rendering
      changes.forEach((change: any) => {
        if (change.type === 'position' && change.position) {
          // Determine if it's a node or dataset based on ID prefix
          if (change.id.startsWith('node-')) {
            dispatch(
              updateNodePosition({
                id: change.id,
                position: change.position,
              })
            );
          } else if (change.id.startsWith('dataset-')) {
            dispatch(
              updateDatasetPosition({
                id: change.id,
                position: change.position,
              })
            );
          }
        }
      });
    },
    [onNodesChange, dispatch]
  );

  // Handle drop from sidebar (both nodes and datasets)
  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      // Reset dragging state
      setIsDraggingOver(false);

      // Check for node drop
      const nodeType = event.dataTransfer.getData('application/kedro-builder');
      const datasetType = event.dataTransfer.getData('application/kedro-builder-dataset');

      if (!nodeType && !datasetType) return;

      // Clear any existing selection before adding new component
      dispatch(clearSelection());
      dispatch(clearConnectionSelection());

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (nodeType) {
        // Drop processing node
        const newNodeId = `node-${Date.now()}`;
        dispatch(
          addNode({
            type: nodeType as NodeType,
            position,
          })
        );

        // Mark as pending (needs to be saved before staying on canvas)
        dispatch(setPendingComponent({ type: 'node', id: newNodeId }));

        // Auto-select and open config panel for the new node
        setTimeout(() => {
          dispatch(selectNode(newNodeId));
          dispatch(openConfigPanel({ type: 'node', id: newNodeId }));
        }, 10);
      } else if (datasetType) {
        // Drop dataset
        const newDatasetId = `dataset-${Date.now()}`;
        dispatch(
          addDataset({
            name: '',
            type: datasetType as DatasetType,
            position,
          })
        );

        // Mark as pending (needs to be saved before staying on canvas)
        dispatch(setPendingComponent({ type: 'dataset', id: newDatasetId }));

        // Auto-select and open config panel for the new dataset
        setTimeout(() => {
          dispatch(selectNode(newDatasetId));
          dispatch(openConfigPanel({ type: 'dataset', id: newDatasetId }));
        }, 10);
      }
    },
    [screenToFlowPosition, dispatch, setIsDraggingOver]
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent) => {
      // Only reset if leaving the main canvas container
      if (event.currentTarget === event.target) {
        setIsDraggingOver(false);
      }
    },
    [setIsDraggingOver]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';

      // Set dragging state for visual feedback on empty canvas
      if (isEmpty && !isDraggingOver) {
        setIsDraggingOver(true);
      }
    },
    [isEmpty, isDraggingOver, setIsDraggingOver]
  );

  // Handle node click with multi-select support
  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      console.log('[Node Click] Clicked on node:', node.id);
      // Check for modifier keys (Cmd/Ctrl for multi-select)
      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        event.stopPropagation();
        dispatch(toggleNodeSelection(node.id));
      } else {
        // Single click - clear others and select this one
        dispatch(selectNode(node.id));
        console.log('[Node Click] Dispatched selectNode for:', node.id);

        // Open config panel based on node type
        if (node.type === 'kedroNode') {
          console.log('[Node Click] Opening node config panel');
          dispatch(openConfigPanel({ type: 'node', id: node.id }));
        } else if (node.type === 'datasetNode') {
          console.log('[Node Click] Opening dataset config panel');
          dispatch(openConfigPanel({ type: 'dataset', id: node.id }));
        }
      }
    },
    [dispatch]
  );

  return {
    handleNodesDelete,
    handleNodesChange,
    handleDrop,
    handleDragLeave,
    handleDragOver,
    handleNodeClick,
  };
};
