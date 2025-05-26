import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  saveBook, 
  getBook, 
  getUserBooks, 
  updateBookStatus,
  claimBook as claimBookDB
} from '../services/databaseService.js';
import { ensureAnonymousSession, getCurrentBookId, clearCurrentBookId } from '../services/anonymousAuthService.js';
import { v4 as uuidv4 } from 'uuid';

// Enhanced book store with full database integration
const useEnhancedBookStore = create(
  persist(
    (set, get) => ({
      // Book state
      books: [], // Books loaded from database
      currentBook: null, // Book being created/edited
      isLoading: false,
      error: null,
      latestGeneratedBookId: null, // Track the last generated ID
      anonymousSessionId: null, // Track anonymous session for book claiming

      // Book creation wizard state
      wizardState: {
        currentStep: 1,
        isComplete: false,
        storyData: {
          // Character data
          bookCharacters: [],
          
          // Story structure
          category: '',
          mainScene: '',
          customSceneDescription: '',
          artStyleCode: '',
          customStyleDescription: '',
          ageRange: '3-8',
          storyType: 'standard',
          
          // Story elements
          title: '',
          storyStart: '',
          customStoryStart: '',
          mainHurdle: '',
          customMainHurdle: '',
          bigTry: '',
          customBigTry: '',
          turningPoint: '',
          customTurningPoint: '',
          resolution: '',
          customResolution: '',
          takeaway: '',
          customTakeaway: '',
          
          // Additional settings
          coreTheme: '',
          specificRequests: '',
          desiredLengthWords: 500,
          targetAgeRange: '3-8'
        }
      },

      // Wizard actions
      setWizardStep: (step) => set(state => ({
        wizardState: { ...state.wizardState, currentStep: step }
      })),
      
      completeWizard: () => set(state => ({
        wizardState: { ...state.wizardState, isComplete: true }
      })),
      
      resetWizard: () => set({
        wizardState: {
          currentStep: 1,
          isComplete: false,
          storyData: {
            bookCharacters: [],
            category: '',
            mainScene: '',
            customSceneDescription: '',
            artStyleCode: '',
            customStyleDescription: '',
            ageRange: '3-8',
            storyType: 'standard',
            title: '',
            storyStart: '',
            customStoryStart: '',
            mainHurdle: '',
            customMainHurdle: '',
            bigTry: '',
            customBigTry: '',
            turningPoint: '',
            customTurningPoint: '',
            resolution: '',
            customResolution: '',
            takeaway: '',
            customTakeaway: '',
            coreTheme: '',
            specificRequests: '',
            desiredLengthWords: 500,
            targetAgeRange: '3-8'
          }
        }
      }),
      
      updateStoryData: (newData) => {
        set(state => ({
          wizardState: {
            ...state.wizardState,
            storyData: { ...state.wizardState.storyData, ...newData }
          }
        }));
      },

      // Character management
      addCharacter: (characterData) => set(state => {
        const newCharacter = { ...characterData, id: uuidv4() };
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

      updateCharacter: (characterId, updates) => set(state => ({
        wizardState: {
          ...state.wizardState,
          storyData: {
            ...state.wizardState.storyData,
            bookCharacters: state.wizardState.storyData.bookCharacters.map(char =>
              char.id === characterId ? { ...char, ...updates } : char
            )
          }
        }
      })),

      removeCharacter: (characterId) => set(state => ({
        wizardState: {
          ...state.wizardState,
          storyData: {
            ...state.wizardState.storyData,
            bookCharacters: state.wizardState.storyData.bookCharacters.filter(char => char.id !== characterId)
          }
        }
      })),

      // Database integration methods
      
      // Initialize anonymous session
      initializeSession: async () => {
        try {
          const { success, session } = await ensureAnonymousSession();
          if (success && session) {
            set({ anonymousSessionId: session.user?.id });
          }
        } catch (error) {
          console.error('[useEnhancedBookStore] Error initializing session:', error);
          set({ error: error.message });
        }
      },

      // Load books from database
      loadBooks: async () => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          // Get user from auth store if available
          const user = window.useAuthStore?.getState?.()?.user;
          
          const books = await getUserBooks(
            user?.id || null, 
            state.anonymousSessionId
          );
          
          set({ books, isLoading: false });
          return books;
        } catch (error) {
          console.error('[useEnhancedBookStore] Error loading books:', error);
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // Save book to database
      saveBookToDB: async (bookData) => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          const savedBook = await saveBook(bookData, state.anonymousSessionId);
          
          // Update local state
          set(state => ({
            books: state.books.some(b => b.id === savedBook.id) 
              ? state.books.map(b => b.id === savedBook.id ? savedBook : b)
              : [...state.books, savedBook],
            isLoading: false,
            latestGeneratedBookId: savedBook.id
          }));
          
          return savedBook;
        } catch (error) {
          console.error('[useEnhancedBookStore] Error saving book:', error);
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // Get book from database
      getBookFromDB: async (bookId) => {
        set({ isLoading: true, error: null });
        try {
          const book = await getBook(bookId);
          
          // Update current book in state
          set({ currentBook: book, isLoading: false });
          
          return book;
        } catch (error) {
          console.error('[useEnhancedBookStore] Error getting book:', error);
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // Load user's books from database
      loadUserBooks: async () => {
        set({ isLoading: true, error: null });
        try {
          const userBooks = await getUserBooks();
          
          set({ 
            books: userBooks, 
            isLoading: false 
          });
          
          return userBooks;
        } catch (error) {
          console.error('[useEnhancedBookStore] Error loading user books:', error);
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },

      // Claim anonymous books after login
      claimAnonymousBooks: async () => {
        try {
          const { completeAuthFlow } = await import('../services/anonymousAuthService.js');
          const result = await completeAuthFlow();
          
          if (result.success && result.claimed) {
            console.log('[useEnhancedBookStore] Successfully claimed book:', result.bookId);
            // Reload books to include the claimed book
            await get().loadUserBooks();
          }
          
          return result;
        } catch (error) {
          console.error('[useEnhancedBookStore] Error claiming anonymous books:', error);
          throw error;
        }
      },

      // Update book status
      updateBookStatusDB: async (bookId, status) => {
        try {
          await updateBookStatus(bookId, status);
          
          // Update local state
          set(state => ({
            books: state.books.map(book => 
              book.id === bookId ? { ...book, status } : book
            ),
            currentBook: state.currentBook?.id === bookId 
              ? { ...state.currentBook, status } 
              : state.currentBook
          }));
        } catch (error) {
          console.error('[useEnhancedBookStore] Error updating book status:', error);
          set({ error: error.message });
          throw error;
        }
      },

      // Claim book after authentication
      claimBook: async (bookId) => {
        try {
          const success = await claimBookDB(bookId);
          if (success) {
            // Reload books to get updated ownership
            await get().loadBooks();
            clearCurrentBookId(); // Clear from localStorage
          }
          return success;
        } catch (error) {
          console.error('[useEnhancedBookStore] Error claiming book:', error);
          set({ error: error.message });
          throw error;
        }
      },

      // Add a book to local state (for generated books)
      addBook: (bookData) => {
        const newBook = {
          ...bookData,
          id: bookData.id || uuidv4(),
          createdAt: bookData.createdAt || new Date().toISOString(),
          updatedAt: bookData.updatedAt || new Date().toISOString()
        };

        set(state => ({
          books: [...state.books, newBook],
          currentBook: newBook,
          latestGeneratedBookId: newBook.id
        }));

        return newBook;
      },

      // Set current book
      setCurrentBook: (book) => set({ currentBook: book }),

      // Set latest generated book ID
      setLatestGeneratedBookId: (bookId) => set({ latestGeneratedBookId: bookId }),

      // Clear error
      clearError: () => set({ error: null }),

      // Get book by ID from local state
      getBookById: (bookId) => {
        const state = get();
        return state.books.find(book => book.id === bookId);
      },

      // Remove book from local state
      removeBook: (bookId) => set(state => ({
        books: state.books.filter(book => book.id !== bookId),
        currentBook: state.currentBook?.id === bookId ? null : state.currentBook
      })),

      // Update book in local state
      updateBook: (bookId, updates) => set(state => ({
        books: state.books.map(book => 
          book.id === bookId ? { ...book, ...updates } : book
        ),
        currentBook: state.currentBook?.id === bookId 
          ? { ...state.currentBook, ...updates } 
          : state.currentBook
      }))
    }),
    {
      name: 'enhanced-book-store',
      partialize: (state) => ({
        // Only persist wizard state and anonymous session
        wizardState: state.wizardState,
        anonymousSessionId: state.anonymousSessionId,
        latestGeneratedBookId: state.latestGeneratedBookId
      })
    }
  )
);

export default useEnhancedBookStore; 