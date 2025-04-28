#!/usr/bin/env node

/**
 * Simple script to generate art style thumbnails using the OpenAI API with Node.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// OpenAI API key
const API_KEY = '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';

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../public/assets/style-thumbnails');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}
console.log(`Output directory: ${OUTPUT_DIR}`);

// Art styles to generate
const artStyles = [
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
  }
];

/**
 * Generate an image for a style using the OpenAI API
 * @param {string} styleId - The style ID
 * @param {string} prompt - The prompt for image generation
 * @returns {Promise<boolean>} - Whether the generation was successful
 */
function generateImage(styleId, prompt) {
  return new Promise((resolve, reject) => {
    const outputFile = path.join(OUTPUT_DIR, `${styleId}.png`);
    
    console.log(`Generating image for style: ${styleId}`);
    console.log(`Prompt: ${prompt}`);
    
    const data = JSON.stringify({
      model: 'gpt-image-1',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'high',
      response_format: 'b64_json'
    });
    
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
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
              
              fs.writeFileSync(outputFile, buffer);
              
              console.log(`✅ Successfully generated image for ${styleId}`);
              console.log(`   Saved to: ${outputFile}`);
              resolve(true);
            } else {
              console.error(`❌ No image data in response for style: ${styleId}`);
              console.error(`   Response: ${responseData}`);
              resolve(false);
            }
          } catch (error) {
            console.error(`❌ Error parsing response for style ${styleId}:`, error);
            console.error(`   Response: ${responseData}`);
            resolve(false);
          }
        } else {
          console.error(`❌ Error response for style ${styleId}: ${res.statusCode}`);
          console.error(`   Response: ${responseData}`);
          resolve(false);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Error generating image for style ${styleId}:`, error);
      resolve(false);
    });
    
    req.write(data);
    req.end();
  });
}

/**
 * Main function to generate all thumbnails
 */
async function main() {
  console.log(`Starting generation of ${artStyles.length} art style thumbnails...`);
  
  let successCount = 0;
  
  // Process styles sequentially
  for (const style of artStyles) {
    const success = await generateImage(style.id, style.prompt);
    
    if (success) {
      successCount++;
    }
    
    // Add a delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log(`Generation complete! Successfully generated ${successCount}/${artStyles.length} thumbnails.`);
  console.log(`Check the ${OUTPUT_DIR} directory for the generated images.`);
}

// Start the generation process
main();
