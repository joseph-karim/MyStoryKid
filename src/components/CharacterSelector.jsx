import { useState } from 'react';
import { useCharacterStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterCreator from './CharacterCreator';

function CharacterSelector({ onSelectCharacter, selectedCharacterId }) {
  const { characters, openCharacterModal, closeCharacterModal, isModalOpen, currentCharacter, addCharacter, updateCharacter } = useCharacterStore();
  const [filterType, setFilterType] = useState('all');
  
  // Filter characters by type if a filter is selected
  const filteredCharacters = filterType === 'all' 
    ? characters 
    : characters.filter(char => char.type === filterType);
  
  const handleSaveCharacter = (character) => {
    if (character.id && characters.some(c => c.id === character.id)) {
      updateCharacter(character);
    } else {
      addCharacter(character);
    }
    closeCharacterModal();
  };
  
  // Character types for the filter
  const characterTypes = [
    { id: 'all', label: 'All' },
    { id: 'child', label: 'Main Character' },
    { id: 'sibling', label: 'Siblings' },
    { id: 'friend', label: 'Friends' },
    { id: 'magical', label: 'Magical' },
    { id: 'animal', label: 'Animals' }
  ];
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Character controls header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Characters</h2>
        <button
          onClick={() => openCharacterModal()}
          className="bg-white text-purple-600 px-4 py-2 rounded-full text-sm font-medium hover:bg-purple-50 transition-colors"
        >
          + New Character
        </button>
      </div>
      
      {/* Filter tabs */}
      <div className="border-b border-gray-200 px-4">
        <div className="flex overflow-x-auto py-2 gap-2">
          {characterTypes.map(type => (
            <button
              key={type.id}
              onClick={() => setFilterType(type.id)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                filterType === type.id
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Character grid */}
      <div className="p-4 h-96 overflow-y-auto">
        {filteredCharacters.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
            <div className="text-5xl mb-4">🧙‍♂️</div>
            <p className="mb-2">No characters found</p>
            <button 
              onClick={() => openCharacterModal()}
              className="text-blue-600 hover:underline text-sm"
            >
              Create your first character
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredCharacters.map(character => (
              <motion.div
                key={character.id}
                layoutId={`character-${character.id}`}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                onClick={() => onSelectCharacter(character)}
                className={`relative cursor-pointer rounded-lg overflow-hidden shadow-md ${
                  selectedCharacterId === character.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {/* Character image */}
                <div className="aspect-[3/4] bg-gray-100">
                  <img 
                    src={character.stylePreview} 
                    alt={character.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Edit button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openCharacterModal(character);
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                
                {/* Character info */}
                <div className="p-3 bg-white border-t border-gray-200">
                  <h3 className="font-medium text-gray-900 truncate">{character.name}</h3>
                  <p className="text-xs text-gray-500">{character.age} year old {character.gender}</p>
                </div>
                
                {/* Selected indicator */}
                {selectedCharacterId === character.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500"></div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      {/* Character Creator Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-4xl"
            >
              <CharacterCreator 
                onSave={handleSaveCharacter} 
                onCancel={closeCharacterModal}
                existingCharacter={currentCharacter}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default CharacterSelector; 