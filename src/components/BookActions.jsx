import React, { useState } from 'react';
import { useAuthStore } from '../store';
import { isAnonymousUser, handleBookAction } from '../services/anonymousAuthService';
import LoginPrompt from './LoginPrompt';

/**
 * Component for book actions (download, save, print) that handles authentication requirements
 */
const BookActions = ({ book }) => {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // Handle download action
  const handleDownload = async () => {
    await handleAction('download', () => {
      // Implement actual download logic here
      console.log('Downloading book:', book.id);
      alert('Download started!'); // Replace with actual download implementation
    });
  };

  // Handle save action
  const handleSave = async () => {
    await handleAction('save', () => {
      // Implement actual save logic here
      console.log('Saving book:', book.id);
      alert('Book saved!'); // Replace with actual save implementation
    });
  };

  // Handle print action
  const handlePrint = async () => {
    await handleAction('print', () => {
      // Implement actual print logic here
      console.log('Printing book:', book.id);
      alert('Print dialog opened!'); // Replace with actual print implementation
    });
  };

  // Generic handler for actions that might require authentication
  const handleAction = async (type, actionCallback) => {
    setIsLoading(true);
    try {
      // Check if user is anonymous
      const anonymous = await isAnonymousUser();
      
      if (anonymous) {
        // Show login prompt for anonymous users
        setActionType(type);
        setShowLoginPrompt(true);
        return;
      }
      
      // User is authenticated, proceed with action
      actionCallback();
    } catch (error) {
      console.error(`Error handling ${type} action:`, error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful login/action
  const handleActionSuccess = () => {
    // Determine which action to perform based on actionType
    if (actionType === 'download') {
      console.log('Proceeding with download after authentication');
      // Implement actual download logic
      alert('Download started!');
    } else if (actionType === 'save') {
      console.log('Proceeding with save after authentication');
      // Implement actual save logic
      alert('Book saved!');
    } else if (actionType === 'print') {
      console.log('Proceeding with print after authentication');
      // Implement actual print logic
      alert('Print dialog opened!');
    }
  };

  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
      <button
        onClick={handleDownload}
        disabled={isLoading}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Processing...' : 'Download Book'}
      </button>
      
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Processing...' : 'Save Book'}
      </button>
      
      <button
        onClick={handlePrint}
        disabled={isLoading}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Processing...' : 'Print Book'}
      </button>
      
      {showLoginPrompt && (
        <LoginPrompt
          bookId={book.id}
          actionType={actionType}
          onClose={() => setShowLoginPrompt(false)}
          onSuccess={handleActionSuccess}
        />
      )}
    </div>
  );
};

export default BookActions;