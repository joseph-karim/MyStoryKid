import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useBookStore, useCharacterStore } from '../../store';
import CharacterWizard from '../CharacterWizard';
import { getDzineStyles, createImg2ImgTask, createTxt2ImgTask, getTaskProgress } from '../../services/dzineService.js';

// Import art style images from the Dzine Styles folder
import starlitFantasyImg from '../../assets/dzine-styles/Starlit-Fantasy.png';
import cheerfulStorybookImg from '../../assets/dzine-styles/Cheerful-Storybook.png';
import enchantedEleganceImg from '../../assets/dzine-styles/Enchanted-Elegance.png';
import glossyEleganceImg from '../../assets/dzine-styles/Glossy-Elegance.png';
import minimalistCuteImg from '../../assets/dzine-styles/Minimalist-Cutesy.png';
import watercolorWhimsyImg from '../../assets/dzine-styles/Watercolor-Whimsy.png';
import pleasantlyWarmImg from '../../assets/dzine-styles/Pleasantly-Warm.png';
import ancientChinaImg from '../../assets/dzine-styles/Ancient-China.png';
import lineAndWashImg from '../../assets/dzine-styles/Line-&-Wash.png';
import magicPortraitImg from '../../assets/dzine-styles/Magic-Portrait.png';
import warmPortraitImg from '../../assets/dzine-styles/Warm-Portrait.png';
import goldenHourImg from '../../assets/dzine-styles/Golden-Hour.png';
import dreamlikePortraitureImg from '../../assets/dzine-styles/Dreamlike-Portraiture.png';
import luminousNarrativesImg from '../../assets/dzine-styles/Luminous-Narratives.png';
import aquarelleLifeImg from '../../assets/dzine-styles/Aquarelle-Life.png';
import vividTableauxImg from '../../assets/dzine-styles/Vivid-Tableaux.png';
import whimsicalColoringImg from '../../assets/dzine-styles/Whimsical-Coloring.png';
import ceramicLifelikeImg from '../../assets/dzine-styles/Ceramic-Lifelike.png';
import joyfulClayImg from '../../assets/dzine-styles/Joyful-Clay.png';
import yarnRealismImg from '../../assets/dzine-styles/Yarn-Realism.png';
import fantasyHeroImg from '../../assets/dzine-styles/Fantasy-Hero.png';
import storytimeWhimsyImg from '../../assets/dzine-styles/Storytime-Whimsy.png';
import cuteExaggerationImg from '../../assets/dzine-styles/Cute-Exaggeration.png';
import enchantedCharacterImg from '../../assets/dzine-styles/Enchanted-Character.png';
import mysticalSovereigntyImg from '../../assets/dzine-styles/Mystical-Sovereignty.png';
import softRadianceImg from '../../assets/dzine-styles/Soft-Radiance.png';

// Import the ART_STYLE_CATEGORIES_STRUCTURE for style name lookups
import { ART_STYLE_CATEGORIES_STRUCTURE } from './ArtStyleStep';

// Character roles
const CHARACTER_ROLES = [
  { id: 'main', label: 'Main Character', description: 'The hero of the story (usually your child)' },
  { id: 'sidekick', label: 'Sidekick', description: 'Friend or companion who helps the main character' },
  { id: 'mentor', label: 'Mentor', description: 'Wise character who guides the main character' },
  { id: 'pet', label: 'Pet', description: 'Animal companion or pet' },
  { id: 'magical_friend', label: 'Magical Friend', description: 'Enchanted or fantasy character with special abilities' },
  { id: 'custom', label: 'Custom Role', description: 'Define your own character role in the story' }
];

// Map our internal IDs to the preview images for legacy support
const styleImageMap = {
  watercolor: watercolorWhimsyImg,
  pastel: whimsicalColoringImg,
  pencil_wash: lineAndWashImg,
  soft_digital: watercolorWhimsyImg,
  pencil_ink: magicPortraitImg,
  golden_books: cheerfulStorybookImg,
  beatrix_potter: warmPortraitImg,
  cartoon: starlitFantasyImg,
  flat_vector: minimalistCuteImg,
  storybook_pop: cheerfulStorybookImg,
  papercut: whimsicalColoringImg,
  oil_pastel: glossyEleganceImg,
  stylized_realism: dreamlikePortraitureImg,
  digital_painterly: luminousNarrativesImg,
  kawaii: joyfulClayImg,
  scandinavian: softRadianceImg,
  african_pattern: vividTableauxImg,
  
  // Direct mapping to new styles
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
  ancient_china: ancientChinaImg,
  dreamlike_portraiture: dreamlikePortraitureImg,
  aquarelle_life: aquarelleLifeImg,
  ceramic_lifelike: ceramicLifelikeImg,
  yarn_realism: yarnRealismImg,
  mystical_sovereignty: mysticalSovereigntyImg,
  soft_radiance: softRadianceImg
};

// Find any SAFE_STYLE_CODE constant and update it with the correct style code
const SAFE_STYLE_CODE = "Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2"; // No Style v2

// Helper function to get a safe style code for API use
const getSafeStyleCode = (styleCode) => {
  // If it's a valid style code, use it directly
  if (styleCode && styleCode.startsWith('Style-')) {
    return styleCode;
  }
  
  // Fallback to the safe style code
  return SAFE_STYLE_CODE;
};

// Special mapping for the pleasantly warm style code
const PLEASANTLY_WARM_STYLE_CODE = 'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1';

// --- NEW: Helper function to get style name from API style code ---
const getStyleNameFromCode = (styleCode) => {
  if (!styleCode) return 'Default Style';
  
  // Special handling for Pleasantly Warm style
  if (styleCode === 'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1') {
    return 'Pleasantly Warm';
  }
  
  // Try to find the style in our ART_STYLE_CATEGORIES_STRUCTURE (imported from ArtStyleStep.jsx)
  let styleName = null;
  for (const category of ART_STYLE_CATEGORIES_STRUCTURE) {
    for (const style of category.styleIds) {
      if (style.apiCode === styleCode) {
        styleName = style.title;
        break;
      }
    }
    if (styleName) break;
  }
  
  // If found, return it
  if (styleName) return styleName;
  
  // Try to get from localStorage (for backward compatibility)
  try {
    const allStyleNames = localStorage.getItem('styleCodeNames');
    if (allStyleNames) {
      const namesMap = JSON.parse(allStyleNames);
      if (namesMap[styleCode]) {
        return namesMap[styleCode];
      }
    }
  } catch (e) {
    console.error('Error reading style names from localStorage:', e);
  }
  
  // Finally, if all else fails, just return the code
  return styleCode.replace('Style-', '').substring(0, 8) + '...';
};

// Add style descriptions to enrich the presentation
const styleDescriptions = {
  watercolor_whimsy: { 
    title: 'Watercolor Whimsy',
    description: 'Soft, rounded shapes with gentle digital brushwork and gradients'
  },
  whimsical_coloring: { 
    title: 'Whimsical Coloring',
    description: 'Tender, soothing colors with a gentle, chalky texture'
  },
  enchanted_character: { 
    title: 'Enchanted Character',
    description: 'Magical characters with soft lighting and enchanting atmosphere'
  },
  minimalist_cutesy: { 
    title: 'Minimalist Cutesy',
    description: 'Simple, cute designs with minimal details and soft colors'
  },
  cheerful_storybook: { 
    title: 'Cheerful Storybook',
    description: 'Bright, cheerful illustrations with bold colors and playful details'
  },
  pleasantly_warm: { 
    title: 'Pleasantly Warm',
    description: 'Charming, detailed watercolor illustrations with a warm, cozy feeling'
  },
  storytime_whimsy: { 
    title: 'Storytime Whimsy',
    description: 'Whimsical, storybook-style illustrations with a classic feel'
  },
  line_and_wash: { 
    title: 'Line and Wash',
    description: 'Delicate pencil drawings with light watercolor washes for a timeless feel'
  },
  golden_hour: { 
    title: 'Golden Hour',
    description: 'Nostalgic illustrations with warm, golden lighting'
  },
  cute_exaggeration: { 
    title: 'Cute Exaggeration',
    description: 'Playful, exaggerated features with bright colors and clean lines'
  },
  glossy_elegance: { 
    title: 'Glossy Elegance',
    description: 'Clean, sleek, modern illustrations with a glossy finish'
  },
  starlit_fantasy: { 
    title: 'Starlit Fantasy',
    description: 'Magical, dreamy illustrations with starry, fantastical elements'
  },
  fantasy_hero: { 
    title: 'Fantasy Hero',
    description: 'Bold, heroic character illustrations with a fantasy adventure feel'
  },
  joyful_clay: { 
    title: 'Joyful Clay',
    description: 'Cheerful characters that look like they are made of colorful clay'
  },
  enchanted_elegance: { 
    title: 'Enchanted Elegance',
    description: 'Detailed illustrations with an elegant, enchanted quality'
  },
  warm_portrait: { 
    title: 'Warm Portrait',
    description: 'Realistic portraits with warm lighting and preserved facial features'
  },
  magic_portrait: { 
    title: 'Magic Portrait',
    description: 'Semi-stylized portraits with a magical, fantasy quality'
  },
  vivid_tableaux: { 
    title: 'Vivid Tableaux',
    description: 'Rich, textured scenes with vibrant colors and detailed compositions'
  },
  luminous_narratives: { 
    title: 'Luminous Narratives',
    description: 'Rich digital illustrations with painterly effects and detailed lighting'
  },
  // Additional styles
  ancient_china: {
    title: 'Ancient China',
    description: 'Traditional Chinese painting style with elegant brushwork and composition'
  },
  dreamlike_portraiture: {
    title: 'Dreamlike Portraiture',
    description: 'Portraits with a dreamy, ethereal quality and soft focus'
  },
  aquarelle_life: {
    title: 'Aquarelle Life',
    description: 'Vibrant watercolor style with flowing colors and rich textures'
  },
  ceramic_lifelike: {
    title: 'Ceramic Lifelike',
    description: 'Illustrations that have a 3D ceramic quality with smooth textures'
  },
  yarn_realism: {
    title: 'Yarn Realism',
    description: 'Textures and styling that mimic yarn and textile elements'
  },
  mystical_sovereignty: {
    title: 'Mystical Sovereignty',
    description: 'Majestic, mystical scenes with an air of fantasy and elegance'
  },
  soft_radiance: {
    title: 'Soft Radiance',
    description: 'Gentle, glowing artwork with soft lighting and delicate details'
  },
  custom: {
    title: 'Custom Style',
    description: 'Your own unique style description'
  }
};

// Function to check if a string is a Base64 data URL (useful for identifying uploads)
const isBase64DataUrl = (str) => {
  if (typeof str !== 'string') return false;
  return /^data:image\/(png|jpeg|jpg|webp);base64,/.test(str);
}

function CharactersStep() {
  const { wizardState, updateStoryData, setWizardStep, updateCharacter } = useBookStore();
  const { characters } = useCharacterStore();
  
  const [bookCharacters, setBookCharacters] = useState(wizardState.storyData.bookCharacters || []);
  const [showCharacterWizard, setShowCharacterWizard] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [error, setError] = useState('');
  
  // Art style is now set in the ArtStyleStep
  const artStyleCode = wizardState.storyData.artStyleCode || '';
  const customStyleDescription = wizardState.storyData.customStyleDescription || '';

  // NEW: State to manage generation status per character
  // Format: { [characterId]: { status: 'idle' | 'generating' | 'polling' | 'previewReady' | 'confirmed' | 'error', taskId: null, previewUrl: null, errorMessage: null, pollIntervalId: null } }
  const [generationStatus, setGenerationStatus] = useState({});

  // Helper to initialize generation status for characters loaded from wizardState
  useEffect(() => {
    const initialStatus = {};
    (wizardState.storyData.bookCharacters || []).forEach(char => {
      initialStatus[char.id] = { 
        status: char.stylePreview ? 'confirmed' : 'idle', // If preview exists, assume confirmed
        taskId: null, 
        previewUrl: char.stylePreview || null, // Use existing preview if available
        errorMessage: null,
        pollIntervalId: null 
      };
    });
    setGenerationStatus(initialStatus);
  }, [wizardState.storyData.bookCharacters]); // Re-run if bookCharacters change externally

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(generationStatus).forEach(status => {
        if (status.pollIntervalId) {
          clearInterval(status.pollIntervalId);
        }
      });
    };
  }, [generationStatus]);

  // Function to update generation status for a specific character
  const updateGenStatus = useCallback((charId, updates) => {
    setGenerationStatus(prev => ({
      ...prev,
      [charId]: {
        ...(prev[charId] || { status: 'idle', taskId: null, previewUrl: null, errorMessage: null, pollIntervalId: null }), // Ensure previous state exists
        ...updates,
      }
    }));
  }, []);

  // Load wizard state when it changes (e.g., navigating back)
  useEffect(() => {
    setBookCharacters(wizardState.storyData.bookCharacters || []);
    
    // Re-initialize generation status if book characters reset/change significantly
    const initialStatus = {};
    (wizardState.storyData.bookCharacters || []).forEach(char => {
      initialStatus[char.id] = generationStatus[char.id] || { 
         status: char.stylePreview ? 'confirmed' : 'idle', 
         taskId: null, previewUrl: char.stylePreview || null, errorMessage: null, pollIntervalId: null 
      };
    });
    setGenerationStatus(initialStatus);
  }, [wizardState.storyData]);

  const handleAddCharacter = (role) => {
    setSelectedRole(role);
    setShowCharacterWizard(true);
  };

  const handleCharacterComplete = (character) => {
    if (!character) {
      setShowCharacterWizard(false);
      setSelectedRole(null);
      return;
    }
    
    // Make sure we preserve all character properties including stylePreview and artStyle
    console.log('Character from wizard with stylePreview:', character.stylePreview);
    console.log('Character from wizard with artStyle:', character.artStyle);
    
    const characterWithRole = {
      ...character,
      role: selectedRole,
      customRole: selectedRole === 'custom' ? character.customRole : undefined
    };
    
    const newCharacters = [...bookCharacters, characterWithRole];
    setBookCharacters(newCharacters);
    
    // Initialize generation status based on whether the character already has a style preview
    updateGenStatus(characterWithRole.id, {
      status: characterWithRole.stylePreview ? 'confirmed' : 'idle',
      previewUrl: characterWithRole.stylePreview || null
    });
    
    // Update the store
    updateStoryData({ bookCharacters: newCharacters });
    
    setShowCharacterWizard(false);
    setSelectedRole(null);
  };

  const removeCharacter = (characterId) => {
    // Clear any running polls for this character
    const status = generationStatus[characterId];
    if (status?.pollIntervalId) {
        clearInterval(status.pollIntervalId);
    }
    
    const newCharacters = bookCharacters.filter(char => char.id !== characterId);
    setBookCharacters(newCharacters);
    
    // Remove status entry
    setGenerationStatus(prev => {
        const newState = { ...prev };
        delete newState[characterId];
        return newState;
    });
    
    // Update the store
    updateStoryData({ bookCharacters: newCharacters });
  };

  const handleBack = () => {
    // Go back to the Art Style selection step
    setWizardStep(2);
  };

  const handleContinue = () => {
    // Validation
    if (bookCharacters.length === 0) {
      setError('Please add at least one character to your story.');
      return;
    }
    
    const mainChar = bookCharacters.find(char => char.role === 'main');
    if (!mainChar) {
      setError('Please add a main character to your story.');
      return;
    }
   
    // Check if any characters don't have style preview confirmations
    const unconfirmedCharacters = bookCharacters.filter(char => {
        const status = generationStatus[char.id]?.status;
        // Only flag if it's not in a confirmed state and has a photo (needs a preview)
        return isBase64DataUrl(char.photoUrl) && status !== 'confirmed';
    });
   
    if (unconfirmedCharacters.length > 0) {
        const characterNames = unconfirmedCharacters.map(c => c.name).join(', ');
        setError(`Please generate and confirm the art style for these characters: ${characterNames}`);
        return;
    }

    // Update the store with final data (characters were updated as we went)
    updateStoryData({ bookCharacters });
    
    // Clear any running polls before navigating away
    Object.values(generationStatus).forEach(status => {
        if (status.pollIntervalId) {
            clearInterval(status.pollIntervalId);
        }
    });
    
    // Continue to Story Details step
    setWizardStep(4);
    
    // Log for debugging
    console.log("Navigating to Story Details step (step 4)");
  };

  // New function to generate previews for all characters at once
  const handleGenerateAllPreviews = () => {
    if (!artStyleCode) {
      setError('No art style is selected. Please go back and select an art style.');
      return;
    }
    
    // Filter characters that need generation (have photos but no confirmed previews)
    const charactersToGenerate = bookCharacters.filter(char => 
      isBase64DataUrl(char.photoUrl) && 
      (!generationStatus[char.id] || generationStatus[char.id]?.status !== 'confirmed')
    );
    
    if (charactersToGenerate.length === 0) {
      return; // Nothing to generate
    }
    
    // Generate preview for each character
    charactersToGenerate.forEach(character => {
      handleGeneratePreview(character.id);
    });
  };

  // Update the handleGeneratePreview function to handle text-to-image if needed
  const handleGeneratePreview = async (characterId) => {
    try {
      const character = bookCharacters.find(c => c.id === characterId);
      
      if (!character) {
        throw new Error(`Character not found: ${characterId}`);
      }
      
      // Update status to generating
      updateGenStatus(characterId, {
        status: 'generating',
        errorMessage: null
      });
      
      // Get API style code from character
      let styleCode = character.artStyle;
      if (!styleCode) {
        throw new Error('No art style is selected for this character');
      }
      
      // If we have a description but no photo, use text-to-image API
      if (!character.photoUrl && (character.description || character.generationPrompt)) {
        console.log('Using text-to-image generation for character:', character.name);
        
        updateGenStatus(characterId, {
          status: 'polling',
          message: 'Processing text-to-image generation...'
        });
        
        // Prepare the text prompt from description or generation prompt
        const prompt = character.generationPrompt || character.description;
        if (!prompt) {
          throw new Error('No description provided for text-to-image generation');
        }
        
        // Combine character information for a rich prompt
        let enhancedPrompt = prompt;
        if (character.name && !prompt.includes(character.name)) {
          enhancedPrompt = `${character.name}: ${enhancedPrompt}`;
        }
        if (character.type && !prompt.toLowerCase().includes(character.type.toLowerCase())) {
          enhancedPrompt = `${enhancedPrompt}, ${character.type}`;
        }
        if (character.gender && !prompt.toLowerCase().includes(character.gender.toLowerCase())) {
          enhancedPrompt = `${enhancedPrompt}, ${character.gender}`;
        }
        if (character.age && !prompt.includes(character.age)) {
          enhancedPrompt = `${enhancedPrompt}, age ${character.age}`;
        }
        
        console.log(`Enhanced prompt for text-to-image: ${enhancedPrompt}`);
        
        // Create the text-to-image task
        const taskResult = await createTxt2ImgTask({
          prompt: enhancedPrompt.substring(0, 800), // Limit to 800 characters as per API docs
          style_code: styleCode,
          style_intensity: 1, // Full style application
          quality_mode: 1, // High quality
          target_h: 1024, // Standard size
          target_w: 1024,
          generate_slots: [1, 1], // Generate 2 images
          output_format: 'webp' // Use webp for better quality/size ratio
        });
        
        if (!taskResult || !taskResult.task_id) {
          throw new Error('Failed to start text-to-image generation task');
        }
        
        // Start polling for this task
        startPolling(characterId, taskResult.task_id);
        
      } else if (character.photoUrl) {
        // Existing image-to-image logic
        console.log('Using image-to-image generation for character:', character.name);
        
        // Add instructions for a clean background
        const prompt = `${character.age || 'a'} year old ${character.gender || 'child'} named ${character.name}, plain neutral background, soft lighting, no distracting elements, focus on character only`;
        
        // Create the image-to-image task
        const payload = {
          prompt: prompt.substring(0, 800),  // Limit prompt length
          style_code: styleCode,
          style_intensity: 1, // Use full intensity for better effect
          structure_match: 0.7,
          // face_match is now handled by createImg2ImgTask based on type
          color_match: 0,
          quality_mode: 1, // Use higher quality mode
          generate_slots: [1, 1, 0, 0], // Generate 2 options
          images: [{ base64_data: character.photoUrl }],
          output_format: 'webp'
        };
        
        console.log("Image-to-Image Payload:", payload); // Log payload before sending
        
        // Pass the character type to the API call
        const taskData = await createImg2ImgTask(payload, character.type);
        
        if (!taskData || !taskData.task_id) {
          throw new Error('Failed to start image-to-image generation task');
        }
        
        // Start polling for this task
        startPolling(characterId, taskData.task_id);
      } else {
        throw new Error('Character must have either a photo or a description for generation');
      }
    } catch (error) {
      console.error(`Error generating preview for character ${characterId}:`, error);
      updateGenStatus(characterId, {
        status: 'error',
        errorMessage: error.message
      });
    }
  };

  // --- NEW: Polling Logic ---
  const startPolling = (characterId, taskId) => {
    // Associate the taskId with the character status, reset error/preview
    updateGenStatus(characterId, { 
      taskId: taskId, 
      status: 'polling', // Indicate polling has started
      pollIntervalId: null, 
      errorMessage: null, 
      previewUrl: null // Clear previous preview if retrying
    }); 

    const poll = async () => {
      try {
        // getTaskProgress now returns a promise that resolves/rejects only on completion/error/timeout
        console.log(`Awaiting final result for task ${taskId} (polling handled by getTaskProgress)`);
        const result = await getTaskProgress(taskId); // This will wait until finished/failed/timeout

        // If we get here, getTaskProgress resolved successfully
        console.log(`Polling successful for task ${taskId}:`, result);
        if (result.status === 'success' && result.imageUrl) {
          updateGenStatus(characterId, {
            status: 'previewReady',
            previewUrl: result.imageUrl,
            errorMessage: null // Clear any previous error
          });
        } else {
          // Should not happen if getTaskProgress resolves successfully, but handle defensively
          console.error("Polling succeeded but result is unexpected:", result);
          updateGenStatus(characterId, { 
             status: 'error', 
             errorMessage: 'Unexpected success state.' 
           });
        }

      } catch (error) { // getTaskProgress rejected (failure or timeout)
        console.error(`Polling failed for task ${taskId}:`, error);
        updateGenStatus(characterId, {
          status: 'error',
          errorMessage: error.message || 'Polling failed.'
        });
      } finally {
        // Regardless of outcome, ensure intervalId is cleared in the state if it somehow existed
        // (getTaskProgress handles its own interval, this is just cleanup for CharactersStep state)
        updateGenStatus(characterId, { pollIntervalId: null }); 
      }
    };

    // Call poll() once to start the process managed by getTaskProgress.
    poll(); 
  };

  // --- NEW: Confirm Character Style ---
  const handleConfirmStyle = (characterId) => {
    const status = generationStatus[characterId];
    const character = bookCharacters.find(c => c.id === characterId);
    
    if (status?.status === 'previewReady' && status.previewUrl) {
      console.log('Confirming style for character:', character.name);
      console.log('Using art style code:', artStyleCode);
      
      // Get the style name
      const styleName = getStyleNameFromCode(artStyleCode);
      
      console.log(`Storing style ${artStyleCode} (${styleName}) for character ${character.name}`);
      
      // Update the character in the store with both style preview and art style code
      updateCharacter(characterId, { 
        stylePreview: status.previewUrl, // Save the generated preview
        artStyle: artStyleCode, // Save the selected art style code
        artStyleName: styleName, // Optional: save a friendly name too
        photoUrl: null // DISCARD the original photo for privacy
      }); 
      
      // Also update local bookCharacters state to stay in sync
      setBookCharacters(prev => 
        prev.map(char => 
          char.id === characterId 
            ? { 
                ...char, 
                stylePreview: status.previewUrl,
                artStyle: artStyleCode,
                artStyleName: styleName,
                photoUrl: null 
              } 
            : char
        )
      );
      
      // Update local state to reflect confirmation
      updateGenStatus(characterId, { status: 'confirmed' });
      setError(''); // Clear any general errors
    } else {
      setError(`Cannot confirm style for character ${characterId}. Preview not ready.`);
    }
  };

  // --- Render Helper for Character Card ---
  const renderCharacterCard = (character) => {
    const status = generationStatus[character.id] || { status: 'idle' };
    const requiresGeneration = isBase64DataUrl(character.photoUrl) && status.status !== 'confirmed';
    
    // Get a display name for the art style if available
    const getArtStyleDisplayName = () => {
      // If the character has its own art style name
      if (character.artStyleName) {
        return character.artStyleName;
      }
      
      // If the character has a style code
      if (character.artStyle) {
        return getStyleNameFromCode(character.artStyle);
      }
      
      // If no character-specific style but story has a style set
      if (artStyleCode) {
        return getStyleNameFromCode(artStyleCode);
      }
      
      return 'No Style Selected';
    };

    return (
        <motion.div 
          key={character.id} 
          className="bg-white p-4 rounded-lg shadow border border-gray-200 relative space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <button 
            onClick={() => removeCharacter(character.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-red-300"
            aria-label={`Remove ${character.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <h4 className="font-semibold text-lg text-gray-800">{character.name}</h4>
          <div className="space-y-1">
            <p className="text-sm text-gray-500 capitalize">Role: {character.role}</p>
            <p className="text-sm text-gray-500">
              Age: {character.age || 'N/A'}, Gender: {character.gender || 'N/A'}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Art Style:</span> {getArtStyleDisplayName()}
            </p>
          </div>

          {/* Display Area for Original Photo & Generated Preview */}
          <div className="flex flex-col sm:flex-row gap-4 items-start mt-3">
            {/* Original Photo */}
            {character.photoUrl && isBase64DataUrl(character.photoUrl) && status.status !== 'confirmed' && (
              <div className='flex-1 text-center'>
                <p className="text-xs text-gray-500 mb-1">Original Photo</p>
                <img 
                  src={character.photoUrl} 
                  alt={`${character.name} - Original`} 
                  className="w-28 h-28 object-cover rounded mx-auto border high-quality"
                />
              </div>
            )}

            {/* Generated Preview Area */}
            {status.status === 'previewReady' && status.previewUrl && (
               <div className='flex-1 text-center'>
                 <p className="text-xs text-green-600 mb-1 font-medium">Generated Preview</p>
                 <img src={status.previewUrl} alt={`${character.name} - Style Preview`} className="w-28 h-28 object-cover rounded mx-auto border border-green-300 high-quality character-preview-image" />
               </div>
            )}
            {/* Confirmed Preview (shown when original is discarded) */}
             {status.status === 'confirmed' && character.stylePreview && (
               <div className='flex-1 text-center'>
                  <p className="text-xs text-green-600 mb-1 font-medium">Confirmed Style</p>
                  <img src={character.stylePreview} alt={`${character.name} - Confirmed Style`} className="w-28 h-28 object-cover rounded mx-auto border border-green-300 high-quality character-preview-image" />
               </div>
             )}
             {/* Placeholder if no photo was uploaded */}
             {!character.photoUrl && status.status !== 'confirmed' && (
                 <div className='flex-1 text-center text-gray-400 text-sm italic flex items-center justify-center h-32'>
                    (No photo uploaded)
                 </div>
             )}
          </div>

          {/* Generation Controls & Status */}
          {requiresGeneration && (
            <div className="mt-4 pt-3 border-t border-gray-200 space-y-2">
              {status.status === 'idle' && (
                <button 
                  onClick={() => handleGeneratePreview(character.id)}
                  disabled={!artStyleCode}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm"
                >
                  Generate Style Preview
                </button>
              )}
              {(status.status === 'generating' || status.status === 'polling') && (
                 <div className="text-center text-sm text-blue-600 flex items-center justify-center">
                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                     <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                     <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                   </svg>
                   Generating preview... ({status.status})
                 </div>
              )}
              {status.status === 'previewReady' && (
                <button 
                  onClick={() => handleConfirmStyle(character.id)}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 text-sm font-medium"
                >
                  Confirm Style & Use
                </button>
              )}
               {status.status === 'error' && (
                 <div className="text-center text-sm text-red-600">
                   Error: {status.errorMessage || 'Unknown error'}
                    {/* Optionally add a retry button */}
                     <button 
                      onClick={() => handleGeneratePreview(character.id)} 
                      className="ml-2 text-blue-500 hover:underline text-xs"
                      >Retry?</button>
                 </div>
              )}
            </div>
          )}
          {status.status === 'confirmed' && (
               <div className="mt-4 pt-3 border-t border-gray-200 text-center text-sm text-green-600 font-medium">
                   ✅ Style Confirmed
               </div>
           )}

        </motion.div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {showCharacterWizard ? (
        <CharacterWizard 
          onComplete={handleCharacterComplete} 
          initialRole={selectedRole}
          forcedArtStyle={artStyleCode}
        />
      ) : (
        <>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Add Your Story Characters</h1>
            <p className="text-gray-600">Create the characters that will appear in your story</p>
            
            {artStyleCode && (
              <div className="mt-2 inline-block px-3 py-1 bg-blue-50 text-blue-800 rounded-full text-sm">
                Using art style: {getStyleNameFromCode(artStyleCode)}
              </div>
            )}
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Characters List */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-xl font-semibold mb-4 text-gray-700">Story Characters</h3>
              {/* Privacy Notice - Moved to be more prominent */}
               <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 flex items-start">
                   <span className="text-2xl mr-3">🔒</span> 
                   <div>
                      <p className="font-semibold mb-1">Privacy Note Regarding Photos:</p>
                      <p>If you upload a photo, we use it <strong className='font-medium'>only once</strong> to generate the character's art style for the preview below. Once you click "Confirm Style & Use", the <strong className='font-medium'>original photo is permanently discarded</strong> from our system. We do not store your original photos.</p>
                   </div>
               </div>
            
            {/* Generate All Button - Only visible when style is selected and there are characters with photos */}
            {artStyleCode && bookCharacters.some(char => isBase64DataUrl(char.photoUrl)) && (
              <div className="mb-6 text-center">
                <button
                  onClick={handleGenerateAllPreviews}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Generate All Character Previews
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Uses your selected art style to generate all character previews at once
                </p>
              </div>
            )}
            
            {bookCharacters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {bookCharacters.map(renderCharacterCard)}
                </div>
             ) : (
               <p className="text-gray-500 text-sm mb-4">No characters added yet. Start by adding the Main Character!</p>
             )}
            <h4 className="text-md font-medium mb-2">Add Character by Role</h4>
            <div className="flex flex-wrap gap-2">
              {CHARACTER_ROLES.map((role) => (
                <button 
                  key={role.id}
                  onClick={() => handleAddCharacter(role.id)}
                  disabled={bookCharacters.some(c => c.role === role.id)}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  title={role.description}
                >
                  + Add {role.label}
                </button>
              ))}
            </div>
          </div>
  
          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4 mt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-100"
            >
              Back to Art Style
            </button>
            <button
              onClick={handleContinue}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700"
            >
              Continue to Story Details
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CharactersStep; 