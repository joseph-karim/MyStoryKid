import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCharacterStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { createImg2ImgTask, getTaskProgress } from '../services/dzineService';

// Style ID to code map (copy from ArtStyleStep.jsx)
const styleIdToCodeMap = {
  watercolor: '33',    // Watercolor styles
  pastel: '32',        // Pastel style
  pencil_wash: '24',   // Pencil wash
  soft_digital: '73',  // Soft digital
  pencil_ink: '22',    // Pencil and ink
  golden_books: '70',  // Golden books style
  beatrix_potter: '34', // Potter-like
  cartoon: '80',       // Cartoon
  flat_vector: '81',   // Flat vector
  storybook_pop: '82', // Storybook
  papercut: '83',      // Papercut style
  oil_pastel: '35',    // Oil pastel
  stylized_realism: '44', // Stylized realism
  digital_painterly: '45', // Digital painterly
  kawaii: '86',        // Kawaii style
  scandinavian: '87',  // Scandinavian
  african_pattern: '88', // African patterns
  custom: 'custom'     // Custom style
};

// Fallback style code for when mapping fails
const SAFE_STYLE_CODE = "80"; // Common working style code for cartoon

// Helper to get a safe style code for API use
const getSafeStyleCode = (styleId) => {
  // Get the numeric code from the map
  const styleCode = styleIdToCodeMap[styleId];
  
  // If no valid style code is available, use a known working default
  if (!styleCode || styleCode === 'undefined' || styleCode === 'custom') {
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
  const fileInputRef = useRef(null);
  
  // Character data
  const [characterData, setCharacterData] = useState({
    id: uuidv4(),
    name: '',
    type: 'child',
    age: '',
    gender: '',
    traits: [],
    interests: [],
    photoUrl: null,
    artStyle: forcedArtStyle || 'cartoon',
    stylePreview: null,
    description: '',
  });
  
  // Character types
  const CHARACTER_TYPES = [
    { id: 'child', name: 'Child', description: 'The main character - based on your child' },
    { id: 'sibling', name: 'Sibling', description: 'Brother or sister' },
    { id: 'friend', name: 'Friend', description: 'A friend to join the adventure' },
    { id: 'magical', name: 'Magical Character', description: 'A fairy, wizard or magical creature' },
    { id: 'animal', name: 'Animal', description: 'A pet or wild animal companion' },
  ];
  
  // Art styles with categories and descriptions to match CharactersStep component
  const ART_STYLE_CATEGORIES = [
    {
      category: '🎨 Whimsical & Soft',
      description: 'Warm, comforting styles with a dreamy quality',
      styles: [
        { id: 'watercolor', name: 'Watercolor', description: 'Soft, expressive, and magical. Great for fairy tales.' },
        { id: 'pastel', name: 'Pastel', description: 'Soft-edged and calming, like chalk or crayon textures.' },
        { id: 'pencil_wash', name: 'Gentle Pencil + Wash', description: 'Pencil lines with light color washes. Subtle and intimate.' },
        { id: 'soft_digital', name: 'Soft Digital', description: 'Digital painting with a hand-drawn aesthetic.' }
      ]
    },
    {
      category: '✏️ Classic & Timeless',
      description: 'Styles that evoke nostalgia and timelessness',
      styles: [
        { id: 'pencil_ink', name: 'Pencil & Ink', description: 'Monochrome or light inked outlines with shading.' },
        { id: 'golden_books', name: 'Golden Books', description: 'Inspired by mid-century illustrations. Bright and detailed.' },
        { id: 'beatrix_potter', name: 'Beatrix Potter', description: 'Classic English watercolor with fine detail.' }
      ]
    },
    {
      category: '✨ Modern & Colorful',
      description: 'Bold styles that pop with energy and imagination',
      styles: [
        { id: 'cartoon', name: 'Cartoon', description: 'Clean lines, bright colors, and exaggerated expressions.' },
        { id: 'flat_vector', name: 'Flat Vector', description: 'Bold, clean, and simple. Modern and educational.' },
        { id: 'storybook_pop', name: 'Storybook Pop', description: 'Bright, slightly surreal, and energetic. Great for adventures.' },
        { id: 'papercut', name: 'Paper Collage', description: 'Textured look like layers of paper or fabric.' }
      ]
    },
    {
      category: '🖼️ Artistic & Elevated',
      description: 'More sophisticated, painterly styles',
      styles: [
        { id: 'oil_pastel', name: 'Oil Pastel', description: 'Thick brush strokes, vivid colors, tactile textures.' },
        { id: 'stylized_realism', name: 'Stylized Realism', description: 'Semi-realistic with artistic lighting. Recognizable features.' },
        { id: 'digital_painterly', name: 'Digital Painterly', description: 'Mimics classical painting with digital precision.' }
      ]
    },
    {
      category: '🌍 Cultural Styles',
      description: 'Styles inspired by different traditions',
      styles: [
        { id: 'kawaii', name: 'Japanese Kawaii', description: 'Ultra-cute, rounded characters, soft palettes.' },
        { id: 'scandinavian', name: 'Scandinavian Folk', description: 'Geometric shapes, bold colors, often nature-themed.' },
        { id: 'african_pattern', name: 'African Pattern', description: 'Bright colors, bold patterns, and rich symbolism.' }
      ]
    }
  ];

  // Flatten for easy lookup
  const ALL_ART_STYLES = ART_STYLE_CATEGORIES.flatMap(category => category.styles);
  
  // Skip to the correct step if we have a forcedArtStyle
  useEffect(() => {
    if (forcedArtStyle && step === 3) {
      // Skip art style selection step
      setStep(4);
    }
  }, [step, forcedArtStyle]);
  
  const handleChange = (field, value) => {
    setCharacterData({
      ...characterData,
      [field]: value,
    });
  };
  
  const handlePhotoSelect = (photoUrl) => {
    setCharacterData({
      ...characterData,
      photoUrl,
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
    
    onComplete(newCharacter);
  };
  
  const handleCancel = () => {
    onComplete(null);
  };
  
  const handleBack = () => {
    // If we're on the art style step and forcedArtStyle is provided, go back to photo step
    if (step === 3 && forcedArtStyle) {
      setStep(2);
      return;
    }
    
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
    
    // If moving from step 3 to step 4, generate the preview
    if (step === 3 || (step === 2 && forcedArtStyle)) {
      const nextStep = forcedArtStyle ? 4 : step + 1;
      setStep(nextStep);
      
      // If moving to preview step, generate the character preview
      if (nextStep === 4 && !characterData.stylePreview) {
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
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Choose Art Style</h3>
        
        <div className="space-y-6">
          {ART_STYLE_CATEGORIES.map((category, index) => (
            <div key={index} className="space-y-2">
              <h4 className="font-medium text-gray-700">{category.category}</h4>
              <p className="text-sm text-gray-500">{category.description}</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    <div className="font-medium">{style.name}</div>
                    <div className="text-xs text-gray-500">{style.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderPreviewStep = () => {
    return (
      <div className="space-y-4 text-center">
        <h3 className="text-lg font-semibold mb-4">Confirm Character</h3>
        
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
              <div className="w-32 h-32 mx-auto flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
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
  
  // Generate character preview - updated to use Dzine API
  const generateCharacterPreview = async () => {
    setIsGenerating(true);
    setError('');
    
    // Always use the forced art style if provided, otherwise use the one from character data
    const styleIdToUse = forcedArtStyle || characterData.artStyle;
    
    try {
      if (!characterData.photoUrl) {
        throw new Error('Please upload a photo first');
      }
      
      // If the image is a data URL, convert base64 string from the data URL
      let base64Data = '';
      if (characterData.photoUrl.startsWith('data:image')) {
        base64Data = characterData.photoUrl.split(',')[1];
      } else {
        throw new Error('Invalid image format. Please upload a photo.');
      }
      
      // Build a rich prompt based on character details
      let prompt = `${characterData.name}`;
      if (characterData.age) prompt += `, ${characterData.age} years old`;
      if (characterData.gender) prompt += `, ${characterData.gender}`;
      if (characterData.type) {
        const charType = CHARACTER_TYPES.find(t => t.id === characterData.type);
        if (charType) prompt += `, ${charType.name}`;
      }
      
      // Use artStyle style name in prompt for better results
      const styleInfo = ALL_ART_STYLES.find(s => s.id === styleIdToUse);
      if (styleInfo) {
        prompt += ` in ${styleInfo.name} style`;
      }
      
      // Get the proper style code from the ID - convert to a number
      const styleCodeString = getSafeStyleCode(styleIdToUse);
      const styleCode = parseInt(styleCodeString, 10); // Convert to number
      
      console.log('Creating Dzine task with prompt:', prompt);
      console.log('Using style code for API (numeric):', styleCode);
      
      // Create a payload EXACTLY matching what Dzine API expects (based on their docs)
      const payload = {
        prompt,
        style_code: styleCode, // Use numeric style code
        images: [
          {
            base64_data: base64Data
          }
        ],
        style_intensity: 1,
        structure_match: 0.5,
        face_match: 0.9
      };
      
      console.log('API payload structure:', JSON.stringify({
        ...payload,
        images: [{ base64_data: "..." }]
      }, null, 2));
      
      // Call the Dzine API to create an img2img task
      const result = await createImg2ImgTask(payload);
      console.log('Dzine task created:', result);
      
      if (!result || !result.task_id) {
        throw new Error('Failed to create image generation task');
      }
      
      const taskId = result.task_id;
      
      // Set up polling to check task progress
      const pollInterval = setInterval(async () => {
        try {
          const progress = await getTaskProgress(taskId);
          console.log('Task progress:', progress);
          
          if (progress.status === 'done') {
            clearInterval(pollInterval);
            
            if (progress.images && progress.images.length > 0) {
              // Successfully generated the image
              const imageUrl = progress.images[0].url;
              
              setCharacterData(prev => ({
                ...prev,
                artStyle: styleIdToUse,
                stylePreview: imageUrl
              }));
              
              setIsGenerating(false);
            } else {
              throw new Error('No images returned from generation');
            }
          } else if (progress.status === 'failed') {
            clearInterval(pollInterval);
            throw new Error(`Generation failed: ${progress.reason || 'Unknown error'}`);
          }
          // Continue polling for 'running' status
        } catch (pollError) {
          clearInterval(pollInterval);
          console.error('Error polling task progress:', pollError);
          
          // Fallback to placeholder if API generation fails
          const bgColor = stringToColor(characterData.name + styleIdToUse);
          const fallbackPreview = createColorPlaceholder(bgColor, characterData.name);
          
          setCharacterData(prev => ({
            ...prev,
            artStyle: styleIdToUse,
            stylePreview: fallbackPreview
          }));
          
          setError(`Failed to generate preview: ${pollError.message}. Using placeholder instead.`);
          setIsGenerating(false);
        }
      }, 2000); // Poll every 2 seconds
      
      // Set a timeout to stop polling after 60 seconds
      setTimeout(() => {
        if (pollInterval) {
          clearInterval(pollInterval);
          
          // Check if we're still generating (didn't get a result)
          if (isGenerating) {
            const bgColor = stringToColor(characterData.name + styleIdToUse);
            const fallbackPreview = createColorPlaceholder(bgColor, characterData.name);
            
            setCharacterData(prev => ({
              ...prev,
              artStyle: styleIdToUse,
              stylePreview: fallbackPreview
            }));
            
            setError('Generation timed out. Using placeholder instead.');
            setIsGenerating(false);
          }
        }
      }, 60000); // 60 second timeout
      
    } catch (error) {
      console.error('Error creating Dzine task:', error);
      
      // Fallback to placeholder on error
      const bgColor = stringToColor(characterData.name + styleIdToUse);
      const fallbackPreview = createColorPlaceholder(bgColor, characterData.name);
      
      setCharacterData(prev => ({
        ...prev,
        artStyle: styleIdToUse,
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
          onClick={() => {
            if (step > 1) {
              // Special case for forced art style - skip style selection step
              if (forcedArtStyle && step === 4) {
                setStep(2); // Go back to photo upload
              } else {
                setStep(step - 1);
              }
            }
          }}
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