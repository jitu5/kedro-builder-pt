import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import classNames from 'classnames';
import { KedroNode } from '../../../types/kedro';
import './CustomNode.scss';

export const CustomNode = memo<NodeProps<KedroNode>>(({ data, selected }) => {
  const nodeClasses = classNames(
    'custom-node',
    `custom-node--${data.type}`,
    {
      'custom-node--selected': selected,
      'custom-node--unnamed': !data.name || data.name.trim() === '',
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
