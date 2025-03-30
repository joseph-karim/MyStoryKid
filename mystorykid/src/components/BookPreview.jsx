import { useState, useRef } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useAuthStore } from '../store';

// Page component for the flip book
const Page = ({ pageNumber, content, image }) => {
  return (
    <div className="relative bg-white h-full w-full shadow-md flex flex-col">
      {/* Watermark shown if not purchased */}
      {content.watermark && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="transform rotate-45 bg-red-500 bg-opacity-30 text-white px-20 py-2 text-xl">
            PREVIEW
          </div>
        </div>
      )}
      
      {/* Page content */}
      <div className="p-4 flex flex-col h-full">
        {/* Page number */}
        {pageNumber > 0 && content.type !== 'cover' && content.type !== 'back-cover' && (
          <div className="text-gray-400 text-sm text-center">
            {pageNumber}
          </div>
        )}
        
        {/* Image - if present */}
        {image && (
          <div className="my-4 flex justify-center">
            <img 
              src={image} 
              alt={`Illustration for page ${pageNumber}`}
              className="max-h-[300px] object-contain"
            />
          </div>
        )}
        
        {/* Text */}
        <div className={`${content.type === 'cover' || content.type === 'back-cover' ? 'flex-grow flex items-center justify-center' : 'mt-4'}`}>
          <div 
            className={`whitespace-pre-wrap ${
              content.type === 'cover' || content.type === 'title' 
              ? 'text-center font-bold text-xl' 
              : content.type === 'back-cover' 
              ? 'text-center' 
              : 'text-base'
            }`}
          >
            {content.text}
          </div>
        </div>
      </div>
    </div>
  );
};

function BookPreview({ book, isWatermarked = true }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const flipBook = useRef(null);
  const { isAuthenticated } = useAuthStore();
  
  // Check if the book is owned by the current user or watermarked preview
  const isPurchased = book?.status === 'purchased_digital' || book?.status === 'ordered_print';
  const showWatermark = isWatermarked && !isPurchased;
  
  // Prepare pages with watermark if needed
  const pages = book?.pages.map(page => ({
    ...page,
    watermark: showWatermark,
  })) || [];
  
  const handlePageFlip = (e) => {
    setCurrentPage(e.data);
  };
  
  const nextPage = () => {
    if (flipBook.current && currentPage < totalPages - 1) {
      flipBook.current.pageFlip().flipNext();
    }
  };
  
  const prevPage = () => {
    if (flipBook.current && currentPage > 0) {
      flipBook.current.pageFlip().flipPrev();
    }
  };
  
  if (!book || pages.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">No book to preview.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 w-full flex justify-between items-center">
        <h2 className="text-xl font-bold">{book.title}</h2>
        <div className="text-sm text-gray-600">
          Page {currentPage + 1} of {totalPages}
        </div>
      </div>
      
      <div className="relative w-full overflow-hidden max-w-4xl mx-auto">
        <HTMLFlipBook
          width={550}
          height={733}
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          showCover={true}
          mobileScrollSupport={true}
          onFlip={handlePageFlip}
          onInit={(e) => setTotalPages(e.data.pages)}
          className="mx-auto"
          ref={flipBook}
          startPage={0}
        >
          {pages.map((page, index) => (
            <div key={page.id} className="bg-white p-0 m-0">
              <Page 
                pageNumber={index} 
                content={page} 
                image={page.imageUrl || null} 
              />
            </div>
          ))}
        </HTMLFlipBook>
      </div>
      
      <div className="mt-6 flex space-x-4">
        <button
          onClick={prevPage}
          disabled={currentPage === 0}
          className={`px-4 py-2 rounded ${
            currentPage === 0 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Previous
        </button>
        <button
          onClick={nextPage}
          disabled={currentPage === totalPages - 1}
          className={`px-4 py-2 rounded ${
            currentPage === totalPages - 1 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Next
        </button>
      </div>
      
      {showWatermark && (
        <div className="mt-6 bg-yellow-100 p-4 rounded-lg text-yellow-800 text-center">
          <p className="font-medium">This is a preview. Purchase to remove the watermark.</p>
        </div>
      )}
    </div>
  );
}

export default BookPreview; 