import { Database } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { addNode, selectNode, clearSelection } from '../../../features/nodes/nodesSlice';
import { addDataset } from '../../../features/datasets/datasetsSlice';
import { clearConnectionSelection } from '../../../features/connections/connectionsSlice';
import { openProjectSetup, openConfigPanel, setPendingComponent } from '../../../features/ui/uiSlice';
import './EmptyState.scss';

interface EmptyStateProps {
  isDragging?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ isDragging = false }) => {
  const dispatch = useAppDispatch();
  const hasActiveProject = useAppSelector((state) => state.ui.hasActiveProject);
  const showTutorial = useAppSelector((state) => state.ui.showTutorial);
  const showWalkthrough = useAppSelector((state) => state.ui.showWalkthrough);
  const hasPendingComponent = useAppSelector((state) => state.ui.pendingComponentId !== null);

  const handleAddDataset = () => {
    // Clear any existing selection first
    dispatch(clearSelection());
    dispatch(clearConnectionSelection());

    // Auto-drop a CSV dataset at center of canvas
    const newDatasetId = `dataset-${Date.now()}`;
    dispatch(
      addDataset({
        name: '',
        type: 'csv',
        position: { x: 400, y: 250 },
      })
    );

    // Mark as pending (needs to be saved before staying on canvas)
    dispatch(setPendingComponent({ type: 'dataset', id: newDatasetId }));

    // Auto-select and open config panel
    setTimeout(() => {
      dispatch(selectNode(newDatasetId));
      dispatch(openConfigPanel({ type: 'dataset', id: newDatasetId }));
    }, 10);
  };

  const handleAddNode = () => {
    // Clear any existing selection first
    dispatch(clearSelection());
    dispatch(clearConnectionSelection());

    // Auto-drop a custom node at center of canvas
    const newNodeId = `node-${Date.now()}`;
    dispatch(
      addNode({
        type: 'custom',
        position: { x: 600, y: 250 },
      })
    );

    // Mark as pending (needs to be saved before staying on canvas)
    dispatch(setPendingComponent({ type: 'node', id: newNodeId }));

    // Auto-select and open config panel
    setTimeout(() => {
      dispatch(selectNode(newNodeId));
      dispatch(openConfigPanel({ type: 'node', id: newNodeId }));
    }, 10);
  };

  const handleCreateProject = () => {
    dispatch(openProjectSetup());
  };

  return (
    <div className="empty-state">
      {/* Show drop zone when dragging */}
      {isDragging && (
        <div className="empty-state__drop-zone">
          <div className="empty-state__drop-zone-content">
            <p>Drop component here to add to pipeline</p>
          </div>
        </div>
      )}

      {/* Show welcome content when not dragging */}
      {!isDragging && (
        <div className="empty-state__content">
          {hasActiveProject ? (
            // Mode A: User has project - show normal empty state
            <>
              <p className="empty-state__description">
                Get started by dragging components from the left<br />
                onto this canvas to start building your pipeline.
              </p>

              <p className="empty-state__tip">
                Tip: Try dragging a "Dataset" or "Function Node" first.
              </p>

              <div className="empty-state__actions">
                <button
                  className="empty-state__button empty-state__button--dataset"
                  onClick={handleAddDataset}
                  disabled={hasPendingComponent}
                  title={hasPendingComponent ? 'Complete the current component configuration first' : ''}
                >
                  <Database size={20} />
                  <span>Dataset</span>
                </button>

                <button
                  className="empty-state__button empty-state__button--node"
                  onClick={handleAddNode}
                  disabled={hasPendingComponent}
                  title={hasPendingComponent ? 'Complete the current component configuration first' : ''}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor">
                      ƒ
                    </text>
                  </svg>
                  <span>Function Node</span>
                </button>
              </div>
            </>
          ) : (
            // Mode B: No project yet - show "Create New Project" button
            <>
              <h2 className="empty-state__title">Welcome to Kedro's Pipeline Builder</h2>
              <p className="empty-state__description">
                Create a new project to start building<br />
                your pipeline.
              </p>

              <button
                className="empty-state__create-project-button"
                onClick={handleCreateProject}
                disabled={showTutorial || showWalkthrough}
                data-walkthrough="create-project-button"
                title={
                  showTutorial
                    ? 'Complete the tutorial first'
                    : showWalkthrough
                    ? 'Complete the walkthrough first'
                    : ''
                }
              >
                Create New Project
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
