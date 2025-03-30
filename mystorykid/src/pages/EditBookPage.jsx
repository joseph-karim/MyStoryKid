import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore, useBookStore, useCharacterStore } from '../store';
import { motion } from 'framer-motion';
import CharacterSelector from '../components/CharacterSelector';

function EditBookPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { currentBook, books, setCurrentBook } = useBookStore();
  const { characters } = useCharacterStore();
  
  const [currentPage, setCurrentPage] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isCharacterSelectorOpen, setIsCharacterSelectorOpen] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);
  
  // Authentication check removed for testing
  
  // Load the book if it's not already in currentBook
  useEffect(() => {
    if (!currentBook || currentBook.id !== bookId) {
      const book = books.find(b => b.id === bookId);
      if (book) {
        setCurrentBook(book);
      } else {
        // Book not found in list, navigate back to dashboard
        navigate('/dashboard');
      }
    }
  }, [bookId, books, currentBook, navigate, setCurrentBook]);
  
  // Handle text editing for the current page
  const handleTextChange = (e) => {
    if (!currentBook) return;
    
    const updatedBook = {
      ...currentBook,
      pages: currentBook.pages.map((page, index) => {
        if (index === currentPage) {
          return { ...page, text: e.target.value };
        }
        return page;
      }),
      updatedAt: new Date().toISOString(),
    };
    
    setCurrentBook(updatedBook);
  };
  
  // Handle character selection for the current page
  const handleSelectCharacter = (character) => {
    setSelectedCharacterId(character.id);
    
    // In a real app, this would trigger an image generation with the character
    console.log(`Selected character ${character.name} for page ${currentPage}`);
  };
  
  // Simulated function to regenerate image
  const handleRegenerateImage = () => {
    setIsSaving(true);
    
    // In a real app, this would call an API to generate a new image
    setTimeout(() => {
      const updatedBook = {
        ...currentBook,
        pages: currentBook.pages.map((page, index) => {
          if (index === currentPage) {
            return { 
              ...page, 
              // Just updating the URL parameter to simulate a new image
              imageUrl: `${page.imageUrl?.split('?')[0] || 'https://via.placeholder.com/600x400'}?text=Regenerated+Image&random=${Math.random()}` 
            };
          }
          return page;
        }),
        updatedAt: new Date().toISOString(),
      };
      
      setCurrentBook(updatedBook);
      setIsSaving(false);
    }, 2000);
  };
  
  // Simulated function to regenerate text
  const handleRegenerateText = () => {
    setIsSaving(true);
    
    // In a real app, this would call an API to generate new text
    setTimeout(() => {
      const updatedBook = {
        ...currentBook,
        pages: currentBook.pages.map((page, index) => {
          if (index === currentPage) {
            return { 
              ...page, 
              text: `This is regenerated text for page ${index + 1}. In a real application, this would be generated by AI based on the story context and previous pages.`
            };
          }
          return page;
        }),
        updatedAt: new Date().toISOString(),
      };
      
      setCurrentBook(updatedBook);
      setIsSaving(false);
    }, 1500);
  };
  
  // Navigate to preview page
  const handlePreview = () => {
    navigate(`/preview/${bookId}`);
  };
  
  // Simulated save function
  const handleSave = () => {
    setIsSaving(true);
    
    // In a real app, this would save to a backend
    setTimeout(() => {
      alert('Book saved successfully!');
      setIsSaving(false);
    }, 1000);
  };
  
  // Show loading state if book is not yet loaded
  if (!currentBook) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your book...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      {/* Editor Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            {currentBook.title}
          </h1>
          <p className="text-gray-600">Edit your magical story</p>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 w-full md:w-auto">
          <button 
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Saving...
              </>
            ) : 'Save'}
          </button>
          <button 
            onClick={handlePreview}
            className="px-6 py-2.5 border border-purple-300 text-purple-700 rounded-full hover:bg-purple-50 transition-all duration-300"
          >
            Preview
          </button>
        </div>
      </div>
      
      {/* Page Navigation */}
      <div className="mb-6 bg-white rounded-xl shadow-md p-3 overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {currentBook.pages.map((page, index) => (
            <motion.div 
              key={page.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`cursor-pointer rounded-lg p-2 transition-colors min-w-[80px] text-center ${
                currentPage === index 
                  ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-md' 
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => setCurrentPage(index)}
            >
              {index === 0 ? 'Cover' : 
               index === 1 ? 'Title' : 
               index === currentBook.pages.length - 1 ? 'End' : 
               `Page ${index - 1}`}
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Main Editor Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left sidebar - Character Selection */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={() => setIsCharacterSelectorOpen(!isCharacterSelectorOpen)}
              className="w-full mb-4 bg-white rounded-xl shadow-md p-4 flex items-center text-left"
            >
              <div className="bg-purple-100 text-purple-600 p-2 rounded-full mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium">Characters</p>
                <p className="text-xs text-gray-500">Select characters for this page</p>
              </div>
              <div className="ml-auto text-gray-400">
                {isCharacterSelectorOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </motion.button>
            
            {/* Character selector */}
            {isCharacterSelectorOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="mb-4"
              >
                <CharacterSelector 
                  onSelectCharacter={handleSelectCharacter}
                  selectedCharacterId={selectedCharacterId}
                />
              </motion.div>
            )}
            
            {/* Page Information */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h3 className="font-medium mb-2">Page Information</h3>
              <div className="text-sm text-gray-600">
                <p>Type: {currentBook.pages[currentPage].type || 'Content'}</p>
                <p>Page: {currentPage + 1} of {currentBook.pages.length}</p>
                <p className="mt-2 text-xs text-gray-500">Last updated: {new Date(currentBook.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Middle - Image Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="mb-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Illustration</h2>
              {currentBook.pages[currentPage].imageUrl && (
                <button 
                  onClick={handleRegenerateImage}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <span className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-1"></span>
                      Generating...
                    </span>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Regenerate
                    </>
                  )}
                </button>
              )}
            </div>
            
            {currentBook.pages[currentPage].imageUrl ? (
              <div className="bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                <img 
                  src={currentBook.pages[currentPage].imageUrl} 
                  alt={`Illustration for ${currentBook.pages[currentPage].text?.substring(0, 20) || 'page'}`}
                  className="max-w-full object-contain"
                  style={{ maxHeight: '450px' }}
                />
              </div>
            ) : (
              <div className="bg-gray-100 h-80 rounded-lg flex flex-col items-center justify-center p-4">
                {selectedCharacterId ? (
                  <>
                    <div className="text-4xl mb-2">🧙‍♂️</div>
                    <p className="text-gray-500 mb-2">Ready to generate with selected character</p>
                    <button 
                      onClick={handleRegenerateImage}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      Generate Illustration
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-500">No illustration for this page</p>
                    <p className="text-gray-400 text-sm mt-1">Select a character to generate an image</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right - Text Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="mb-3 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Text</h2>
              <button 
                onClick={handleRegenerateText}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                disabled={isSaving}
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <span className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-1"></span>
                    Generating...
                  </span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Regenerate
                  </>
                )}
              </button>
            </div>
            
            <textarea
              value={currentBook.pages[currentPage].text || ''}
              onChange={handleTextChange}
              className="w-full h-96 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter text for this page..."
              style={{ resize: 'none' }}
            />
          </div>
        </div>
      </div>
      
      {/* Page Navigation Buttons */}
      <div className="flex justify-between mt-8">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          disabled={currentPage === 0}
          className={`px-5 py-2.5 rounded-full shadow ${
            currentPage === 0 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-purple-700 hover:shadow-md'
          }`}
        >
          ← Previous Page
        </motion.button>
        
        <div className="text-center">
          <span className="bg-white px-4 py-2 rounded-full shadow">
            {currentPage + 1} of {currentBook.pages.length}
          </span>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage(prev => Math.min(currentBook.pages.length - 1, prev + 1))}
          disabled={currentPage === currentBook.pages.length - 1}
          className={`px-5 py-2.5 rounded-full shadow ${
            currentPage === currentBook.pages.length - 1
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-white text-purple-700 hover:shadow-md'
          }`}
        >
          Next Page →
        </motion.button>
      </div>
    </div>
  );
}

export default EditBookPage;