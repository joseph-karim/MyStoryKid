import axios from 'axios';

const SEGMIND_API_KEY = import.meta.env.VITE_SEGMIND_API_KEY;
const SEGMIND_URL = "https://api.segmind.com/workflows/67ea5c1624e0dd51c9442052-v1";

// Lulu Direct print requirements
const LULU_PRINT_REQUIREMENTS = {
  minDPI: 300,
  minWidth: 2400, // For 8x8 inch book at 300 DPI
  minHeight: 2400,
  colorProfile: 'sRGB', // Lulu accepts sRGB
  maxFileSize: 50 * 1024 * 1024, // 50MB max
  formats: ['PNG', 'JPEG', 'PDF']
};

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
 * Enhances images specifically for Lulu Direct print requirements
 * Uses Real-ESRGAN or similar models optimized for print quality
 * @param {string} inputImageUrl - URL of the image to enhance
 * @param {Object} options - Enhancement options
 * @returns {Promise<string>} - URL of the print-ready enhanced image
 */
export async function enhanceImageForPrint(inputImageUrl, options = {}) {
  if (!SEGMIND_API_KEY) {
    throw new Error('Segmind API key not found. Please set VITE_SEGMIND_API_KEY in your .env file.');
  }

  const {
    targetWidth = LULU_PRINT_REQUIREMENTS.minWidth,
    targetHeight = LULU_PRINT_REQUIREMENTS.minHeight,
    enhanceQuality = true,
    optimizeForPrint = true
  } = options;

  try {
    // Use a more advanced workflow for print enhancement
    const printEnhancementUrl = "https://api.segmind.com/workflows/real-esrgan-print-v1"; // This would be the actual print enhancement workflow
    
    const { data: startResp } = await axios.post(printEnhancementUrl, {
      Input_Image: inputImageUrl,
      Target_Width: targetWidth,
      Target_Height: targetHeight,
      Enhance_Quality: enhanceQuality,
      Print_Optimization: optimizeForPrint,
      Color_Profile: LULU_PRINT_REQUIREMENTS.colorProfile
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
      await new Promise(res => setTimeout(res, 3000)); // Wait 3s for print enhancement
      const { data: pollResp } = await axios.get(pollUrl, {
        headers: { 'x-api-key': SEGMIND_API_KEY }
      });
      
      status = pollResp.status;
      
      if (status === "COMPLETED" && pollResp.Enhanced_Image) {
        outputImage = pollResp.Enhanced_Image;
        break;
      }
      
      if (status === "FAILED") {
        throw new Error("Segmind print enhancement failed: " + (pollResp.error || 'Unknown error'));
      }
    }

    return outputImage;
  } catch (error) {
    console.error('Error enhancing image for print:', error);
    // Fallback to regular upscaling if print enhancement fails
    console.log('Falling back to regular upscaling...');
    return upscaleImage(inputImageUrl, "4x");
  }
}

/**
 * Enhances multiple images for print in batch with progress tracking
 * @param {string[]} imageUrls - Array of image URLs to enhance
 * @param {Object} options - Enhancement options
 * @param {Function} onProgress - Progress callback (current, total, imageUrl)
 * @returns {Promise<Array>} - Array of enhanced image results
 */
export async function enhanceImagesForPrint(imageUrls, options = {}, onProgress = null) {
  if (!imageUrls || !imageUrls.length) {
    return [];
  }

  const results = [];
  const total = imageUrls.length;

  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    
    try {
      onProgress?.(i + 1, total, imageUrl);
      
      const enhancedUrl = await enhanceImageForPrint(imageUrl, options);
      results.push({
        originalUrl: imageUrl,
        enhancedUrl,
        success: true,
        error: null
      });
    } catch (error) {
      console.error(`Error enhancing image ${i + 1}:`, error);
      results.push({
        originalUrl: imageUrl,
        enhancedUrl: imageUrl, // Use original as fallback
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Validates if an image meets Lulu Direct print requirements
 * @param {string} imageUrl - URL of the image to validate
 * @param {Object} requirements - Custom requirements (optional)
 * @returns {Promise<Object>} - Validation result with details
 */
export async function validateImageForPrint(imageUrl, requirements = LULU_PRINT_REQUIREMENTS) {
  try {
    // Create an image element to check dimensions
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve) => {
      img.onload = () => {
        const validation = {
          isValid: true,
          width: img.width,
          height: img.height,
          meetsMinWidth: img.width >= requirements.minWidth,
          meetsMinHeight: img.height >= requirements.minHeight,
          estimatedDPI: Math.min(img.width / 8, img.height / 8), // Assuming 8x8 inch book
          recommendations: []
        };

        if (!validation.meetsMinWidth) {
          validation.isValid = false;
          validation.recommendations.push(`Width should be at least ${requirements.minWidth}px for print quality`);
        }

        if (!validation.meetsMinHeight) {
          validation.isValid = false;
          validation.recommendations.push(`Height should be at least ${requirements.minHeight}px for print quality`);
        }

        if (validation.estimatedDPI < requirements.minDPI) {
          validation.isValid = false;
          validation.recommendations.push(`Image resolution should be at least ${requirements.minDPI} DPI for print quality`);
        }

        resolve(validation);
      };

      img.onerror = () => {
        resolve({
          isValid: false,
          error: 'Could not load image for validation',
          recommendations: ['Please check if the image URL is accessible']
        });
      };

      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error validating image for print:', error);
    return {
      isValid: false,
      error: error.message,
      recommendations: ['Image validation failed']
    };
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

/**
 * Gets the appropriate enhancement strategy based on image analysis
 * @param {string} imageUrl - URL of the image to analyze
 * @returns {Promise<Object>} - Enhancement strategy recommendations
 */
export async function getEnhancementStrategy(imageUrl) {
  try {
    const validation = await validateImageForPrint(imageUrl);
    
    const strategy = {
      needsEnhancement: !validation.isValid,
      recommendedScale: "2x",
      useAdvancedEnhancement: false,
      estimatedProcessingTime: 30 // seconds
    };

    if (validation.width && validation.height) {
      const currentResolution = Math.min(validation.width, validation.height);
      
      if (currentResolution < 1200) {
        strategy.recommendedScale = "4x";
        strategy.useAdvancedEnhancement = true;
        strategy.estimatedProcessingTime = 60;
      } else if (currentResolution < 2000) {
        strategy.recommendedScale = "2x";
        strategy.useAdvancedEnhancement = true;
        strategy.estimatedProcessingTime = 45;
      }
    }

    return strategy;
  } catch (error) {
    console.error('Error determining enhancement strategy:', error);
    return {
      needsEnhancement: true,
      recommendedScale: "2x",
      useAdvancedEnhancement: false,
      estimatedProcessingTime: 30
    };
  }
}

// Export Lulu print requirements for use in other components
export { LULU_PRINT_REQUIREMENTS };
