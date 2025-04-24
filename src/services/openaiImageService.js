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
 * @param {Object} characterData - Character data object with properties like name, age, gender, type, etc.
 * @param {string} styleDescription - Description of the art style
 * @param {string} photoReference - Optional base64 photo reference to use as inspiration
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const generateCharacterImage = async (characterData, styleDescription, photoReference = null) => {
  // Extract character details
  const { name, age, gender, type, traits = [], interests = [] } = characterData;

  // Build a detailed character description
  let characterDescription = `${name}, a ${age || ''} year old ${gender || 'child'}`;

  // Add character type
  if (type === 'child') {
    characterDescription += `, the main character`;
  } else if (type === 'sibling') {
    characterDescription += `, a sibling`;
  } else if (type === 'friend') {
    characterDescription += `, a friend`;
  } else if (type === 'magical') {
    characterDescription += `, a magical character`;
  } else if (type === 'animal') {
    characterDescription += `, an animal companion`;
  }

  // Add traits and interests if available
  if (traits.length > 0) {
    characterDescription += `. Personality traits: ${traits.join(', ')}`;
  }

  if (interests.length > 0) {
    characterDescription += `. Interests: ${interests.join(', ')}`;
  }

  // Enhanced style guidance for consistency
  const enhancedStyleGuidance = `
    Create the character with these specific style characteristics:
    - Use warm, rich colors with soft lighting and gentle shadows
    - Character should have appealing, expressive features with a clear, friendly expression
    - Use a hand-drawn, slightly textured illustration style similar to Pixar or high-quality children's books
    - The character design should be consistent with the style that will be used throughout the book
    - Create a portrait with a simple, non-distracting background that highlights the character
    ${styleDescription || 'Use a child-friendly, colorful illustration style.'}
  `;

  // Create a detailed prompt
  let prompt;
  if (photoReference) {
    // If we have a photo reference, mention it in the prompt
    prompt = `Create a portrait of ${characterDescription}. The character should be looking directly at the viewer with a friendly expression. Create a high-quality, detailed illustration suitable for a children's book. ${enhancedStyleGuidance}`;

    // Note: OpenAI's gpt-image-1 doesn't directly support image inputs yet, so we're using text description
    // In the future, when OpenAI supports image inputs, we could use the photoReference
  } else {
    prompt = `Create a portrait of ${characterDescription}. The character should be looking directly at the viewer with a friendly expression. Create a high-quality, detailed illustration suitable for a children's book. ${enhancedStyleGuidance}`;
  }

  console.log('Generating character image with enhanced style guidance');

  return generateImage(prompt, {
    size: "1024x1024", // Square format for character portraits
    quality: "high"
  });
};

/**
 * Generate a scene image using OpenAI
 * @param {string} sceneDescription - Description of the scene
 * @param {string|Array} characterDescriptions - Description of the character(s) to include
 * @param {string} styleDescription - Description of the art style
 * @param {string} referenceImageUrl - Optional URL of a previously generated image to use as style reference
 * @param {number} pageNumber - The page number being generated
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const generateSceneImage = async (sceneDescription, characterDescriptions, styleDescription, referenceImageUrl = null, pageNumber = 1) => {
  // Handle multiple characters
  let characterPrompt;
  if (Array.isArray(characterDescriptions)) {
    if (characterDescriptions.length === 1) {
      characterPrompt = characterDescriptions[0];
    } else if (characterDescriptions.length === 2) {
      characterPrompt = `${characterDescriptions[0]} and ${characterDescriptions[1]}`;
    } else {
      const lastChar = characterDescriptions.pop();
      characterPrompt = `${characterDescriptions.join(', ')}, and ${lastChar}`;
    }
  } else {
    characterPrompt = characterDescriptions;
  }

  // Enhanced style guidance for consistency
  const enhancedStyleGuidance = `
    Maintain a consistent animation style throughout the book with these characteristics:
    - Use warm, rich colors with soft lighting and gentle shadows
    - Characters should have consistent proportions and features across all pages
    - Use a hand-drawn, slightly textured illustration style similar to Pixar or high-quality children's books
    - Maintain consistent lighting direction and color palette across all illustrations
    - Create depth with subtle background details that don't distract from the main characters
    - This is page ${pageNumber} of the story, so maintain visual continuity with previous pages
    ${styleDescription || 'Use a child-friendly, colorful illustration style.'}
  `;

  // Reference previous images if available
  const referenceNote = referenceImageUrl ?
    "Maintain exact visual consistency with the character designs, art style, and color palette from the previous illustrations." :
    "";

  const prompt = `Create a scene showing ${characterPrompt} in ${sceneDescription}. ${enhancedStyleGuidance} ${referenceNote}`;

  console.log(`Generating image for page ${pageNumber} with enhanced style guidance`);

  return generateImage(prompt, {
    size: "1536x1024", // Landscape format for scenes
    quality: "high"
  });
};

/**
 * Generate a book cover image using OpenAI
 * @param {string} title - The book title
 * @param {string|Array} characterDescriptions - Description of the character(s) to include
 * @param {string} styleDescription - Description of the art style
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const generateCoverImage = async (title, characterDescriptions, styleDescription) => {
  // Handle multiple characters
  let characterPrompt;
  if (Array.isArray(characterDescriptions)) {
    if (characterDescriptions.length === 1) {
      characterPrompt = characterDescriptions[0];
    } else if (characterDescriptions.length === 2) {
      characterPrompt = `${characterDescriptions[0]} and ${characterDescriptions[1]}`;
    } else {
      const lastChar = characterDescriptions.pop();
      characterPrompt = `${characterDescriptions.join(', ')}, and ${lastChar}`;
    }
  } else {
    characterPrompt = characterDescriptions;
  }

  // Enhanced style guidance for consistency
  const enhancedStyleGuidance = `
    Create the cover with these specific style characteristics:
    - Use warm, rich colors with soft lighting and gentle shadows
    - Characters should have appealing, expressive features with clear emotions
    - Use a hand-drawn, slightly textured illustration style similar to Pixar or high-quality children's books
    - Create depth with subtle background details that don't distract from the main characters
    - The cover should establish the visual style that will be consistent throughout all book illustrations
    ${styleDescription || 'Use a child-friendly, colorful illustration style.'}
  `;

  const prompt = `Create a children's book cover for "${title}" featuring ${characterPrompt}. The cover should be vibrant, engaging, and appropriate for young children. ${enhancedStyleGuidance}`;

  console.log('Generating cover image with enhanced style guidance');

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
