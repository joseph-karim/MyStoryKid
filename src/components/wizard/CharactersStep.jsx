import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBookStore } from '../../store';
import CharacterWizard from '../CharacterWizard';
import { PlusIcon, PencilIcon, TrashIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/outline';

// Import the ART_STYLE_CATEGORIES_STRUCTURE for style name lookups
import { ART_STYLE_CATEGORIES_STRUCTURE } from './ArtStyleStep';

// Character relationship types
const RELATIONSHIP_TYPES = [
  { id: 'sibling', label: 'Sibling', icon: UserGroupIcon },
  { id: 'friend', label: 'Friend', icon: UserPlusIcon },
  { id: 'cousin', label: 'Cousin', icon: UserGroupIcon },
  { id: 'pet', label: 'Pet', icon: null },
  { id: 'other', label: 'Other', icon: null }
];

function CharactersStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();

  const [showCharacterWizard, setShowCharacterWizard] = useState(false);
  const [currentCharacterRole, setCurrentCharacterRole] = useState('main');
  const [currentRelationshipType, setCurrentRelationshipType] = useState('sibling');
  const [editingCharacterId, setEditingCharacterId] = useState(null);
  const [error, setError] = useState('');

  // Art style is set in the ArtStyleStep
  const artStyleCode = wizardState.storyData.artStyleCode || '';

  // Get all characters from bookCharacters array
  const characters = wizardState.storyData.bookCharacters || [];

  // Get the main character from bookCharacters array
  const mainCharacter = characters.find(c => c.role === 'main') || null;

  // Get supporting characters
  const supportingCharacters = characters.filter(c => c.role !== 'main');

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

  const handleAddCharacter = (role = 'supporting', relationshipType = 'sibling') => {
    setCurrentCharacterRole(role);
    setCurrentRelationshipType(relationshipType);
    setEditingCharacterId(null);
    setShowCharacterWizard(true);
  };

  const handleEditCharacter = (characterId) => {
    console.log('[CharactersStep] Editing character with art style:', artStyleCode);
    const character = characters.find(c => c.id === characterId);
    if (character) {
      setCurrentCharacterRole(character.role);
      setCurrentRelationshipType(character.relationshipType || 'sibling');
      setEditingCharacterId(characterId);
      setShowCharacterWizard(true);
    } else {
      // If no ID provided, assume editing main character
      setCurrentCharacterRole('main');
      setEditingCharacterId(mainCharacter?.id);
      setShowCharacterWizard(true);
    }
  };

  const handleDeleteCharacter = (characterId) => {
    // Don't allow deleting the main character
    if (characters.find(c => c.id === characterId)?.role === 'main') {
      setError("You cannot delete the main character.");
      return;
    }

    // Filter out the character to delete
    const updatedCharacters = characters.filter(c => c.id !== characterId);
    updateStoryData({ bookCharacters: updatedCharacters });
  };

  const handleCharacterComplete = (character) => {
    if (!character) {
      console.log('[CharactersStep] Character creation canceled');
      setShowCharacterWizard(false);
      return;
    }

    console.log('[CharactersStep] Character completed:', character);

    // Set the role and relationship type based on current context
    const characterWithRole = {
      ...character,
      role: currentCharacterRole,
      relationshipType: currentCharacterRole === 'main' ? null : currentRelationshipType,
      customRole: currentRelationshipType === 'other' ? character.customRole : RELATIONSHIP_TYPES.find(r => r.id === currentRelationshipType)?.label,
      // Ensure the art style is explicitly set
      artStyle: character.artStyle || artStyleCode
    };

    // If editing an existing character, update it
    if (editingCharacterId) {
      const updatedCharacters = characters.map(c =>
        c.id === editingCharacterId ? characterWithRole : c
      );
      updateStoryData({ bookCharacters: updatedCharacters });
    } else {
      // If it's a main character and we already have one, replace it
      if (currentCharacterRole === 'main' && mainCharacter) {
        const updatedCharacters = characters.map(c =>
          c.role === 'main' ? characterWithRole : c
        );
        updateStoryData({ bookCharacters: updatedCharacters });
      } else {
        // Otherwise add the new character to the list
        updateStoryData({ bookCharacters: [...characters, characterWithRole] });
      }
    }

    console.log('[CharactersStep] Updated store with characters');
    setShowCharacterWizard(false);
    setEditingCharacterId(null);
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

  // Check if we need to show the wizard initially (main character should already be created)
  useEffect(() => {
    // Main character should already be created in CharacterStep
    // Only show wizard if somehow we don't have a main character
    if (!mainCharacter && characters.length === 0) {
      setCurrentCharacterRole('main');
      setShowCharacterWizard(true);
    }
  }, [mainCharacter, characters.length]);

  // Group supporting characters by relationship type
  const groupedCharacters = supportingCharacters.reduce((acc, char) => {
    const type = char.relationshipType || 'other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(char);
    return acc;
  }, {});

  // Character card component for reuse
  const CharacterCard = ({ character, isMain = false }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-md p-4 relative space-y-2"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold">{character.name}</h3>
          {!isMain && character.customRole && (
            <p className="text-sm text-gray-500">{character.customRole}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleEditCharacter(character.id)}
            className="p-1 text-gray-500 hover:text-blue-600"
            title="Edit character"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          {!isMain && (
            <button
              onClick={() => handleDeleteCharacter(character.id)}
              className="p-1 text-gray-500 hover:text-red-600"
              title="Delete character"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Character Image */}
        {character.stylePreview && (
          <div className="w-24 h-24 flex-shrink-0">
            <img
              src={character.stylePreview}
              alt={character.name}
              className="w-full h-full object-cover rounded-md"
            />
          </div>
        )}

        {/* Character Details */}
        <div className="flex-grow space-y-1 text-sm">
          <p><span className="font-semibold">Role:</span> {isMain ? 'Main Character' : character.customRole || 'Supporting Character'}</p>
          <p><span className="font-semibold">Age:</span> {character.age || 'Not specified'}</p>
          <p><span className="font-semibold">Gender:</span> {character.gender || 'Not specified'}</p>
          {character.traits && character.traits.length > 0 && (
            <p><span className="font-semibold">Traits:</span> {character.traits.slice(0, 3).join(', ')}{character.traits.length > 3 && '...'}</p>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Story Characters</h2>
        <p className="text-gray-600">
          Add more characters to join {mainCharacter?.name || 'the main character'} in the adventure
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {showCharacterWizard ? (
        <CharacterWizard
          initialRole={currentCharacterRole}
          forcedArtStyle={artStyleCode}
          onComplete={handleCharacterComplete}
          existingCharacter={editingCharacterId ? characters.find(c => c.id === editingCharacterId) : null}
        />
      ) : (
        <>
          <div className="space-y-6">
            {/* Main Character Section */}
            <div>
              <h3 className="text-xl font-semibold mb-3">Main Character</h3>
              {mainCharacter ? (
                <CharacterCard character={mainCharacter} isMain={true} />
              ) : (
                <div className="bg-gray-100 p-6 rounded-lg text-center">
                  <p className="text-gray-500">Main character should be created in the previous step.</p>
                  <button
                    onClick={() => setWizardStep(1)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Go Back to Create Main Character
                  </button>
                </div>
              )}
            </div>

            {/* Quick Add Buttons */}
            {mainCharacter && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Quick Add Characters</h4>
                <div className="flex flex-wrap gap-2">
                  {RELATIONSHIP_TYPES.slice(0, 4).map(type => (
                    <button
                      key={type.id}
                      onClick={() => handleAddCharacter('supporting', type.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      {type.icon && <type.icon className="h-4 w-4" />}
                      Add {type.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Supporting Characters Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-semibold">Supporting Characters</h3>
                <button
                  onClick={() => handleAddCharacter('supporting')}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add Character
                </button>
              </div>

              {supportingCharacters.length > 0 ? (
                <div className="space-y-4">
                  {/* Group characters by relationship type */}
                  {Object.entries(groupedCharacters).map(([type, chars]) => (
                    <div key={type}>
                      <h4 className="text-sm font-semibold text-gray-600 mb-2 capitalize">
                        {RELATIONSHIP_TYPES.find(r => r.id === type)?.label || 'Other'} 
                        {chars.length > 1 && 's'} ({chars.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {chars.map(character => (
                          <CharacterCard key={character.id} character={character} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <p className="text-gray-500">No supporting characters yet. Add siblings, friends, or pets to make your story more interesting!</p>
                </div>
              )}
            </div>

            {/* Character Count Summary */}
            {characters.length > 1 && (
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-600">
                <p>Total characters in story: <span className="font-semibold">{characters.length}</span></p>
              </div>
            )}
          </div>

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