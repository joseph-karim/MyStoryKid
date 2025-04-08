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
  getKeywordsForDzineStyle,
  getStyleNameFromCode,
  getTaskResult
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
  const pollingSessionRef = useRef({});
  
  // Add state for tabs based navigation
  const [unlockedSteps, setUnlockedSteps] = useState([1]);
  
  // Character data
  const [characterData, setCharacterData] = useState(defaultCharacterData);
  
  // Add state for image preview modal
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  
  // --- ADDED STATE: Track generation attempt ---
  const [generationAttempted, setGenerationAttempted] = useState(false);
  
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
    // -----------------------------------------------------
    setStep(prev => Math.max(1, targetStep));
  };
  
  const handleNext = () => {
    console.log('[CharacterWizard] handleNext() called, current step:', step);
    
    // Validation for Step 1: Details
    if (step === 1) {
      if (!characterData.name) {
        setError('Please enter a name for your character.');
        return;
      }
    
      setUnlockedSteps(prev => [...new Set([...prev, 2])]);
      setStep(2);
    }
    // Validation for Step 2: Photo & Style
    else if (step === 2) {
      // For photo, we also need a style choice
      if (!characterData.photoUrl) {
        setError('Please upload or select a photo for your character.');
        return;
      }
      
      // Check for forced art style or user selected style
      if (forcedArtStyle) {
        console.log('[CharacterWizard] Using forced art style:', forcedArtStyle);
        console.log('[CharacterWizard] Style keywords:', getKeywordsForDzineStyle(forcedArtStyle));
        // Update the character data with the forced art style
        setCharacterData(prevData => ({
          ...prevData,
          artStyle: forcedArtStyle // Make sure this is set
        }));
      } else if (!characterData.artStyle) {
        setError('Please select an art style for your character.');
        return;
      }
      
      console.log(`[CharacterWizard] Selected/Forced art style: ${characterData.artStyle || forcedArtStyle}`);
      setError(''); // Clear any errors
      setUnlockedSteps(prev => [...new Set([...prev, 3])]);
      
      // Generate preview image based on selected or forced style
      const styleToUse = forcedArtStyle || characterData.artStyle;
      const isHumanCharacter = !characterData.type || characterData.type === 'magical_child' || characterData.type === 'child';
      
      // Generate a preview with the photo and style
      generateCharacterPreview(styleToUse, isHumanCharacter);
      
      setStep(3);
    }
  };
  
  // Auto-generate preview when entering step 3 (Confirm step)
  useEffect(() => {
    // Log dependencies for debugging
    console.log(`[EFFECT CHECK] Step: ${step}, isGenerating: ${isGenerating}, generationAttempted: ${generationAttempted}, hasStylePreview: ${!!characterData.stylePreview}, hasForcedStyle: ${!!forcedArtStyle}, hasPhotoUrl: ${!!characterData.photoUrl}, hasGenPrompt: ${!!characterData.generationPrompt}`);
    
    // --- UPDATED CONDITION: Check generationAttempted flag --- 
    if (step === 3 && !isGenerating && !generationAttempted && !characterData.stylePreview) { 
    // -------------------------------------------------------
      
      // Style MUST come from the forcedArtStyle prop now
      const styleToUse = forcedArtStyle;
      
      // Check if we have the required style AND either photo or description prompt
      const hasPhotoOrDesc = characterData.photoUrl || characterData.generationPrompt;
      
      if (styleToUse && hasPhotoOrDesc) {
        // --- ADDED LOG --- 
        console.log(`[EFFECT - PRE-GENERATION CHECK] Triggering generation. Style code received via forcedArtStyle prop: ${styleToUse}`);
        // -----------------
        console.log(`[EFFECT] Step 3 reached & dependencies met, using style: ${styleToUse}`);
        // Mark that we are attempting generation
        setGenerationAttempted(true); // <-- Set attempt tracker
        
        // PASS the correct isHuman flag to the generation function
        generateCharacterPreview(styleToUse, characterData.isHuman);
      } else {
        console.warn(`[EFFECT] Step 3 reached, but generation prerequisites not met: hasForcedStyle=${!!styleToUse}, hasPhotoOrDesc=${hasPhotoOrDesc}`);
        // Set error if required elements are missing when reaching confirm step
        if (!styleToUse) setError('Error: Art style was not provided to the wizard.');
        else if (!hasPhotoOrDesc) setError('Error: Photo or Description was not provided.');
      }
    }
    // Add characterData.isHuman to dependency array to ensure effect re-runs if it changes
    // Add generationAttempted to dependencies
  }, [step, forcedArtStyle, characterData.photoUrl, characterData.generationPrompt, characterData.isHuman, isGenerating, characterData.stylePreview, generationAttempted]);

  // --- ADDED EFFECT: Reset generationAttempted if inputs change --- 
  useEffect(() => {
    // Reset the attempt flag if relevant inputs change, allowing a new attempt
    setGenerationAttempted(false);
  }, [forcedArtStyle, characterData.photoUrl, characterData.generationPrompt]);
  // --------------------------------------------------------------
  
  // Add a function to handle tab navigation
  const handleTabClick = (tabStep) => {
    // Only allow navigation to unlocked steps
    if (unlockedSteps.includes(tabStep)) {
      setStep(tabStep);
    }
  };
  
  // Handle selecting an existing character
  const handleSelectExistingCharacter = (character) => {
    setCurrentCharacter(character);
    setPhotoPreview(character.photoUrl);
    setStep(4); // Skip to preview
  };
  
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.error('No file selected');
      return;
    }
    
    // Debug log the file details
    console.log('UPLOAD DEBUG:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      lastModified: file.lastModified
    });
    
    // Check file size
    if (file.size > 10 * 1024 * 1024) {
      setError('Please upload a photo smaller than 10MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result;
      if (typeof imageData === 'string') {
        // Debug log the image data
        console.log('IMAGE DATA DEBUG:', {
          dataLength: imageData.length,
          dataType: typeof imageData,
          isBase64: imageData.startsWith('data:image'),
          preview: imageData.substring(0, 50) + '...'
        });
        
        // Store the image data in both places to be safe
        setPhotoPreview(imageData);
      setCharacterData(prev => ({
        ...prev,
          photoUrl: imageData,
          // Also store in baseImage for backward compatibility
          baseImage: imageData
        }));
        
        // Clear any existing generation prompt since we're using a photo
        handleChange('generationPrompt', '');
        // Set useTextToImage to false since we're using a photo
        handleChange('useTextToImage', false);
        
        // Debug log the final state
        console.log('UPLOAD COMPLETE:', {
          hasPhotoPreview: !!imageData,
          photoUrlSet: true,
          imageLength: imageData.length
        });
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      setError('Error reading the uploaded file. Please try again.');
    };
    
    reader.readAsDataURL(file);
    
    // Clear the file input to allow uploading the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Function to open the image preview modal
  const openImagePreview = (imageUrl) => {
    if (!imageUrl) return;
    setPreviewImageUrl(imageUrl);
    setShowImagePreview(true);
  };
  
  // Function to close the image preview modal
  const closeImagePreview = () => {
    setShowImagePreview(false);
  };
  
  // Step 1: Basic character details (simplified)
  const renderDetailsStep = () => {
    console.log('[Render] renderDetailsStep');
    return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-4">Character Details</h2>
        
        <div className="space-y-4">
          {/* Character Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Character Name
            </label>
            <input
              type="text"
              id="name"
              value={characterData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter character name"
              required
            />
          </div>

          {/* Set type to 'child' by default - no need to show options */}
          <input 
            type="hidden" 
            name="characterType" 
            value="child" 
            onChange={() => handleChange('type', 'child')}
          />

          {/* --- Is Human Toggle --- */}
          <div className="mb-4 pt-2 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Character Type</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="radio" 
                  name="isHuman" 
                  checked={characterData.isHuman === true} 
                  onChange={() => handleChange('isHuman', true)} 
                  className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span>Human Character</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="radio" 
                  name="isHuman" 
                  checked={characterData.isHuman === false} 
                  onChange={() => handleChange('isHuman', false)} 
                  className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span>Creature/Animal</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">Select 'Creature/Animal' if this character isn't human.</p>
          </div>
          {/* --- END: Is Human Toggle --- */}

          {/* Age and Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age
              </label>
              <input
                type="text"
                id="age"
                value={characterData.age || ''}
                onChange={(e) => handleChange('age', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., 5, Adult, Young"
              />
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender (Optional)
              </label>
              <select
                id="gender"
                value={characterData.gender || ''}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select gender</option>
                <option value="Boy">Boy</option>
                <option value="Girl">Girl</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Other">Other/Not applicable</option>
              </select>
            </div>
          </div>
        </div>
            
        {/* Navigation Buttons for Step 1 */}
        <div className="flex justify-end pt-4 mt-6 border-t border-gray-200">
          <button
            onClick={handleNext}
            className={`px-6 py-2 bg-blue-600 text-white rounded ${!characterData.name ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            disabled={!characterData.name}
          >
            Next: Appearance
          </button>
        </div>
      </div>
    );
  };
  
  // Modify the step titles to be clearer
  const getStepTitle = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        return "Details";
      case 2:
        return "Photo/Style";
      case 3:
        return "Confirm";
      default:
        return `Step ${stepNumber}`;
    }
  };
  
  // Update the appearance step to remove style selection entirely
  const renderAppearanceStep = () => {
    console.log('[Render] renderAppearanceStep - Start'); // Log Start
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* REMOVED: Style Selection Section */}
        
         {/* --- Photo vs Description Choice --- */}
         <div className={`mt-0 pt-0`}> 
           <h2 className="text-2xl font-bold mb-4">Provide Character Source</h2>
           <p className="text-sm text-gray-600 mb-4">Choose how to generate the character image. The art style is pre-selected.</p>
           <div className="space-y-4">
             {/* Photo Upload Option */}
             {console.log('[Render] renderAppearanceStep - Before Photo Upload Block')} {/* Log Before */}
             <div 
               className={`border rounded-lg p-4 cursor-pointer transition-colors ${!characterData.useTextToImage ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:bg-gray-50'}`}
               onClick={() => handleChange('useTextToImage', false)}
             >
               <div className="flex items-center">
                 <input
                   type="radio"
                   name="generationMethod"
                   id="photoUpload"
                   checked={!characterData.useTextToImage}
                   onChange={() => handleChange('useTextToImage', false)}
                   className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 mr-3"
                 />
                 <label htmlFor="photoUpload" className="font-medium text-gray-700 cursor-pointer">Upload a Photo (Recommended for Likeness)</label>
               </div>
               
               {/* Photo upload box */}
               {!characterData.useTextToImage && (
                 <div className="mt-4 pl-7">
                   <div 
                     className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
                     onClick={(e) => {
                       e.stopPropagation(); 
                       fileInputRef.current && fileInputRef.current.click();
                     }}
                >
                  {photoPreview ? (
                        <div className="flex flex-col items-center">
                      <img 
                        src={photoPreview} 
                              alt="Character Preview" 
                              className="w-32 h-32 object-cover rounded-md mb-2 shadow"
                      />
                      <button 
                              className="text-sm text-blue-600 hover:text-blue-800"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoPreview(null);
                                handleChange('photoUrl', null);
                        }}
                      >
                              Remove Photo
                      </button>
                    </div>
                  ) : (
                        <div className="flex flex-col items-center text-gray-500">
                          <svg className="mx-auto h-12 w-12 " fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 10v6m3-3h-6"></path></svg>
                          <span className="mt-2 block text-sm font-medium">
                            Click to upload a photo
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</span>
                    </div>
                  )}
                   </div>
                  <input
                    type="file"
                     accept="image/png, image/jpeg, image/webp"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                     style={{ display: 'none' }} 
                  />
                </div>
               )}
              </div>
              
             {/* Text Description Option */}
             {console.log('[Render] renderAppearanceStep - Before Text Description Block')} {/* Log Before */}
             <div 
               className={`border rounded-lg p-4 cursor-pointer transition-colors ${characterData.useTextToImage ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:bg-gray-50'}`}
               onClick={() => handleChange('useTextToImage', true)}
             >
               <div className="flex items-center">
                 <input
                   type="radio"
                   name="generationMethod"
                   id="textDescription"
                   checked={characterData.useTextToImage}
                   onChange={() => handleChange('useTextToImage', true)}
                   className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 mr-3"
                 />
                 <label htmlFor="textDescription" className="font-medium text-gray-700 cursor-pointer">Generate from Description</label>
                      </div>
               
               {/* Textarea */} 
               {characterData.useTextToImage && (
                 <div className="mt-4 pl-7"> 
                   <textarea
                     value={characterData.generationPrompt}
                     onChange={(e) => handleChange('generationPrompt', e.target.value)}
                     placeholder="Describe the character's appearance..."
                     className="w-full p-3 border border-gray-300 rounded-md h-32 focus:ring-blue-500 focus:border-blue-500"
                   />
                    </div>
               )}
                </div>
              </div>
            </div>
            
         {/* Navigation Buttons */}
         {console.log('[Render] renderAppearanceStep - Before Navigation Buttons')} {/* Log Before */}
         <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
              <button
               onClick={handleBack}
               className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
             >
               Back
              </button>
              <button
               onClick={handleNext}
               className={`px-6 py-2 bg-blue-600 text-white rounded ${ 
                 (!characterData.useTextToImage && !characterData.photoUrl) || (characterData.useTextToImage && !characterData.generationPrompt)
                 ? 'opacity-50 cursor-not-allowed' 
                 : 'hover:bg-blue-700'}`}
               disabled={(!characterData.useTextToImage && !characterData.photoUrl) || (characterData.useTextToImage && !characterData.generationPrompt)}
             >
               Next
              </button>
            </div>
          {console.log('[Render] renderAppearanceStep - End')} {/* Log End */}
          </div>
     );
   };
   
   // Add back renderConfirmStep function ---
   const renderConfirmStep = () => {
     console.log('[Render] renderConfirmStep');
     // Use previewUrl which should now hold the URL from the upload service
     const displayPreviewUrl = previewUrl || characterData.stylePreview; 

     return (
       <div className="space-y-6 animate-fadeIn">
         <h2 className="text-2xl font-bold mb-4">Preview Character</h2>
         
         {isGenerating ? (
           <div className="flex flex-col items-center justify-center py-10">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
             <p className="text-gray-600">{progressMessage || 'Creating your character...'}</p>
           </div>
         ) : displayPreviewUrl ? (
           <div className="bg-white rounded-lg shadow overflow-hidden">
             <div className="p-4 flex flex-col items-center">
               <div className="w-64 h-64 overflow-hidden rounded-lg mb-4 border-2 border-gray-200 shadow-inner">
                  {/* Ensure img src uses the displayPreviewUrl */}
                  <img 
                     src={displayPreviewUrl} 
                     alt={characterData.name}
                     className="w-full h-full object-contain bg-gray-100" // Added bg for potential transparency
                     onError={(e) => { e.target.src = createColorPlaceholder('#eeeeee', 'Preview Error'); }} // Basic error fallback
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
                 <div className="mt-4 w-full p-3 bg-gray-50 rounded-md border border-gray-200">
                   <p className="text-xs italic text-gray-500">Based on: "{characterData.generationPrompt.substring(0, 100)}{characterData.generationPrompt.length > 100 ? '...' : ''}"</p>
                 </div>
               )}
             </div>
           </div>
         ) : (
           <div className="bg-gray-100 rounded-lg p-6 text-center border border-dashed border-gray-300">
             <p className="text-gray-600">Preview not available.</p>
             {/* Optionally add a button to retry generation if applicable */}
           </div>
         )}
         
         <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
           <button
             onClick={handleBack}
             className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
             disabled={isGenerating}
           >
             Back
           </button>
           <button
             onClick={handleComplete} // Use the handleComplete function passed via props or defined
             className={`px-6 py-2 bg-blue-600 text-white rounded ${!displayPreviewUrl || isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
             disabled={!displayPreviewUrl || isGenerating}
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
       case 3: return renderConfirmStep(); // Ensure this calls the function above
       default: 
         console.warn("Unknown step in renderStep, defaulting to 1");
         setStep(1);
         return renderDetailsStep(); 
     }
   };
   
   // --- Re-integrate generateCharacterImage function --- 
   const generateCharacterImage = async (styleApiCode, prompt, fallbackImage, isHumanCharacter) => {
     // Style validation
     if (!styleApiCode || !styleApiCode.startsWith('Style-')) {
       console.error('Invalid or missing style API code passed to generateCharacterImage:', styleApiCode);
       setError('An invalid art style was specified.');
       setIsGenerating(false);
       setGenerationStatus('error'); 
       updateProgressInfo('Error: Invalid style.');
       useFallbackImage(fallbackImage); // Use fallback on error
       return; 
     }
     
     const generationId = uuidv4(); 
     activeGenerationIdRef.current = generationId; // Track this generation attempt
     let operationType = ''; 
     
     try {
       setIsGenerating(true);
       setGenerationStatus('processing'); 
       updateProgressInfo('Starting generation task...');
       
       let taskResponse;
       
       if (characterData.useTextToImage) {
         // --- Text-to-Image Logic --- 
         operationType = 'Text-to-Image';
         console.log(`[API CALL] Generating ${operationType} with Style Code:`, styleApiCode);
         
         if (!prompt) {
           throw new Error('Description (prompt) is required for Text-to-Image.');
         }
         
         // Enhance prompt slightly if needed
         let enhancedPrompt = prompt;
         if (characterData.name && !enhancedPrompt.includes(characterData.name)) {
             enhancedPrompt = `${characterData.name}, ${enhancedPrompt}`;
         }
         enhancedPrompt += ", high quality illustration"; // Add quality modifier
         
         const payload = {
           prompt: enhancedPrompt.substring(0, 800), 
           style_code: styleApiCode,
           target_h: 1024, // Example size
           target_w: 1024,
           quality_mode: 1, 
           output_format: 'webp',
           seed: Math.floor(Math.random() * 2147483647) + 1,
           negative_prompt: 'low quality, blurry, bad anatomy'
         };
         
         console.log('Txt2Img Payload:', JSON.stringify(payload, null, 2));
         taskResponse = await createTxt2ImgTask(payload); // Call the service
         
       } else {
         // --- Image-to-Image Logic --- 
         operationType = 'Image-to-Image';
         console.log(`[API CALL] Generating ${operationType} with Style Code:`, styleApiCode);
         
         if (!characterData.photoUrl) {
           throw new Error('Photo is required for Image-to-Image.');
         }

         if (!characterData.photoUrl.startsWith('data:image')) {
            throw new Error('Invalid photo data format for Image-to-Image. Expected Base64 data URL.');
         }
         
         // Construct prompt for Img2Img
         const imgPrompt = prompt || `Character portrait of ${characterData.name || 'person'} in the selected style`;

         const payload = {
           style_code: styleApiCode, 
           prompt: imgPrompt.substring(0, 800),
           images: [{ base64_data: characterData.photoUrl }],
           quality_mode: 1, 
           output_format: 'webp',
           negative_prompt: 'ugly, deformed, disfigured, poor quality, blurry, nsfw',
           seed: Math.floor(Math.random() * 2147483647) + 1,
           // Pass isHumanCharacter flag to the API call wrapper if needed
         };
         
         console.log('Img2Img Payload (excluding base64):', JSON.stringify({
              ...payload,
              images: [{ base64_data: 'base64_data_present' }]
            }, null, 2));
         taskResponse = await createImg2ImgTask(payload, isHumanCharacter);
       }
       
       // --- Common Task Handling --- 
       if (!taskResponse || !taskResponse.task_id) {
         throw new Error(`Failed to create ${operationType} task. No task ID received.`);
       }
       
       const taskId = taskResponse.task_id;
       console.log(`${operationType} Task created with ID:`, taskId);
       
       // Use photo as fallback for img2img, generate placeholder for txt2img
       const actualFallback = characterData.useTextToImage 
           ? createColorPlaceholder(stringToColor(characterData.name || 'fallback'), characterData.name || 'Generating...') 
           : fallbackImage; // Use the photo passed in as fallback for img2img
           
       // Call startPollingTask correctly
       startPollingTask(taskId, actualFallback, generationId);
       
     } catch (error) {
       console.error(`API error during ${operationType || 'generation'} process:`, error);
       // Ensure state is updated correctly on error
       if(activeGenerationIdRef.current === generationId) { // Only update if it's the current task
          setIsGenerating(false);
          setGenerationStatus('error');
          setError(`Generation failed: ${error.message}. Please try again or contact support.`);
          updateProgressInfo('Error occurred during generation');
          useFallbackImage(fallbackImage); // Use fallback on error
       }
     }
   };
   // --- End generateCharacterImage function ---

   // --- Update generateCharacterPreview to CALL generateCharacterImage --- 
   const generateCharacterPreview = async (styleApiCode, isHumanCharacter) => {
     // REMOVED: setIsGenerating, setError etc. - Moved to generateCharacterImage
     // REMOVED: generationAttempted check - Let generateCharacterImage handle initial state
     console.log('[GeneratePreview] Called with style:', styleApiCode);

     const styleToUse = forcedArtStyle || styleApiCode;
     if (!styleToUse) {
       setError('Error: No art style provided for preview generation.');
       return;
     }

     let promptText = '';
     if (characterData.useTextToImage && characterData.generationPrompt) {
       promptText = characterData.generationPrompt;
     } else if (characterData.photoUrl) {
       // Prompt for img2img can be simpler
       promptText = `Character portrait of ${characterData.name || 'person'} in the selected style`;
     } else {
       setError('Error: Need either a photo or a description to generate preview.');
       return;
     }

     // Fallback image for img2img should be the original photo itself
     // Fallback for txt2img is generated by generateCharacterImage
     const fallback = characterData.photoUrl; 

     // Reset generationAttempted for this specific call? Or manage elsewhere?
     // setGenerationAttempted(true); // This is likely set in the useEffect hook already

     // CALL the reinstated function
     await generateCharacterImage(styleToUse, promptText, fallback, isHumanCharacter);
   };
   // --- End generateCharacterPreview update ---

   // --- Add back useFallbackImage function ---
   const useFallbackImage = (fallbackImage) => {
     // Update the main character data state
     setCharacterData(prev => ({
       ...prev,
       stylePreview: fallbackImage // Use the provided fallback
     }));
     // Update the local preview state for immediate display
     setPreviewUrl(fallbackImage); 
     updateProgressInfo('Using placeholder image due to error.'); // Use consistent helper
     // Update generation status state if it exists
     if (typeof setGenerationStatus === 'function') { 
        setGenerationStatus('fallback'); // Or 'error', depending on desired state
     }
     // Ensure isGenerating is false
     setIsGenerating(false);
     console.warn('[Fallback] Applied fallback image.');
   };
   // --- End useFallbackImage function ---

   // ... rest of component, including startPollingTask, renderConfirmStep, etc. ...

  // Define the ImagePreviewModal component locally
  const ImagePreviewModal = ({ isOpen, imageUrl, onClose }) => {
    if (!isOpen) return null;
    
    return (
      <AnimatePresence>
        {isOpen && (
          <div 
             className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-75" // Increased z-index
             onClick={onClose} // Close on overlay click
           >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="relative max-w-3xl max-h-[85vh] bg-white rounded-lg shadow-xl overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
            >
              <button
                onClick={onClose}
                className="absolute top-2 right-2 z-10 p-1 bg-white bg-opacity-70 rounded-full text-gray-600 hover:bg-opacity-100 hover:text-gray-900"
                aria-label="Close image preview"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="p-2 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt="Character Preview"
                  className="block max-w-full max-h-[80vh] object-contain rounded"
                 />
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create Character</h2>
        {/* Optional: Keep Cancel button if needed, depends on usage context */}
        {/* <button ... onClick={handleCancel} ... /> */}
      </div>
              
      {/* REMOVE Internal Tabs Navigation */}
      {/* <div className="flex border-b mb-4"> ... stepsConfig.map ... </div> */}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
         </div>
      )}
      
      {/* Render active step content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step} // Ensures animation runs on step change
          initial={{ opacity: 0, x: step > (step - 1) ? 50 : -50 }} // Slide direction based on nav
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: step > (step - 1) ? -50 : 50 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
      
      {/* Render Image Preview Modal */}
      <ImagePreviewModal 
        isOpen={showImagePreview} 
        imageUrl={previewImageUrl}
        onClose={closeImagePreview} 
      />
    </div>
  );
}

export default CharacterWizard; 