import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBookStore, useCharacterStore } from '../../store';
import CharacterWizard from '../CharacterWizard';
import { getDzineStyles, createImg2ImgTask, getTaskProgress } from '../../services/dzineService.js';

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

// Character roles
const CHARACTER_ROLES = [
  { id: 'main', label: 'Main Character', description: 'The hero of the story (usually your child)' },
  { id: 'sidekick', label: 'Sidekick', description: 'Friend or companion who helps the main character' },
  { id: 'mentor', label: 'Mentor', description: 'Wise character who guides the main character' },
  { id: 'pet', label: 'Pet', description: 'Animal companion on the adventure' },
  { id: 'magical', label: 'Magical Friend', description: 'A fairy, creature or magical being' },
];

// Map our internal IDs to the preview images for legacy support
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

// Find any SAFE_STYLE_CODE constant and update it with the correct style code
const SAFE_STYLE_CODE = "Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2"; // No Style v2

// Helper function to get a safe style code for API use
const getSafeStyleCode = (styleCode) => {
  // If it's a valid style code, use it directly
  if (styleCode && styleCode.startsWith('Style-')) {
    return styleCode;
  }
  
  // Fallback to the safe style code
  return SAFE_STYLE_CODE;
};

// Special mapping for the warm fables style code
const WARM_FABLES_STYLE_CODE = 'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1';

// --- NEW: Helper function to get style name from API style code ---
const getStyleNameFromCode = (styleCode) => {
  if (!styleCode) return 'No Style Selected';
  
  // First check if we have a stored style name from ArtStyleStep
  try {
    const storedStyleName = localStorage.getItem('lastSelectedStyleName');
    if (storedStyleName && styleCode === WARM_FABLES_STYLE_CODE) {
      // This is the Warm Fables style code
      return storedStyleName;
    }
  } catch (e) {
    console.error("Failed to check localStorage:", e);
  }
  
  // Special case for the Warm Fables style
  if (styleCode === WARM_FABLES_STYLE_CODE) {
    return 'Warm Fables';
  }
  
  // For style codes, look up the name in the imported styles or return a default
  if (styleCode.startsWith('Style-')) {
    // Try to get the style name from localStorage as a fallback
    try {
      const allStyleNames = localStorage.getItem('styleCodeNames');
      if (allStyleNames) {
        const namesMap = JSON.parse(allStyleNames);
        if (namesMap[styleCode]) {
          return namesMap[styleCode];
        }
      }
    } catch (e) {
      console.error("Failed to check localStorage for style names:", e);
    }
    
    // If nothing works, return a generic label
    return 'API Style';
  }
  
  // It's not a style code, so it might be some legacy ID - just format it
  return styleCode.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
  watercolor: { 
    title: 'Classic Watercolor',
    description: 'Soft, expressive, and magical. Great for fairy tales and heartwarming journeys.'
  },
  pastel: { 
    title: 'Whimsical Coloring',
    description: 'Soft-edged and calming, like chalk or crayon textures. Very kid-friendly and light.'
  },
  pencil_wash: { 
    title: 'Line & Wash',
    description: 'Combines pencil lines with light color washes. A subtle and intimate feel, often found in timeless books.'
  },
  soft_digital: { 
    title: 'Watercolor Whimsy',
    description: 'Digital painting with a hand-drawn aesthetic. Looks painterly, but crisp enough for printing.'
  },
  
  pencil_ink: { 
    title: 'Sketch Elegance',
    description: 'Monochrome or light inked outlines with shading. Great for a vintage feel.'
  },
  golden_books: { 
    title: 'Golden Era Illustrations',
    description: 'Inspired by mid-century illustrations (like Little Golden Books). Bright, detailed, with expressive faces.'
  },
  beatrix_potter: { 
    title: 'Warm Fables',
    description: 'Classic English watercolor + fine detail. Excellent for animal tales and nature-based themes.'
  },
  warm_fables: { 
    title: 'Warm Fables',
    description: 'Charming, detailed watercolor illustrations in the style of classic children\'s tales'
  },
  
  cartoon: { 
    title: 'Cartoon Anime',
    description: 'Clean lines, bright colors, and exaggerated expressions. Great for action-packed or silly stories.'
  },
  flat_vector: { 
    title: 'Simple Icon',
    description: 'Bold, clean, and simple. Often used in modern educational books.'
  },
  storybook_pop: { 
    title: 'Storybook Charm',
    description: 'Bright, slightly surreal, and energetic. Ideal for space, monsters, and wacky themes.'
  },
  papercut: { 
    title: 'Paper Cutout',
    description: 'Looks like it was made with layers of paper or fabric. Textured and tactile feel, very charming.'
  },
  
  oil_pastel: { 
    title: 'Vibrant Impasto',
    description: 'Thick brush strokes, vivid color, tactile textures. Great for magical realism or emotional storytelling.'
  },
  stylized_realism: { 
    title: 'Structured Serenity',
    description: 'Semi-realistic faces and proportions with artistic lighting. Ideal if you want to "recognize" the child in the art.'
  },
  digital_painterly: { 
    title: 'Luminous Narratives',
    description: 'Mimics classical painting but created digitally. For dramatic lighting, beautiful spreads, and immersive scenes.'
  },
  
  kawaii: { 
    title: 'Everything Kawaii',
    description: 'Ultra-cute, rounded characters, soft palettes. Great for emotional and nurturing stories.'
  },
  scandinavian: { 
    title: 'Scandi',
    description: 'Geometric shapes, bold color, often nature-themed. Feels minimalist but magical.'
  },
  african_pattern: { 
    title: 'Bold Collage',
    description: 'Bright colors, bold patterns, and symbolism. Vibrant and culturally rich visuals.'
  },
  
  custom: {
    title: 'Custom Style',
    description: 'Your own unique style description. Be specific about colors, techniques, and references you like.'
  }
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
  
  // Art style is now set in the ArtStyleStep
  const artStyleCode = wizardState.storyData.artStyleCode || '';
  const customStyleDescription = wizardState.storyData.customStyleDescription || '';

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

  // Load wizard state when it changes (e.g., navigating back)
  useEffect(() => {
    setBookCharacters(wizardState.storyData.bookCharacters || []);
    
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
    // Make sure we preserve all character properties including stylePreview and artStyle
    console.log('Character from wizard with stylePreview:', character.stylePreview);
    console.log('Character from wizard with artStyle:', character.artStyle);
    
    const characterWithRole = {
      ...character,
      role: selectedRole,
    };
    
    const newCharacters = [...bookCharacters, characterWithRole];
    setBookCharacters(newCharacters);
    
    // Initialize generation status based on whether the character already has a style preview
    updateGenStatus(characterWithRole.id, { 
      status: characterWithRole.stylePreview ? 'confirmed' : 'idle',
      previewUrl: characterWithRole.stylePreview || null
    }); 
    
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
    // Go back to the Art Style selection step
    setWizardStep(2);
  };

  const handleContinue = () => {
    // Validation
    if (bookCharacters.length === 0) {
      setError('Please add at least one character to your story.');
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

    // Update the store with final data (characters were updated as we went)
    updateStoryData({ bookCharacters });
    
    // Clear any running polls before navigating away
    Object.values(generationStatus).forEach(status => {
        if (status.pollIntervalId) {
            clearInterval(status.pollIntervalId);
        }
    });
    
    // Continue to Story Details step
    setWizardStep(3);
  };

  // New function to generate previews for all characters at once
  const handleGenerateAllPreviews = () => {
    if (!artStyleCode) {
      setError('No art style is selected. Please go back and select an art style.');
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
    
    // Use the art style code directly
    if (!artStyleCode) {
      setError('No art style is selected. Please go back and select an art style.');
      return;
    }
    
    // Get a display name for the style
    const styleName = getStyleNameFromCode(artStyleCode);
    
    updateGenStatus(characterId, { status: 'generating', taskId: null, previewUrl: null, errorMessage: null });

    try {
      // Build a rich prompt that describes the character AND the style
      let prompt = `${character.age || 'a'} year old ${character.gender || 'child'} named ${character.name}`;
      
      // Add style description based on selection
      if (artStyleCode === 'custom' && customStyleDescription) {
        // Use custom style description directly
        prompt += `, ${customStyleDescription}`;
      } else {
        // Add style description
        prompt += `, in the ${styleName} style`;
        
        // Special handling for known styles to enhance prompt
        if (artStyleCode === WARM_FABLES_STYLE_CODE) {
          prompt += `, charming detailed watercolor illustrations in the style of classic children's tales`;
        }
        
        // If there's additional custom description, append it for further refinement
        if (customStyleDescription) {
          prompt += `, ${customStyleDescription}`;
        }
      }
      
      // Add instructions for a clean background
      prompt += ", plain neutral background, soft lighting, no distracting elements, focus on character only";
      
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

        // Handle different status formats and nested data structures
        const status = progressData.status || 
                      (progressData.data && progressData.data.status) || 
                      'unknown';
        
        console.log(`Task status: ${status} for character ${characterId}`);

        if (status === 'succeed' || status === 'succeeded') {
          // Look for image URL in generate_result_slots
          let imageUrl = null;
          
          // Check in progressData.generate_result_slots
          if (progressData.generate_result_slots && progressData.generate_result_slots.length > 0) {
            imageUrl = progressData.generate_result_slots.find(url => url); // Find first non-empty string
          } 
          // Check in progressData.data.generate_result_slots (more common format)
          else if (progressData.data && progressData.data.generate_result_slots && progressData.data.generate_result_slots.length > 0) {
            imageUrl = progressData.data.generate_result_slots.find(url => url); // Find first non-empty string
          }
          
          console.log("Found image URL:", imageUrl);
          
          if (imageUrl) {
            console.log(`Setting preview URL for character ${characterId} to ${imageUrl}`);
            updateGenStatus(characterId, { 
              status: 'previewReady', 
              previewUrl: imageUrl,
              pollIntervalId: null 
            });
            clearPollInterval(characterId); // Stop polling on success
          } else {
            console.error("No valid image URL found in response:", progressData);
            updateGenStatus(characterId, { 
              status: 'error', 
              errorMessage: 'Generation succeeded but no image URL found.', 
              pollIntervalId: null 
            });
            clearPollInterval(characterId);
          }
        } else if (status === 'failed' || status === 'error') {
          console.error(`Task ${taskId} failed:`, progressData.error_reason || progressData.data?.error_reason);
          updateGenStatus(characterId, { 
            status: 'error', 
            errorMessage: progressData.error_reason || progressData.data?.error_reason || 'Image generation failed.', 
            pollIntervalId: null 
          });
          clearPollInterval(characterId); // Stop polling on failure
        } else {
          // Still processing ('waiting', 'in_queue', 'processing')
          updateGenStatus(characterId, { status: 'polling' }); 
        }
      } catch (error) {
        console.error(`Error polling task ${taskId}:`, error);
        updateGenStatus(characterId, { 
          status: 'error', 
          errorMessage: error.message || 'Failed to check progress.', 
          pollIntervalId: null 
        });
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
    const character = bookCharacters.find(c => c.id === characterId);
    
    if (status?.status === 'previewReady' && status.previewUrl) {
      console.log('Confirming style for character:', character.name);
      console.log('Using art style code:', artStyleCode);
      
      // Get the style name
      const styleName = getStyleNameFromCode(artStyleCode);
      
      console.log(`Storing style ${artStyleCode} (${styleName}) for character ${character.name}`);
      
      // Update the character in the store with both style preview and art style code
      updateCharacter(characterId, { 
        stylePreview: status.previewUrl, // Save the generated preview
        artStyle: artStyleCode, // Save the selected art style code
        artStyleName: styleName, // Optional: save a friendly name too
        photoUrl: null // DISCARD the original photo for privacy
      }); 
      
      // Also update local bookCharacters state to stay in sync
      setBookCharacters(prev => 
        prev.map(char => 
          char.id === characterId 
            ? { 
                ...char, 
                stylePreview: status.previewUrl,
                artStyle: artStyleCode,
                artStyleName: styleName,
                photoUrl: null 
              } 
            : char
        )
      );
      
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
    
    // Get a display name for the art style if available
    const getArtStyleDisplayName = () => {
      // If the character has its own art style name
      if (character.artStyleName) {
        return character.artStyleName;
      }
      
      // If the character has a style code
      if (character.artStyle) {
        return getStyleNameFromCode(character.artStyle);
      }
      
      // If no character-specific style but story has a style set
      if (artStyleCode) {
        return getStyleNameFromCode(artStyleCode);
      }
      
      return 'No Style Selected';
    };

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
          <div className="space-y-1">
            <p className="text-sm text-gray-500 capitalize">Role: {character.role}</p>
            <p className="text-sm text-gray-500">
              Age: {character.age || 'N/A'}, Gender: {character.gender || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Art Style:</span> {getArtStyleDisplayName()}
            </p>
          </div>

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
                  disabled={!artStyleCode}
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
            <h1 className="text-2xl font-bold">Add Your Story Characters</h1>
            <p className="text-gray-600">Create the characters that will appear in your story</p>
            
            {artStyleCode && (
              <div className="mt-2 inline-block px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm">
                Using art style: {getStyleNameFromCode(artStyleCode)}
              </div>
            )}
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Characters List */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Story Characters</h3>
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
              Back to Art Style
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