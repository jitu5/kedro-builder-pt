import { memo } from 'react';
import { getBezierPath } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';
import './CustomEdge.scss';

export const CustomEdge = memo<EdgeProps>(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    selected,
  }) => {
    const [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const edgeColor = selected ? 'var(--color-primary)' : 'var(--color-connection)';
    const strokeWidth = selected ? 3 : 2;

    return (
      <>
        {/* Arrow marker definition */}
        <defs>
          <marker
            id={`arrow-${id}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              fill={edgeColor}
            />
          </marker>
        </defs>

        {/* Main edge path */}
        <path
          id={id}
          className={`custom-edge ${selected ? 'custom-edge--selected' : ''}`}
          d={edgePath}
          markerEnd={`url(#arrow-${id})`}
          style={{
            ...style,
            stroke: edgeColor,
            strokeWidth,
          }}
        />
      </>
    );
  }
);

CustomEdge.displayName = 'CustomEdge';
