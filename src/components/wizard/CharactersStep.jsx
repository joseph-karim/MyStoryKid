import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBookStore, useCharacterStore } from '../../store';
import CharacterWizard from '../CharacterWizard';

// Character roles
const CHARACTER_ROLES = [
  { id: 'main', label: 'Main Character', description: 'The hero of the story (usually your child)' },
  { id: 'sidekick', label: 'Sidekick', description: 'Friend or companion who helps the main character' },
  { id: 'mentor', label: 'Mentor', description: 'Wise character who guides the main character' },
  { id: 'pet', label: 'Pet', description: 'Animal companion on the adventure' },
  { id: 'magical', label: 'Magical Friend', description: 'A fairy, creature or magical being' },
];

function CharactersStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  const { characters } = useCharacterStore();
  
  // State for book characters (characters with roles)
  const [bookCharacters, setBookCharacters] = useState(wizardState.storyData.bookCharacters || []);
  const [showCharacterWizard, setShowCharacterWizard] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [artStyle, setArtStyle] = useState(wizardState.storyData.artStyle || 'cartoon');

  // Load data from store when component mounts
  useEffect(() => {
    setBookCharacters(wizardState.storyData.bookCharacters || []);
    // Suggest art style based on story category
    if (wizardState.storyData.category) {
      const category = wizardState.storyData.category;
      if (category === 'adventure') setArtStyle('cartoon');
      else if (category === 'fantasy') setArtStyle('watercolor');
      else if (category === 'bedtime') setArtStyle('classic');
      else if (category === 'learning') setArtStyle('pencil');
      else if (category === 'birthday') setArtStyle('papercut');
    }
  }, [wizardState.storyData]);

  const handleAddCharacter = (role) => {
    setSelectedRole(role);
    setShowCharacterWizard(true);
  };

  const handleCharacterComplete = (character) => {
    if (!character) {
      // User canceled character creation
      setShowCharacterWizard(false);
      return;
    }

    // Add character with role
    const characterWithRole = {
      ...character,
      role: selectedRole,
      artStyle: artStyle, // Ensure all characters use the same art style
    };

    setBookCharacters([...bookCharacters, characterWithRole]);
    setShowCharacterWizard(false);
    setError('');
  };

  const removeCharacter = (characterId) => {
    setBookCharacters(bookCharacters.filter(char => char.id !== characterId));
  };

  const handleBack = () => {
    setWizardStep(1);
  };

  const handleContinue = () => {
    if (bookCharacters.length === 0) {
      setError('Please add at least one character');
      return;
    }

    // Check if we have a main character
    const hasMainCharacter = bookCharacters.some(char => char.role === 'main');
    if (!hasMainCharacter) {
      setError('Please add a main character');
      return;
    }

    // Update store with character data and art style
    updateStoryData({ 
      bookCharacters,
      artStyle
    });
    
    // Skip the art style step since we now handle it here
    setWizardStep(4);
  };

  return (
    <div className="space-y-6">
      {showCharacterWizard ? (
        <CharacterWizard 
          onComplete={handleCharacterComplete} 
          initialStep={1}
          forcedArtStyle={artStyle}
        />
      ) : (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Add Characters</h2>
            <p className="text-gray-600">Who will be in your story?</p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Art Style Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Character Style</h3>
            <p className="text-sm text-gray-600 mb-3">
              All characters in your story will share the same style
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              {['cartoon', 'watercolor', 'classic', 'pencil', 'papercut'].map((style) => (
                <div
                  key={style}
                  className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                    artStyle === style 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => setArtStyle(style)}
                >
                  <div className="aspect-square bg-gray-200 mb-2 rounded">
                    {/* In a real app, this would show a sample of the style */}
                  </div>
                  <div className="text-center text-sm font-medium capitalize">
                    {style}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Characters List */}
          {bookCharacters.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Your Characters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bookCharacters.map((character) => (
                  <motion.div
                    key={character.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex border rounded-lg p-3 items-center"
                  >
                    <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden mr-3">
                      <img 
                        src={character.stylePreview || 'https://via.placeholder.com/64'} 
                        alt={character.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{character.name}</p>
                      <p className="text-sm text-gray-600">
                        {CHARACTER_ROLES.find(r => r.id === character.role)?.label}
                      </p>
                    </div>
                    <button 
                      onClick={() => removeCharacter(character.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Add New Character */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Add a Character</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CHARACTER_ROLES.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleAddCharacter(role.id)}
                  className="border rounded-lg p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <h4 className="font-medium">{role.label}</h4>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-between pt-4">
            <button
              onClick={handleBack}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-100"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CharactersStep; 