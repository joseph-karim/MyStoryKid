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
import { uploadImageAndGetUrl } from '../../services/imageUploadService';

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
   
   // Modified renderStep to avoid adding duplicate navigation buttons
   const renderStep = () => {
     switch (step) {
       case 1: return renderDetailsStep();
       case 2: return renderAppearanceStep(); // Appearance/Photo step
       case 3: return renderConfirmStep(); // Confirm step (renders preview)
       default: return <div>Unknown step</div>;
     }
   };
   
   // Update the generateCharacterPreview function signature
   const generateCharacterPreview = async (styleApiCode, isHumanCharacter) => {
     try {
       console.log('[CharacterWizard] Generating preview with style:', styleApiCode);
       console.log('[CharacterWizard] Style keywords:', getKeywordsForDzineStyle(styleApiCode));
       // Log that we're setting state accordingly
       setIsGenerating(true);
       setProgressMessage('Creating image with selected style...');

       // Clear any previous errors
       setError('');

       // If we've already attempted generation, skip to avoid multiple attempts
       if (generationAttempted) {
         console.log('[GeneratePreview] Generation already attempted, skipping duplicate call');
         setStep(3); // Just advance to confirm step
         return;
       }

       // Use the forced art style if provided, otherwise use the selected style
       const styleToUse = forcedArtStyle || styleApiCode;
       console.log('[GeneratePreview] Using style code:', styleToUse);
       
       if (!styleToUse) {
         console.error('[GeneratePreview] No style provided for character preview generation');
         setError('Please select an art style for your character.');
         return;
       }

       // Use either the text description or generate a prompt from character data
       let promptText = '';
       if (characterData.useTextToImage && characterData.generationPrompt) {
         promptText = characterData.generationPrompt;
       } else {
         // Build a prompt from character attributes
         promptText = `Character portrait of ${characterData.name}, ${characterData.age} years old, ${characterData.gender || 'person'}, ${characterData.traits?.join(', ') || 'friendly'}`;
       }

       // Create a fallback image (placeholder) based on the character's name
       const fallbackImageBase64 = createColorPlaceholder(
         stringToColor(characterData.name || 'Character'), 
         characterData.name || 'Character'
       );
       
       setGenerationAttempted(true);
       await generateCharacterImage(styleToUse, promptText, fallbackImageBase64, isHumanCharacter);
     } catch (error) {
       console.error(`API error during preview generation:`, error);
       setIsGenerating(false);
       setError(`Generation failed: ${error.message}. Please try again or contact support.`);
       setProgressMessage('Error occurred during generation');
     }
   };
   
   // Helper function to use fallback image
   const useFallbackImage = (fallbackImage) => {
     setCharacterData(prev => ({
       ...prev,
       stylePreview: fallbackImage
     }));
     
     setProgressMessage('Using placeholder image due to API issues');
     setIsGenerating(false);
   };
   
   // Helper function used within polling & generation
   const updateProgressInfo = (message) => {
     console.log(`[Progress Update] ${message}`);
     setProgressMessage(message);
   };

   // Start polling for task progress
   const startPollingTask = async (taskId, fallbackImage, generationId) => {
     if (!taskId) {
       console.error('[Polling] Invalid task ID for polling');
       setError('Error: Invalid task ID received from generation service.');
       setGenerationStatus('error');
       setIsGenerating(false);
       useFallbackImage(fallbackImage);
       return;
     }

     console.log(`[Polling] Starting polling for Dzine task ID: ${taskId}, Generation ID: ${generationId}`);
     updateProgressInfo('Dzine task started. Waiting for preview... (0%)'); 
     setIsGenerating(true);
     setGenerationStatus('processing');

     let pollInterval = null;
     let attempts = 0;
     const maxAttempts = 60; // Poll for max 3 minutes (60 * 3s)
     let lastProgress = 0;

     // Clear any previous interval before starting a new one
     if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        console.log('[Polling] Cleared previous polling interval.');
     }

     const pollNextTime = async () => {
       if (activeGenerationIdRef.current !== generationId) {
          console.log(`[Polling] Stopping poll for ${taskId} (Gen ID: ${generationId}) as a new generation (${activeGenerationIdRef.current}) has started.`);
          clearInterval(pollIntervalRef.current);
          return;
       }

       attempts++;
       if (attempts > maxAttempts) {
         console.error(`[Polling] Task ${taskId} timed out after ${maxAttempts} attempts.`);
         clearInterval(pollIntervalRef.current);
         if (activeGenerationIdRef.current === generationId) {
             setError('Preview generation timed out. Please try again.');
             setGenerationStatus('error');
             setIsGenerating(false);
             useFallbackImage(fallbackImage);
         }
         return;
       }

       try {
         console.log(`[Polling] Attempt ${attempts}: Getting progress for task ${taskId}...`);
         const progressData = await getTaskProgress(taskId);
         console.log(`[Polling] Progress data for ${taskId}:`, progressData);

         if (activeGenerationIdRef.current !== generationId) {
           console.log(`[Polling] Ignoring result for ${taskId} as it's from an old generation.`);
           clearInterval(pollIntervalRef.current);
           return;
         }

         if (progressData && progressData.data) {
           const { status, progress, eta } = progressData.data;
           lastProgress = progress !== null && progress !== undefined ? progress : lastProgress;
           updateProgressInfo(`Generating preview... (${Math.round(lastProgress * 100)}%) Estimated time: ${eta || 'N/A'}s`); 

           if (status === 'SUCCESS') {
             console.log(`[Polling] Task ${taskId} status is SUCCESS. Fetching result...`);
             clearInterval(pollIntervalRef.current);
             const resultData = await getTaskResult(taskId);
             console.log(`[Polling] Task ${taskId} result:`, resultData);

              if (activeGenerationIdRef.current !== generationId) {
                 console.log(`[Polling] Ignoring SUCCESS result for ${taskId} - generation changed.`);
                 return;
              }

             if (resultData && resultData.code === 200 && resultData.data?.status === 'SUCCESS' && resultData.data?.images?.[0]) {
               const base64Preview = resultData.data.images[0];
               console.log('[Polling] Success! Received Base64 preview.');

               // **** UPLOAD BASE64 TO GET URL ****
               try {
                 updateProgressInfo('Finalizing character preview...');
                 console.log('[CharacterWizard] Uploading Dzine preview to get URL...');
                 const imageUrl = await uploadImageAndGetUrl(base64Preview);
                 console.log('[CharacterWizard] Upload complete. Received URL:', imageUrl);

                 setPreviewUrl(imageUrl);
                 updateCharacterPreview(characterData.id, imageUrl);
                 setGenerationStatus('success');
                 updateProgressInfo('Character preview ready!');
                 setIsGenerating(false);

               } catch (uploadError) {
                 console.error('[CharacterWizard] Failed to upload image preview:', uploadError);
                 // Keep existing state updates on upload error
                 if (activeGenerationIdRef.current === generationId) { 
                     setError(`Failed to prepare image preview URL: ${uploadError.message}`);
                     setGenerationStatus('error');
                     setIsGenerating(false);
                     useFallbackImage(fallbackImage);
                 }
               }
               // **** END UPLOAD LOGIC ****

             } else {
               console.error(`[Polling] Task ${taskId} result fetching failed or format unexpected.`, resultData);
               if (activeGenerationIdRef.current === generationId) {
                   setError('Failed to retrieve valid image result after success status.');
                   setGenerationStatus('error');
                   setIsGenerating(false);
                   useFallbackImage(fallbackImage);
               }
             }

           } else if (status === 'FAILED') {
             console.error(`[Polling] Task ${taskId} failed. Error: ${progressData.data.error_message || 'Unknown error'}`);
             clearInterval(pollIntervalRef.current);
              if (activeGenerationIdRef.current === generationId) {
                 setError(`Preview generation failed: ${progressData.data.error_message || 'Please try again'}`);
                 setGenerationStatus('error');
                 setIsGenerating(false);
                 useFallbackImage(fallbackImage);
              }

           } else if (status === 'PENDING' || status === 'PROCESSING') {
             console.log(`[Polling] Task ${taskId} status: ${status}. Progress: ${lastProgress}%. Waiting...`);
           } else {
             console.warn(`[Polling] Task ${taskId} has unexpected status: ${status}. Stopping poll.`);
             clearInterval(pollIntervalRef.current);
              if (activeGenerationIdRef.current === generationId) {
                 setError(`Unexpected generation status: ${status}`);
                 setGenerationStatus('error');
                 setIsGenerating(false);
                 useFallbackImage(fallbackImage);
              }
           }
         } else {
           console.warn(`[Polling] Received empty progress data for task ${taskId}. Retrying...`);
         }
       } catch (error) {
         console.error(`[Polling] Error during polling task ${taskId} (Attempt ${attempts}):`, error);
         if (attempts >= maxAttempts) {
           clearInterval(pollIntervalRef.current);
           if (activeGenerationIdRef.current === generationId) {
               setError(`Polling failed after multiple attempts: ${error.message}`);
               setGenerationStatus('error');
               setIsGenerating(false);
               useFallbackImage(fallbackImage);
           }
         }
       }
     }; // End of pollNextTime definition

     pollNextTime();
     pollIntervalRef.current = setInterval(pollNextTime, 3000);
   }; // End of startPollingTask function definition

   // ... (handleGeneratePreview function - update the call to pollForTaskResult if needed) ...
   const handleGeneratePreview = async () => {
       // ... (existing setup to call createImg2ImgTask) ...
       try {
          // ... (call createImg2ImgTask and get taskId) ...
          
          // Start polling with the received task ID
          if (taskId) {
             pollForTaskResult(taskId);
          } else {
             throw new Error('Task ID not received from Dzine API.');
          }
       } catch (error) {
          // ... (error handling) ...
       }
   };

   // ... (rest of the component, including onComplete which uses the store state) ...
   const onComplete = () => {
       console.log('[CharacterWizard] Invoking completion callback...');
       // Get the potentially updated character data from the store
       const currentStoreCharacter = useBookStore.getState().wizardState.storyData.bookCharacters.find(c => c.id === characterData.id);
       if (currentStoreCharacter) {
           console.log('[CharacterWizard] Character completed:', currentStoreCharacter);
           completeCharacterCreation(currentStoreCharacter);
       } else {
           console.error('[CharacterWizard] Could not find updated character in store on completion');
           // Fallback to local state or handle error
           completeCharacterCreation({ 
              ...characterData, 
              stylePreview: previewUrl, // Use local previewUrl as fallback
              // photoUrl is handled by the upload input 
           });
       }
   };
   
   return (
     <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-2xl font-bold text-gray-800">Create Character</h2>
                <button
           onClick={handleCancel}
           className="text-gray-400 hover:text-gray-600"
                >
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
           </svg>
                </button>
             </div>
               
       {/* Tabs Navigation Example */}
       <div className="flex border-b mb-4">
         {stepsConfig.map(({ index, title }) => {
           // --- Conditionally disable Step 2 if needed (though maybe not necessary now?) ---
           // Keeping the logic simple for now
           const isDisabled = !unlockedSteps.includes(index);
           const isActive = step === index;
           
           return (
              <button
               key={index}
               onClick={() => !isDisabled && handleTabClick(index)}
               disabled={isDisabled}
               className={`py-2 px-4 text-sm font-medium ${
                 isActive
                   ? 'border-b-2 border-blue-500 text-blue-600'
                   : isDisabled
                   ? 'text-gray-400 cursor-not-allowed'
                   : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
               }`}
             >
               {title}
              </button>
           );
         })}
            </div>
       
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