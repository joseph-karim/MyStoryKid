import axios from 'axios';

/**
 * OpenAI Image Service
 *
 * This service provides functions for generating and editing images using OpenAI's API.
 *
 * Note on image edits endpoint:
 * - The 'response_format' parameter is not supported for the edits endpoint with gpt-image-1
 * - The API returns either b64_json or url in the response
 */

// Get the OpenAI API key from environment variables
let OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Ensure the API key is in the correct format
if (OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-proj-')) {
  console.log('Using OpenAI API key with sk-proj- prefix');
} else {
  console.error('Invalid OpenAI API key format. Expected sk-proj- prefix.');
}
const OPENAI_GENERATIONS_URL = 'https://api.openai.com/v1/images/generations';
const OPENAI_EDITS_URL = 'https://api.openai.com/v1/images/edits';

// Map of style codes to their style-specific prompt guidance
const STYLE_PROMPT_GUIDANCE = {
  // ===== WATERCOLOR & TRADITIONAL PAINTING STYLES =====
  'watercolor_storybook': 'Create a soft watercolor children\'s book illustration. Use gentle pastel colors, light brushstrokes, and a warm atmosphere with a simple natural background.',
  'watercolor_splash': 'Create a minimalist line art illustration with loose watercolor splashes for color in a clean, elegant, gentle style for children.',
  'gouache_painting': 'Create a gouache-style children\'s book illustration with matte colors, thick brush strokes, and a vibrant, playful feel.',
  'oil_pastel': 'Create an oil pastel style children\'s illustration with rich, creamy textures and bold, joyful colors.',

  // ===== INK & DRAWING STYLES =====
  'ink_wash': 'Create a fine ink line and watercolor wash illustration. Use clean, classic lines with bright washes of color for a lively children\'s book feel.',
  'pencil_sketch': 'Create a lightly colored pencil sketch illustration. Use soft pastels and delicate textures for a classic storybook aesthetic.',
  'colored_pencil': 'Create a children\'s book illustration with colored pencil textures and bright marker accents in a playful and vivid style.',
  'chalk_drawing': 'Create a colorful chalk drawing with bright simple lines on a dark background in a playful and whimsical style.',

  // ===== CARTOON & VECTOR STYLES =====
  'cartoon_character': 'Create a cartoon-style character with bold outlines, colorful details, and expressive features with children\'s book energy.',
  'flat_vector': 'Create a flat vector-style illustration with clean lines, soft shading, and bright minimalistic colors.',
  'pixel_art': 'Create a soft pixel art version of the character with rounded pixels, bright colors, and gentle gradients for a children\'s book look.',

  // ===== 3D & TEXTURED STYLES =====
  'clay_animation': 'Create a 3D claymation-style children\'s book character with soft clay textures, rounded features, and bright colors.',
  'plush_toy': 'Create a plush toy-style illustration with soft textures, slightly simplified features, and an extremely cuddly look.',
  'felt_craft': 'Create a textured illustration mimicking felt crafts with visible texture and rich colors.',
  'paper_cutout': 'Create a cut-paper collage style illustration with bright textured paper layers in a playful and vivid style, inspired by Eric Carle.',
  'paper_diorama': 'Create a children\'s book character styled like a 3D paper diorama theater scene with layered paper depth and lighting.',

  // ===== FANTASY & MAGICAL STYLES =====
  'fantasy_storybook': 'Create a richly detailed fantasy storybook character with magical elements, lush textures, and a glowing ambiance.',
  'dreamy_glow': 'Create a pastel dreamscape style character with light colors, glowing soft highlights, and a magical dreamy mood.',
  'magical_light': 'Create an illustration with a magical luminous quality and soft glowing highlights.',
  'stained_glass': 'Create a stained-glass inspired children\'s book character with bright vibrant color panels in a storybook setting.',

  // ===== CULTURAL & HISTORICAL STYLES =====
  'folk_art': 'Create a folk-art inspired children\'s book character with bold shapes, traditional motifs, and rich flat colors.',
  'vintage_midcentury': 'Create a mid-century European children\'s book illustration with a muted palette, geometric shapes, and a nostalgic feel.',
  'retro_70s': 'Create a 1970s retro-style character with warm oranges, browns, and golds in a stylized and cheerful manner.',
  'asian_brushwork': 'Create a children\'s character illustration using an East Asian brush painting style with ink textures, light color accents, and a serene mood.',
  'nordic_cozy': 'Create a Nordic storybook character with cool tones, woolly clothes, and a cozy winter forest setting.',

  // ===== LIGHTING & MOOD STYLES =====
  'golden_hour': 'Create a warm, golden-lit scene with rich amber tones and soft shadows.',
  'night_glow': 'Create a children\'s book illustration using glow-in-the-dark style with a dark background, character softly illuminated, and a magical feel.',
  'vibrant_scene': 'Use rich, vibrant colors with detailed scenes and dramatic lighting.',

  // ===== DIGITAL & MODERN STYLES =====
  'digital_airbrush': 'Create a smooth airbrushed digital painting with bright colors, soft gradients, and a friendly, vibrant style.',
  'mixed_media': 'Create a children\'s illustration blending watercolor painting and cut-paper collage for layered textures.',

  // Default style guidance
  'default': 'Use a colorful, child-friendly illustration style with clear outlines and appealing characters.'
};

/**
 * Get a style reference image URL based on the style code
 * @param {string} styleCode - The style code
 * @returns {Promise<string|null>} - A promise that resolves to the data URL of the style reference image, or null if not found
 */
async function getStyleReferenceImage(styleCode) {
  if (!styleCode) return null;

  try {
    // Format the style name for the file path
    const formattedStyleName = styleCode
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');

    // Try to find a matching style preview image
    // Check multiple possible locations and formats
    const possiblePaths = [
      // New style thumbnails in PNG format (preferred)
      `/assets/style-thumbnails-png/${styleCode}.png`,
      `/public/assets/style-thumbnails-png/${styleCode}.png`,

      // New style thumbnails in SVG format (fallback)
      `/assets/style-thumbnails/${styleCode}.svg`,
      `/public/assets/style-thumbnails/${styleCode}.svg`,

      // Legacy paths in dist/assets
      `/dist/assets/style-thumbnails/${styleCode}.png`,
      `/dist/assets/${formattedStyleName}.png`,
      `/dist/assets/${styleCode}.png`,

      // Other possible locations
      `/assets/${formattedStyleName}.png`,
      `/assets/${styleCode}.png`
    ];

    // Try to fetch the image
    for (const path of possiblePaths) {
      try {
        console.log(`Trying to fetch style reference from: ${path}`);
        const response = await fetch(path);
        if (response.ok) {
          const blob = await response.blob();
          const dataUrl = await blobToDataUrl(blob);
          console.log(`Successfully found style reference for ${styleCode} at ${path}`);
          return dataUrl;
        }
      } catch (e) {
        // Continue to the next path
        console.log(`Could not find style reference at ${path}`);
      }
    }

    // If we couldn't find a direct match, return null
    console.log(`No style reference image found for style code: ${styleCode}`);
    return null;
  } catch (error) {
    console.error('Error getting style reference image:', error);
    return null;
  }
}

/**
 * Map UI style names to style codes used in prompt guidance
 * @param {string} styleName - The style name from the UI
 * @returns {string} - The corresponding style code
 */
function mapStyleNameToCode(styleName) {
  if (!styleName) return 'default';

  // Convert to lowercase and remove special characters for matching
  const normalizedName = styleName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  // Direct mappings for common styles and legacy style names
  const styleMap = {
    // Watercolor & Traditional Painting Styles
    'watercolor': 'watercolor_storybook',
    'watercolor_storybook': 'watercolor_storybook',
    'minimalist_watercolor': 'watercolor_splash',
    'watercolor_splash': 'watercolor_splash',
    'gouache': 'gouache_painting',
    'gouache_painting': 'gouache_painting',
    'oil_pastel': 'oil_pastel',
    'aquarelle': 'watercolor_storybook',

    // Ink & Drawing Styles
    'ink': 'ink_wash',
    'ink_wash': 'ink_wash',
    'ink_watercolor_wash': 'ink_wash',
    'pencil': 'pencil_sketch',
    'pencil_sketch': 'pencil_sketch',
    'pencil_sketch_soft_color': 'pencil_sketch',
    'colored_pencil': 'colored_pencil',
    'colored_pencil_marker': 'colored_pencil',
    'chalk': 'chalk_drawing',
    'chalkboard': 'chalk_drawing',
    'sketch': 'pencil_sketch',
    'sketch_elegance': 'pencil_sketch',
    'inked_realism': 'ink_wash',

    // Cartoon & Vector Styles
    'cartoon': 'cartoon_character',
    'cartoon_character': 'cartoon_character',
    'cartoon_semi_realistic': 'cartoon_character',
    'vector': 'flat_vector',
    'flat_vector': 'flat_vector',
    'flat_vector_soft_gradient': 'flat_vector',
    'pixel': 'pixel_art',
    'pixel_art': 'pixel_art',
    'soft_pixel_art': 'pixel_art',

    // 3D & Textured Styles
    'clay': 'clay_animation',
    'clay_animation': 'clay_animation',
    'claymation': 'clay_animation',
    'joyful_clay': 'clay_animation',
    'plush': 'plush_toy',
    'plush_toy': 'plush_toy',
    'soft_plush_toy': 'plush_toy',
    'felt': 'felt_craft',
    'felt_craft': 'felt_craft',
    'colorful_felt': 'felt_craft',
    'paper_cutout': 'paper_cutout',
    'cut_paper_collage': 'paper_cutout',
    'paper_collage': 'paper_cutout',
    'diorama': 'paper_diorama',
    'paper_diorama': 'paper_diorama',
    'paper_theater': 'paper_diorama',
    'ceramic': 'clay_animation',
    'ceramic_lifelike': 'clay_animation',

    // Fantasy & Magical Styles
    'fantasy': 'fantasy_storybook',
    'fantasy_storybook': 'fantasy_storybook',
    'storybook_fantasy': 'fantasy_storybook',
    'fantasy_hero': 'fantasy_storybook',
    'dreamy': 'dreamy_glow',
    'dreamy_glow': 'dreamy_glow',
    'pastel_dreamscape': 'dreamy_glow',
    'soft_radiance': 'dreamy_glow',
    'dreamy_3d': 'dreamy_glow',
    'magical': 'magical_light',
    'magical_light': 'magical_light',
    'shimmering_glow': 'magical_light',
    'magic_portrait': 'magical_light',
    'stained_glass': 'stained_glass',
    'surreal_iridescence': 'magical_light',

    // Cultural & Historical Styles
    'folk': 'folk_art',
    'folk_art': 'folk_art',
    'vintage': 'vintage_midcentury',
    'vintage_midcentury': 'vintage_midcentury',
    'vintage_european': 'vintage_midcentury',
    'vintage_engraving': 'vintage_midcentury',
    'retro': 'retro_70s',
    'retro_70s': 'retro_70s',
    'asian': 'asian_brushwork',
    'asian_brushwork': 'asian_brushwork',
    'modern_sumi_e': 'asian_brushwork',
    'ancient_china': 'asian_brushwork',
    'nordic': 'nordic_cozy',
    'nordic_cozy': 'nordic_cozy',
    'nordic_storybook': 'nordic_cozy',

    // Lighting & Mood Styles
    'golden': 'golden_hour',
    'golden_hour': 'golden_hour',
    'night': 'night_glow',
    'night_glow': 'night_glow',
    'glow_in_dark': 'night_glow',
    'vibrant': 'vibrant_scene',
    'vibrant_scene': 'vibrant_scene',
    'vivid_tableaux': 'vibrant_scene',

    // Digital & Modern Styles
    'airbrush': 'digital_airbrush',
    'digital_airbrush': 'digital_airbrush',
    'mixed': 'mixed_media',
    'mixed_media': 'mixed_media',
    'watercolor_collage': 'mixed_media',
    'graffiti_splash': 'digital_airbrush',

    // Legacy style names
    'storytime_whimsy': 'watercolor_storybook',
    'cutie_3d': 'clay_animation',
    'warm_portrait': 'golden_hour',
    'crayon_watercolor': 'colored_pencil'
  };

  // Check for direct matches in our map
  for (const [key, value] of Object.entries(styleMap)) {
    if (normalizedName.includes(key)) {
      return value;
    }
  }

  // If we have an exact match in our STYLE_PROMPT_GUIDANCE, use that
  if (STYLE_PROMPT_GUIDANCE[normalizedName]) {
    return normalizedName;
  }

  // For original style codes, try to match them directly
  if (STYLE_PROMPT_GUIDANCE[styleName]) {
    return styleName;
  }

  // If no match found, return default
  return 'default';
}

/**
 * Get style-specific prompt guidance based on the style code
 * @param {string} styleCode - The style code
 * @returns {string} - Style-specific prompt guidance
 */
function getStylePromptGuidance(styleCode) {
  if (!styleCode) return STYLE_PROMPT_GUIDANCE.default;

  // Try to map the style code to a known style
  const mappedCode = mapStyleNameToCode(styleCode);

  // If we have a mapped code and it exists in our guidance, use it
  if (mappedCode && STYLE_PROMPT_GUIDANCE[mappedCode]) {
    return STYLE_PROMPT_GUIDANCE[mappedCode];
  }

  // Try to find an exact match
  if (STYLE_PROMPT_GUIDANCE[styleCode]) {
    return STYLE_PROMPT_GUIDANCE[styleCode];
  }

  // If no exact match, return the default guidance
  return STYLE_PROMPT_GUIDANCE.default;
}

/**
 * Convert a Blob to a data URL
 * @param {Blob} blob - The Blob to convert
 * @returns {Promise<string>} - A promise that resolves to the data URL
 */
async function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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
    // Enhanced logging for OpenAI image requests (with sensitive data redaction)
    console.log(`--- OpenAI Image Generation Request ---`);
    console.log(`Prompt (first 200): ${prompt.substring(0, 200)}`);
    console.log(`Model: ${options.model || 'gpt-image-1'}`);
    console.log(`Size: ${options.size || '1024x1024'}`);
    console.log(`Quality: ${options.quality || 'standard'}`);
    if (options.referenceImages) {
      console.log(`Reference images count: ${options.referenceImages.length}`);
      options.referenceImages.forEach((img, idx) => {
        if (typeof img === 'string') {
          console.log(`Reference image[${idx}] base64 prefix: ${img.substring(0, 100)}`);
          try {
            const size = atob(img.split(',')[1] || '').length;
            console.log(`Reference image[${idx}] size: ${size} bytes`);
          } catch (e) {
            console.log(`Reference image[${idx}] size: error calculating size`);
          }
        }
      });
    }
    console.log(`----------------------`);

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
      timeout: options.timeout || 60000 // Use timeout from options or default to 60 seconds
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      // Extract the image data - handle both response formats
      const imageData = response.data.data[0].b64_json || response.data.data[0].url;
      // Enhanced logging for OpenAI image responses (with sensitive data redaction)
      console.log('--- OpenAI Image Generation Response ---');
      console.log('Status: Success');
      console.log('Response type:', imageData && typeof imageData === 'string' && imageData.startsWith('http') ? 'URL' : 'Base64');
      console.log('----------------------');

      // If we got a URL, return it directly
      if (imageData && typeof imageData === 'string' && imageData.startsWith('http')) {
        return imageData;
      } else if (!imageData) {
        console.error('Unexpected response format from OpenAI:', response.data);
        throw new Error('Invalid image data in response');
      }

      // Otherwise, return as data URL
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
      console.error('Request data:', {
        url: OPENAI_GENERATIONS_URL,
        model: options.model || 'gpt-image-1',
        promptLength: prompt ? prompt.length : 0,
        options: JSON.stringify(options)
      });
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
    console.log(`--- OpenAI Image Edit Request ---`);
    console.log(`Prompt (first 200): ${prompt.substring(0, 200)}`);
    console.log(`Model: ${options.model || 'gpt-image-1'}`);
    console.log(`Size: ${options.size}`);
    console.log(`Quality: ${options.quality}`);
    // Log main image
    if (typeof imageDataUrl === 'string') {
      console.log(`Main image base64 prefix: ${imageDataUrl.substring(0, 100)}`);
      try {
        const size = atob(imageDataUrl.split(',')[1] || '').length;
        console.log(`Main image size: ${size} bytes`);
      } catch (e) {
        console.log(`Main image size: error calculating size`);
      }
    }
    // Log reference images
    if (options.referenceImages && Array.isArray(options.referenceImages)) {
      console.log(`Reference images count: ${options.referenceImages.length}`);
      options.referenceImages.forEach((img, idx) => {
        if (typeof img === 'string') {
          console.log(`Reference image[${idx}] base64 prefix: ${img.substring(0, 100)}`);
          try {
            const size = atob(img.split(',')[1] || '').length;
            console.log(`Reference image[${idx}] size: ${size} bytes`);
          } catch (e) {
            console.log(`Reference image[${idx}] size: error calculating size`);
          }
        }
      });
    }

    // Convert data URLs to Blobs
    const imageBlob = await dataUrlToBlob(imageDataUrl);
    let maskBlob = null;
    if (maskDataUrl) {
      maskBlob = await dataUrlToBlob(maskDataUrl);
    }

    // Create FormData
    const formData = new FormData();

    // For gpt-image-1, we need to handle the API differently
    if (options.model === 'gpt-image-1') {
      // The API expects all images (main + references) as 'image[]'
      formData.append('image[]', imageBlob, 'image.png');

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
    // Note: response_format is not supported for the edits endpoint with gpt-image-1

    // Log FormData keys
    if (typeof formData.forEach === 'function') {
      console.log('FormData keys:');
      formData.forEach((value, key) => {
        if (typeof value === 'object' && value instanceof Blob) {
          console.log(`  ${key}: [Blob, size: ${value.size}]`);
        } else {
          console.log(`  ${key}: ${typeof value === 'string' ? value.substring(0, 100) : value}`);
        }
      });
    }

    // Log Axios config
    const axiosConfig = {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data'
      },
      timeout: options.timeout || 60000 // Use timeout from options or default to 60 seconds
    };
    console.log('Axios config:', JSON.stringify(axiosConfig, null, 2));

    const response = await axios.post(OPENAI_EDITS_URL, formData, axiosConfig);

    if (response.data && response.data.data && response.data.data.length > 0) {
      // Extract the base64 image data - handle both response formats
      const imageData = response.data.data[0].b64_json || response.data.data[0].url;
      console.log('Successfully generated image edit with OpenAI');

      // If we got a URL, return it directly
      if (imageData && typeof imageData === 'string' && imageData.startsWith('http')) {
        return imageData;
      } else if (!imageData) {
        console.error('Unexpected response format from OpenAI:', response.data);
        throw new Error('Invalid image data in response');
      }

      // Otherwise, return as data URL
      return `data:image/png;base64,${imageData}`;
    } else {
      throw new Error('No image data in response');
    }
  } catch (error) {
    console.error('Error generating image edit with OpenAI:', error);

    if (error.response) {
      // Log detailed error information for debugging
      console.error('OpenAI API error response:', error.response.data);
      console.error('Request data:', {
        url: OPENAI_EDITS_URL,
        model: options.model || 'gpt-image-1',
        promptLength: prompt ? prompt.length : 0,
        hasMask: !!maskDataUrl,
        referenceImagesCount: options.referenceImages ? options.referenceImages.length : 0,
        options: JSON.stringify(options)
      });
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
  const { name, age, gender, type, traits = [], interests = [], artStyleCode } = characterData;

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

  // Get style-specific prompt guidance
  const styleCode = artStyleCode || (characterData.storyData ? characterData.storyData.artStyleCode : null);
  const stylePromptGuidance = getStylePromptGuidance(styleCode);

  // Try to get a style reference image
  let styleReferenceImage = null;
  if (styleCode) {
    try {
      styleReferenceImage = await getStyleReferenceImage(styleCode);
      if (styleReferenceImage) {
        console.log(`Found style reference image for style code: ${styleCode}`);
      }
    } catch (error) {
      console.error('Error getting style reference image:', error);
    }
  }

  // Collect all reference images
  const referenceImages = [];
  if (photoReference && photoReference.startsWith('data:image')) {
    referenceImages.push(photoReference);
    console.log('Using photo reference for character generation');
  }
  if (styleReferenceImage) {
    referenceImages.push(styleReferenceImage);
    console.log('Using style reference image for character generation');
  }

  // --- DETAILED LOGGING FOR CHARACTER PREVIEW ---
  console.log('--- Character Preview Generation ---');
  console.log('Prompt (first 200):', characterDescription.substring(0, 200));
  console.log('Art style code:', styleCode);
  console.log('Style prompt guidance:', stylePromptGuidance);
  if (styleReferenceImage) {
    console.log('Style reference image base64 prefix:', styleReferenceImage.substring(0, 100));
    try {
      const size = atob(styleReferenceImage.split(',')[1] || '').length;
      console.log('Style reference image size:', size, 'bytes');
    } catch (e) {
      console.log('Style reference image size: error calculating size');
    }
  }
  if (photoReference) {
    console.log('Photo reference base64 prefix:', photoReference.substring(0, 100));
    try {
      const size = atob(photoReference.split(',')[1] || '').length;
      console.log('Photo reference size:', size, 'bytes');
    } catch (e) {
      console.log('Photo reference size: error calculating size');
    }
  }
  referenceImages.forEach((img, idx) => {
    if (typeof img === 'string') {
      console.log(`Reference image[${idx}] base64 prefix: ${img.substring(0, 100)}`);
      try {
        const size = atob(img.split(',')[1] || '').length;
        console.log(`Reference image[${idx}] size: ${size} bytes`);
      } catch (e) {
        console.log(`Reference image[${idx}] size: error calculating size`);
      }
    }
  });
  console.log('--- End Character Preview Logging ---');

  // Enhanced style guidance for consistency
  const enhancedStyleGuidance = `
    Create the character with these specific style characteristics:
    - Character should have appealing, expressive features with a clear, friendly expression
    - The character design should be consistent with the style that will be used throughout the book
    - Create a portrait with a simple, non-distracting background that highlights the character
    - Pay special attention to creating a distinctive outfit and appearance that will be maintained throughout the story
    - Design the character with clear, memorable features that can be consistently reproduced in different scenes

    STYLE GUIDANCE: ${stylePromptGuidance}

    IMPORTANT: This character will appear throughout a children's book, so create a distinctive, memorable appearance with a specific outfit that can be consistently maintained across multiple illustrations. Pay special attention to clothing details, hairstyle, and color scheme as these will need to remain consistent throughout the story.

    ${styleDescription ? `Additional style notes: ${styleDescription}` : ''}
  `;

  // Create a detailed prompt
  const prompt = `Create a portrait of ${characterDescription}. The character should be looking directly at the viewer with a friendly expression. Create a high-quality, detailed illustration suitable for a children's book.

  ${enhancedStyleGuidance}`;

  console.log('Generating character image with enhanced style guidance');

  // If we have reference images, use image edit capabilities
  if (referenceImages.length > 0) {
    console.log(`Using image-to-image generation with ${referenceImages.length} reference images`);

    try {
      // Use the first reference as the primary image and others as additional references
      const primaryImage = referenceImages[0];
      const additionalReferences = referenceImages.slice(1);

      // Use the image edit API with references
      return await generateImageEdit(
        primaryImage,
        prompt,
        null, // No mask
        {
          model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
          referenceImages: additionalReferences,
          size: "1024x1024", // Square format for character portraits
          quality: "medium", // Use medium quality to reduce token usage for subsequent operations
          timeout: 120000 // Increase timeout to 2 minutes for character generation
        }
      );
    } catch (error) {
      console.error('Error using image edit for character generation:', error);
      console.log('Falling back to standard image generation');
      // Fall back to standard image generation if image edit fails
      return generateImage(prompt, {
        model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
        size: "1024x1024", // Square format for character portraits
        quality: "medium", // Use medium quality to reduce token usage for subsequent operations
        timeout: 120000 // Increase timeout to 2 minutes for character generation
      });
    }
  } else {
    // Standard image generation without reference
    return generateImage(prompt, {
      model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
      size: "1024x1024", // Square format for character portraits
      quality: "medium", // Use medium quality to reduce token usage for subsequent operations
      timeout: 120000 // Increase timeout to 2 minutes for character generation
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

  // Extract style code from characterReferenceInfo if available
  let styleCode = null;
  if (Object.keys(characterReferenceInfo).length > 0) {
    // Try to get style code from the first character's info
    const firstCharInfo = Object.values(characterReferenceInfo)[0];
    if (firstCharInfo && firstCharInfo.storyData && firstCharInfo.storyData.artStyleCode) {
      styleCode = firstCharInfo.storyData.artStyleCode;
    }
  }

  // Get style-specific prompt guidance
  const stylePromptGuidance = getStylePromptGuidance(styleCode);

  // Try to get a style reference image if we don't already have one
  let styleReferenceImage = styleReferenceImageUrl;
  if (!styleReferenceImage && styleCode) {
    try {
      styleReferenceImage = await getStyleReferenceImage(styleCode);
      if (styleReferenceImage) {
        console.log(`Found style reference image for style code: ${styleCode}`);
      }
    } catch (error) {
      console.error('Error getting style reference image:', error);
    }
  }

  // Enhanced style guidance for consistency
  const enhancedStyleGuidance = `
    Maintain a consistent animation style throughout the book with these characteristics:
    - Characters should have consistent proportions and features across all pages
    - Maintain consistent lighting direction and color palette across all illustrations
    - Create depth with subtle background details that don't distract from the main characters
    - This is page ${pageNumber} of the story, so maintain visual continuity with previous pages
    - Ensure characters maintain the EXACT SAME outfit, hairstyle, and appearance as in their reference images

    STYLE GUIDANCE: ${stylePromptGuidance}

    IMPORTANT: This is part of a children's book where visual consistency is essential. Each character must maintain their exact appearance (outfit, hairstyle, colors) throughout the story. Refer to previous illustrations as reference and maintain the same art style throughout.

    ${styleDescription ? `Additional style notes: ${styleDescription}` : ''}
  `;

  // Build character-specific reference guidance
  let characterReferenceGuidance = '\nCharacter consistency is EXTREMELY IMPORTANT. Follow these specific guidelines:';

  // Collect reference images for image-to-image generation
  const referenceImages = [];

  if (Object.keys(characterReferenceInfo).length > 0) {
    // Get characters with reference images
    const charactersWithReferences = Object.entries(characterReferenceInfo)
      .filter(([_, info]) => info.referenceImageUrl)
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
        console.log(`Added reference image for ${charInfo.name} (${charInfo.isFirstAppearance ? 'first appearance' : 'subsequent appearance'})`);
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
  if (styleReferenceImage && styleReferenceImage.startsWith('data:image')) {
    // Add style reference image at the end of the array
    // This way character references take precedence
    referenceImages.push(styleReferenceImage);
    console.log('Added style reference image');
  }

  // Reference previous images if available for style consistency
  const styleReferenceNote = styleReferenceImage ?
    "Maintain EXACT visual consistency with the art style, lighting, color palette, and character appearances from the previous illustrations. This is CRITICAL for maintaining a cohesive story." :
    "";

  const prompt = `Create a scene showing ${characterPrompt} in ${sceneDescription}.
    ${enhancedStyleGuidance}
    ${characterReferenceGuidance}
    ${styleReferenceNote}`;

  console.log(`Generating image for page ${pageNumber} with enhanced style and character guidance`);
  console.log(`Number of reference images available: ${referenceImages.length}`);

  // If we have reference images, use image edit capabilities
  if (referenceImages.length > 0) {
    console.log('Using image-to-image generation with reference images');

    try {
      // Use the first reference as the primary image and others as additional references
      const primaryImage = referenceImages[0];
      const additionalReferences = referenceImages.slice(1);

      console.log(`Using primary image and ${additionalReferences.length} additional reference images for scene generation`);

      // Use gpt-image-1 with image edit for best character consistency
      return await generateImageEdit(
        primaryImage,
        prompt,
        null, // No mask
        {
          model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
          referenceImages: additionalReferences,
          size: "1536x1024", // Landscape format for scenes
          quality: "high",
          timeout: 120000 // Increase timeout to 2 minutes for complex scene generation
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
 * @param {string} styleCode - Optional style code to use for style reference and guidance
 * @returns {Promise<string>} - Base64 encoded image data
 */
export const generateCoverImage = async (title, characterDescriptions, styleDescription, characterReferenceImages = [], styleCode = null) => {
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

  // Get style-specific prompt guidance
  const stylePromptGuidance = getStylePromptGuidance(styleCode);

  // Enhanced style guidance for consistency
  const enhancedStyleGuidance = `
    Create the cover with these specific style characteristics:
    - Characters should have appealing, expressive features with clear emotions
    - Create depth with subtle background details that don't distract from the main characters
    - The cover should establish the visual style that will be consistent throughout all book illustrations
    - Give each character a distinctive, memorable outfit and appearance that can be maintained throughout the story
    - Pay special attention to clothing details, hairstyle, and color scheme as these will need to remain consistent

    STYLE GUIDANCE: ${stylePromptGuidance}

    IMPORTANT: This cover establishes the art style and character appearances for the entire book. Characters must have distinctive, memorable outfits and appearances that can be consistently maintained across all illustrations in the book. This cover will serve as the primary reference for character appearance throughout the story.

    ${styleDescription ? `Additional style notes: ${styleDescription}` : ''}
  `;

  const prompt = `Create a children's book cover for "${title}" featuring ${characterPrompt}. The cover should be vibrant, engaging, and appropriate for young children.\n\n${enhancedStyleGuidance}`;

  console.log('Generating cover image with enhanced style guidance');

  // Use only the first valid character reference image (the main character preview)
  const validCharacterReferences = characterReferenceImages
    .filter(img => img && img.startsWith('data:image'));
  const referenceImages = validCharacterReferences.length > 0 ? [validCharacterReferences[0]] : [];
  console.log(`Number of character reference images available: ${referenceImages.length}`);

  // If we have a reference image, use image edit capabilities
  if (referenceImages.length > 0) {
    console.log(`Using image-to-image generation with 1 reference image for cover`);
    try {
      // Get style reference image if available
      let styleReferenceImage = null;
      if (styleCode) {
        try {
          styleReferenceImage = await getStyleReferenceImage(styleCode);
          if (styleReferenceImage) {
            console.log(`Found style reference image for style code: ${styleCode}`);
          }
        } catch (error) {
          console.error('Error getting style reference image:', error);
        }
      }

      // Use the main character preview as the primary image
      const primaryImage = referenceImages[0];
      
      // Add style reference to additional references if available
      const additionalReferences = [];
      if (styleReferenceImage && styleReferenceImage.startsWith('data:image')) {
        additionalReferences.push(styleReferenceImage);
        console.log('Added style reference image to cover generation');
      }
      
      return await generateImageEdit(
        primaryImage,
        prompt,
        null, // No mask
        {
          model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
          referenceImages: additionalReferences, // Include style reference image
          size: "1024x1536", // Portrait format for book covers
          quality: "high",
          timeout: 120000 // Increase timeout to 2 minutes for complex cover generation
        }
      );
    } catch (error) {
      console.error('Error using image edit for cover generation:', error);
      console.log('Falling back to standard image generation');
      // Fall back to standard image generation if image edit fails
      return generateImage(prompt, {
        model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
        size: "1024x1536", // Portrait format for book covers
        quality: "high",
        timeout: 120000 // Increase timeout to 2 minutes for complex cover generation
      });
    }
  } else {
    // Standard image generation without references
    return generateImage(prompt, {
      model: "gpt-image-1", // Explicitly use gpt-image-1 for best quality
      size: "1024x1536", // Portrait format for book covers
      quality: "high",
      timeout: 120000 // Increase timeout to 2 minutes for complex cover generation
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
