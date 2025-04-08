import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBookStore } from '../../store';
import CharacterWizard from '../CharacterWizard';

// Import the ART_STYLE_CATEGORIES_STRUCTURE for style name lookups
import { ART_STYLE_CATEGORIES_STRUCTURE } from './ArtStyleStep';

function CharactersStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  
  const [showCharacterWizard, setShowCharacterWizard] = useState(false);
  const [error, setError] = useState('');
  
  // Art style is set in the ArtStyleStep
  const artStyleCode = wizardState.storyData.artStyleCode || '';
  
  // Get the main character from bookCharacters array
  const mainCharacter = wizardState.storyData.bookCharacters?.[0] || null;
  
  // Function to get style name from API style code
  const getStyleNameFromCode = (styleCode) => {
    if (!styleCode) return 'Default Style';
    
    // Try to find the style in our ART_STYLE_CATEGORIES_STRUCTURE
    let styleName = null;
    for (const category of ART_STYLE_CATEGORIES_STRUCTURE) {
      for (const style of category.styleIds) {
        if (style.apiCode === styleCode) {
          styleName = style.title;
          break;
        }
      }
      if (styleName) break;
    }
    
    // If found, return it
    if (styleName) return styleName;
    
    // Finally, if all else fails, just return the code
    return styleCode.replace('Style-', '').substring(0, 8) + '...';
  };
  
  const handleEditCharacter = () => {
    setShowCharacterWizard(true);
  };
  
  const handleCharacterComplete = (character) => {
    if (!character) {
      setShowCharacterWizard(false);
      return;
    }
    
    // Set the role to 'main' explicitly
    const characterWithRole = {
      ...character,
      role: 'main'
    };
    
    // Update the store with the single character
    updateStoryData({ bookCharacters: [characterWithRole] });
    
    setShowCharacterWizard(false);
  };
  
  const handleNext = () => {
    if (!mainCharacter) {
      setError('Please add your main character before continuing.');
      return;
    }
    
    setWizardStep(4); // Go to Story Details step
  };
  
  const handleBack = () => {
    setWizardStep(2); // Go back to Art Style step
  };
  
  // Check if we need to show the wizard initially (no character yet)
  useEffect(() => {
    if (!mainCharacter) {
      setShowCharacterWizard(true);
    }
  }, [mainCharacter]);
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Your Main Character</h2>
        <p className="text-gray-600">
          Create the main character for your story
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {showCharacterWizard ? (
        <CharacterWizard
          initialRole="main"
          forcedArtStyle={artStyleCode}
          onComplete={handleCharacterComplete}
        />
      ) : (
        <>
          {mainCharacter ? (
            <div className="bg-white rounded-lg shadow-md p-6 relative space-y-3">
              <h3 className="text-xl font-semibold">{mainCharacter.name}</h3>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Character Image */}
                {mainCharacter.stylePreview && (
                  <div className="w-32 h-32 flex-shrink-0">
                    <img 
                      src={mainCharacter.stylePreview}
                      alt={mainCharacter.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                )}
                
                {/* Character Details */}
                <div className="flex-grow space-y-2">
                  <p><span className="font-semibold">Age:</span> {mainCharacter.age || 'Not specified'}</p>
                  <p><span className="font-semibold">Gender:</span> {mainCharacter.gender || 'Not specified'}</p>
                  <p><span className="font-semibold">Type:</span> {mainCharacter.type || 'Not specified'}</p>
                  <p><span className="font-semibold">Art Style:</span> {getStyleNameFromCode(mainCharacter.artStyle)}</p>
                </div>
              </div>
              
              <div className="mt-4 flex justify-center">
                <button
                  onClick={handleEditCharacter}
                  className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200"
                >
                  Edit Character
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 p-6 rounded-lg text-center">
              <p className="text-gray-500">No character created yet. Click the button below to create one.</p>
              <button 
                onClick={() => setShowCharacterWizard(true)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Main Character
              </button>
            </div>
          )}
          
          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            
            <button
              onClick={handleNext}
              disabled={!mainCharacter}
              className={`px-6 py-2 rounded-md text-sm font-medium text-white ${
                !mainCharacter 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CharactersStep; 