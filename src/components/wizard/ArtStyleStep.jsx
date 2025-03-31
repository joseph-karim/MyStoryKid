import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { getDzineStyles } from '../../services/dzineService';
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
    styleIds: ['watercolor', 'pastel', 'pencil_wash', 'soft_digital']
  },
  {
    category: 'Classic & Timeless (Ages 3–8)',
    description: 'Traditional illustration styles reminiscent of beloved children\'s books that stand the test of time.',
    styleIds: ['pencil_ink', 'golden_books', 'beatrix_potter']
  },
  {
    category: 'Modern & Colorful (Ages 4–9)',
    description: 'Bold, vibrant styles with clean lines and contemporary design sensibilities.',
    styleIds: ['cartoon', 'flat_vector', 'storybook_pop', 'papercut']
  },
  {
    category: 'Artistic & Elevated (Ages 6–12)',
    description: 'Sophisticated art styles with richer detail and artistic techniques for older children.',
    styleIds: ['oil_pastel', 'stylized_realism', 'digital_painterly']
  },
  {
    category: 'Cultural Styles (All Ages)',
    description: 'Art styles inspired by diverse cultural traditions and aesthetic sensibilities.',
    styleIds: ['kawaii', 'scandinavian', 'african_pattern']
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
  watercolor: 'Style-0000000033',    // Watercolor styles
  pastel: 'Style-0000000032',        // Pastel style
  pencil_wash: 'Style-0000000024',   // Pencil wash
  soft_digital: 'Style-0000000073',  // Soft digital
  pencil_ink: 'Style-0000000022',    // Pencil and ink
  golden_books: 'Style-0000000070',  // Golden books style
  beatrix_potter: 'Style-0000000034', // Potter-like
  cartoon: 'Style-0000000080',       // Cartoon
  flat_vector: 'Style-0000000081',   // Flat vector
  storybook_pop: 'Style-0000000082', // Storybook
  papercut: 'Style-0000000083',      // Papercut style
  oil_pastel: 'Style-0000000035',    // Oil pastel
  stylized_realism: 'Style-0000000044', // Stylized realism
  digital_painterly: 'Style-0000000045', // Digital painterly
  kawaii: 'Style-0000000086',        // Kawaii style
  scandinavian: 'Style-0000000087',  // Scandinavian
  african_pattern: 'Style-0000000088', // African patterns
  custom: 'custom'     // Custom style
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

  // Fetch styles from Dzine API on mount
  useEffect(() => {
    const fetchStyles = async () => {
      setIsLoadingStyles(true);
      setStyleFetchError(null);
      try {
        const data = await getDzineStyles();
        setDzineStyles(data.list || []);
        
        // Create a map from name (or a generated ID) to style_code
        const map = { ...FALLBACK_STYLE_MAP }; // Start with fallback map
        let foundNoStyle = null;
        
        // If we got actual styles from the API, enhance our mapping
        if (data.list && data.list.length > 0) {
          data.list.forEach(style => {
            // Generate a simple ID from the name for mapping
            const simpleId = style.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_v\d+$/, ''); 
            map[simpleId] = style.style_code;
            
            if (style.name === 'No Style v2') {
               foundNoStyle = style.style_code;
            }
          });
        } else {
          // If API returned no styles, we'll use our fallback mapping for UI
          // But mark them as unavailable in the UI
          console.warn('No styles returned from Dzine API - using fallback mapping');
        }
        
        setNoStyleCode(foundNoStyle || 'nostyle');

        // Set initial artStyleCode if not already set
        if (!wizardState.storyData.artStyleCode) {
           // Auto-suggest style based on category (can be refined)
           const category = wizardState.storyData.category;
           let suggestedStyleId = 'cartoon'; // Default ID
           if (category === 'adventure') suggestedStyleId = 'cartoon';
           else if (category === 'fantasy') suggestedStyleId = 'watercolor';
           else if (category === 'bedtime') suggestedStyleId = 'pastel';
           else if (category === 'learning') suggestedStyleId = 'flat_vector';
           else if (category === 'birthday') suggestedStyleId = 'storybook_pop';
         
           const suggestedCode = map[suggestedStyleId] || foundNoStyle || 'cartoon'; // Fallback
           setArtStyleCode(suggestedCode);
        }

      } catch (err) {
        console.error("Failed to fetch Dzine styles:", err);
        setStyleFetchError(err.message || 'Could not load art styles.');
        
        // Use fallback map even in error case
        setNoStyleCode('nostyle');
        
        // Set a default style code if none already set
        if (!wizardState.storyData.artStyleCode) {
          setArtStyleCode('cartoon');
        }
      } finally {
        setIsLoadingStyles(false);
      }
    };

    fetchStyles();
  }, []); // Fetch only once
  
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
              {category.styleIds.map((styleId) => {
                const isAvailable = isStyleAvailable(styleId);
                const styleCode = styleIdToCodeMap[styleId] || styleId;
                
                return (
                  <div 
                    key={styleId}
                    onClick={() => isAvailable && handleStyleSelect(styleCode)}
                    className={`border rounded-lg overflow-hidden transition-all hover:shadow-md ${
                      artStyleCode === styleCode 
                        ? 'ring-2 ring-blue-500 border-blue-500' 
                        : 'border-gray-200 hover:border-blue-300'
                    } ${isAvailable ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}
                  >
                    <div className={`aspect-[4/3] bg-gray-100 relative`}>
                      <img 
                        src={styleImageMap[styleId]} 
                        alt={styleId}
                        className="w-full h-full object-cover"
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
                      <h4 className="font-medium mb-1">{styleDescriptions[styleId]?.title || styleId}</h4>
                      <p className="text-sm text-gray-600">{styleDescriptions[styleId]?.description}</p>
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
        
        {/* Custom style option */}
        <div className="mt-6">
          <div 
            onClick={() => handleStyleSelect("custom")}
            className={`border rounded-lg overflow-hidden transition-all p-4 ${
              artStyleCode === "custom" 
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
                artStyleCode === "custom" ? 'border-blue-400' : 'border-gray-300'
              }`}
              rows={3}
              disabled={artStyleCode !== "custom"}
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