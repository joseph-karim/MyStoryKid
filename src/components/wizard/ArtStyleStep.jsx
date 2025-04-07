import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { getKeywordsForDzineStyle } from '../../services/dzineService';
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
        apiCode: 'Style-b484beb8-143e-4776-9a87-355e0456cfa3',
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

function ArtStyleStep() {
  const {
    wizardState,
    updateStoryData,
    setWizardStep,
  } = useBookStore();
  
  const [selectedStyle, setSelectedStyle] = useState(wizardState.storyData.artStyleCode || '');
  
  const handleSelectStyle = (styleCode) => {
    setSelectedStyle(styleCode);
    const keywords = getKeywordsForDzineStyle(styleCode);
    updateStoryData({ artStyleCode: styleCode, selectedStyleKeywords: keywords }); 
  };
  
  const handleNext = () => {
    if (!selectedStyle) {
        alert('Please select an art style.');
        return;
    }
    setWizardStep(3); // Move to Main Character step
  };

  const handleBack = () => {
    setWizardStep(1); // Go back to Category & Scene
  };

  // Motion variants for animation
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose Your Art Style</h2>
        <p className="text-gray-600">Select the visual style for your book's illustrations.</p>
      </div>

      <motion.div 
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {ART_STYLE_CATEGORIES_STRUCTURE.map((category) => (
          <div key={category.category}>
            <h3 className="text-lg font-semibold mb-2">{category.category}</h3>
            <p className="text-sm text-gray-500 mb-4">{category.description}</p>
            <motion.div 
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              variants={containerVariants}
            >
              {category.styleIds.map((style) => (
                <motion.div 
                  key={style.apiCode}
                  variants={itemVariants}
                  onClick={() => handleSelectStyle(style.apiCode)}
                  className={`border rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ease-in-out transform hover:scale-105 ${
                    selectedStyle === style.apiCode 
                    ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2' 
                    : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img 
                    src={dzineStyleImageMap[style.apiCode] || 'https://via.placeholder.com/150?text=No+Preview'}
                    alt={style.title}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                       e.target.onerror = null; 
                       e.target.src = 'https://via.placeholder.com/150?text=Error';
                    }}
                  />
                  <div className="p-3 text-center">
                    <p className="text-sm font-medium truncate">{style.title}</p> 
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
      </motion.div>

      <div className="flex justify-between pt-6">
        <button
          onClick={handleBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={!selectedStyle}
          className={`px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            !selectedStyle 
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          Next: Main Character
        </button>
      </div>
    </div>
  );
}

export default ArtStyleStep; 