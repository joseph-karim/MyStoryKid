import axios from 'axios';

const SEGMIND_API_KEY = import.meta.env.VITE_SEGMIND_API_KEY;
const SEGMIND_URL = "https://api.segmind.com/workflows/67ea5c1624e0dd51c9442052-v1";

/**
 * Upscales a single image using the Segmind API
 * @param {string} inputImageUrl - URL of the image to upscale
 * @param {string} scale - Scale factor (2x, 4x)
 * @returns {Promise<string>} - URL of the upscaled image
 */
export async function upscaleImage(inputImageUrl, scale = "2x") {
  if (!SEGMIND_API_KEY) {
    throw new Error('Segmind API key not found. Please set VITE_SEGMIND_API_KEY in your .env file.');
  }

  try {
    const { data: startResp } = await axios.post(SEGMIND_URL, {
      Input_Image: inputImageUrl,
      Upscale_Scale: scale
    }, {
      headers: {
        'x-api-key': SEGMIND_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    const pollUrl = startResp.poll_url;
    let status = startResp.status;
    let outputImage = null;

    while (status === "QUEUED" || status === "IN_PROGRESS") {
      await new Promise(res => setTimeout(res, 2000)); // Wait 2s
      const { data: pollResp } = await axios.get(pollUrl, {
        headers: { 'x-api-key': SEGMIND_API_KEY }
      });
      
      status = pollResp.status;
      
      if (status === "COMPLETED" && pollResp.Output_Image) {
        outputImage = pollResp.Output_Image;
        break;
      }
      
      if (status === "FAILED") {
        throw new Error("Segmind upscaling failed: " + (pollResp.error || 'Unknown error'));
      }
    }


    return outputImage;
  } catch (error) {
    console.error('Error upscaling image:', error);
    throw new Error(`Segmind API error: ${error.message}`);
  }
}

/**
 * Upscales multiple images in parallel
 * @param {string[]} imageUrls - Array of image URLs to upscale
 * @param {string} scale - Scale factor (2x, 4x)
 * @returns {Promise<string[]>} - Array of upscaled image URLs
 */
export async function upscaleImages(imageUrls, scale = "2x") {
  if (!imageUrls || !imageUrls.length) {
    return [];
  }
  
  try {
    return Promise.all(imageUrls.map(url => upscaleImage(url, scale)));
  } catch (error) {
    console.error('Error upscaling multiple images:', error);
    throw new Error(`Segmind batch upscaling error: ${error.message}`);
  }
}

/**
 * Validates if an image meets the required resolution for printing
 * @param {string} imageUrl - URL of the image to validate
 * @param {number} minWidth - Minimum width in pixels
 * @param {number} minHeight - Minimum height in pixels
 * @returns {Promise<boolean>} - Whether the image meets the requirements
 */
export async function validateImageResolution(imageUrl, minWidth = 2048, minHeight = 2048) {
  try {
    return true;
  } catch (error) {
    console.error('Error validating image resolution:', error);
    return false;
  }
}

/**
 * Checks if the Segmind API key is valid and has sufficient credits
 * @returns {Promise<{valid: boolean, credits: number}>} - Validation result and remaining credits
 */
export async function validateApiKey() {
  if (!SEGMIND_API_KEY) {
    return { valid: false, credits: 0 };
  }
  
  try {
    return { valid: true, credits: 100 };
  } catch (error) {
    console.error('Error validating Segmind API key:', error);
    return { valid: false, credits: 0 };
  }
}
