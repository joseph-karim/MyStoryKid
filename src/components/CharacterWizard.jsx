import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacterStore } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { createImg2ImgTask, createTxt2ImgTask, getTaskProgress, checkApiAccess, getDzineStyles } from '../services/dzineService';

// Import art style images from the Dzine Styles folder
import starlitFantasyImg from '../assets/dzine-styles/Starlit-Fantasy.png';
import cheerfulStorybookImg from '../assets/dzine-styles/Cheerful-Storybook.png';
import enchantedEleganceImg from '../assets/dzine-styles/Enchanted-Elegance.png';
import glossyEleganceImg from '../assets/dzine-styles/Glossy-Elegance.png';
import minimalistCuteImg from '../assets/dzine-styles/Minimalist-Cutesy.png';
import watercolorWhimsyImg from '../assets/dzine-styles/Watercolor-Whimsy.png';
import pleasantlyWarmImg from '../assets/dzine-styles/Pleasantly-Warm.png';
import ancientChinaImg from '../assets/dzine-styles/Ancient-China.png';
import lineAndWashImg from '../assets/dzine-styles/Line-&-Wash.png';
import magicPortraitImg from '../assets/dzine-styles/Magic-Portrait.png';
import warmPortraitImg from '../assets/dzine-styles/Warm-Portrait.png';
import goldenHourImg from '../assets/dzine-styles/Golden-Hour.png';
import dreamlikePortraitureImg from '../assets/dzine-styles/Dreamlike-Portraiture.png';
import luminousNarrativesImg from '../assets/dzine-styles/Luminous-Narratives.png';
import aquarelleLifeImg from '../assets/dzine-styles/Aquarelle-Life.png';
import vividTableauxImg from '../assets/dzine-styles/Vivid-Tableaux.png';
import whimsicalColoringImg from '../assets/dzine-styles/Whimsical-Coloring.png';
import ceramicLifelikeImg from '../assets/dzine-styles/Ceramic-Lifelike.png';
import joyfulClayImg from '../assets/dzine-styles/Joyful-Clay.png';
import yarnRealismImg from '../assets/dzine-styles/Yarn-Realism.png';
import fantasyHeroImg from '../assets/dzine-styles/Fantasy-Hero.png';
import storytimeWhimsyImg from '../assets/dzine-styles/Storytime-Whimsy.png';
import cuteExaggerationImg from '../assets/dzine-styles/Cute-Exaggeration.png';
import enchantedCharacterImg from '../assets/dzine-styles/Enchanted-Character.png';
import mysticalSovereigntyImg from '../assets/dzine-styles/Mystical-Sovereignty.png';
import softRadianceImg from '../assets/dzine-styles/Soft-Radiance.png';

// Map style IDs to the imported images
const styleImageMap = {
  watercolor_whimsy: watercolorWhimsyImg,
  whimsical_coloring: whimsicalColoringImg,
  enchanted_character: enchantedCharacterImg,
  minimalist_cutesy: minimalistCuteImg,
  
  cheerful_storybook: cheerfulStorybookImg,
  pleasantly_warm: pleasantlyWarmImg,
  storytime_whimsy: storytimeWhimsyImg,
  line_and_wash: lineAndWashImg,
  golden_hour: goldenHourImg,
  
  cute_exaggeration: cuteExaggerationImg,
  glossy_elegance: glossyEleganceImg,
  starlit_fantasy: starlitFantasyImg,
  fantasy_hero: fantasyHeroImg,
  joyful_clay: joyfulClayImg,
  
  enchanted_elegance: enchantedEleganceImg,
  warm_portrait: warmPortraitImg,
  magic_portrait: magicPortraitImg,
  vivid_tableaux: vividTableauxImg,
  luminous_narratives: luminousNarrativesImg,
  
  // Additional styles
  dreamlike_portraiture: dreamlikePortraitureImg,
  aquarelle_life: aquarelleLifeImg,
  ancient_china: ancientChinaImg,
  ceramic_lifelike: ceramicLifelikeImg,
  yarn_realism: yarnRealismImg,
  mystical_sovereignty: mysticalSovereigntyImg,
  soft_radiance: softRadianceImg
};

// Curated art style categories with representative styles
const CURATED_STYLES = [
  {
    category: 'Whimsical & Soft (Ages 0–5)',
    description: 'Gentle, dreamy art styles perfect for the youngest readers with soft colors and comforting visuals.',
    styles: [
      { id: 'watercolor_whimsy', name: 'Watercolor Whimsy', description: 'Rounded shapes and soft digital brushwork with gentle gradients', imageUrl: watercolorWhimsyImg, keywordMatch: ['water', 'soft', 'gentle'] },
      { id: 'whimsical_coloring', name: 'Whimsical Coloring', description: 'Tender, soothing colors with a gentle, chalky texture', imageUrl: whimsicalColoringImg, keywordMatch: ['color', 'chalky', 'whimsical'] },
      { id: 'enchanted_character', name: 'Enchanted Character', description: 'Magical characters with soft lighting and enchanting atmosphere', imageUrl: enchantedCharacterImg, keywordMatch: ['magical', 'enchanted', 'character'] },
      { id: 'minimalist_cutesy', name: 'Minimalist Cutesy', description: 'Simple, cute designs with minimal details and soft colors', imageUrl: minimalistCuteImg, keywordMatch: ['simple', 'cute', 'minimal'] }
    ]
  },
  {
    category: 'Classic & Timeless (Ages 3–8)',
    description: 'Traditional illustration styles reminiscent of beloved children\'s books that stand the test of time.',
    styles: [
      { id: 'cheerful_storybook', name: 'Cheerful Storybook', description: 'Bright, cheerful illustrations with bold colors and playful details', imageUrl: cheerfulStorybookImg, keywordMatch: ['cheerful', 'storybook', 'bright'] },
      { id: 'pleasantly_warm', name: 'Pleasantly Warm', description: 'Charming, detailed watercolor illustrations with a warm, cozy feeling', imageUrl: pleasantlyWarmImg, keywordMatch: ['warm', 'cozy', 'charming'] },
      { id: 'storytime_whimsy', name: 'Storytime Whimsy', description: 'Whimsical, storybook-style illustrations with a classic feel', imageUrl: storytimeWhimsyImg, keywordMatch: ['storytime', 'whimsy', 'classic'] },
      { id: 'line_and_wash', name: 'Line and Wash', description: 'Delicate pencil drawings with light watercolor washes for a timeless feel', imageUrl: lineAndWashImg, keywordMatch: ['pencil', 'wash', 'line'] },
      { id: 'golden_hour', name: 'Golden Hour', description: 'Nostalgic illustrations with warm, golden lighting', imageUrl: goldenHourImg, keywordMatch: ['golden', 'nostalgic', 'warm'] }
    ]
  },
  {
    category: 'Modern & Colorful (Ages 4–9)',
    description: 'Bold, vibrant styles with clean lines and contemporary design sensibilities.',
    styles: [
      { id: 'cute_exaggeration', name: 'Cute Exaggeration', description: 'Playful, exaggerated features with bright colors and clean lines', imageUrl: cuteExaggerationImg, keywordMatch: ['cute', 'exaggerated', 'playful'] },
      { id: 'glossy_elegance', name: 'Glossy Elegance', description: 'Clean, sleek, modern illustrations with a glossy finish', imageUrl: glossyEleganceImg, keywordMatch: ['glossy', 'elegant', 'sleek'] },
      { id: 'starlit_fantasy', name: 'Starlit Fantasy', description: 'Magical, dreamy illustrations with starry, fantastical elements', imageUrl: starlitFantasyImg, keywordMatch: ['starlit', 'fantasy', 'magical'] },
      { id: 'fantasy_hero', name: 'Fantasy Hero', description: 'Bold, heroic character illustrations with a fantasy adventure feel', imageUrl: fantasyHeroImg, keywordMatch: ['fantasy', 'hero', 'bold'] },
      { id: 'joyful_clay', name: 'Joyful Clay', description: 'Cheerful characters that look like they are made of colorful clay', imageUrl: joyfulClayImg, keywordMatch: ['clay', 'joyful', 'colorful'] }
    ]
  },
  {
    category: 'Realistic & Artistic (Ages 6–12)',
    description: 'Sophisticated art styles with richer detail, ideal for preserving the likeness of your child.',
    styles: [
      { id: 'enchanted_elegance', name: 'Enchanted Elegance', description: 'Detailed illustrations with an elegant, enchanted quality', imageUrl: enchantedEleganceImg, keywordMatch: ['enchanted', 'elegant', 'detailed'] },
      { id: 'warm_portrait', name: 'Warm Portrait', description: 'Realistic portraits with warm lighting and preserved facial features', imageUrl: warmPortraitImg, keywordMatch: ['portrait', 'warm', 'realistic'] },
      { id: 'magic_portrait', name: 'Magic Portrait', description: 'Semi-stylized portraits with a magical, fantasy quality', imageUrl: magicPortraitImg, keywordMatch: ['magic', 'portrait', 'fantasy'] },
      { id: 'vivid_tableaux', name: 'Vivid Tableaux', description: 'Rich, textured scenes with vibrant colors and detailed compositions', imageUrl: vividTableauxImg, keywordMatch: ['vivid', 'rich', 'textured'] },
      { id: 'luminous_narratives', name: 'Luminous Narratives', description: 'Rich digital illustrations with painterly effects and detailed lighting', imageUrl: luminousNarrativesImg, keywordMatch: ['luminous', 'digital', 'painterly'] }
    ]
  }
];

// Map of style IDs to API style codes - no longer needed, using direct API codes
const PLEASANTLY_WARM_STYLE_CODE = 'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1';

// Fallback style code for when mapping fails - use "No Style v2" as fallback
const SAFE_STYLE_CODE = "Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2"; 

// Helper to get a safe style code for API use
const getSafeStyleCode = (styleCode) => {
  // If it's already a full style code, use it
  if (styleCode && styleCode.startsWith('Style-')) {
    return styleCode;
  }
  
  // Fallback to the default "No Style" code
  return SAFE_STYLE_CODE;
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
    customRole: '',  // For storing custom role description
    generationPrompt: '', // For text-to-image generation
    useTextToImage: false // Flag for text-to-image vs image-to-image
  }));
  
  // Add state for image preview modal
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState('');
  
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
  
  // Character roles (imported from the roles defined in CharactersStep)
  const CHARACTER_ROLES = [
    { id: 'main', label: 'Main Character', description: 'The hero of the story (usually your child)' },
    { id: 'sidekick', label: 'Sidekick', description: 'Friend or companion who helps the main character' },
    { id: 'mentor', label: 'Mentor', description: 'Wise character who guides the main character' },
    { id: 'pet', label: 'Pet', description: 'Animal companion or pet' },
    { id: 'magical_friend', label: 'Magical Friend', description: 'Enchanted or fantasy character with special abilities' },
    { id: 'custom', label: 'Custom Role', description: 'Define your own character role in the story' }
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
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-4">Character Details</h2>
        
        <div className="space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Character Name</label>
            <input
              type="text"
              value={characterData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3"
              placeholder="Enter character name"
            />
          </div>
          
          {/* Character Type Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Character Type</label>
            <select
              value={characterData.type}
              onChange={(e) => handleChange('type', e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3"
            >
              <option value="child">Child</option>
              <option value="adult">Adult</option>
              <option value="animal">Animal</option>
              <option value="fantasy">Fantasy Creature</option>
            </select>
          </div>
          
          {/* Age Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="text"
              value={characterData.age}
              onChange={(e) => handleChange('age', e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3"
              placeholder="Enter character age (optional)"
            />
          </div>
          
          {/* Gender Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={characterData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3"
            >
              <option value="">Select gender (optional)</option>
              <option value="boy">Boy</option>
              <option value="girl">Girl</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          {/* Character Description - Used for text-to-image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Character Description
            </label>
            <textarea
              value={characterData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 h-20"
              placeholder="Describe the character's appearance (used for image generation if no photo is uploaded)"
            />
            <p className="text-xs text-gray-500 mt-1">
              This description will be used to generate an image if you don't upload a photo
            </p>
          </div>
          
          {/* Text-to-Image Generation Prompt */}
          <div className="pt-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useTextToImage"
                checked={characterData.useTextToImage}
                onChange={(e) => handleChange('useTextToImage', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="useTextToImage" className="ml-2 block text-sm font-medium text-gray-700">
                Generate character from description instead of photo
              </label>
            </div>
            
            {characterData.useTextToImage && (
              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image Generation Prompt
                </label>
                <textarea
                  value={characterData.generationPrompt}
                  onChange={(e) => handleChange('generationPrompt', e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 h-24"
                  placeholder="Detailed prompt for image generation (e.g., 'A young boy with brown hair and blue eyes, wearing a red t-shirt and jeans, smiling')"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be specific about appearance, clothing, pose, and expression for best results
                </p>
              </div>
            )}
          </div>
          
          {/* Custom Role Field - Only show if initialRole is 'custom' */}
          {initialRole === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custom Role</label>
              <input
                type="text"
                value={characterData.customRole}
                onChange={(e) => handleChange('customRole', e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
                placeholder="Define this character's role in the story"
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
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
  
  // Helper function to match API styles to our curated categories
  const matchStyleToAPIStyle = (curatedStyle, apiStyles) => {
    if (!apiStyles || apiStyles.length === 0) return null;
    
    // First try direct keyword matching
    const matchedStyle = apiStyles.find(style => {
      const styleName = style.name.toLowerCase();
      return curatedStyle.keywordMatch.some(keyword => 
        styleName.includes(keyword.toLowerCase())
      );
    });
    
    if (matchedStyle) return matchedStyle;
    
    // Fallback to a default style (3D or cartoon preferably)
    const defaultStyle = apiStyles.find(style => 
      style.name.toLowerCase().includes('3d') || 
      style.name.toLowerCase().includes('cartoon') ||
      style.name.toLowerCase().includes('pixie')
    );
    
    // If no matches at all, return the first available style
    return defaultStyle || apiStyles[0];
  };
  
  // Update the appearance step to use curated categories with API style mapping
  const renderAppearanceStep = () => {
    // Skip photo upload step if using text-to-image
    if (characterData.useTextToImage || !photoPreview) {
      return (
        <div className="space-y-6 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4">Character Appearance</h2>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">Text-to-Image Generation</h3>
            <p className="text-sm text-blue-700">
              Your character will be generated from your description:
            </p>
            <div className="mt-2 p-3 bg-white rounded border border-blue-100">
              <p className="text-sm italic">
                {characterData.generationPrompt || characterData.description || "No description provided. Please go back and add a description."}
              </p>
            </div>
          </div>
          
          {/* Art style selection */}
          <div>
            <h3 className="font-medium mb-2">Select Art Style</h3>
            <p className="text-sm text-gray-600 mb-4">Choose how your character should be illustrated</p>
            
            {isLoadingStyles ? (
              <div className="flex justify-center my-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Art style categories with styles */}
                {getStyleCategories().map((category, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-900">{category.category}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {category.styles.map(style => {
                        // Match curated style to API style
                        const apiStyle = matchStyleToAPIStyle(style, apiStyles);
                        
                        return (
                          <div 
                            key={style.id}
                            onClick={() => handleChange('artStyle', apiStyle?.style_code || style.id)}
                            className={`border rounded-md overflow-hidden ${
                              characterData.artStyle === (apiStyle?.style_code || style.id) 
                                ? 'ring-2 ring-blue-500 border-blue-400' 
                                : 'border-gray-200 hover:border-blue-300'
                            } cursor-pointer`}
                          >
                            <div className="h-32 overflow-hidden bg-gray-100">
                              <img 
                                src={style.imageUrl} 
                                alt={style.name}
                                className="w-full h-32 object-contain rounded hover:shadow-lg transition-shadow"
                              />
                            </div>
                            <div className="p-2">
                              <h5 className="font-medium text-sm">{style.name}</h5>
                              <p className="text-xs text-gray-500 truncate">{style.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className={`px-6 py-2 bg-blue-600 text-white rounded ${!characterData.artStyle ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
              disabled={!characterData.artStyle}
            >
              Next
            </button>
          </div>
        </div>
      );
    }
    
    // ... existing photo upload UI ...
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
      
      // Add instructions for a neutral background with no distractions
      prompt += ", plain neutral background, soft lighting, no distracting elements, focus on character only";
      
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
            // Simplify progress message - just show "Generating..." instead of polling details
            setProgressMessage(`Generating...`);
            
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
                  stylePreview: imageUrl,
                  // Make sure we save the art style code too
                  artStyle: styleCode
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
              setProgressMessage('Generation failed');
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
                setProgressMessage(`Generating... ${percent}%`);
              } else {
                // Just show "Generating..." without poll count details
                setProgressMessage(`Generating...`);
              }
            }
            
            // If we've reached the maximum polling attempts, stop polling
            if (pollCount >= maxPolls) {
              console.log(`Reached maximum polling attempts (${maxPolls}), stopping`);
              setProgressMessage('Generation taking longer than expected');
              clearInterval(pollInterval);
              setIsGenerating(false);
              delete pollingSessionRef.current[pollingId];
              return;
            }
          } catch (error) {
            console.error(`Error in polling attempt ${pollCount}:`, error);
            
            if (pollCount >= maxPolls) {
              setProgressMessage('Error occurred');
              clearInterval(pollInterval);
              setIsGenerating(false);
              delete pollingSessionRef.current[pollingId];
            } else {
              // Just show "Generating..." without error details
              setProgressMessage(`Generating...`);
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
    // Helper to get a display name for the art style
    const getArtStyleDisplayName = () => {
      if (!characterData.artStyle) return 'No style selected';
      
      // Special case for the Warm Fables style code
      if (characterData.artStyle === PLEASANTLY_WARM_STYLE_CODE) {
        return 'Pleasantly Warm';
      }
      
      // If it's a full style code (starts with "Style-")
      if (characterData.artStyle.startsWith('Style-')) {
        // Check if we have a stored name in localStorage
        try {
          const allStyleNames = localStorage.getItem('styleCodeNames');
          if (allStyleNames) {
            const namesMap = JSON.parse(allStyleNames);
            if (namesMap[characterData.artStyle]) {
              return namesMap[characterData.artStyle];
            }
          }
          
          // Also check the lastSelectedStyleName for Warm Fables style
          const lastStyleName = localStorage.getItem('lastSelectedStyleName');
          if (lastStyleName && characterData.artStyle === PLEASANTLY_WARM_STYLE_CODE) {
            return lastStyleName;
          }
        } catch (e) {
          console.error("Failed to retrieve style name from localStorage:", e);
        }
        
        // If we have a matching style in the API styles, use its name
        const matchingStyle = apiStyles.find(s => s.style_code === characterData.artStyle);
        if (matchingStyle) return matchingStyle.name;
        
        return 'API Style'; // Fallback name
      }
      
      // Format the style ID as a last resort
      return characterData.artStyle
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    };
    
    // Determine if image was generated from text or transformed from photo
    const generationMethod = characterData.useTextToImage 
      ? "Generated from description" 
      : photoPreview ? "Transformed from photo" : "Generated character";
    
    return (
      <div className="space-y-6 animate-fadeIn">
        <h2 className="text-2xl font-bold mb-4">Character Preview</h2>
        
        <div className="text-center mb-6">
          <h3 className="text-xl font-medium mb-1">{characterData.name}</h3>
          <p className="text-gray-600">
            {initialRole === 'custom' && characterData.customRole 
              ? characterData.customRole 
              : CHARACTER_ROLES.find(r => r.id === initialRole)?.label || 'Character'}
          </p>
        </div>
        
        <div className="flex flex-col items-center">
          {/* Display image */}
          {characterData.stylePreview ? (
            <>
              <img
                src={characterData.stylePreview}
                alt="Character Preview"
                className="max-w-full max-h-[85vh] object-contain shadow-xl"
                onClick={() => openImagePreview(characterData.stylePreview)}
              />
              <p className="text-sm text-gray-500 mt-2">{generationMethod}</p>
              <p className="text-sm font-medium mt-1">Style: {getArtStyleDisplayName()}</p>
            </>
          ) : (
            <div className="w-64 h-64 bg-gray-200 flex items-center justify-center rounded-lg">
              <p className="text-gray-500">No preview available</p>
            </div>
          )}
        </div>
        
        {/* Generate button - allow regeneration */}
        <div className="flex justify-center mt-4">
          <button
            onClick={generateCharacterPreview}
            disabled={isGenerating || !characterData.artStyle}
            className={`px-6 py-2 rounded ${
              isGenerating || !characterData.artStyle
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {progressMessage || 'Generating...'}
              </span>
            ) : characterData.stylePreview ? 'Regenerate Character' : 'Generate Character'}
          </button>
        </div>
        
        {/* Error message if any */}
        {error && (
          <div className="text-center text-red-500 mt-4">
            {error}
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
            className={`px-6 py-2 bg-blue-600 text-white rounded ${!characterData.stylePreview ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
            disabled={!characterData.stylePreview}
          >
            Add to Story
          </button>
        </div>
      </div>
    );
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