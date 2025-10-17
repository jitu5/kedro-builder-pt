import { useState } from 'react';
import { Database } from 'lucide-react';
import './ComponentPalette.scss';

type TabType = 'components' | 'templates';

export const ComponentPalette = () => {
  const [activeTab, setActiveTab] = useState<TabType>('components');

  const handleNodeDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/kedro-builder', 'custom');
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDatasetDragStart = (event: React.DragEvent) => {
    event.dataTransfer.setData('application/kedro-builder-dataset', 'csv');
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="component-palette">
      <div className="component-palette__tabs">
        <button
          className={`component-palette__tab ${activeTab === 'components' ? 'component-palette__tab--active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          Components
        </button>
        <button
          className="component-palette__tab component-palette__tab--disabled"
          disabled
        >
          Templates
        </button>
      </div>

      <div className="component-palette__header">
        <p className="component-palette__subtitle">
          {activeTab === 'components' ? 'Drag components below onto the canvas to build your pipeline.' : ''}
        </p>
      </div>

      <div className="component-palette__section">
        <div className="component-palette__list">
          {/* Function Node */}
          <div
            className="component-card component-card--function"
            draggable
            onDragStart={handleNodeDragStart}
          >
            <div className="component-card__icon">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fontWeight="600" fill="currentColor">
                  ƒ
                </text>
              </svg>
            </div>
            <div className="component-card__content">
              <h4 className="component-card__name">Function Node</h4>
              <p className="component-card__description">Create a processing function</p>
            </div>
          </div>

          {/* Dataset */}
          <div
            className="component-card component-card--dataset"
            draggable
            onDragStart={handleDatasetDragStart}
            data-walkthrough="dataset-button"
          >
            <div className="component-card__icon">
              <Database size={20} />
            </div>
            <div className="component-card__content">
              <h4 className="component-card__name">Dataset</h4>
              <p className="component-card__description">Add a data source or output</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
