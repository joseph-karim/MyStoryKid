import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useBookStore } from '../store';
import useEnhancedBookStore from '../store/useEnhancedBookStore.js';
import OrderTracking from '../components/OrderTracking';

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

  // Simple admin check - you can modify this logic as needed
  const isAdmin = user?.email === 'josephkarim@gmail.com' || user?.user_metadata?.role === 'admin';
  
  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center">
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

      {/* Admin Section */}
      {isAdmin && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-purple-700">Admin Tools</h2>
              <p className="text-purple-600 mt-1">Manage and monitor system APIs</p>
            </div>
            <Link 
              to="/admin/api-tester" 
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              API Dashboard
            </Link>
          </div>
        </div>
      )}
      
      {/* Create New Book CTA */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex justify-between items-center">
        <div>
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
      <div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allBooks.map((book) => (
              <div key={book.id} className="border rounded-lg overflow-hidden">
                <div className="h-40 bg-gray-200">
                  {/* Book thumbnail */}
                  <img 
                    src={book.thumbnail || book.pages?.[0]?.imageUrl || 'https://via.placeholder.com/150'} 
                    alt={book.title} 
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{book.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">
                      {new Date(book.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      book.status === 'draft' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : book.status === 'purchased_digital'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {book.status === 'draft' 
                        ? 'Draft' 
                        : book.status === 'purchased_digital'
                        ? 'Digital'
                        : 'Print'}
                    </span>
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
      <div>
        <OrderTracking showAllOrders={true} />
      </div>
    </div>
  );
}

export default DashboardPage; 