import React, { useState, useEffect } from 'react';

// Mock data for styles since dzineService was removed
const mockStyles = [
  { name: "Watercolor Storybook", style_code: "watercolor_storybook", base_model: "OpenAI" },
  { name: "Cartoon Character", style_code: "cartoon_character", base_model: "OpenAI" },
  { name: "Fantasy Storybook", style_code: "fantasy_storybook", base_model: "OpenAI" },
  { name: "Clay Animation", style_code: "clay_animation", base_model: "OpenAI" },
  { name: "Ink Wash", style_code: "ink_wash", base_model: "OpenAI" },
];

function DzineStylesList() {
  const [styles, setStyles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulate API fetch with mock data
    setTimeout(() => {
      setStyles(mockStyles);
      setLoading(false);
    }, 500);
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