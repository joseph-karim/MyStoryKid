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

// Define a known safe default style code from the API list
const SAFE_DEFAULT_API_STYLE_CODE = "Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2"; // "No Style v2"

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
  generationPrompt: ''
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
  
  // Add state for API styles
  const [apiStyles, setApiStyles] = useState([]);
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);
  
  // Character data
  const [characterData, setCharacterData] = useState(defaultCharacterData);
  
  // Add state for image preview modal
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  
  // Reset the form state when the component mounts
  useEffect(() => {
    // Reset form to default values
    setCharacterData(defaultCharacterData);
    setPhotoPreview(null);
    setError('');
    setStep(1);
    setIsGenerating(false);
    setProgressMessage('');
    
    // If we have a forced art style, it should be an API style_code now
    if (forcedArtStyle) {
      console.log('[DEBUG] Applying forced art style (API style_code):', forcedArtStyle);
      setCharacterData(prev => ({
        ...prev,
        artStyle: forcedArtStyle // Assuming forcedArtStyle is now an actual API style_code
      }));
    }
    
    // Load API styles on mount
    const fetchStyles = async () => {
      try {
        setIsLoadingStyles(true);
        console.log('Fetching Dzine API styles for wizard...');
        const stylesData = await getDzineStyles();
        
        if (stylesData?.list?.length > 0) {
          console.log(`Retrieved ${stylesData.list.length} styles from Dzine API`);
          setApiStyles(stylesData.list);
          
          // Set initial art style if none is selected
          if (!characterData.artStyle) {
            // Default to the first style in the list as fallback
            const defaultStyle = stylesData.list[0]?.style_code || null;
            
            // Try to find a recommended style (like cartoon, 3D, pixie, etc)
            const recommendedStyle = stylesData.list.find(style => 
              style.name.toLowerCase().includes('cartoon') || 
              style.name.toLowerCase().includes('3d') ||
              style.name.toLowerCase().includes('pixie')
            );
            
            setCharacterData(prev => ({
              ...prev,
              artStyle: forcedArtStyle || recommendedStyle?.style_code || defaultStyle
            }));
          }
        } else {
          console.error('No styles available from Dzine API');
          setError('Could not load art styles from the API');
        }
      } catch (err) {
        console.error('Error fetching Dzine styles:', err);
        setError('Failed to load art styles. Please try again later.');
      } finally {
        setIsLoadingStyles(false);
      }
    };
    
    fetchStyles();
    
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
      useTextToImage: false
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
    // Don't allow going back from the first step
    if (step <= 1) return;
    
    // If we're on the preview step (step 3), go back to photo upload (step 2)
    if (step === 3) {
      setStep(2);
      return;
    }
    
    // Regular step regression
    setStep(Math.max(1, step - 1));
  };
  
  const handleNext = () => {
    if (step === 1 && !characterData.name) {
      setError('Please enter a name for your character.');
      return;
    }
    
    // Add validation for step 2
    if (step === 2) {
      // Check if using text description but no description provided
      if (characterData.useTextToImage && !characterData.generationPrompt) {
        setError('Please provide a description for your character.');
        return;
      }
      
      // Check if using photo but no photo uploaded
      if (!characterData.useTextToImage && !characterData.photoUrl) {
        setError('Please upload a photo for your character.');
        return;
      }
      
      // When moving from step 2 (appearance) to step 3 (preview),
      // we need to generate the preview
      const nextStep = 3; // Preview step
      
      // Unlock the next step if not already unlocked
      if (!unlockedSteps.includes(nextStep)) {
        setUnlockedSteps(prev => [...prev, nextStep]);
      }
      
      setStep(nextStep);
      
      // Ensure we generate the preview
      if (!characterData.stylePreview || !isGenerating) {
        generateCharacterPreview();
      }
      return;
    }
    
    if (step === 3) {
      // This is the final step
      handleComplete();
      return;
    }
    
    // Regular step progression
    const nextStep = step + 1;
    
    // Unlock the next step if not already unlocked
    if (!unlockedSteps.includes(nextStep)) {
      setUnlockedSteps(prev => [...prev, nextStep]);
    }
    
    setStep(nextStep);
    setError('');
  };
  
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
  return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-4">Character Details</h2>
        
        <div className="space-y-6">
          <div>
            <label htmlFor="name" className="block font-medium text-gray-700 mb-1">
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
                
          <div>
            <label htmlFor="age" className="block font-medium text-gray-700 mb-1">
              Age
            </label>
                  <input
                    type="text"
              id="age"
              value={characterData.age || ''}
              onChange={(e) => handleChange('age', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Character's age"
                  />
                </div>
                
          <div>
            <label htmlFor="gender" className="block font-medium text-gray-700 mb-1">
              Gender
                      </label>
            <select
              id="gender"
              value={characterData.gender || ''}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select gender (optional)</option>
              <option value="Boy">Boy</option>
              <option value="Girl">Girl</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Other">Other</option>
            </select>
              </div>
            </div>
            
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
              <button
            onClick={handleBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            disabled={step === 1}
              >
                Back
              </button>
              <button
            onClick={handleNext}
            className={`px-6 py-2 bg-blue-600 text-white rounded ${!characterData.name ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                disabled={!characterData.name}
              >
                Next
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
        return "Photo/Description";
      case 3:
        return "Confirm";
      default:
        return `Step ${stepNumber}`;
    }
  };
  
  // Update the appearance step to use curated categories with API style mapping
  const renderAppearanceStep = () => {
    return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-2">Select Art Style</h2>
        <p className="text-sm text-gray-600 mb-4">Choose an art style for your character.</p>

        {/* Style Selection Grid - Powered by API */}
        <div className="mb-6">
          {isLoadingStyles ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
              <p className="ml-3 text-gray-600">Loading styles...</p>
            </div>
          ) : apiStyles.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {apiStyles.map(style => (
                <div
                  key={style.style_code}
                  onClick={() => handleChange('artStyle', style.style_code)} // Set the actual style_code
                  className={`cursor-pointer border rounded-lg overflow-hidden transition-all duration-200 ease-in-out transform hover:scale-105 
                    ${characterData.artStyle === style.style_code 
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md' 
                      : 'border-gray-200 hover:border-blue-400 hover:shadow'}`}
                  title={style.name} // Tooltip for style name
                >
                  <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src={style.cover_url} 
                      alt={style.name} 
                      className="w-full h-full object-cover transition-opacity duration-300 hover:opacity-90" 
                      loading="lazy" // Lazy load images
                      onError={(e) => { e.target.style.display = 'none'; /* Hide if image fails */ }}
                    />
                  </div>
                  <p className="text-xs text-center p-2 truncate bg-white text-gray-700">
                    {style.name}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-red-600">Could not load art styles. Please try refreshing.</p>
          )}
        </div>
        
        {/* Photo Upload Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold mb-3">Upload Photo</h3>
          <p className="text-sm text-gray-600 mb-4">Upload a clear photo of the character's face. This will be used with the selected art style.</p>
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
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
                    e.stopPropagation(); // Prevent triggering the outer div's click
                          setPhotoPreview(null);
                    handleChange('photoUrl', null);
                        }}
                      >
                  Remove Photo
                      </button>
                    </div>
                  ) : (
              <div className="flex flex-col items-center text-gray-500">
                <svg className="mx-auto h-12 w-12 " fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 10v6m3-3h-6"></path>
                      </svg>
                <span className="mt-2 block text-sm font-medium">
                  Click to upload a photo
                </span>
                <span className="mt-1 block text-xs text-gray-500">PNG, JPG, WEBP up to 10MB</span>
                    </div>
                  )}
          </div>
                  <input
                    type="file"
            accept="image/png, image/jpeg, image/webp" // Be specific
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
            style={{ display: 'none' }} 
                  />
                </div>

        {/* Navigation Buttons - Copied from renderDetailsStep structure */}
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Back
          </button>
          <button
            onClick={handleNext}
            // Enable Next only if an art style AND a photo are selected
            className={`px-6 py-2 bg-blue-600 text-white rounded ${(!characterData.artStyle || !characterData.photoUrl) 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-blue-700'}`}
            disabled={!characterData.artStyle || !characterData.photoUrl}
          >
            Next
          </button>
              </div>
      </div>
    );
  };
  
  // Modified renderStep to avoid adding duplicate navigation buttons
  const renderStep = () => {
    switch (step) {
      case 1:
        return renderDetailsStep();
      case 2:
        return renderAppearanceStep();
      case 3:
        return renderPreviewStep(); // Preview is now step 3 (no art style step)
      default:
        return null;
    }
  };
  
  // Update the generateCharacterPreview function to handle API style errors better
  const generateCharacterPreview = async () => {
    // For now, assume it gets the correct style_code from characterData.artStyle
    if (!characterData.artStyle) {
      setError('Please select an art style first.');
      return;
    }
    console.log(`Generating preview with style code: ${characterData.artStyle}`);
    await generateCharacterImage(characterData.artStyle, characterData.generationPrompt || null, photoPreview);
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
        
        if (progressData.status) {
          status = progressData.status;
        } else if (progressData.data && progressData.data.status) {
          status = progressData.data.status;
        } else if (typeof progressData === 'string' && 
                  (progressData.includes('success') || 
                   progressData.includes('running') || 
                   progressData.includes('failed'))) {
          status = progressData.includes('success') ? 'success' : 
                  progressData.includes('running') ? 'running' : 'failed';
        }
        
        console.log(`Extracted status: ${status}`);
        
        // Update UI based on status
        if (status === 'running' || status === 'pending' || status === 'waiting') {
          // Task is still running, continue polling
          console.log(`Task ${taskId} is still running`);
          setProgressMessage(`Generating image... (${pollCount}s)`);
          
          // If we're taking too long, show a hopeful message
          if (pollCount > 10) {
            setProgressMessage(`Almost there... (${pollCount}s)`);
          }
        } else if (status === 'success' || status === 'completed') {
          // Task completed successfully
          console.log(`Task ${taskId} completed successfully`);
          setProgressMessage('Image generated successfully!');
          
          // Extract image URLs from the response
          let resultUrls = [];
          
          // Check various places where the URLs might be
          if (progressData.generate_result_urls && progressData.generate_result_urls.length > 0) {
            resultUrls = progressData.generate_result_urls;
            console.log("Found URLs in generate_result_urls:", resultUrls);
          } else if (progressData.data && progressData.data.generate_result_urls && progressData.data.generate_result_urls.length > 0) {
            resultUrls = progressData.data.generate_result_urls;
            console.log("Found URLs in data.generate_result_urls:", resultUrls);
          } else if (progressData.result && progressData.result.images) {
            resultUrls = progressData.result.images;
            console.log("Found URLs in result.images:", resultUrls);
          } else if (progressData.generate_result_slots && progressData.generate_result_slots.length > 0) {
            resultUrls = progressData.generate_result_slots;
            console.log("Found URLs in generate_result_slots:", resultUrls);
          } else if (progressData.data && progressData.data.generate_result_slots && progressData.data.generate_result_slots.length > 0) {
            resultUrls = progressData.data.generate_result_slots;
            console.log("Found URLs in data.generate_result_slots:", resultUrls);
          } else if (progressData.result && progressData.result.generate_result_slots) {
            resultUrls = progressData.result.generate_result_slots;
            console.log("Found URLs in result.generate_result_slots:", resultUrls);
          } else if (progressData.images && progressData.images.length > 0) {
            resultUrls = progressData.images;
            console.log("Found URLs in images array:", resultUrls);
          } else {
            // Try to find images elsewhere in the response
            resultUrls = extractImageUrls(progressData);
            console.log("Extracted image URLs from response:", resultUrls);
          }
          
          // If we found any URLs, use the first one
          if (resultUrls && resultUrls.length > 0) {
            let imageUrl = null;
            
            // If the "URLs" are actually base64 data, use as is
            if (typeof resultUrls[0] === 'string') {
              if (resultUrls[0].startsWith('data:image')) {
                imageUrl = resultUrls[0];
                console.log("Found base64 image data");
              } else if (resultUrls[0].includes('http')) {
                // It's a regular URL
                imageUrl = resultUrls[0];
                console.log("Found HTTP image URL:", imageUrl);
              } else {
                // Try to format as a data URL if it's raw base64
                try {
                  if (resultUrls[0].match(/^[A-Za-z0-9+/=]+$/)) {
                    imageUrl = `data:image/jpeg;base64,${resultUrls[0]}`;
                    console.log("Converted raw base64 to data URL");
                  }
                } catch (err) {
                  console.error("Error formatting base64 data:", err);
                }
              }
              
              if (imageUrl) {
                console.log('Using image URL:', imageUrl.substring(0, 100) + '...');
                
                // Update the character data with the style preview
                setCharacterData(prev => ({
                  ...prev,
                  stylePreview: imageUrl
                }));
                
                // We're done polling
                console.log(`Successful completion, ending poll ${pollingId}`);
                clearInterval(pollingSessionRef.current[pollingId]);
                setIsGenerating(false);
                delete pollingSessionRef.current[pollingId];
                return;
              }
            } else if (typeof resultUrls[0] === 'object' && resultUrls[0].url) {
              // Handle object format with URL field
              imageUrl = resultUrls[0].url;
              console.log("Found URL in object format:", imageUrl);
              
              // Update the character data with the style preview
              setCharacterData(prev => ({
                ...prev,
                stylePreview: imageUrl
              }));
              
              // We're done polling
              console.log(`Successful completion, ending poll ${pollingId}`);
              clearInterval(pollingSessionRef.current[pollingId]);
              setIsGenerating(false);
              delete pollingSessionRef.current[pollingId];
              return;
            }
          }
          
          console.warn('Task completed but no images found in the response');
          setProgressMessage('Task completed but no images found - using fallback');
          clearInterval(pollingSessionRef.current[pollingId]);
          setIsGenerating(false);
          delete pollingSessionRef.current[pollingId];
          
          // Use the fallback
          useFallbackImage(fallbackImage);
        } else if (status === 'failed' || status === 'error') {
          // Task failed
          console.error('Task failed:', progressData);
          setProgressMessage('Generation failed - using fallback image');
          clearInterval(pollingSessionRef.current[pollingId]);
          setIsGenerating(false);
          delete pollingSessionRef.current[pollingId];
          
          // Use the fallback
          useFallbackImage(fallbackImage);
          return;
        }
      } catch (error) {
        console.error(`Error in polling attempt ${pollCount}:`, error);
        consecutiveErrors++;
        
        // If we've had too many consecutive errors or reached max polls, use fallback
        if (consecutiveErrors >= maxConsecutiveErrors || pollCount >= maxPolls) {
          setProgressMessage('Error occurred - using fallback image');
          clearInterval(pollingSessionRef.current[pollingId]);
          setIsGenerating(false);
          delete pollingSessionRef.current[pollingId];
          
          // Use the fallback
          useFallbackImage(fallbackImage);
        }
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
  
  const renderPreviewStep = () => {
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
  
  // Updated generateCharacterImage to use style_code directly
  const generateCharacterImage = async (styleApiCode, prompt, fallbackImage) => {
    // `styleApiCode` is now expected to be the actual API style_code
    if (!styleApiCode || !styleApiCode.startsWith('Style-')) {
      console.error('Invalid or missing style API code passed to generateCharacterImage:', styleApiCode);
      setError('An invalid style code was selected.');
      setIsGenerating(false);
      setProgressMessage('Error: Invalid style code.');
      return; // Prevent API call with invalid code
    }
    
    const generationId = uuidv4(); // Unique ID for this generation attempt
    pollingSessionRef.current[generationId] = { stopPolling: false }; // Initialize polling state
    
    try {
      setIsGenerating(true);
      setProgressMessage('Starting generation...');
      
      console.log('[API CALL] Generating image with Style Code:', styleApiCode);
            
      // Validate that we have a photo URL for img2img
      if (!characterData.photoUrl) {
        console.error('No photo URL available in character data for img2img');
        // TODO: Handle text-to-image case if needed, or throw error
        throw new Error('Please upload a photo first for Image-to-Image generation');
      }

      // Debug log the photo URL
      console.log('IMAGE DEBUG:', {
        hasPhotoUrl: !!characterData.photoUrl,
        photoUrlType: typeof characterData.photoUrl,
        photoUrlLength: characterData.photoUrl?.length,
        isBase64: characterData.photoUrl?.startsWith('data:image'),
        preview: characterData.photoUrl?.substring(0, 50) + '...'
      });
      
      // Prepare the payload for the API call (using the actual styleApiCode)
      const payload = {
        style_code: styleApiCode, 
        prompt: prompt || `Generate a character portrait of ${characterData.name} in the selected style`, 
        images: [{
          base64_data: characterData.photoUrl // Send the full data URL as required
        }],
        // Add other necessary parameters from documentation / previous state
        color_match: characterData.color_match ?? 0, // Use state or default
        face_match: characterData.face_match ?? 1, // Use state or default
        style_intensity: characterData.style_intensity ?? 1.0, // Use state or default
        structure_match: characterData.structure_match ?? 0.8, // Use state or default
        quality_mode: characterData.quality_mode ?? 1, // Use state or default
        generate_slots: characterData.generate_slots ?? [1, 1], // Use state or default
        output_format: 'webp',
        negative_prompt: characterData.negative_prompt || 'ugly, deformed, disfigured, poor quality, blurry, nsfw' // Use state or default negative
      };
      
      // Create the task using the service
      const taskResponse = await createImg2ImgTask(payload);
      
      // The service layer now throws on error or returns { task_id: '...' }
      const taskId = taskResponse.task_id;
      console.log('Task created with ID:', taskId);
      
      // Start polling for the result
      await startPollingTask(taskId, fallbackImage, generationId);
      
    } catch (error) {
      console.error('API error during image generation process:', error);
      setProgressMessage(`Error: ${error.message}`);
      
      // Check if the error is the specific "Style are invalid" error (code 108005)
      if (error.message && error.message.includes('108005') && error.message.toLowerCase().includes('style are invalid')) {
        console.log('Style code rejected by API, attempting retry with default style');
        setProgressMessage('Selected style is invalid for this image, trying default style...'); // User feedback
        
        // --- Retry logic ---
        try {
          // Re-create payload explicitly with the SAFE_DEFAULT_API_STYLE_CODE
          const retryPayload = {
            prompt: prompt || `Generate a character portrait of ${characterData.name} in the selected style`, 
            style_code: SAFE_DEFAULT_API_STYLE_CODE, // Use the safe default API code
            images: [{ base64_data: characterData.photoUrl }], 
            color_match: 0,
            face_match: 1,
            style_intensity: 1.0, 
            structure_match: 0.8, 
            quality_mode: 1, 
            generate_slots: [1, 1], 
            output_format: 'webp', 
            negative_prompt: payload.negative_prompt || '', // Keep original negative prompt from first try
            seed: Math.floor(Math.random() * 2147483647) + 1, // Use a new seed for retry
          };
          
          console.log('Retrying img2img task with default style payload:', JSON.stringify({
            ...retryPayload,
            images: retryPayload.images.map(img => ({
              base64_data: img.base64_data ? 'base64_data_present' : undefined,
              url: img.url
            }))
          }, null, 2));

          // Call the service function again
          const retryTaskResponse = await createImg2ImgTask(retryPayload);
                    
          const retryTaskId = retryTaskResponse.task_id;
          console.log('Retry task created with ID:', retryTaskId);
          
          // Start polling for the retry task result
          await startPollingTask(retryTaskId, fallbackImage, generationId);
          
        } catch (retryError) {
          console.error('Retry attempt also failed:', retryError);
          setProgressMessage(`Retry failed: ${retryError.message}`);
          useFallbackImage(fallbackImage); // Use fallback if retry also fails
        }
        // --- End Retry logic ---
        
      } else {
        // For any other non-style errors, just use the fallback image directly
        console.log('Non-style error encountered, using fallback image.');
        useFallbackImage(fallbackImage);
      }
      // Ensure isGenerating is set to false only after all attempts (including retry) are done or fallback is used
      // We might need to move this into the startPollingTask completion logic
      // setIsGenerating(false); 
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
              
      {/* Tab Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
              <button
              onClick={() => handleTabClick(1)}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                step === 1 
                  ? 'text-blue-600 border-blue-600' 
                  : unlockedSteps.includes(1)
                    ? 'border-transparent hover:text-gray-600 hover:border-gray-300'
                    : 'text-gray-400 cursor-not-allowed border-transparent'
              }`}
              disabled={!unlockedSteps.includes(1)}
            >
              Details
              </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => handleTabClick(2)}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                step === 2 
                  ? 'text-blue-600 border-blue-600' 
                  : unlockedSteps.includes(2)
                    ? 'border-transparent hover:text-gray-600 hover:border-gray-300'
                    : 'text-gray-400 cursor-not-allowed border-transparent'
              }`}
              disabled={!unlockedSteps.includes(2)}
            >
              Photo/Description
            </button>
          </li>
          <li className="mr-2">
            <button
              onClick={() => handleTabClick(3)}
              className={`inline-block p-4 border-b-2 rounded-t-lg ${
                step === 3 
                  ? 'text-blue-600 border-blue-600' 
                  : unlockedSteps.includes(3)
                    ? 'border-transparent hover:text-gray-600 hover:border-gray-300'
                    : 'text-gray-400 cursor-not-allowed border-transparent'
              }`}
              disabled={!unlockedSteps.includes(3)}
            >
              Confirm
            </button>
          </li>
        </ul>
            </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          </div>
        )}
      
      {/* Step Content */}
      <div className="mb-8 min-h-[400px]">
        {renderStep()}
      </div>
      
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