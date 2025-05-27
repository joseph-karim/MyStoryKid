import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useBookStore } from '../store';
import useEnhancedBookStore from '../store/useEnhancedBookStore.js';
import OrderTracking from '../components/OrderTracking';
import LazyLoad from 'react-lazyload';

function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { books: legacyBooks, setBooks } = useBookStore();
  const { 
    books: dbBooks, 
    isLoading, 
    error, 
    loadUserBooks,
    claimAnonymousBooks 
  } = useEnhancedBookStore();
  const navigate = useNavigate();
  const [allBooks, setAllBooks] = useState([]);
  
  // Load books from database on component mount
  useEffect(() => {
    const loadBooks = async () => {
      try {
        if (isAuthenticated) {
          // Load user's books from database
          await loadUserBooks();
          
          // Claim any anonymous books if user just logged in
          await claimAnonymousBooks();
        }
      } catch (error) {
        console.error('[DashboardPage] Error loading books:', error);
      }
    };

    loadBooks();
  }, [isAuthenticated, loadUserBooks, claimAnonymousBooks]);

  // Combine database books with legacy books (for backward compatibility)
  useEffect(() => {
    const combinedBooks = [...dbBooks];
    
    // Add legacy books that aren't already in database
    legacyBooks.forEach(legacyBook => {
      if (!dbBooks.find(dbBook => dbBook.id === legacyBook.id)) {
        combinedBooks.push(legacyBook);
      }
    });
    
    setAllBooks(combinedBooks);
  }, [dbBooks, legacyBooks]);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  /**
   * BookThumbnail component for displaying the book cover image
   * @param {Object} props
   * @param {string} props.src - Image URL
   * @param {string} props.alt - Alt text
   */
  function BookThumbnail({ src, alt }) {
    return (
      <div
        className="h-40 bg-gray-200 flex items-center justify-center transition-transform duration-200 hover:scale-105 hover:shadow-lg focus-within:scale-105 focus-within:shadow-lg rounded cursor-pointer"
        tabIndex={0}
        aria-label={alt}
        title={alt}
        data-testid="book-thumbnail"
      >
        {/* Lazy load the book cover image */}
        <LazyLoad
          height={160}
          offset={100}
          placeholder={<div className="h-full w-full bg-gray-100 animate-pulse" />}
          once
        >
          <img 
            src={src || 'https://via.placeholder.com/150'}
            alt={alt}
            className="h-full w-full object-cover rounded"
            onError={e => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/150'; }}
            tabIndex={-1}
          />
        </LazyLoad>
        <noscript>
          <img 
            src={src || 'https://via.placeholder.com/150'}
            alt={alt}
            className="h-full w-full object-cover rounded"
            tabIndex={-1}
          />
        </noscript>
      </div>
    );
  }

  /**
   * BookStatusIndicator component for displaying the book status badge
   * @param {Object} props
   * @param {string} props.status - Book status (draft, purchased_digital, print)
   */
  function BookStatusIndicator({ status }) {
    let label = 'Print';
    let className = 'bg-blue-100 text-blue-800';
    let icon = '📚';
    let tooltip = 'Print: Printed book';
    if (status === 'draft') {
      label = 'Draft';
      className = 'bg-yellow-100 text-yellow-800';
      icon = '📝';
      tooltip = 'Draft: Not yet purchased or finalized';
    } else if (status === 'purchased_digital') {
      label = 'Digital';
      className = 'bg-green-100 text-green-800';
      icon = '💾';
      tooltip = 'Digital: Purchased digital download';
    }
    return (
      <span
        className={`text-xs px-2 py-1 rounded inline-flex items-center gap-1 ${className}`}
        aria-label={tooltip}
        title={tooltip}
        data-testid="book-status-indicator"
      >
        <span aria-hidden="true">{icon}</span> {label}
      </span>
    );
  }
  
  return (
    // Main dashboard grid container
    <div className="grid grid-rows-[auto,auto,1fr,auto] gap-8 md:gap-10 lg:gap-12 max-w-6xl mx-auto px-4 py-8">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 row-start-1">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.displayName || 'User'}</p>
        </div>
        <div>
          <button 
            onClick={handleLogout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Create New Book CTA */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex flex-col md:flex-row justify-between items-center row-start-2">
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl font-semibold text-blue-700">Create a New Story</h2>
          <p className="text-blue-600 mt-1">Start the magical journey of creating a personalized book</p>
        </div>
        <Link 
          to="/create" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Book
        </Link>
      </div>
      
      {/* Books Section */}
      <div className="row-start-3">
        <h2 className="text-xl font-semibold mb-4">My Books</h2>
        {isLoading ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading your books...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-600">Error loading books: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-red-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : allBooks.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">You don't have any books yet.</p>
            <Link 
              to="/create" 
              className="text-blue-600 hover:underline mt-2 inline-block"
            >
              Create your first book
            </Link>
          </div>
        ) : (
          // Responsive grid for books
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allBooks.map((book) => (
              <div key={book.id} className="border rounded-lg overflow-hidden flex flex-col bg-white shadow-sm">
                {/* Book thumbnail */}
                <BookThumbnail 
                  src={book.thumbnail || book.pages?.[0]?.imageUrl}
                  alt={book.title}
                />
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold">{book.title}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">
                        {new Date(book.createdAt).toLocaleDateString()}
                      </span>
                      <BookStatusIndicator status={book.status} />
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <Link 
                      to={`/edit/${book.id}`} 
                      className="text-blue-600 hover:underline text-sm"
                    >
                      {book.status === 'draft' ? 'Continue Editing' : 'Edit'}
                    </Link>
                    <Link 
                      to={`/book/${book.id}`}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Preview
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Order Tracking Section */}
      <div className="row-start-4">
        <OrderTracking showAllOrders={true} />
      </div>
    </div>
  );
}

export default DashboardPage; 