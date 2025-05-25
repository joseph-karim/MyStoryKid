import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import AuthPrompt from '../AuthPrompt';
import GenerateBookStep from './GenerateBookStep';

/**
 * Wrapper component that handles authentication flow before book generation
 */
const GenerateBookWrapper = () => {
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [proceedWithGeneration, setProceedWithGeneration] = useState(false);
  const { isAuthenticated, isAnonymous, isLoading } = useAuthStore();

  useEffect(() => {
    // Don't show auth prompt if still loading auth state
    if (isLoading) return;

    // If user is authenticated and not anonymous, proceed directly
    if (isAuthenticated && !isAnonymous) {
      setProceedWithGeneration(true);
      return;
    }

    // If user is anonymous or not authenticated, show auth prompt
    setShowAuthPrompt(true);
  }, [isAuthenticated, isAnonymous, isLoading]);

  const handleAuthPromptContinue = () => {
    setShowAuthPrompt(false);
    setProceedWithGeneration(true);
  };

  const handleAuthPromptSkip = () => {
    setShowAuthPrompt(false);
    setProceedWithGeneration(true);
  };

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Preparing your story creation...</p>
        </div>
      </div>
    );
  }

  // Show auth prompt if needed
  if (showAuthPrompt) {
    return (
      <AuthPrompt
        title="Ready to Create Your Story?"
        onContinue={handleAuthPromptContinue}
        onSkip={handleAuthPromptSkip}
      />
    );
  }

  // Show book generation step
  if (proceedWithGeneration) {
    return <GenerateBookStep />;
  }

  // Fallback (shouldn't reach here)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600">Initializing...</p>
      </div>
    </div>
  );
};

export default GenerateBookWrapper; 