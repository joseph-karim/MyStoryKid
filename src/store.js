import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // If you use persistence
import { v4 as uuidv4 } from 'uuid'; // Needed if wizard uses it

// --- Loading Store ---
export const useLoadingStore = create((set, get) => ({
  // Global loading states
  globalLoading: false,
  loadingStates: {}, // Object to track multiple loading operations by key
  progressStates: {}, // Object to track progress for different operations
  
  // Set global loading state
  setGlobalLoading: (isLoading) => set({ globalLoading: isLoading }),
  
  // Set loading state for a specific operation
  setLoading: (key, isLoading, message = '') => set((state) => ({
    loadingStates: {
      ...state.loadingStates,
      [key]: { isLoading, message, startTime: isLoading ? Date.now() : null }
    }
  })),
  
  // Set progress for a specific operation
  setProgress: (key, progress, message = '', estimatedTimeRemaining = null) => set((state) => ({
    progressStates: {
      ...state.progressStates,
      [key]: { 
        progress: Math.max(0, Math.min(100, progress)), // Clamp between 0-100
        message,
        estimatedTimeRemaining,
        lastUpdate: Date.now()
      }
    }
  })),
  
  // Clear loading state for a specific operation
  clearLoading: (key) => set((state) => {
    const newLoadingStates = { ...state.loadingStates };
    const newProgressStates = { ...state.progressStates };
    delete newLoadingStates[key];
    delete newProgressStates[key];
    return {
      loadingStates: newLoadingStates,
      progressStates: newProgressStates
    };
  }),
  
  // Clear all loading states
  clearAllLoading: () => set({
    globalLoading: false,
    loadingStates: {},
    progressStates: {}
  }),
  
  // Get loading state for a specific operation
  getLoadingState: (key) => {
    const state = get();
    return state.loadingStates[key] || { isLoading: false, message: '', startTime: null };
  },
  
  // Get progress state for a specific operation
  getProgressState: (key) => {
    const state = get();
    return state.progressStates[key] || { progress: 0, message: '', estimatedTimeRemaining: null, lastUpdate: null };
  },
  
  // Check if any operation is loading
  isAnyLoading: () => {
    const state = get();
    return state.globalLoading || Object.values(state.loadingStates).some(loading => loading.isLoading);
  }
}));

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