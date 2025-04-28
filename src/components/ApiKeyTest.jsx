import React, { useState, useEffect } from 'react';

/**
 * A simple component to test if the OpenAI API key is being loaded correctly
 */
function ApiKeyTest() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // Get the API key from environment variables
      const key = import.meta.env.VITE_OPENAI_API_KEY;
      
      // Mask the API key for display
      if (key) {
        const maskedKey = `${key.substring(0, 10)}...${key.substring(key.length - 5)}`;
        setApiKey(maskedKey);
      } else {
        setApiKey('Not found');
      }
      
      setIsLoading(false);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return <div>Loading API key information...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h2 className="text-lg font-semibold mb-2">OpenAI API Key Test</h2>
      <p>API Key (masked): <span className="font-mono">{apiKey}</span></p>
      <p className="mt-2 text-sm text-gray-500">
        {apiKey === 'Not found' 
          ? 'No API key found. Please check your .env file.' 
          : 'API key found. If you are still having issues, the key may be invalid.'}
      </p>
    </div>
  );
}

export default ApiKeyTest;
