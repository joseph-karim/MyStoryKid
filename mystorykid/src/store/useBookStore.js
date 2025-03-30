import { create } from 'zustand';

// Mock books data for testing
const mockBooks = [
  {
    id: 'book-1',
    title: 'Space Adventure with John',
    status: 'draft',
    childName: 'John',
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
  
  // Book creation wizard state
  wizardState: {
    step: 1,
    storyData: {
      category: '', // e.g., Adventure, Bedtime Story, etc.
      childName: '',
      childAge: '',
      childGender: '',
      childTraits: [],
      childInterests: [],
      artStyle: '',
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
  
  generateImage: async (prompt, style) => {
    set({ isLoading: true });
    
    try {
      // This would be an API call to DALL-E in a real app
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Mock response - in a real app, this would be the URL of the generated image
      return `https://via.placeholder.com/600x600?text=${encodeURIComponent(prompt.substring(0, 20))}`;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  // Order related functions (mocked for now)
  placeDigitalOrder: async (bookId) => {
    set({ isLoading: true });
    
    try {
      // This would involve Stripe in a real app
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update book status
      set((state) => ({
        books: state.books.map((book) => 
          book.id === bookId 
            ? { ...book, status: 'purchased_digital' } 
            : book
        ),
        currentBook: state.currentBook?.id === bookId 
          ? { ...state.currentBook, status: 'purchased_digital' }
          : state.currentBook,
      }));
      
      return { success: true, orderId: `order-${Date.now()}` };
    } catch (error) {
      console.error('Error placing digital order:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
  
  placePrintOrder: async (bookId, shippingInfo) => {
    set({ isLoading: true });
    
    try {
      // This would involve Stripe and Lulu Direct in a real app
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update book status
      set((state) => ({
        books: state.books.map((book) => 
          book.id === bookId 
            ? { ...book, status: 'ordered_print' } 
            : book
        ),
        currentBook: state.currentBook?.id === bookId 
          ? { ...state.currentBook, status: 'ordered_print' }
          : state.currentBook,
      }));
      
      return { 
        success: true, 
        orderId: `print-order-${Date.now()}`,
        estimatedDelivery: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Error placing print order:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },
}));

export default useBookStore; 