import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner, { SpinnerPresets } from './LoadingSpinner';
import ProgressBar, { CircularProgress } from './ProgressBar';
import useLoading from '../hooks/useLoading';

/**
 * Loading Modal Component
 * Full-screen modal for long-running operations like book generation
 */
const LoadingModal = ({
  isOpen = false,
  title = 'Creating Your Story...',
  subtitle = 'This usually takes about a minute',
  operationKey = 'bookGeneration',
  showProgress = true,
  showTimeEstimate = true,
  allowCancel = false,
  onCancel = null,
  steps = null,
  currentStep = null,
  customSpinner = null,
  className = ''
}) => {
  const {
    isLoading,
    loadingMessage,
    progress,
    progressMessage,
    estimatedTimeRemaining,
    formatTimeRemaining,
    elapsedTime
  } = useLoading(operationKey);

  // Default steps for book generation
  const defaultSteps = [
    { label: 'Preparing Story', completed: false },
    { label: 'Creating Characters', completed: false },
    { label: 'Generating Images', completed: false },
    { label: 'Finalizing Book', completed: false }
  ];

  const stepsToUse = steps || defaultSteps;
  const currentStepIndex = currentStep !== null ? currentStep : Math.floor((progress / 100) * stepsToUse.length);

  // Update steps based on progress
  const updatedSteps = stepsToUse.map((step, index) => ({
    ...step,
    completed: index < currentStepIndex
  }));

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className={`bg-white rounded-lg shadow-xl max-w-md w-full p-6 ${className}`}
        >
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600">{subtitle}</p>
          </div>

          {/* Spinner */}
          <div className="flex justify-center mb-6">
            {customSpinner || (
              <LoadingSpinner 
                {...SpinnerPresets.bookGeneration}
                visible={true}
              />
            )}
          </div>

          {/* Progress Section */}
          {showProgress && (
            <div className="mb-6">
              {/* Circular Progress */}
              <div className="flex justify-center mb-4">
                <CircularProgress
                  progress={progress}
                  size={80}
                  color="#8B5CF6"
                  showPercentage={true}
                />
              </div>

              {/* Linear Progress Bar */}
              <ProgressBar
                progress={progress}
                message={progressMessage || loadingMessage}
                estimatedTimeRemaining={showTimeEstimate ? estimatedTimeRemaining : null}
                color="bg-purple-600"
                animated={true}
                className="mb-4"
              />

              {/* Steps */}
              {updatedSteps && (
                <div className="mt-4">
                  <div className="flex justify-between">
                    {updatedSteps.map((step, index) => (
                      <div key={index} className="flex flex-col items-center flex-1">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 ${
                            step.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : index === currentStepIndex
                              ? 'bg-purple-500 border-purple-500 text-white'
                              : 'bg-gray-100 border-gray-300 text-gray-500'
                          }`}
                        >
                          {step.completed ? '✓' : index + 1}
                        </div>
                        <p className={`mt-1 text-xs text-center ${
                          step.completed || index === currentStepIndex
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
          )}

          {/* Status Messages */}
          <div className="text-center mb-6">
            {progressMessage && (
              <p className="text-sm text-gray-700 mb-2">{progressMessage}</p>
            )}
            
            {showTimeEstimate && (
              <div className="flex justify-center items-center space-x-4 text-sm text-gray-500">
                <span>Elapsed: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</span>
                {estimatedTimeRemaining && (
                  <span>Remaining: ~{formatTimeRemaining(estimatedTimeRemaining)}</span>
                )}
              </div>
            )}
          </div>

          {/* Cancel Button */}
          {allowCancel && onCancel && (
            <div className="text-center">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Fun Facts or Tips */}
          <div className="mt-6 p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-purple-700 text-center">
              💡 <strong>Did you know?</strong> We're creating unique illustrations just for your story!
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Simple Loading Modal
 * Minimal loading modal for quick operations
 */
export const SimpleLoadingModal = ({
  isOpen = false,
  message = 'Loading...',
  spinnerType = 'Circles',
  onClose = null
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <LoadingSpinner
              type={spinnerType}
              size={60}
              color="#3B82F6"
            />
            <p className="mt-4 text-gray-700">{message}</p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Book Generation Loading Modal
 * Specialized modal for book generation with predefined steps and messaging
 */
export const BookGenerationModal = ({
  isOpen = false,
  onCancel = null,
  allowCancel = false
}) => {
  const bookSteps = [
    { label: 'Story Planning', completed: false },
    { label: 'Character Creation', completed: false },
    { label: 'Scene Generation', completed: false },
    { label: 'Final Assembly', completed: false }
  ];

  return (
    <LoadingModal
      isOpen={isOpen}
      title="Creating Your Magical Story..."
      subtitle="This usually takes about 60-90 seconds"
      operationKey="bookGeneration"
      steps={bookSteps}
      allowCancel={allowCancel}
      onCancel={onCancel}
      customSpinner={
        <LoadingSpinner 
          {...SpinnerPresets.bookGeneration}
          size={100}
        />
      }
    />
  );
};

export default LoadingModal; 