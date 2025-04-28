#!/usr/bin/env node

// Simple script to generate art style thumbnails using the OpenAI API
const fs = require('fs');
const path = require('path');
const https = require('https');

// OpenAI API key - replace with your key if not using environment variable
const OPENAI_API_KEY = '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';

// Directory to save the generated thumbnails
const OUTPUT_DIR = path.join(__dirname, '../public/assets/style-thumbnails');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Art styles to generate
const artStyles = [
  {
    id: 'watercolor_storybook',
    prompt: 'Create a soft watercolor children\'s book illustration of a teddy bear. Gentle pastel colors, light brushstrokes, warm atmosphere, simple natural background.'
  },
  {
    id: 'cartoon_semi_realistic',
    prompt: 'Create a cartoon-style teddy bear character. Bold outlines, colorful, expressive, children\'s book energy.'
  },
  {
    id: 'storybook_fantasy',
    prompt: 'Create a richly detailed fantasy storybook teddy bear. Magical elements, lush textures, and glowing ambiance.'
  }
];

/**
 * Generate an image using OpenAI API
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
      response_format: "b64_json"
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
              
              console.log(`Successfully saved image for style: ${styleId} to ${filePath}`);
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
 * Generate thumbnails for all art styles
 */
async function generateThumbnails() {
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
  console.log(`Thumbnails saved to: ${OUTPUT_DIR}`);
}

// Start the generation process
generateThumbnails();
