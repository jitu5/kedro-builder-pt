import { useCallback, useMemo, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionMode,
  BackgroundVariant,
} from '@xyflow/react';
import type {
  Connection,
  Edge,
  Node,
  OnSelectionChangeParams,
  EdgeMouseHandler,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  addNode,
  updateNodePosition,
  selectNode,
  toggleNodeSelection,
  clearSelection,
  deleteNodes,
  selectNodes,
} from '../../features/nodes/nodesSlice';
import {
  addDataset,
  updateDatasetPosition,
  deleteDataset,
} from '../../features/datasets/datasetsSlice';
import {
  addConnection,
  selectConnection,
  clearConnectionSelection,
  deleteConnections,
} from '../../features/connections/connectionsSlice';
import { openConfigPanel, closeConfigPanel, setPendingComponent } from '../../features/ui/uiSlice';
import { selectAllNodes } from '../../features/nodes/nodesSelectors';
import { selectAllDatasets } from '../../features/datasets/datasetsSelectors';
import { selectAllConnections } from '../../features/connections/connectionsSelectors';

import { CustomNode } from './CustomNode/CustomNode';
import { DatasetNode } from './DatasetNode/DatasetNode';
import { CustomEdge } from './CustomEdge/CustomEdge';
import { BulkActionsToolbar } from './BulkActionsToolbar/BulkActionsToolbar';
import { EmptyState } from './EmptyState/EmptyState';
import type { NodeType, DatasetType } from '../../types/kedro';

import './PipelineCanvas.scss';

const nodeTypes = {
  kedroNode: CustomNode,
  datasetNode: DatasetNode,
};

const edgeTypes = {
  kedroEdge: CustomEdge,
};

interface PipelineCanvasProps {
  exportWizardOpen?: boolean;
}

const PipelineCanvasInner = ({ exportWizardOpen = false }: PipelineCanvasProps) => {
  const dispatch = useAppDispatch();
  const { screenToFlowPosition, fitView, getNode } = useReactFlow();

  // Get data from Redux
  const reduxNodes = useAppSelector(selectAllNodes);
  const reduxDatasets = useAppSelector(selectAllDatasets);
  const reduxConnections = useAppSelector(selectAllConnections);
  const selectedNodeIds = useAppSelector((state) => state.nodes.selected);
  const selectedEdgeIds = useAppSelector((state) => state.connections.selected);
  const theme = useAppSelector((state) => state.theme.theme);

  // Check if canvas is empty
  const isEmpty = reduxNodes.length === 0 && reduxDatasets.length === 0;

  // Track dragging state for empty canvas visual feedback
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Track spacebar press for pan mode (like Figma)
  const [isPanMode, setIsPanMode] = useState(false);

  // Ref for ReactFlow wrapper to handle focus
  const reactFlowWrapper = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      // Auto-focus the ReactFlow container so keyboard events work
      node.focus();
    }
  }, []);

  // Convert Redux nodes to ReactFlow nodes with selection state
  const initialNodes = useMemo(
    () => {
      const nodes = reduxNodes.map((node) => ({
        id: node.id,
        type: 'kedroNode' as const,
        position: node.position,
        data: node,
        selected: selectedNodeIds.includes(node.id),
        draggable: true,
      }));

      const datasets = reduxDatasets.map((dataset) => ({
        id: dataset.id,
        type: 'datasetNode' as const,
        position: dataset.position,
        data: dataset,
        selected: selectedNodeIds.includes(dataset.id),
        draggable: true,
      }));

      return [...nodes, ...datasets];
    },
    [reduxNodes, reduxDatasets, selectedNodeIds]
  );

  // Convert Redux connections to ReactFlow edges with selection state
  const initialEdges = useMemo(
    () =>
      reduxConnections.map((conn) => ({
        id: conn.id,
        source: conn.source,
        target: conn.target,
        sourceHandle: conn.sourceHandle,
        targetHandle: conn.targetHandle,
        type: 'kedroEdge',
        animated: true,
        data: conn,
        selected: selectedEdgeIds.includes(conn.id),
        markerEnd: {
          type: 'arrowclosed' as const,
          width: 12,
          height: 12,
          color: selectedEdgeIds.includes(conn.id) ? 'var(--color-primary)' : 'var(--color-connection)',
        },
        style: {
          strokeWidth: selectedEdgeIds.includes(conn.id) ? 4 : 3,
          stroke: selectedEdgeIds.includes(conn.id) ? 'var(--color-primary)' : 'var(--color-connection)',
          strokeDasharray: '5, 5',
        },
      })),
    [reduxConnections, selectedEdgeIds]
  );

  // Local ReactFlow state (for performance)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync Redux nodes to ReactFlow when Redux changes
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  // Sync Redux edges to ReactFlow when Redux changes
  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Auto-close config panel when all components are deleted from canvas
  const showConfigPanel = useAppSelector((state) => state.ui.showConfigPanel);
  useEffect(() => {
    // If config panel is open but there are no nodes or datasets, close it
    if (showConfigPanel && reduxNodes.length === 0 && reduxDatasets.length === 0) {
      dispatch(closeConfigPanel());
    }
  }, [showConfigPanel, reduxNodes.length, reduxDatasets.length, dispatch]);

  // Handle ReactFlow node deletion (triggered by Delete key via ReactFlow)
  const handleNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      console.log('[Delete] Nodes to delete:', nodesToDelete.map(n => n.id));

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

  // Handle ReactFlow edge deletion (triggered by Delete key via ReactFlow)
  const handleEdgesDelete = useCallback(
    (edgesToDelete: Edge[]) => {
      console.log('[Delete] Edges to delete:', edgesToDelete.map(e => e.id));

      // Show confirmation dialog for multi-delete
      if (edgesToDelete.length > 1) {
        const confirmMessage = `Delete ${edgesToDelete.length} selected connections? This cannot be undone.`;
        if (!window.confirm(confirmMessage)) {
          return; // User cancelled
        }
      }

      const edgeIds = edgesToDelete.map(edge => edge.id);
      if (edgeIds.length > 0) {
        dispatch(deleteConnections(edgeIds));
        dispatch(clearConnectionSelection());
      }
    },
    [dispatch]
  );

  // Handle keyboard shortcuts (Escape, Cmd+A, and Spacebar for pan mode)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input, textarea, or contentEditable element
      const target = event.target as HTMLElement;
      const isEditableElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true';

      // Spacebar - enable pan mode (like Figma)
      // BUT: Don't intercept if user is typing in an editable field
      if (event.code === 'Space' && !isPanMode && !isEditableElement) {
        event.preventDefault();
        setIsPanMode(true);
      }

      // Escape key - clear selection and close config panel
      if (event.key === 'Escape') {
        dispatch(clearSelection());
        dispatch(clearConnectionSelection());
        dispatch(closeConfigPanel());
      }

      // Cmd/Ctrl + A - select all
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        event.preventDefault();
        const allNodeIds = [...reduxNodes.map((n) => n.id), ...reduxDatasets.map((d) => d.id)];
        dispatch(selectNodes(allNodeIds));
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Spacebar released - disable pan mode
      if (event.code === 'Space' && isPanMode) {
        setIsPanMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch, reduxNodes, reduxDatasets, isPanMode]);

  // Listen for focus node event from validation panel
  useEffect(() => {
    const handleFocusNode = (event: any) => {
      const { nodeId } = event.detail;
      const node = getNode(nodeId);
      if (node) {
        // Center the node in view with animation
        fitView({
          nodes: [node],
          duration: 800,
          padding: 0.3,
        });
      }
    };

    window.addEventListener('focusNode', handleFocusNode);
    return () => {
      window.removeEventListener('focusNode', handleFocusNode);
    };
  }, [fitView, getNode]);

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

  // Handle new connections
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const newEdge: Edge = {
        id: `${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || 'output',
        targetHandle: connection.targetHandle || 'input',
        type: 'kedroEdge',
        animated: true,
        markerEnd: {
          type: 'arrowclosed',
          width: 12,
          height: 12,
        },
        style: {
          strokeDasharray: '5, 5',
        },
      };

      setEdges((eds) => addEdge(newEdge, eds) as any);

      // Save to Redux
      dispatch(
        addConnection({
          id: newEdge.id,
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle || 'output',
          targetHandle: connection.targetHandle || 'input',
        })
      );
    },
    [setEdges, dispatch]
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
    [screenToFlowPosition, dispatch]
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    // Only reset if leaving the main canvas container
    if (event.currentTarget === event.target) {
      setIsDraggingOver(false);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';

    // Set dragging state for visual feedback on empty canvas
    if (isEmpty && !isDraggingOver) {
      setIsDraggingOver(true);
    }
  }, [isEmpty, isDraggingOver]);

  // Handle node click with multi-select support
  const handleNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
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

  // Handle edge click - select edge to show BulkActionsToolbar
  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (event, edge) => {
      event.stopPropagation();

      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        // Multi-select edge (adds to selection)
        dispatch(selectConnection(edge.id));
      } else {
        // Single select edge (clears other selections and closes config panel)
        dispatch(clearSelection());
        dispatch(closeConfigPanel());
        dispatch(selectConnection(edge.id));
      }
      // BulkActionsToolbar will automatically show when edge is selected
    },
    [dispatch]
  );

  // Bulk actions handlers
  const handleBulkDelete = useCallback(() => {
    const totalSelected = selectedNodeIds.length + selectedEdgeIds.length;

    // Show confirmation dialog for bulk delete
    if (totalSelected > 1) {
      const confirmMessage = `Delete ${totalSelected} selected items? This cannot be undone.`;
      if (!window.confirm(confirmMessage)) {
        return; // User cancelled
      }
    }

    if (selectedNodeIds.length > 0) {
      selectedNodeIds.forEach((id) => {
        if (id.startsWith('node-')) {
          dispatch(deleteNodes([id]));
        } else if (id.startsWith('dataset-')) {
          dispatch(deleteDataset(id));
        }
      });
      dispatch(clearSelection());
    }
    if (selectedEdgeIds.length > 0) {
      dispatch(deleteConnections(selectedEdgeIds));
      dispatch(clearConnectionSelection());
    }
  }, [dispatch, selectedNodeIds, selectedEdgeIds]);

  const handleBulkClear = useCallback(() => {
    dispatch(clearSelection());
    dispatch(clearConnectionSelection());
  }, [dispatch]);

  // Determine selection type for bulk actions
  const selectionType = useMemo(() => {
    if (selectedNodeIds.length > 0 && selectedEdgeIds.length > 0) return 'mixed';
    if (selectedNodeIds.length > 0) return 'nodes';
    if (selectedEdgeIds.length > 0) return 'edges';
    return 'nodes';
  }, [selectedNodeIds, selectedEdgeIds]);

  const totalSelected = selectedNodeIds.length + selectedEdgeIds.length;

  // Handle canvas click (clear selection and close config panel)
  const handlePaneClick = useCallback(() => {
    console.log('[Pane Click] Clearing selection and closing config panel');
    dispatch(clearSelection());
    dispatch(clearConnectionSelection());
    dispatch(closeConfigPanel());
  }, [dispatch]);

  // Handle selection change from ReactFlow (box selection)
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      // Disable selection when export wizard is open
      if (exportWizardOpen) {
        return;
      }

      const nodeIds = selectedNodes.map((n) => n.id);

      if (nodeIds.length > 0) {
        dispatch(selectNodes(nodeIds));
      }
      // Don't clear selection here - let pane click handle it
    },
    [dispatch, exportWizardOpen]
  );

  // Get node color for minimap
  const getNodeColor = (node: Node) => {
    if (node.type === 'datasetNode') {
      return 'var(--color-dataset)';
    }

    const colors = {
      data_ingestion: 'var(--color-node-data-ingestion)',
      data_processing: 'var(--color-node-data-processing)',
      model_training: 'var(--color-node-model-training)',
      model_evaluation: 'var(--color-node-model-evaluation)',
      custom: 'var(--color-node-custom)',
    };
    return colors[node.data?.type as keyof typeof colors] || '#999';
  };

  return (
    <div
      className={`pipeline-canvas ${isPanMode ? 'pipeline-canvas--pan-mode' : ''}`}
      ref={reactFlowWrapper}
      tabIndex={0}
      style={{ outline: 'none' }}
      onDragLeave={handleDragLeave}
    >
      {/* Empty State - Show when no nodes or datasets */}
      {isEmpty && <EmptyState isDragging={isDraggingOver} />}

      {/* Bulk Actions Toolbar - Shows when nodes/datasets/edges are selected */}
      <BulkActionsToolbar
        selectedCount={totalSelected}
        selectedType={selectionType}
        onDelete={handleBulkDelete}
        onClear={handleBulkClear}
      />

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodesDelete={handleNodesDelete}
        onEdgesDelete={handleEdgesDelete}
        onConnect={handleConnect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        selectNodesOnDrag={false}
        panOnDrag={isPanMode ? true : [2]}
        selectionOnDrag={!isPanMode && !exportWizardOpen}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        zoomOnDoubleClick={false}
        multiSelectionKeyCode={exportWizardOpen ? null : ['Meta', 'Control', 'Shift']}
        deleteKeyCode={['Delete', 'Backspace']}
        defaultEdgeOptions={{
          animated: true,  // Enable animated dotted lines
          style: {
            strokeWidth: 3,
            stroke: 'var(--color-connection)',
            strokeDasharray: '5, 5'  // Dotted line pattern
          },
          interactionWidth: 20,  // Make edges easier to click (ReactFlow API)
        }}
        edgesReconnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color={theme === 'dark' ? '#3a3a3a' : '#d0d0d0'}
        />
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          position="bottom-left"
        />
        <MiniMap
          nodeColor={getNodeColor}
          maskColor={theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)'}
          style={{
            background: 'var(--color-bg-2)',
            border: '1px solid var(--color-border-line)',
            borderRadius: '4px',
          }}
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
};

export const PipelineCanvas = ({ exportWizardOpen }: PipelineCanvasProps) => (
  <ReactFlowProvider>
    <PipelineCanvasInner exportWizardOpen={exportWizardOpen} />
  </ReactFlowProvider>
);
