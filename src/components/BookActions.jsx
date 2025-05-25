import React, { useState } from 'react';
import { isAnonymousUser } from '../services/anonymousAuthService';
import { generateBookPDF } from '../services/digitalDownloadService';
import AuthModal from './AuthModal';
import useAuthStore from '../store/useAuthStore';

/**
 * Component for book actions (download, save, print) that handles authentication requirements
 */
const BookActions = ({ book }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, isAnonymous } = useAuthStore();

  // Handle download action
  const handleDownload = async () => {
    await handleAction('download', async () => {
      try {
        console.log('Downloading book:', book.id);
        // Generate PDF using the digitalDownloadService
        const pdfUrl = await generateBookPDF(book);
        // Open the PDF in a new tab
        window.open(pdfUrl, '_blank');
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert(`Error generating PDF: ${error.message}`);
      }
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
      // Scroll to the BookPurchaseOptions component
      const purchaseOptions = document.getElementById('book-purchase-options');
      if (purchaseOptions) {
        purchaseOptions.scrollIntoView({ behavior: 'smooth' });
      } else {
        console.log('Printing book:', book.id);
        alert('Please use the purchase options below to order a printed copy.');
      }
    });
  };

  // Generic handler for actions that might require authentication
  const handleAction = async (type, actionCallback) => {
    setIsLoading(true);
    try {
      // Check if user is authenticated and not anonymous
      if (!isAuthenticated || isAnonymous) {
        // Show auth modal for unauthenticated or anonymous users
        setActionType(type);
        setShowAuthModal(true);
        setIsLoading(false);
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
  const handleActionSuccess = async () => {
    // Determine which action to perform based on actionType
    if (actionType === 'download') {
      console.log('Proceeding with download after authentication');
      // Generate PDF using the digitalDownloadService
      try {
        const pdfUrl = await generateBookPDF(book);
        window.open(pdfUrl, '_blank');
      } catch (error) {
        console.error('Error generating PDF:', error);
        alert(`Error generating PDF: ${error.message}`);
      }
    } else if (actionType === 'save') {
      console.log('Proceeding with save after authentication');
      // Implement actual save logic
      alert('Book saved!');
    } else if (actionType === 'print') {
      console.log('Proceeding with print after authentication');
      // Scroll to the BookPurchaseOptions component
      const purchaseOptions = document.getElementById('book-purchase-options');
      if (purchaseOptions) {
        purchaseOptions.scrollIntoView({ behavior: 'smooth' });
      } else {
        alert('Please use the purchase options below to order a printed copy.');
      }
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

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
          handleActionSuccess();
        }}
        mode="signin"
      />
    </div>
  );
};

export default BookActions;