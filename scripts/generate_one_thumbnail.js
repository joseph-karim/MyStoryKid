// Simple script to generate one art style thumbnail using the OpenAI API
const fs = require('fs');
const path = require('path');
const https = require('https');

// OpenAI API key - replace with your actual key when running
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

// Directory to save the generated thumbnail
const OUTPUT_DIR = path.join(__dirname, '../public/assets/style-thumbnails');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Art style to generate
const style = {
  id: 'watercolor_storybook',
  prompt: 'Create a soft watercolor children\'s book illustration of a teddy bear. Gentle pastel colors, light brushstrokes, warm atmosphere, simple natural background.'
};

// Generate an image using OpenAI API
function generateImage() {
  console.log(`Generating image for style: ${style.id}`);

  const data = JSON.stringify({
    model: "gpt-image-1",
    prompt: style.prompt,
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
      console.log(`Response status code: ${res.statusCode}`);

      if (res.statusCode === 200) {
        try {
          const parsedData = JSON.parse(responseData);
          if (parsedData.data && parsedData.data.length > 0) {
            const imageData = parsedData.data[0].b64_json;
            const buffer = Buffer.from(imageData, 'base64');

            const filePath = path.join(OUTPUT_DIR, `${style.id}.png`);
            fs.writeFileSync(filePath, buffer);

            console.log(`Successfully saved image for style: ${style.id} to ${filePath}`);
          } else {
            console.error(`No image data in response for style: ${style.id}`);
            console.error('Response:', responseData);
          }
        } catch (error) {
          console.error(`Error parsing response for style ${style.id}:`, error);
          console.error('Response:', responseData);
        }
      } else {
        console.error(`Error response for style ${style.id}: ${res.statusCode} ${res.statusMessage}`);
        console.error('Response:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error(`Error generating image for style ${style.id}:`, error);
  });

  req.write(data);
  req.end();
}

// Start the generation process
console.log('Starting thumbnail generation...');
generateImage();
