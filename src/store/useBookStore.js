import { create } from 'zustand';
import { generateCompleteBook } from '../services/storyGenerator.js';
import { v4 as uuidv4 } from 'uuid';

// Mock books data for testing
const mockBooks = [
  {
    id: 'book-1',
    title: 'Space Adventure with John',
    status: 'draft',
    childName: 'John',
    category: 'adventure',
    artStyle: 'cartoon',
    characters: [
      {
        id: 'char-1',
        name: 'John',
        role: 'main',
        type: 'child',
        gender: 'Boy',
        age: '6',
        traits: ['Curious', 'Kind', 'Adventurous'],
        interests: ['Space', 'Animals', 'Reading'],
        stylePreview: 'https://via.placeholder.com/300x400?text=John+in+cartoon+style',
        artStyle: 'cartoon',
        photoUrl: ''
      }
    ],
    pages: [
      {
        id: 'page-cover',
        type: 'cover',
        text: 'Space Adventure with John',
        imageUrl: 'https://via.placeholder.com/600x800?text=Space+Adventure+Cover',
      },
      {
        id: 'page-title',
        type: 'title',
        text: 'Space Adventure with John\n\nA story about John',
        imageUrl: '',
      },
      {
        id: 'page-1',
        type: 'content',
        text: 'John was a curious child who always dreamed of traveling to space.',
        imageUrl: 'https://via.placeholder.com/600x400?text=Page+1+Illustration',
      },
      {
        id: 'page-2',
        type: 'content',
        text: 'One night, a strange light appeared outside his window.',
        imageUrl: 'https://via.placeholder.com/600x400?text=Page+2+Illustration',
      },
      {
        id: 'page-back',
        type: 'back-cover',
        text: 'The End\n\nCreated with love for John',
        imageUrl: '',
      }
    ],
    createdAt: '2023-10-15T00:00:00.000Z',
    updatedAt: '2023-10-15T00:00:00.000Z',
  },
  {
    id: 'book-2',
    title: 'Emma\'s Jungle Expedition',
    status: 'purchased_digital',
    childName: 'Emma',
    category: 'adventure',
    artStyle: 'watercolor',
    characters: [
      {
        id: 'char-2',
        name: 'Emma',
        role: 'main',
        type: 'child',
        gender: 'Girl',
        age: '7',
        traits: ['Brave', 'Energetic', 'Smart'],
        interests: ['Nature', 'Animals', 'Exploring'],
        stylePreview: 'https://via.placeholder.com/300x400?text=Emma+in+watercolor+style',
        artStyle: 'watercolor',
        photoUrl: ''
      }
    ],
    pages: [
      {
        id: 'page-cover',
        type: 'cover',
        text: 'Emma\'s Jungle Expedition',
        imageUrl: 'https://via.placeholder.com/600x800?text=Jungle+Expedition+Cover',
      },
      {
        id: 'page-title',
        type: 'title',
        text: 'Emma\'s Jungle Expedition\n\nA story about Emma',
        imageUrl: '',
      },
      {
        id: 'page-1',
        type: 'content',
        text: 'Emma loved to explore and discover new things in nature.',
        imageUrl: 'https://via.placeholder.com/600x400?text=Page+1+Illustration',
      },
      {
        id: 'page-back',
        type: 'back-cover',
        text: 'The End\n\nCreated with love for Emma',
        imageUrl: '',
      }
    ],
    createdAt: '2023-09-28T00:00:00.000Z',
    updatedAt: '2023-09-28T00:00:00.000Z',
  },
];

// Define the initial state for the wizard and story data
const initialWizardState = {
  currentStep: 1, // Start at step 1
  isComplete: false,
  storyData: {
    // Step 1: Category & Scene
    category: '', // e.g., 'adventure', 'friendship', 'learning'
    customPrompt: '', // If category is 'custom'
    mainScene: '', // e.g., 'forest', 'space', 'school'
    customSceneDescription: '', // If scene is 'custom'
    
    // Step 2: Art Style
    artStyleCode: '', // Dzine style code (e.g., 'Style-xyz...')
    customStyleDescription: '', // If style is 'custom'
    selectedStyleKeywords: '', // Keywords derived from Dzine style for Segmind
    
    // Step 3 & 4: Characters
    bookCharacters: [], // Array of character objects
    
    // Step 5: Story Details
    title: '',
    ageRange: '', // e.g., '2-4', '4-8'
    wordCount: 500, // Default
    rhymeScheme: 'none', // e.g., 'none', 'AABB', 'ABAB'
    narrativeStyle: 'third_person_limited', // e.g., 'first_person', 'third_person_omniscient'
    toneStyle: 'playful', // e.g., 'playful', 'educational', 'calming'
    specificRequests: '',
    
    // Standard Story Arc fields (if storyType is standard)
    storyStart: '', // e.g., 'character_wants_something', 'ordinary_day'
    mainHurdle: '', // e.g., 'facing_fear', 'solving_puzzle'
    bigTry: '', // e.g., 'practices_skill', 'asks_for_help'
    turningPoint: '', // e.g., 'realization', 'unexpected_help'
    resolution: '', // e.g., 'problem_solved', 'goal_achieved'
    takeaway: '', // e.g., 'importance_of_sharing', 'bravery_rewarded'
    
    // Custom Prompt fields (if storyType is custom_prompt)
    // customPrompt is already defined above
    
    // Board Book fields (if storyType is board_book)
    coreConcept: '', // e.g., 'colors', 'numbers', 'animals'
    keyObjectsActions: '', // Comma-separated list
    
    // Custom details for standard arc
    customStoryStart: '',
    customMainHurdle: '',
    customBigTry: '',
    customTurningPoint: '',
    customResolution: '',
    customTakeaway: '',
    
    // Story Type Selection
    storyType: 'standard' // 'standard', 'custom_prompt', 'board_book'
  },
  // Optional: Add fields to track generation progress/status if needed
  // generationStatus: 'idle', // 'idle', 'generating', 'complete', 'error'
  // generatedBookData: null
};

// This is an expanded store for book data and creation flow
const useBookStore = create((set, get) => ({
  // Book state
  books: mockBooks, // Start with mock books for testing
  currentBook: null, // Book being created/edited
  isLoading: false,
  latestGeneratedBookId: null, // <-- NEW: Track the last generated ID
  
  // Book creation wizard state
  wizardState: initialWizardState,
  
  // Wizard actions
  setWizardStep: (step) => set(state => ({
    wizardState: { ...state.wizardState, currentStep: step }
  })),
  
  completeWizard: () => set(state => ({
    wizardState: { ...state.wizardState, isComplete: true }
  })),
  
  resetWizard: () => set({ wizardState: initialWizardState }),
  
  updateStoryData: (newData) => set(state => ({
    wizardState: {
      ...state.wizardState,
      storyData: { ...state.wizardState.storyData, ...newData }
    }
  })),
  
  // --- Character Specific Actions ---
  addCharacter: (characterData) => set(state => {
    const newCharacter = { ...characterData, id: uuidv4() }; // Assign a unique ID
    return {
      wizardState: {
        ...state.wizardState,
        storyData: {
          ...state.wizardState.storyData,
          bookCharacters: [...state.wizardState.storyData.bookCharacters, newCharacter]
        }
      }
    };
  }),
  
  updateCharacter: (characterId, updatedData) => set(state => ({
    wizardState: {
      ...state.wizardState,
      storyData: {
        ...state.wizardState.storyData,
        bookCharacters: state.wizardState.storyData.bookCharacters.map(char =>
          char.id === characterId ? { ...char, ...updatedData } : char
        )
      }
    }
  })),
  
  deleteCharacter: (characterId) => set(state => ({
    wizardState: {
      ...state.wizardState,
      storyData: {
        ...state.wizardState.storyData,
        bookCharacters: state.wizardState.storyData.bookCharacters.filter(char => char.id !== characterId)
      }
    }
  })),
  
  // Example: Update a specific character's field (like stylePreview)
  updateCharacterPreview: (characterId, previewUrl) => {
    get().updateCharacter(characterId, { stylePreview: previewUrl });
  },
  
  // Book actions
  setCurrentBook: (book) => set({
    currentBook: book,
  }),
  
  setBooks: (books) => set({
    books,
  }),
  
  addBook: (book) => set((state) => ({
    books: [...state.books, book],
  })),
  
  // Update a book in the books array
  updateBook: (updatedBook) => set((state) => ({
    books: state.books.map((book) => 
      book.id === updatedBook.id ? updatedBook : book
    ),
    currentBook: state.currentBook?.id === updatedBook.id ? updatedBook : state.currentBook,
  })),
  
  // Delete a book
  deleteBook: (bookId) => set((state) => ({
    books: state.books.filter((book) => book.id !== bookId),
    currentBook: state.currentBook?.id === bookId ? null : state.currentBook,
  })),
  
  // Load books from API (mocked for now)
  fetchBooks: async () => {
    set({ isLoading: true });
    
    try {
      // This would be an API call in a real app
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockBooks = [
        {
          id: 'book-1',
          title: 'Space Adventure with John',
          status: 'draft',
          childName: 'John',
          category: 'adventure',
          artStyle: 'cartoon',
          characters: [
            {
              id: 'char-1',
              name: 'John',
              role: 'main',
              type: 'child',
              gender: 'Boy',
              age: '6',
              traits: ['Curious', 'Kind', 'Adventurous'],
              interests: ['Space', 'Animals', 'Reading'],
              stylePreview: 'https://via.placeholder.com/300x400?text=John+in+cartoon+style',
              artStyle: 'cartoon',
              photoUrl: ''
            }
          ],
          pages: [
            {
              id: 'page-cover',
              type: 'cover',
              text: 'Space Adventure with John',
              imageUrl: 'https://via.placeholder.com/600x800?text=Space+Adventure+Cover',
            },
            {
              id: 'page-title',
              type: 'title',
              text: 'Space Adventure with John\n\nA story about John',
              imageUrl: '',
            },
            // Additional pages would be here
          ],
          createdAt: '2023-10-15T00:00:00.000Z',
          updatedAt: '2023-10-15T00:00:00.000Z',
        },
        {
          id: 'book-2',
          title: 'Emma\'s Jungle Expedition',
          status: 'purchased_digital',
          childName: 'Emma',
          category: 'adventure',
          artStyle: 'watercolor',
          characters: [
            {
              id: 'char-2',
              name: 'Emma',
              role: 'main',
              type: 'child',
              gender: 'Girl',
              age: '7',
              traits: ['Brave', 'Energetic', 'Smart'],
              interests: ['Nature', 'Animals', 'Exploring'],
              stylePreview: 'https://via.placeholder.com/300x400?text=Emma+in+watercolor+style',
              artStyle: 'watercolor',
              photoUrl: ''
            }
          ],
          pages: [
            {
              id: 'page-cover',
              type: 'cover',
              text: 'Emma\'s Jungle Expedition',
              imageUrl: 'https://via.placeholder.com/600x800?text=Jungle+Expedition+Cover',
            },
            // Additional pages would be here
          ],
          createdAt: '2023-09-28T00:00:00.000Z',
          updatedAt: '2023-09-28T00:00:00.000Z',
        },
      ];
      
      set({ books: mockBooks });
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Save a book to API (mocked for now)
  saveBook: async (book) => {
    set({ isLoading: true });
    
    try {
      // This would be an API call in a real app
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update local state with the "saved" book
      const updatedBook = {
        ...book,
        updatedAt: new Date().toISOString(),
      };
      
      set((state) => ({
        books: state.books.map((b) => 
          b.id === updatedBook.id ? updatedBook : b
        ),
        currentBook: updatedBook,
      }));
      
      return updatedBook;
    } catch (error) {
      console.error('Error saving book:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // API integration for generating content (mocked for now)
  generateStoryText: async (prompt) => {
    set({ isLoading: true });
    
    try {
      // This would be an API call to OpenAI in a real app
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response
      return `This is a generated story based on prompt: "${prompt}". In a real application, this would be generated by the OpenAI API using a carefully crafted prompt based on the user's inputs.`;
    } catch (error) {
      console.error('Error generating story text:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Generate an image for a page (mocked for now)
  generatePageImage: async (prompt, style) => {
    set({ isLoading: true });
    
    try {
      // This would be an API call to DALL-E or Stable Diffusion in a real app
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // Mock response - just returns a placeholder
      return `https://via.placeholder.com/600x400?text=${encodeURIComponent(prompt.substring(0, 20))}`;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Generate the complete book based on wizard data
  generateBook: async () => {
    console.log("[DEPRECATED] Old generateBook function called from store. Redirecting to new implementation.");
    
    // Import the useNavigate hook from react-router-dom
    try {
      // Get window object and manually navigate (can't use useNavigate in a non-component context)
      if (typeof window !== 'undefined') {
        console.log("[DEPRECATED] Redirecting to /generate-book route");
        window.location.href = '/generate-book';
        return { success: true, redirected: true };
      } else {
        console.error("[DEPRECATED] Cannot redirect - window object not available");
        return { success: false, error: "Environment does not support redirection" };
      }
    } catch (error) {
      console.error('[DEPRECATED] Error redirecting to new generation flow:', error);
      return { success: false, error: error.message || 'Failed to redirect to new book generation flow.' };
    }
    
    // Remove or comment out all the old generation logic below
    /*
    // Reset latest ID before starting
    set({ isLoading: true, latestGeneratedBookId: null }); 
    let result = null;
    try {
      const { storyData } = get().wizardState;
      console.log("[generateBook Store] Calling generateCompleteBook service...");
      
      result = await generateCompleteBook(storyData);
      console.log('[generateBook Store] RAW result from generateCompleteBook service:', JSON.stringify(result)); 
      
      if (!result || !result.success) {
        console.error("[generateBook Store] generateCompleteBook service failed or returned unexpected structure.", result);
        throw new Error(result?.error || 'Failed to generate book content.');
      }
      
      const { book } = result;
      const mainCharacter = book.characters.find(c => c.role === 'main');
      const bookTitle = book.title || `A Story for ${mainCharacter?.name || 'You'}`;
      
      const newBook = {
        ...book,
        id: book.id, // Use the ID generated by the service
        title: bookTitle,
        status: 'draft', 
        childName: mainCharacter?.name || '',
        category: storyData.category, 
        artStyleCode: storyData.artStyleCode, 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ageRange: storyData.targetAgeRange,
        storyType: storyData.storyType,
        wordCount: storyData.desiredLengthWords,
        generationData: book.generationData 
      };
      console.log('[generateBook Store] Assembled newBook object:', newBook);
      const finalBookId = newBook.id;

      // Add the new book AND set the latestGeneratedBookId
      set((state) => ({
        books: [...state.books, newBook],
        latestGeneratedBookId: finalBookId, // <-- SET the ID here
        isLoading: false, // Set loading false AFTER success
      }));
      
      // No return value needed anymore
      console.log('[generateBook Store] Successfully added book and set latestGeneratedBookId:', finalBookId);

    } catch (error) {
      console.error('Error in generateBook store action:', error);
      console.error('[generateBook Store] Service Result was:', JSON.stringify(result)); 
      // Ensure loading is false and latest ID is null on error
      set({ isLoading: false, latestGeneratedBookId: null }); 
      // We don't need to re-throw here for the new flow, component will check isLoading
      // throw error; 
    }
    // No finally block needed as set({isLoading: false}) is handled in try/catch
    */
  },
}));

export default useBookStore; 