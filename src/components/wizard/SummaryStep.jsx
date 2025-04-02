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
  
  const { bookDetails, characters } = wizardState;
  
  const handleBack = () => {
    // Go back to the previous step (e.g., Story Details or whichever is appropriate)
    setWizardStep('storyDetails'); // Adjust step name/number as needed
  };
  
  const handleGenerateClick = (e) => {
    console.log("[SummaryStep] Generate button clicked. Navigating to /generate-book");
    
    // Add direct logging to debug if we actually get here
    console.log("[SummaryStep] About to navigate...");
    
    // Prevent potential store-based generation from taking over
    e.preventDefault();
    e.stopPropagation();
    
    setError('');
    navigate('/generate-book'); // Navigate to the new generation step
    
    // More debugging to see if we get here
    console.log("[SummaryStep] Navigation to /generate-book should have happened!");
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
  
  const selectedStyleName = getStyleDisplayName(bookDetails?.artStyleCode);
  const selectedSceneName = getSceneDisplayName(bookDetails?.mainScene);
  
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
        {/* Story Details - Adjust based on actual bookDetails structure */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Core Details</h3>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <p><span className="font-semibold">Type:</span> {bookDetails?.storyType || 'N/A'}</p>
            <p><span className="font-semibold">Age Range:</span> {bookDetails?.targetAgeRange || 'N/A'}</p>
            <p><span className="font-semibold">Theme:</span> {bookDetails?.coreTheme || 'N/A'}</p>
            <p><span className="font-semibold">Tone:</span> {bookDetails?.tone || 'N/A'}</p>
            <p className="md:col-span-2"><span className="font-semibold">Plot Idea:</span> {bookDetails?.mainChallengePlot || 'N/A'}</p>
            {bookDetails?.storyType === 'board_book' && <p><span className="font-semibold">Concept:</span> {bookDetails?.coreConcept || 'N/A'}</p>}
            {bookDetails?.storyType === 'board_book' && <p className="md:col-span-2"><span className="font-semibold">Key Items:</span> {bookDetails?.keyObjectsActions || 'N/A'}</p>}
          </div>
        </div>
        
        {/* Main Scene/Setting - Assuming scene details are in bookDetails */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Main Scene/Setting</h3>
          <div className="mt-2">
            <p className="font-medium">{selectedSceneName}</p>
            {bookDetails?.mainScene === 'custom_scene' && bookDetails?.customSceneDescription && (
              <p className="text-sm text-gray-600 mt-1">{bookDetails.customSceneDescription}</p>
            )}
          </div>
        </div>
        
        {/* Art Style - Assuming style code is in bookDetails */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Art Style</h3>
          <div className="mt-2">
            <p className="font-medium">{selectedStyleName}</p>
            {bookDetails?.artStyleCode === 'custom' && bookDetails?.customStyleDescription && (
              <p className="text-sm text-gray-600 mt-1">{bookDetails.customStyleDescription}</p>
            )}
          </div>
        </div>
        
        {/* Characters - Assuming characters are directly in wizardState */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Characters</h3>
          <div className="mt-2 space-y-3">
            {characters && characters.length > 0 ? (
              characters.map(character => (
                <div key={character.id} className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                    {/* Placeholder for character image/icon */}
                    <span className="text-xl">{character.name ? character.name.charAt(0).toUpperCase() : '?'}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{character.name || 'Unnamed Character'}</p>
                    <p className="text-sm text-gray-500">Role: {character.role || 'N/A'}</p>
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