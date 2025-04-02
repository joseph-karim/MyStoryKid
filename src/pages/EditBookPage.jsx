import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookStore } from '../store'; // Keep store import for potential context issues

// Comment out almost everything else for debugging
// import { useAuthStore, useCharacterStore } from '../store';
// import { motion } from 'framer-motion';
// import CharacterSelector from '../components/CharacterSelector';

function EditBookPage() {
  const { bookId } = useParams();
  const navigate = useNavigate(); // Keep navigate for potential redirects
  const { books, setCurrentBook, currentBook } = useBookStore(); // Keep basic store access

  console.log(`[EditBookPage] Rendering for bookId: ${bookId}`);

  // Minimal effect to find the book, maybe log it
  useEffect(() => {
    const book = books.find(b => b.id === bookId);
    console.log('[EditBookPage] Found book in store:', book);
    if (book && (!currentBook || currentBook.id !== bookId)) {
        setCurrentBook(book);
    } else if (!book) {
        console.warn(`[EditBookPage] Book with ID ${bookId} not found in store.`);
        // navigate('/dashboard'); // Optional: redirect if not found
    }
  }, [bookId, books, navigate, setCurrentBook, currentBook]);

  // Simple Render Test
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold">Edit Book (Debug View)</h1>
      <p>Book ID from URL: {bookId}</p>
      {currentBook ? (
        <p>Current book title from store: {currentBook.title}</p>
      ) : (
        <p>Loading book data from store...</p>
      )}
      <p>If you see this, the basic component rendered without the TypeError.</p>
    </div>
  );
}

export default EditBookPage;