import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { closeConfigPanel } from '../../features/ui/uiSlice';
import { selectNodeById } from '../../features/nodes/nodesSelectors';
import { selectDatasetById } from '../../features/datasets/datasetsSelectors';
import { NodeConfigForm } from './NodeConfigForm/NodeConfigForm';
import { DatasetConfigForm } from './DatasetConfigForm/DatasetConfigForm';
import { X } from 'lucide-react';
import './ConfigPanel.scss';

export const ConfigPanel = () => {
  const dispatch = useAppDispatch();
  const showPanel = useAppSelector((state) => state.ui.showConfigPanel);
  const selectedComponent = useAppSelector((state) => state.ui.selectedComponent);

  // Get the selected node or dataset
  const selectedNode = useAppSelector((state) =>
    selectedComponent?.type === 'node' && selectedComponent?.id
      ? selectNodeById(state, selectedComponent.id)
      : undefined
  );

  const selectedDataset = useAppSelector((state) =>
    selectedComponent?.type === 'dataset' && selectedComponent?.id
      ? selectDatasetById(state, selectedComponent.id)
      : undefined
  );

  if (!showPanel || !selectedComponent) {
    return null;
  }

  const handleClose = () => {
    dispatch(closeConfigPanel());
  };

  return (
    <div className="config-panel">
      <div className="config-panel__header">
        <h3 className="config-panel__title">
          {selectedComponent.type === 'node' ? 'Configure Node' : 'Configure Dataset'}
        </h3>
        <button
          onClick={handleClose}
          className="config-panel__close"
          aria-label="Close configuration panel"
        >
          <X size={20} />
        </button>
      </div>

      <div className="config-panel__content">
        {selectedComponent.type === 'node' && selectedNode && (
          <NodeConfigForm node={selectedNode} onClose={handleClose} />
        )}

        {selectedComponent.type === 'dataset' && selectedDataset && (
          <DatasetConfigForm dataset={selectedDataset} onClose={handleClose} />
        )}
      </div>
    </div>
  );
};
