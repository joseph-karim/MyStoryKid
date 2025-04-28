import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { styleCodeMap as STYLE_CODE_MAP } from '../../utils/styleUtils';
import { motion } from 'framer-motion';

// Export the style code map for use in other components
export { STYLE_CODE_MAP };

// Style categories for UI organization
const CATEGORIES = [
  { id: 'whimsical', label: 'Whimsical & Fun', icon: '✨' },
  { id: 'illustrated', label: 'Illustrated & Artistic', icon: '🎨' },
  { id: 'stylized', label: 'Stylized & Modern', icon: '🌟' },
  { id: 'portraits', label: 'Portraits & Characters', icon: '👤' },
  { id: 'special', label: 'Special Styles', icon: '🔮' },
];

// Map styles to their categories
const STYLE_CATEGORIES = {
  'whimsical': [
    'Storytime Whimsy', 'Fantasy Hero', 'Soft Radiance', 'Paper Cutout',
    'Joyful Clay', 'Playful Enamel', 'Ceramic Lifelike', 'Colourful Felt'
  ],
  'illustrated': [
    'Sketch Elegance', 'Skyborn Realm', 'Aquarelle Life', 'Vivid Tableaux',
    'Everything Kawaii', 'Dreamy 3D', 'Cutie 3D', 'Shimmering Glow'
  ],
  'stylized': [
    'Surreal Iridescence', 'Golden Hour', 'Inked Realism', 'Magic Portrait',
    'Warm Portrait', 'Retro Noir Chromatics', 'Vintage Engraving', 'Ancient China'
  ],
  'portraits': [
    'Graffiti Splash', 'Pleasantly Warm', '80bit Arcade', 'Impressionist',
    'Zen Spirit', 'Vibrant Whimsy', 'Whimsical Brushwork', 'Bedtime Story'
  ],
  'special': [
    'Line & Wash', 'Nouveau Classic', 'Innocent CUtie', 'Glossy Elegance',
    'Memphis Illustration', 'Minimalist Cutesy', 'Watercolor Whimsy', 'Sketchbook Sticker',
    'Vibrant Impasto', 'Dreamy Spectrum', 'Enhanced Elegance', 'Cheerful Storybook',
    'Starlit Fantasy', 'Delicate Aquarelle'
  ]
};

// Updated Art Style Categories with verified API style codes
export const ART_STYLE_CATEGORIES_STRUCTURE = [
  {
    category: 'Whimsical & Fun',
    description: 'Playful and whimsical styles with colorful, fun designs perfect for young readers.',
    styleIds: [
      {
        id: 'storytime_whimsy',
        apiCode: STYLE_CODE_MAP['Storytime Whimsy'],
        title: 'Storytime Whimsy',
        description: 'Whimsical, storybook-style illustrations with a classic feel'
      },
      {
        id: 'fantasy_hero',
        apiCode: STYLE_CODE_MAP['Fantasy Hero'],
        title: 'Fantasy Hero',
        description: 'Bold, heroic character illustrations with a fantasy adventure feel'
      },
      {
        id: 'soft_radiance',
        apiCode: STYLE_CODE_MAP['Soft Radiance'],
        title: 'Soft Radiance',
        description: 'Gentle, glowing artwork with soft lighting and delicate details'
      },
      {
        id: 'paper_cutout',
        apiCode: STYLE_CODE_MAP['Paper Cutout'],
        title: 'Paper Cutout',
        description: 'Illustrations that look like layered paper cutouts with clean edges'
      },
      {
        id: 'joyful_clay',
        apiCode: STYLE_CODE_MAP['Joyful Clay'],
        title: 'Joyful Clay',
        description: 'Cheerful characters that look like they are made of colorful clay'
      },
      {
        id: 'playful_enamel',
        apiCode: STYLE_CODE_MAP['Playful Enamel'],
        title: 'Playful Enamel',
        description: 'Bright, glossy illustrations with an enamel-like finish'
      },
      {
        id: 'everything_kawaii',
        apiCode: STYLE_CODE_MAP['Everything Kawaii'],
        title: 'Everything Kawaii',
        description: 'Ultra-cute Japanese-inspired style with adorable characters'
      }
    ]
  },
  {
    category: 'Illustrated & Artistic',
    description: 'Beautiful, artistic styles with rich textures and detail for a classic storybook feel.',
    styleIds: [
      {
        id: 'ceramic_lifelike',
        apiCode: STYLE_CODE_MAP['Ceramic Lifelike'],
        title: 'Ceramic Lifelike',
        description: 'Illustrations that have a 3D ceramic quality with smooth textures'
      },
      {
        id: 'colorful_felt',
        apiCode: STYLE_CODE_MAP['Colorful Felt'],
        title: 'Colorful Felt',
        description: 'Textured illustrations that mimic the look of felt crafts'
      },
      {
        id: 'sketch_elegance',
        apiCode: STYLE_CODE_MAP['Sketch Elegance'],
        title: 'Sketch Elegance',
        description: 'Beautiful detailed pencil sketches with subtle shading'
      },
      {
        id: 'skyborne_realm',
        apiCode: STYLE_CODE_MAP['Skyborn Realm'],
        title: 'Skyborne Realm',
        description: 'Majestic, airy illustrations with a sense of height and wonder'
      },
      {
        id: 'aquarelle_life',
        apiCode: STYLE_CODE_MAP['Aquarelle Life'],
        title: 'Aquarelle Life',
        description: 'Vibrant watercolor style with flowing colors and rich textures'
      },
      {
        id: 'vivid_tableaux',
        apiCode: STYLE_CODE_MAP['Vivid Tableaux'],
        title: 'Vivid Tableaux',
        description: 'Rich, textured scenes with vibrant colors and detailed compositions'
      },
      {
        id: 'line_and_wash',
        apiCode: STYLE_CODE_MAP['Line & Wash'],
        title: 'Line & Wash',
        description: 'Delicate line drawings with light watercolor washes'
      }
    ]
  },
  {
    category: 'Stylized & Modern',
    description: 'Contemporary designs with bold colors and unique creative approaches.',
    styleIds: [
      {
        id: 'dreamy_3d',
        apiCode: STYLE_CODE_MAP['Dreamy 3D'],
        title: 'Dreamy 3D',
        description: 'Soft 3D rendered illustrations with a dreamy quality'
      },
      {
        id: 'cutie_3d',
        apiCode: STYLE_CODE_MAP['Cutie 3D'],
        title: 'Cutie 3D',
        description: 'Adorable 3D characters with expressive features'
      },
      {
        id: 'shimmering_glow',
        apiCode: STYLE_CODE_MAP['Shimmering Glow'],
        title: 'Shimmering Glow',
        description: 'Illustrations with a magical luminous quality'
      },
      {
        id: 'surreal_iridescence',
        apiCode: STYLE_CODE_MAP['Surreal Iridescence'],
        title: 'Surreal Iridescence',
        description: 'Dreamlike scenes with shimmering, rainbow-like colors'
      },
      {
        id: 'golden_hour',
        apiCode: STYLE_CODE_MAP['Golden Hour'],
        title: 'Golden Hour',
        description: 'Warm, sunset-toned illustrations with a nostalgic feel'
      },
      {
        id: 'vibrant_impasto',
        apiCode: STYLE_CODE_MAP['Vibrant Impasto'],
        title: 'Vibrant Impasto',
        description: 'Bold paintings with thick, textured brush strokes'
      },
      {
        id: 'sketchbook_sticker',
        apiCode: STYLE_CODE_MAP['Sketchbook Sticker'],
        title: 'Sketchbook Sticker',
        description: 'Fun, casual illustrations that look like stickers in a sketchbook'
      }
    ]
  },
  {
    category: 'Portraits & Characters',
    description: 'Styles that focus on character details and expressions, ideal for preserving likeness.',
    styleIds: [
      {
        id: 'inked_realism',
        apiCode: STYLE_CODE_MAP['Inked Realism'],
        title: 'Inked Realism',
        description: 'Detailed portraits with an ink-drawn quality'
      },
      {
        id: 'magic_portrait',
        apiCode: STYLE_CODE_MAP['Magic Portrait'],
        title: 'Magic Portrait',
        description: 'Semi-stylized portraits with a magical, fantasy quality'
      },
      {
        id: 'warm_portrait',
        apiCode: STYLE_CODE_MAP['Warm Portrait'],
        title: 'Warm Portrait',
        description: 'Realistic portraits with warm lighting and preserved facial features'
      },
      {
        id: 'retro_noir_chromatics',
        apiCode: STYLE_CODE_MAP['Retro Noir Chromatics'],
        title: 'Retro Noir Chromatics',
        description: 'Stylish noir-inspired portraits with bold colors'
      },
      {
        id: 'starlit_fantasy',
        apiCode: STYLE_CODE_MAP['Starlit Fantasy'],
        title: 'Starlit Fantasy',
        description: 'Characters with a dreamy, ethereal quality surrounded by stars'
      },
      {
        id: 'cheerful_storybook',
        apiCode: STYLE_CODE_MAP['Cheerful Storybook'],
        title: 'Cheerful Storybook',
        description: 'Bright, cheerful character illustrations in a classic storybook style'
      }
    ]
  },
  {
    category: 'Special Styles',
    description: 'Unique art styles with distinctive visual techniques for specialized stories.',
    styleIds: [
      {
        id: 'vintage_engraving',
        apiCode: STYLE_CODE_MAP['Vintage Engraving'],
        title: 'Vintage Engraving',
        description: 'Old-fashioned engraved look with fine lines and details'
      },
      {
        id: 'ancient_china',
        apiCode: STYLE_CODE_MAP['Ancient China'],
        title: 'Ancient China',
        description: 'Traditional Chinese painting style with elegant brushwork'
      },
      {
        id: 'graffiti_splash',
        apiCode: STYLE_CODE_MAP['Graffiti Splash'],
        title: 'Graffiti Splash',
        description: 'Urban street art style with bold colors and spray paint effects'
      },
      {
        id: 'pleasantly_warm',
        apiCode: STYLE_CODE_MAP['Pleasantly Warm'],
        title: 'Pleasantly Warm',
        description: 'Cozy, warm-toned illustrations with a comfortable feeling'
      },
      {
        id: '8bit_arcade',
        apiCode: STYLE_CODE_MAP['8-Bit Arcade'],
        title: '8-Bit Arcade',
        description: 'Retro pixel art style reminiscent of classic video games'
      },
      {
        id: 'impressionist',
        apiCode: STYLE_CODE_MAP['Impressionist'],
        title: 'Impressionist',
        description: 'Artistic style with visible brushstrokes and light effects'
      },
      {
        id: 'zen_spirit',
        apiCode: STYLE_CODE_MAP['Zen Spirit'],
        title: 'Zen Spirit',
        description: 'Tranquil, mindful illustrations with Eastern artistic influences'
      }
    ]
  }
];

// Update the component to display thumbnails
const ArtStyleCard = ({ styleName, styleData }) => (
  <div className="art-style-card">
    <img src={styleData.thumbnail} alt={`${styleName} thumbnail`} className="art-style-thumbnail" />
    <h3>{styleName}</h3>
    <p>{styleData.description}</p>
  </div>
);

function ArtStyleStep() {
  const {
    wizardState,
    updateStoryData,
    setWizardStep,
  } = useBookStore();

  const [selectedStyle, setSelectedStyle] = useState(wizardState.storyData.artStyleCode || '');
  const [stylePreviewUrls, setStylePreviewUrls] = useState({});

  // Load preview URLs for each style
  // Use PNG thumbnails with SVG fallbacks
  useEffect(() => {
    // Just use our local style map
    const previews = {};

    // Process all styles from the categories structure
    ART_STYLE_CATEGORIES_STRUCTURE.forEach(category => {
      category.styleIds.forEach(style => {
        if (style.apiCode) {
          // Try to use PNG thumbnails first, with SVG as fallback
          // We'll check if the PNG exists in the onError handler of the img tag
          previews[style.apiCode] = `/assets/style-thumbnails-png/${style.apiCode}.png`;
        }
      });
    });

    console.log('Style preview URLs:', previews);
    setStylePreviewUrls(previews);
  }, []);

  const handleSelectStyle = (styleCode) => {
    console.log('Selected style:', styleCode);
    setSelectedStyle(styleCode);
    updateStoryData({ artStyleCode: styleCode }); // Only update artStyleCode
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
                  <div
                    className="w-full h-32 bg-gray-100 flex items-center justify-center relative overflow-hidden"
                  >
                    {stylePreviewUrls[style.apiCode] ? (
                      <img
                        src={stylePreviewUrls[style.apiCode]}
                        alt={style.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // On error, show a colored placeholder with the style name
                          const styleCode = style.apiCode;
                          const color = `hsl(${styleCode.length * 10 % 360}, 70%, 60%)`;
                          const parent = e.target.parentNode;

                          // Create a placeholder div
                          const placeholder = document.createElement('div');
                          placeholder.className = 'w-full h-full flex items-center justify-center';
                          placeholder.style.backgroundColor = color;

                          // Add style name text
                          const text = document.createElement('span');
                          text.className = 'text-white font-bold text-center px-2';
                          text.textContent = style.title;
                          placeholder.appendChild(text);

                          // Replace the image with the placeholder
                          e.target.style.display = 'none';
                          parent.appendChild(placeholder);

                          console.log(`Created placeholder for ${styleCode}`);
                        }}
                      />
                    ) : (
                      <div className="animate-pulse bg-gray-200 w-full h-full"></div>
                    )}
                  </div>
            <div className="p-3">
                    <p className="text-sm font-medium truncate">{style.title}</p>
                    <p className="text-xs text-gray-500 truncate">{style.description}</p>
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