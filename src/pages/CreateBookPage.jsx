import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useBookStore } from '../store';

// Step components
import CategoryStep from '../components/wizard/CategoryStep';
import CharactersStep from '../components/wizard/CharactersStep';
import GeneratingStep from '../components/wizard/GeneratingStep';

function CreateBookPage() {
  const { isAuthenticated } = useAuthStore();
  const { wizardState, setWizardStep, updateStoryData } = useBookStore();
  const navigate = useNavigate();
  
  // Authentication check removed for testing
  
  // Reset wizard state when component mounts
  useEffect(() => {
    setWizardStep(1);
    updateStoryData({
      category: '',
      bookCharacters: [],
      artStyle: '',
    });
  }, [setWizardStep, updateStoryData]);
  
  // Render current step based on wizardState.step
  const renderStep = () => {
    switch (wizardState.step) {
      case 1:
        return <CategoryStep />;
      case 2:
        return <CharactersStep />;
      case 4:
        return <GeneratingStep />;
      default:
        return <CategoryStep />;
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
      
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium">
            Step {wizardState.step === 3 ? '2' : wizardState.step} of 3
          </span>
          <span className="text-sm font-medium">
            {wizardState.step === 1 ? 'Choose Story Foundation' : 
             wizardState.step === 2 ? 'Add Characters' : 
             wizardState.step === 4 ? 'Generating Story' : ''}
          </span>
        </div>
        <div className="w-full bg-gray-200 h-2 rounded-full">
          <div 
            className="bg-blue-600 h-2 rounded-full" 
            style={{ width: `${(wizardState.step === 4 ? 3 : wizardState.step) / 3 * 100}%` }}
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