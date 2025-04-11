import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { 
  createImg2ImgTask, 
  createTxt2ImgTask, 
  getTaskProgress, 
  checkApiAccess, 
  getDzineStyles,
  getStyleCode,
  // getKeywordsForDzineStyle, // Removed as it's no longer exported/used
  getStyleNameFromCode,
  getTaskResult // Keep this if used, otherwise remove
} from '../services/dzineService';
import { uploadImageAndGetUrl } from '../services/imageUploadService';

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
    color += ('00' + value.toString(16)).substr(-2);
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

function CharacterWizard({ onComplete, initialStep = 1, bookCharacters = [], forcedArtStyle = null, initialRole = null }) {
  const { characters, addCharacter, updateCharacter } = useCharacterStore();
  const [step, setStep] = useState(initialStep);
  const [error, setError] = useState('');
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
      console.log('Checking Dzine API connectivity...');
      const status = await checkApiAccess();
      console.log('API check result:', status);
      
      setApiStatus({
        checked: true,
        working: status.success,
        message: status.message,
        details: status.details || ''
      });
      
      if (!status.success) {
        console.warn('Dzine API check failed:', status.message);
      }
    } catch (error) {
      console.error('Error checking API:', error);
      setApiStatus({
        checked: true,
        working: false,
        message: `API check error: ${error.message}`
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
    
    // If initial step is provided, set it
    if (initialStep > 1) {
      setStep(initialStep);
      // Unlock all steps up to and including the initial step
      const stepsToUnlock = Array.from({ length: initialStep }, (_, i) => i + 1);
      setUnlockedSteps(stepsToUnlock);
    }

    // Check API status
    checkApiStatus();
  }, [forcedArtStyle, initialRole, initialStep]);
  
  // Character types
  const CHARACTER_TYPES = [
    { id: 'child', name: 'Main Character', description: 'The main character of your story' },
  ];
  
  // Character roles (simplified to just main character)
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
  
  const handleCancel = () => {
    // Reset for next use
    resetCharacterState();
    
    onComplete(null);
  };
  
  const handleBack = () => {
    setError(''); // Clear errors on navigation
    let targetStep = step - 1;
    // --- Skip Step 3 (Appearance) if art style is forced ---
    if (targetStep === 3 && forcedArtStyle) {
      console.log('[NAV] Skipping Step 3 (Appearance) backwards because style is forced');
      targetStep = 2; // Go back to Step 2 (Details) instead
    }
    setStep(targetStep);
  };
  
  const handleNext = () => {
    setError(''); // Clear errors on navigation
    
    // Validation before proceeding
    if (step === 1) { // Details Step
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
    } else if (step === 2) { // Appearance Step
      if (!characterData.useTextToImage && !characterData.photoUrl) {
        setError('Please upload a photo or describe the character.');
        return;
      }
      if (characterData.useTextToImage && !characterData.generationPrompt) {
        setError('Please provide a description for image generation.');
        return;
      }
      // If art style is NOT forced, require selection
      if (!forcedArtStyle && !characterData.artStyle) {
        setError('Please select an art style.');
        return;
      }
    } else if (step === 3) { // Confirm Step
      // Ensure style preview exists before allowing completion
      if (!characterData.stylePreview) {
        setError('Please generate the character style preview before completing.');
        return;
      }
    }
    
    let targetStep = step + 1;
    // --- Skip Step 3 (Appearance) if art style is forced ---
    if (step === 2 && forcedArtStyle) {
      console.log('[NAV] Skipping Step 3 (Appearance) forwards because style is forced');
      targetStep = 4; // Go directly to Step 4 (Confirm)
    }
    
    // Unlock the next step(s)
    const newUnlockedSteps = [...unlockedSteps];
    for (let i = step + 1; i <= targetStep; i++) {
      if (!newUnlockedSteps.includes(i)) {
        newUnlockedSteps.push(i);
      }
    }
    setUnlockedSteps(newUnlockedSteps);
    
    setStep(targetStep);
  };
  
  // Function to handle tab clicks
  const handleTabClick = (tabStep) => {
    if (unlockedSteps.includes(tabStep)) {
      setStep(tabStep);
      setError(''); // Clear errors when switching tabs
    } else {
      console.log(`Step ${tabStep} is locked.`);
      // Optionally provide feedback that the step is locked
    }
  };
  
  const handleSelectExistingCharacter = (character) => {
    // Logic to load existing character data into the wizard
    // This might involve setting characterData state and potentially the step
    console.log('Selected existing character:', character);
    // Example:
    // setCharacterData(character);
    // setStep(4); // Go to confirm step?
    // setUnlockedSteps([1, 2, 3, 4]);
  };
  
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        console.log('UPLOAD DEBUG:', {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          base64Prefix: base64String ? base64String.substring(0, 30) : 'N/A'
        });
        
        setPhotoPreview(base64String); // Show preview immediately
        
        // Update characterData with the Base64 string for potential direct use
        // or before uploading if needed elsewhere
        setCharacterData(prev => ({
          ...prev,
          photoUrl: base64String // Store Base64 directly for now
        }));
        
        // Optionally, upload immediately and store URL (if backend requires URL)
        // This depends on whether Dzine needs Base64 or a URL
        /*
        setIsUploading(true); // Add upload state if needed
        uploadImageAndGetUrl(file)
          .then(url => {
            console.log('UPLOAD COMPLETE:', { url });
            setCharacterData(prev => ({ ...prev, photoUrl: url }));
            setIsUploading(false);
          })
          .catch(err => {
            console.error('Upload failed:', err);
            setError('Failed to upload photo.');
            setIsUploading(false);
            setPhotoPreview(null); // Clear preview on error
          });
        */
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        setError("Failed to read the selected file.");
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Function to open the image preview modal
  const openImagePreview = (imageUrl) => {
    setPreviewImageUrl(imageUrl);
    setShowImagePreview(true);
  };
  
  // Function to close the image preview modal
  const closeImagePreview = () => {
    setShowImagePreview(false);
    setPreviewImageUrl('');
  };
  
  // --- RENDER FUNCTIONS ---
  
  const renderDetailsStep = () => (
    <div className="space-y-4">
      {/* Name Input */}
      <div>
        <label htmlFor="characterName" className="block text-sm font-medium text-gray-700">Character Name</label>
        <input
          type="text"
          id="characterName"
          value={characterData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., Lily, Tom"
        />
      </div>
      
      {/* Type Selection (Simplified) */}
      <div>
        <label htmlFor="characterType" className="block text-sm font-medium text-gray-700">Character Type</label>
        <select
          id="characterType"
          value={characterData.type}
          onChange={(e) => handleChange('type', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="" disabled>Select type...</option>
          <option value="child">Child</option>
          <option value="pet">Pet / Animal</option>
          <option value="magical">Magical Creature</option>
          {/* Add other types as needed */}
        </select>
      </div>
      
      {/* Age Selection */}
      <div>
        <label htmlFor="characterAge" className="block text-sm font-medium text-gray-700">Age</label>
        <select
          id="characterAge"
          value={characterData.age}
          onChange={(e) => handleChange('age', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="" disabled>Select age...</option>
          <option value="toddler">Toddler (1-3)</option>
          <option value="preschooler">Preschooler (3-5)</option>
          <option value="child">Child (6-8)</option>
          <option value="tween">Tween (9-12)</option>
          {/* Add other relevant age groups */}
        </select>
      </div>
      
      {/* Gender Selection */}
      <div>
        <label htmlFor="characterGender" className="block text-sm font-medium text-gray-700">Gender</label>
        <select
          id="characterGender"
          value={characterData.gender}
          onChange={(e) => handleChange('gender', e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="" disabled>Select gender...</option>
          <option value="girl">Girl</option>
          <option value="boy">Boy</option>
          <option value="non-binary">Non-binary</option>
          <option value="unspecified">Unspecified / Not Applicable</option>
        </select>
      </div>
      
      {/* Role Selection (Simplified - Default to Main) */}
      <input type="hidden" value={characterData.role || 'main'} />
      
    </div>
  );
  
  // Helper to get step title
  const getStepTitle = (stepNumber) => {
    switch (stepNumber) {
      case 1: return 'Character Details';
      case 2: return 'Appearance';
      case 3: return 'Style Preview'; // Renamed from Appearance
      case 4: return 'Confirm Character';
      default: return `Step ${stepNumber}`;
    }
  };
  
  const renderAppearanceStep = () => (
    <div className="space-y-6">
      {/* Toggle between Photo Upload and Text Description */}
      <div className="flex items-center space-x-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="appearanceSource"
            checked={!characterData.useTextToImage}
            onChange={() => handleChange('useTextToImage', false)}
            className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
          />
          <span className="ml-2 text-sm text-gray-700">Upload Photo</span>
        </label>
        <label className="flex items-center cursor-pointer">
          <input
            type="radio"
            name="appearanceSource"
            checked={characterData.useTextToImage}
            onChange={() => handleChange('useTextToImage', true)}
            className="form-radio h-4 w-4 text-indigo-600 transition duration-150 ease-in-out"
          />
          <span className="ml-2 text-sm text-gray-700">Describe Character</span>
        </label>
      </div>
      
      {/* Conditional Rendering based on Toggle */}
      {!characterData.useTextToImage ? (
        // Photo Upload Section
        <div>
          <label htmlFor="photoUpload" className="block text-sm font-medium text-gray-700 mb-2">
            Upload a Photo (Optional)
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <span className="inline-block h-20 w-20 rounded-full overflow-hidden bg-gray-100 border">
              {photoPreview ? (
                <img src={photoPreview} alt="Character Preview" className="h-full w-full object-cover" />
              ) : (
                <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </span>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Choose Photo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              id="photoUpload"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">A clear photo helps create a consistent character style.</p>
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
          </select>
          <p className="text-xs text-gray-500 mt-1">Choose the visual style for your character.</p>
        </div>
      )}
      
    </div>
  );
  
   const renderConfirmStep = () => (
     <div className="space-y-4 text-center">
       <h3 className="text-lg font-medium text-gray-900">Confirm Your Character</h3>
       <p className="text-sm text-gray-600">Review the details and the generated style preview.</p>
       
       {/* Display Character Details */}
       <div className="text-left bg-gray-50 p-4 rounded border max-w-md mx-auto">
         <p><strong>Name:</strong> {characterData.name}</p>
         <p><strong>Type:</strong> {characterData.type}</p>
         <p><strong>Age:</strong> {characterData.age}</p>
         <p><strong>Gender:</strong> {characterData.gender}</p>
         <p><strong>Art Style:</strong> {getStyleNameFromCode(characterData.artStyle || forcedArtStyle)}</p>
         {characterData.useTextToImage && <p><strong>Description:</strong> {characterData.generationPrompt}</p>}
       </div>
       
       {/* Display Generated Preview */}
       <div className="mt-4">
         <h4 className="text-md font-medium text-gray-800 mb-2">Style Preview</h4>
         {generationStatus === 'processing' && (
           <div className="flex justify-center items-center flex-col">
             <div className="w-8 h-8 border-t-2 border-blue-500 border-solid rounded-full animate-spin mb-2"></div>
             <p className="text-sm text-gray-500">{progressMessage || 'Generating preview...'}</p>
           </div>
         )}
         {generationStatus === 'error' && error && (
           <p className="text-sm text-red-600">{error}</p>
         )}
         {previewUrl && generationStatus !== 'processing' && (
           <img 
             src={previewUrl} 
             alt="Character Style Preview" 
             className="w-48 h-48 object-cover rounded border shadow-md mx-auto cursor-pointer"
             onClick={() => openImagePreview(previewUrl)} // Open modal on click
           />
         )}
         {/* Show button only if generation hasn't started, failed, or completed */}
         {(generationStatus === 'idle' || generationStatus === 'error' || !previewUrl) && (
           <button
             onClick={() => generateCharacterPreview(characterData.artStyle || forcedArtStyle, characterData.isHuman)}
             disabled={isGenerating || !apiStatus.working || (!characterData.photoUrl && !characterData.generationPrompt)}
             className={`mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
               (!characterData.photoUrl && !characterData.generationPrompt) || !apiStatus.working
                 ? 'bg-gray-400 cursor-not-allowed'
                 : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
             } ${isGenerating ? 'opacity-50 cursor-wait' : ''}`}
           >
             {isGenerating ? 'Generating...' : (previewUrl ? 'Regenerate Preview' : 'Generate Style Preview')}
           </button>
         )}
         {!apiStatus.working && apiStatus.checked && (
            <p className="text-xs text-red-500 mt-1">API Error: {apiStatus.message}. Preview generation disabled.</p>
         )}
         {(!characterData.photoUrl && !characterData.generationPrompt) && (
            <p className="text-xs text-orange-500 mt-1">Please upload a photo or provide a description in Step 2 to enable preview generation.</p>
         )}
       </div>
     </div>
   );
   
   // Main render logic for steps
   const renderStep = () => {
     switch (step) {
       case 1:
         return renderDetailsStep();
       case 2:
         return renderAppearanceStep();
       case 3: // This step is now the Preview Generation step
         return renderConfirmStep(); // Use the confirm step layout for preview generation
       case 4: // Final Confirmation
         return renderConfirmStep(); // Reuse the same layout, but the "Next" button becomes "Complete"
       default:
         return <div>Unknown step</div>;
     }
   };
   
   // --- GENERATION AND POLLING LOGIC ---
   
   // Combined function to handle both Txt2Img and Img2Img based on state
   const generateCharacterImage = async (styleApiCode, prompt, fallbackImage, isHumanCharacter) => {
     clearActiveTasks(); // Clear previous polling
     const generationId = uuidv4(); // Unique ID for this specific generation attempt
     activeGenerationIdRef.current = generationId; // Track this attempt
     
     setGenerationAttempted(true); // Mark that we've tried to generate
     updateGenerationState('processing', 'Starting character image generation...');
     
     try {
       let taskId;
       let taskType; // To know which result structure to expect potentially
       
       // Determine if using Text-to-Image or Image-to-Image
       if (characterData.useTextToImage && prompt) {
         // --- Text-to-Image ---
         taskType = 'txt2img';
         updateProgressInfo('Creating Text-to-Image task...');
         console.log(`[Dzine ${taskType}] Using prompt: ${prompt}, Style: ${styleApiCode}`);
         
         const payload = {
           prompt: prompt.substring(0, 800), // Max 800 chars
           style_code: styleApiCode,
           target_h: 512, // Adjust dimensions as needed
           target_w: 512,
           quality_mode: 1, // High quality
           generate_slots: [1, 0, 0, 0], // Generate one image
           // seed: Date.now(), // Optional: for variability
         };
         taskId = await createTxt2ImgTask(prompt, styleApiCode, { target_w: 512, target_h: 512 });
         
       } else if (characterData.photoUrl) {
         // --- Image-to-Image ---
         taskType = 'img2img';
         updateProgressInfo('Creating Image-to-Image task...');
         
         // Ensure photoUrl is Base64
         let base64Image = characterData.photoUrl;
         if (!base64Image.startsWith('data:image')) {
           // This shouldn't happen if handlePhotoUpload stores Base64, but handle defensively
           console.warn('[Dzine img2img] photoUrl is not a Base64 string, attempting conversion (this indicates an issue).');
           // Attempt conversion or throw error - conversion is complex here, better to ensure it's Base64 earlier
           throw new Error("Input photo is not in Base64 format for Img2Img.");
         }
         
         const payload = {
           image_base64: base64Image,
           style_code: styleApiCode,
           target_h: 512,
           target_w: 512,
           quality_mode: 1,
           generate_slots: [1, 0, 0, 0],
           // style_intensity: 0.7, // Optional: Adjust intensity
         };
         console.log('Img2Img Payload (excluding base64):', JSON.stringify({
           style_code: payload.style_code, target_h: payload.target_h, target_w: payload.target_w, quality_mode: payload.quality_mode, generate_slots: payload.generate_slots
         }));
         taskId = await createImg2ImgTask(base64Image, styleApiCode, { target_w: 512, target_h: 512 });
         
       } else {
         throw new Error("Cannot generate image: No photo uploaded and no text description provided.");
       }
       
       if (!taskId || !taskId.task_id) {
         throw new Error(`Failed to create Dzine ${taskType} task.`);
       }
       
       updateProgressInfo(`Dzine ${taskType} task created: ${taskId.task_id}. Starting polling...`);
       startPollingTask(taskId.task_id, fallbackImage, generationId); // Pass generationId
       
     } catch (error) {
       handleGenerationError(error, fallbackImage);
     }
   };
   
   // --- ADD generateCharacterPreview function ---
   const generateCharacterPreview = async (styleApiCode, isHumanCharacter) => {
     if (!styleApiCode) {
       setError("Please select an art style first.");
       return;
     }
     
     // Determine the prompt or use the uploaded photo
     const prompt = characterData.useTextToImage ? characterData.generationPrompt : null;
     const photo = characterData.useTextToImage ? null : characterData.photoUrl;
     
     if (!prompt && !photo) {
       setError("Please provide a description or upload a photo for the character.");
       return;
     }
     
     // Create a fallback placeholder image based on name/description
     const fallbackBgColor = stringToColor(characterData.name || characterData.generationPrompt || 'fallback');
     const fallbackText = characterData.name || 'Character';
     const fallbackImage = createColorPlaceholder(fallbackBgColor, fallbackText);
     
     // Start the generation process
     await generateCharacterImage(styleApiCode, prompt, fallbackImage, isHumanCharacter);
   };
   // --- END generateCharacterPreview function ---
   
   // --- ADD useFallbackImage function ---
   const useFallbackImage = (fallbackDataUrl) => {
     console.log('[Fallback] Using fallback placeholder image.');
     updatePreviewImage(fallbackDataUrl); // Update the preview state
     // Optionally set a specific error message indicating fallback usage
     setError("Generation failed. Displaying placeholder. You can try again or proceed.");
     updateGenerationState('error', 'Using fallback image due to error.'); // Keep status as error
   };
   // --- END useFallbackImage function ---
   
   // --- REVISED startPollingTask function ---
   const startPollingTask = (taskId, fallbackImage, generationId) => {
     clearActiveTasks(); // Clear any existing intervals
     let pollCount = 0;
     const maxPolls = 30; // Approx 2 minutes (30 * 4s)
     
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
         const progressPercent = result.progress || 0; // Use progress if available
         
         console.log(`[Polling] Task status: "${currentStatus}" (original: "${result.original_status || currentStatus}"), progress: ${progressPercent}`);
         
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
               updateGenerationState('success', 'Character preview generated!');
             } else {
               // Handle conversion failure
               handleGenerationError('Failed to convert final image to Base64.', fallbackImage);
             }
           } else {
             handleGenerationError('Task succeeded but no image URL found in response.', fallbackImage);
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
         // Don't stop polling on network errors immediately, maybe retry?
         // For now, update status but let loop continue up to max attempts
         updateProgressInfo(`Polling error: ${error.message} (${pollCount}/${maxPolls})`);
         if (pollCount >= maxPolls) {
           clearActiveTasks();
           handleGenerationError(`Polling failed after multiple errors: ${error.message}`, fallbackImage);
         }
       }
     }, 4000); // Poll every 4 seconds
   };
   // --- END REVISED startPollingTask function ---
   
   // Cleanup polling on unmount
   useEffect(() => {
     return () => {
       clearActiveTasks();
     };
   }, []);
   
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
           {[1, 2, 3, 4].map((stepNum) => (
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
       
       {/* Error Display */}
       {error && (
         <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
           {error}
         </div>
       )}
       
       {/* Navigation Buttons */}
       <div className="mt-8 pt-5 border-t border-gray-200">
         <div className="flex justify-between">
           <button
             type="button"
             onClick={handleBack}
             disabled={step === 1}
             className={`py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${step === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
             Back
           </button>
           
           {step < 4 ? (
             <button
               type="button"
               onClick={handleNext}
               className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
             >
               Next
             </button>
           ) : (
             <button
               type="button"
               onClick={handleComplete}
               disabled={isGenerating || !characterData.stylePreview} // Disable if generating or no preview
               className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
                 !characterData.stylePreview || isGenerating
                   ? 'bg-gray-400 cursor-not-allowed'
                   : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
               } ${isGenerating ? 'opacity-50 cursor-wait' : ''}`}
             >
               {isGenerating ? 'Processing...' : 'Add Character'}
             </button>
           )}
         </div>
       </div>
       
       {/* Image Preview Modal */}
       <ImagePreviewModal 
         isOpen={showImagePreview} 
         imageUrl={previewImageUrl} 
         onClose={closeImagePreview} 
       />
     </div>
   );
 }
 
 export default CharacterWizard;