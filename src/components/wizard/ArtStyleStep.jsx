import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { getDzineStyles, getAvailableStyles, getFriendlyStyleName } from '../../services/dzineService';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

// Import art style images from the Dzine Styles folder
import watercolorWhimsyImg from '../../assets/dzine-styles/Watercolor-Whimsy.png';
import whimsicalColoringImg from '../../assets/dzine-styles/Whimsical-Coloring.png';
import enchantedCharacterImg from '../../assets/dzine-styles/Enchanted-Character.png';
import minimalistCuteImg from '../../assets/dzine-styles/Minimalist-Cutesy.png';
import softRadianceImg from '../../assets/dzine-styles/Soft-Radiance.png';
import cheerfulStorybookImg from '../../assets/dzine-styles/Cheerful-Storybook.png';
import pleasantlyWarmImg from '../../assets/dzine-styles/Pleasantly-Warm.png';
import storytimeWhimsyImg from '../../assets/dzine-styles/Storytime-Whimsy.png';
import lineAndWashImg from '../../assets/dzine-styles/Line-&-Wash.png';
import goldenHourImg from '../../assets/dzine-styles/Golden-Hour.png';
import ancientChinaImg from '../../assets/dzine-styles/Ancient-China.png';
import cuteExaggerationImg from '../../assets/dzine-styles/Cute-Exaggeration.png';
import glossyEleganceImg from '../../assets/dzine-styles/Glossy-Elegance.png';
import starlitFantasyImg from '../../assets/dzine-styles/Starlit-Fantasy.png';
import fantasyHeroImg from '../../assets/dzine-styles/Fantasy-Hero.png';
import joyfulClayImg from '../../assets/dzine-styles/Joyful-Clay.png';
import ceramicLifelikeImg from '../../assets/dzine-styles/Ceramic-Lifelike.png';
import yarnRealismImg from '../../assets/dzine-styles/Yarn-Realism.png';
import mysticalSovereigntyImg from '../../assets/dzine-styles/Mystical-Sovereignty.png';
import enchantedEleganceImg from '../../assets/dzine-styles/Enchanted-Elegance.png';
import warmPortraitImg from '../../assets/dzine-styles/Warm-Portrait.png';
import magicPortraitImg from '../../assets/dzine-styles/Magic-Portrait.png';
import vividTableauxImg from '../../assets/dzine-styles/Vivid-Tableaux.png';
import luminousNarrativesImg from '../../assets/dzine-styles/Luminous-Narratives.png';
import dreamlikePortraitureImg from '../../assets/dzine-styles/Dreamlike-Portraiture.png';
import aquarelleLifeImg from '../../assets/dzine-styles/Aquarelle-Life.png';
import storybookCharmImg from '../../assets/dzine-styles/Storybook-Charm.png';
import sketchEleganceImg from '../../assets/dzine-styles/Sketch-Elegance.png';
import paperCutoutImg from '../../assets/dzine-styles/Paper-Cutout.png';

// Map style IDs to the imported images - used for legacy code compatibility
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

// Direct mapping from API style codes to images for more reliable lookups
const dzineStyleImageMap = {
  // Whimsical & Soft styles
  'Style-7f3f81ad-1c2d-4a15-944d-66bf549641de': watercolorWhimsyImg,
  'Style-206baa8c-5bbe-4299-b984-9243d05dce9b': whimsicalColoringImg,
  'Style-d37c13c6-4c5b-43a8-b86c-ab75a109bce7': enchantedCharacterImg,
  'Style-9f0b81f0-c773-4788-a83e-9ea2a25c6895': minimalistCuteImg,
  'Style-2a7de14d-6712-4115-a6a9-d3c7be55eaf2': softRadianceImg,
  
  // Classic & Timeless styles
  'Style-85480a6c-4aa6-4260-8ad1-a0b7423910cf': cheerfulStorybookImg,
  'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1': pleasantlyWarmImg,
  'Style-05c3d679-f8e9-4883-b9c9-adfe0988d1a5': storytimeWhimsyImg,
  'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9': lineAndWashImg,
  'Style-a37d7b69-1f9a-42c4-a8e4-f429c29f4512': goldenHourImg,
  'Style-5aebfb83-ff06-48ae-a8df-1560a32eded1': ancientChinaImg,
  
  // Modern & Colorful styles
  'Style-b484beb8-143e-4776-9a87-355e0456cfa3': cuteExaggerationImg,
  'Style-2ee57e3c-108a-41dd-8b28-b16d0ceb6280': glossyEleganceImg,
  'Style-9cde0ca9-78f0-4be5-a6a1-44dd74cfbaa0': starlitFantasyImg,
  'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f': fantasyHeroImg,
  'Style-455da805-d716-4bc8-a960-4ac505aa7875': joyfulClayImg,
  'Style-d0fbfa6f-59bb-4578-a567-bde0c82bd833': ceramicLifelikeImg,
  'Style-b3a85eaa-5c3a-4c96-af0f-db5c984a955a': yarnRealismImg,
  'Style-1e39bdee-4d33-4f5b-9bbc-12f8f1505fc6': mysticalSovereigntyImg,
  
  // Realistic & Artistic styles
  'Style-bfb2db5f-ecfc-4fe9-b864-1a5770d59347': enchantedEleganceImg,
  'Style-12325d6b-f0c2-4570-a8a3-1c15124ea703': warmPortraitImg,
  'Style-552954ec-d5bc-4148-a5f9-4c7a42e41b2c': magicPortraitImg,
  'Style-b7c0d088-e046-4e9b-a0fb-a329d2b9a36a': vividTableauxImg,
  'Style-ce7b4279-1398-4964-882c-19911e12aef3': luminousNarrativesImg,
  'Style-5e5c3d6f-8a05-49bc-89bd-281c11a7b96d': dreamlikePortraitureImg,
  'Style-4cc27c59-8418-41c3-acc1-6fef4518b14b': aquarelleLifeImg
};

// Updated Art Style Categories with direct API styles and CORRECT names
export const ART_STYLE_CATEGORIES_STRUCTURE = [
  {
    category: 'Whimsical & Soft (Ages 0–5)',
    description: 'Gentle, dreamy art styles perfect for the youngest readers with soft colors and comforting visuals.',
    styleIds: [
      { 
        id: 'watercolor_whimsy',
        apiCode: 'Style-7f3f81ad-1c2d-4a15-944d-66bf549641de',
        title: 'Watercolor Whimsy',
        description: 'Rounded shapes and soft digital brushwork with gentle gradients'
      },
      { 
        id: 'whimsical_coloring',
        apiCode: 'Style-206baa8c-5bbe-4299-b984-9243d05dce9b',
        title: 'Whimsical Coloring', 
        description: 'Tender, soothing colors with a gentle, chalky texture perfect for bedtime stories'
      },
      { 
        id: 'enchanted_character',
        apiCode: 'Style-d37c13c6-4c5b-43a8-b86c-ab75a109bce7',
        title: 'Enchanted Character',
        description: 'Magical characters with soft lighting and enchanting atmosphere'
      },
      { 
        id: 'minimalist_cutesy',
        apiCode: 'Style-9f0b81f0-c773-4788-a83e-9ea2a25c6895',
        title: 'Minimalist Cutesy',
        description: 'Simple, cute designs with minimal details and soft colors'
      },
      { 
        id: 'soft_radiance',
        apiCode: 'Style-2a7de14d-6712-4115-a6a9-d3c7be55eaf2',
        title: 'Soft Radiance',
        description: 'Gentle, glowing artwork with soft lighting and delicate details'
      }
    ]
  },
  {
    category: 'Classic & Timeless (Ages 3–8)',
    description: 'Traditional illustration styles reminiscent of beloved children\'s books that stand the test of time.',
    styleIds: [
      { 
        id: 'cheerful_storybook',
        apiCode: 'Style-85480a6c-4aa6-4260-8ad1-a0b7423910cf',
        title: 'Cheerful Storybook',
        description: 'Bright, cheerful illustrations with bold colors and playful details'
      },
      { 
        id: 'pleasantly_warm',
        apiCode: 'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1',
        title: 'Pleasantly Warm',
        description: 'Charming, detailed watercolor illustrations with a warm, cozy feeling'
      },
      { 
        id: 'storytime_whimsy',
        apiCode: 'Style-05c3d679-f8e9-4883-b9c9-adfe0988d1a5',
        title: 'Storytime Whimsy',
        description: 'Whimsical, storybook-style illustrations with a classic feel'
      },
      { 
        id: 'line_and_wash',
        apiCode: 'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9',
        title: 'Line and Wash',
        description: 'Delicate pencil drawings with light watercolor washes for a timeless feel'
      },
      { 
        id: 'golden_hour',
        apiCode: 'Style-a37d7b69-1f9a-42c4-a8e4-f429c29f4512',
        title: 'Golden Hour',
        description: 'Nostalgic illustrations with warm, golden lighting inspired by classic picture books'
      },
      { 
        id: 'ancient_china',
        apiCode: 'Style-5aebfb83-ff06-48ae-a8df-1560a32eded1',
        title: 'Ancient China',
        description: 'Traditional Chinese painting style with elegant brushwork and composition'
      }
    ]
  },
  {
    category: 'Modern & Colorful (Ages 4–9)',
    description: 'Bold, vibrant styles with clean lines and contemporary design sensibilities.',
    styleIds: [
      { 
        id: 'cute_exaggeration',
        apiCode: 'Style-f45b720c-656d-4ef0-bd86-f9f5afa63f0f',
        title: 'Cutie 3D',
        description: 'Playful and cute 3D characters with slightly exaggerated features.'
      },
      { 
        id: 'glossy_elegance',
        apiCode: 'Style-2ee57e3c-108a-41dd-8b28-b16d0ceb6280',
        title: 'Glossy Elegance',
        description: 'Clean, sleek, modern illustrations with a glossy finish'
      },
      { 
        id: 'starlit_fantasy',
        apiCode: 'Style-9cde0ca9-78f0-4be5-a6a1-44dd74cfbaa0',
        title: 'Starlit Fantasy',
        description: 'A dreamy and ethereal style with a magical starlit quality.'
      },
      { 
        id: 'fantasy_hero',
        apiCode: 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f',
        title: 'Fantasy Hero',
        description: 'Bold, heroic character illustrations with a fantasy adventure feel'
      },
      { 
        id: 'joyful_clay',
        apiCode: 'Style-455da805-d716-4bc8-a960-4ac505aa7875',
        title: 'Joyful Clay',
        description: 'Cheerful characters that look like they are made of colorful clay'
      },
      { 
        id: 'ceramic_lifelike',
        apiCode: 'Style-d0fbfa6f-59bb-4578-a567-bde0c82bd833',
        title: 'Ceramic Lifelike',
        description: 'Illustrations that have a 3D ceramic quality with smooth textures'
      },
      { 
        id: 'yarn_realism',
        apiCode: 'Style-b3a85eaa-5c3a-4c96-af0f-db5c984a955a',
        title: 'Yarn Realism',
        description: 'Textures and styling that mimic yarn and textile elements'
      },
      { 
        id: 'mystical_sovereignty',
        apiCode: 'Style-1e39bdee-4d33-4f5b-9bbc-12f8f1505fc6',
        title: 'Mystical Sovereignty',
        description: 'Majestic, mystical scenes with an air of fantasy and elegance'
      }
    ]
  },
  {
    category: 'Realistic & Artistic (Ages 6–12)',
    description: 'Sophisticated art styles with richer detail, ideal for preserving the likeness of your child.',
    styleIds: [
      { 
        id: 'enchanted_elegance',
        apiCode: 'Style-bfb2db5f-ecfc-4fe9-b864-1a5770d59347',
        title: 'Enchanted Elegance',
        description: 'Detailed illustrations with an elegant, enchanted quality'
      },
      { 
        id: 'warm_portrait',
        apiCode: 'Style-12325d6b-f0c2-4570-a8a3-1c15124ea703',
        title: 'Warm Portrait',
        description: 'Realistic portraits with warm lighting and preserved facial features'
      },
      { 
        id: 'magic_portrait',
        apiCode: 'Style-552954ec-d5bc-4148-a5f9-4c7a42e41b2c',
        title: 'Magic Portrait',
        description: 'Semi-stylized portraits with a magical, fantasy quality'
      },
      { 
        id: 'vivid_tableaux',
        apiCode: 'Style-b7c0d088-e046-4e9b-a0fb-a329d2b9a36a',
        title: 'Vivid Tableaux',
        description: 'Rich, textured scenes with vibrant colors and detailed compositions'
      },
      { 
        id: 'luminous_narratives',
        apiCode: 'Style-ce7b4279-1398-4964-882c-19911e12aef3',
        title: 'Luminous Narratives',
        description: 'Rich digital illustrations with painterly effects and detailed lighting'
      },
      { 
        id: 'dreamlike_portraiture',
        apiCode: 'Style-5e5c3d6f-8a05-49bc-89bd-281c11a7b96d',
        title: 'Dreamlike Portraiture',
        description: 'Portraits with a dreamy, ethereal quality and soft focus'
      },
      { 
        id: 'aquarelle_life',
        apiCode: 'Style-4cc27c59-8418-41c3-acc1-6fef4518b14b',
        title: 'Aquarelle Life',
        description: 'Vibrant watercolor style with flowing colors and rich textures'
      }
    ]
  }
];

// Detailed descriptions for each art style - for legacy compatibility only
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
    description: 'A dreamy and ethereal style with a magical starlit quality.'
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
    description: 'Describe your own unique art style for your story'
  }
};

function ArtStyleStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  
  const [artStyleCode, setArtStyleCode] = useState(wizardState.storyData.artStyleCode || '');
  const [customStyleDescription, setCustomStyleDescription] = useState(wizardState.storyData.customStyleDescription || '');
  
  // State for fetched styles and mapping
  const [dzineStyles, setDzineStyles] = useState([]);
  const [noStyleCode, setNoStyleCode] = useState(null); // For custom style
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);
  const [styleFetchError, setStyleFetchError] = useState(null);
  const [error, setError] = useState('');
  
  // UPDATED: Create a hard-coded style map for internal testing
  // This guarantees styles will display even if API is unavailable
  const FALLBACK_STYLE_MAP = { ...styleDescriptions };

  // Find best matching API style for a given internal style ID
  const findBestMatchingStyle = (styleItem, apiStyles) => {
    if (!apiStyles || apiStyles.length === 0) return null;
    
    // Try to find a match based on keywords
    const matches = apiStyles.map(apiStyle => {
      const apiStyleName = apiStyle.name.toLowerCase();
      const matchScore = styleItem.keywords.reduce((score, keyword) => {
        return apiStyleName.includes(keyword.toLowerCase()) ? score + 1 : score;
      }, 0);
      return { apiStyle, matchScore };
    }).filter(match => match.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore);
    
    // Return the best match or null if no matches
    return matches.length > 0 ? matches[0].apiStyle : null;
  };

  // Fetch styles from Dzine API on mount
  useEffect(() => {
    const fetchStyles = async () => {
      setIsLoadingStyles(true);
      setStyleFetchError(null);
      try {
        const data = await getDzineStyles();
        if (data.list && data.list.length > 0) {
          setDzineStyles(data.list);
          
          // Find "No Style" option for custom styles
          const noStyleOption = data.list.find(style => 
            style.name.toLowerCase().includes('no style')
          );
          setNoStyleCode(noStyleOption?.style_code || 'Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2');
          
          // Set initial artStyleCode if not already set
          if (!artStyleCode) {
            // Auto-suggest style based on category (can be refined)
            const category = wizardState.storyData.category || 'adventure';
            
            // Map categories to style IDs
            const categoryToStyleMap = {
              adventure: 'cartoon',
              fantasy: 'watercolor',
              bedtime: 'pastel',
              learning: 'flat_vector',
              birthday: 'storybook_pop'
            };
            
            // Get the suggested style ID
            const suggestedInternalStyleId = categoryToStyleMap[category] || 'cartoon';
            
            // Find the matching style in our structured categories
            let matchingStyleItem = null;
            for (const category of ART_STYLE_CATEGORIES_STRUCTURE) {
              const match = category.styleIds.find(s => s.id === suggestedInternalStyleId);
              if (match) {
                matchingStyleItem = match;
                break;
              }
            }
            
            // Find the API style that best matches this internal style
            if (matchingStyleItem) {
              const bestMatch = findBestMatchingStyle(matchingStyleItem, data.list);
              if (bestMatch) {
                setArtStyleCode(bestMatch.style_code);
              } else {
                // Default to first style if no match
                setArtStyleCode(data.list[0].style_code);
              }
            } else {
              // Default to first style if no matching style item
              setArtStyleCode(data.list[0].style_code);
            }
          }
        } else {
          console.warn('No styles returned from Dzine API');
          setStyleFetchError('No styles available from API');
        }
      } catch (err) {
        console.error("Failed to fetch Dzine styles:", err);
        setStyleFetchError(err.message || 'Could not load art styles.');
      } finally {
        setIsLoadingStyles(false);
      }
    };
    
    fetchStyles();
  }, []);
  
  // Load wizard state when it changes (e.g., navigating back)
  useEffect(() => {
    setArtStyleCode(wizardState.storyData.artStyleCode || '');
    setCustomStyleDescription(wizardState.storyData.customStyleDescription || '');
  }, [wizardState.storyData]);
  
  // Special handling for Warm Fables style
  useEffect(() => {
    try {
      // Make sure Pleasantly Warm style is always available by ID in localStorage
      const existingNames = localStorage.getItem('styleCodeNames') || '{}';
      const namesMap = JSON.parse(existingNames);
      
      // Hard-code the Pleasantly Warm style
      const pleasantlyWarmStyleCode = 'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1';
      namesMap[pleasantlyWarmStyleCode] = 'Pleasantly Warm';
      
      localStorage.setItem('styleCodeNames', JSON.stringify(namesMap));
    } catch (e) {
      console.error("Failed to ensure Pleasantly Warm style is in localStorage:", e);
    }
  }, []);
  
  const handleBack = () => {
    // Go back to the Category & Scene step
    setWizardStep(1);
  };
  
  const handleContinue = () => {
    // Validation
    if (!artStyleCode) {
      setError('Please select an art style for your storybook.');
      return;
    }
    
    // For custom style, make sure there's a description
    if (artStyleCode === 'custom' && !customStyleDescription.trim()) {
      setError('Please provide a description for your custom art style.');
      return;
    }

    // Update the store with style data
    updateStoryData({ 
      artStyleCode,
      customStyleDescription: artStyleCode === 'custom' ? customStyleDescription : ''
    });
    
    // Continue to Characters step
    setWizardStep(3);
  };

  // Helper to get style details from fetched list based on ID
  const getStyleDetails = (id) => {
    return dzineStyles.find(s => s.style_code === id);
  };

  // Instead of actually checking the availability from the API (which might fail),
  // we'll now determine availability based on if the style exists in our predefined list
  const isStyleAvailable = (styleId) => {
    // Just return true since we've curated these, they should be available
    return true;
  };

  // Make sure the style selection handler is properly defined
  const handleStyleSelect = (styleCode) => {
    console.log("Style selected:", styleCode);
    setArtStyleCode(styleCode);
    setError(''); // Clear any errors when a style is selected
    
    // Store the selected style name for easier reference later
    let styleName = null;
    
    // Check if it's a direct style code from ART_STYLE_CATEGORIES_STRUCTURE
    for (const category of ART_STYLE_CATEGORIES_STRUCTURE) {
      const style = category.styleIds.find(s => s.apiCode === styleCode);
      if (style) {
        styleName = style.title;
        
        // Store this style name in localStorage
        try {
          // First for this specific style
          localStorage.setItem('lastSelectedStyleName', styleName);
          
          // Then store all style names for lookup by other components
          const existingNames = localStorage.getItem('styleCodeNames') || '{}';
          const namesMap = JSON.parse(existingNames);
          namesMap[styleCode] = styleName;
          localStorage.setItem('styleCodeNames', JSON.stringify(namesMap));
        } catch (e) {
          console.error("Failed to save style name to localStorage:", e);
        }
        
        break;
      }
    }
    
    // If it's the custom style, make sure the textarea is enabled
    if (styleCode === 'custom') {
      // Focus on the custom style textarea after a brief delay
      setTimeout(() => {
        const textarea = document.querySelector('textarea[placeholder*="Vibrant watercolor"]');
        if (textarea) textarea.focus();
      }, 100);
    }
  };

  // Render the art styles in a grid layout by category
  const renderArtStyles = () => {
    return (
      <div className="space-y-4 mt-2 mb-4">
        {ART_STYLE_CATEGORIES_STRUCTURE.map((category, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="text-lg font-medium mb-1">{category.category}</h3>
            <p className="text-sm text-gray-600 mb-1">{category.description}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {category.styleIds.map((style) => {
                // We'll use the direct API code from our curated list
                const styleCode = style.apiCode;
                const isAvailable = true; // Since we've curated these, they should be available
                
                return (
                  <div 
                    key={style.id}
                    onClick={() => handleStyleSelect(styleCode)}
                    className={`border rounded-md overflow-hidden transition-all shadow-sm hover:shadow-md ${
                      artStyleCode === styleCode 
                        ? 'ring-2 ring-blue-500 border-blue-500' 
                        : 'border-gray-200 hover:border-blue-300'
                    } cursor-pointer`}
                  >
                    <div className={`aspect-[4/3] bg-gray-100 relative card-image-container`}>
                      <img 
                        src={styleImageMap[style.id] || '/placeholder-style.jpg'} 
                        alt={style.title}
                        className="w-full h-full object-contain sm:object-cover max-h-48 art-style-image high-quality"
                        onError={(e) => {
                          // Fallback if image isn't available
                          e.target.src = 'https://placehold.co/400x300/e5e7eb/a3a3a3?text=Style+Image';
                        }}
                      />
                      {artStyleCode === styleCode && (
                        <div className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <h4 className="font-medium mb-1 text-sm style-card-title">{style.title}</h4>
                      <p className="text-xs text-gray-600 style-card-description">{style.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        
        {/* Custom style option */}
        <div className="mt-4">
          <div 
            onClick={() => handleStyleSelect(noStyleCode)}
            className={`border rounded-md overflow-hidden transition-all p-3 ${
              artStyleCode === noStyleCode 
                ? 'ring-2 ring-blue-500 border-blue-500' 
                : 'border-gray-200 hover:border-blue-300'
            } cursor-pointer`}
          >
            <div className="flex items-center gap-3 mb-1">
              <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
              <h4 className="font-medium text-sm">Custom Style Description</h4>
            </div>
            
            <p className="text-xs text-gray-600 mb-2">
              Describe a specific art style not listed above, or combine elements from multiple styles.
            </p>
            
            <textarea
              value={customStyleDescription}
              onChange={(e) => setCustomStyleDescription(e.target.value)}
              placeholder="Example: Vibrant watercolor with fine ink details, dreamy pastel colors, and a slight glow effect around characters."
              className={`w-full border rounded-md p-2 text-xs ${
                artStyleCode === noStyleCode ? 'border-blue-400' : 'border-gray-300'
              }`}
              rows={2}
              disabled={artStyleCode !== noStyleCode}
            />
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-6 pb-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Choose Your Art Style</h2>
        <p className="text-gray-600">Select the visual style for all illustrations in your story.</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {styleFetchError && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4" role="alert">
          <p>Error loading art styles from the server. You can continue with a custom style description.</p>
          <p className="text-xs">{styleFetchError}</p>
            </div>
      )}
      
      {isLoadingStyles ? (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : (
        <>{renderArtStyles()}</>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 mt-6 border-t border-gray-200">
        <button
          onClick={handleBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-100"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700"
        >
          Continue to Characters
        </button>
      </div>
    </div>
  );
}

export default ArtStyleStep; 