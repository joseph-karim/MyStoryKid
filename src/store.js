import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // If you use persistence
import { v4 as uuidv4 } from 'uuid'; // Needed if wizard uses it

// --- Auth Store --- 
export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null, // Store user info like name, email, uid
      token: null, // Store auth token if needed
      
      // Placeholder login action
      login: (userData, token) => set({
        isAuthenticated: true,
        user: userData,
        token: token
      }),
      
      // Placeholder logout action
      logout: () => set({
        isAuthenticated: false,
        user: null,
        token: null
      }),
    }),
    {
      name: 'auth-storage', // Name of the item in storage (must be unique)
      // You might want to configure storage (e.g., localStorage or sessionStorage)
      // getStorage: () => sessionStorage, // Example using sessionStorage
    }
  )
);

// --- Character Store --- 
// (Assuming this exists or you might add it later)
export const useCharacterStore = create((set) => ({
  characters: [],
  addCharacter: (character) => set((state) => ({ characters: [...state.characters, character] })),
  updateCharacter: (id, updates) => set((state) => ({
    characters: state.characters.map((char) => char.id === id ? { ...char, ...updates } : char),
  })),
  removeCharacter: (id) => set((state) => ({ characters: state.characters.filter((char) => char.id !== id) })),
}));

// --- Book Store --- 
export const useBookStore = create(
  persist(
    (set, get) => ({
      wizardState: { currentStep: 1, isComplete: false, storyData: {} },
      books: [], // Array to hold generated books

      setWizardStep: (step) => {
        console.log(`[Store] Setting wizard step to: ${step}`);
        set((state) => ({ wizardState: { ...state.wizardState, currentStep: step } }));
      },
      
      updateStoryData: (data) => {
        console.log(`[Store] Updating story data:`, data);
        set((state) => ({
          wizardState: { 
            ...state.wizardState, 
            storyData: { ...state.wizardState.storyData, ...data } 
          }
        }));
      },
      
      resetWizard: () => {
        console.log(`[Store] Resetting wizard state`);
        set({ wizardState: { currentStep: 1, isComplete: false, storyData: {} } });
      },

      // Modified generateBook to return ID
      generateBook: async () => {
        const { wizardState } = get();
        const storyData = wizardState.storyData;
        console.log('Generating book with data:', storyData);

        // MOCK GENERATION & ID
        await new Promise(resolve => setTimeout(resolve, 2000)); 
        const newBookId = `book-${Date.now()}`;
        const newBook = {
          id: newBookId,
          title: storyData.title || 'Untitled Story',
          category: storyData.category,
          scene: storyData.mainScene,
          artStyleCode: storyData.artStyleCode,
          artStyleName: getStyleNameFromCode(storyData.artStyleCode), 
          characters: storyData.bookCharacters || [],
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          books: [...state.books, newBook],
          wizardState: { ...state.wizardState, isComplete: true }
        }));

        console.log('Book added to store:', newBook);
        return newBookId; // RETURN ID
      },

      // Add other book-related actions as needed (fetchBooks, getBookById, etc.)
    }),
    {
      name: 'book-wizard-storage', // Persist the state in localStorage
    }
  )
);

// --- Helper Function (ensure it's available or imported) ---
// (This might need to be moved or imported if not already globally available)
const getStyleNameFromCode = (styleCode) => {
  // ... (Implementation as seen in SummaryStep.jsx or similar)
    if (!styleCode) return null;
    if (styleCode === 'custom') return 'Custom Style';
    if (styleCode.startsWith('Style-')) {
      const styleMap = { /* ... map from SummaryStep ... */ };
      return styleMap[styleCode] || 'API Style';
    }
    return styleCode.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}; 