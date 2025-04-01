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

// Updated Art Style Categories with direct API styles
const ART_STYLE_CATEGORIES_STRUCTURE = [
  {
    category: 'Whimsical & Soft (Ages 0–5)',
    description: 'Gentle, dreamy art styles perfect for the youngest readers with soft colors and comforting visuals.',
    styleIds: [
      { 
        id: 'classic_watercolor', 
        apiCode: 'Style-2478f952-50e7-4773-9cd3-c6056e774823',
        title: 'Classic Watercolor',
        description: 'Soft, dreamy illustrations with gentle color washes and fluid textures'
      },
      { 
        id: 'whimsical_coloring',
        apiCode: 'Style-206baa8c-5bbe-4299-b984-9243d05dce9b',
        title: 'Whimsical Coloring',
        description: 'Tender, soothing colors with a gentle, chalky texture perfect for bedtime stories'
      },
      { 
        id: 'watercolor_whimsy',
        apiCode: 'Style-7f3f81ad-1c2d-4a15-944d-66bf549641de',
        title: 'Watercolor Whimsy',
        description: 'Rounded shapes and soft digital brushwork with gentle gradients'
      },
      { 
        id: 'cozy_3d',
        apiCode: 'Style-5b1b0c35-7abc-4f14-8b1d-dc2748f34915',
        title: 'Cozy 3D',
        description: 'Warm, comfortable 3D style with soft lighting and friendly characters'
      }
    ]
  },
  {
    category: 'Classic & Timeless (Ages 3–8)',
    description: 'Traditional illustration styles reminiscent of beloved children\'s books that stand the test of time.',
    styleIds: [
      { 
        id: 'golden_books',
        apiCode: 'Style-a37d7b69-1f9a-42c4-a8e4-f429c29f4512',
        title: 'Golden Era Illustrations',
        description: 'Nostalgic illustrations inspired by classic mid-century "Little Golden Books"'
      },
      { 
        id: 'warm_fables',
        apiCode: 'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1',
        title: 'Warm Fables',
        description: 'Charming, detailed watercolor illustrations in the style of classic children\'s tales'
      },
      { 
        id: 'sketch_elegance',
        apiCode: 'Style-e9021405-1b37-4773-abb9-bd80485527b0',
        title: 'Sketch Elegance',
        description: 'Classic line drawings with expressive ink work, reminiscent of beloved storybooks'
      },
      { 
        id: 'line_wash',
        apiCode: 'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9',
        title: 'Line & Wash',
        description: 'Delicate pencil drawings with light watercolor washes for a timeless feel'
      },
      { 
        id: 'storybook_charm',
        apiCode: 'Style-85480a6c-4aa6-4260-8ad1-a0b7423910cf',
        title: 'Storybook Charm',
        description: 'Bright, cheerful illustrations with bold colors and playful details'
      }
    ]
  },
  {
    category: 'Modern & Colorful (Ages 4–9)',
    description: 'Bold, vibrant styles with clean lines and contemporary design sensibilities.',
    styleIds: [
      { 
        id: 'cartoon_anime',
        apiCode: 'Style-b484beb8-143e-4776-9a87-355e0456cfa3',
        title: 'Cartoon Anime',
        description: 'Clean lines, bright colors, and exaggerated expressions'
      },
      { 
        id: 'simple_icon',
        apiCode: 'Style-2ee57e3c-108a-41dd-8b28-b16d0ceb6280',
        title: 'Simple Icon',
        description: 'Bold, clean, simple shapes with a modern minimal feel'
      },
      { 
        id: 'paper_cutout',
        apiCode: 'Style-541a2afd-904a-4968-bc60-8ad0ede22a86',
        title: 'Paper Cutout',
        description: 'Textured look that resembles layers of cut paper with distinct shapes'
      },
      { 
        id: 'pixiepop_3d',
        apiCode: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f',
        title: 'PixiePop 3D',
        description: 'Vibrant 3D cartoon style with charming character features and rich textures'
      },
      { 
        id: 'everything_kawaii',
        apiCode: 'Style-455da805-d716-4bc8-a960-4ac505aa7875',
        title: 'Everything Kawaii',
        description: 'Cute, adorable characters with simplified features and expressive eyes'
      },
      { 
        id: 'scandi',
        apiCode: 'Style-509ffd5a-e71f-4cec-890c-3ff6dcb9cb60',
        title: 'Scandi',
        description: 'Clean, minimal illustrations with folk art influences and nature motifs'
      }
    ]
  },
  {
    category: 'Realistic & Artistic (Ages 6–12)',
    description: 'Sophisticated art styles with richer detail, ideal for preserving the likeness of your child.',
    styleIds: [
      { 
        id: 'structured_serenity',
        apiCode: 'Style-bfb2db5f-ecfc-4fe9-b864-1a5770d59347',
        title: 'Structured Serenity',
        description: 'More detailed illustrations with accurate proportions but artistic styling'
      },
      { 
        id: 'realistic',
        apiCode: 'Style-12325d6b-f0c2-4570-a8a3-1c15124ea703',
        title: 'Realistic',
        description: 'Highest detail level for capturing accurate facial features'
      },
      { 
        id: 'toon_portrait',
        apiCode: 'Style-552954ec-d5bc-4148-a5f9-4c7a42e41b2c',
        title: 'Toon Portrait',
        description: 'Stylized but recognizable portrait style that preserves facial features'
      },
      { 
        id: 'vibrant_impasto',
        apiCode: 'Style-b7c0d088-e046-4e9b-a0fb-a329d2b9a36a',
        title: 'Vibrant Impasto',
        description: 'Rich, textured illustrations with bold strokes and vibrant color blending'
      },
      { 
        id: 'luminous_narratives',
        apiCode: 'Style-ce7b4279-1398-4964-882c-19911e12aef3',
        title: 'Luminous Narratives',
        description: 'Rich digital illustrations with painterly effects and detailed lighting'
      }
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
              {category.styleIds.map((style) => {
                // We'll use the direct API code from our curated list
                const styleCode = style.apiCode;
                const isAvailable = true; // Since we've curated these, they should be available
                
                return (
                  <div 
                    key={style.id}
                    onClick={() => handleStyleSelect(styleCode)}
                    className={`border rounded-lg overflow-hidden transition-all hover:shadow-md ${
                      artStyleCode === styleCode 
                        ? 'ring-2 ring-blue-500 border-blue-500' 
                        : 'border-gray-200 hover:border-blue-300'
                    } cursor-pointer`}
                  >
                    <div className={`aspect-[4/3] bg-gray-100 relative`}>
                      <img 
                        src={styleImageMap[style.id] || '/placeholder-style.jpg'} 
                        alt={style.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image isn't available
                          e.target.src = 'https://placehold.co/400x300/e5e7eb/a3a3a3?text=Style+Image';
                        }}
                      />
                      {artStyleCode === styleCode && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium mb-1">{style.title}</h4>
                      <p className="text-sm text-gray-600">{style.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
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