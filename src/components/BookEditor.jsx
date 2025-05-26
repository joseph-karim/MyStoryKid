import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PencilIcon, 
  PhotoIcon, 
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  BookmarkIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
import { 
  updatePageText, 
  regeneratePageImage, 
  modifyPageImage,
  createBookSnapshot,
  restoreFromSnapshot,
  saveEditedBook,
  validateEdit,
  getEditSuggestions
} from '../services/bookEditingService.js';
import useEnhancedBookStore from '../store/useEnhancedBookStore.js';

const BookEditor = ({ book: initialBook, onSave, onClose }) => {
  const [book, setBook] = useState(initialBook);
  const [editingPage, setEditingPage] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageInstructions, setImageInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [snapshots, setSnapshots] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [showImageEditor, setShowImageEditor] = useState(null);
  const [editMode, setEditMode] = useState('text'); // 'text', 'regenerate', 'modify'

  const { saveBookToDB, anonymousSessionId } = useEnhancedBookStore();

  // Initialize suggestions and create initial snapshot
  useEffect(() => {
    setSuggestions(getEditSuggestions(book));
    const initialSnapshot = createBookSnapshot(book, 'Initial state');
    setSnapshots([initialSnapshot]);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (book.hasUserEdits) {
        const autoSnapshot = createBookSnapshot(book, 'Auto-save');
        setSnapshots(prev => [...prev.slice(-4), autoSnapshot]); // Keep last 5 snapshots
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [book]);

  const handleTextEdit = useCallback(async (pageIndex, newText) => {
    try {
      const edit = { type: 'text', pageIndex, newText };
      const validation = validateEdit(book, edit);
      
      if (!validation.isValid) {
        setErrors({ [pageIndex]: validation.errors[0] });
        return;
      }

      const updatedBook = updatePageText(book, pageIndex, newText);
      setBook(updatedBook);
      setEditingPage(null);
      setErrors({});
      
      // Update suggestions
      setSuggestions(getEditSuggestions(updatedBook));
    } catch (error) {
      setErrors({ [pageIndex]: error.message });
    }
  }, [book]);

  const handleImageRegenerate = useCallback(async (pageIndex, prompt) => {
    try {
      setIsGenerating(true);
      const updatedBook = await regeneratePageImage(book, pageIndex, prompt);
      setBook(updatedBook);
      setShowImageEditor(null);
      setImagePrompt('');
      setSuggestions(getEditSuggestions(updatedBook));
    } catch (error) {
      setErrors({ [pageIndex]: error.message });
    } finally {
      setIsGenerating(false);
    }
  }, [book]);

  const handleImageModify = useCallback(async (pageIndex, instructions) => {
    try {
      setIsGenerating(true);
      const updatedBook = await modifyPageImage(book, pageIndex, instructions);
      setBook(updatedBook);
      setShowImageEditor(null);
      setImageInstructions('');
      setSuggestions(getEditSuggestions(updatedBook));
    } catch (error) {
      setErrors({ [pageIndex]: error.message });
    } finally {
      setIsGenerating(false);
    }
  }, [book]);

  const handleSaveBook = async () => {
    try {
      const savedBook = await saveEditedBook(book, anonymousSessionId);
      if (onSave) {
        onSave(savedBook);
      }
    } catch (error) {
      console.error('Error saving book:', error);
      setErrors({ general: 'Failed to save book. Please try again.' });
    }
  };

  const handleRestoreSnapshot = (snapshot) => {
    const restoredBook = restoreFromSnapshot(snapshot);
    setBook(restoredBook);
    setSuggestions(getEditSuggestions(restoredBook));
    setErrors({});
  };

  const startTextEdit = (pageIndex) => {
    setEditingPage(pageIndex);
    setEditingText(book.pages[pageIndex]?.text || '');
    setEditMode('text');
  };

  const startImageEdit = (pageIndex, mode = 'regenerate') => {
    setShowImageEditor(pageIndex);
    setEditMode(mode);
    if (mode === 'regenerate') {
      setImagePrompt(book.pages[pageIndex]?.visualPrompt || '');
    } else {
      setImageInstructions('');
    }
  };

  const cancelEdit = () => {
    setEditingPage(null);
    setShowImageEditor(null);
    setEditingText('');
    setImagePrompt('');
    setImageInstructions('');
    setErrors({});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{book.title}</h2>
              <p className="text-purple-100">Edit your story</p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Snapshot controls */}
              <div className="flex items-center space-x-2">
                <BookmarkIcon className="h-5 w-5" />
                <select
                  onChange={(e) => {
                    const snapshot = snapshots.find(s => s.id === e.target.value);
                    if (snapshot) handleRestoreSnapshot(snapshot);
                  }}
                  className="bg-white bg-opacity-20 text-white rounded px-2 py-1 text-sm"
                >
                  <option value="">Restore version...</option>
                  {snapshots.map(snapshot => (
                    <option key={snapshot.id} value={snapshot.id}>
                      {snapshot.description} ({new Date(snapshot.timestamp).toLocaleTimeString()})
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={handleSaveBook}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
              >
                Save Book
              </button>
              <button
                onClick={onClose}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar with suggestions */}
          <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Suggestions</h3>
            
            {suggestions.length === 0 ? (
              <p className="text-gray-500 text-sm">No suggestions available</p>
            ) : (
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-lg border ${
                      suggestion.priority === 'high' 
                        ? 'border-red-200 bg-red-50' 
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon 
                        className={`h-4 w-4 mt-0.5 ${
                          suggestion.priority === 'high' ? 'text-red-500' : 'text-yellow-500'
                        }`} 
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{suggestion.suggestion}</p>
                        <p className="text-xs text-gray-500 mt-1">Page {suggestion.pageIndex + 1}</p>
                        <button
                          onClick={() => {
                            if (suggestion.type === 'text') {
                              startTextEdit(suggestion.pageIndex);
                            } else {
                              startImageEdit(suggestion.pageIndex, 'regenerate');
                            }
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          Fix this →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Error display */}
            {Object.keys(errors).length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium text-red-900 mb-2">Errors</h4>
                {Object.entries(errors).map(([key, error]) => (
                  <div key={key} className="bg-red-50 border border-red-200 rounded p-2 mb-2">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Main editing area */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {book.pages?.map((page, index) => (
                <motion.div
                  key={index}
                  layout
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Page header */}
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Page {index + 1} ({page.type})
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => startTextEdit(index)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit text"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        {page.type === 'content' && (
                          <>
                            <button
                              onClick={() => startImageEdit(index, 'regenerate')}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="Regenerate image"
                            >
                              <ArrowPathIcon className="h-4 w-4" />
                            </button>
                            {page.imageUrl && (
                              <button
                                onClick={() => startImageEdit(index, 'modify')}
                                className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                                title="Modify image"
                              >
                                <PhotoIcon className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Page content */}
                  <div className="p-4">
                    {/* Text editing */}
                    {editingPage === index ? (
                      <div className="space-y-3">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter page text..."
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {editingText.length} characters
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleTextEdit(index, editingText)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div 
                        className="text-sm text-gray-700 mb-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        onClick={() => startTextEdit(index)}
                      >
                        {page.text || <span className="text-gray-400 italic">Click to add text...</span>}
                      </div>
                    )}

                    {/* Image display */}
                    {page.imageUrl && (
                      <div className="relative">
                        <img
                          src={page.imageUrl}
                          alt={`Page ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        {page.isImageEdited && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Edited
                          </div>
                        )}
                      </div>
                    )}

                    {/* Image generation status */}
                    {page.imageGenerationStatus === 'generating' && (
                      <div className="flex items-center justify-center h-48 bg-gray-100 rounded-lg">
                        <div className="text-center">
                          <ClockIcon className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                          <p className="text-sm text-gray-500">Generating image...</p>
                        </div>
                      </div>
                    )}

                    {page.imageGenerationStatus === 'failed' && (
                      <div className="flex items-center justify-center h-48 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-center">
                          <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
                          <p className="text-sm text-red-600">Image generation failed</p>
                          <button
                            onClick={() => startImageEdit(index, 'regenerate')}
                            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                          >
                            Try again
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Image editing modal */}
        <AnimatePresence>
          {showImageEditor !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-lg p-6 max-w-md w-full"
              >
                <h3 className="text-lg font-semibold mb-4">
                  {editMode === 'regenerate' ? 'Regenerate Image' : 'Modify Image'}
                </h3>
                
                {editMode === 'regenerate' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New image prompt
                      </label>
                      <textarea
                        value={imagePrompt}
                        onChange={(e) => setImagePrompt(e.target.value)}
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe what you want to see in the image..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modification instructions
                      </label>
                      <textarea
                        value={imageInstructions}
                        onChange={(e) => setImageInstructions(e.target.value)}
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Describe how you want to change the existing image..."
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={cancelEdit}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                    disabled={isGenerating}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (editMode === 'regenerate') {
                        handleImageRegenerate(showImageEditor, imagePrompt);
                      } else {
                        handleImageModify(showImageEditor, imageInstructions);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={isGenerating || (!imagePrompt && !imageInstructions)}
                  >
                    {isGenerating ? (
                      <div className="flex items-center space-x-2">
                        <ClockIcon className="h-4 w-4 animate-spin" />
                        <span>Generating...</span>
                      </div>
                    ) : (
                      editMode === 'regenerate' ? 'Regenerate' : 'Modify'
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default BookEditor; 