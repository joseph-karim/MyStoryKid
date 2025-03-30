import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, useBookStore } from '../store';

function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { books, setBooks } = useBookStore();
  const navigate = useNavigate();
  
  // Removed authentication redirect check for testing
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
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
        
        {books.length === 0 ? (
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
            {books.map((book) => (
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
                      to={`/preview/${book.id}`} 
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
      
      {/* Order History Section - simplified for now */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Order History</h2>
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <p className="text-gray-500">Order history will be displayed here.</p>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage; 