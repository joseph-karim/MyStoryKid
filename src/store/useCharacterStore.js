import { create } from 'zustand';

// Sample characters for demo purposes
const initialCharacters = [
  {
    id: 'char-1',
    name: 'Emily',
    type: 'child',
    gender: 'Girl',
    age: '6',
    traits: ['Curious', 'Kind', 'Adventurous'],
    interests: ['Space', 'Animals', 'Reading'],
    stylePreview: 'https://via.placeholder.com/300x400?text=Emily+in+cartoon+style',
    artStyle: 'cartoon',
    photoUrl: ''
  },
  {
    id: 'char-2',
    name: 'Max',
    type: 'friend',
    gender: 'Boy',
    age: '7',
    traits: ['Brave', 'Funny', 'Energetic'],
    interests: ['Dinosaurs', 'Sports', 'Building'],
    stylePreview: 'https://via.placeholder.com/300x400?text=Max+in+watercolor+style',
    artStyle: 'watercolor',
    photoUrl: ''
  }
];

const useCharacterStore = create((set, get) => ({
  // Character state
  characters: initialCharacters,
  currentCharacter: null,
  isModalOpen: false,
  
  // Actions
  addCharacter: (character) => {
    set((state) => ({
      characters: [...state.characters, { ...character, id: character.id || crypto.randomUUID() }]
    }));
  },
  
  updateCharacter: (updatedCharacter) => {
    set((state) => ({
      characters: state.characters.map(char => 
        char.id === updatedCharacter.id ? updatedCharacter : char
      )
    }));
  },
  
  deleteCharacter: (characterId) => {
    set((state) => ({
      characters: state.characters.filter(char => char.id !== characterId)
    }));
  },
  
  setCurrentCharacter: (character) => {
    set({ currentCharacter: character });
  },
  
  openCharacterModal: (character = null) => {
    set({ 
      isModalOpen: true,
      currentCharacter: character
    });
  },
  
  closeCharacterModal: () => {
    set({ 
      isModalOpen: false,
      currentCharacter: null
    });
  },
}));

export default useCharacterStore; 