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

// Map of style IDs to API style codes
const STYLE_CODE_MAP = {
  // Whimsical & Soft (Ages 0-5)
  watercolor_whimsy: 'Style-c6f6a5e3-65c4-4a0d-b525-66115e24f5ed', // Playful Outline
  whimsical_coloring: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D
  enchanted_character: 'Style-5348624a-0de8-4c49-9d88-aac548ba82f2', // Playful Critters
  minimalist_cutesy: 'Style-5b1', // Cozy 3D (truncated in logs, need full code)

  // Classic & Timeless (Ages 3-8)
  cheerful_storybook: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  pleasantly_warm: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  storytime_whimsy: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  line_and_wash: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  golden_hour: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback

  // Modern & Colorful (Ages 4-9)
  cute_exaggeration: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  glossy_elegance: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  starlit_fantasy: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  fantasy_hero: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  joyful_clay: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback

  // Realistic & Artistic (Ages 6-12)
  enchanted_elegance: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  warm_portrait: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  magic_portrait: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  vivid_tableaux: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  luminous_narratives: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback

  // Additional styles
  dreamlike_portraiture: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  aquarelle_life: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  ancient_china: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  ceramic_lifelike: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  yarn_realism: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  mystical_sovereignty: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f', // PixiePop 3D as fallback
  soft_radiance: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f' // PixiePop 3D as fallback
};

// Fallback style code - use PixiePop 3D as default
const SAFE_STYLE_CODE = "Style-7a23990c-65f7-4300-b2a1-f5a97263e66f";

// Helper to get a safe style code for API use
const getSafeStyleCode = (styleId) => {
  // If it's already a full style code, use it
  if (styleId && styleId.startsWith('Style-')) {
    return styleId;
  }
  
  // Try to get from mapping
  const mappedCode = STYLE_CODE_MAP[styleId];
  if (mappedCode) {
    return mappedCode;
  }
  
  // Fallback to PixiePop 3D
  return SAFE_STYLE_CODE;
};

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
    
    // If we have a forced art style, set it
    if (forcedArtStyle) {
      setCharacterData(prev => ({
        ...prev,
        artStyle: forcedArtStyle
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
      pollingSessionRef.current = {};
    };
  }, [forcedArtStyle]);
  
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
      // Skip art style selection
      setStep(4);
    }
  }, [step, forcedArtStyle]);
  
  // Also modify the conditional render to always generate preview when step 4 is mounted
  useEffect(() => {
    // Auto-generate preview when entering step 4 (preview step)
    if (step === 4 && !characterData.stylePreview && !isGenerating) {
      generateCharacterPreview();
    }
  }, [step]);
  
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
        <h2 className="text-2xl font-bold mb-4">Photo or Description</h2>
        
        {/* Character Generation Method Selection */}
        <div className="mb-6">
          <div className="space-y-4">
            {/* Photo Upload Option */}
            <div 
              className={`border rounded-md p-4 ${!characterData.useTextToImage ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => handleChange('useTextToImage', false)}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="generationMethod"
                    id="photoUpload"
                    checked={!characterData.useTextToImage}
                    onChange={() => handleChange('useTextToImage', false)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="photoUpload" className="font-medium text-gray-700">Upload a Photo</label>
                </div>
              </div>
              
              {/* Always show the upload box when this option is selected */}
              {!characterData.useTextToImage && (
                <div className="mt-4">
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
                          alt="Character" 
                          className="w-32 h-32 object-cover rounded-md mb-2" 
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
                      <div className="flex flex-col items-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                        <span className="mt-2 block text-sm font-medium text-gray-700">
                          Click to upload a photo
                        </span>
                    </div>
                  )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                  />
                </div>
              )}
              </div>
              
            {/* Text Description Option */}
            <div 
              className={`border rounded-md p-4 ${characterData.useTextToImage ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => handleChange('useTextToImage', true)}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    name="generationMethod"
                    id="textDescription"
                    checked={characterData.useTextToImage}
                    onChange={() => handleChange('useTextToImage', true)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                        />
                      </div>
                <div className="ml-3">
                  <label htmlFor="textDescription" className="font-medium text-gray-700">Generate from Description</label>
                    </div>
                </div>
              
              {characterData.useTextToImage && (
                <div className="mt-4">
                  <textarea
                    value={characterData.generationPrompt}
                    onChange={(e) => handleChange('generationPrompt', e.target.value)}
                    placeholder="Describe your character in detail. For example: 'A 7-year-old girl with curly brown hair and green eyes, wearing a yellow dress with flower patterns, has a cheerful smile, and is holding a small teddy bear.'"
                    className="w-full p-3 border border-gray-300 rounded-md h-32 focus:ring-blue-500 focus:border-blue-500"
                  />
              </div>
              )}
            </div>
                  </div>
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
            className={`px-6 py-2 bg-blue-600 text-white rounded ${
              ((!characterData.photoUrl && !characterData.useTextToImage) || 
               (characterData.useTextToImage && !characterData.generationPrompt)) 
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:bg-blue-700'
            }`}
            disabled={
              (!characterData.photoUrl && !characterData.useTextToImage) || 
              (characterData.useTextToImage && !characterData.generationPrompt)
            }
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
    try {
      setIsGenerating(true);
      setProgressMessage('Preparing to generate character preview...');
      
      // Get the style code for preview
      const previewStyleCode = getSafeStyleCode(characterData.artStyle);
      console.log('STYLE DEBUG: Using style ID', JSON.stringify({
        originalStyle: characterData.artStyle,
        mappedCode: previewStyleCode,
        fromApi: previewStyleCode.startsWith('Style-')
      }));
      
      // Create fallback image right away to ensure we have something to show
      const bgColor = stringToColor(characterData.name + (forcedArtStyle || 'default'));
      const fallbackPreview = createColorPlaceholder(bgColor, characterData.name);
      
      // Display a warning if API check failed
      if (apiStatus.checked && !apiStatus.working) {
        console.warn('Attempting to generate character with failing API:', apiStatus.message);
        setProgressMessage(`Warning: API check failed (${apiStatus.message}). Trying anyway...`);
      }
      
      // Validate inputs based on the generation method
      if (!characterData.useTextToImage && !characterData.photoUrl) {
        throw new Error('Please upload a photo first');
      }
      
      if (characterData.useTextToImage && !characterData.generationPrompt) {
        throw new Error('Please provide a description for text-to-image generation');
      }
      
      // Ensure we have a valid art style - use API default style if none provided
      // Priority: forcedArtStyle (from the story) > characterData.artStyle > default style
      let styleId = forcedArtStyle || characterData.artStyle;
      if (!styleId) {
        // If no style is set, use a safe default
        styleId = 'starlit_fantasy'; // Default to a popular style
        console.log("No style selected, using default style:", styleId);
      }
      
      // Convert from our style IDs to actual API style codes
      const apiStyleCode = getSafeStyleCode(styleId);
      console.log(`STYLE DEBUG: Using style ID "${styleId}" (API code "${apiStyleCode}") from ${forcedArtStyle ? 'story' : 'character selection'}`);
      
      // Handle text-to-image generation
      if (characterData.useTextToImage) {
        // Prepare the text prompt from the generation prompt
        let enhancedPrompt = characterData.generationPrompt || "";
        
        // Combine character information for a rich prompt if not already included
        if (characterData.name && !enhancedPrompt.includes(characterData.name)) {
          enhancedPrompt = `${characterData.name}: ${enhancedPrompt}`;
        }
        if (characterData.type && !enhancedPrompt.toLowerCase().includes(characterData.type.toLowerCase())) {
          enhancedPrompt = `${enhancedPrompt}, ${characterData.type}`;
        }
        if (characterData.gender && !enhancedPrompt.toLowerCase().includes(characterData.gender.toLowerCase())) {
          enhancedPrompt = `${enhancedPrompt}, ${characterData.gender}`;
        }
        if (characterData.age && !enhancedPrompt.includes(characterData.age)) {
          enhancedPrompt = `${enhancedPrompt}, age ${characterData.age}`;
        }
        
        // Add instructions for a clean background
        enhancedPrompt += ", plain neutral background, soft lighting, no distracting elements, focus on character only";
        
        console.log(`Enhanced prompt for text-to-image: ${enhancedPrompt}`);
        console.log(`STYLE DEBUG: Using mapped API style_code=${apiStyleCode} with intensity=1.0`);
        
        // More detailed payload for better art style application
        const txt2imgPayload = {
          prompt: enhancedPrompt.substring(0, 800), // Limit to 800 characters as per API docs
          style_code: apiStyleCode,
          style_intensity: 1.0, // Maximum style intensity
          quality_mode: 1, // High quality
          target_h: 1024, // Standard size
          target_w: 1024,
          cfg_scale: 9, // Stronger adherence to prompt
          prompt_strength: 1.0, // Maximum prompt influence
          generate_slots: [1, 1], // Generate 2 images
          output_format: 'webp', // Use webp for better quality/size ratio
          name: characterData.name // Add name for better tracking
        };
        
        try {
          // Create the text-to-image task
          const taskResult = await createTxt2ImgTask(txt2imgPayload);
          
          if (!taskResult || !taskResult.task_id) {
            throw new Error('Failed to start text-to-image generation task');
          }
          
          console.log("Task created successfully with style:", apiStyleCode);
          
          // Start polling for this task
          startPollingTask(taskResult.task_id, fallbackPreview);
        } catch (apiError) {
          console.error("API error in text-to-image:", apiError);
          
          // If we got style invalid error, try with the default style
          if (apiError.message && apiError.message.includes("Style are invalid")) {
            console.log("Style code rejected by API, trying with default style");
            
            // Update payload with the default style, but keep everything else the same
            const retryPayload = {
              ...txt2imgPayload,
              style_code: SAFE_STYLE_CODE // Use the safe default
            };
            
            try {
              // Retry with the default style code
              const retryResult = await createTxt2ImgTask(retryPayload);
              
              if (!retryResult || !retryResult.task_id) {
                throw new Error('Failed to start text-to-image generation with fallback style');
              }
              
              startPollingTask(retryResult.task_id, fallbackPreview);
            } catch (retryError) {
              console.error("Even retry failed:", retryError);
              useFallbackImage(fallbackPreview);
            }
          } else {
            console.error("Using fallback due to API error:", apiError);
            useFallbackImage(fallbackPreview);
          }
        }
      }
      // Handle image-to-image generation for photo uploads
      else {
        // Extract the base64 data correctly
        let base64Data = '';
        if (characterData.photoUrl && characterData.photoUrl.startsWith('data:image')) {
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
        
        console.log(`STYLE DEBUG: Using img2img with mapped API style_code=${apiStyleCode} with style_intensity=1.0`);
        
        // Improved payload for better style application
        const img2imgPayload = {
          prompt: prompt,
          style_code: apiStyleCode,
          images: [
            {
              base64_data: base64Data
            }
          ],
          style_intensity: 1.0, // Maximum style application
          structure_match: 0.7, // Keep structure but allow style to influence
          face_match: 1.0, // Keep face details
          color_match: 0, // Let style colors dominate
          quality_mode: 1, // High quality
          prompt_strength: 0.8, // Strong adherence to prompt
          cfg_scale: 9, // Stronger guidance
          generate_slots: [1, 1], // Generate 2 images
          output_format: "webp",
          name: characterData.name // Add name for better tracking
        };
        
        try {
          // Call the Dzine API to create an img2img task
          const result = await createImg2ImgTask(img2imgPayload);
          console.log('Dzine task created:', result);
          
          if (!result) {
            throw new Error('Empty response from image generation API');
          }
          
          // Check for task_id in different possible locations
          let taskId = null;
          
          if (result.task_id) {
            taskId = result.task_id;
          } else if (result.data && result.data.task_id) {
            taskId = result.data.task_id;
          } else if (typeof result === 'string' && result.includes('task')) {
            taskId = result;
          } else {
            throw new Error('Invalid response from API: missing task_id');
          }
          
          console.log("Task created successfully with style:", apiStyleCode);
          
          // Start polling for this task with fallback
          startPollingTask(taskId, fallbackPreview);
        } catch (apiError) {
          console.error("API error in image-to-image:", apiError);
          
          // If we got style invalid error, try with the default style
          if (apiError.message && apiError.message.includes("Style are invalid")) {
            console.log("Style code rejected by API, trying with default style");
            
            // Update payload with default style but keep other parameters
            const retryPayload = {
              ...img2imgPayload,
              style_code: SAFE_STYLE_CODE // Use the safe default
            };
            
            try {
              // Retry with the default style code
              const retryResult = await createImg2ImgTask(retryPayload);
              
              if (!retryResult || !retryResult.task_id) {
                throw new Error('Failed to create image-to-image task with fallback style');
              }
              
              // Check for task_id
              let retryTaskId = null;
              if (retryResult.task_id) {
                retryTaskId = retryResult.task_id;
              } else if (retryResult.data && retryResult.data.task_id) {
                retryTaskId = retryResult.data.task_id;
              } else {
                throw new Error('Invalid response from API with fallback style');
              }
              
              startPollingTask(retryTaskId, fallbackPreview);
            } catch (retryError) {
              console.error("Even retry failed:", retryError);
              useFallbackImage(fallbackPreview);
            }
          } else {
            console.error("Using fallback due to API error:", apiError);
            useFallbackImage(fallbackPreview);
          }
        }
      }
    } catch (error) {
      console.error('Error creating Dzine task:', error);
      useFallbackImage(fallbackPreview);
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
  const startPollingTask = (taskId, fallbackImage) => {
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
  
  const generateCharacterImage = async (styleId, prompt, fallbackImage) => {
    try {
      setIsGenerating(true);
      setProgressMessage('Starting generation...');
      
      // Get the style code from our mapping or use the provided style ID directly
      const styleCode = STYLE_CODE_MAP[styleId] || styleId;
      
      console.log('STYLE DEBUG: Using style ID', {
        originalStyle: styleId,
        mappedCode: styleCode,
        fromApi: styleId.startsWith('Style-')
      });
      
      // Validate that we have a photo URL
      if (!characterData.photoUrl) {
        console.error('No photo URL available in character data');
        throw new Error('Please upload a photo first');
      }

      // Debug log the photo URL
      console.log('IMAGE DEBUG:', {
        hasPhotoUrl: !!characterData.photoUrl,
        photoUrlType: typeof characterData.photoUrl,
        photoUrlLength: characterData.photoUrl?.length,
        isBase64: characterData.photoUrl?.startsWith('data:image'),
        preview: characterData.photoUrl?.substring(0, 50) + '...'
      });

      // Validate base64 image format
      if (!characterData.photoUrl.startsWith('data:image')) {
        console.error('Invalid image format:', characterData.photoUrl.substring(0, 50));
        throw new Error('Invalid image format. Expected base64 data URL.');
      }
      
      // Create the API payload with the correct structure
      const payload = {
        style_code: styleCode,
        image: characterData.photoUrl, // Send as single image field
        prompt: prompt || `Generate a character portrait of ${characterData.name} in the selected style`,
        color_match: 0.5,
        face_match: 1.0,
        style_intensity: 1.0,
        negative_prompt: 'ugly, deformed, disfigured, poor quality, blurry, nsfw',
        num_images: 1,
        image_resolution: '512*512'
      };

      console.log('PAYLOAD DEBUG:', {
        hasImage: !!payload.image,
        imageType: typeof payload.image,
        imageLength: payload.image?.length,
        styleCode: payload.style_code,
        prompt: payload.prompt,
        colorMatch: payload.color_match,
        faceMatch: payload.face_match,
        styleIntensity: payload.style_intensity
      });
      
      // Create the task
      const taskResponse = await createImg2ImgTask(payload);
      
      if (!taskResponse || !taskResponse.data || !taskResponse.data.task_id) {
        console.error('Invalid task response:', taskResponse);
        throw new Error('Failed to create image generation task');
      }
      
      const taskId = taskResponse.data.task_id;
      console.log('Task created with ID:', taskId);
      
      // Start polling for the result
      await startPollingTask(taskId, fallbackImage);
      
    } catch (error) {
      console.error('API error in image-to-image:', error);
      setProgressMessage(`Error: ${error.message}`);
      useFallbackImage(fallbackImage);
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