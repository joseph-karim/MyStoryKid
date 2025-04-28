// Script to generate art style thumbnails using OpenAI API
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// OpenAI API key from environment variables
const OPENAI_API_KEY = process.env.VITE_OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

// Directory to save the generated thumbnails
const OUTPUT_DIR = path.join(__dirname, '../public/assets/style-thumbnails');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Art styles with their descriptions and prompts
const artStyles = [
  // Traditional/Classic Styles
  {
    id: 'watercolor_storybook',
    name: 'Watercolor Storybook',
    prompt: 'Create a soft watercolor children\'s book illustration of a teddy bear. Gentle pastel colors, light brushstrokes, warm atmosphere, simple natural background.'
  },
  {
    id: 'ink_watercolor_wash',
    name: 'Ink and Watercolor Wash',
    prompt: 'Create a fine ink line and watercolor wash illustration of a teddy bear. Clean, classic lines with bright washes of color, lively children\'s book feel.'
  },
  {
    id: 'pencil_sketch_soft_color',
    name: 'Pencil Sketch with Soft Color',
    prompt: 'Create a lightly colored pencil sketch illustration of a teddy bear. Soft pastels and delicate textures, storybook aesthetic.'
  },
  {
    id: 'oil_pastel',
    name: 'Oil Pastel Illustration',
    prompt: 'Create an oil pastel style children\'s illustration of a teddy bear. Rich, creamy textures and bold, joyful colors.'
  },
  {
    id: 'gouache_painting',
    name: 'Gouache Painting Style',
    prompt: 'Create a gouache-style children\'s book illustration of a teddy bear. Matte colors, thick brush strokes, vibrant and playful.'
  },
  
  // Bold, Playful, and Cartoon Styles
  {
    id: 'cartoon_semi_realistic',
    name: 'Cartoon Character (Semi-Realistic)',
    prompt: 'Create a cartoon-style teddy bear character. Bold outlines, colorful, expressive, children\'s book energy.'
  },
  {
    id: 'flat_vector_soft_gradient',
    name: 'Flat Vector Art (Soft Gradient)',
    prompt: 'Create a flat vector-style illustration of a teddy bear. Clean lines, soft shading, bright minimalistic colors.'
  },
  {
    id: 'cut_paper_collage',
    name: 'Cut-Paper Collage (Eric Carle Inspired)',
    prompt: 'Create a cut-paper collage style illustration of a teddy bear. Bright textured paper layers, playful and vivid, inspired by Eric Carle.'
  },
  {
    id: 'crayon_watercolor',
    name: 'Crayon Drawing with Watercolor Wash',
    prompt: 'Create a crayon-drawn teddy bear with watercolor textures. Childlike, joyful, and colorful.'
  },
  {
    id: 'claymation',
    name: '3D Claymation Illustration Style',
    prompt: 'Create a 3D claymation-style children\'s book teddy bear character. Soft clay textures, rounded features, bright colors.'
  },
  
  // Whimsical, Dreamy, and Fantasy Styles
  {
    id: 'pastel_dreamscape',
    name: 'Pastel Dreamscape',
    prompt: 'Create a pastel dreamscape style teddy bear. Light colors, glowing soft highlights, magical dreamy mood.'
  },
  {
    id: 'storybook_fantasy',
    name: 'Storybook Fantasy Style (Detailed)',
    prompt: 'Create a richly detailed fantasy storybook teddy bear. Magical elements, lush textures, and glowing ambiance.'
  },
  {
    id: 'soft_plush_toy',
    name: 'Soft Plush Toy Style',
    prompt: 'Create a plush toy-style illustration of a teddy bear. Soft textures, slightly simplified features, extremely cuddly look.'
  },
  {
    id: 'glow_in_dark',
    name: 'Glow-In-The-Dark Illustration Style',
    prompt: 'Create a children\'s book illustration of a teddy bear using glow-in-the-dark style: dark background, character softly illuminated, magical feel.'
  },
  {
    id: 'stained_glass',
    name: 'Stained Glass Storybook Style',
    prompt: 'Create a stained-glass inspired children\'s book teddy bear. Bright vibrant color panels, storybook setting.'
  },
  
  // Cultural, Folk, and Retro-Inspired Styles
  {
    id: 'folk_art',
    name: 'Folk Art Style (Flat, Traditional Motifs)',
    prompt: 'Create a folk-art inspired children\'s book teddy bear. Bold shapes, traditional motifs, rich flat colors.'
  },
  {
    id: 'vintage_european',
    name: 'Vintage European Storybook (1950s)',
    prompt: 'Create a mid-century European children\'s book illustration of a teddy bear. Muted palette, geometric shapes, nostalgic feel.'
  },
  {
    id: 'retro_70s',
    name: 'Retro 1970s Children\'s Book Style',
    prompt: 'Create a 1970s retro-style teddy bear. Warm oranges, browns, and golds, stylized and cheerful.'
  },
  {
    id: 'modern_sumi_e',
    name: 'Traditional Japanese Sumi-e with a Modern Twist',
    prompt: 'Create a children\'s teddy bear illustration using a modern sumi-e style: ink brush textures, light color accents, serene mood.'
  },
  {
    id: 'nordic_storybook',
    name: 'Nordic Storybook Style (Winter Cozy)',
    prompt: 'Create a Nordic storybook teddy bear. Cool tones, woolly clothes, snow and cozy winter forest setting.'
  },
  
  // Mixed Media, Creative, and Experimental Styles
  {
    id: 'chalkboard',
    name: 'Chalkboard Drawing Style',
    prompt: 'Create a colorful chalk drawing of a teddy bear. Bright simple lines on a dark background, playful and whimsical.'
  },
  {
    id: 'watercolor_collage',
    name: 'Watercolor + Collage Hybrid',
    prompt: 'Create a children\'s illustration of a teddy bear, blending watercolor painting and cut-paper collage for layered textures.'
  },
  {
    id: 'soft_pixel_art',
    name: 'Soft Pixel Art Style (Retro Game Inspired)',
    prompt: 'Create a soft pixel art version of a teddy bear. Rounded pixels, bright colors, gentle gradients for a children\'s book look.'
  },
  {
    id: 'digital_airbrush',
    name: 'Digital Airbrush Painting',
    prompt: 'Create a smooth airbrushed digital painting of a teddy bear. Bright colors, soft gradients, friendly and vibrant style.'
  },
  {
    id: 'colored_pencil_marker',
    name: 'Colored Pencil and Marker Combo Style',
    prompt: 'Create a children\'s book illustration of a teddy bear with colored pencil textures and bright marker accents. Playful and vivid.'
  },
  {
    id: 'paper_theater',
    name: 'Paper Theater Diorama Style',
    prompt: 'Create a children\'s book teddy bear styled like a 3D paper diorama theater scene. Layered paper depth and lighting.'
  },
  {
    id: 'minimalist_watercolor',
    name: 'Minimalist Line Art + Watercolor Splash',
    prompt: 'Create a minimalist line art illustration of a teddy bear with loose watercolor splashes for color. Clean, elegant, gentle style for children.'
  }
];

/**
 * Generate an image using OpenAI API
 * @param {string} prompt - The prompt for image generation
 * @param {string} styleId - The style ID for the filename
 * @returns {Promise<void>}
 */
async function generateImage(prompt, styleId) {
  try {
    console.log(`Generating image for style: ${styleId}`);
    
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: "gpt-image-1",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "high",
        output_format: "png"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );
    
    if (response.data && response.data.data && response.data.data.length > 0) {
      const imageData = response.data.data[0].b64_json;
      const buffer = Buffer.from(imageData, 'base64');
      
      const filePath = path.join(OUTPUT_DIR, `${styleId}.png`);
      fs.writeFileSync(filePath, buffer);
      
      console.log(`Successfully saved image for style: ${styleId}`);
      return filePath;
    } else {
      console.error(`No image data in response for style: ${styleId}`);
    }
  } catch (error) {
    console.error(`Error generating image for style ${styleId}:`, error.response?.data || error.message);
  }
}

/**
 * Generate thumbnails for all art styles
 */
async function generateAllThumbnails() {
  console.log(`Starting generation of ${artStyles.length} art style thumbnails...`);
  
  // Process styles sequentially to avoid rate limiting
  for (const style of artStyles) {
    try {
      await generateImage(style.prompt, style.id);
      // Add a delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to generate thumbnail for ${style.id}:`, error);
    }
  }
  
  console.log('Thumbnail generation complete!');
}

// Start the generation process
generateAllThumbnails();
