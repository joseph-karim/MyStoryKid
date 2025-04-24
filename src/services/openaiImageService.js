import axios from 'axios';

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_GENERATIONS_URL = 'https://api.openai.com/v1/images/generations';
const OPENAI_EDITS_URL = 'https://api.openai.com/v1/images/edits';

/**
 * Helper function to convert a data URL to a Blob
 * @param {string} dataUrl - The data URL to convert
 * @returns {Promise<Blob>} - A Blob containing the image data
 */
const dataUrlToBlob = async (dataUrl) => {
  // Extract the base64 data from the data URL
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)[1];
  const base64 = parts[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
};

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

    const response = await axios.post(OPENAI_GENERATIONS_URL, requestData, {
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

// NOTE: We're not using the image variation endpoint since it only works with dall-e-2, not gpt-image-1.
// For gpt-image-1, we use generateImageEdit instead for all image-to-image operations.

/**
 * Generate an image edit using OpenAI's API
 * @param {string} imageDataUrl - Base64 data URL of the image to edit
 * @param {string} prompt - The text prompt for image editing
 * @param {string|null} maskDataUrl - Optional base64 data URL of the mask image
 * @param {Object} options - Additional options for image generation
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const generateImageEdit = async (imageDataUrl, prompt, maskDataUrl = null, options = {}) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.');
  }

  try {
    console.log(`Generating image edit with OpenAI for prompt: "${prompt.substring(0, 100)}..."`);

    // Convert data URLs to Blobs
    const imageBlob = await dataUrlToBlob(imageDataUrl);
    let maskBlob = null;
    if (maskDataUrl) {
      maskBlob = await dataUrlToBlob(maskDataUrl);
    }

    // Create FormData
    const formData = new FormData();

    // For gpt-image-1, we can provide multiple images as an array
    if (options.model === 'gpt-image-1') {
      formData.append('image[]', imageBlob, 'image.png');
      // Add reference images if provided in options
      if (options.referenceImages && Array.isArray(options.referenceImages)) {
        for (let i = 0; i < options.referenceImages.length; i++) {
          const refBlob = await dataUrlToBlob(options.referenceImages[i]);
          formData.append('image[]', refBlob, `reference_${i}.png`);
        }
      }
    } else {
      // For dall-e-2, only one image is supported
      formData.append('image', imageBlob, 'image.png');
    }

    formData.append('prompt', prompt);
    if (maskBlob) {
      formData.append('mask', maskBlob, 'mask.png');
    }

    // Add options
    if (options.n) formData.append('n', options.n);
    if (options.size) formData.append('size', options.size);
    if (options.model) formData.append('model', options.model || 'gpt-image-1');
    formData.append('response_format', 'b64_json'); // Always request base64 JSON

    const response = await axios.post(OPENAI_EDITS_URL, formData, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 second timeout
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      // Extract the base64 image data
      const imageData = response.data.data[0].b64_json;
      console.log('Successfully generated image edit with OpenAI');

      // Return as data URL
      return `data:image/png;base64,${imageData}`;
    } else {
      throw new Error('No image data in response');
    }
  } catch (error) {
    console.error('Error generating image edit with OpenAI:', error);

    if (error.response) {
      console.error('OpenAI API error response:', error.response.data);
      throw new Error(`OpenAI API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      throw new Error('No response received from OpenAI API');
    } else {
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
    - Pay special attention to creating a distinctive outfit and appearance that will be maintained throughout the story
    - Design the character with clear, memorable features that can be consistently reproduced in different scenes
    ${styleDescription || 'Use a child-friendly, colorful illustration style.'}
  `;

  // Create a detailed prompt
  const prompt = `Create a portrait of ${characterDescription}. The character should be looking directly at the viewer with a friendly expression. Create a high-quality, detailed illustration suitable for a children's book.

  IMPORTANT: This character will appear throughout a children's book, so create a distinctive, memorable appearance with a specific outfit that can be consistently maintained across multiple illustrations. Pay special attention to clothing details, hairstyle, and color scheme as these will need to remain consistent throughout the story.

  ${enhancedStyleGuidance}`;

  console.log('Generating character image with enhanced style guidance');

  // If we have a photo reference, use image edit capabilities
  if (photoReference && photoReference.startsWith('data:image')) {
    console.log('Using photo reference for character generation with image edit');

    try {
      // Use the image edit API with the photo reference
      return await generateImageEdit(
        photoReference,
        prompt,
        null, // No mask
        {
          model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
          size: "1024x1024", // Square format for character portraits
          quality: "high"
        }
      );
    } catch (error) {
      console.error('Error using image edit for character generation:', error);
      console.log('Falling back to standard image generation');
      // Fall back to standard image generation if image edit fails
      return generateImage(prompt, {
        model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
        size: "1024x1024", // Square format for character portraits
        quality: "high"
      });
    }
  } else {
    // Standard image generation without reference
    return generateImage(prompt, {
      model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
      size: "1024x1024", // Square format for character portraits
      quality: "high"
    });
  }
};

/**
 * Generate a scene image using OpenAI
 * @param {string} sceneDescription - Description of the scene
 * @param {string|Array} characterDescriptions - Description of the character(s) to include
 * @param {string} styleDescription - Description of the art style
 * @param {string} styleReferenceImageUrl - Optional URL of a previously generated image to use as style reference
 * @param {number} pageNumber - The page number being generated
 * @param {Object} characterReferenceInfo - Information about character references and appearances
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const generateSceneImage = async (
  sceneDescription,
  characterDescriptions,
  styleDescription,
  styleReferenceImageUrl = null,
  pageNumber = 1,
  characterReferenceInfo = {}
) => {
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
    - Ensure characters maintain the EXACT SAME outfit, hairstyle, and appearance as in their reference images
    ${styleDescription || 'Use a child-friendly, colorful illustration style.'}
  `;

  // Build character-specific reference guidance
  let characterReferenceGuidance = '\nCharacter consistency is EXTREMELY IMPORTANT. Follow these specific guidelines:';

  // Collect reference images for image-to-image generation
  const referenceImages = [];

  if (Object.keys(characterReferenceInfo).length > 0) {
    // Get characters with reference images
    const charactersWithReferences = Object.entries(characterReferenceInfo)
      .filter(([_, info]) => info.referenceImageUrl && !info.isFirstAppearance)
      .map(([characterId, info]) => characterId);

    // Get characters appearing for the first time
    const newCharacters = Object.entries(characterReferenceInfo)
      .filter(([_, info]) => info.isFirstAppearance)
      .map(([characterId, info]) => characterId);

    // Add reference images to the collection
    charactersWithReferences.forEach(id => {
      const charInfo = characterReferenceInfo[id];
      if (charInfo.referenceImageUrl && charInfo.referenceImageUrl.startsWith('data:image')) {
        referenceImages.push(charInfo.referenceImageUrl);
        console.log(`Added reference image for ${charInfo.name}`);
      }

      // Add appearance details if available
      if (charInfo.outfitDescription || charInfo.hairstyleDescription || charInfo.colorScheme) {
        characterReferenceGuidance += `
          For ${charInfo.name}:
          ${charInfo.outfitDescription ? `- Outfit details: ${charInfo.outfitDescription}` : ''}
          ${charInfo.hairstyleDescription ? `- Hairstyle details: ${charInfo.hairstyleDescription}` : ''}
          ${charInfo.colorScheme ? `- Color scheme: ${charInfo.colorScheme}` : ''}
        `;
      }
    });

    if (charactersWithReferences.length > 0) {
      characterReferenceGuidance += `
        For the following characters, maintain EXACT visual consistency with their previous appearances:
        ${charactersWithReferences.map(id => `- ${characterReferenceInfo[id].name}: Keep the EXACT SAME outfit, hairstyle, facial features, and color scheme as in their previous appearances`).join('\n')}
      `;
    }

    if (newCharacters.length > 0) {
      characterReferenceGuidance += `
        The following characters are appearing for the first time in this scene:
        ${newCharacters.map(id => `- ${characterReferenceInfo[id].name}`).join('\n')}
      `;
    }
  }

  // Add style reference image if available
  if (styleReferenceImageUrl && styleReferenceImageUrl.startsWith('data:image')) {
    referenceImages.push(styleReferenceImageUrl);
    console.log('Added style reference image');
  }

  // Reference previous images if available for style consistency
  const styleReferenceNote = styleReferenceImageUrl ?
    "Maintain EXACT visual consistency with the art style, lighting, color palette, and character appearances from the previous illustrations. This is CRITICAL for maintaining a cohesive story." :
    "";

  const prompt = `Create a scene showing ${characterPrompt} in ${sceneDescription}.
    ${enhancedStyleGuidance}
    ${characterReferenceGuidance}
    ${styleReferenceNote}

    IMPORTANT: This is part of a children's book where visual consistency is essential. Each character must maintain their exact appearance (outfit, hairstyle, colors) throughout the story. Refer to previous illustrations as reference and maintain the same art style throughout.`;

  console.log(`Generating image for page ${pageNumber} with enhanced style and character guidance`);
  console.log(`Number of reference images available: ${referenceImages.length}`);

  // If we have reference images, use image edit capabilities
  if (referenceImages.length > 0) {
    console.log('Using image-to-image generation with reference images');

    try {
      // Use the first reference as the primary image and others as additional references
      const primaryImage = referenceImages[0];
      const additionalReferences = referenceImages.slice(1);

      // Use gpt-image-1 with image edit for best character consistency
      return await generateImageEdit(
        primaryImage,
        prompt,
        null, // No mask
        {
          model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
          referenceImages: additionalReferences,
          size: "1536x1024", // Landscape format for scenes
          quality: "high"
        }
      );
    } catch (error) {
      console.error('Error using image edit for scene generation:', error);
      console.log('Falling back to standard image generation');
      // Fall back to standard image generation if image edit fails
      return generateImage(prompt, {
        model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
        size: "1536x1024", // Landscape format for scenes
        quality: "high"
      });
    }
  } else {
    // Standard image generation without references
    return generateImage(prompt, {
      model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
      size: "1536x1024", // Landscape format for scenes
      quality: "high"
    });
  }
};

/**
 * Generate a book cover image using OpenAI
 * @param {string} title - The book title
 * @param {string|Array} characterDescriptions - Description of the character(s) to include
 * @param {string} styleDescription - Description of the art style
 * @param {Array} characterReferenceImages - Optional array of character reference images
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const generateCoverImage = async (title, characterDescriptions, styleDescription, characterReferenceImages = []) => {
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
    - Give each character a distinctive, memorable outfit and appearance that can be maintained throughout the story
    - Pay special attention to clothing details, hairstyle, and color scheme as these will need to remain consistent
    ${styleDescription || 'Use a child-friendly, colorful illustration style.'}
  `;

  const prompt = `Create a children's book cover for "${title}" featuring ${characterPrompt}. The cover should be vibrant, engaging, and appropriate for young children.

  IMPORTANT: This cover establishes the art style and character appearances for the entire book. Characters must have distinctive, memorable outfits and appearances that can be consistently maintained across all illustrations in the book. This cover will serve as the primary reference for character appearance throughout the story.

  ${enhancedStyleGuidance}`;

  console.log('Generating cover image with enhanced style guidance');

  // Filter valid reference images
  const validReferenceImages = characterReferenceImages
    .filter(img => img && img.startsWith('data:image'))
    .slice(0, 3); // Limit to 3 reference images to avoid API limits

  console.log(`Number of character reference images available: ${validReferenceImages.length}`);

  // If we have reference images, use image edit capabilities
  if (validReferenceImages.length > 0) {
    console.log('Using image-to-image generation with character reference images for cover');

    try {
      // Use the first reference as the primary image and others as additional references
      const primaryImage = validReferenceImages[0];
      const additionalReferences = validReferenceImages.slice(1);

      // Use gpt-image-1 with image edit for best character consistency
      return await generateImageEdit(
        primaryImage,
        prompt,
        null, // No mask
        {
          model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
          referenceImages: additionalReferences,
          size: "1024x1536", // Portrait format for book covers
          quality: "high"
        }
      );
    } catch (error) {
      console.error('Error using image edit for cover generation:', error);
      console.log('Falling back to standard image generation');
      // Fall back to standard image generation if image edit fails
      return generateImage(prompt, {
        model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
        size: "1024x1536", // Portrait format for book covers
        quality: "high"
      });
    }
  } else {
    // Standard image generation without references
    return generateImage(prompt, {
      model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
      size: "1024x1536", // Portrait format for book covers
      quality: "high"
    });
  }
};

/**
 * Edit an existing image using OpenAI's image edit API
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} prompt - The text prompt for image editing
 * @param {string|null} maskBase64 - Optional base64 encoded mask data
 * @param {Object} options - Additional options for image editing
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const editImage = async (imageBase64, prompt, maskBase64 = null, options = {}) => {
  console.log('Using OpenAI image edit API');
  return generateImageEdit(imageBase64, prompt, maskBase64, {
    model: "gpt-image-1",
    ...options
  });
};

// NOTE: We're not implementing a variation function since we're focusing exclusively on using
// gpt-image-1 with the image edit endpoint for character consistency.
