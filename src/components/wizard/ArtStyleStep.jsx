import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { styleCodeMap as STYLE_CODE_MAP } from '../../utils/styleUtils';
import { motion } from 'framer-motion';

// Export the style code map for use in other components
export { STYLE_CODE_MAP };

// Art style categories are defined in ART_STYLE_CATEGORIES_STRUCTURE

// Updated Art Style Categories with verified API style codes
export const ART_STYLE_CATEGORIES_STRUCTURE = [
  {
    category: 'Watercolor & Traditional',
    description: 'Soft, artistic styles with traditional painting techniques.',
    styleIds: [
      {
        id: 'watercolor_storybook',
        apiCode: 'watercolor_storybook',
        title: 'Watercolor Storybook',
        description: 'Soft watercolor children\'s book illustration with gentle pastel colors'
      },
      {
        id: 'watercolor_splash',
        apiCode: 'watercolor_splash',
        title: 'Watercolor Splash',
        description: 'Minimalist line art with loose watercolor splashes for color'
      },
      {
        id: 'gouache_painting',
        apiCode: 'gouache_painting',
        title: 'Gouache Painting',
        description: 'Gouache-style with matte colors and thick brush strokes'
      },
      {
        id: 'oil_pastel',
        apiCode: 'oil_pastel',
        title: 'Oil Pastel',
        description: 'Rich, creamy textures and bold, joyful colors'
      }
    ]
  },
  {
    category: 'Ink & Drawing',
    description: 'Hand-drawn styles with line work and traditional drawing techniques.',
    styleIds: [
      {
        id: 'ink_wash',
        apiCode: 'ink_wash',
        title: 'Ink Wash',
        description: 'Fine ink line and watercolor wash with clean, classic lines'
      },
      {
        id: 'pencil_sketch',
        apiCode: 'pencil_sketch',
        title: 'Pencil Sketch',
        description: 'Lightly colored pencil sketch with soft pastels and delicate textures'
      },
      {
        id: 'colored_pencil',
        apiCode: 'colored_pencil',
        title: 'Colored Pencil',
        description: 'Colored pencil textures with bright marker accents'
      },
      {
        id: 'chalk_drawing',
        apiCode: 'chalk_drawing',
        title: 'Chalk Drawing',
        description: 'Colorful chalk drawing with bright lines on a dark background'
      }
    ]
  },
  {
    category: 'Cartoon & Vector',
    description: 'Bold, graphic styles with clean lines and vibrant colors.',
    styleIds: [
      {
        id: 'cartoon_character',
        apiCode: 'cartoon_character',
        title: 'Cartoon Character',
        description: 'Bold outlines, colorful details, and expressive features'
      },
      {
        id: 'flat_vector',
        apiCode: 'flat_vector',
        title: 'Flat Vector',
        description: 'Clean lines, soft shading, and bright minimalistic colors'
      },
      {
        id: 'pixel_art',
        apiCode: 'pixel_art',
        title: 'Pixel Art',
        description: 'Soft pixel art with rounded pixels and gentle gradients'
      }
    ]
  },
  {
    category: '3D & Textured',
    description: 'Styles with dimensional qualities and tactile textures.',
    styleIds: [
      {
        id: 'clay_animation',
        apiCode: 'clay_animation',
        title: 'Clay Animation',
        description: '3D claymation-style with soft clay textures and rounded features'
      },
      {
        id: 'plush_toy',
        apiCode: 'plush_toy',
        title: 'Plush Toy',
        description: 'Soft textures, simplified features, and a cuddly look'
      },
      {
        id: 'felt_craft',
        apiCode: 'felt_craft',
        title: 'Felt Craft',
        description: 'Textured illustration mimicking felt crafts with visible texture'
      },
      {
        id: 'paper_cutout',
        apiCode: 'paper_cutout',
        title: 'Paper Cutout',
        description: 'Cut-paper collage style with bright textured paper layers'
      },
      {
        id: 'paper_diorama',
        apiCode: 'paper_diorama',
        title: 'Paper Diorama',
        description: '3D paper diorama theater scene with layered paper depth'
      }
    ]
  },
  {
    category: 'Fantasy & Magical',
    description: 'Enchanting styles with magical elements and dreamy qualities.',
    styleIds: [
      {
        id: 'fantasy_storybook',
        apiCode: 'fantasy_storybook',
        title: 'Fantasy Storybook',
        description: 'Richly detailed fantasy with magical elements and lush textures'
      },
      {
        id: 'dreamy_glow',
        apiCode: 'dreamy_glow',
        title: 'Dreamy Glow',
        description: 'Pastel dreamscape with light colors and glowing soft highlights'
      },
      {
        id: 'magical_light',
        apiCode: 'magical_light',
        title: 'Magical Light',
        description: 'Magical luminous quality with soft glowing highlights'
      },
      {
        id: 'stained_glass',
        apiCode: 'stained_glass',
        title: 'Stained Glass',
        description: 'Stained-glass inspired with bright vibrant color panels'
      }
    ]
  },
  {
    category: 'Cultural & Historical',
    description: 'Styles inspired by cultural traditions and historical art movements.',
    styleIds: [
      {
        id: 'folk_art',
        apiCode: 'folk_art',
        title: 'Folk Art',
        description: 'Folk-art inspired with bold shapes and traditional motifs'
      },
      {
        id: 'vintage_midcentury',
        apiCode: 'vintage_midcentury',
        title: 'Vintage Midcentury',
        description: 'Mid-century European style with muted palette and geometric shapes'
      },
      {
        id: 'retro_70s',
        apiCode: 'retro_70s',
        title: 'Retro 70s',
        description: '1970s retro-style with warm oranges, browns, and golds'
      },
      {
        id: 'asian_brushwork',
        apiCode: 'asian_brushwork',
        title: 'Asian Brushwork',
        description: 'East Asian brush painting style with ink textures and light accents'
      },
      {
        id: 'nordic_cozy',
        apiCode: 'nordic_cozy',
        title: 'Nordic Cozy',
        description: 'Nordic storybook with cool tones and a cozy winter setting'
      }
    ]
  },
  {
    category: 'Lighting & Mood',
    description: 'Styles defined by distinctive lighting effects and atmospheric moods.',
    styleIds: [
      {
        id: 'golden_hour',
        apiCode: 'golden_hour',
        title: 'Golden Hour',
        description: 'Warm, golden-lit scene with rich amber tones and soft shadows'
      },
      {
        id: 'night_glow',
        apiCode: 'night_glow',
        title: 'Night Glow',
        description: 'Glow-in-the-dark style with dark background and soft illumination'
      },
      {
        id: 'vibrant_scene',
        apiCode: 'vibrant_scene',
        title: 'Vibrant Scene',
        description: 'Rich, vibrant colors with detailed scenes and dramatic lighting'
      }
    ]
  },
  {
    category: 'Digital & Modern',
    description: 'Contemporary digital art styles with modern techniques.',
    styleIds: [
      {
        id: 'digital_airbrush',
        apiCode: 'digital_airbrush',
        title: 'Digital Airbrush',
        description: 'Smooth airbrushed digital painting with bright colors and soft gradients'
      },
      {
        id: 'mixed_media',
        apiCode: 'mixed_media',
        title: 'Mixed Media',
        description: 'Blending watercolor painting and cut-paper collage for layered textures'
      },
      {
        id: 'default',
        apiCode: 'default',
        title: 'Default Style',
        description: 'Colorful, child-friendly style with clear outlines and appealing characters'
      }
    ]
  }
];

// Component to display art styles with thumbnails

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
                    {/* Always render the image with error handling for missing thumbnails */}
                    <img
                      src={stylePreviewUrls[style.apiCode] || `/assets/style-thumbnails-png/default.png`}
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