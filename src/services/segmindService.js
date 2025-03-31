import axios from 'axios';

const SEGMIND_API_KEY = import.meta.env.VITE_SEGMIND_API_KEY;
// Assuming the specific endpoint for Flux PuLID. Verify from Segmind docs.
const FLUX_PULID_URL = 'https://api.segmind.com/v1/flux-pulid'; 

if (!SEGMIND_API_KEY) {
  console.error('Segmind API key not found. Please set VITE_SEGMIND_API_KEY in your .env file.');
  // Handle missing key appropriately in production (e.g., disable feature)
}

/**
 * Generates an illustration using Segmind Flux PuLID.
 * Assumes a synchronous API call that returns image data directly.
 * 
 * @param {string} prompt - The text prompt describing the scene.
 * @param {string} referenceImageBase64 - The Base64 encoded reference character image (must include data:image/...;base64, prefix).
 * @param {object} options - Optional parameters for the API.
 * @param {number} [options.id_weight=1.5] - Weight of the ID image influence (0.0-3.0).
 * @param {number} [options.start_step=1] - Timestep for ID insertion (0-4). Lower for stylized.
 * @param {string} [options.negative_prompt="ugly, deformed, blurry, low quality, poorly drawn face"] - Negative prompt.
 * @param {number} [options.steps=30] - Number of inference steps.
 * @param {number} [options.guidance_scale=7] - CFG scale.
 * @param {string} [options.scheduler] - Optional scheduler (e.g., 'UniPCMultistepScheduler').
 * @param {number} [options.seed] - Optional seed for reproducibility.
 * @returns {Promise<string>} - A promise resolving to the Base64 encoded generated image (including data: prefix).
 */
export const generateFluxIllustration = async (prompt, referenceImageBase64, options = {}) => {
  if (!SEGMIND_API_KEY) {
    console.warn('Segmind API key missing. Cannot generate illustration.');
    // Returning a placeholder image base64 (1x1 grey pixel) for graceful failure
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8/w8AAusB/2QD3rgAAAAASUVORK5CYII='; 
  }

  // Validate reference image format
  if (!referenceImageBase64 || !referenceImageBase64.startsWith('data:image')) {
     console.error('Invalid referenceImageBase64 format. Must start with data:image');
     throw new Error('Invalid reference image format provided to generateFluxIllustration.');
  }

  const payload = {
    prompt: prompt,
    negative_prompt: options.negative_prompt || "ugly, deformed, blurry, low quality, poorly drawn face",
    main_face_image: referenceImageBase64, // API likely expects the full data URI
    id_weight: options.id_weight ?? 1.5,
    start_step: options.start_step ?? 1,
    guidance_scale: options.guidance_scale ?? 7, 
    num_inference_steps: options.steps || 30,
    // Include optional parameters if provided
    ...(options.scheduler && { scheduler: options.scheduler }),
    ...(options.seed && { seed: options.seed }),
    base64: true // Explicitly request base64 output if the API supports it this way
    // Verify the exact parameter name for requesting base64 output from Segmind docs
    // output_format: 'base64', // Alternative way some APIs handle it
  };

  console.log("Sending payload to Segmind Flux PuLID:", { ...payload, main_face_image: '[Base64 data present]' });

  try {
    // Set a reasonable timeout for the potentially long-running image generation
    const response = await axios.post(FLUX_PULID_URL, payload, {
      headers: {
        'x-api-key': SEGMIND_API_KEY,
        'Content-Type': 'application/json'
      },
      responseType: 'json',
      timeout: 60000 // 60 second timeout, adjust as needed
    });

    // console.log("Received response from Segmind:", response.data); // Log full response if needed for debugging

    // Adapt based on actual Segmind API response structure.
    // Common patterns: response.data.image, response.data.images[0], response.data.base64
    let imageBase64 = null;
    if (response.data && typeof response.data.image === 'string') { // Example: { "image": "data:image/..." }
        imageBase64 = response.data.image;
    } else if (response.data && Array.isArray(response.data.images) && response.data.images.length > 0 && typeof response.data.images[0] === 'string') { // Example: { "images": ["data:image/..."] }
         imageBase64 = response.data.images[0];
    } else if (response.data && typeof response.data.base64 === 'string') { // Example: { "base64": "data:image/..." }
        imageBase64 = response.data.base64;
    }
    
    // Check if we got a valid base64 string with the expected prefix
    if (imageBase64 && imageBase64.startsWith('data:image')) {
       return imageBase64;
    } else {
        console.error("Segmind response did not contain valid base64 image data in expected format:", response.data);
        throw new Error('Invalid or missing image data received from Segmind API.');
    }

  } catch (error) {
    let errorMessage = error.message;
    if (axios.isAxiosError(error)) {
        errorMessage = `Segmind API request failed: ${error.response?.status || 'Network Error'} - ${JSON.stringify(error.response?.data || error.message)}`;
        if (error.code === 'ECONNABORTED') {
             errorMessage = 'Segmind API request timed out after 60 seconds.';
        }
    }
    console.error('Error calling Segmind API:', errorMessage);
    throw new Error(errorMessage);
  }
};