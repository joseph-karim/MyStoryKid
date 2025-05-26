import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { getStyleNameFromCode } from '../utils/styleUtils';
import { generateCharacterImage } from '../services/supabaseService';
import { useLoading } from '../hooks/useLoading';
import LoadingModal from '../components/LoadingModal';

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
  isHuman: true,
  relationshipType: '', // Add relationship field
  customRole: '' // For free-form relationship description
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

function CharacterWizard({ onComplete, initialStep = 1, /* eslint-disable-next-line no-unused-vars */ bookCharacters = [], forcedArtStyle = null, initialRole = null, existingCharacter = null }) {
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

  // Add state for tabs based navigation
  const [unlockedSteps, setUnlockedSteps] = useState([1]);

  // Character data - initialize with existing character if provided
  const [characterData, setCharacterData] = useState(() => {
    if (existingCharacter) {
      return existingCharacter;
    }
    
    // Set default type based on role
    const defaultType = initialRole === 'main' ? 'child' : '';
    
    return {
      ...defaultCharacterData,
      type: defaultType
    };
  });

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
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
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
        role: initialRole,
        // Set default type based on role
        type: prevData.type || (initialRole === 'main' ? 'child' : '')
      }));
    }

    // Always start at step 1 (Details) regardless of initialStep
    // This ensures the user always starts with the Details tab
    setStep(1);
    setUnlockedSteps([1]);

    // Check API status
    checkApiStatus();
  }, [forcedArtStyle, initialRole, initialStep]);

  // Character types - Updated to include adults
  const CHARACTER_TYPES = [
    { id: 'child', name: 'Child', description: 'A young person (ages 0-17)' },
    { id: 'adult', name: 'Adult', description: 'A grown-up person (ages 18+)' },
    { id: 'pet', name: 'Pet', description: 'A beloved animal companion' },
    { id: 'magical', name: 'Magical Creature', description: 'A fairy, wizard, or magical being' },
    { id: 'animal', name: 'Animal', description: 'A wild or farm animal character' },
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
    type: initialRole === 'main' ? 'child' : '', // Default main character to child
    age: '',
    gender: '',
    traits: [],
    interests: [],
      photoUrl: null, // Reset photoUrl
      artStyle: forcedArtStyle || null,
      stylePreview: null, // Reset stylePreview
      description: '',
      customRole: '',
      relationshipType: '',
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

      // For non-main characters, require relationship description
      if (initialRole !== 'main' && !characterData.customRole?.trim()) {
        setError('Please describe this character\'s relationship to the main character.');
        return;
      }

      // Explicitly log current stylePreview for debugging
      console.log('Style preview before completion:', characterData.stylePreview);
      console.log('Art style before completion:', characterData.artStyle);

      // Create the final character object
      const finalCharacter = {
      ...characterData,
        id: characterData.id || uuidv4(), // Ensure we have an ID
        type: characterData.type || (initialRole === 'main' ? 'child' : ''), // Set a default type

        // CRITICAL: Store the Dzine stylePreview, discard original photoUrl
        stylePreview: characterData.stylePreview, // This should contain the Base64/URL from Dzine
        photoUrl: null, // Nullify the original photo reference

        // Ensure artStyle (Dzine code) is stored
        artStyle: characterData.artStyle || forcedArtStyle || null,
        
        // Store relationship info for non-main characters
        relationshipType: initialRole === 'main' ? null : 'other',
        customRole: initialRole === 'main' ? null : characterData.customRole
      };

      // Allow completion without style preview for sync workflow
      // Validation: Check if stylePreview exists (but allow proceeding without it)
      if (!finalCharacter.stylePreview && !characterData.photoUrl && !characterData.generationPrompt) {
        setError("Please upload a photo or describe the character for generation.");
        return;
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
        setError('Please enter a character name.');
        return;
      }
      
      if (!characterData.type) {
        setError('Please select a character type.');
        return;
      }

      // For non-main characters, require relationship description
      if (initialRole !== 'main' && !characterData.customRole?.trim()) {
        setError('Please describe this character\'s relationship to the main character.');
        return;
      }

      console.log(`[CharacterWizard] Step 1 validation passed`);
      setUnlockedSteps(prev => [...new Set([...prev, 2])]);
      setStep(2);
    }
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

      // Generate preview image based on selected or forced style (async)
      const styleToUse = forcedArtStyle || characterData.artStyle;
      // Use isHuman state which is now managed by useEffect
      const isHumanCharacter = characterData.isHuman;

      // Generate a preview with the photo and style (but don't wait for it)
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
      
      {/* Show relationship description for supporting characters */}
      {initialRole !== 'main' && (
        <div>
          <label htmlFor="customRole" className="block text-sm font-medium text-gray-700">
            Relationship to Main Character <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="customRole"
            value={characterData.customRole || ''}
            onChange={(e) => handleChange('customRole', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Mom, Dad, Teacher, Best Friend, Grandma, Pet Dog"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Describe how this character relates to the main character</p>
        </div>
      )}
      
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Character Type</label>
        <select
          id="type"
          value={characterData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          disabled={initialRole === 'main'} // Main character must be child
        >
          <option value="" disabled>Select type...</option>
          {CHARACTER_TYPES.map(type => (
            <option key={type.id} value={type.id}>
              {type.name} - {type.description}
            </option>
          ))}
        </select>
        {initialRole === 'main' && (
          <p className="text-xs text-gray-500 mt-1">Main character is preset as a child</p>
        )}
      </div>
      
      <div>
        <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
        <input
          type="number"
          id="age"
          value={characterData.age}
          onChange={(e) => handleChange('age', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder={characterData.type === 'adult' ? 'e.g., 35' : 'e.g., 5'}
          min={characterData.type === 'adult' ? '18' : '0'}
          max={characterData.type === 'adult' ? '100' : '17'}
        />
        {characterData.type === 'adult' && (
          <p className="text-xs text-gray-500 mt-1">Adults should be 18 or older</p>
        )}
        {characterData.type === 'child' && (
          <p className="text-xs text-gray-500 mt-1">Children should be 17 or younger</p>
        )}
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
          <option value="girl">Girl/Woman</option>
          <option value="boy">Boy/Man</option>
          <option value="other">Other/Unspecified</option>
        </select>
      </div>
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
         <p className="text-center text-gray-600">Review your character details. You can continue while the preview generates.</p>

         {/* Character Details Card */}
         <div className="bg-gray-50 rounded-lg p-4 space-y-2">
           <h4 className="text-lg font-semibold">{characterData.name}</h4>
           <div className="text-sm text-gray-600 space-y-1">
             <p><span className="font-medium">Type:</span> {CHARACTER_TYPES.find(t => t.id === characterData.type)?.name || characterData.type}</p>
             {characterData.age && <p><span className="font-medium">Age:</span> {characterData.age} years old</p>}
             {characterData.gender && <p><span className="font-medium">Gender:</span> {characterData.gender}</p>}
             {initialRole !== 'main' && characterData.customRole && (
               <p><span className="font-medium">Relationship:</span> {characterData.customRole}</p>
             )}
           </div>
         </div>

         {/* Enhanced Loading Display */}
         {isEnhancedLoading && (
           <div className="my-6 p-6 bg-purple-50 rounded-lg border border-purple-200">
             <div className="text-center">
               <div className="flex justify-center mb-4">
                 <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
               </div>
               <h3 className="text-lg font-semibold text-purple-900 mb-2">
                 Generating {characterData.name || 'Character'} Preview
               </h3>
               <p className="text-purple-700 text-sm mb-4">
                 Creating your character in the selected art style...
               </p>
               <div className="text-xs text-purple-600">
                 This usually takes about 60 seconds. You can continue with your story while this generates.
               </div>
             </div>
           </div>
         )}
         
         {/* Display specific generation error if present */}
         {generationStatus === 'error' && error && error.startsWith('Generation failed:') && (
           <p className="text-sm text-red-600 my-4 text-center">{error}</p>
         )}

         {/* Preview Section */}
         {displayPreviewUrl && !isEnhancedLoading ? (
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

              {/* Optionally show description if used */}
              {characterData.useTextToImage && characterData.generationPrompt && (
                <div className="mt-4 w-full p-3 bg-gray-50 rounded-md border border-gray-200 max-w-md">
                  <p className="text-xs italic text-gray-500">Based on: "{characterData.generationPrompt.substring(0, 100)}{characterData.generationPrompt.length > 100 ? '...' : ''}"</p>
                </div>
              )}
            </div>
          ) : (
             // Show placeholder if no preview and not loading
             !isEnhancedLoading && !displayPreviewUrl && (
                <div className="bg-gray-100 rounded-lg p-6 text-center border border-dashed border-gray-300 my-4 max-w-md mx-auto">
                  <p className="text-gray-600">Style preview will appear here after generation.</p>
                  <p className="text-xs text-gray-500 mt-2">You can continue without waiting for the preview</p>
                </div>
             )
          )}

        {/* Regenerate Button */}
        {!isEnhancedLoading && (
           <div className="text-center">
             <button
               onClick={() => {
                 console.log('[Retry/Regen] User requested generation');
                 const styleToUse = forcedArtStyle || characterData.artStyle;
                 const isHumanCharacter = characterData.isHuman;
                 generateCharacterPreview(styleToUse, isHumanCharacter);
               }}
               disabled={isEnhancedLoading || !apiStatus.working || (!characterData.photoUrl && !characterData.generationPrompt && !characterData.useTextToImage)}
               className={`mt-3 px-4 py-2 text-sm rounded ${
                 (!characterData.photoUrl && !characterData.generationPrompt && !characterData.useTextToImage) || !apiStatus.working || isEnhancedLoading
                   ? 'bg-gray-400 text-white cursor-not-allowed'
                   : 'bg-blue-600 text-white hover:bg-blue-700'
               }`}
             >
               {displayPreviewUrl ? 'Regenerate Preview' : 'Generate Preview'}
             </button>
             {!apiStatus.working && apiStatus.checked && (
                <p className="text-xs text-red-500 mt-1">API Error: {apiStatus.message}. Preview generation disabled.</p>
             )}
             {(!characterData.photoUrl && !characterData.generationPrompt && !characterData.useTextToImage) && (
                <p className="text-xs text-orange-500 mt-1">Please upload a photo or provide a description in Step 2 to enable preview generation.</p>
             )}
           </div>
         )}

        {/* Action Buttons */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
             <button
            onClick={handleBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Back
          </button>
           <button
            onClick={handleComplete}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
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

   // --- generateCharacterPreview function (Using Supabase Edge Functions with Enhanced Loading) ---
   const { startLoading, stopLoading, updateProgress, isLoading: isEnhancedLoading } = useLoading();

   const generateCharacterPreview = async (styleApiCode, /* eslint-disable-next-line no-unused-vars */ isHumanCharacter) => {
     console.log('[GeneratePreview] Called with style:', styleApiCode);

     // Mark that we've attempted generation
     setGenerationAttempted(true);

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
     updateGenerationState('processing', 'Preparing character generation...');

     // Start enhanced loading with character generation preset
     const loadingId = startLoading('characterGeneration', {
       title: `Generating ${characterData.name || 'Character'} Preview`,
       message: 'Creating your character in the selected art style...',
       estimatedTime: 60, // 60 seconds for character generation
       steps: [
         'Analyzing uploaded photo',
         'Applying art style transformation', 
         'Generating character preview',
         'Finalizing image'
       ]
     });

     try {
       // Get style description from style code
       const styleDescription = getStyleNameFromCode(styleToUse) || 'colorful, child-friendly illustration style';

       // Update progress through the steps
       updateProgress(loadingId, 25, 'Analyzing uploaded photo and character details...');

       // Use the photo as reference if available
       const photoReference = characterData.photoUrl || null;

       updateProgress(loadingId, 50, `Applying ${styleDescription} art style...`);

       // Generate the character image using Supabase Edge Function
       const generatedImage = await generateCharacterImage(
         { ...characterData, artStyleCode: styleToUse }, // Pass the entire character data object with art style code
         `Use a ${styleDescription} style.`,
         photoReference
       );

       updateProgress(loadingId, 90, 'Finalizing character preview...');

       if (generatedImage) {
         // Update the preview with the generated image
         updatePreviewImage(generatedImage);
         updateGenerationState('complete', 'Character preview generated!');
         
         // Complete loading with success
         stopLoading(loadingId, true, 'Character preview generated successfully!');
       } else {
         throw new Error('Failed to generate character image with Supabase Edge Functions.');
       }
     } catch (error) {
       console.error('[GeneratePreview] Error generating character with Supabase Edge Functions:', error);
       
       // Stop loading with error
       stopLoading(loadingId, false, `Generation failed: ${error.message}`);
       
       handleGenerationError(error, placeholderImage); // Ensure fallback on error
     }
   };
   // --- End generateCharacterPreview function ---

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

   // Cleanup polling on unmount
   // Empty dependency array ensures this runs only on mount and unmount

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

       {/* Global Loading Modal for other operations */}
       <LoadingModal />

       {/* Navigation Buttons are now inside renderConfirmStep for Step 3 */}
       {/* Add general Next button for steps 1 and 2 */}
       {step < 3 && (
          <div className="mt-8 pt-5 border-t border-gray-200">
            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1 || isEnhancedLoading} // Disable on step 1 or if enhanced loading
                className={`py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${step === 1 || isEnhancedLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Back
              </button>
              <button
                  type="button"
                  onClick={handleNext}
                  disabled={isEnhancedLoading} // Disable if enhanced loading
                  className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${isEnhancedLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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