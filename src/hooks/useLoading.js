import { useCallback } from 'react';
import { useLoadingStore } from '../store';

/**
 * Custom hook for managing loading states
 * Provides an easy interface for components to interact with the global loading state
 */
export const useLoading = (operationKey = 'default') => {
  const {
    globalLoading,
    setGlobalLoading,
    setLoading,
    setProgress,
    clearLoading,
    clearAllLoading,
    getLoadingState,
    getProgressState,
    isAnyLoading
  } = useLoadingStore();

  // Get current loading state for this operation
  const loadingState = getLoadingState(operationKey);
  const progressState = getProgressState(operationKey);

  // Start loading for this operation
  const startLoading = useCallback((message = '') => {
    setLoading(operationKey, true, message);
  }, [operationKey, setLoading]);

  // Stop loading for this operation
  const stopLoading = useCallback(() => {
    clearLoading(operationKey);
  }, [operationKey, clearLoading]);

  // Update progress for this operation
  const updateProgress = useCallback((progress, message = '', estimatedTimeRemaining = null) => {
    setProgress(operationKey, progress, message, estimatedTimeRemaining);
  }, [operationKey, setProgress]);

  // Calculate estimated time remaining based on progress and elapsed time
  const calculateEstimatedTime = useCallback((currentProgress) => {
    if (!loadingState.startTime || currentProgress <= 0) return null;
    
    const elapsedTime = Date.now() - loadingState.startTime;
    const progressRatio = currentProgress / 100;
    const estimatedTotalTime = elapsedTime / progressRatio;
    const estimatedTimeRemaining = estimatedTotalTime - elapsedTime;
    
    return Math.max(0, Math.round(estimatedTimeRemaining / 1000)); // Return in seconds
  }, [loadingState.startTime]);

  // Update progress with automatic time estimation
  const updateProgressWithTimeEstimate = useCallback((progress, message = '') => {
    const estimatedTime = calculateEstimatedTime(progress);
    updateProgress(progress, message, estimatedTime);
  }, [updateProgress, calculateEstimatedTime]);

  // Format time remaining for display
  const formatTimeRemaining = useCallback((seconds) => {
    if (!seconds || seconds <= 0) return null;
    
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    } else if (seconds < 3600) {
      const minutes = Math.round(seconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.round(seconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
  }, []);

  return {
    // Loading state
    isLoading: loadingState.isLoading,
    loadingMessage: loadingState.message,
    startTime: loadingState.startTime,
    
    // Progress state
    progress: progressState.progress,
    progressMessage: progressState.message,
    estimatedTimeRemaining: progressState.estimatedTimeRemaining,
    
    // Global state
    globalLoading,
    isAnyLoading: isAnyLoading(),
    
    // Actions
    startLoading,
    stopLoading,
    updateProgress,
    updateProgressWithTimeEstimate,
    setGlobalLoading,
    clearAllLoading,
    
    // Utilities
    calculateEstimatedTime,
    formatTimeRemaining: (seconds = progressState.estimatedTimeRemaining) => formatTimeRemaining(seconds),
    
    // Computed values
    elapsedTime: loadingState.startTime ? Math.round((Date.now() - loadingState.startTime) / 1000) : 0,
    isComplete: progressState.progress >= 100
  };
};

export default useLoading; 