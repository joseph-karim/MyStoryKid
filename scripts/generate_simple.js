// A simple script to generate art style thumbnails using the OpenAI API
const fs = require('fs');
const path = require('path');
const https = require('https');

// OpenAI API key from environment variable
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

// Sample art styles to generate
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
  }
];

/**
 * Generate an image using OpenAI API
 * @param {string} prompt - The prompt for image generation
 * @param {string} styleId - The style ID for the filename
 * @returns {Promise<void>}
 */
function generateImage(prompt, styleId) {
  return new Promise((resolve, reject) => {
    console.log(`Generating image for style: ${styleId}`);
    
    const data = JSON.stringify({
      model: "gpt-image-1",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "high",
      output_format: "png"
    });
    
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsedData = JSON.parse(responseData);
            if (parsedData.data && parsedData.data.length > 0) {
              const imageData = parsedData.data[0].b64_json;
              const buffer = Buffer.from(imageData, 'base64');
              
              const filePath = path.join(OUTPUT_DIR, `${styleId}.png`);
              fs.writeFileSync(filePath, buffer);
              
              console.log(`Successfully saved image for style: ${styleId}`);
              resolve(filePath);
            } else {
              console.error(`No image data in response for style: ${styleId}`);
              reject(new Error('No image data in response'));
            }
          } catch (error) {
            console.error(`Error parsing response for style ${styleId}:`, error);
            reject(error);
          }
        } else {
          console.error(`Error response for style ${styleId}: ${res.statusCode} ${res.statusMessage}`);
          console.error(responseData);
          reject(new Error(`API returned status code ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error generating image for style ${styleId}:`, error);
      reject(error);
    });
    
    req.write(data);
    req.end();
  });
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
