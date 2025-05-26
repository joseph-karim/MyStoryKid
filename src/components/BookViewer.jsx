import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';

const BookViewer = ({ book, onClose }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  if (!book || !book.pages) {
    return null;
  }

  const currentPage = book.pages[currentPageIndex];
  const totalPages = book.pages.length;

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToPage = (index) => {
    setCurrentPageIndex(index);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{book.title}</h2>
              <p className="text-purple-100">
                Page {currentPageIndex + 1} of {totalPages}
              </p>
            </div>
            <button
              onClick={onClose}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex h-[calc(90vh-120px)]">
          {/* Page Display */}
          <div className="flex-1 flex items-center justify-center bg-gray-50 relative">
            {/* Navigation Buttons */}
            {currentPageIndex > 0 && (
              <button
                onClick={goToPreviousPage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all z-10"
              >
                <ChevronLeftIcon className="h-6 w-6 text-gray-700" />
              </button>
            )}

            {currentPageIndex < totalPages - 1 && (
              <button
                onClick={goToNextPage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full shadow-lg transition-all z-10"
              >
                <ChevronRightIcon className="h-6 w-6 text-gray-700" />
              </button>
            )}

            {/* Page Content */}
            <div className="max-w-md w-full mx-4">
              <div className="bg-white rounded-lg shadow-lg overflow-hidden aspect-[3/4]">
                {/* Page Image */}
                <div className="h-3/4 bg-gray-100 relative">
                  {currentPage.imageUrl ? (
                    <img
                      src={currentPage.imageUrl}
                      alt={`Page ${currentPageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <PhotoIcon className="h-16 w-16 mx-auto mb-2" />
                        <p className="text-sm">No image</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Page Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {currentPage.type}
                    </span>
                  </div>
                </div>

                {/* Page Text */}
                <div className="h-1/4 p-4 flex items-center justify-center">
                  <p className="text-center text-gray-800 text-sm leading-relaxed">
                    {currentPage.text || 'No text content'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Page Thumbnails Sidebar */}
          <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-4">Pages</h3>
            <div className="space-y-2">
              {book.pages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`w-full text-left p-2 rounded-lg transition-colors ${
                    index === currentPageIndex
                      ? 'bg-purple-100 border-2 border-purple-300'
                      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                      {page.imageUrl ? (
                        <img
                          src={page.imageUrl}
                          alt={`Page ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PhotoIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900">
                        Page {index + 1}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {page.type}
                      </p>
                      <p className="text-xs text-gray-600 truncate mt-1">
                        {page.text || 'No text'}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with Page Navigation */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPreviousPage}
              disabled={currentPageIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              {book.pages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToPage(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentPageIndex
                      ? 'bg-purple-600'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={goToNextPage}
              disabled={currentPageIndex === totalPages - 1}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BookViewer; 