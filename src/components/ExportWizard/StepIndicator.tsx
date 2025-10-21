import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import type { WizardStep } from './ExportWizard';

interface StepIndicatorProps {
  currentStep: WizardStep;
  validationPassed: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  validationPassed,
}) => {
  const step1Status = currentStep === 'validation' ? 'active' : validationPassed ? 'complete' : 'error';
  const step2Status = currentStep === 'configure' ? 'active' : 'pending';

  return (
    <div className="export-wizard__steps">
      {/* Step 1: Validation */}
      <div className={`export-wizard__step export-wizard__step--${step1Status}`}>
        <div className="export-wizard__step-indicator">
          {step1Status === 'complete' && <Check size={16} />}
          {step1Status === 'error' && <AlertCircle size={16} />}
          {step1Status === 'active' && <span>1</span>}
        </div>
        <div className="export-wizard__step-label">
          <span className="export-wizard__step-title">Validation</span>
          <span className="export-wizard__step-subtitle">
            {step1Status === 'complete' && 'Passed'}
            {step1Status === 'error' && 'Failed'}
            {step1Status === 'active' && 'Check pipeline'}
          </span>
        </div>
      </div>

      {/* Connector */}
      <div className={`export-wizard__step-connector ${step2Status === 'active' ? 'export-wizard__step-connector--active' : ''}`} />

      {/* Step 2: Configure */}
      <div className={`export-wizard__step export-wizard__step--${step2Status}`}>
        <div className="export-wizard__step-indicator">
          <span>2</span>
        </div>
        <div className="export-wizard__step-label">
          <span className="export-wizard__step-title">Configure & Download</span>
          <span className="export-wizard__step-subtitle">
            {step2Status === 'active' ? 'Export project' : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
};
