import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { validateDownloadToken } from '../services/digitalDownloadService';
import useAuthStore from '../store/useAuthStore';

/**
 * Page for handling digital downloads with secure tokens
 */
const DigitalDownloadPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState(null);
  const [downloadInfo, setDownloadInfo] = useState(null);
  const { downloadId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    // Validate the download token when the component mounts
    const validateToken = async () => {
      if (!token) {
        setError('Invalid download link. No token provided.');
        setIsLoading(false);
        return;
      }
      
      try {
        // Validate the token
        const isTokenValid = await validateDownloadToken(token);
        
        if (isTokenValid) {
          // In a production environment, we would fetch the download info from the database
          // For now, we'll use mock data
          setDownloadInfo({
            id: downloadId,
            filename: 'Your Personalized Story.pdf',
            downloadUrl: `https://example.com/download/${downloadId}?token=${token}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
          });
          setIsValid(true);
        } else {
          setError('This download link is invalid or has expired.');
        }
      } catch (error) {
        console.error('Error validating download token:', error);
        setError('An error occurred while validating your download link. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    validateToken();
  }, [downloadId, token]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Preparing Your Download</h1>
          <p className="text-gray-600">Please wait while we prepare your download...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded mb-6">
          <p>{error}</p>
        </div>
        
        <div className="text-center">
          <p className="mb-4">If you believe this is an error, please contact our support team.</p>
          <Link to="/" className="text-blue-600 hover:underline">Return to Home</Link>
        </div>
      </div>
    );
  }
  
  if (isValid && downloadInfo) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Your Download is Ready</h1>
            <p className="text-gray-600">Thank you for your purchase!</p>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Download Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Filename:</span> {downloadInfo.filename}</p>
              <p><span className="font-medium">Expires:</span> {formatDate(downloadInfo.expiresAt)}</p>
            </div>
          </div>
          
          <div className="text-center">
            <a
              href={downloadInfo.downloadUrl}
              download={downloadInfo.filename}
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download Your PDF
            </a>
            
            <p className="mt-6 text-sm text-gray-600">
              Having trouble? <a href="/contact" className="text-blue-600 hover:underline">Contact our support team</a>
            </p>
          </div>
          
          {isAuthenticated && (
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 mb-2">You can access all your downloads in your account.</p>
              <Link to="/account/downloads" className="text-blue-600 hover:underline">
                View All Downloads
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-6">We couldn't process your download request.</p>
        <Link to="/" className="text-blue-600 hover:underline">Return to Home</Link>
      </div>
    </div>
  );
};

export default DigitalDownloadPage;
