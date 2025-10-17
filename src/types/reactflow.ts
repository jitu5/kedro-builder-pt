/**
 * ReactFlow custom type definitions
 */

import { Node, Edge } from '@xyflow/react';
import { KedroNode, KedroConnection } from './kedro';

export type CustomNodeData = KedroNode;

export type CustomNode = Node<CustomNodeData>;

export type CustomEdgeData = KedroConnection;

export type CustomEdge = Edge<CustomEdgeData>;
