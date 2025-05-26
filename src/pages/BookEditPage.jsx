import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PencilSquareIcon, 
  EyeIcon, 
  ArrowLeftIcon,
  ShareIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import BookEditor from '../components/BookEditor.jsx';
import BookViewer from '../components/BookViewer.jsx';
import useEnhancedBookStore from '../store/useEnhancedBookStore.js';
import { createBookShare } from '../services/databaseService.js';

const BookEditPage = () => {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [currentBook, setCurrentBook] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const { 
    getBookFromDB, 
    getBookById, 
    updateBook,
    books 
  } = useEnhancedBookStore();

  useEffect(() => {
    const loadBook = async () => {
      try {
        setIsLoading(true);
        
        // First try to get from local state
        let book = getBookById(bookId);
        
        // If not found locally, fetch from database
        if (!book) {
          book = await getBookFromDB(bookId);
        }
        
        if (!book) {
          setError('Book not found');
          return;
        }
        
        setCurrentBook(book);
      } catch (err) {
        console.error('Error loading book:', err);
        setError('Failed to load book');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookId) {
      loadBook();
    }
  }, [bookId, getBookFromDB, getBookById]);

  const handleSaveBook = (updatedBook) => {
    setCurrentBook(updatedBook);
    updateBook(updatedBook.id, updatedBook);
    setShowEditor(false);
  };

  const handleCreateShare = async () => {
    try {
      const shareToken = await createBookShare(currentBook.id, 'preview', 7); // 7 days
      const url = `${window.location.origin}/shared/${shareToken}`;
      setShareUrl(url);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard!');
    } catch (error) {
      console.error('Error creating share link:', error);
      alert('Failed to create share link');
    }
  };

  const handleDownload = () => {
    // This would trigger PDF generation and download
    // For now, we'll just show an alert
    alert('PDF download functionality will be implemented soon!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your book...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentBook) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Book not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{currentBook.title}</h1>
                <p className="text-sm text-gray-500">
                  {currentBook.hasUserEdits ? 'Edited' : 'Generated'} • 
                  {currentBook.pages?.length || 0} pages
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowViewer(true)}
                className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <EyeIcon className="h-4 w-4" />
                <span>Preview</span>
              </button>
              
              <button
                onClick={handleCreateShare}
                className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <ShareIcon className="h-4 w-4" />
                <span>Share</span>
              </button>
              
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg hover:bg-green-200 transition-colors"
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                <span>Download</span>
              </button>
              
              <button
                onClick={() => setShowEditor(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <PencilSquareIcon className="h-4 w-4" />
                <span>Edit Book</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Book Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Cover Image */}
              <div className="lg:col-span-1">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                  {currentBook.pages?.[0]?.imageUrl ? (
                    <img
                      src={currentBook.pages[0].imageUrl}
                      alt={currentBook.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <PhotoIcon className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm">No cover image</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Book Details */}
              <div className="lg:col-span-2">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentBook.title}</h2>
                    <p className="text-gray-600">
                      A personalized story featuring {currentBook.childName || 'your child'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Category</h3>
                      <p className="mt-1 text-gray-900 capitalize">{currentBook.category || 'Adventure'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Age Range</h3>
                      <p className="mt-1 text-gray-900">{currentBook.ageRange || '4-8 years'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pages</h3>
                      <p className="mt-1 text-gray-900">{currentBook.pages?.length || 0} pages</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</h3>
                      <p className="mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          currentBook.status === 'completed' 
                            ? 'bg-green-100 text-green-800'
                            : currentBook.status === 'generating'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {currentBook.status || 'draft'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Characters */}
                  {currentBook.characters && currentBook.characters.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Characters</h3>
                      <div className="flex flex-wrap gap-2">
                        {currentBook.characters.map((character, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                          >
                            {character.name} ({character.role})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Edit History */}
                  {currentBook.hasUserEdits && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Edit History</h3>
                      <p className="text-sm text-gray-600">
                        Last edited: {new Date(currentBook.lastEditedAt || currentBook.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Preview Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Page Preview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentBook.pages?.map((page, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  className="bg-gray-50 rounded-lg overflow-hidden border border-gray-200 cursor-pointer"
                  onClick={() => setShowViewer(true)}
                >
                  <div className="aspect-[3/4] bg-gray-100">
                    {page.imageUrl ? (
                      <img
                        src={page.imageUrl}
                        alt={`Page ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <PhotoIcon className="h-8 w-8 mx-auto mb-1" />
                          <p className="text-xs">No image</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">
                      Page {index + 1} ({page.type})
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {page.text || 'No text content'}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Book Editor Modal */}
      {showEditor && (
        <BookEditor
          book={currentBook}
          onSave={handleSaveBook}
          onClose={() => setShowEditor(false)}
        />
      )}

      {/* Book Viewer Modal */}
      {showViewer && (
        <BookViewer
          book={currentBook}
          onClose={() => setShowViewer(false)}
        />
      )}
    </div>
  );
};

export default BookEditPage; 