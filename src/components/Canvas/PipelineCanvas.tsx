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
  deleteConnection,
  selectConnection,
  clearConnectionSelection,
  deleteConnections,
} from '../../features/connections/connectionsSlice';
import { openConfigPanel, closeConfigPanel } from '../../features/ui/uiSlice';
import { selectAllNodes } from '../../features/nodes/nodesSelectors';
import { selectAllDatasets } from '../../features/datasets/datasetsSelectors';
import { selectAllConnections } from '../../features/connections/connectionsSelectors';

import { CustomNode } from './CustomNode/CustomNode';
import { DatasetNode } from './DatasetNode/DatasetNode';
import { CustomEdge } from './CustomEdge/CustomEdge';
import { BulkActionsToolbar } from './BulkActionsToolbar/BulkActionsToolbar';
import { EdgeContextMenu } from './EdgeContextMenu/EdgeContextMenu';
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

const PipelineCanvasInner = () => {
  const dispatch = useAppDispatch();
  const { screenToFlowPosition } = useReactFlow();

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

  // Edge context menu state
  const [contextMenu, setContextMenu] = useState<{
    edgeId: string;
    x: number;
    y: number;
  } | null>(null);

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
        // Make edges much easier to click
        style: {
          strokeWidth: 2,
          stroke: selectedEdgeIds.includes(conn.id) ? 'var(--color-primary)' : 'var(--color-connection)',
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

  // Handle ReactFlow node deletion (triggered by Delete key via ReactFlow)
  const handleNodesDelete = useCallback(
    (nodesToDelete: Node[]) => {
      console.log('[Delete] Nodes to delete:', nodesToDelete.map(n => n.id));

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

      const edgeIds = edgesToDelete.map(edge => edge.id);
      if (edgeIds.length > 0) {
        dispatch(deleteConnections(edgeIds));
        dispatch(clearConnectionSelection());
      }
    },
    [dispatch]
  );

  // Handle keyboard shortcuts (Escape and Cmd+A)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape key - clear selection and close config panel
      if (event.key === 'Escape') {
        dispatch(clearSelection());
        dispatch(clearConnectionSelection());
        dispatch(closeConfigPanel());
        setContextMenu(null);
      }

      // Cmd/Ctrl + A - select all
      if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
        event.preventDefault();
        const allNodeIds = [...reduxNodes.map((n) => n.id), ...reduxDatasets.map((d) => d.id)];
        dispatch(selectNodes(allNodeIds));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, reduxNodes, reduxDatasets]);

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

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (nodeType) {
        // Drop processing node
        dispatch(
          addNode({
            type: nodeType as NodeType,
            position,
          })
        );
      } else if (datasetType) {
        // Drop dataset
        dispatch(
          addDataset({
            name: 'Unnamed Dataset',
            type: datasetType as DatasetType,
            position,
          })
        );
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

  // Handle edge click
  const handleEdgeClick: EdgeMouseHandler = useCallback(
    (event, edge) => {
      event.stopPropagation();

      if (event.metaKey || event.ctrlKey || event.shiftKey) {
        // Multi-select edge
        dispatch(selectConnection(edge.id));
      } else {
        // Single select edge
        dispatch(clearSelection());
        dispatch(selectConnection(edge.id));
      }
    },
    [dispatch]
  );

  // Handle edge context menu (right-click)
  const handleEdgeContextMenu: EdgeMouseHandler = useCallback(
    (event, edge) => {
      event.preventDefault();
      event.stopPropagation();

      setContextMenu({
        edgeId: edge.id,
        x: event.clientX,
        y: event.clientY,
      });

      // Select this edge
      dispatch(clearSelection());
      dispatch(selectConnection(edge.id));
    },
    [dispatch]
  );

  // Bulk actions handlers
  const handleBulkDelete = useCallback(() => {
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
    setContextMenu(null); // Close context menu
  }, [dispatch]);

  // Handle selection change from ReactFlow (box selection)
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const nodeIds = selectedNodes.map((n) => n.id);

      if (nodeIds.length > 0) {
        dispatch(selectNodes(nodeIds));
      }
      // Don't clear selection here - let pane click handle it
    },
    [dispatch]
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
      className="pipeline-canvas"
      ref={reactFlowWrapper}
      tabIndex={0}
      style={{ outline: 'none' }}
      onDragLeave={handleDragLeave}
    >
      {/* Empty State - Show when no nodes or datasets */}
      {isEmpty && <EmptyState isDragging={isDraggingOver} />}

      {/* Bulk Actions Toolbar */}
      <BulkActionsToolbar
        selectedCount={totalSelected}
        selectedType={selectionType}
        onDelete={handleBulkDelete}
        onClear={handleBulkClear}
      />

      {/* Edge Context Menu */}
      {contextMenu && (
        <EdgeContextMenu
          edgeId={contextMenu.edgeId}
          x={contextMenu.x}
          y={contextMenu.y}
          open={!!contextMenu}
          onOpenChange={(open) => {
            if (!open) setContextMenu(null);
          }}
          onDelete={() => {
            dispatch(deleteConnection(contextMenu.edgeId));
            dispatch(clearConnectionSelection());
            setContextMenu(null);
          }}
        />
      )}

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
        onEdgeContextMenu={handleEdgeContextMenu}
        onPaneClick={handlePaneClick}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionMode={ConnectionMode.Loose}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        selectNodesOnDrag={false}
        panOnDrag={[1, 2]}
        selectionOnDrag={true}
        multiSelectionKeyCode={['Meta', 'Control', 'Shift']}
        deleteKeyCode={['Delete', 'Backspace']}
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2, stroke: 'var(--color-connection)' },
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

export const PipelineCanvas = () => (
  <ReactFlowProvider>
    <PipelineCanvasInner />
  </ReactFlowProvider>
);
