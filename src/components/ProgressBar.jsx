import React from 'react';
import { CheckIcon, ClockIcon } from '@heroicons/react/24/outline';

/**
 * Progress Bar Component
 * Displays progress with optional time estimation and step indicators
 */
const ProgressBar = ({
  progress = 0,
  message = '',
  estimatedTimeRemaining = null,
  showPercentage = true,
  showTimeRemaining = true,
  className = '',
  barClassName = '',
  height = 'h-2',
  color = 'bg-blue-600',
  backgroundColor = 'bg-gray-200',
  animated = true,
  steps = null, // Array of step objects: [{ label: 'Step 1', completed: true }, ...]
  currentStep = null
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  // Format time remaining
  const formatTime = (seconds) => {
    if (!seconds || seconds <= 0) return null;
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.round(seconds / 3600);
      return `${hours}h`;
    }
  };

  const formattedTime = formatTime(estimatedTimeRemaining);

  return (
    <div className={`w-full ${className}`}>
      {/* Header with message and time */}
      {(message || formattedTime) && (
        <div className="flex justify-between items-center mb-2">
          <div className="flex-1">
            {message && (
              <p className="text-sm text-gray-700 font-medium">{message}</p>
            )}
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            {showPercentage && (
              <span className="font-medium">{Math.round(clampedProgress)}%</span>
            )}
            {showTimeRemaining && formattedTime && (
              <div className="flex items-center space-x-1">
                <ClockIcon className="h-4 w-4" />
                <span>{formattedTime}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className={`w-full ${height} ${backgroundColor} rounded-full overflow-hidden ${barClassName}`}>
        <div
          className={`${height} ${color} rounded-full transition-all duration-300 ease-out ${
            animated ? 'animate-pulse' : ''
          }`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>

      {/* Steps indicator */}
      {steps && steps.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                    step.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : currentStep === index
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-500'
                  }`}
                >
                  {step.completed ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <p className={`mt-2 text-xs text-center max-w-20 ${
                  step.completed || currentStep === index
                    ? 'text-gray-900 font-medium'
                    : 'text-gray-500'
                }`}>
                  {step.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Circular Progress Component
 * Displays progress in a circular format
 */
export const CircularProgress = ({
  progress = 0,
  size = 120,
  strokeWidth = 8,
  color = '#3B82F6',
  backgroundColor = '#E5E7EB',
  showPercentage = true,
  className = ''
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-700">
            {Math.round(clampedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Multi-step Progress Component
 * Displays progress across multiple defined steps
 */
export const MultiStepProgress = ({
  steps,
  currentStep = 0,
  className = ''
}) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border-2 ${
                  index < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}
              >
                {index < currentStep ? (
                  <CheckIcon className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <p className={`mt-2 text-xs text-center max-w-24 ${
                index <= currentStep
                  ? 'text-gray-900 font-medium'
                  : 'text-gray-500'
              }`}>
                {step.label}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                index < currentStep ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar; 