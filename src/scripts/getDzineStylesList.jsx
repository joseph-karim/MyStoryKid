import React, { useState, useEffect } from 'react';
import { getDzineStyles } from '../services/dzineService';

function DzineStylesList() {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchStyles() {
      try {
        setLoading(true);
        const data = await getDzineStyles();
        
        if (data && data.list && data.list.length > 0) {
          // Sort styles alphabetically by name
          const sortedStyles = [...data.list].sort((a, b) => 
            a.name.localeCompare(b.name)
          );
          setStyles(sortedStyles);
        } else {
          setError('No styles available from the API');
        }
      } catch (err) {
        console.error('Error fetching styles:', err);
        setError(err.message || 'Failed to fetch styles');
      } finally {
        setLoading(false);
      }
    }
    
    fetchStyles();
  }, []);
  
  if (loading) {
    return <div className="p-4">Loading styles...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dzine API Styles ({styles.length})</h1>
      
      <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-[600px]">
        {JSON.stringify(styles.map(s => ({
          name: s.name,
          style_code: s.style_code
        })), null, 2)}
      </pre>
      
      <div className="mt-6 space-y-6">
        {styles.map((style) => (
          <div key={style.style_code} className="border rounded-lg p-4">
            <div className="flex items-start">
              {style.cover_url && (
                <img 
                  src={style.cover_url} 
                  alt={style.name} 
                  className="w-24 h-24 object-cover rounded mr-4"
                />
              )}
              <div>
                <h2 className="text-lg font-semibold">{style.name}</h2>
                <p className="text-sm text-gray-500">Style Code: {style.style_code}</p>
                <p className="text-sm text-gray-500">Base Model: {style.base_model || 'N/A'}</p>
                {style.style_intensity && (
                  <p className="text-sm text-gray-500">
                    Intensity: img2img={style.style_intensity.img2img}, txt2img={style.style_intensity.txt2img}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DzineStylesList; 