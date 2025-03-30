import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore, useBookStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import BookPreview from '../components/BookPreview';

function PreviewPage() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { currentBook, books, setCurrentBook } = useBookStore();
  const [showPurchaseOptions, setShowPurchaseOptions] = useState(false);
  
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
      {/* Preview Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
            {currentBook.title}
          </h1>
          <p className="text-gray-600">Book Preview</p>
        </div>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3 w-full md:w-auto">
          <Link
            to={`/edit/${bookId}`}
            className="px-6 py-2.5 border border-purple-300 text-purple-700 rounded-full hover:bg-purple-50 transition-all duration-300 flex items-center justify-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Book
          </Link>
          {currentBook.status === 'draft' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPurchaseOptions(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Purchase
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Book Preview */}
      <div className="mb-8 bg-white rounded-xl shadow-lg p-8">
        <BookPreview 
          book={currentBook} 
          isWatermarked={currentBook.status === 'draft'}
        />
      </div>
      
      {/* Book Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Book Details</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Created</span>
              <span className="font-medium">{new Date(currentBook.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Last updated</span>
              <span className="font-medium">{new Date(currentBook.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className={`py-1 px-2 rounded-full text-xs font-medium ${
                currentBook.status === 'draft' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : currentBook.status === 'purchased_digital'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {currentBook.status === 'draft' 
                  ? 'Draft' 
                  : currentBook.status === 'purchased_digital'
                  ? 'Digital' 
                  : 'Print'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pages</span>
              <span className="font-medium">{currentBook.pages?.length || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="md:col-span-2 bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Book Summary</h2>
          <p className="text-gray-700 mb-4">
            A magical adventure featuring your child as the main character, with stunning illustrations.
          </p>
          
          {currentBook.status === 'draft' && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">Ready to bring this story to life?</h3>
              <motion.button
                whileHover={{ scale: 1.02 }}
                onClick={() => setShowPurchaseOptions(true)}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                Purchase Your Book
              </motion.button>
            </div>
          )}
        </div>
      </div>
      
      {/* Purchase Options Modal */}
      <AnimatePresence>
        {showPurchaseOptions && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-gradient-to-r from-purple-600 to-blue-500 py-6 px-8 text-white">
                <h2 className="text-2xl font-bold">Purchase Options</h2>
                <p className="opacity-90">Choose how you want to enjoy your story</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div 
                  className="border rounded-xl p-4 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all duration-200 relative overflow-hidden group"
                  onClick={() => {
                    // Handle digital purchase
                    alert('The digital purchase process would start here');
                    setShowPurchaseOptions(false);
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="flex justify-between">
                    <div className="relative z-10">
                      <h3 className="text-lg font-semibold">Digital Download (PDF)</h3>
                      <p className="text-gray-600 mb-2">Get a high-resolution PDF instantly</p>
                      <p className="text-xs text-gray-500">• Instant delivery<br/>• No watermarks<br/>• Read on any device</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-blue-600">$10.00</p>
                      <p className="text-xs text-blue-500">Instant Download</p>
                    </div>
                  </div>
                </div>
                
                <div 
                  className="border rounded-xl p-4 hover:border-purple-500 hover:shadow-md cursor-pointer transition-all duration-200 relative overflow-hidden group"
                  onClick={() => {
                    // Handle print purchase
                    alert('The print purchase process would start here');
                    setShowPurchaseOptions(false);
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="flex justify-between">
                    <div className="relative z-10">
                      <h3 className="text-lg font-semibold">Premium Hardcover Print</h3>
                      <p className="text-gray-600 mb-2">Beautiful hardcover book delivered to your door</p>
                      <p className="text-xs text-gray-500">• Premium quality<br/>• Gift-ready packaging<br/>• Free digital PDF included</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-purple-600">$35.00</p>
                      <p className="text-xs text-purple-500">+ shipping</p>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 text-center mt-4">
                  Secure payment processing. 100% satisfaction guarantee or your money back.
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 flex justify-end">
                <button
                  onClick={() => setShowPurchaseOptions(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PreviewPage; 