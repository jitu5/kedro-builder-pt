import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useSelector } from 'react-redux';
import classNames from 'classnames';
import type { KedroNode } from '../../../types/kedro';
import type { RootState } from '../../../types/redux';
import './CustomNode.scss';

export const CustomNode = memo<NodeProps<KedroNode>>(({ data, selected }) => {
  const validationErrors = useSelector((state: RootState) => state.validation.errors);
  const validationWarnings = useSelector((state: RootState) => state.validation.warnings);

  // Check if this node has any validation issues
  const hasError = validationErrors.some(
    (err) => err.componentId === data.id && err.componentType === 'node'
  );
  const hasWarning = validationWarnings.some(
    (warn) => warn.componentId === data.id && warn.componentType === 'node'
  );

  const nodeClasses = classNames(
    'custom-node',
    `custom-node--${data.type}`,
    {
      'custom-node--selected': selected,
      'custom-node--unnamed': !data.name || data.name.trim() === '',
      'custom-node--error': hasError,
      'custom-node--warning': !hasError && hasWarning, // Only show warning if no error
    }
  );

  return (
    <div className={nodeClasses}>
      {/* Top handle for inputs */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="custom-node__handle custom-node__handle--top"
      />

      {/* Node content - only icon and name */}
      <div className="custom-node__content">
        <div className="custom-node__icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="600" fill="currentColor">
              ƒ
            </text>
          </svg>
        </div>
        <h4 className="custom-node__name">
          {data.name && data.name.trim() !== '' ? data.name : 'Unnamed Node'}
        </h4>
      </div>

      {/* Bottom handle for outputs */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="custom-node__handle custom-node__handle--bottom"
      />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
