import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Database } from 'lucide-react';
import classNames from 'classnames';
import { KedroDataset } from '../../../types/kedro';
import './DatasetNode.scss';

export const DatasetNode = memo<NodeProps<KedroDataset>>(({ data, selected }) => {
  return (
    <div
      className={classNames('dataset-node', `dataset-node--${data.type}`, {
        'dataset-node--selected': selected,
      })}
    >
      {/* Top Handle for connections from above */}
      <Handle
        type="target"
        position={Position.Top}
        id="input"
        className="dataset-node__handle dataset-node__handle--top"
      />

      {/* Dataset content - only database icon and name */}
      <div className="dataset-node__content">
        <div className="dataset-node__icon">
          <Database size={20} />
        </div>
        <h4 className="dataset-node__name">{data.name || 'Unnamed Dataset'}</h4>
      </div>

      {/* Bottom Handle for connections to below */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
        className="dataset-node__handle dataset-node__handle--bottom"
      />
    </div>
  );
});

DatasetNode.displayName = 'DatasetNode';
