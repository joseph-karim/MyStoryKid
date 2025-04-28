// Script to generate a few sample art style thumbnails using OpenAI API
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

// Sample art styles to generate (just a few to test)
const sampleStyles = [
  {
    id: 'watercolor_storybook',
    name: 'Watercolor Storybook',
    prompt: 'Create a soft watercolor children\'s book illustration of a teddy bear. Gentle pastel colors, light brushstrokes, warm atmosphere, simple natural background.'
  },
  {
    id: 'cartoon_semi_realistic',
    name: 'Cartoon Character (Semi-Realistic)',
    prompt: 'Create a cartoon-style teddy bear character. Bold outlines, colorful, expressive, children\'s book energy.'
  },
  {
    id: 'storybook_fantasy',
    name: 'Storybook Fantasy Style (Detailed)',
    prompt: 'Create a richly detailed fantasy storybook teddy bear. Magical elements, lush textures, and glowing ambiance.'
  },
  {
    id: 'retro_70s',
    name: 'Retro 1970s Children\'s Book Style',
    prompt: 'Create a 1970s retro-style teddy bear. Warm oranges, browns, and golds, stylized and cheerful.'
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
 * Generate thumbnails for sample art styles
 */
async function generateSampleThumbnails() {
  console.log(`Starting generation of ${sampleStyles.length} sample art style thumbnails...`);
  
  // Process styles sequentially to avoid rate limiting
  for (const style of sampleStyles) {
    try {
      await generateImage(style.prompt, style.id);
      // Add a delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Failed to generate thumbnail for ${style.id}:`, error);
    }
  }
  
  console.log('Sample thumbnail generation complete!');
}

// Start the generation process
generateSampleThumbnails();
