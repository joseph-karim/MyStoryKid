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

// Base structure for UI grouping
const ART_STYLE_CATEGORIES_STRUCTURE = [
  {
    category: '🎨 Whimsical & Soft (Ages 0–5)',
    styleIds: ['watercolor', 'pastel', 'pencil_wash', 'soft_digital'] // Use IDs for matching later
  },
  {
    category: '✏️ Classic & Timeless',
    styleIds: ['pencil_ink', 'golden_books', 'beatrix_potter']
  },
  {
    category: '✨ Modern & Colorful',
    styleIds: ['cartoon', 'flat_vector', 'storybook_pop', 'papercut']
  },
  {
    category: '🖼️ Artistic & Elevated',
    styleIds: ['oil_pastel', 'stylized_realism', 'digital_painterly']
  },
  {
    category: '🌍 Cultural or Regional (Optional)',
    styleIds: ['kawaii', 'scandinavian', 'african_pattern']
  },
  {
    category: '💡 Custom Style',
    styleIds: ['custom']
  },
];

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

  // Fetch styles from Dzine API on mount
  useEffect(() => {
    const fetchStyles = async () => {
      setIsLoadingStyles(true);
      setStyleFetchError(null);
      try {
        const data = await getDzineStyles();
        setDzineStyles(data.list || []);
        
        // Create a map from name (or a generated ID) to style_code
        const map = {};
        let foundNoStyle = null;
        (data.list || []).forEach(style => {
          // Generate a simple ID from the name for mapping
          const simpleId = style.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_v\d+$/, ''); 
          map[simpleId] = style.style_code;
          
          if (style.name === 'No Style v2') {
             foundNoStyle = style.style_code;
          }
        });
        setStyleIdToCodeMap(map);
        setNoStyleCode(foundNoStyle);

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
         
           const suggestedCode = map[suggestedStyleId] || foundNoStyle || ''; // Fallback
           setArtStyleCode(suggestedCode);
        }

      } catch (err) {
        console.error("Failed to fetch Dzine styles:", err);
        setStyleFetchError(err.message || 'Could not load art styles.');
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
    if (isLoadingStyles) {
      setError('Styles are still loading, please wait.');
      return;
    }
    if (bookCharacters.length === 0) {
      setError('Please add at least one character');
      return;
    }
    const hasMainCharacter = bookCharacters.some(char => char.role === 'main');
    if (!hasMainCharacter) {
      setError('Please add a main character');
      return;
    }
    // Use artStyleCode for validation
    if (!artStyleCode && customStyleDescription === '') { 
        setError('Please select an art style or describe a custom one.');
        return;
    }
    if (artStyleCode === 'custom' && !customStyleDescription.trim()) {
      setError('Please describe your custom art style');
      return;
    }

    // --- NEW VALIDATION ---
    // Check if any characters with original photos are still pending generation/confirmation
    const pendingCharacters = bookCharacters.filter(char => {
        const charStatus = generationStatus[char.id]?.status;
        // A character needs confirmation if they had an original photo (which is now cleared on confirm)
        // OR if they currently have a photoUrl and aren't confirmed yet.
        // We check the generation status directly. If it's not 'confirmed' AND it's not 'idle' (meaning generation was attempted or is needed because photoUrl exists)
        const needsConfirmation = isBase64DataUrl(char.photoUrl) && charStatus !== 'confirmed'; 
        // Also catch cases where generation is in progress
        const isGenerating = ['generating', 'polling'].includes(charStatus);

        return needsConfirmation || isGenerating;
    });

    if (pendingCharacters.length > 0) {
        setError(`Please generate and confirm the style for: ${pendingCharacters.map(c => c.name).join(', ')}.`);
        return;
    }
    // --- END NEW VALIDATION ---

    updateStoryData({ 
      bookCharacters,
      artStyleCode: artStyleCode === 'custom' ? noStyleCode : artStyleCode, // Use noStyleCode for custom
      customStyleDescription: artStyleCode === 'custom' ? customStyleDescription : ''
    });
    setWizardStep(4); // Skip to generating step
  };

  // Helper to get style details from fetched list based on ID
  const getStyleDetails = (id) => {
      return dzineStyles.find(s => s.style_code === id);
  };

  // --- NEW: Start Image Generation ---
  const handleGeneratePreview = async (characterId) => {
    setError(''); // Clear general errors
    const character = bookCharacters.find(c => c.id === characterId);
    if (!character || !character.photoUrl || !isBase64DataUrl(character.photoUrl)) {
      updateGenStatus(characterId, { status: 'error', errorMessage: 'No photo uploaded for generation.' });
      return;
    }
    
    // Ensure a style is selected
    const currentArtStyleCode = artStyleCode === 'custom' ? noStyleCode : artStyleCode;
    if (!currentArtStyleCode && !customStyleDescription) {
         setError('Please select or describe an art style before generating previews.');
         return;
    }

    updateGenStatus(characterId, { status: 'generating', taskId: null, previewUrl: null, errorMessage: null });

    try {
      let prompt = `${character.age || 'a'} year old ${character.gender || 'child'} named ${character.name}`;
      if (artStyleCode === 'custom' && customStyleDescription) {
        prompt += `, ${customStyleDescription}`;
      }
      // If a non-custom style is selected AND there's a custom description, maybe append it?
      // else if (artStyleCode !== 'custom' && customStyleDescription) {
      //    prompt += `, ${customStyleDescription}`; // Or decide how to handle this combo
      // }

      const payload = {
        prompt: prompt.substring(0, 800),
        style_code: currentArtStyleCode, // Use the actual API code
        style_intensity: 0.9,
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
      updateGenStatus(characterId, { status: 'error', errorMessage: error.message || 'Failed to start generation.' });
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
        />
      ) : (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Add Characters & Choose Style</h2>
            <p className="text-gray-600">Define who's in the story and the overall illustration style.</p>
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
          
          {/* Art Style Selection */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4 text-gray-700">Choose Illustration Style</h3>
           
            {isLoadingStyles && <p className='text-gray-500'>Loading art styles...</p>}
            {!isLoadingStyles && !styleFetchError && (
              <div className="space-y-4">
                  {ART_STYLE_CATEGORIES_STRUCTURE.map((categoryGroup) => (
                      <div key={categoryGroup.category}>
                         <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">{categoryGroup.category}</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {categoryGroup.styleIds.map(styleId => {
                              const apiCode = styleId === 'custom' ? 'custom' : styleIdToCodeMap[styleId];
                              if (styleId !== 'custom' && !apiCode) return null; // Skip if mapping failed for API styles
                              
                              const isSelected = artStyleCode === apiCode || (styleId === 'custom' && artStyleCode === 'custom');
                              const imageSrc = styleId === 'custom' ? null : styleImageMap[styleId]; // Handle custom potentially
                              const displayName = styleId === 'custom' ? "Describe Your Own" : (dzineStyles.find(s => s.style_code === apiCode)?.name || styleId.replace(/_/g, ' '));

                              return (
                                <button 
                                  key={styleId}
                                  onClick={() => setArtStyleCode(apiCode)} // Set the API code or 'custom'
                                  className={`relative block border-2 rounded-lg overflow-hidden focus:outline-none ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-300' : 'border-gray-300 hover:border-indigo-400'}`}
                                  disabled={styleId !== 'custom' && !apiCode} // Disable if API code missing
                                >
                                  {imageSrc ? (
                                      <img src={imageSrc} alt={displayName} className="w-full h-24 object-cover" />
                                  ) : (
                                       <div className="w-full h-24 bg-gray-200 flex items-center justify-center text-gray-500 text-xs p-2">
                                          {displayName}
                                       </div>
                                  )}
                                  <span className={`absolute bottom-0 left-0 right-0 px-2 py-1 text-xs font-medium text-center ${isSelected ? 'bg-indigo-500 text-white' : 'bg-gray-600 bg-opacity-75 text-white'}`}>
                                      {displayName}
                                  </span>
                                  {styleId !== 'custom' && !apiCode && (
                                      <span className="absolute top-1 right-1 text-xs bg-red-500 text-white px-1 rounded">N/A</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                      </div>
                  ))}
              </div>
            )}

            {/* Custom Style Description Input */}
            {artStyleCode === 'custom' && (
                <div className="mt-4">
                    <label htmlFor="customStyle" className="block text-sm font-medium text-gray-700 mb-1">Describe your custom style:</label>
                    <textarea
                        id="customStyle"
                        rows="2"
                        value={customStyleDescription}
                        onChange={(e) => setCustomStyleDescription(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., vibrant crayon drawing, dark moody watercolor, simple line art with splashes of color"
                    />
                    <p className="text-xs text-gray-500 mt-1">This description will be used to guide the AI. Be specific!</p>
                </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button onClick={handleBack} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              Back
            </button>
            <button 
              onClick={handleContinue} 
              disabled={isLoadingStyles}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Continue to Story Generation
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CharactersStep; 