import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBookStore } from '../store';
import BookPreview from '../components/BookPreview';
import BookActions from '../components/BookActions';

function PreviewPage() {
  const { bookId } = useParams();
  const { books, currentBook, setCurrentBook } = useBookStore(); // Keep basic store access

  console.log(`[PreviewPage] Rendering for bookId: ${bookId}`);

  // Minimal effect to find the book
  useEffect(() => {
    const book = books.find(b => b.id === bookId);
    console.log('[PreviewPage] Found book in store:', book);
    if (book && (!currentBook || currentBook.id !== bookId)) {
      setCurrentBook(book);
    }
  }, [bookId, books, currentBook, setCurrentBook]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Book Preview</h1>
        <Link to="/dashboard" className="text-blue-600 hover:underline">Back to Dashboard</Link>
      </div>
      
      {currentBook ? (
        <div className="space-y-8">
          {/* Book Preview Component */}
          <BookPreview book={currentBook} isWatermarked={true} />
          
          {/* Book Actions Component */}
          <BookActions book={currentBook} />
        </div>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading book...</p>
        </div>
      )}
    </div>
  );
}

export default PreviewPage; 