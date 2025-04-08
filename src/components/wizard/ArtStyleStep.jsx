import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { getKeywordsForDzineStyle } from '../../services/dzineService';
import { motion } from 'framer-motion';

// We won't load individual images here, instead we'll use generic placeholders
// and let the actual API preview images load when we call the API

// Direct mapping of style names to API codes from the Dzine API
const STYLE_CODE_MAP = {
  // Whimsical & Fun
  'Storytime Whimsy': 'Style-05c3d679-f8e9-4883-b9c9-adfe0988d1a5',
  'Fantasy Hero': 'Style-caa14e89-823b-4f8e-8d84-7368f9cec7cf',
  'Soft Radiance': 'Style-7c3af5f6-4945-4eb2-b00b-34f77b0b8d41',
  'Paper Cutout': 'Style-541a2afd-904a-4968-bc60-8ad0ede22a86',
  'Joyful Clay': 'Style-7729f1f6-578b-4035-8514-edaa0637dd6d',
  'Playful Enamel': 'Style-0cd971cb-1e19-4909-a389-9b0c4fc79fd8',
  'Everything Kawaii': 'Style-455da805-d716-4bc8-a960-4ac505aa7875',
  
  // Illustrated & Artistic 
  'Ceramic Lifelike': 'Style-3f616e35-6423-4c53-aa27-be28860a4a7d',
  'Colorful Felt': 'Style-48f44663-b5cc-4f8d-ace8-d0a12bf0f4df',
  'Sketch Elegance': 'Style-e9021405-1b37-4773-abb9-bd80485527b0',
  'Skyborne Realm': 'Style-5ad47638-c430-4cda-8bae-681c7af4e59e',
  'Aquarelle Life': 'Style-ada3a8d4-0e66-4bb0-aab3-e04a0ade4333',
  'Vivid Tableaux': 'Style-589373f8-1283-4570-baf9-61d02eb13391',
  'Line & Wash': 'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9',
  
  // Stylized & Modern
  'Dreamy 3D': 'Style-ae3dc56b-33b6-4f29-bd76-7f6aa1a87e8d',
  'Cutie 3D': 'Style-f45b720c-656d-4ef0-bd86-f9f5afa63f0f',
  'Shimmering Glow': 'Style-16dd4ac7-63e1-40ae-bb87-472e820c93f8',
  'Surreal Iridescence': 'Style-43226b0-4b66-412c-a240-0a214019b895',
  'Golden Hour': 'Style-90a8d36d-9a67-4619-a995-4036fda8474d',
  'Vibrant Impasto': 'Style-b7c0d088-e046-4e9b-a0fb-a329d2b9a36a',
  'Sketchbook Sticker': 'Style-4a3b38cd-a49d-4b69-81e8-69134ca9cdc0',
  
  // Portraits & Characters
  'Inked Realism': 'Style-11ead7fd-0a37-4f3d-a1a2-66558f036f74',
  'Magic Portrait': 'Style-8d281dba-698e-41d0-98d1-6227e4f3c6c4',
  'Warm Portrait': 'Style-4ab783c7-2955-4092-878e-965162241bf7',
  'Retro Noir Chromatics': 'Style-e54a8400-fb2c-47a5-9418-8895c01382ce',
  
  // Special Styles
  'Vintage Engraving': 'Style-a8311e8a-ba8b-4cdf-84f9-4001f82cee83',
  'Ancient China': 'Style-666d19e1-2e33-4e64-95e8-588c8e20b02c',
  'Graffiti Splash': 'Style-f9ba459d-addd-4e80-9a2e-67439fb50446',
  'Pleasantly Warm': 'Style-f8ee0e8d-62ea-48b6-8323-15c5a6c62e2c',
  '8-Bit Arcade': 'Style-f22b0501-07a8-4f93-ac65-182c1cd5b4ca',
  'Impressionist': 'Style-01b37b76-4f5b-421d-a6cc-759e8d7aba3f',
  'Zen Spirit': 'Style-24b334a4-52eb-4f77-94fa-f37d7367d956',
  'Vibrant Whimsy': 'Style-89c94c8f-9c94-4ef2-8fbd-e058648c92c7',
  'Whimsical Brushwork': 'Style-e2f14b9b-819d-4389-980f-71b83f55271d',
  'Bedtime Story': 'Style-8ee4b050-ef89-4058-8521-66223259bb30',
  'Nouveau Classic': 'Style-7b57d4ef-98ea-4101-b048-db2b4fd28c70',
  'Innocent Cutie': 'Style-c7e442ba-261c-450a-899b-5ae85c918b4b',
  'Glossy Elegance': 'Style-04d8cbcf-6496-4d68-997e-516303502507',
  'Memphis Illustration': 'Style-30dd5a41-c881-4281-a093-ab79f71e6479',
  'Minimalist Cutesy': 'Style-2bdfdfec-0ddb-4bca-aa2a-cca1abbc48f7',
  'Watercolor Whimsy': 'Style-7f3f81ad-1c2d-4a15-944d-66bf549641de',
  'Dreamy Spectrum': 'Style-e72b9767-6244-4d6f-b295-7a015de0e031',
  'Enhanced Elegance': 'Style-e9a4495e-2f15-4ab7-909d-473af6fb6c9c',
  'Cheerful Storybook': 'Style-a941aee9-7964-4445-b76a-7c3ff912f926',
  'Starlit Fantasy': 'Style-9cde0ca9-78f0-4be5-a6a1-44dd74cfbaa0',
  'Delicate Aquarelle': 'Style-31bbb0d0-20e2-460b-9280-6835200a4b73',
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
        apiCode: STYLE_CODE_MAP['Skyborne Realm'],
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

function ArtStyleStep() {
  const {
    wizardState,
    updateStoryData,
    setWizardStep,
  } = useBookStore();
  
  const [selectedStyle, setSelectedStyle] = useState(wizardState.storyData.artStyleCode || '');
  const [stylePreviewUrls, setStylePreviewUrls] = useState({});
  
  // Load preview URLs for each style
  useEffect(() => {
    // In a real implementation, we would fetch preview URLs from the API
    // But for now, we'll use placeholder images
    const loadPreviews = async () => {
      // This would be an API call in a real implementation
      const placeholderUrl = 'https://via.placeholder.com/300x200?text=';
      const previews = {};
      
      ART_STYLE_CATEGORIES_STRUCTURE.forEach(category => {
        category.styleIds.forEach(style => {
          previews[style.apiCode] = `${placeholderUrl}${encodeURIComponent(style.title)}`;
        });
      });
      
      setStylePreviewUrls(previews);
    };
    
    loadPreviews();
  }, []);
  
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
                  <div 
                    className="w-full h-32 bg-gray-100 flex items-center justify-center"
                    style={{
                      backgroundColor: `hsl(${Math.floor(Math.random() * 360)}, 80%, 90%)`,
                      backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)`,
                    }}
                  >
                    <span className="text-gray-600 font-medium">{style.title}</span>
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