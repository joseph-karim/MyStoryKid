export const useBookStore = create((set, get) => ({
  // ... existing state (wizardState, books, etc.) ...
  
  generateBook: async () => {
    const { wizardState } = get();
    const storyData = wizardState.storyData;
    console.log('Generating book with data:', storyData);
    
    // --- MOCK GENERATION & ID --- 
    // Replace this with your actual API call to generate the book
    // IMPORTANT: This mock assumes your API call returns an object like { success: true, bookId: 'new-book-123' }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
    
    const newBookId = `book-${Date.now()}`;
    const newBook = {
      id: newBookId,
      title: storyData.title || 'Untitled Story',
      category: storyData.category,
      scene: storyData.mainScene,
      artStyleCode: storyData.artStyleCode,
      artStyleName: getStyleNameFromCode(storyData.artStyleCode), // Use helper to get name
      characters: storyData.bookCharacters || [],
      // ... add other relevant book properties like pages, generated text etc.
      createdAt: new Date().toISOString(),
    };
    // --- END MOCK --- 
    
    // Add the new book to the library
    set((state) => ({
      books: [...state.books, newBook],
      wizardState: { ...state.wizardState, isComplete: true } // Mark wizard as complete
    }));
    
    console.log('Book added to store:', newBook);
    
    // --- RETURN THE NEW BOOK ID --- 
    return newBookId;
  },
  
// ... rest of the store actions ...
}));

// ... potentially other stores like useCharacterStore ...

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