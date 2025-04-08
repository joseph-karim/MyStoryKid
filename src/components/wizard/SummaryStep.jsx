import { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { getFriendlyStyleName, getFriendlySceneName } from '../../services/dzineService';
import { useNavigate } from 'react-router-dom';

function SummaryStep() {
  const {
    wizardState,
    setWizardStep,
  } = useBookStore();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  // Get data from the correct location in the store
  const { storyData = {} } = wizardState || {};
  const bookDetails = storyData;
  const characters = storyData.bookCharacters || [];
  
  // New function to safely get field values with fallbacks
  const getFieldValue = (fieldName, alternativeNames = [], defaultValue = 'N/A') => {
    // First check if the primary field exists
    if (bookDetails && bookDetails[fieldName] && bookDetails[fieldName] !== '') {
      return bookDetails[fieldName];
    }
    
    // Then check alternative field names
    for (const altName of alternativeNames) {
      if (bookDetails && bookDetails[altName] && bookDetails[altName] !== '') {
        return bookDetails[altName];
      }
    }
    
    // Return default if nothing found
    return defaultValue;
  };
  
  useEffect(() => {
    // Debug log to see what data we actually have
    console.log("[SummaryStep] wizardState:", wizardState);
    console.log("[SummaryStep] storyData:", storyData);
    console.log("[SummaryStep] extracted bookDetails:", bookDetails);
    console.log("[SummaryStep] characters:", characters);
  }, [wizardState, storyData]);
  
  const handleBack = () => {
    // Go back to the previous step (e.g., Story Details or whichever is appropriate)
    setWizardStep(5); // Story Details step number
  };
  
  const handleGenerateClick = () => {
    console.log("[SummaryStep] Generate button clicked. Navigating to generate-book");
    
    // Use direct linking with React Router's navigate
    try {
      // Attempt to navigate to the generate-book route
      navigate('/generate-book');
      console.log("[SummaryStep] Navigation to /generate-book triggered successfully");
    } catch (error) {
      console.error("[SummaryStep] Navigation failed:", error);
      setError("Failed to navigate to book generation. Please try again.");
    }
  };
  
  // Helper function to get a friendly style name
  const getStyleDisplayName = (styleCode) => {
    if (!styleCode) return 'Not Selected';
    if (styleCode === 'custom') return 'Custom Style';
    return getFriendlyStyleName(styleCode);
  };
  
  // Helper function to get a friendly scene name
  const getSceneDisplayName = (sceneId) => {
    if (!sceneId) return 'Not Selected';
    if (sceneId === 'custom_scene') return 'Custom Setting';
    return getFriendlySceneName(sceneId);
  };
  
  // Get fields with fallbacks using our new helper function
  const storyType = getFieldValue('storyType', [], 'standard');
  const ageRange = getFieldValue('ageRange', ['targetAgeRange'], 'Not specified');
  const theme = getFieldValue('coreTheme', ['category', 'theme'], 'Not specified');
  const tone = getFieldValue('toneStyle', ['tone'], 'Not specified');
  const plotIdea = getFieldValue('mainChallengePlot', ['storyStart', 'plotIdea'], 'Not specified');
  const coreConcept = getFieldValue('coreConcept', ['concept'], 'Not specified');
  const keyItems = getFieldValue('keyObjectsActions', ['keyItems'], 'Not specified');
  
  // Get style and scene names
  const artStyleCode = getFieldValue('artStyleCode', ['styleCode'], '');
  const mainScene = getFieldValue('mainScene', ['scene'], '');
  const selectedStyleName = getStyleDisplayName(artStyleCode);
  const selectedSceneName = getSceneDisplayName(mainScene);
  
  // --- Default Summary UI ---
  return (
    <div className="space-y-6 pb-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Story Summary</h2>
        <p className="text-gray-600">Review your story details before generating your book</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {/* Story Details - Using our getFieldValue helper */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Core Details</h3>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <p><span className="font-semibold">Type:</span> {storyType}</p>
            <p><span className="font-semibold">Age Range:</span> {ageRange}</p>
            <p><span className="font-semibold">Theme:</span> {theme}</p>
            <p><span className="font-semibold">Tone:</span> {tone}</p>
            <p className="md:col-span-2"><span className="font-semibold">Plot Idea:</span> {plotIdea}</p>
            {storyType === 'board_book' && <p><span className="font-semibold">Concept:</span> {coreConcept}</p>}
            {storyType === 'board_book' && <p className="md:col-span-2"><span className="font-semibold">Key Items:</span> {keyItems}</p>}
          </div>
        </div>
        
        {/* Main Scene/Setting */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Main Scene/Setting</h3>
          <div className="mt-2">
            <p className="font-medium">{selectedSceneName}</p>
            {mainScene === 'custom_scene' && bookDetails?.customSceneDescription && (
              <p className="text-sm text-gray-600 mt-1">{bookDetails.customSceneDescription}</p>
            )}
          </div>
        </div>
        
        {/* Art Style */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Art Style</h3>
          <div className="mt-2">
            <p className="font-medium">{selectedStyleName}</p>
            {artStyleCode === 'custom' && bookDetails?.customStyleDescription && (
              <p className="text-sm text-gray-600 mt-1">{bookDetails.customStyleDescription}</p>
            )}
          </div>
        </div>
        
        {/* Characters */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Characters</h3>
          <div className="mt-2 space-y-3">
            {characters && characters.length > 0 ? (
              characters.map(character => (
                <div key={character.id || character.name} className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                    {/* Placeholder for character image/icon */}
                    <span className="text-xl">{character.name ? character.name.charAt(0).toUpperCase() : '?'}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{character.name || 'Unnamed Character'}</p>
                    <p className="text-sm text-gray-500">Role: {character.role || character.type || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Traits: {character.traits?.join(', ') || 'N/A'}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No characters defined.</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <button
          onClick={handleBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back
        </button>
        <button
          onClick={handleGenerateClick}
          className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Generate Book
        </button>
      </div>
    </div>
  );
}

export default SummaryStep; 