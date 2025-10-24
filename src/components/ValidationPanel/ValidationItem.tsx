import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../types/redux';
import type { ValidationError } from '../../utils/validation';
import { selectNode } from '../../features/nodes/nodesSlice';
import { selectDataset } from '../../features/datasets/datasetsSlice';
import { openConfigPanel } from '../../features/ui/uiSlice';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import './ValidationItem.scss';

interface ValidationItemProps {
  issue: ValidationError;
}

export const ValidationItem: React.FC<ValidationItemProps> = ({ issue }) => {
  const dispatch = useDispatch();
  const nodes = useSelector((state: RootState) => state.nodes.byId);
  const datasets = useSelector((state: RootState) => state.datasets.byId);

  const handleClick = () => {
    // Select the component with the issue
    if (issue.componentType === 'node' && nodes[issue.componentId]) {
      dispatch(selectNode(issue.componentId));
      dispatch(openConfigPanel({ type: 'node', id: issue.componentId }));

      // Dispatch custom event to scroll component into view
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('focusNode', {
            detail: { nodeId: issue.componentId },
          })
        );
      }, 100);
    } else if (issue.componentType === 'dataset' && datasets[issue.componentId]) {
      dispatch(selectDataset(issue.componentId));
      dispatch(openConfigPanel({ type: 'dataset', id: issue.componentId }));

      // Dispatch custom event to scroll component into view
      setTimeout(() => {
        window.dispatchEvent(
          new CustomEvent('focusNode', {
            detail: { nodeId: issue.componentId },
          })
        );
      }, 100);
    }
    // For 'pipeline' or 'connection' types, we just highlight the issue
  };

  const getComponentName = (): string => {
    if (issue.componentType === 'node') {
      return nodes[issue.componentId]?.name || 'Unknown Node';
    } else if (issue.componentType === 'dataset') {
      return datasets[issue.componentId]?.name || 'Unknown Dataset';
    } else if (issue.componentType === 'connection') {
      return 'Connection';
    }
    return 'Pipeline';
  };

  const isClickable = issue.componentType === 'node' || issue.componentType === 'dataset';

  return (
    <div
      className={`validation-item validation-item--${issue.severity} ${
        isClickable ? 'validation-item--clickable' : ''
      }`}
      onClick={isClickable ? handleClick : undefined}
    >
      {/* Icon */}
      <div className="validation-item__icon">
        {issue.severity === 'error' ? (
          <AlertCircle size={16} />
        ) : (
          <AlertTriangle size={16} />
        )}
      </div>

      {/* Content */}
      <div className="validation-item__content">
        <div className="validation-item__header">
          <span className="validation-item__component-type">
            {issue.componentType}
          </span>
          <span className="validation-item__component-name">
            {getComponentName()}
          </span>
        </div>
        <p className="validation-item__message">{issue.message}</p>
        {issue.suggestion && (
          <div className="validation-item__suggestion">
            <Info size={14} />
            <span>{issue.suggestion}</span>
          </div>
        )}
      </div>
    </div>
  );
};
