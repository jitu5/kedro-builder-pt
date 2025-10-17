import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  nextWalkthroughStep,
  prevWalkthroughStep,
  completeWalkthrough,
  skipWalkthrough,
} from '../../features/ui/uiSlice';
import { walkthroughSteps } from './walkthroughContent';
import './WalkthroughOverlay.scss';

interface CirclePosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const WalkthroughOverlay: React.FC = () => {
  const dispatch = useDispatch();
  const currentStep = useSelector((state: RootState) => state.ui.walkthroughStep);
  const [circlePosition, setCirclePosition] = useState<CirclePosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);

  const step = walkthroughSteps[currentStep - 1];
  const isLastStep = currentStep === walkthroughSteps.length;

  // Calculate circle and tooltip positions
  const updatePositions = useCallback(() => {
    if (!step.target) {
      // Center modal for step 4
      setCirclePosition(null);
      setTooltipPosition(null);
      return;
    }

    const targetElement = document.querySelector(`[data-walkthrough="${step.target}"]`);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();

      // Circle position (center of target element)
      // Use the larger dimension to ensure it's a perfect circle
      // Max diameter is 150px
      const diameter = Math.min(Math.max(rect.width, rect.height) + 10, 150);

      setCirclePosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: diameter,
        height: diameter,
      });

      // Tooltip position (based on step.position)
      let tooltipX = 0;
      let tooltipY = 0;
      const tooltipWidth = 400; // Expected tooltip width
      const tooltipHeight = 200; // Approximate tooltip height
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      switch (step.position) {
        case 'right':
          tooltipX = rect.right + 30;
          tooltipY = rect.top + rect.height / 2;
          // Check if tooltip goes off screen right
          if (tooltipX + tooltipWidth > windowWidth) {
            tooltipX = rect.left - tooltipWidth - 30;
          }
          break;
        case 'bottom':
          tooltipX = rect.left + rect.width / 2;
          tooltipY = rect.bottom + 30;
          // Check if tooltip goes off screen bottom
          if (tooltipY + tooltipHeight > windowHeight) {
            tooltipY = rect.top - tooltipHeight - 30;
          }
          // Check if tooltip goes off screen right
          if (tooltipX + tooltipWidth / 2 > windowWidth) {
            tooltipX = windowWidth - tooltipWidth / 2 - 20;
          }
          break;
        case 'left':
          tooltipX = rect.left - 30;
          tooltipY = rect.top + rect.height / 2;
          // Check if tooltip goes off screen left
          if (tooltipX - tooltipWidth < 0) {
            tooltipX = rect.right + 30;
          }
          break;
        case 'top':
          tooltipX = rect.left + rect.width / 2;
          tooltipY = rect.top - 30;
          // Check if tooltip goes off screen top
          if (tooltipY - tooltipHeight < 0) {
            tooltipY = rect.bottom + 30;
          }
          break;
        default:
          tooltipX = rect.left + rect.width / 2;
          tooltipY = rect.bottom + 30;
      }

      setTooltipPosition({ x: tooltipX, y: tooltipY });
    }
  }, [step]);

  useEffect(() => {
    updatePositions();
    window.addEventListener('resize', updatePositions);
    return () => window.removeEventListener('resize', updatePositions);
  }, [updatePositions]);

  const handleNext = () => {
    if (isLastStep) {
      dispatch(completeWalkthrough());
    } else {
      dispatch(nextWalkthroughStep());
    }
  };

  const handleBack = () => {
    dispatch(prevWalkthroughStep());
  };

  const handleSkip = () => {
    dispatch(skipWalkthrough());
  };

  return (
    <div className="walkthrough-overlay">
      {/* Semi-transparent backdrop */}
      <div className="walkthrough-overlay__backdrop" />

      {/* Animated spotlight circle */}
      {circlePosition && (
        <div
          className="walkthrough-overlay__spotlight"
          style={{
            left: `${circlePosition.x}px`,
            top: `${circlePosition.y}px`,
            width: `${circlePosition.width}px`,
            height: `${circlePosition.height}px`,
          }}
        />
      )}

      {/* Tooltip or center modal */}
      {step.target === null ? (
        // Center modal for step 4
        <div className="walkthrough-overlay__modal">
          <div className="walkthrough-overlay__modal-header">
            <span className="walkthrough-overlay__step-indicator">
              {currentStep} / {walkthroughSteps.length}
            </span>
          </div>

          <div className="walkthrough-overlay__modal-content">
            <h2 className="walkthrough-overlay__title">{step.title}</h2>
            <p className="walkthrough-overlay__description">{step.description}</p>
          </div>

          <div className="walkthrough-overlay__modal-footer">
            <button
              className="walkthrough-overlay__button walkthrough-overlay__button--secondary"
              onClick={handleSkip}
            >
              Skip tutorial
            </button>

            <div className="walkthrough-overlay__navigation">
              <button
                className="walkthrough-overlay__nav-button walkthrough-overlay__nav-button--back"
                onClick={handleBack}
                aria-label="Previous step"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                className="walkthrough-overlay__nav-button walkthrough-overlay__nav-button--next"
                onClick={handleNext}
                aria-label="Next step"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Tooltip for steps 1-3
        tooltipPosition && (
          <div
            className={`walkthrough-overlay__tooltip walkthrough-overlay__tooltip--${step.position}`}
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
            }}
          >
            <div className="walkthrough-overlay__tooltip-header">
              <span className="walkthrough-overlay__step-indicator">
                {currentStep} / {walkthroughSteps.length}
              </span>
            </div>

            <div className="walkthrough-overlay__tooltip-content">
              <h3 className="walkthrough-overlay__title">{step.title}</h3>
              <p className="walkthrough-overlay__description">{step.description}</p>
            </div>

            <div className="walkthrough-overlay__tooltip-footer">
              <button
                className="walkthrough-overlay__button walkthrough-overlay__button--text"
                onClick={handleSkip}
              >
                Skip tutorial
              </button>

              <div className="walkthrough-overlay__navigation">
                {currentStep > 1 && (
                  <button
                    className="walkthrough-overlay__nav-button walkthrough-overlay__nav-button--back"
                    onClick={handleBack}
                    aria-label="Previous step"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M15 18L9 12L15 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}

                <button
                  className="walkthrough-overlay__nav-button walkthrough-overlay__nav-button--next"
                  onClick={handleNext}
                  aria-label="Next step"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 18L15 12L9 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
