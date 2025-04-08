import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useBookStore } from '../store';

// Step components
import StoryDetailsStep from '../components/wizard/StoryDetailsStep';
import CharactersStep from '../components/wizard/CharactersStep';
import ArtStyleStep from '../components/wizard/ArtStyleStep';
import SummaryStep from '../components/wizard/SummaryStep';
import CategoryStep from '../components/wizard/CategoryStep';

function CreateBookPage() {
  const { isAuthenticated } = useAuthStore();
  const { wizardState, resetWizard, updateStoryData, setWizardStep } = useBookStore();
  const navigate = useNavigate();
  
  // Track which steps are unlocked (completed)
  const [unlockedSteps, setUnlockedSteps] = useState([1]);
  
  // Reset wizard state when component mounts
  useEffect(() => {
    console.log("[CreateBookPage] Component mounted, resetting wizard");
    resetWizard();
    setUnlockedSteps([1]); // Only the first step is unlocked initially
  }, [resetWizard]);
  
  // Update unlocked steps when wizard step changes
  useEffect(() => {
    // When a step is reached, it and all previous steps become unlocked
    if (wizardState.currentStep && !unlockedSteps.includes(wizardState.currentStep)) {
      console.log(`[CreateBookPage] Unlocking step ${wizardState.currentStep}`);
      
      // Create an array of all steps up to and including the current one
      const allPreviousSteps = Array.from(
        { length: wizardState.currentStep }, 
        (_, index) => index + 1
      );
      
      setUnlockedSteps(allPreviousSteps);
    }
  }, [wizardState.currentStep, unlockedSteps]);
  
  // Define wizard steps (5-Step Flow)
  const steps = [
    { id: 1, name: 'Category & Scene' },
    { id: 2, name: 'Art Style' },
    { id: 3, name: 'Character' },
    { id: 4, name: 'Story Details' },
    { id: 5, name: 'Summary' }
  ];
  
  // Handle tab click to navigate between steps
  const handleTabClick = (stepId) => {
    if (unlockedSteps.includes(stepId)) {
      console.log(`[CreateBookPage] Tab clicked, navigating to step ${stepId}`);
      setWizardStep(stepId);
    }
  };
  
  // Render the current wizard step
  const renderStep = () => {
    console.log(`[CreateBookPage] Rendering step: ${wizardState.currentStep}, artStyle: ${wizardState.storyData.artStyleCode}`);
    
    switch (wizardState.currentStep) {
      case 1:
        return <CategoryStep />;
      case 2:
        return <ArtStyleStep />;
      case 3:
        return <CharactersStep />;
      case 4:
        return <StoryDetailsStep />;
      case 5:
        return <SummaryStep />;
      default:
        console.warn(`Unknown wizard step: ${wizardState.currentStep}, returning to step 1.`);
        // Reset to step 1 if state is invalid
        setWizardStep(1);
        return <CategoryStep />;
    }
  };
  
  // Calculate current step number for display
  const displayStepNumber = wizardState.currentStep;
  const totalDisplaySteps = steps.length;
  
  const getStepName = (step) => {
    // Find step name from the steps array
    return steps.find(s => s.id === step)?.name || '';
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Wizard Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Create Your Personalized Book</h1>
        <p className="text-gray-600">
          Follow the steps to create a unique storybook featuring your characters
        </p>
      </div>
      
      {/* Navigation Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          {steps.map((step) => (
            <li key={step.id} className="mr-2">
              <button
                onClick={() => handleTabClick(step.id)}
                className={`inline-block p-4 border-b-2 rounded-t-lg ${
                  wizardState.currentStep === step.id 
                    ? 'text-blue-600 border-blue-600' 
                    : unlockedSteps.includes(step.id)
                      ? 'border-transparent hover:text-gray-600 hover:border-gray-300'
                      : 'text-gray-400 cursor-not-allowed border-transparent'
                }`}
                disabled={!unlockedSteps.includes(step.id)}
              >
                {step.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            Step {displayStepNumber} of {totalDisplaySteps}
          </span>
          <span className="text-sm font-medium">
            {getStepName(wizardState.currentStep)}
          </span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
            style={{ width: `${(displayStepNumber / totalDisplaySteps) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Current Step */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        {renderStep()}
      </div>
    </div>
  );
}

export default CreateBookPage; 