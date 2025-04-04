import { create } from 'zustand';
import { generateCompleteBook } from '../services/storyGenerator.js';

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

// This is an expanded store for book data and creation flow
const useBookStore = create((set, get) => ({
  // Book state
  books: mockBooks, // Start with mock books for testing
  currentBook: null, // Book being created/edited
  isLoading: false,
  latestGeneratedBookId: null, // <-- NEW: Track the last generated ID
  
  // Book creation wizard state
  wizardState: {
    step: 1,
    storyData: {
      category: '', // e.g., Adventure, Bedtime Story, etc. - May become redundant if storyType is primary?
      mainScene: '', // Main scene/setting for the story (e.g., Space, Enchanted Forest, etc.)
      bookCharacters: [], // Array of characters with roles
      artStyleCode: '', // API style_code or 'custom'
      customStyleDescription: '', // Description if artStyleCode is 'custom'

      // --- NEW Detailed Story Fields --- 
      storyType: 'standard', // e.g., standard, rhyming, early_reader, lesson, board_book
      targetAgeRange: '3-8', // e.g., '0-3', '3-6', '6-9' (can be string or array)
      coreTheme: '', // e.g., Friendship, Courage, Sharing
      mainChallengePlot: '', // User-provided summary of the main conflict/plot
      narrativeStyle: 'third_person_limited', // e.g., third_person_limited, third_person_omniscient, first_person
      tone: 'gentle', // e.g., gentle, adventurous, humorous, reassuring, playful, didactic
      desiredEnding: '', // User-provided description of how the story should end
      desiredLengthWords: 500, // Approximate target word count (e.g., 50, 400, 800)

      // Specific to Rhyming
      rhymeScheme: 'AABB', // e.g., 'AABB', 'ABCB', 'Free Verse'

      // Specific to Board Book
      coreConcept: '', // e.g., Bedtime Routine, Animal Sounds, Colors
      keyObjectsActions: '', // Comma-separated list: Bath, Pajamas, Toothbrush...
      interactiveElement: '', // e.g., Sound words, Simple question
      // --- END NEW Fields --- 
    },
  },
  
  // Wizard actions
  setWizardStep: (step) => set((state) => ({
    wizardState: {
      ...state.wizardState,
      step,
    },
  })),
  
  updateStoryData: (data) => set((state) => ({
    wizardState: {
      ...state.wizardState,
      storyData: {
        ...state.wizardState.storyData,
        ...data,
      },
    },
  })),
  
  // Reset wizard needs to clear the new fields too
  resetWizard: () => set((state) => ({
    wizardState: {
      step: 1,
      storyData: {
        category: '', 
        mainScene: '', // Main scene/setting field
        bookCharacters: [],
        artStyleCode: '', 
        customStyleDescription: '',
        // Reset NEW fields to defaults
        storyType: 'standard',
        targetAgeRange: '3-8',
        coreTheme: '',
        mainChallengePlot: '',
        narrativeStyle: 'third_person_limited',
        tone: 'gentle',
        desiredEnding: '',
        desiredLengthWords: 500,
        rhymeScheme: 'AABB',
        coreConcept: '',
        keyObjectsActions: '',
        interactiveElement: '',
        customSceneDescription: '', // Custom scene description
      },
    },
  })),
  
  // --- NEW: Update a specific character within the wizard state ---
  updateCharacter: (characterId, updates) => set((state) => ({
    wizardState: {
      ...state.wizardState,
      storyData: {
        ...state.wizardState.storyData,
        bookCharacters: state.wizardState.storyData.bookCharacters.map(char =>
          char.id === characterId ? { ...char, ...updates } : char
        ),
      },
    },
  })),
  // --- END NEW ---
  
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