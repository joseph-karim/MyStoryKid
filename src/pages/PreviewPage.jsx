import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useBookStore } from '../store';

// Comment out complex components/hooks
// import PageFlip from 'react-pageflip';
// import InteractionLayer from '../components/InteractionLayer'; 

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

  // Simple Render Test
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Book Preview (Debug View)</h1>
      <p>Book ID: {bookId}</p>
      {currentBook ? (
        <p>Book Title: {currentBook.title}</p>
      ) : (
        <p>Loading book...</p>
      )}
      <p>If you see this, the basic PreviewPage rendered without the TypeError.</p>
      <Link to="/dashboard" className="text-blue-600 hover:underline mt-4 inline-block">Back to Dashboard</Link>
    </div>
  );
}

export default PreviewPage; 