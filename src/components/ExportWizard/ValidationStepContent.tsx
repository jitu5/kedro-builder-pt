import React from 'react';
import type { ValidationResult } from '../../utils/validation';
import { CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { ValidationItem } from '../ValidationPanel/ValidationItem';

interface ValidationStepContentProps {
  validationResult: ValidationResult;
  onContinue: () => void;
  onClose: () => void;
}

export const ValidationStepContent: React.FC<ValidationStepContentProps> = ({
  validationResult,
  onContinue,
  onClose,
}) => {
  const { errors, warnings } = validationResult;

  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;
  const isClean = !hasErrors && !hasWarnings;

  return (
    <div className="export-wizard__validation">
      {/* Success State */}
      {isClean && (
        <div className="export-wizard__validation-success">
          <CheckCircle size={48} />
          <h3>Validation Passed!</h3>
          <p>Your pipeline is ready to export with no issues.</p>
        </div>
      )}

      {/* Errors Section */}
      {hasErrors && (
        <div className="export-wizard__validation-section export-wizard__validation-section--errors">
          <div className="export-wizard__validation-header">
            <AlertCircle size={20} />
            <h3>{errors.length} {errors.length === 1 ? 'Error' : 'Errors'} Found</h3>
            <span className="export-wizard__validation-badge export-wizard__validation-badge--error">
              Cannot Export
            </span>
          </div>
          <p className="export-wizard__validation-description">
            Fix these issues before exporting. Click on an error to view the component.
          </p>
          <div className="export-wizard__validation-list">
            {errors.map((error) => (
              <ValidationItem key={error.id} issue={error} />
            ))}
          </div>
        </div>
      )}

      {/* Warnings Section */}
      {hasWarnings && (
        <div className="export-wizard__validation-section export-wizard__validation-section--warnings">
          <div className="export-wizard__validation-header">
            <AlertTriangle size={20} />
            <h3>{warnings.length} {warnings.length === 1 ? 'Warning' : 'Warnings'}</h3>
            <span className="export-wizard__validation-badge export-wizard__validation-badge--warning">
              Can Export
            </span>
          </div>
          <p className="export-wizard__validation-description">
            These warnings won't block export, but you may want to address them.
          </p>
          <div className="export-wizard__validation-list">
            {warnings.map((warning) => (
              <ValidationItem key={warning.id} issue={warning} />
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="export-wizard__actions">
        {!hasErrors && <button
          className="export-wizard__button export-wizard__button--secondary"
          onClick={onClose}
        >
          Cancel
        </button>}
        {!hasErrors && (
          <button
            className="export-wizard__button export-wizard__button--primary"
            onClick={onContinue}
          >
            Continue to Export →
          </button>
        )}
        {hasErrors && (
          <button
            className="export-wizard__button export-wizard__button--secondary"
            onClick={onClose}
          >
            Fix Issues
          </button>
        )}
      </div>
    </div>
  );
};
