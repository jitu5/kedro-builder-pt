import React from 'react';
import { Download, AlertTriangle, Package, FileCode } from 'lucide-react';

interface ConfigureStepContentProps {
  projectName: string;
  nodesCount: number;
  datasetsCount: number;
  hasWarnings: boolean;
  warningsCount: number;
  onProjectNameChange: (name: string) => void;
  onBack: () => void;
  onExport: () => void;
}

export const ConfigureStepContent: React.FC<ConfigureStepContentProps> = ({
  projectName,
  nodesCount,
  datasetsCount,
  hasWarnings,
  warningsCount,
  onProjectNameChange,
  onBack,
  onExport,
}) => {
  const isValid = projectName.trim() !== '' && /^[a-zA-Z0-9_-]+$/.test(projectName);

  return (
    <div className="export-wizard__configure">
      {/* Warning Banner if warnings exist */}
      {hasWarnings && (
        <div className="export-wizard__warning-banner">
          <AlertTriangle size={18} />
          <span>
            Exporting with {warningsCount} {warningsCount === 1 ? 'warning' : 'warnings'}.
            Generated code will need implementation.
          </span>
        </div>
      )}

      {/* Project Summary */}
      <div className="export-wizard__summary">
        <h3>Project Summary</h3>
        <div className="export-wizard__summary-stats">
          <div className="export-wizard__summary-stat">
            <FileCode size={20} />
            <div>
              <span className="export-wizard__summary-label">Nodes</span>
              <span className="export-wizard__summary-value">{nodesCount}</span>
            </div>
          </div>
          <div className="export-wizard__summary-stat">
            <Package size={20} />
            <div>
              <span className="export-wizard__summary-label">Datasets</span>
              <span className="export-wizard__summary-value">{datasetsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="export-wizard__form">
        <div className="export-wizard__field">
          <label htmlFor="project-name">Project Name *</label>
          <input
            id="project-name"
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            placeholder="my-kedro-project"
          />
          {!isValid && projectName && (
            <small className="export-wizard__field-error">
              Only letters, numbers, hyphens, and underscores allowed
            </small>
          )}
          <small>This will be used as your project directory name</small>
        </div>
      </div>

      {/* What will be generated */}
      <div className="export-wizard__info">
        <h4>What will be generated:</h4>
        <ul>
          <li>Complete Kedro project structure</li>
          <li>Pipeline code (nodes.py, pipeline.py)</li>
          <li>Data catalog configuration</li>
          <li>Project configuration files</li>
          <li>README with setup instructions</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="export-wizard__actions">
        <button
          className="export-wizard__button export-wizard__button--secondary"
          onClick={onBack}
        >
          ← Back
        </button>
        <button
          className="export-wizard__button export-wizard__button--primary"
          onClick={onExport}
          disabled={!isValid}
        >
          <Download size={18} />
          Download ZIP
        </button>
      </div>
    </div>
  );
};
