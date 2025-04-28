import React, { useState, useEffect } from 'react';
import { getUserDownloads } from '../services/digitalDownloadService';
import useAuthStore from '../store/useAuthStore';

/**
 * Component for displaying a user's digital downloads
 */
const DigitalDownloads = () => {
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();
  
  useEffect(() => {
    // Fetch the user's downloads when the component mounts
    const fetchDownloads = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      try {
        const userDownloads = await getUserDownloads(user.id);
        setDownloads(userDownloads);
      } catch (error) {
        console.error('Error fetching downloads:', error);
        setError('Failed to load your downloads. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDownloads();
  }, [user]);
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Check if a download is expired
  const isExpired = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return now > expiry;
  };
  
  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p>Loading your downloads...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="p-6 text-center">
        <p>Please log in to view your downloads.</p>
      </div>
    );
  }
  
  if (downloads.length === 0) {
    return (
      <div className="p-6 text-center">
        <p>You don't have any downloads yet.</p>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Your Downloads</h2>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Book Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expires
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Download
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {downloads.map((download) => (
              <tr key={download.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{download.bookTitle}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{formatDate(download.createdAt)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {isExpired(download.expiresAt) ? (
                      <span className="text-red-500">Expired</span>
                    ) : (
                      formatDate(download.expiresAt)
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {isExpired(download.expiresAt) ? (
                    <span className="text-gray-400">Expired</span>
                  ) : (
                    <a
                      href={download.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Download PDF
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DigitalDownloads;
