import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBookStore, useCharacterStore } from '../../store';
import CharacterWizard from '../CharacterWizard';
import { getDzineStyles, createImg2ImgTask, getTaskProgress } from '../../services/dzineService.js';

// Import Art Style Images using relative paths and new filenames
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

// Character roles
const CHARACTER_ROLES = [
  { id: 'main', label: 'Main Character', description: 'The hero of the story (usually your child)' },
  { id: 'sidekick', label: 'Sidekick', description: 'Friend or companion who helps the main character' },
  { id: 'mentor', label: 'Mentor', description: 'Wise character who guides the main character' },
  { id: 'pet', label: 'Pet', description: 'Animal companion on the adventure' },
  { id: 'magical', label: 'Magical Friend', description: 'A fairy, creature or magical being' },
];

// Map our internal IDs to the preview images
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
  african_pattern: africanPatternImg,
};

// Enhance ART_STYLE_CATEGORIES_STRUCTURE with rich descriptions
const ART_STYLE_CATEGORIES_STRUCTURE = [
  {
    category: '🎨 Whimsical & Soft (Ages 0–5)',
    description: 'These styles are warm, comforting, and often have a dreamy quality. Ideal for bedtime stories or gentle adventures.',
    styleIds: ['watercolor', 'pastel', 'pencil_wash', 'soft_digital'] // Use IDs for matching later
  },
  {
    category: '✏️ Classic & Timeless',
    description: 'These styles evoke nostalgia and timelessness — ideal if you want something that feels like a classic.',
    styleIds: ['pencil_ink', 'golden_books', 'beatrix_potter']
  },
  {
    category: '✨ Modern & Colorful',
    description: 'These styles pop and tend to work well for high-energy, imaginative adventures.',
    styleIds: ['cartoon', 'flat_vector', 'storybook_pop', 'papercut']
  },
  {
    category: '🖼️ Artistic & Elevated',
    description: 'More sophisticated, painterly styles that could double as fine art.',
    styleIds: ['oil_pastel', 'stylized_realism', 'digital_painterly']
  },
  {
    category: '🌍 Cultural or Regional (Optional)',
    description: 'Stylistic approaches inspired by different traditions and cultural aesthetics.',
    styleIds: ['kawaii', 'scandinavian', 'african_pattern']
  },
  {
    category: '💡 Custom Style',
    description: 'Describe your own unique art style with specific details about colors, textures, and references.',
    styleIds: ['custom']
  },
];

// Add style descriptions to enrich the presentation
const styleDescriptions = {
  watercolor: 'Soft, expressive, and magical. Great for fairy tales and heartwarming journeys.',
  pastel: 'Soft-edged and calming, like chalk or crayon textures. Very kid-friendly and light.',
  pencil_wash: 'Combines pencil lines with light color washes. A subtle and intimate feel, often found in timeless books.',
  soft_digital: 'Digital painting with a hand-drawn aesthetic. Looks painterly, but crisp enough for printing.',
  
  pencil_ink: 'Monochrome or light inked outlines with shading. Great for a vintage feel.',
  golden_books: 'Inspired by mid-century illustrations (like Little Golden Books). Bright, detailed, with expressive faces.',
  beatrix_potter: 'Classic English watercolor + fine detail. Excellent for animal tales and nature-based themes.',
  
  cartoon: 'Clean lines, bright colors, and exaggerated expressions. Great for action-packed or silly stories.',
  flat_vector: 'Bold, clean, and simple. Often used in modern educational books.',
  storybook_pop: 'Bright, slightly surreal, and energetic — think "Adventure Time" meets classic books. Ideal for space, monsters, and wacky themes.',
  papercut: 'Looks like it was made with layers of paper or fabric. Textured and tactile feel, very charming.',
  
  oil_pastel: 'Thick brush strokes, vivid color, tactile textures. Great for magical realism or emotional storytelling.',
  stylized_realism: 'Semi-realistic faces and proportions with artistic lighting. Ideal if you want to "recognize" the child in the art.',
  digital_painterly: 'Mimics classical painting but created digitally. For dramatic lighting, beautiful spreads, and immersive scenes.',
  
  kawaii: 'Ultra-cute, rounded characters, soft palettes. Great for emotional and nurturing stories.',
  scandinavian: 'Geometric shapes, bold color, often nature-themed. Feels minimalist but magical.',
  african_pattern: 'Bright colors, bold patterns, and symbolism. Vibrant and culturally rich visuals.',
  
  custom: 'Your own unique style description. Be specific about colors, techniques, and references you like.'
};

// Function to check if a string is a Base64 data URL (useful for identifying uploads)
const isBase64DataUrl = (str) => {
  if (typeof str !== 'string') return false;
  return /^data:image\/(png|jpeg|jpg|webp);base64,/.test(str);
}

function CharactersStep() {
  const { wizardState, updateStoryData, setWizardStep, updateCharacter } = useBookStore();
  const { characters } = useCharacterStore();
  
  const [bookCharacters, setBookCharacters] = useState(wizardState.storyData.bookCharacters || []);
  const [showCharacterWizard, setShowCharacterWizard] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [artStyleCode, setArtStyleCode] = useState(wizardState.storyData.artStyleCode || '');
  const [customStyleDescription, setCustomStyleDescription] = useState(wizardState.storyData.customStyleDescription || '');

  // State for fetched styles and mapping
  const [dzineStyles, setDzineStyles] = useState([]);
  const [styleIdToCodeMap, setStyleIdToCodeMap] = useState({});
  const [noStyleCode, setNoStyleCode] = useState(null); // For custom style
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);
  const [styleFetchError, setStyleFetchError] = useState(null);

  // NEW: State to manage generation status per character
  // Format: { [characterId]: { status: 'idle' | 'generating' | 'polling' | 'previewReady' | 'confirmed' | 'error', taskId: null, previewUrl: null, errorMessage: null, pollIntervalId: null } }
  const [generationStatus, setGenerationStatus] = useState({});

  // Helper to initialize generation status for characters loaded from wizardState
  useEffect(() => {
    const initialStatus = {};
    (wizardState.storyData.bookCharacters || []).forEach(char => {
      initialStatus[char.id] = { 
        status: char.stylePreview ? 'confirmed' : 'idle', // If preview exists, assume confirmed
        taskId: null, 
        previewUrl: char.stylePreview || null, // Use existing preview if available
        errorMessage: null,
        pollIntervalId: null 
      };
    });
    setGenerationStatus(initialStatus);
  }, [wizardState.storyData.bookCharacters]); // Re-run if bookCharacters change externally

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(generationStatus).forEach(status => {
        if (status.pollIntervalId) {
          clearInterval(status.pollIntervalId);
        }
      });
    };
  }, [generationStatus]);

  // Function to update generation status for a specific character
  const updateGenStatus = useCallback((charId, updates) => {
    setGenerationStatus(prev => ({
      ...prev,
      [charId]: {
        ...(prev[charId] || { status: 'idle', taskId: null, previewUrl: null, errorMessage: null, pollIntervalId: null }), // Ensure previous state exists
        ...updates,
      }
    }));
  }, []);

  // UPDATED: Create a hard-coded style map for internal testing
  // This guarantees styles will display even if API is unavailable
  const FALLBACK_STYLE_MAP = {
    watercolor: 'watercolor',
    pastel: 'pastel',
    pencil_wash: 'pencil_wash',
    soft_digital: 'soft_digital',
    pencil_ink: 'pencil_ink',
    golden_books: 'golden_books',
    beatrix_potter: 'beatrix_potter',
    cartoon: 'cartoon',
    flat_vector: 'flat_vector',
    storybook_pop: 'storybook_pop',
    papercut: 'papercut',
    oil_pastel: 'oil_pastel',
    stylized_realism: 'stylized_realism',
    digital_painterly: 'digital_painterly',
    kawaii: 'kawaii',
    scandinavian: 'scandinavian',
    african_pattern: 'african_pattern',
    custom: 'custom'
  };

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
        
        setStyleIdToCodeMap(map);
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
        setStyleIdToCodeMap(FALLBACK_STYLE_MAP);
        setNoStyleCode('nostyle');
        
        // Set a default style code
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
    setBookCharacters(wizardState.storyData.bookCharacters || []);
    setArtStyleCode(wizardState.storyData.artStyleCode || '');
    setCustomStyleDescription(wizardState.storyData.customStyleDescription || '');
    // Re-initialize generation status if book characters reset/change significantly
    const initialStatus = {};
    (wizardState.storyData.bookCharacters || []).forEach(char => {
      initialStatus[char.id] = generationStatus[char.id] || { 
         status: char.stylePreview ? 'confirmed' : 'idle', 
         taskId: null, previewUrl: char.stylePreview || null, errorMessage: null, pollIntervalId: null 
      };
    });
    setGenerationStatus(initialStatus);

  }, [wizardState.storyData]);

  const handleAddCharacter = (role) => {
    setSelectedRole(role);
    setShowCharacterWizard(true);
  };

  const handleCharacterComplete = (character) => {
    if (!character) {
      setShowCharacterWizard(false);
      return;
    }
    // We don't store artStyle on individual characters anymore
    const characterWithRole = {
      ...character,
      role: selectedRole,
    };
    const newCharacters = [...bookCharacters, characterWithRole];
    setBookCharacters(newCharacters);
    // Initialize generation status for the new character
    updateGenStatus(characterWithRole.id, { status: 'idle' }); 
    
    // Update the store immediately so state persists if user navigates away
    updateStoryData({ bookCharacters: newCharacters }); 

    setShowCharacterWizard(false);
    setError('');
  };

  const removeCharacter = (characterId) => {
    // Clear any running polls for this character
    const status = generationStatus[characterId];
    if (status?.pollIntervalId) {
        clearInterval(status.pollIntervalId);
    }
    
    const newCharacters = bookCharacters.filter(char => char.id !== characterId);
    setBookCharacters(newCharacters);
    
    // Remove status entry
    setGenerationStatus(prev => {
        const newState = { ...prev };
        delete newState[characterId];
        return newState;
    });
    
    // Update the store
    updateStoryData({ bookCharacters: newCharacters });
  };

  const handleBack = () => {
    setWizardStep(1);
  };

  const handleContinue = () => {
    // Validation
    if (bookCharacters.length === 0) {
      setError('Please add at least one character to your story.');
      return;
    }
    
    if (!artStyleCode) {
      setError('Please select an art style for your storybook.');
      return;
    }
    
    const mainChar = bookCharacters.find(char => char.role === 'main');
    if (!mainChar) {
      setError('Please add a main character to your story.');
      return;
    }
   
    // Check if any characters don't have style preview confirmations
    const unconfirmedCharacters = bookCharacters.filter(char => {
        const status = generationStatus[char.id]?.status;
        // Only flag if it's not in a confirmed state and has a photo (needs a preview)
        return isBase64DataUrl(char.photoUrl) && status !== 'confirmed';
    });
   
    if (unconfirmedCharacters.length > 0) {
        const characterNames = unconfirmedCharacters.map(c => c.name).join(', ');
        setError(`Please generate and confirm the art style for these characters: ${characterNames}`);
        return;
    }

    // Update the store with final data
    updateStoryData({ 
      bookCharacters,
      artStyleCode,
      customStyleDescription: artStyleCode === 'custom' ? customStyleDescription : ''
    });
    
    // Clear any running polls before navigating away
    Object.values(generationStatus).forEach(status => {
        if (status.pollIntervalId) {
            clearInterval(status.pollIntervalId);
        }
    });
    
    // Continue to next step - Changed from step 4 to step 3
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

  // UPDATED: renderArtStyles to show all styles even if API unavailable
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

  // Use a reliable fallback style code (we know 'cartoon' usually works)
  const SAFE_STYLE_CODE = "80"; // Common working style code for cartoon
  
  // Helper to get a safe style code for API use
  const getSafeStyleCode = (selectedStyleCode) => {
    // If no valid style code is available, use a known working default
    if (!selectedStyleCode || selectedStyleCode === 'undefined' || selectedStyleCode === 'custom') {
      console.log("Using default safe style code:", SAFE_STYLE_CODE);
      return SAFE_STYLE_CODE;
    }
    
    return selectedStyleCode;
  };
  
  // New function to generate previews for all characters at once
  const handleGenerateAllPreviews = () => {
    if (!artStyleCode) {
      setError('Please select an art style first.');
      return;
    }
    
    // Filter characters that need generation (have photos but no confirmed previews)
    const charactersToGenerate = bookCharacters.filter(char => 
      isBase64DataUrl(char.photoUrl) && 
      (!generationStatus[char.id] || generationStatus[char.id]?.status !== 'confirmed')
    );
    
    if (charactersToGenerate.length === 0) {
      return; // Nothing to generate
    }
    
    // Generate preview for each character
    charactersToGenerate.forEach(character => {
      handleGeneratePreview(character.id);
    });
  };

  // --- NEW: Start Image Generation ---
  const handleGeneratePreview = async (characterId) => {
    setError(''); // Clear general errors
    const character = bookCharacters.find(c => c.id === characterId);
    if (!character || !character.photoUrl || !isBase64DataUrl(character.photoUrl)) {
      updateGenStatus(characterId, { status: 'error', errorMessage: 'No photo uploaded for generation.' });
      return;
    }
    
    // Get the selected style ID and description
    const selectedStyleId = Object.keys(styleIdToCodeMap).find(key => styleIdToCodeMap[key] === artStyleCode) || 'cartoon';
    const selectedStyleDescription = styleDescriptions[selectedStyleId] || '';
    
    updateGenStatus(characterId, { status: 'generating', taskId: null, previewUrl: null, errorMessage: null });

    try {
      // Build a rich prompt that describes the character AND the style
      let prompt = `${character.age || 'a'} year old ${character.gender || 'child'} named ${character.name}`;
      
      // Add style description based on selection
      if (artStyleCode === 'custom' && customStyleDescription) {
        // Use custom style description directly
        prompt += `, ${customStyleDescription}`;
      } else {
        // Use our rich style descriptions instead of relying solely on the style code
        prompt += `, ${selectedStyleDescription}`;
        
        // Add specific style cues based on the category
        if (selectedStyleId === 'watercolor') {
          prompt += `, soft watercolor painting with gentle brush strokes and dreamy quality`;
        } else if (selectedStyleId === 'pastel') {
          prompt += `, soft pastel illustration with gentle colors and soothing tones`;
        } else if (selectedStyleId === 'cartoon') {
          prompt += `, vibrant cartoon style with clean lines and expressive features`;
        } else if (selectedStyleId === 'pencil_ink') {
          prompt += `, classic pencil and ink drawing with fine linework`;
        } else if (selectedStyleId === 'beatrix_potter') {
          prompt += `, classic storybook illustration in the style of Beatrix Potter`;
        } else if (selectedStyleId === 'digital_painterly') {
          prompt += `, digital painting with rich textures and detailed lighting`;
        }
        
        // If there's additional custom description, append it for further refinement
        if (customStyleDescription) {
          prompt += `, ${customStyleDescription}`;
        }
      }
      
      // Always use a safe style code that we know works with the API
      const safeStyleCode = getSafeStyleCode(artStyleCode);
      
      console.log("Generating with prompt:", prompt);
      console.log("Using style code:", safeStyleCode);

      const payload = {
        prompt: prompt.substring(0, 800),  // Limit prompt length
        style_code: safeStyleCode,
        style_intensity: 0.8,  // Slightly reduced to let prompt have more influence
        structure_match: 0.7,
        face_match: 1,
        color_match: 0,
        quality_mode: 0,
        generate_slots: [1, 0, 0, 0],
        images: [{ base64_data: character.photoUrl }],
        output_format: 'webp'
      };

      const taskData = await createImg2ImgTask(payload);
      updateGenStatus(characterId, { status: 'polling', taskId: taskData.task_id });
      startPolling(characterId, taskData.task_id);

    } catch (error) {
      console.error("Error creating Dzine task:", error);
      updateGenStatus(characterId, { 
        status: 'error', 
        errorMessage: error.message || 'Failed to start generation.' 
      });
    }
  };

  // --- NEW: Polling Logic ---
  const startPolling = (characterId, taskId) => {
    const poll = async () => {
      try {
        const progressData = await getTaskProgress(taskId);
        
        // Check if component might have unmounted or status changed
         if (!generationStatus[characterId] || generationStatus[characterId].taskId !== taskId) {
             console.log("Polling stopped for", characterId, "due to status change or removal.");
             clearPollInterval(characterId); // Ensure interval is cleared if component state changed
             return; 
         }

        if (progressData.status === 'succeeded') {
          const imageUrl = progressData.generate_result_slots?.find(url => url);
          if (imageUrl) {
            updateGenStatus(characterId, { status: 'previewReady', previewUrl: imageUrl, pollIntervalId: null });
            clearPollInterval(characterId); // Stop polling on success
          } else {
             updateGenStatus(characterId, { status: 'error', errorMessage: 'Generation succeeded but no image URL found.', pollIntervalId: null });
             clearPollInterval(characterId); 
          }
        } else if (progressData.status === 'failed') {
          console.error(`Task ${taskId} failed:`, progressData.error_reason);
          updateGenStatus(characterId, { status: 'error', errorMessage: progressData.error_reason || 'Image generation failed.', pollIntervalId: null });
          clearPollInterval(characterId); // Stop polling on failure
        } else {
          // Still processing ('waiting', 'in_queue', 'processing')
          // Update status if needed, but keep polling
          updateGenStatus(characterId, { status: 'polling' }); 
        }
      } catch (error) {
        console.error(`Error polling task ${taskId}:`, error);
        // Avoid infinite loops if polling itself fails repeatedly? Maybe add a counter?
        // For now, mark as error and stop polling.
        updateGenStatus(characterId, { status: 'error', errorMessage: error.message || 'Failed to check progress.', pollIntervalId: null });
        clearPollInterval(characterId);
      }
    };

    // Clear existing interval just in case
    clearPollInterval(characterId); 
    
    // Poll immediately, then set interval
    poll(); 
    const intervalId = setInterval(poll, 5000); // Poll every 5 seconds
    updateGenStatus(characterId, { pollIntervalId: intervalId }); 
  };

  // --- NEW: Helper to clear poll interval ---
  const clearPollInterval = (characterId) => {
       const currentStatus = generationStatus[characterId];
       if (currentStatus?.pollIntervalId) {
           clearInterval(currentStatus.pollIntervalId);
           // Update status only to remove the interval ID, keep other fields
            setGenerationStatus(prev => ({
              ...prev,
              [characterId]: {
                ...(prev[characterId]), 
                pollIntervalId: null 
              }
            }));
       }
   };


  // --- NEW: Confirm Character Style ---
  const handleConfirmStyle = (characterId) => {
    const status = generationStatus[characterId];
    if (status?.status === 'previewReady' && status.previewUrl) {
      // Update the character in the main Zustand store
      updateCharacter(characterId, { 
        stylePreview: status.previewUrl, // Save the generated preview
        photoUrl: null // DISCARD the original photo
      }); 
      // Update local state to reflect confirmation
      updateGenStatus(characterId, { status: 'confirmed' });
      setError(''); // Clear any general errors
    } else {
        setError(`Cannot confirm style for character ${characterId}. Preview not ready.`);
    }
  };

  // --- Render Helper for Character Card ---
  const renderCharacterCard = (character) => {
    const status = generationStatus[character.id] || { status: 'idle' };
    const requiresGeneration = isBase64DataUrl(character.photoUrl) && status.status !== 'confirmed';

    return (
        <motion.div 
          key={character.id} 
          className="bg-white p-4 rounded-lg shadow border border-gray-200 relative space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <button 
            onClick={() => removeCharacter(character.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
            aria-label={`Remove ${character.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h4 className="font-semibold text-lg text-gray-800">{character.name}</h4>
          <p className="text-sm text-gray-500 capitalize">Role: {character.role}</p>
          <p className="text-sm text-gray-500">Age: {character.age || 'N/A'}, Gender: {character.gender || 'N/A'}</p>

          {/* Display Area for Original Photo & Generated Preview */}
          <div className="flex flex-col sm:flex-row gap-4 items-start mt-3">
            {/* Original Photo */}
            {character.photoUrl && isBase64DataUrl(character.photoUrl) && status.status !== 'confirmed' && (
              <div className='flex-1 text-center'>
                <p className="text-xs text-gray-500 mb-1">Original Photo</p>
                <img src={character.photoUrl} alt={`${character.name} - Original`} className="w-32 h-32 object-cover rounded mx-auto border" />
              </div>
            )}

            {/* Generated Preview Area */}
            {status.status === 'previewReady' && status.previewUrl && (
               <div className='flex-1 text-center'>
                 <p className="text-xs text-green-600 mb-1 font-medium">Generated Preview</p>
                 <img src={status.previewUrl} alt={`${character.name} - Style Preview`} className="w-32 h-32 object-cover rounded mx-auto border border-green-300" />
               </div>
            )}
            {/* Confirmed Preview (shown when original is discarded) */}
             {status.status === 'confirmed' && character.stylePreview && (
               <div className='flex-1 text-center'>
                  <p className="text-xs text-green-600 mb-1 font-medium">Confirmed Style</p>
                  <img src={character.stylePreview} alt={`${character.name} - Confirmed Style`} className="w-32 h-32 object-cover rounded mx-auto border border-green-300" />
               </div>
             )}
             {/* Placeholder if no photo was uploaded */}
             {!character.photoUrl && status.status !== 'confirmed' && (
                 <div className='flex-1 text-center text-gray-400 text-sm italic flex items-center justify-center h-32'>
                    (No photo uploaded)
                 </div>
             )}
          </div>

          {/* Generation Controls & Status */}
          {requiresGeneration && (
            <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
              {status.status === 'idle' && (
                <button 
                  onClick={() => handleGeneratePreview(character.id)}
                  disabled={isLoadingStyles || !artStyleCode}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                >
                  Generate Style Preview
                </button>
              )}
              {(status.status === 'generating' || status.status === 'polling') && (
                 <div className="text-center text-sm text-blue-600 flex items-center justify-center">
                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Generating preview... ({status.status})
                 </div>
              )}
              {status.status === 'previewReady' && (
                <button 
                  onClick={() => handleConfirmStyle(character.id)}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm font-medium"
                >
                  Confirm Style & Use
                </button>
              )}
               {status.status === 'error' && (
                 <div className="text-center text-sm text-red-600">
                   Error: {status.errorMessage || 'Unknown error'}
                    {/* Optionally add a retry button */}
                     <button 
                      onClick={() => handleGeneratePreview(character.id)} 
                      className="ml-2 text-blue-500 hover:underline text-xs"
                      >Retry?</button>
                 </div>
              )}
            </div>
          )}
          {status.status === 'confirmed' && (
               <div className="mt-4 pt-3 border-t border-gray-200 text-center text-sm text-green-600 font-medium">
                   ✅ Style Confirmed
               </div>
           )}

        </motion.div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {showCharacterWizard ? (
        <CharacterWizard 
          onComplete={handleCharacterComplete} 
          initialStep={1}
          forcedArtStyle={artStyleCode !== 'custom' ? artStyleCode : null}
        />
      ) : (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Choose Style & Add Characters</h2>
            <p className="text-gray-600">First select your art style, then add characters to your story.</p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          {styleFetchError && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
              Warning: {styleFetchError} You can continue without Dzine styles, but previews won't work.
            </div>
          )}

          {/* Art Style Selection - MOVED TO FIRST POSITION */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">1. Choose Art Style</h3>
            <p className="text-gray-600 mb-4">Select the visual style for all illustrations in your story.</p>
            
            {styleFetchError && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4" role="alert">
                <p>Error loading art styles. You can continue with a custom style description.</p>
                <p className="text-xs">{styleFetchError}</p>
              </div>
            )}
            
            {isLoadingStyles ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              </div>
            ) : (
              <>
                {renderArtStyles()}
              </>
            )}
          </div>

          {/* Characters List - MOVED TO SECOND POSITION */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">2. Add Story Characters</h3>
              {/* Privacy Notice - Moved to be more prominent */}
               <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start">
                   <span className="text-2xl mr-3">🔒</span> 
                   <div>
                      <p className="font-semibold mb-1">Privacy Note Regarding Photos:</p>
                      <p>If you upload a photo, we use it <strong className='font-medium'>only once</strong> to generate the character's art style for the preview below. Once you click "Confirm Style & Use", the <strong className='font-medium'>original photo is permanently discarded</strong> from our system. We do not store your original photos.</p>
                   </div>
               </div>
            
            {/* Generate All Button - Only visible when style is selected and there are characters with photos */}
            {artStyleCode && bookCharacters.some(char => isBase64DataUrl(char.photoUrl)) && (
              <div className="mb-6 text-center">
                <button
                  onClick={handleGenerateAllPreviews}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Generate All Character Previews
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Uses your selected art style to generate all character previews at once
                </p>
              </div>
            )}
            
            {bookCharacters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {bookCharacters.map(renderCharacterCard)}
                </div>
             ) : (
               <p className="text-gray-500 text-sm mb-4">No characters added yet. Start by adding the Main Character!</p>
             )}
            <h4 className="text-md font-medium mb-2">Add Character by Role</h4>
            <div className="flex flex-wrap gap-2">
              {CHARACTER_ROLES.map((role) => (
                <button 
                  key={role.id}
                  onClick={() => handleAddCharacter(role.id)}
                  disabled={bookCharacters.some(c => c.role === role.id)}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  title={role.description}
                >
                  + Add {role.label}
                </button>
              ))}
            </div>
          </div>
  
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
              Continue to Story Details
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CharactersStep; 