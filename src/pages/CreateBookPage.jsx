import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useBookStore } from '../store';

// Step components
import IntroStep from '../components/wizard/IntroStep';
import StoryDetailsStep from '../components/wizard/StoryDetailsStep';
import CharactersStep from '../components/wizard/CharactersStep';
import ArtStyleStep from '../components/wizard/ArtStyleStep';
import SummaryStep from '../components/wizard/SummaryStep';

function CreateBookPage() {
  const { isAuthenticated } = useAuthStore();
  const { wizardState, resetWizard, updateStoryData } = useBookStore();
  const navigate = useNavigate();
  
  // Authentication check removed for testing
  
  // Reset wizard state when component mounts
  useEffect(() => {
    resetWizard();
  }, [resetWizard]);
  
  // Define wizard steps
  const steps = [
    { id: 1, name: 'Introduction' },
    { id: 2, name: 'Art Style' },  // Add Art Style as a separate step
    { id: 3, name: 'Characters' },
    { id: 4, name: 'Story Details' },
    { id: 5, name: 'Summary & Generate' }
  ];
  
  // Render the current wizard step
  const renderStep = () => {
    switch (wizardState.step) {
      case 1:
        return <IntroStep />;
      case 2:
        return <ArtStyleStep />;  // New Art Style step
      case 3:
        return <CharactersStep />;
      case 4:
        return <StoryDetailsStep />;
      case 5:
        return <SummaryStep />;
      default:
        console.warn(`Unknown wizard step: ${wizardState.step}, returning to step 1.`);
        return <IntroStep />;
    }
  };
  
  // Calculate current step number for display (adjusting for generating step being #4)
  const displayStepNumber = wizardState.step === 4 ? 4 : wizardState.step;
  const totalDisplaySteps = 4; // Total steps including Generating
  
  const getStepName = (step) => {
     switch (step) {
         case 1: return 'Introduction';
         case 2: return 'Art Style';
         case 3: return 'Characters';
         case 4: return 'Story Details';
         case 5: return 'Summary & Generate';
         default: return '';
     }
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
      
      {/* Progress Bar - Updated for 4 steps */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            Step {displayStepNumber} of {totalDisplaySteps}
          </span>
          <span className="text-sm font-medium">
            {getStepName(wizardState.step)}
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