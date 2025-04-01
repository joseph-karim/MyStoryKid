import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCharacterStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { createImg2ImgTask, getTaskProgress, checkApiAccess, getDzineStyles } from '../services/dzineService';

// Style ID to code map - using REAL Dzine API style codes from the API response
const styleIdToCodeMap = {
  // Common styles with their proper Dzine API style codes
  watercolor: 'Style-2478f952-50e7-4773-9cd3-c6056e774823', // Classic Watercolor
  pastel: 'Style-206baa8c-5bbe-4299-b984-9243d05dce9b',     // Whimsical Coloring
  pencil_wash: 'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9', // Line & Wash
  soft_digital: 'Style-7f3f81ad-1c2d-4a15-944d-66bf549641de', // Watercolor Whimsy
  pencil_ink: 'Style-e9021405-1b37-4773-abb9-bd80485527b0',  // Sketch Elegance
  golden_books: 'Style-a37d7b69-1f9a-42c4-a8e4-f429c29f4512', // Golden Era Illustrations
  beatrix_potter: 'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1', // Warm Fables
  cartoon: 'Style-b484beb8-143e-4776-9a87-355e0456cfa3',    // Cartoon Anime
  flat_vector: 'Style-2ee57e3c-108a-41dd-8b28-b16d0ceb6280', // Simple Icon
  storybook_pop: 'Style-85480a6c-4aa6-4260-8ad1-a0b7423910cf', // Storybook Charm
  papercut: 'Style-541a2afd-904a-4968-bc60-8ad0ede22a86',   // Paper Cutout
  oil_pastel: 'Style-b7c0d088-e046-4e9b-a0fb-a329d2b9a36a', // Vibrant Impasto
  stylized_realism: 'Style-bfb2db5f-ecfc-4fe9-b864-1a5770d59347', // Structured Serenity
  digital_painterly: 'Style-ce7b4279-1398-4964-882c-19911e12aef3', // Luminous Narratives
  kawaii: 'Style-455da805-d716-4bc8-a960-4ac505aa7875',     // Everything Kawaii
  scandinavian: 'Style-509ffd5a-e71f-4cec-890c-3ff6dcb9cb60', // Scandi
  african_pattern: 'Style-64894017-c7f5-4316-b16b-43c584bcd643', // Bold Collage
  custom: 'Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2'      // No Style v2 (default)
};

// Fallback style code for when mapping fails - use "No Style v2" as fallback
const SAFE_STYLE_CODE = "Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2"; 

// Helper to get a safe style code for API use
const getSafeStyleCode = (styleId) => {
  // Check if the styleId is already a full style code (starts with "Style-")
  if (styleId && styleId.startsWith('Style-')) {
    return styleId;
  }
  
  // Get the style code from the map
  const styleCode = styleIdToCodeMap[styleId];
  
  // If no valid style code is available, use the default "No Style"
  if (!styleCode) {
    console.log("Using default safe style code:", SAFE_STYLE_CODE);
    return SAFE_STYLE_CODE;
  }
  
  return styleCode;
};

function CharacterWizard({ onComplete, initialStep = 1, bookCharacters = [], forcedArtStyle = null }) {
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
  
  // Add state for API styles
  const [apiStyles, setApiStyles] = useState([]);
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);
  
  // Character data
  const [characterData, setCharacterData] = useState(() => ({
    id: uuidv4(), // Generate a unique ID each time the component mounts
    name: '',
    type: 'child',
    age: '',
    gender: '',
    traits: [],
    interests: [],
    photoUrl: null,
    artStyle: forcedArtStyle || null, // Will be set to first available style after fetch
    stylePreview: null,
    description: '',
  }));
  
  // Fetch styles from API on mount
  useEffect(() => {
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
  }, []);
  
  // Run API diagnostic check on mount
  useEffect(() => {
    const checkApi = async () => {
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
    
    checkApi();
  }, []);
  
  // Cleanup function for any active polling
  useEffect(() => {
    // Return cleanup function
    return () => {
      // If we're still generating when component unmounts, set flag to false
      if (isGenerating) {
        console.log('Component unmounting, cleaning up generation state');
        setIsGenerating(false);
      }
    };
  }, [isGenerating]);
  
  // Character types
  const CHARACTER_TYPES = [
    { id: 'child', name: 'Child', description: 'The main character - based on your child' },
    { id: 'sibling', name: 'Sibling', description: 'Brother or sister' },
    { id: 'friend', name: 'Friend', description: 'A friend to join the adventure' },
    { id: 'magical', name: 'Magical Character', description: 'A fairy, wizard or magical creature' },
    { id: 'animal', name: 'Animal', description: 'A pet or wild animal companion' },
  ];
  
  // Helper function to categorize styles from API
  const getStyleCategories = () => {
    if (!apiStyles.length) return [];
    
    // Create categories based on patterns in style names
    const categories = [
      {
        category: '🎨 3D & Cartoon Styles',
        description: 'Modern 3D and cartoon art styles',
        filter: style => 
          style.name.toLowerCase().includes('3d') || 
          style.name.toLowerCase().includes('cartoon') ||
          style.name.toLowerCase().includes('pixie') ||
          style.name.toLowerCase().includes('anime')
      },
      {
        category: '🖌️ Artistic & Painterly',
        description: 'Painterly and artistic styles with texture and depth',
        filter: style => 
          style.name.toLowerCase().includes('paint') || 
          style.name.toLowerCase().includes('art') ||
          style.name.toLowerCase().includes('water') ||
          style.name.toLowerCase().includes('drawing')
      },
      {
        category: '✏️ Classic & Illustration',
        description: 'Classic illustration styles, perfect for storybooks',
        filter: style => 
          style.name.toLowerCase().includes('illustration') || 
          style.name.toLowerCase().includes('classic') ||
          style.name.toLowerCase().includes('golden') ||
          style.name.toLowerCase().includes('story') ||
          style.name.toLowerCase().includes('book')
      },
      {
        category: '✨ Whimsical & Fun',
        description: 'Playful, cute, and whimsical styles for young children',
        filter: style => 
          style.name.toLowerCase().includes('fun') || 
          style.name.toLowerCase().includes('cute') ||
          style.name.toLowerCase().includes('whimsical') ||
          style.name.toLowerCase().includes('playful') ||
          style.name.toLowerCase().includes('toy')
      }
    ];
    
    // Create the structured categories with styles
    const structuredCategories = categories.map(category => {
      const matchingStyles = apiStyles.filter(category.filter);
      return {
        ...category,
        styles: matchingStyles.map(style => ({
          id: style.style_code,
          name: style.name,
          description: `${style.name} style`,
          imageUrl: style.cover_url
        }))
      };
    });
    
    // Add an "All Styles" category for any remaining styles
    const allCategorizedStyles = structuredCategories.flatMap(cat => cat.styles.map(s => s.id));
    const uncategorizedStyles = apiStyles.filter(style => 
      !allCategorizedStyles.includes(style.style_code)
    );
    
    if (uncategorizedStyles.length > 0) {
      structuredCategories.push({
        category: '🌟 More Styles',
        description: 'Additional art styles to explore',
        styles: uncategorizedStyles.map(style => ({
          id: style.style_code,
          name: style.name,
          description: `${style.name} style`,
          imageUrl: style.cover_url
        }))
      });
    }
    
    // Filter out any empty categories
    return structuredCategories.filter(cat => cat.styles.length > 0);
  };
  
  // Skip to the correct step if we have a forcedArtStyle
  useEffect(() => {
    if (forcedArtStyle && step === 3) {
      // Skip art style selection step
      setStep(4);
    }
  }, [step, forcedArtStyle]);
  
  const handleChange = (field, value) => {
    // If changing art style, reset the style preview
    if (field === 'artStyle' && value !== characterData.artStyle) {
      setCharacterData({
        ...characterData,
        [field]: value,
        stylePreview: null // Reset the preview when style changes
      });
    } else {
      setCharacterData({
        ...characterData,
        [field]: value,
      });
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
    });
  };
  
  const handleComplete = () => {
    if (!characterData.name) {
      setError('Please enter a name for your character.');
      return;
    }
    
    const newCharacter = {
      ...characterData,
      id: characterData.id || uuidv4(),
      // Ensure we use the forced art style if provided
      artStyle: forcedArtStyle || characterData.artStyle
    };
    
    // Reset for next use
    resetCharacterState();
    
    onComplete(newCharacter);
  };
  
  const handleCancel = () => {
    // Reset for next use
    resetCharacterState();
    
    onComplete(null);
  };
  
  const handleBack = () => {
    // Don't allow going back from the first step
    if (step <= 1) return;
    
    // If we're on the preview step and user goes back
    if (step === 4) {
      // If forcedArtStyle is provided, go back to photo upload (skip style selection)
      if (forcedArtStyle) {
        setStep(2);
      } else {
        // Otherwise go back to style selection
        setStep(3);
      }
      return;
    }
    
    // If we're in the art style step, go back to photo upload
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
    
    if (step === 4) {
      // This is the final step
      handleComplete();
      return;
    }
    
    // If moving from step 3 (art style) to step 4 (preview), generate the preview
    if (step === 3 || (step === 2 && forcedArtStyle)) {
      const nextStep = forcedArtStyle ? 4 : step + 1;
      
      // Reset the preview if we're changing styles
      if (step === 3 && characterData.stylePreview) {
        setCharacterData(prev => ({
          ...prev,
          stylePreview: null
        }));
      }
      
      setStep(nextStep);
      
      // If moving to preview step, generate the character preview
      if (nextStep === 4 && (!characterData.stylePreview || !isGenerating)) {
        generateCharacterPreview();
      }
      return;
    }
    
    // Regular step progression
    setStep(step + 1);
    setError('');
  };
  
  // Handle selecting an existing character
  const handleSelectExistingCharacter = (character) => {
    setCurrentCharacter(character);
    setPhotoPreview(character.photoUrl);
    setStep(4); // Skip to preview
  };
  
  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setCharacterData(prev => ({ ...prev, photoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };
  
  // Render functions for each step
  const renderExistingCharactersStep = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Character Details</h3>
        
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Character Name*
          </label>
          <input
            type="text"
            id="name"
            value={characterData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter character name"
          />
      </div>
      
          <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Character Type
          </label>
          <select
            id="type"
            value={characterData.type}
            onChange={(e) => handleChange('type', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            {CHARACTER_TYPES.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} - {type.description}
              </option>
            ))}
          </select>
          </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
              Age
                      </label>
                  <input
                    type="text"
                    id="age"
                    value={characterData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Age"
                  />
                </div>
                
          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
              Gender
                      </label>
            <select
              id="gender"
              value={characterData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
                  </div>
                </div>
              </div>
    );
  };
  
  const renderCharacterDetailsStep = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Upload Character Photo</h3>
        
        <div className="text-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                  {photoPreview ? (
            <div className="space-y-4">
                      <img 
                        src={photoPreview} 
                        alt="Character preview" 
                className="w-32 h-32 object-cover mx-auto rounded-lg"
                      />
                      <button 
                onClick={() => {
                          setPhotoPreview(null);
                  setCharacterData(prev => ({ ...prev, photoUrl: null }));
                        }}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
                      >
                Remove Photo
                      </button>
                    </div>
                  ) : (
            <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                className="hidden"
                    accept="image/*"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
              >
                Upload Photo
              </button>
              <p className="text-sm text-gray-500 mt-2">
                Upload a photo to be transformed into your character's style
              </p>
            </>
          )}
                </div>
              </div>
    );
  };
  
  const renderAppearanceStep = () => {
    const styleCategories = getStyleCategories();
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Choose Art Style</h3>
        
        {isLoadingStyles ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            <span className="ml-2">Loading available styles...</span>
          </div>
        ) : apiStyles.length === 0 ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-md">
            <p>No art styles could be loaded from the API. Please try again later.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {styleCategories.map((category, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-medium text-gray-700">{category.category}</h4>
                <p className="text-sm text-gray-500">{category.description}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {category.styles.map(style => (
                    <div
                      key={style.id}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        characterData.artStyle === style.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-200'
                      }`}
                      onClick={() => handleChange('artStyle', style.id)}
                    >
                      <div className="flex items-center space-x-3">
                        {style.imageUrl && (
                          <img 
                            src={style.imageUrl} 
                            alt={style.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{style.name}</div>
                          <div className="text-xs text-gray-500">{style.description}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const renderPreviewStep = () => {
    return (
      <div className="space-y-4 text-center">
        <h3 className="text-lg font-semibold mb-4">Confirm Character</h3>
        
        {/* API Status Indicator for troubleshooting */}
        {apiStatus.checked && (
          <div className={`text-sm p-2 rounded-md mb-4 ${apiStatus.working ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <p className="font-semibold">API Status: {apiStatus.working ? 'Connected' : 'Connection Issue'}</p>
            {!apiStatus.working && (
              <p className="text-xs mt-1">{apiStatus.message}</p>
            )}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs mt-1 opacity-70">Developer info: {JSON.stringify({
                checked: apiStatus.checked,
                working: apiStatus.working,
                details: apiStatus.details?.substring(0, 100)
              })}</p>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
          {photoPreview && (
          <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Original Photo</p>
              <img 
                src={photoPreview} 
                alt="Original" 
                className="w-32 h-32 object-cover rounded-lg border border-gray-300" 
                    />
                  </div>
                )}
                
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Character Preview</p>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center p-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mb-2"></div>
                <span className="text-sm text-center">{progressMessage || 'Generating preview...'}</span>
              </div>
            ) : characterData.stylePreview ? (
              <img 
                src={characterData.stylePreview} 
                alt="Style preview" 
                className="w-32 h-32 object-cover rounded-lg border border-blue-300" 
              />
            ) : (
              <div className="w-32 h-32 mx-auto flex items-center justify-center bg-gray-100 rounded-lg text-sm text-gray-400">
                No preview yet
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium">{characterData.name}</h4>
          <p className="text-sm text-gray-600">
            {CHARACTER_TYPES.find(t => t.id === characterData.type)?.name || 'Character'} 
            {characterData.age && `, ${characterData.age} years old`}
            {characterData.gender && `, ${characterData.gender}`}
          </p>
              </div>
            </div>
    );
  };
  
  // Update the generateCharacterPreview function to use the selected API style directly
  const generateCharacterPreview = async () => {
    setIsGenerating(true);
    setError('');
    
    // Display a warning if API check failed
    if (apiStatus.checked && !apiStatus.working) {
      console.warn('Attempting to generate character with failing API:', apiStatus.message);
      setProgressMessage(`Warning: API check failed (${apiStatus.message}). Trying anyway...`);
    }
    
    try {
      if (!characterData.photoUrl) {
        throw new Error('Please upload a photo first');
      }
      
      if (!characterData.artStyle) {
        throw new Error('Please select an art style');
      }
      
      // Extract the base64 data correctly
      let base64Data = '';
      if (characterData.photoUrl.startsWith('data:image')) {
        // According to the documentation, we should use the full data URL
        base64Data = characterData.photoUrl;
      } else {
        throw new Error('Invalid image format. Please upload a photo.');
      }
      
      // Build a simple prompt based on character details
      let prompt = `${characterData.name}`;
      if (characterData.age) prompt += `, ${characterData.age} years old`;
      if (characterData.gender) prompt += `, ${characterData.gender}`;
      
      // Use the style code directly from character data (which is now set to the API style code)
      const styleCode = characterData.artStyle;
      console.log("Using style code directly from character data:", styleCode);
      
      // Create the payload for the API - matching the working parameters
      const payload = {
        prompt: prompt,
        style_code: styleCode,
        images: [
          {
            base64_data: base64Data
          }
        ],
        style_intensity: 0.8,
        structure_match: 0.7,
        face_match: 1,
        color_match: 0,
        quality_mode: 0,
        generate_slots: [1, 0, 0, 0],
        output_format: "webp"
      };
      
      // Log the payload structure (without the full base64 data)
      console.log('Sending payload with structure:', {
        ...payload,
        images: [{ base64_data: "data:image/*;base64,..." }]
      });
      console.log("Style selected:", styleCode);
      
      try {
        // Call the Dzine API to create an img2img task
        const result = await createImg2ImgTask(payload);
        console.log('Dzine task created:', result);
        
        if (!result) {
          throw new Error('Empty response from image generation API');
        }
        
        // Check for task_id in different possible locations
        let taskId = null;
        
        if (result.task_id) {
          taskId = result.task_id;
          console.log('Found task_id directly in result:', taskId);
        } else if (result.data && result.data.task_id) {
          taskId = result.data.task_id;
          console.log('Found task_id in result.data:', taskId);
        } else if (typeof result === 'string' && result.includes('task')) {
          // In case the API returns a string with the task ID
          taskId = result;
          console.log('Found task as string:', taskId);
        } else {
          // Log the structure for debugging
          console.error('Could not find task_id in result:', JSON.stringify(result));
          throw new Error('Invalid response from API: missing task_id. Response: ' + JSON.stringify(result).substring(0, 100));
        }
        
        let pollCount = 0;
        let maxPolls = 20; // Maximum number of polling attempts (40 seconds at 2 second intervals)
        
        // Create a unique ID for this polling session to avoid conflicts
        const pollingId = uuidv4();
        console.log(`Starting polling with ID ${pollingId} for task ${taskId}`);
        
        // Mark this polling session as active
        pollingSessionRef.current[pollingId] = true;
        
        // Set up polling to check task progress
        const pollInterval = setInterval(async () => {
          try {
            // If component is unmounted or polling was explicitly canceled for this session
            if (!pollingSessionRef.current[pollingId]) {
              console.log(`Stopping poll ${pollingId} because polling was explicitly canceled`);
              clearInterval(pollInterval);
              return;
            }
            
            pollCount++;
            setProgressMessage(`Checking progress... (attempt ${pollCount}/${maxPolls})`);
            
            // Check task progress
            const progressData = await getTaskProgress(taskId);
            console.log(`Poll ${pollCount}/${maxPolls} for task ${taskId}:`, progressData);
            
            // Handle different status formats
            const status = 
              progressData.status || 
              (progressData.data && progressData.data.status) || 
              'unknown';
            
            console.log(`Task status: ${status}`);
            
            if (status === 'succeed' || status === 'succeeded') {
              // Task completed successfully
              console.log('Task completed successfully!');
              
              // Look for the result image URL(s) in various places
              let resultUrls = [];
              
              if (progressData.images) {
                // Case 1: Direct images array
                resultUrls = progressData.images;
                console.log('Found images directly in progressData:', resultUrls);
              } else if (progressData.data && progressData.data.images) {
                // Case 2: Images in data object
                resultUrls = progressData.data.images;
                console.log('Found images in progressData.data:', resultUrls);
              } else if (progressData.result && progressData.result.images) {
                // Case 3: Images in result object
                resultUrls = progressData.result.images;
                console.log('Found images in progressData.result:', resultUrls);
              } else {
                // Try to find images elsewhere in the response
                console.log('Looking for images in full response:', progressData);
                
                // Case 4: Try to locate any URL that looks like an image
                const extractUrls = (obj, prefix = '') => {
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
                      urls = [...urls, ...extractUrls(obj[key], path)];
                    }
                  });
                  return urls;
                };
                
                resultUrls = extractUrls(progressData);
                console.log('Extracted possible image URLs:', resultUrls);
              }
              
              // If we found any URLs, use the first one
              if (resultUrls && resultUrls.length > 0) {
                let imageUrl = null;
                
                // If the "URLs" are actually base64 data, use as is
                if (resultUrls[0].startsWith('data:image')) {
                  imageUrl = resultUrls[0];
                } else {
                  // Otherwise assume it's a URL
                  imageUrl = resultUrls[0];
                }
                
                console.log('Using image URL:', imageUrl);
                
                // Update the character data with the style preview
                setCharacterData(prev => ({
                  ...prev,
                  stylePreview: imageUrl
                }));
                
                // We're done polling
                console.log(`Successful completion, ending poll ${pollingId}`);
                clearInterval(pollInterval);
                setIsGenerating(false);
                delete pollingSessionRef.current[pollingId];
                return;
              } else {
                console.warn('Task completed but no images found in the response');
                setProgressMessage('Task completed but no images found ⚠️');
              }
            } else if (status === 'failed' || status === 'error') {
              // Task failed
              console.error('Task failed:', progressData);
              setProgressMessage('The image generation task failed ❌');
              clearInterval(pollInterval);
              setIsGenerating(false);
              delete pollingSessionRef.current[pollingId];
              return;
            } else if (status === 'pending' || status === 'processing' || status === 'unknown') {
              // Task still in progress
              // Extract progress percentage if available
              let progress = null;
              
              if (typeof progressData.progress === 'number') {
                progress = progressData.progress;
              } else if (progressData.data && typeof progressData.data.progress === 'number') {
                progress = progressData.data.progress;
              }
              
              if (progress !== null) {
                const percent = Math.round(progress * 100);
                setProgressMessage(`Generating preview... ${percent}%`);
              } else {
                setProgressMessage(`Generating preview... (poll ${pollCount}/${maxPolls})`);
              }
            }
            
            // If we've reached the maximum polling attempts, stop polling
            if (pollCount >= maxPolls) {
              console.log(`Reached maximum polling attempts (${maxPolls}), stopping`);
              setProgressMessage('Generation taking longer than expected, please try again');
              clearInterval(pollInterval);
              setIsGenerating(false);
              delete pollingSessionRef.current[pollingId];
              return;
            }
          } catch (error) {
            console.error(`Error in polling attempt ${pollCount}:`, error);
            
            if (pollCount >= maxPolls) {
              setProgressMessage('Error checking progress, please try again');
              clearInterval(pollInterval);
              setIsGenerating(false);
              delete pollingSessionRef.current[pollingId];
            } else {
              setProgressMessage(`Error checking progress, retrying... (${pollCount}/${maxPolls})`);
            }
          }
        }, 2000);
        
        // Cleanup for this specific polling session when component unmounts or retry
        useEffect(() => {
          return () => {
            console.log(`Component unmounting, cleaning up generation state`);
            pollingSessionRef.current = {};
            setIsGenerating(false);
          };
        }, []);
      } catch (apiError) {
        console.error('API Error:', apiError);
        throw new Error(`Dzine API error: ${apiError.message}`);
      }
    } catch (error) {
      console.error('Error creating Dzine task:', error);
      
      // Always fall back to placeholder on error
      const bgColor = stringToColor(characterData.name + styleCode);
      const fallbackPreview = createColorPlaceholder(bgColor, characterData.name);
      
      setCharacterData(prev => ({
        ...prev,
        artStyle: styleCode,
        stylePreview: fallbackPreview
      }));
      
      setError(`Failed to generate character: ${error.message}. Using placeholder instead.`);
      setIsGenerating(false);
    }
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
  
  // Modify the step rendering to skip the art style selection if there's a forced style
  const renderStep = () => {
    // If we have a forced art style, skip step 3 (art style selection)
    if (forcedArtStyle && step === 3) {
      console.log("Skipping style selection because forcedArtStyle is set:", forcedArtStyle);
      // Jump directly to preview step (with a slight delay for smoothness)
      setTimeout(() => {
        generateCharacterPreview();
      }, 100);
      return (
        <div className="text-center p-8">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Applying the story's art style to your character...</p>
        </div>
      );
    }
    
    switch (step) {
      case 1:
        return renderExistingCharactersStep();
      case 2:
        return renderCharacterDetailsStep();
      case 3:
        return renderAppearanceStep();
      case 4:
        return renderPreviewStep();
      default:
        return null;
    }
  };
  
  // Also modify the conditional render to always generate preview when step 4 is mounted
  useEffect(() => {
    // Auto-generate preview when entering step 4 (preview step)
    if (step === 4 && !characterData.stylePreview && !isGenerating) {
      generateCharacterPreview();
    }
  }, [step]);
  
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
      
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          <div className={`text-sm ${step === 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Details</div>
          <div className={`text-sm ${step === 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Photo</div>
          {!forcedArtStyle && (
            <div className={`text-sm ${step === 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Style</div>
          )}
          <div className={`text-sm ${step === 4 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Confirm</div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min(100, ((step - 1) / (forcedArtStyle ? 2 : 3)) * 100)}%` 
            }}
          ></div>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          </div>
        )}
      
      {/* Step Content */}
      <div className="mb-8 min-h-[300px]">
        {renderStep()}
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className={`px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 ${
            step === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
          }`}
          disabled={step === 1}
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {step === 4 ? 'Complete' : 'Next'}
        </button>
      </div>
    </div>
  );
}

export default CharacterWizard; 