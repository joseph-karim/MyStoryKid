import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { 
  createImg2ImgTask, 
  createTxt2ImgTask, 
  getTaskProgress, 
  checkApiAccess, 
  getDzineStyles,
  getStyleCode 
} from '../services/dzineService';

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
  
  // Reset the form state when the component mounts
  useEffect(() => {
    // Reset form to default values
    setCharacterData(defaultCharacterData);
    setPhotoPreview(null);
    setError('');
    setStep(1);
    setIsGenerating(false);
    setProgressMessage('');
    
    // Apply forced style if provided - This is the ONLY source now
    if (forcedArtStyle) {
      console.log('[DEBUG] Applying forced art style (API style_code):', forcedArtStyle);
      // Set it directly into the state used by generation logic
      setCharacterData(prev => ({ 
          ...defaultCharacterData, // Start fresh 
          artStyle: forcedArtStyle // Store the forced style
      }));
    } else {
        // If no forced style, reset and maybe show an error later?
        console.warn('[DEBUG] CharacterWizard mounted without a forcedArtStyle prop!');
        setCharacterData(defaultCharacterData);
    }
    
    // Define the checkApiStatus function to check API connectivity
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
    
    // Check API status
    checkApiStatus();
    
    // Clean up polling when component unmounts
    return () => {
      // Cleanup polling on unmount
      Object.values(pollingSessionRef.current).forEach(session => {
        if (session.intervalId) clearInterval(session.intervalId);
        if (session.timeoutId) clearTimeout(session.timeoutId);
      });
      pollingSessionRef.current = {};
      console.log('Component unmounting, cleaning up generation state');
    };
  }, [forcedArtStyle]); // Add forcedArtStyle dependency
  
  // Character types
  const CHARACTER_TYPES = [
    { id: 'child', name: 'Child', description: 'The main character - based on your child' },
    { id: 'sibling', name: 'Sibling', description: 'Brother or sister' },
    { id: 'friend', name: 'Friend', description: 'A friend to join the adventure' },
    { id: 'magical', name: 'Magical Character', description: 'A fairy, wizard or magical creature' },
    { id: 'animal', name: 'Animal', description: 'A pet or wild animal companion' },
  ];
  
  // Character roles (imported from the roles defined in CharactersStep)
  const CHARACTER_ROLES = [
    { id: 'main', label: 'Main Character', description: 'The hero of the story (usually your child)' },
    { id: 'sidekick', label: 'Sidekick', description: 'Friend or companion who helps the main character' },
    { id: 'mentor', label: 'Mentor', description: 'Wise character who guides the main character' },
    { id: 'pet', label: 'Pet', description: 'Animal companion or pet' },
    { id: 'magical_friend', label: 'Magical Friend', description: 'Enchanted or fantasy character with special abilities' },
    { id: 'custom', label: 'Custom Role', description: 'Define your own character role in the story' }
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
    // Reset character data with a new ID
    setCharacterData({
      id: uuidv4(),
      name: '',
      type: 'child',
      age: '',
      gender: '',
      traits: [],
      interests: [],
      photoUrl: null,
      artStyle: forcedArtStyle || null,
      stylePreview: null,
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
      
      // Create the final character object, ensuring we have the style preview
      const finalCharacter = {
      ...characterData,
        id: characterData.id || uuidv4(), // Ensure we have an ID
        // Set a default type if none is specified
        type: characterData.type || 'child',
        // Ensure stylePreview is set
        stylePreview: characterData.stylePreview || characterData.photoUrl,
        // Ensure artStyle is set (can be forcedArtStyle or selected style)
        artStyle: characterData.artStyle || forcedArtStyle || null,
      };
      
      console.log('Completing character creation with data:', finalCharacter);
      
      // If this is a new character, add it
      if (!currentCharacter) {
        console.log('Adding new character with stylePreview:', finalCharacter.stylePreview);
        addCharacter(finalCharacter);
      } else {
        // Otherwise update the existing character
        console.log('Updating existing character:', currentCharacter.id, 'with stylePreview:', finalCharacter.stylePreview);
        updateCharacter(currentCharacter.id, finalCharacter);
      }
      
      // If we have a callback, invoke it
      if (onComplete) {
        console.log('Invoking completion callback with stylePreview:', finalCharacter.stylePreview);
        onComplete(finalCharacter);
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
    setError(''); 
    let targetStep = step + 1;
    
    // Validation for Step 1 (Details)
    if (step === 1) {
      if (!characterData.name || !characterData.age) { // Removed gender check as it's optional
        setError('Please fill in the character name and age.');
        return;
      }
    }
    
    // Validation for Step 2 (Photo/Description)
    if (step === 2) {
      // Check generation method requirements
      if (!characterData.useTextToImage && !characterData.photoUrl) {
         setError('Please upload a photo.');
         return;
      }
      if (characterData.useTextToImage && !characterData.generationPrompt) {
           setError('Please provide a character description.');
           return;
       }
    }
    
    // Unlock the next step and navigate (Max step is 3 now)
    if (targetStep <= 3) { 
      console.log(`[handleNext] Unlocking and setting step to: ${targetStep}`);
      setUnlockedSteps(prev => [...new Set([...prev, targetStep])]);
      setStep(targetStep);
    } else if (step === 3) {
      // If on step 3 (Confirm) and clicking Next -> Complete
      handleComplete();
    }
  };
  
  // Auto-generate preview when entering step 3 (Confirm step)
  useEffect(() => {
    // Log dependencies for debugging
    console.log(`[EFFECT CHECK] Step: ${step}, isGenerating: ${isGenerating}, hasStylePreview: ${!!characterData.stylePreview}, hasForcedStyle: ${!!forcedArtStyle}, hasPhotoUrl: ${!!characterData.photoUrl}, hasGenPrompt: ${!!characterData.generationPrompt}`);
    
    if (step === 3 && !isGenerating && !characterData.stylePreview) { 
      // Style MUST come from the forcedArtStyle prop now
      const styleToUse = forcedArtStyle;
      
      // Check if we have the required style AND either photo or description prompt
      const hasPhotoOrDesc = characterData.photoUrl || characterData.generationPrompt;
      
      if (styleToUse && hasPhotoOrDesc) {
        console.log(`[EFFECT] Step 3 reached & dependencies met, using style: ${styleToUse}`);
        // Ensure style is set in character data before generation
        // No - don't update characterData here, generateCharacterPreview will read the latest state
        // setCharacterData(prev => ({ ...prev, artStyle: styleToUse }));
        
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
  }, [step, forcedArtStyle, characterData.photoUrl, characterData.generationPrompt, characterData.isHuman, isGenerating, characterData.stylePreview]);
  
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
  
  // Step 1: Basic character details
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

          {/* Character Type Radio Buttons */}
          <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">Character Type</label>
                  <div className="space-y-2">
               {CHARACTER_TYPES.map((charType) => (
                 <label key={charType.id} className="flex items-center space-x-2 text-sm">
                        <input
                          type="radio"
                          name="characterType"
                     value={charType.id} 
                     checked={characterData.type === charType.id} 
                     onChange={() => {
                       handleChange('type', charType.id);
                       // Automatically update isHuman based on the new type
                       const isTypeHuman = !['pet', 'magical', 'animal'].includes(charType.id);
                       handleChange('isHuman', isTypeHuman);
                     }}
                     className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                   />
                   <span>{charType.name} <span className="text-gray-500">({charType.description})</span></span>
                      </label>
                    ))}
                </div>
              </div>
              
          {/* --- Is Human Toggle --- */}
          <div className="mb-4 pt-2 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-1">Use Face Matching?</label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                  <input
                  type="radio" 
                  name="isHuman" 
                  checked={characterData.isHuman === true} 
                  onChange={() => handleChange('isHuman', true)} 
                  className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span>Yes (Try to keep facial features)</span>
              </label>
              <label className="flex items-center space-x-2 text-sm">
                  <input
                          type="radio" 
                  name="isHuman" 
                  checked={characterData.isHuman === false} 
                  onChange={() => handleChange('isHuman', false)} 
                  className="form-radio h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
                <span>No (e.g., Pet, Creature)</span>
                      </label>
                </div>
            <p className="text-xs text-gray-500 mt-1">Select 'No' for pets or fantasy creatures if face matching causes issues.</p>
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
                placeholder="e.g., 5, Adult, Ancient"
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
     // Style code is now passed directly as an argument
     if (!styleApiCode) {
       setError('No art style specified. Cannot generate preview.');
       console.error('generateCharacterPreview called without an art style.');
       return;
     }
     
     console.log(`[PREVIEW] Generating preview with style code: ${styleApiCode}, isHuman: ${isHumanCharacter}`);
     
     // Determine generation type and prepare data
     if (characterData.useTextToImage) {
       // Text-to-Image
       if (!characterData.generationPrompt) {
         setError('Please provide a description for text-to-image generation.');
         return;
       }
       console.log('[PREVIEW] Using Text-to-Image with style:', styleApiCode);
       await generateCharacterImage(styleApiCode, characterData.generationPrompt, null, isHumanCharacter);
     } else {
       // Image-to-Image
       if (!characterData.photoUrl) {
         setError('Please upload a photo for image-to-image generation.');
         return;
       }
       console.log('[PREVIEW] Using Image-to-Image with style:', styleApiCode);
       await generateCharacterImage(styleApiCode, null, characterData.photoUrl, isHumanCharacter);
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
   
   // Start polling for task progress
   const startPollingTask = (taskId, fallbackImage, generationId) => {
     if (!taskId) {
       console.error('Invalid task ID for polling');
       setProgressMessage('Error: Invalid task ID');
       setIsGenerating(false);
       useFallbackImage(fallbackImage);
       return;
     }
     
     console.log(`Starting to poll for task: ${taskId}`);
     setProgressMessage('Starting image generation...');
     
     // Generate a unique ID for this polling session to avoid conflicts
     const pollingId = `poll_${Date.now()}`;
     let pollCount = 0;
     const maxPolls = 60; // Increased to 60 seconds max wait time
     
     // Count consecutive errors and 404s
     let consecutiveErrors = 0;
     let consecutive404s = 0;
     const maxConsecutiveErrors = 5; // Increased tolerance for errors
     const maxConsecutive404s = 10; // Increased tolerance for 404s
     
     // Store the interval in a ref so we can clear it from anywhere
     pollingSessionRef.current[pollingId] = setInterval(async () => {
       pollCount++;
       console.log(`Polling attempt ${pollCount} for task ${taskId}`);
       
       // Update progress message with more informative status
       if (pollCount <= 10) {
         setProgressMessage(`Initializing generation... (${pollCount}s)`);
       } else if (pollCount <= 30) {
         setProgressMessage(`Processing your image... (${pollCount}s)`);
       } else {
         setProgressMessage(`Still working... (${pollCount}s)`);
       }
       
       if (pollCount >= maxPolls) {
         console.log(`Reached maximum polling time (${maxPolls}s), stopping`);
         setProgressMessage('Generation timeout - please try again');
         clearInterval(pollingSessionRef.current[pollingId]);
         setIsGenerating(false);
         delete pollingSessionRef.current[pollingId];
         
         // Only use fallback after maximum time
         useFallbackImage(fallbackImage);
         return;
       }
       
       try {
         // Fetch the task progress
         let progressData;
         let is404 = false;
         
         try {
           progressData = await getTaskProgress(taskId);
           
           // Check if it's a pending status due to 404
           if (progressData.status === 'pending' && progressData.message === 'Task is still initializing') {
             consecutive404s++;
             is404 = true;
             console.warn(`Got 404 (${consecutive404s}/${maxConsecutive404s}) for task ${taskId}`);
             
             if (consecutive404s >= maxConsecutive404s) {
               // Too many 404s usually means the task ID is invalid or the API is having issues
               console.error(`Too many 404s (${consecutive404s}), task may not exist`);
               throw new Error('Task ID not found after multiple attempts');
             }
           } else {
             // Reset counters on success
             consecutiveErrors = 0;
             consecutive404s = 0;
           }
         } catch (fetchError) {
           consecutiveErrors++;
           console.warn(`Fetch error (${consecutiveErrors}/${maxConsecutiveErrors}):`, fetchError);
           
           // If we've had too many consecutive errors, use fallback
           if (consecutiveErrors >= maxConsecutiveErrors) {
             console.error(`Too many consecutive errors (${consecutiveErrors}), using fallback`);
             setProgressMessage('Network issues - using fallback image');
             clearInterval(pollingSessionRef.current[pollingId]);
             setIsGenerating(false);
             delete pollingSessionRef.current[pollingId];
             
             useFallbackImage(fallbackImage);
             return;
           }
           
           // Otherwise just continue polling
           return;
         }
         
         // Debug log all response data
         console.log(`Task ${taskId} progress data (attempt ${pollCount}):`, progressData);
         
         // Extract status from various possible response structures
         let status = null;
         let normalizedStatus = 'pending'; // Default to pending
         
         if (progressData?.status) {
           status = progressData.status.toLowerCase();
         } else if (progressData?.data?.status) {
           status = progressData.data.status.toLowerCase();
         }
         
         // Normalize status according to docs + observed values
         if (status === 'succeed' || status === 'succeeded') {
           normalizedStatus = 'success';
         } else if (status === 'failed' || status === 'error') {
           normalizedStatus = 'failed';
         } else if (['processing', 'running', 'waiting', 'in_queue', 'uploading'].includes(status)) {
           normalizedStatus = 'running';
         } else if (status === 'pending' && is404) {
           normalizedStatus = 'pending_404'; // Special case for initial 404s
         } else {
           normalizedStatus = 'running'; // Assume running if status is unknown/missing but no error occurred
         }
         
         console.log(`Extracted status: ${status}, Normalized status: ${normalizedStatus}`);
         
         // -- Success Path --
         if (normalizedStatus === 'success') {
           console.log(`Task ${taskId} completed successfully`);
           setProgressMessage('Image generated successfully!');
           
           // Extract image URLs (Simplified based on latest logs/docs)
           let resultUrls = [];
           if (progressData?.data?.generate_result_slots?.length > 0) {
             resultUrls = progressData.data.generate_result_slots.filter(url => url); // Filter out empty slots
             console.log("Found URLs in data.generate_result_slots:", resultUrls);
           } else {
             // Fallback extraction (less likely needed now but kept for safety)
             resultUrls = extractImageUrls(progressData);
              console.log("Used fallback URL extraction:", resultUrls);
           }
           
           const imageUrl = resultUrls[0] || null; // Take the first non-empty URL
           
           if (imageUrl) {
             console.log('Using image URL:', imageUrl);
             setCharacterData(prev => ({ ...prev, stylePreview: imageUrl }));
             // --- STOP POLLING --- 
             clearInterval(pollingSessionRef.current[pollingId]);
             setIsGenerating(false);
             delete pollingSessionRef.current[pollingId];
             console.log(`Success: Cleared polling interval ${pollingId}`);
             return; // Exit interval callback
           } else {
             console.warn('Task succeeded but no valid image URLs found in generate_result_slots.');
             setProgressMessage('Task finished but no image found - using placeholder.');
             // --- STOP POLLING --- 
             clearInterval(pollingSessionRef.current[pollingId]);
             setIsGenerating(false);
             delete pollingSessionRef.current[pollingId];
             useFallbackImage(fallbackImage); // Use fallback if success but no image
             console.log(`Success (no image): Cleared polling interval ${pollingId}`);
             return; // Exit interval callback
           }
         }
         // -- Failure Path --
         else if (normalizedStatus === 'failed') {
           console.error(`Task ${taskId} failed. Reason:`, progressData?.data?.error_reason || progressData?.error_reason || 'Unknown');
           setProgressMessage('Generation failed. Please try again.');
           setError('Image generation failed. Please check the style or try again.');
           // --- STOP POLLING --- 
           clearInterval(pollingSessionRef.current[pollingId]);
           setIsGenerating(false);
           delete pollingSessionRef.current[pollingId];
           // No automatic fallback on failure, let user retry
           // useFallbackImage(fallbackImage);
           console.log(`Failed: Cleared polling interval ${pollingId}`);
           return; // Exit interval callback
         }
         // -- Still Running Path --
         else {
           // Task is still running (running, pending_404, or unknown)
           console.log(`Task ${taskId} is still running (Status: ${normalizedStatus})`);
           // Update progress message (handled outside the try block before)
         }
         
       } catch (error) {
         console.error(`Error in polling attempt ${pollCount}:`, error);
         consecutiveErrors++;
         
         if (consecutiveErrors >= maxConsecutiveErrors || pollCount >= maxPolls) {
           setProgressMessage('Polling error or timeout - using placeholder image');
           setError('Could not retrieve image result due to polling errors or timeout.');
           // --- STOP POLLING --- 
           clearInterval(pollingSessionRef.current[pollingId]);
           setIsGenerating(false);
           delete pollingSessionRef.current[pollingId];
           useFallbackImage(fallbackImage); // Use fallback only on repeated errors/timeout
           console.log(`Error/Timeout: Cleared polling interval ${pollingId}`);
           return; // Exit interval callback
         }
         // Continue polling if error limit not reached
       }
     }, 1000); // Poll every second
   };
   
   // Helper function to extract image URLs from response
   const extractImageUrls = (obj, prefix = '') => {
     let urls = [];
     if (typeof obj !== 'object' || obj === null) return urls;
     
     Object.keys(obj).forEach(key => {
       const path = prefix ? `${prefix}.${key}` : key;
       if (typeof obj[key] === 'string' && 
           (obj[key].includes('.png') || 
            obj[key].includes('.jpg') || 
            obj[key].includes('.jpeg') || 
            obj[key].includes('.webp'))) {
         console.log(`Found potential image URL at ${path}:`, obj[key]);
         urls.push(obj[key]);
       } else if (typeof obj[key] === 'object' && obj[key] !== null) {
         urls = [...urls, ...extractImageUrls(obj[key], path)];
       }
     });
     return urls;
   };
   
   // Helper function to create a colored placeholder image as a data URL
   const createColorPlaceholder = (bgColor, text) => {
     // Create a simple canvas-based placeholder
     const canvas = document.createElement('canvas');
     canvas.width = 200;
     canvas.height = 200;
     const ctx = canvas.getContext('2d');
     
     // Fill background
     ctx.fillStyle = bgColor;
     ctx.fillRect(0, 0, canvas.width, canvas.height);
     
     // Add text
     ctx.fillStyle = getContrastColor(bgColor);
     ctx.font = '18px sans-serif';
     ctx.textAlign = 'center';
     ctx.textBaseline = 'middle';
     
     // Wrap text
     const words = text.split(' ');
     let line = '';
     let y = 100;
     const lineHeight = 24;
     const maxLines = 3;
     let lines = [];
     
     for (let i = 0; i < words.length; i++) {
       const testLine = line + words[i] + ' ';
       if (ctx.measureText(testLine).width < 180) {
         line = testLine;
       } else {
         lines.push(line);
         line = words[i] + ' ';
       }
     }
     lines.push(line);
     
     // Only show up to maxLines
     lines = lines.slice(0, maxLines);
     
     // Center the lines vertically
     const startY = y - ((lines.length - 1) * lineHeight) / 2;
     
     // Draw each line
     lines.forEach((line, i) => {
       ctx.fillText(line, canvas.width / 2, startY + i * lineHeight);
     });
     
     return canvas.toDataURL('image/png');
   };
   
   // Helper to generate a color from a string
   const stringToColor = (str) => {
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
   
   // Helper to get contrasting text color (black or white) based on background
   const getContrastColor = (hexColor) => {
     // Convert hex to RGB
     const r = parseInt(hexColor.substr(1, 2), 16);
     const g = parseInt(hexColor.substr(3, 2), 16);
     const b = parseInt(hexColor.substr(5, 2), 16);
     
     // Calculate luminance
     const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
     
     // Return black or white based on luminance
     return luminance > 0.5 ? '#000000' : '#FFFFFF';
   };
   
   // Image Preview Modal Component
   const ImagePreviewModal = ({ isOpen, imageUrl, onClose }) => {
     if (!isOpen) return null;
     
     return (
       <AnimatePresence>
         {isOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75">
             <motion.div
               initial={{ opacity: 0, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.8 }}
               className="relative max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-lg shadow-xl"
             >
               <button
                 onClick={onClose}
                 className="absolute top-2 right-2 z-10 p-2 bg-white bg-opacity-70 rounded-full text-gray-800 hover:bg-opacity-100"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
               </button>
               <div className="overflow-hidden flex items-center justify-center">
                 <img
                   src={imageUrl}
                   alt="Character Preview"
                   className="max-w-full max-h-[85vh] object-contain shadow-xl"
                         />
                       </div>
             </motion.div>
                  </div>
                )}
       </AnimatePresence>
     );
   };
   
   // Rename renderPreviewStep to renderConfirmStep
   const renderConfirmStep = () => {
     console.log('[Render] renderConfirmStep');
     return (
       <div className="space-y-6 animate-fadeIn">
         <h2 className="text-2xl font-bold mb-4">Preview Character</h2>
         
         {isGenerating ? (
           <div className="flex flex-col items-center justify-center py-10">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
             <p className="text-gray-600">{progressMessage || 'Creating your character...'}</p>
                 </div>
         ) : characterData.stylePreview ? (
           <div className="bg-white rounded-lg shadow overflow-hidden">
             <div className="p-4 flex flex-col items-center">
               <div className="w-64 h-64 overflow-hidden rounded-lg mb-4 border-2 border-gray-200 shadow-inner">
                 <div className="relative w-full h-full">
                   <div className="absolute inset-0 bg-white opacity-50"></div>
                   <img 
                     src={characterData.stylePreview} 
                     alt={characterData.name} 
                     className="w-full h-full object-contain"
                   />
               </div>
                </div>
                
               <h3 className="text-xl font-bold">{characterData.name}</h3>
               <p className="text-gray-600">
                 {characterData.age && `${characterData.age} years old • `}
                 {characterData.gender && `${characterData.gender} • `}
                 {characterData.type}
               </p>
               
               {characterData.useTextToImage && characterData.generationPrompt && (
                 <div className="mt-4 w-full p-3 bg-gray-50 rounded-md">
                   <p className="text-sm italic text-gray-600">{characterData.generationPrompt}</p>
              </div>
               )}
            </div>
           </div>
         ) : (
           <div className="bg-gray-100 rounded-lg p-6 text-center">
             <p className="text-gray-600">No preview available. Please go back and select an art style.</p>
           </div>
         )}
         
         <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
               <button
             onClick={handleBack}
             className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
               >
                 Back
                 </button>
           <button
             onClick={handleComplete}
             className={`px-6 py-2 bg-blue-600 text-white rounded ${!characterData.stylePreview || isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
             disabled={!characterData.stylePreview || isGenerating}
           >
             Confirm Character
               </button>
             </div>
           </div>
     );
   };
   
   // Update generateCharacterImage signature to accept isHuman flag
   const generateCharacterImage = async (styleApiCode, prompt, fallbackImage, isHumanCharacter) => {
     // Style validation
     if (!styleApiCode || !styleApiCode.startsWith('Style-')) {
       console.error('Invalid or missing style API code passed to generateCharacterImage:', styleApiCode);
       setError('An invalid art style was specified.');
       setIsGenerating(false);
       setProgressMessage('Error: Invalid style.');
       return; 
     }
     
     const generationId = uuidv4(); 
     pollingSessionRef.current[generationId] = { stopPolling: false }; 
     let operationType = ''; // <<< Declare operationType outside the try block
     
     try {
       setIsGenerating(true);
       setProgressMessage('Starting generation...');
       
       let taskResponse;
       // let operationType = ''; // <<< Remove declaration from inside try block
       
       if (characterData.useTextToImage) {
         // --- Text-to-Image Logic --- 
         operationType = 'Text-to-Image';
         console.log(`[API CALL] Generating ${operationType} with Style Code:`, styleApiCode);
         
         if (!prompt) {
           throw new Error('Description (prompt) is required for Text-to-Image.');
         }
         
         // Enhance prompt slightly if needed (can be more elaborate)
         let enhancedPrompt = prompt;
         if (characterData.name && !enhancedPrompt.includes(characterData.name)) {
             enhancedPrompt = `${characterData.name}, ${enhancedPrompt}`;
         }
         enhancedPrompt += ", high quality illustration"; // Add quality modifier
         
         const payload = {
           prompt: enhancedPrompt.substring(0, 800), 
           style_code: styleApiCode,
           // Add other Txt2Img specific parameters from docs
           style_intensity: characterData.style_intensity ?? 1.0, 
           quality_mode: characterData.quality_mode ?? 1, 
           target_h: 1024, // Example size, adjust as needed
           target_w: 1024,
           generate_slots: characterData.generate_slots ?? [1, 1], 
           output_format: 'webp',
           seed: Math.floor(Math.random() * 2147483647) + 1,
           negative_prompt: characterData.negative_prompt || 'low quality, blurry, bad anatomy' // Txt2Img specific negative?
         };
         
         console.log('Txt2Img Payload:', JSON.stringify(payload, null, 2));
         taskResponse = await createTxt2ImgTask(payload);
         
       } else {
         // --- Image-to-Image Logic --- 
         operationType = 'Image-to-Image';
         console.log(`[API CALL] Generating ${operationType} with Style Code:`, styleApiCode);
         
         if (!characterData.photoUrl) {
           throw new Error('Photo is required for Image-to-Image.');
         }

         // Use photoUrl directly for base64_data
         if (!characterData.photoUrl.startsWith('data:image')) {
            throw new Error('Invalid photo data format for Image-to-Image.');
         }
         
         // Construct prompt for Img2Img (can be simpler)
         const imgPrompt = prompt || `Character portrait of ${characterData.name || 'person'} in the selected style`;

         const payload = {
           style_code: styleApiCode, 
           prompt: imgPrompt.substring(0, 800),
           images: [{ base64_data: characterData.photoUrl }],
           color_match: characterData.color_match ?? 0, 
           style_intensity: characterData.style_intensity ?? 1.0, 
           structure_match: characterData.structure_match ?? 0.8, 
           quality_mode: characterData.quality_mode ?? 1, 
           generate_slots: characterData.generate_slots ?? [1, 1], 
           output_format: 'webp',
           negative_prompt: characterData.negative_prompt || 'ugly, deformed, disfigured, poor quality, blurry, nsfw',
           seed: Math.floor(Math.random() * 2147483647) + 1,
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
           : fallbackImage; 
           
       await startPollingTask(taskId, actualFallback, generationId);
       
     } catch (error) {
       console.error(`API error during ${operationType || 'generation'} process:`, error);
       setIsGenerating(false);
       
       // Simplified error handling - No retry, just show the error
       // The specific "Style Invalid" case is less likely now if style is always forced,
       // but we keep the check just in case.
       if (error.message && error.message.includes('108005') && error.message.toLowerCase().includes('style are invalid')) {
         const userErrorMessage = `The selected style (${styleApiCode}) cannot be used. Please inform the administrator.`;
         setError(userErrorMessage);
         setProgressMessage('Error: Invalid style specified'); 
       } else {
         setError(`Generation failed: ${error.message}. Please try again or contact support.`);
         setProgressMessage('Error occurred during generation');
       }
     }
   };
   
   // Update tab rendering logic for 3 steps
   const stepsConfig = [
     { index: 1, title: 'Details' },
     { index: 2, title: 'Photo & Style' }, 
     { index: 3, title: 'Confirm' }    
   ];
   
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