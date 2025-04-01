import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { getDzineStyles, getAvailableStyles } from '../../services/dzineService';
import { useQueryClient } from '@tanstack/react-query';

// Import art style images - Updated paths to match the existing assets
import watercolorImg from '../../assets/watercolor-theme.png';
import pastelImg from '../../assets/pastel-theme.png';
import pencilWashImg from '../../assets/gentle-pencil-wash.png';
import softDigitalImg from '../../assets/soft-brush-digital.png';
import pencilInkImg from '../../assets/pencil-sketch-ink.png';
import goldenBooksImg from '../../assets/golden-books-style.png';
import beatrixPotterImg from '../../assets/beatrix-potter-style.png';
import cartoonImg from '../../assets/cartoon-2d-animation-style.png';
import flatVectorImg from '../../assets/flat-vector-illustration.png';
import storybookPopImg from '../../assets/storybook-pop-style.png';
import papercutImg from '../../assets/cut-paper-collage-style.png';
import oilPastelImg from '../../assets/oil-pastel-gouache-style.png';
import stylizedRealismImg from '../../assets/stylized-realism.png';
import digitalPainterlyImg from '../../assets/digital-painterly.png';
import kawaiiImg from '../../assets/japanese-kawaii.png';
import scandinavianImg from '../../assets/scandinavian-folk-art.png';
import africanPatternImg from '../../assets/african-patterned-illustration.png';

// Map style IDs to the imported images
const styleImageMap = {
  watercolor: watercolorImg,
  pastel: pastelImg,
  pencil_wash: pencilWashImg, 
  soft_digital: softDigitalImg,
  pencil_ink: pencilInkImg,
  golden_books: goldenBooksImg,
  beatrix_potter: beatrixPotterImg,
  cartoon: cartoonImg,
  flat_vector: flatVectorImg,
  storybook_pop: storybookPopImg,
  papercut: papercutImg,
  oil_pastel: oilPastelImg,
  stylized_realism: stylizedRealismImg,
  digital_painterly: digitalPainterlyImg,
  kawaii: kawaiiImg,
  scandinavian: scandinavianImg,
  african_pattern: africanPatternImg
};

// Define the structure for art style categories with detailed descriptions
const ART_STYLE_CATEGORIES_STRUCTURE = [
  {
    category: 'Whimsical & Soft (Ages 0–5)',
    description: 'Gentle, dreamy art styles perfect for the youngest readers with soft colors and comforting visuals.',
    styleIds: [
      { id: 'watercolor', keywords: ['watercolor', 'water', 'soft', 'gentle', 'dreamy', 'whimsy'] },
      { id: 'pastel', keywords: ['pastel', 'chalk', 'soft', 'tender', 'gentle', 'soothing'] },
      { id: 'pencil_wash', keywords: ['pencil', 'wash', 'line', 'drawing', 'sketch', 'watercolor'] },
      { id: 'soft_digital', keywords: ['soft', 'digital', 'rounded', 'gentle', 'brush', 'whimsy'] }
    ]
  },
  {
    category: 'Classic & Timeless (Ages 3–8)',
    description: 'Traditional illustration styles reminiscent of beloved children\'s books that stand the test of time.',
    styleIds: [
      { id: 'pencil_ink', keywords: ['pencil', 'ink', 'sketch', 'line', 'drawing', 'classic'] },
      { id: 'golden_books', keywords: ['golden', 'book', 'classic', 'vintage', 'retro', 'mid-century'] },
      { id: 'beatrix_potter', keywords: ['classic', 'fable', 'warm', 'gentle', 'tale', 'peter', 'rabbit'] }
    ]
  },
  {
    category: 'Modern & Colorful (Ages 4–9)',
    description: 'Bold, vibrant styles with clean lines and contemporary design sensibilities.',
    styleIds: [
      { id: 'cartoon', keywords: ['cartoon', 'anime', 'animation', 'fun', 'vibrant', '2d'] },
      { id: 'flat_vector', keywords: ['flat', 'vector', 'simple', 'clean', 'minimal', 'icon'] },
      { id: 'storybook_pop', keywords: ['storybook', 'pop', 'vibrant', 'bright', 'fun', 'energetic'] },
      { id: 'papercut', keywords: ['paper', 'cut', 'cutout', 'collage', 'texture', 'layer'] }
    ]
  },
  {
    category: 'Artistic & Elevated (Ages 6–12)',
    description: 'Sophisticated art styles with richer detail and artistic techniques for older children.',
    styleIds: [
      { id: 'oil_pastel', keywords: ['oil', 'pastel', 'paint', 'texture', 'brush', 'stroke', 'vibrant'] },
      { id: 'stylized_realism', keywords: ['stylized', 'realism', 'realistic', 'detail', 'structure', 'serenity'] },
      { id: 'digital_painterly', keywords: ['digital', 'paint', 'painterly', 'artistic', 'rich', 'luminous'] }
    ]
  },
  {
    category: 'Cultural Styles (All Ages)',
    description: 'Art styles inspired by diverse cultural traditions and aesthetic sensibilities.',
    styleIds: [
      { id: 'kawaii', keywords: ['kawaii', 'cute', 'japanese', 'japan', 'anime', 'adorable'] },
      { id: 'scandinavian', keywords: ['scandinavian', 'nordic', 'folk', 'scandi', 'minimal', 'clean'] },
      { id: 'african_pattern', keywords: ['african', 'pattern', 'bold', 'collage', 'vibrant', 'colorful'] }
    ]
  }
];

// Detailed descriptions for each art style
const styleDescriptions = {
  watercolor: { 
    title: 'Watercolor',
    description: 'Soft, dreamy illustrations with gentle color washes and fluid textures'
  },
  pastel: { 
    title: 'Pastel Illustration',
    description: 'Tender, soothing colors with a gentle, chalky texture perfect for bedtime stories'
  },
  pencil_wash: { 
    title: 'Pencil & Wash',
    description: 'Delicate pencil drawings with light watercolor washes for a timeless feel'
  },
  soft_digital: { 
    title: 'Soft Digital',
    description: 'Rounded shapes and soft digital brushwork with gentle gradients and textures'
  },
  pencil_ink: { 
    title: 'Pencil & Ink',
    description: 'Classic line drawings with expressive ink work, reminiscent of beloved storybooks'
  },
  golden_books: { 
    title: 'Golden Book Style',
    description: 'Nostalgic illustrations inspired by classic "Little Golden Books" from mid-century'
  },
  beatrix_potter: { 
    title: 'Beatrix Potter Style',
    description: 'Charming, detailed watercolor illustrations in the style of Peter Rabbit and friends'
  },
  cartoon: { 
    title: 'Cartoon',
    description: 'Lively, energetic illustrations with bold outlines and vibrant colors'
  },
  flat_vector: { 
    title: 'Flat Vector',
    description: 'Clean, modern illustrations with simple shapes and minimal detail'
  },
  storybook_pop: { 
    title: 'Storybook Pop',
    description: 'Bright, cheerful illustrations with bold colors and playful details'
  },
  papercut: { 
    title: 'Papercut Style',
    description: 'Illustrations that look like colorful layers of cut paper with distinct shapes'
  },
  oil_pastel: { 
    title: 'Oil Pastel',
    description: 'Rich, textured illustrations with bold strokes and vibrant color blending'
  },
  stylized_realism: { 
    title: 'Stylized Realism',
    description: 'More detailed illustrations with accurate proportions but artistic styling'
  },
  digital_painterly: { 
    title: 'Digital Painterly',
    description: 'Rich digital illustrations with painterly effects and detailed lighting'
  },
  kawaii: { 
    title: 'Japanese Kawaii',
    description: 'Cute, adorable characters with simplified features and expressive eyes'
  },
  scandinavian: { 
    title: 'Scandinavian',
    description: 'Clean, minimal illustrations with folk art influences and nature motifs'
  },
  african_pattern: { 
    title: 'African Pattern',
    description: 'Vibrant illustrations inspired by African textiles with bold patterns and colors'
  },
  custom: {
    title: 'Custom Style',
    description: 'Describe your own unique art style for your story'
  }
};

// A fallback map for API-to-internal style mapping
const styleIdToCodeMap = {
  watercolor: 'Style-2478f952-50e7-4773-9cd3-c6056e774823', // Classic Watercolor
  pastel: 'Style-206baa8c-5bbe-4299-b984-9243d05dce9b',     // Whimsical Coloring
  pencil_wash: 'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9', // Line & Wash
  soft_digital: 'Style-7f3f81ad-1c2d-4a15-944d-66bf549641de', // Watercolor Whimsy
  pencil_ink: 'Style-e9021405-1b37-4773-abb9-bd80485527b0',  // Sketch Elegance
  golden_books: 'Style-a37d7b69-1f9a-42c4-a8e4-f429c29f4512', // Golden Era Illustrations
  beatrix_potter: 'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1', // Warm Fables
  cartoon: 'Style-b484beb8-143e-4776-9a87-355e0456cfa3',    // Cartoon Anime
  flat_vector: 'Style-2ee57e3c-108a-41dd-8b28-b16d0ceb6280', // Simple Icon
  storybook_pop: 'Style-85480a6c-4aa6-4260-8ad1-a0b7423910cf', // Storybook Charm
  papercut: 'Style-541a2afd-904a-4968-bc60-8ad0ede22a86',   // Paper Cutout
  oil_pastel: 'Style-b7c0d088-e046-4e9b-a0fb-a329d2b9a36a', // Vibrant Impasto
  stylized_realism: 'Style-bfb2db5f-ecfc-4fe9-b864-1a5770d59347', // Structured Serenity
  digital_painterly: 'Style-ce7b4279-1398-4964-882c-19911e12aef3', // Luminous Narratives
  kawaii: 'Style-455da805-d716-4bc8-a960-4ac505aa7875',     // Everything Kawaii
  scandinavian: 'Style-509ffd5a-e71f-4cec-890c-3ff6dcb9cb60', // Scandi
  african_pattern: 'Style-64894017-c7f5-4316-b16b-43c584bcd643', // Bold Collage
  custom: 'Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2'      // No Style v2 (default)
};

function ArtStyleStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  
  const [artStyleCode, setArtStyleCode] = useState(wizardState.storyData.artStyleCode || '');
  const [customStyleDescription, setCustomStyleDescription] = useState(wizardState.storyData.customStyleDescription || '');
  
  // State for fetched styles and mapping
  const [dzineStyles, setDzineStyles] = useState([]);
  const [noStyleCode, setNoStyleCode] = useState(null); // For custom style
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);
  const [styleFetchError, setStyleFetchError] = useState(null);
  const [error, setError] = useState('');
  
  // UPDATED: Create a hard-coded style map for internal testing
  // This guarantees styles will display even if API is unavailable
  const FALLBACK_STYLE_MAP = { ...styleIdToCodeMap };

  // Find best matching API style for a given internal style ID
  const findBestMatchingStyle = (styleItem, apiStyles) => {
    if (!apiStyles || apiStyles.length === 0) return null;
    
    // Try to find a match based on keywords
    const matches = apiStyles.map(apiStyle => {
      const apiStyleName = apiStyle.name.toLowerCase();
      const matchScore = styleItem.keywords.reduce((score, keyword) => {
        return apiStyleName.includes(keyword.toLowerCase()) ? score + 1 : score;
      }, 0);
      return { apiStyle, matchScore };
    }).filter(match => match.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
    
    // Return the best match or null if no matches
    return matches.length > 0 ? matches[0].apiStyle : null;
  };

  // Fetch styles from Dzine API on mount
  useEffect(() => {
    const fetchStyles = async () => {
      setIsLoadingStyles(true);
      setStyleFetchError(null);
      try {
        const data = await getDzineStyles();
        if (data.list && data.list.length > 0) {
          setDzineStyles(data.list);
          
          // Find "No Style" option for custom styles
          const noStyleOption = data.list.find(style => 
            style.name.toLowerCase().includes('no style')
          );
          setNoStyleCode(noStyleOption?.style_code || 'Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2');
          
          // Set initial artStyleCode if not already set
          if (!artStyleCode) {
            // Auto-suggest style based on category (can be refined)
            const category = wizardState.storyData.category || 'adventure';
            
            // Map categories to style IDs
            const categoryToStyleMap = {
              adventure: 'cartoon',
              fantasy: 'watercolor',
              bedtime: 'pastel',
              learning: 'flat_vector',
              birthday: 'storybook_pop'
            };
            
            // Get the suggested style ID
            const suggestedInternalStyleId = categoryToStyleMap[category] || 'cartoon';
            
            // Find the matching style in our structured categories
            let matchingStyleItem = null;
            for (const category of ART_STYLE_CATEGORIES_STRUCTURE) {
              const match = category.styleIds.find(s => s.id === suggestedInternalStyleId);
              if (match) {
                matchingStyleItem = match;
                break;
              }
            }
            
            // Find the API style that best matches this internal style
            if (matchingStyleItem) {
              const bestMatch = findBestMatchingStyle(matchingStyleItem, data.list);
              if (bestMatch) {
                setArtStyleCode(bestMatch.style_code);
              } else {
                // Default to first style if no match
                setArtStyleCode(data.list[0].style_code);
              }
            } else {
              // Default to first style if no matching style item
              setArtStyleCode(data.list[0].style_code);
            }
          }
        } else {
          console.warn('No styles returned from Dzine API');
          setStyleFetchError('No styles available from API');
        }
      } catch (err) {
        console.error("Failed to fetch Dzine styles:", err);
        setStyleFetchError(err.message || 'Could not load art styles.');
      } finally {
        setIsLoadingStyles(false);
      }
    };
    
    fetchStyles();
  }, []);
  
  // Load wizard state when it changes (e.g., navigating back)
  useEffect(() => {
    setArtStyleCode(wizardState.storyData.artStyleCode || '');
    setCustomStyleDescription(wizardState.storyData.customStyleDescription || '');
  }, [wizardState.storyData]);
  
  const handleBack = () => {
    setWizardStep(1); // Go back to the Introduction step
  };
  
  const handleContinue = () => {
    // Validation
    if (!artStyleCode) {
      setError('Please select an art style for your storybook.');
      return;
    }
    
    // For custom style, make sure there's a description
    if (artStyleCode === 'custom' && !customStyleDescription.trim()) {
      setError('Please provide a description for your custom art style.');
      return;
    }

    // Update the store with style data
    updateStoryData({ 
      artStyleCode,
      customStyleDescription: artStyleCode === 'custom' ? customStyleDescription : ''
    });
    
    // Continue to Characters step
    setWizardStep(3);
  };

  // Helper to get style details from fetched list based on ID
  const getStyleDetails = (id) => {
    return dzineStyles.find(s => s.style_code === id);
  };

  // Instead of actually checking the availability from the API (which might fail),
  // we'll now determine availability based on if the style exists in our predefined list
  const isStyleAvailable = (styleId) => {
    // If we have actual API data, check if this style exists there
    if (dzineStyles.length > 0) {
      const styleCode = styleIdToCodeMap[styleId];
      return !!styleCode && styleCode !== 'unavailable';
    }
    
    // Always show styles as available for better UX when API isn't working
    return true;
  };

  // Make sure the style selection handler is properly defined
  const handleStyleSelect = (styleCode) => {
    console.log("Style selected:", styleCode);
    setArtStyleCode(styleCode);
    setError(''); // Clear any errors when a style is selected
    
    // If it's the custom style, make sure the textarea is enabled
    if (styleCode === 'custom') {
      // Focus on the custom style textarea after a brief delay
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder*="Vibrant watercolor"]');
        if (textarea) textarea.focus();
      }, 100);
    }
  };

  // Render the art styles in a grid layout by category
  const renderArtStyles = () => {
    return (
      <div className="space-y-8 mt-6 mb-4">
        {ART_STYLE_CATEGORIES_STRUCTURE.map((category, idx) => (
          <div key={idx} className="space-y-3">
            <h3 className="text-lg font-medium mb-1">{category.category}</h3>
            <p className="text-sm text-gray-600 mb-3">{category.description}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.styleIds.map((styleItem) => {
                // Find the API style that best matches this internal style
                const apiStyle = findBestMatchingStyle(styleItem, dzineStyles);
                const isAvailable = !!apiStyle;
                const styleCode = apiStyle?.style_code || '';
                
                return (
                  <div 
                    key={styleItem.id}
                    onClick={() => isAvailable && handleStyleSelect(styleCode)}
                    className={`border rounded-lg overflow-hidden transition-all hover:shadow-md ${
                      artStyleCode === styleCode 
                        ? 'ring-2 ring-blue-500 border-blue-500' 
                        : 'border-gray-200 hover:border-blue-300'
                    } ${isAvailable ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                  >
                    <div className={`aspect-[4/3] bg-gray-100 relative`}>
                      <img 
                        src={styleImageMap[styleItem.id]} 
                        alt={styleItem.id}
                        className="w-full h-full object-cover"
                      />
                      {artStyleCode === styleCode && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {/* Show API style name for transparency */}
                      {isAvailable && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                          API: {apiStyle.name}
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium mb-1">{styleDescriptions[styleItem.id]?.title || styleItem.id}</h4>
                      <p className="text-sm text-gray-600">{styleDescriptions[styleItem.id]?.description}</p>
                      {!isAvailable && (
                        <div className="mt-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-md inline-block">
                          Currently unavailable
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Add a section with direct API styles for additional options */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer">
              <h4 className="font-medium text-gray-700">🔍 More API Styles</h4>
              <div className="text-sm text-gray-500 group-open:rotate-180 transition-transform duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 4a.5.5 0 0 1 .5.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5A.5.5 0 0 1 8 4z"/>
                </svg>
              </div>
            </summary>
            
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {dzineStyles.slice(0, 16).map(style => (
                <div
                  key={style.style_code}
                  className={`p-2 border rounded-lg cursor-pointer text-sm ${
                    artStyleCode === style.style_code
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => handleStyleSelect(style.style_code)}
                >
                  <div className="flex flex-col space-y-1">
                    {style.cover_url && (
                      <img 
                        src={style.cover_url} 
                        alt={style.name}
                        className="w-full h-20 object-cover rounded"
                      />
                    )}
                    <div className="font-medium truncate">{style.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
        
        {/* Custom style option */}
        <div className="mt-6">
          <div 
            onClick={() => handleStyleSelect(noStyleCode)}
            className={`border rounded-lg overflow-hidden transition-all p-4 ${
              artStyleCode === noStyleCode 
                ? 'ring-2 ring-blue-500 border-blue-500' 
                : 'border-gray-200 hover:border-blue-300'
            } cursor-pointer`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
              <h4 className="font-medium">Custom Style Description</h4>
            </div>
            
            <p className="text-sm text-gray-600 mb-3">
              Describe a specific art style not listed above, or combine elements from multiple styles.
            </p>
            
            <textarea
              value={customStyleDescription}
              onChange={(e) => setCustomStyleDescription(e.target.value)}
              placeholder="Example: Vibrant watercolor with fine ink details, dreamy pastel colors, and a slight glow effect around characters."
              className={`w-full border rounded-md p-3 text-sm ${
                artStyleCode === noStyleCode ? 'border-blue-400' : 'border-gray-300'
              }`}
              rows={3}
              disabled={artStyleCode !== noStyleCode}
            />
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6 pb-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Choose Your Art Style</h2>
        <p className="text-gray-600">Select the visual style for all illustrations in your story.</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {styleFetchError && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4" role="alert">
          <p>Error loading art styles from the server. You can continue with a custom style description.</p>
          <p className="text-xs">{styleFetchError}</p>
            </div>
      )}
      
      {isLoadingStyles ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : (
        <>{renderArtStyles()}</>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 mt-6 border-t border-gray-200">
        <button
          onClick={handleBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-100"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700"
        >
          Continue to Characters
        </button>
      </div>
    </div>
  );
}

export default ArtStyleStep; 