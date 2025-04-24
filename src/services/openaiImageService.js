import axios from 'axios';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/images/generations';

/**
 * Generate an image using OpenAI's gpt-image-1 model
 * @param {string} prompt - The text prompt for image generation
 * @param {Object} options - Additional options for image generation
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const generateImage = async (prompt, options = {}) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  try {
    console.log(`Generating image with OpenAI for prompt: "${prompt.substring(0, 100)}..."`);
    
    const defaultOptions = {
      model: "gpt-image-1",
      n: 1,
      size: "1024x1024",
      output_format: "png",
      quality: "high",
      background: "auto"
    };

    const requestData = {
      ...defaultOptions,
      ...options,
      prompt
    };

    const response = await axios.post(OPENAI_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      timeout: 60000 // 60 second timeout
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      // OpenAI returns base64 encoded image data directly for gpt-image-1
      const imageData = response.data.data[0].b64_json;
      console.log('Successfully generated image with OpenAI');
      
      // Return as data URL
      return `data:image/png;base64,${imageData}`;
    } else {
      throw new Error('No image data in response');
    }
  } catch (error) {
    console.error('Error generating image with OpenAI:', error);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('OpenAI API error response:', error.response.data);
      throw new Error(`OpenAI API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      // The request was made but no response was received
      throw new Error('No response received from OpenAI API');
    } else {
      // Something happened in setting up the request that triggered an Error
      throw error;
    }
  }
};

/**
 * Generate a character image using OpenAI
 * @param {string} characterDescription - Description of the character
 * @param {string} styleDescription - Description of the art style
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const generateCharacterImage = async (characterDescription, styleDescription) => {
  const prompt = `Create a portrait of ${characterDescription}. ${styleDescription || 'Use a child-friendly, colorful illustration style.'}`;
  
  return generateImage(prompt, {
    size: "1024x1024",
    quality: "high"
  });
};

/**
 * Generate a scene image using OpenAI
 * @param {string} sceneDescription - Description of the scene
 * @param {string} characterDescription - Description of the character to include
 * @param {string} styleDescription - Description of the art style
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const generateSceneImage = async (sceneDescription, characterDescription, styleDescription) => {
  const prompt = `Create a scene showing ${characterDescription} in ${sceneDescription}. ${styleDescription || 'Use a child-friendly, colorful illustration style.'}`;
  
  return generateImage(prompt, {
    size: "1536x1024", // Landscape format for scenes
    quality: "high"
  });
};

/**
 * Generate a book cover image using OpenAI
 * @param {string} title - The book title
 * @param {string} characterDescription - Description of the main character
 * @param {string} styleDescription - Description of the art style
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const generateCoverImage = async (title, characterDescription, styleDescription) => {
  const prompt = `Create a children's book cover for "${title}" featuring ${characterDescription}. The cover should be vibrant, engaging, and appropriate for young children. ${styleDescription || 'Use a child-friendly, colorful illustration style.'}`;
  
  return generateImage(prompt, {
    size: "1024x1536", // Portrait format for book covers
    quality: "high"
  });
};

/**
 * Edit an existing image using OpenAI's image edit API
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} prompt - The text prompt for image editing
 * @param {Object} options - Additional options for image editing
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const editImage = async (imageBase64, prompt, options = {}) => {
  // Implementation for image editing would go here
  // This would use the /v1/images/edits endpoint
  throw new Error('Image editing not yet implemented');
};
