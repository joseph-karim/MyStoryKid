import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { getStyleNameFromCode } from '../utils/styleUtils';
import * as openaiImageService from '../services/openaiImageService';

// Initialize form state with defaults
const defaultCharacterData = {
  name: '',
  type: '',
  age: '',
  gender: '',
  artStyle: '',
  photoUrl: null,
  stylePreview: null,
  useTextToImage: false,
  generationPrompt: '',
  isHuman: true
};

// --- ADD HELPER FUNCTION ---
async function fetchAndConvertToBase64(imageUrl) {
  console.log(`[Base64 Convert] Attempting to fetch: ${imageUrl}`);
  try {
    // Important: Add no-cors mode temporarily if direct fetch fails,
    // but be aware this might lead to an opaque response.
    // A backend proxy is the robust solution for CORS.
    const response = await fetch(imageUrl); // Try direct fetch first

    if (!response.ok) {
      throw new Error(`Failed to fetch image URL (${response.status} ${response.statusText})`);
    }

    const blob = await response.blob();
    console.log(`[Base64 Convert] Fetched blob type: ${blob.type}, size: ${blob.size}`);

    // CRITICAL FIX: Ensure we have a proper image MIME type
    // If the blob type is generic or missing, infer it from URL or set a default
    let mimeType = blob.type;
    if (!mimeType || mimeType === 'application/octet-stream') {
      // Try to infer MIME type from URL
      if (imageUrl.toLowerCase().endsWith('.png')) {
        mimeType = 'image/png';
      } else if (imageUrl.toLowerCase().endsWith('.jpg') || imageUrl.toLowerCase().endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (imageUrl.toLowerCase().endsWith('.webp')) {
        mimeType = 'image/webp';
      } else {
        // Default to image/jpeg if unknown
        mimeType = 'image/jpeg';
      }
      console.log(`[Base64 Convert] Corrected MIME type from ${blob.type} to ${mimeType}`);
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Create a data URL with the correct MIME type
        const base64Data = reader.result.split(',')[1]; // Extract the Base64 part without prefix
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        console.log(`[Base64 Convert] Successfully created dataUrl with MIME type: ${mimeType}`);
        console.log(`[Base64 Convert] Data URL prefix: ${dataUrl.substring(0, 40)}...`);

        resolve(dataUrl); // Return the properly formatted data URL
      };
      reader.onerror = (error) => {
        console.error("[Base64 Convert] FileReader error:", error);
        reject(new Error("Failed to read image blob."));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`[Base64 Convert] Error fetching or converting image URL: ${error.message}`);
    // Decide on fallback behavior: throw, return null, or return placeholder?
    // Returning null for now to indicate failure.
    // throw error; // Re-throw if the caller should handle it more explicitly
    return null;
  }
}
// --- END HELPER FUNCTION ---

// --- Add back Helper functions for placeholder generation ---
const stringToColor = (str) => {
  if (!str) return '#CCCCCC'; // Default color for empty string
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
};

const getContrastColor = (hexColor) => {
  if (!hexColor || hexColor.length < 7) return '#000000'; // Default to black
  try {
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  } catch (e) {
    console.error("Error getting contrast color:", e);
    return '#000000';
  }
};

const createColorPlaceholder = (bgColor, text) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='; // Transparent pixel

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = getContrastColor(bgColor);
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Basic text wrapping
    const words = (text || 'Placeholder').split(' ');
    let line = '';
    const lines = [];
    const y = canvas.height / 2;
    const lineHeight = 24;
    const maxWidth = canvas.width - 20; // Add padding

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      if (testWidth > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const startY = y - (lines.length - 1) * lineHeight / 2;
    lines.forEach((ln, i) => {
      ctx.fillText(ln.trim(), canvas.width / 2, startY + i * lineHeight);
    });

    return canvas.toDataURL('image/png');
  } catch (e) {
    console.error("Error creating placeholder:", e);
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='; // Transparent pixel on error
  }
};
// --- End Placeholder Helper Functions ---

function CharacterWizard({ onComplete, initialStep = 1, /* eslint-disable-next-line no-unused-vars */ bookCharacters = [], forcedArtStyle = null, initialRole = null }) {
  // eslint-disable-next-line no-unused-vars
  const { characters, addCharacter, updateCharacter } = useCharacterStore();
  const [step, setStep] = useState(initialStep);
  const [error, setError] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [apiStatus, setApiStatus] = useState({ checked: false, working: false, message: '' });
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null); // Ref to store interval ID
  const activeGenerationIdRef = useRef(null); // Ref to track the LATEST generation request - ADDED

  // Add state for tabs based navigation
  const [unlockedSteps, setUnlockedSteps] = useState([1]);

  // Character data
  const [characterData, setCharacterData] = useState(defaultCharacterData);

  // Add state for image preview modal
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');

  // Track generation attempt
  const [generationAttempted, setGenerationAttempted] = useState(false);

  // --- ADD previewUrl and generationStatus state ---
  const [previewUrl, setPreviewUrl] = useState(null);
  const [generationStatus, setGenerationStatus] = useState('idle');
  // -----------------------------------------------

  // --- ADD updateProgressInfo function ---
  const updateProgressInfo = (message) => {
    console.log(`[Progress] ${message}`);
    setProgressMessage(message);
  };
  // --- END updateProgressInfo function ---

  // --- ADD helper functions for consistent state management ---
  // Centralize generation state updates for consistency
  const updateGenerationState = (status, message = null) => {
    console.log(`[State] Updating generation state to: ${status}, message: ${message || 'none'}`);
    setGenerationStatus(status);
    if (message) updateProgressInfo(message);

    // Update isGenerating based on status
    setIsGenerating(status === 'processing');

    // Clear error when starting, but don't clear during other state changes
    if (status === 'processing' && error) setError('');
  };

  // Handle setting both image preview locations consistently
  const updatePreviewImage = (imageData) => {
    if (!imageData) {
      console.warn('[Preview] Attempted to set null/undefined image data');
      return;
    }

    console.log(`[Preview] Setting preview image: ${imageData.substring(0, 50)}...`);
    // Update both state variables that track the preview
    setPreviewUrl(imageData);
    setCharacterData(prev => ({
      ...prev,
      stylePreview: imageData
    }));
  };

  // Consistent error handling
  const handleGenerationError = (errorMessage, fallbackImage = null) => {
    const message = typeof errorMessage === 'string' ? errorMessage :
                   (errorMessage?.message || 'Unknown error');

    console.error(`[Error] Generation error: ${message}`);
    setError(`Generation failed: ${message}. Please try again.`);
    updateGenerationState('error', `Error occurred: ${message}`);

    // Use fallback image if provided
    if (fallbackImage) {
      useFallbackImage(fallbackImage);
    }
  };

  // Standardized task management
  const clearActiveTasks = () => {
    if (pollIntervalRef.current) {
      console.log('[Tasks] Clearing active polling interval');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    // Don't reset the active generation ID here, as it should be managed by the generation functions
    // This was causing the polling to stop prematurely
    // activeGenerationIdRef.current = null;
  };
  // --- END helper functions ---

  // --- MOVED EFFECT: Update isHuman based on type ---
  useEffect(() => {
    // Determine default isHuman value based on type
    const defaultIsHuman = !['pet', 'magical', 'animal'].includes(characterData.type);

    // Check if isHuman is still at its initial undefined/null state OR if the type change *requires* a default change
    const shouldSetDefault = characterData.isHuman === undefined || characterData.isHuman === null ||
                             (['pet', 'magical', 'animal'].includes(characterData.type) !== !characterData.isHuman);

    if (shouldSetDefault) {
        console.log(`[EFFECT - Top Level] Setting default isHuman based on type '${characterData.type}': ${defaultIsHuman}`);
        // Use the state setter directly or ensure handleChange doesn't cause loops
        setCharacterData(prev => ({ ...prev, isHuman: defaultIsHuman }));
    }
  }, [characterData.type]); // Dependency remains characterData.type
  // --- END MOVED EFFECT ---

  // Effect specifically for handling forcedArtStyle
  useEffect(() => {
    if (forcedArtStyle) {
      console.log('[CharacterWizard] Applying forced art style:', forcedArtStyle);

      // Update character data with the forced style
      setCharacterData(prev => ({
        ...prev,
        artStyle: forcedArtStyle
      }));
    }
  }, [forcedArtStyle]);

  // Add the checkApiStatus function definition
  const checkApiStatus = async () => {
    try {
      console.log('Checking OpenAI API connectivity...');

      // Check if OpenAI API key is available
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        throw new Error('OpenAI API key not found');
      }

      // For now, we'll assume the API is working if the key is present
      // In a production app, you might want to make a test call to verify
      setApiStatus({
        checked: true,
        working: true,
        message: 'OpenAI API ready',
        details: ''
      });

      console.log('OpenAI API check successful');
    } catch (error) {
      console.error('Error checking OpenAI API:', error);
      setApiStatus({
        checked: true,
        working: false,
        message: `OpenAI API check error: ${error.message}`
      });
    }
  };

  // Update the useEffect to store forcedArtStyle
  useEffect(() => {
    console.log('[CharacterWizard] Initializing with forcedArtStyle:', forcedArtStyle);

    // If a forced art style is provided, apply it to the character data
    if (forcedArtStyle) {
      setCharacterData(prevData => ({
        ...prevData,
        artStyle: forcedArtStyle
      }));

      console.log('[CharacterWizard] Applied forced art style to character data:', forcedArtStyle);
    }

    // Set the initial role if provided
    if (initialRole) {
      setCharacterData(prevData => ({
        ...prevData,
        role: initialRole
      }));
    }

    // Always start at step 1 (Details) regardless of initialStep
    // This ensures the user always starts with the Details tab
    setStep(1);
    setUnlockedSteps([1]);

    // Check API status
    checkApiStatus();
  }, [forcedArtStyle, initialRole, initialStep]);

  // Character types
  // eslint-disable-next-line no-unused-vars
  const CHARACTER_TYPES = [
    { id: 'child', name: 'Main Character', description: 'The main character of your story' },
  ];

  // Character roles (simplified to just main character)
  // eslint-disable-next-line no-unused-vars
  const CHARACTER_ROLES = [
    { id: 'main', label: 'Main Character', description: 'The hero of the story' },
  ];

  const handleChange = (field, value) => {
      setCharacterData(prev => ({
        ...prev,
      [field]: value
    }));

    // Clear any errors when field changes
    if (error) {
      setError('');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handlePhotoSelect = (photoUrl) => {
    setCharacterData({
      ...characterData,
      photoUrl,
    });
  };

  // Reset function to clear state
  const resetCharacterState = () => {
      setIsGenerating(false);
    setError('');
    setProgressMessage('');
    setPhotoPreview(null);
    setGenerationAttempted(false); // <-- Reset attempt tracker
    // Reset character data with a new ID
    setCharacterData({
      id: uuidv4(),
    name: '',
    type: 'child',
    age: '',
    gender: '',
    traits: [],
    interests: [],
      photoUrl: null, // Reset photoUrl
      artStyle: forcedArtStyle || null,
      stylePreview: null, // Reset stylePreview
      description: '',
      customRole: '',
      generationPrompt: '',
      useTextToImage: false,
      isHuman: true
    });

    // Always start at step 1 (Details) when resetting
    setStep(1);
    setUnlockedSteps([1]);
  };

  const handleComplete = () => {
    try {
      // Make sure we have the basic info needed for a character
      if (!characterData.name) {
        setError('Please provide a name for your character.');
      return;
    }

      // Explicitly log current stylePreview for debugging
      console.log('Style preview before completion:', characterData.stylePreview);
      console.log('Art style before completion:', characterData.artStyle);

      // Create the final character object
      const finalCharacter = {
      ...characterData,
        id: characterData.id || uuidv4(), // Ensure we have an ID
        type: characterData.type || 'child', // Set a default type

        // CRITICAL: Store the Dzine stylePreview, discard original photoUrl
        stylePreview: characterData.stylePreview, // This should contain the Base64/URL from Dzine
        photoUrl: null, // Nullify the original photo reference

        // Ensure artStyle (Dzine code) is stored
        artStyle: characterData.artStyle || forcedArtStyle || null,
      };

      // Validation: Check if stylePreview exists
      if (!finalCharacter.stylePreview) {
          // If no style preview, AND we didn't use text-to-image, use photo as fallback?
          // OR, more safely, show an error if generation didn't happen or failed.
          if (generationAttempted && !finalCharacter.stylePreview) {
              setError("Style preview generation failed or wasn't completed. Cannot save character without a style preview.");
              return;
          } else if (!generationAttempted && finalCharacter.photoUrl) {
               // This case should ideally not happen if logic is correct
               console.warn("Saving character using original photo as preview - generation wasn't attempted or logic error.");
               // For safety, we might still prevent saving here unless explicitly allowed
               // setError("Please generate a style preview before saving.");
               // return;
               // OR use photoUrl as fallback (less ideal for Segmind)
               finalCharacter.stylePreview = finalCharacter.photoUrl;
          }
          // If no photo and no preview, definitely error out
          else if (!finalCharacter.photoUrl && !finalCharacter.stylePreview) {
               setError("Missing character image or style preview. Please upload a photo or describe the character for generation.");
               return;
          }
      }

      console.log('Completing character creation with data:', {
          ...finalCharacter,
          stylePreview: finalCharacter.stylePreview ? `[Base64 Preview Present: ${finalCharacter.stylePreview.substring(0,50)}...]` : null,
      });

      // If this is a new character, add it (this logic might be simplified if CharacterWizard always calls onComplete)
      // The parent component (CreateBookPage) likely handles the actual adding/updating in the main store.
      // So, just call onComplete.

      // Invoke the callback with the final data
      if (onComplete) {
        console.log('Invoking completion callback...');
        onComplete(finalCharacter);
      } else {
          console.warn('CharacterWizard: onComplete callback is missing!');
      }

    } catch (err) {
      console.error('Error completing character:', err);
      setError('Failed to save character. Please try again.');
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleCancel = () => {
    // Reset for next use
    resetCharacterState();

    onComplete(null);
  };

  const handleBack = () => {
    setError(''); // Clear errors on navigation
    let targetStep = step - 1;
    // Always go through all steps, even if art style is forced
    console.log('[NAV] Going back to step', targetStep);
    setStep(Math.max(1, targetStep)); // Use Math.max to prevent going below 1
  };

  const handleNext = () => {
    console.log('[CharacterWizard] handleNext() called, current step:', step);
    setError(''); // Clear errors on navigation

    // Validation for Step 1: Details
    if (step === 1) {
      if (!characterData.name) {
        setError('Please enter a name for your character.');
        return;
      }
      if (!characterData.type) {
        setError('Please select a character type.');
        return;
      }
       if (!characterData.age) {
        setError('Please select an age for your character.');
        return;
      }
      if (!characterData.gender) {
        setError('Please select a gender for your character.');
        return;
      }

      // Always go to Step 2 (Appearance) even if art style is forced
      // This ensures users can upload a photo or provide a description
      console.log('[NAV] Going to Step 2 (Appearance)');

      // Update the character data with the forced art style if provided
      if (forcedArtStyle) {
        setCharacterData(prevData => ({
          ...prevData,
          artStyle: forcedArtStyle // Make sure this is set
        }));
      }

      // Unlock the next step and navigate to it
      setUnlockedSteps(prev => [...new Set([...prev, 2])]);
      setStep(2);
    }
    // Validation for Step 2: Photo & Style
    else if (step === 2) {
      // For photo, we also need a style choice
      if (!characterData.photoUrl && !characterData.useTextToImage) { // Check both photo and text toggle
        setError('Please upload a photo or describe the character.');
        return;
      }
      if (characterData.useTextToImage && !characterData.generationPrompt) { // Check prompt if text is used
        setError('Please provide a description for image generation.');
        return;
      }

      // Check for forced art style or user selected style (shouldn't happen if skipped)
      if (!forcedArtStyle && !characterData.artStyle) {
        setError('Please select an art style for your character.');
        return;
      }

      console.log(`[CharacterWizard] Selected/Forced art style: ${characterData.artStyle || forcedArtStyle}`);
      setUnlockedSteps(prev => [...new Set([...prev, 3])]);

      // Generate preview image based on selected or forced style
      const styleToUse = forcedArtStyle || characterData.artStyle;
      // Use isHuman state which is now managed by useEffect
      const isHumanCharacter = characterData.isHuman;

      // Generate a preview with the photo and style
      generateCharacterPreview(styleToUse, isHumanCharacter);

      setStep(3);
    }
    // Step 3: Confirm - The "Next" action is handled by the "Complete Character" button inside renderConfirmStep
    // No explicit setStep(4) needed here.
  };

  // --- ADDED: Handle clicking tabs ---
  const handleTabClick = (tabStep) => {
    if (unlockedSteps.includes(tabStep)) {
      setStep(tabStep);
    } else {
      console.log(`Step ${tabStep} is not unlocked yet.`);
    }
  };
  // --- END ADDED ---

  // --- ADDED: Handle selecting existing character ---
  // eslint-disable-next-line no-unused-vars
  const handleSelectExistingCharacter = (character) => {
    // This function might need more logic depending on how existing characters are handled
    console.log('Selected existing character:', character);
    // Potentially pre-fill data and move to confirm step?
    // setCharacterData(character);
    // setUnlockedSteps([1, 2, 3]);
    // setStep(3);
  };
  // --- END ADDED ---

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    console.log('UPLOAD DEBUG:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // Basic validation (optional)
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image file size should not exceed 5MB.');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('IMAGE DATA DEBUG:', {
        resultLength: reader.result?.length,
        resultType: typeof reader.result,
        resultPrefix: reader.result?.substring(0, 30),
      });
      setPhotoPreview(reader.result); // For UI preview
      // Store Base64 directly in characterData
      setCharacterData(prev => ({
        ...prev,
        photoUrl: reader.result, // Store Base64
        useTextToImage: false, // Ensure text-to-image is off
      }));
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setError("Failed to read the image file.");
    };
    reader.readAsDataURL(file);

    // Clear the input value so the same file can be selected again if needed
    e.target.value = null;

    console.log('UPLOAD COMPLETE:', {
      photoUrlSet: !!characterData.photoUrl, // Check if photoUrl was set in state update
      useTextToImage: characterData.useTextToImage,
    });
  };

  // --- ADDED: Image Preview Modal Handlers ---
  const openImagePreview = (imageUrl) => {
    console.log('[Preview Modal] Opening with URL:', imageUrl);
    setPreviewImageUrl(imageUrl);
    setShowImagePreview(true);
  };

  const closeImagePreview = () => {
    console.log('[Preview Modal] Closing');
    setShowImagePreview(false);
    setPreviewImageUrl(''); // Clear URL when closing
  };
  // --- END ADDED ---

  // --- RENDER FUNCTIONS (Based on ca071b9 structure) ---

  const renderDetailsStep = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Character Name</label>
        <input
          type="text"
          id="name"
          value={characterData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., Lily"
        />
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Character Type</label>
        <select
          id="type"
          value={characterData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="" disabled>Select type...</option>
          <option value="child">Child</option>
          <option value="pet">Pet</option>
          <option value="magical">Magical Creature</option>
          <option value="animal">Animal</option>
          {/* Add other types as needed */}
        </select>
      </div>
      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
        <input
          type="number"
          id="age"
          value={characterData.age}
          onChange={(e) => handleChange('age', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., 5"
        />
      </div>
      <div>
        <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender</label>
        <select
          id="gender"
          value={characterData.gender}
          onChange={(e) => handleChange('gender', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="" disabled>Select gender...</option>
          <option value="girl">Girl</option>
          <option value="boy">Boy</option>
          <option value="other">Other/Unspecified</option>
        </select>
      </div>
      {/* Add fields for traits, interests etc. if needed */}
    </div>
  );

  // --- ADDED: Get Step Title Helper ---
  const getStepTitle = (stepNumber) => {
    switch (stepNumber) {
      case 1: return 'Details';
      case 2: return 'Appearance';
      case 3: return 'Confirm';
      default: return `Step ${stepNumber}`;
    }
  };
  // --- END ADDED ---

  const renderAppearanceStep = () => (
    <div className="space-y-6">
      {/* Toggle between Photo Upload and Text Description */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        <button
          onClick={() => handleChange('useTextToImage', false)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${!characterData.useTextToImage ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Upload Photo
        </button>
        <button
          onClick={() => handleChange('useTextToImage', true)}
          className={`px-4 py-2 rounded-md text-sm font-medium ${characterData.useTextToImage ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
        >
          Describe Character
        </button>
      </div>

      {!characterData.useTextToImage ? (
        // Photo Upload Section
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Upload Character Photo</label>
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-xs">Preview</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Choose File
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">A clear photo helps create a consistent character style. (Max 5MB)</p>
        </div>
      ) : (
        // Text Description Section
        <div>
          <label htmlFor="generationPrompt" className="block text-sm font-medium text-gray-700">
            Describe the Character's Appearance
          </label>
          <textarea
            id="generationPrompt"
            rows={4}
            value={characterData.generationPrompt}
            onChange={(e) => handleChange('generationPrompt', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., A young girl with bright red pigtails, freckles, wearing a blue dress and yellow boots. Smiling happily."
          />
          <p className="text-xs text-gray-500 mt-1">Be descriptive! Include hair color, clothing, expression, etc.</p>
        </div>
      )}

      {/* Art Style Selection (Only if not forced) */}
      {!forcedArtStyle && (
        <div>
          <label htmlFor="artStyle" className="block text-sm font-medium text-gray-700">Art Style</label>
          {/* Replace with your actual ArtStyleSelector component */}
          <select
            id="artStyle"
            value={characterData.artStyle}
            onChange={(e) => handleChange('artStyle', e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="" disabled>Select style...</option>
            {/* Populate with styles from Dzine */}
            {/* Example: <option value="dz_style_code_1">Watercolor Whimsy</option> */}
            {/* TODO: Fetch and map styles */}
          </select>
          <p className="text-xs text-gray-500 mt-1">Choose the visual style for your character.</p>
        </div>
      )}

    </div>
  );

   const renderConfirmStep = () => {
     // Use previewUrl for display, fallback to stylePreview if needed
     const displayPreviewUrl = previewUrl || characterData.stylePreview;

     return (
       <div className="space-y-6">
         <h3 className="text-2xl font-semibold text-center text-gray-800">Confirm Character</h3>
         <p className="text-center text-gray-600">Review your character details and the generated style preview.</p>

         {/* Generation Status/Error Display */}
         {generationStatus === 'processing' && (
           <div className="flex justify-center items-center flex-col my-4">
             <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mb-2"></div>
             <p className="text-sm text-gray-500">{progressMessage || 'Generating preview...'}</p>
           </div>
         )}
         {/* Display specific generation error if present */}
         {generationStatus === 'error' && error && error.startsWith('Generation failed:') && (
           <p className="text-sm text-red-600 my-4 text-center">{error}</p> // Centered error
         )}
         {/* End Generation Status */}

         {displayPreviewUrl && generationStatus !== 'processing' ? ( // Hide preview while processing
           <div className="flex flex-col items-center space-y-4">
             <div
               className="w-48 h-48 rounded-lg overflow-hidden shadow-lg border border-gray-200 cursor-pointer"
               onClick={() => openImagePreview(displayPreviewUrl)}
             >
               <img
                  src={displayPreviewUrl}
                  alt="Character Style Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                       console.log('[Image] Error loading image, using placeholder');
                       e.target.src = createColorPlaceholder('#eeeeee', 'Preview Error');
                    }}
                 />
               </div>

              <h3 className="text-xl font-bold">{characterData.name}</h3>
              <p className="text-gray-600 text-sm">
                {characterData.age && `${characterData.age} years old • `}
                {characterData.gender && `${characterData.gender} • `}
                {characterData.type}
              </p>

              {/* Optionally show description if used */}
              {characterData.useTextToImage && characterData.generationPrompt && (
                <div className="mt-4 w-full p-3 bg-gray-50 rounded-md border border-gray-200 max-w-md">
                  <p className="text-xs italic text-gray-500">Based on: "{characterData.generationPrompt.substring(0, 100)}{characterData.generationPrompt.length > 100 ? '...' : ''}"</p>
           </div>
              )}
            </div>
          ) : (
             // Only show placeholder if NOT processing and no preview exists
             generationStatus !== 'processing' && (
                <div className="bg-gray-100 rounded-lg p-6 text-center border border-dashed border-gray-300 my-4 max-w-md mx-auto">
                  <p className="text-gray-600">Style preview will appear here after generation.</p>
                </div>
             )
          )}

        {/* Regenerate Button */}
        {/* Show button only if generation isn't processing */}
        {generationStatus !== 'processing' && (
           <div className="text-center"> {/* Center the button */}
             <button
               onClick={() => {
                 console.log('[Retry/Regen] User requested generation');
                 const styleToUse = forcedArtStyle || characterData.artStyle;
                 const isHumanCharacter = characterData.isHuman;
                 generateCharacterPreview(styleToUse, isHumanCharacter);
               }}
               // Disable if generating, API not working, OR if required inputs are missing
               disabled={isGenerating || !apiStatus.working || (!characterData.photoUrl && !characterData.generationPrompt && !characterData.useTextToImage)}
               className={`mt-3 px-4 py-2 text-sm rounded ${
                 (!characterData.photoUrl && !characterData.generationPrompt && !characterData.useTextToImage) || !apiStatus.working || isGenerating // Combined disabled condition
                   ? 'bg-gray-400 text-white cursor-not-allowed'
                   : 'bg-blue-600 text-white hover:bg-blue-700'
               }`}
             >
               {displayPreviewUrl ? 'Regenerate Preview' : 'Generate Preview'}
             </button>
             {!apiStatus.working && apiStatus.checked && (
                <p className="text-xs text-red-500 mt-1">API Error: {apiStatus.message}. Preview generation disabled.</p>
             )}
             {/* Updated condition to check useTextToImage flag */}
             {(!characterData.photoUrl && !characterData.generationPrompt && !characterData.useTextToImage) && (
                <p className="text-xs text-orange-500 mt-1">Please upload a photo or provide a description in Step 2 to enable preview generation.</p>
             )}
           </div>
         )}
        {/* End Regenerate Button */}

        {/* Original Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
             <button
            onClick={handleBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            disabled={isGenerating} // Use isGenerating
          >
            Back
          </button>
           <button
            onClick={handleComplete}
            // Allow complete if preview exists OR if generation wasn't attempted yet
            className={`px-6 py-2 bg-green-600 text-white rounded ${(!displayPreviewUrl && generationAttempted) || isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
            disabled={(!displayPreviewUrl && generationAttempted) || isGenerating} // Use isGenerating and allow complete if not attempted
           >
            Complete Character
             </button>
           </div>
       </div>
     );
   };
   // --- End renderConfirmStep ---

   // Update renderStep to call renderConfirmStep ---
   const renderStep = () => {
     switch (step) {
       case 1: return renderDetailsStep();
       case 2: return renderAppearanceStep();
       case 3: return renderConfirmStep(); // Step 3 is Confirm
       default:
         console.warn("Unknown step in renderStep, defaulting to 1");
         setStep(1);
         return renderDetailsStep();
     }
   };

   // --- generateCharacterImage function (Kept for backward compatibility) ---
   // eslint-disable-next-line no-unused-vars
   const generateCharacterImage = async (styleApiCode, prompt, fallbackImage, isHumanCharacter) => {
     setGenerationAttempted(true); // Mark that we've tried to generate
     updateGenerationState('processing', 'Starting character image generation...');

     // Validate style code early
     if (!styleApiCode) {
       handleGenerationError('An invalid art style was specified.', fallbackImage);
       return;
     }

     const generationId = uuidv4(); // Unique ID for this specific generation attempt
     activeGenerationIdRef.current = generationId; // Track this attempt
     let operationType = '';

     try {
       let taskResponse;

       if (characterData.useTextToImage) {
         // --- Text-to-Image Logic ---
         operationType = 'Txt2Img';
         console.log('[Generate] Using Text-to-Image');

         // Enhance prompt if needed (example)
         let enhancedPrompt = prompt || characterData.generationPrompt || 'character portrait';
         if (characterData.name) {
           enhancedPrompt = `${characterData.name}, ${enhancedPrompt}`;
         }
         enhancedPrompt += ", high quality illustration"; // Add quality modifier

         // Correct payload for createTxt2ImgTask
         const payload = {
           prompt: enhancedPrompt.substring(0, 800),
           style_code: styleApiCode,
           aspect_ratio: '1:1',
           quality_mode: 1,
           output_format: 'webp',
           seed: Math.floor(Math.random() * 2147483647) + 1,
           negative_prompt: 'low quality, blurry, bad anatomy',
           generate_slots: [1, 0, 0, 0] // Ensure only one image is requested
         };

         console.log('Txt2Img Payload:', JSON.stringify(payload, null, 2));
         // Pass the single payload object
         taskResponse = await createTxt2ImgTask(payload.prompt, payload.style_code, payload);

       } else {
         // --- Image-to-Image Logic ---
         operationType = 'Img2Img';
         console.log('[Generate] Using Image-to-Image');

         if (!characterData.photoUrl) {
           throw new Error('Cannot perform Image-to-Image without a source photo.');
         }

         let photoBase64ForPayload;
         // Ensure photoUrl is Base64
         if (!characterData.photoUrl.startsWith('data:image')) {
           // Attempt conversion if not base64 (e.g., if it's a URL from selection)
           console.warn('[Generate] photoUrl is not Base64, attempting conversion...');
           const base64Photo = await fetchAndConvertToBase64(characterData.photoUrl);
           if (!base64Photo) {
              throw new Error('Failed to convert source photo to Base64 for Image-to-Image.');
           }
           // Update: Use a temporary variable instead of mutating state directly here
           photoBase64ForPayload = base64Photo;
           console.log('[Generate] Conversion successful.');
         } else {
           photoBase64ForPayload = characterData.photoUrl; // Already base64
         }

         // Construct prompt for Img2Img
         const imgPrompt = prompt || `Character portrait of ${characterData.name || 'person'} in the selected style`;

         // *** PAYLOAD FIX APPLIED HERE ***
         const payload = {
           style_code: styleApiCode,
           prompt: imgPrompt.substring(0, 800),
           images: [{ base64_data: photoBase64ForPayload }], // Pass image correctly in the images array
           quality_mode: 1,
           output_format: 'webp',
           negative_prompt: 'ugly, deformed, disfigured, poor quality, blurry, nsfw',
           seed: Math.floor(Math.random() * 2147483647) + 1,
           generate_slots: [1, 1] // Default for Model X
           // style_intensity, structure_match, color_match can be added if needed
         };

         console.log('Img2Img Payload (excluding base64):', JSON.stringify({
              ...payload,
              images: [{ base64_data: 'base64_data_present' }]
            }, null, 2));
         // Pass the single payload object and the face match flag
         taskResponse = await createImg2ImgTask(payload, isHumanCharacter);
       }

       // --- Common Task Handling ---
       if (!taskResponse || !taskResponse.task_id) {
         // Attempt to extract error message from response if available
         const apiErrorMsg = taskResponse?.error || taskResponse?.message || `Failed to initiate ${operationType} task.`;
         throw new Error(apiErrorMsg);
       }

       console.log(`[Generate] ${operationType} task started with ID: ${taskResponse.task_id}`);
       updateProgressInfo('Generation task submitted, waiting for progress...');

       // Start polling using the task ID
       startPollingTask(taskResponse.task_id, fallbackImage, generationId);

     } catch (error) {
       console.error(`[Generate] Error during ${operationType || 'generation'} initiation:`, error);
       // Use centralized error handler
       handleGenerationError(error, fallbackImage);
     }
   };
   // --- End generateCharacterImage function ---

   // --- generateCharacterPreview function (Using OpenAI) ---
   const generateCharacterPreview = async (styleApiCode, /* eslint-disable-next-line no-unused-vars */ isHumanCharacter) => {
     console.log('[GeneratePreview] Called with style:', styleApiCode);

     const styleToUse = forcedArtStyle || styleApiCode;
     if (!styleToUse) {
       console.error('[GeneratePreview] No style code provided or selected.');
       setError('Please select an art style first.');
       return;
     }

     // Use a placeholder based on character name while generating
     const placeholderText = characterData.name || 'Character';
     const placeholderBg = stringToColor(placeholderText);
     const placeholderImage = createColorPlaceholder(placeholderBg, placeholderText);

     // Set placeholder immediately AND set state to processing
     updatePreviewImage(placeholderImage);
     updateGenerationState('processing', 'Preparing character generation with OpenAI...'); // Set state early

     try {
       // Get style description from style code
       const styleDescription = getStyleNameFromCode(styleToUse) || 'colorful, child-friendly illustration style';

       // Generate character image using OpenAI
       updateProgressInfo('Generating character with OpenAI...');

       // Use the photo as reference if available
       const photoReference = characterData.photoUrl || null;

       // Generate the character image
       const generatedImage = await openaiImageService.generateCharacterImage(
         { ...characterData, artStyleCode: styleToUse }, // Pass the entire character data object with art style code
         `Use a ${styleDescription} style.`,
         photoReference
       );

       if (generatedImage) {
         // Update the preview with the generated image
         updatePreviewImage(generatedImage);
         updateGenerationState('complete', 'Character preview generated!');
       } else {
         throw new Error('Failed to generate character image with OpenAI.');
       }
     } catch (error) {
       console.error('[GeneratePreview] Error generating character with OpenAI:', error);
       handleGenerationError(error, placeholderImage); // Ensure fallback on error
     }
   };
   // --- End generateCharacterPreview update ---

   // --- useFallbackImage function (Updated in previous step) ---
   const useFallbackImage = (fallbackImage) => {
     console.log('[Fallback] Using fallback image.');
     // Ensure fallbackImage is valid before using
     if (fallbackImage && typeof fallbackImage === 'string') {
       // Use the central image update function
       updatePreviewImage(fallbackImage);
       updateProgressInfo('Using placeholder image due to error.');
       updateGenerationState('fallback'); // Use 'fallback' status
     } else {
       console.warn('[Fallback] Invalid fallback image provided.');
       // If fallback is invalid, ensure state reflects error without a preview
       setPreviewUrl(null); // Clear any existing preview
       setCharacterData(prev => ({ ...prev, stylePreview: null }));
       updateGenerationState('error', 'Generation failed, no valid fallback.');
     }
   };
   // --- End useFallbackImage function ---

   // --- startPollingTask function (Updated in previous step) ---
   const startPollingTask = (taskId, fallbackImage, generationId) => {
     let pollCount = 0;
     const maxPolls = 30; // Approx 2 minutes
     const pollInterval = 4000; // 4 seconds

     // Clear any existing interval *before* starting a new one
     clearActiveTasks();

     updateGenerationState('processing', `Polling task ${taskId}... (0/${maxPolls})`);

     pollIntervalRef.current = setInterval(async () => {
       // --- Check if this is still the active generation task ---
       if (activeGenerationIdRef.current !== generationId) {
         console.log(`[Polling] Task ${taskId} is no longer the active generation (${activeGenerationIdRef.current}). Stopping poll.`);
         clearActiveTasks();
         return;
       }
       // --- End check ---

       pollCount++;
       console.log(`[Polling] Poll attempt ${pollCount} for task ${taskId}`);

       try {
         const result = await getTaskProgress(taskId);
         console.log('[Polling] Progress data:', result); // Log the raw result

         // --- Check again if this is still the active task AFTER the async call ---
         if (activeGenerationIdRef.current !== generationId) {
           console.log(`[Polling] Task ${taskId} became inactive during API call. Stopping poll.`);
           clearActiveTasks();
           return;
         }
         // --- End check ---

         // Use the normalized status from getTaskProgress
         const currentStatus = result.status;
         const progressPercent = Math.round((result.progress || 0) * 100); // Use progress if available, make percentage

         console.log(`[Polling] Task status: "${currentStatus}" (original: "${result.original_status || currentStatus}"), progress: ${progressPercent}%`);

         if (currentStatus === 'success') {
           clearActiveTasks();
           updateProgressInfo('Task successful! Fetching final image...');

           // Extract image URL (handle potential variations in response)
           const imageUrl = result.imageUrl || (result.generate_result_slots && result.generate_result_slots.find(url => url));

           if (imageUrl) {
             updateProgressInfo('Converting final image URL to Base64...');
             // Convert the final URL to Base64 before setting
             const base64Image = await fetchAndConvertToBase64(imageUrl);
             if (base64Image) {
               updatePreviewImage(base64Image); // Update preview with Base64
               updateGenerationState('complete', 'Character preview generated!'); // Use 'complete' status
             } else {
               // Handle conversion failure
               handleGenerationError('Failed to convert final image to Base64.', fallbackImage);
             }
           } else {
             // If no URL in progress, try getTaskResult
             console.log(`[Polling] No image URL in progress, attempting getTaskResult for ${taskId}`);
             try {
                 const resultData = await getTaskResult(taskId);
                 console.log(`[Polling] Task result:`, resultData);

                 if (!resultData || !resultData.images || resultData.images.length === 0) {
                   throw new Error('Task completed but no images were returned by getTaskResult');
                 }
                 const finalImageUrl = resultData.images[0];
                 const base64Image = await fetchAndConvertToBase64(finalImageUrl);
                 if (base64Image) {
                    updatePreviewImage(base64Image);
                    updateGenerationState('complete', 'Character preview generated!');
                 } else {
                    throw new Error('Failed to convert final image from getTaskResult to Base64.');
                 }
             } catch (getResultError) {
                 console.error(`[Polling] Failed to fetch task result after success status:`, getResultError);
                 handleGenerationError('Task succeeded but failed to retrieve the final image.', fallbackImage);
             }
           }

         } else if (currentStatus === 'failed') {
           clearActiveTasks();
           handleGenerationError(result.error || result.error_reason || 'Task failed with unknown error', fallbackImage);

         } else if (currentStatus === 'running') {
           // Update progress message while running
           updateGenerationState('processing', `Generation in progress... ${progressPercent}% (${pollCount}/${maxPolls})`);

         } else {
           // Handle other statuses like 'pending', 'queued' if needed
           updateGenerationState('processing', `Task status: ${currentStatus}... (${pollCount}/${maxPolls})`);
         }

         // Timeout check
         if (pollCount >= maxPolls && currentStatus !== 'success' && currentStatus !== 'failed') {
           clearActiveTasks();
           handleGenerationError('Polling timed out after maximum attempts.', fallbackImage);
         }

       } catch (error) {
         // --- Check again if this is still the active task after error ---
         if (activeGenerationIdRef.current !== generationId) {
           console.log(`[Polling] Task ${taskId} became inactive during error handling. Stopping poll.`);
           clearActiveTasks();
           return;
         }
         // --- End check ---
         console.error(`[Polling] Error during polling task ${taskId}:`, error);

         // Special handling for 404 errors which might be temporary
         const is404Error = error.message && (error.message.includes('404') || error.message.includes('not found'));
         if (is404Error && pollCount < 5) {
           console.log(`[Polling] Got 404 for task ${taskId} on attempt ${pollCount} - continuing to poll`);
           updateProgressInfo(`Generation in progress... waiting for task to start`);
           // Don't increment pollCount or fail yet for early 404s
           return;
         }

         // For other errors or late 404s, update status but let loop continue up to max attempts
         updateProgressInfo(`Polling error: ${error.message} (${pollCount}/${maxPolls})`);
         if (pollCount >= maxPolls) {
           clearActiveTasks();
           handleGenerationError(`Polling failed after multiple errors: ${error.message}`, fallbackImage);
         }
       }
     }, pollInterval); // Poll every 4 seconds
   };
   // --- End startPollingTask function ---

   // Cleanup polling on unmount
   useEffect(() => {
     return () => {
       console.log('[Cleanup] Component unmounting, clearing polling interval'); // Log cleanup
       clearActiveTasks();
     };
   }, []); // Empty dependency array ensures this runs only on mount and unmount

  // --- Image Preview Modal Component ---
  const ImagePreviewModal = ({ isOpen, imageUrl, onClose }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
        onClick={onClose} // Close on backdrop click
      >
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          className="bg-white p-4 rounded-lg shadow-xl max-w-lg w-full relative"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
        >
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl font-bold"
            aria-label="Close preview"
          >
            &times;
          </button>
          <img
            src={imageUrl}
            alt="Character Preview Large"
            className="max-w-full max-h-[80vh] object-contain mx-auto"
          />
        </motion.div>
      </div>
    );
  };
  // --- End Image Preview Modal ---

  // --- MAIN JSX RETURN ---
  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 md:space-x-8" aria-label="Tabs">
          {[1, 2, 3].map((stepNum) => ( // Only 3 steps
            <button
              key={stepNum}
              onClick={() => handleTabClick(stepNum)}
              disabled={!unlockedSteps.includes(stepNum)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                step === stepNum
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${!unlockedSteps.includes(stepNum) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {getStepTitle(stepNum)}
            </button>
          ))}
        </nav>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>

      {/* Error Display - Use general error state */}
      {error && !error.startsWith('Generation failed:') && ( // Don't show general error if it's a generation error shown in step 3
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
         </div>
      )}

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={showImagePreview}
        imageUrl={previewImageUrl}
        onClose={closeImagePreview}
      />

      {/* Navigation Buttons are now inside renderConfirmStep for Step 3 */}
      {/* Add general Next button for steps 1 and 2 */}
      {step < 3 && (
         <div className="mt-8 pt-5 border-t border-gray-200">
           <div className="flex justify-between">
             <button
               type="button"
               onClick={handleBack}
               disabled={step === 1 || isGenerating} // Disable on step 1 or if generating
               className={`py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${step === 1 || isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
             >
               Back
             </button>
             <button
                 type="button"
                 onClick={handleNext}
                 disabled={isGenerating} // Disable if generating
                 className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
               >
                 Next
               </button>
           </div>
         </div>
      )}

    </div>
  );
}

export default CharacterWizard;