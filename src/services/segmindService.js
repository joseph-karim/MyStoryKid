import axios from 'axios';

const SEGMIND_API_KEY = import.meta.env.VITE_SEGMIND_API_KEY;
// Assuming the specific endpoint for Flux PuLID. Verify from Segmind docs.
const FLUX_PULID_URL = 'https://api.segmind.com/v1/flux-pulid'; 
const CONSISTENT_CHARACTER_URL = 'https://api.segmind.com/v1/consistent-character';
// Define the specific workflow URL
const PIXELFLOW_WORKFLOW_URL = "https://api.segmind.com/workflows/67f4b79fcd0ffd34e79d0b8e-v1"; 

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

/**
 * Generates an image using Segmind Consistent Character API.
 * @param {string} referenceImageBase64 - Base64 data URL ('data:image/...') of the reference image (Dzine preview).
 * @param {string} pagePrompt - The prompt describing the desired scene/action for the page.
 * @param {string} styleKeywords - Descriptive keywords for the art style.
 * @returns {Promise<string>} - Base64 data URL of the generated image.
 */
export const generateConsistentCharacter = async (referenceImageBase64, pagePrompt, styleKeywords) => {
  if (!SEGMIND_API_KEY) throw new Error('Segmind API key is missing.');
  
  // Input Validation
  if (!referenceImageBase64 || !referenceImageBase64.startsWith('data:image')) {
       throw new Error('Valid reference image (Base64 Data URL) is required for Segmind.');
  }
  if (!pagePrompt) throw new Error('A page prompt is required.');

  // Combine prompt and style keywords
  const fullPrompt = `${pagePrompt}, ${styleKeywords || "children's book illustration"}`; // Add default keywords if none provided

  const payload = {
    prompt: fullPrompt.substring(0, 1000), // Respect potential length limits
    negative_prompt: "low quality, blurry, deformed, text, signature, watermark, multiple people, bad anatomy, fused fingers, extra limbs", // Enhanced negative prompt
    subject: referenceImageBase64, // Send Base64 Data URL directly
    // output_format: "webp", // Keep default
    // output_quality: 80, // Keep default
    randomise_poses: false, // Set to false to better match prompt pose if possible
    // number_of_outputs: 1, // Keep default
  };

  console.log("Sending payload to Segmind Consistent Character API:", { ...payload, subject: `[Base64 Data: ${referenceImageBase64.substring(0,50)}...]` });

  try {
    const response = await axios.post(CONSISTENT_CHARACTER_URL, payload, {
      headers: {
        'x-api-key': SEGMIND_API_KEY,
        'Content-Type': 'application/json',
      },
      responseType: 'blob', // Expecting image data back directly
      timeout: 90000, // 90 seconds timeout (adjust if needed)
    });

    // Log remaining credits if header exists
    if (response.headers['x-remaining-credits']) {
         console.log(`Segmind Credits Remaining: ${response.headers['x-remaining-credits']}`);
    }

    // Check if response is an image blob
    if (response.data instanceof Blob && response.data.type.startsWith('image/')) {
      console.log(`Segmind API returned a ${response.data.type} blob.`);
      // Convert Blob to Base64 Data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = (error) => {
           console.error("Error converting Segmind response blob to Base64:", error);
           reject(new Error("Failed to read Segmind image response."));
        };
        reader.readAsDataURL(response.data);
      });
    } else {
      // If the response wasn't the expected image blob
      console.error("Unexpected response type from Segmind:", response.data);
      let errorDetails = 'Unexpected response format.';
      try {
        // Try to decode if possible (assuming ArrayBuffer or text)
        if (response.data instanceof ArrayBuffer) {
          errorDetails = new TextDecoder().decode(response.data);
        } else if (typeof response.data === 'object'){
          errorDetails = JSON.stringify(response.data)
        } else {
          errorDetails = String(response.data);
        }
        // Attempt to parse if it looks like JSON
        if (errorDetails.startsWith('{')) {
           errorDetails = JSON.stringify(JSON.parse(errorDetails));
        }
      } catch (e) { /* Ignore parsing/decoding error */ }
      throw new Error(`Segmind API did not return a valid image. Response: ${errorDetails}`);
    }
  } catch (error) {
     let errorMessage = error.message;
     if (axios.isAxiosError(error)) {
       const statusCode = error.response?.status;
       let errorData = 'No additional data.';
       try {
         // Try to decode response data if it exists
         if (error.response?.data) {
            if (error.response.data instanceof Blob) {
               errorData = await error.response.data.text();
            } else if (error.response.data instanceof ArrayBuffer) {
              errorData = new TextDecoder().decode(error.response.data); 
            } else if (typeof error.response.data === 'object'){
               errorData = JSON.stringify(error.response.data);
            } else {
               errorData = String(error.response.data);
            }
         }
       } catch (e) { /* Ignore decoding error */ }

       errorMessage = `Segmind API Error ${statusCode || '(Network Error)'}: ${errorData}`; 
       if (error.code === 'ECONNABORTED') errorMessage = 'Segmind API request timed out (90 seconds).';
       if (statusCode === 406) errorMessage = 'Segmind API Error: Not enough credits or invalid input.'; // 406 can be credits or bad input
       if (statusCode === 401) errorMessage = 'Segmind API Error: Invalid API Key.';
       if (statusCode === 400) errorMessage = `Segmind API Error: Bad Request - ${errorData}`; // Provide more details for 400
       if (statusCode === 500) errorMessage = `Segmind API Error: Internal Server Error - ${errorData}`;
     }
     console.error('Error calling Segmind API:', errorMessage);
     throw new Error(errorMessage); // Re-throw the specific error
  }
};

// Helper function for polling
const pollForResult = async (pollUrl, apiKey, timeout = 180000, interval = 4000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        try {
            console.log(`Polling Segmind: ${pollUrl}`);
            const response = await axios.get(pollUrl, { headers: { 'x-api-key': apiKey } });

            if (response.data) {
                 // Log remaining credits
                 if (response.headers && response.headers['x-remaining-credits']) {
                     console.log(`Segmind Credits Remaining: ${response.headers['x-remaining-credits']}`);
                 }

                if (response.data.status === "SUCCEEDED") {
                    // Extract image URL from the specific output field name ('image_c2wja')
                    const imageUrl = response.data.output?.image_c2wja || response.data.image_c2wja;
                    if (!imageUrl) {
                        console.error("Polling Succeeded but output image URL ('image_c2wja') not found:", response.data);
                        throw new Error("Workflow succeeded but image URL is missing in response.");
                    }
                    console.log("Segmind Polling Succeeded:", imageUrl);
                    return imageUrl;
                } else if (response.data.status === "FAILED") {
                    console.error("Segmind Workflow execution failed:", response.data);
                    throw new Error(`Workflow failed: ${response.data.error || 'Unknown error'}`);
                } else {
                    // Still QUEUED or PROCESSING
                    console.log(`Segmind Status: ${response.data.status}`);
                }
            }
        } catch (error) {
            console.error("Segmind Polling error:", error.message);
            // Don't throw immediately, allow retries within timeout
            // If the error is critical (e.g., 404 on pollUrl), might want to throw
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                 throw new Error("Polling URL not found (404). Workflow may have expired or request ID is invalid.");
            }
        }
        await new Promise(resolve => setTimeout(resolve, interval)); // Wait before next poll
    }
    throw new Error("Segmind Workflow polling timed out.");
};

/**
 * Generates an illustration using a deployed Segmind PixelFlow workflow.
 * Handles asynchronous polling. Returns BASE RESOLUTION image URL.
 */
export const generateIllustrationWithWorkflow = async (referenceImageUrl, characterPrompt, scenePrompt) => {
    if (!SEGMIND_API_KEY) throw new Error('Segmind API key is missing.');
    
    // API expects URL for 'image_rqcw4', ensure reference is a URL
    if (!referenceImageUrl || typeof referenceImageUrl !== 'string' || !referenceImageUrl.startsWith('http')) {
       console.error("PixelFlow workflow expects a URL for reference image ('image_rqcw4'), received:", typeof referenceImageUrl);
       throw new Error('Invalid reference image format for this PixelFlow workflow (URL expected).');
    }
    if (!characterPrompt) throw new Error('Character prompt is required.');
    if (!scenePrompt) throw new Error('Scene prompt is required.');

    const payload = {
        // Match exact input names from the API documentation
        character_prompt: characterPrompt,
        image_rqcw4: referenceImageUrl, // Use the Dzine preview URL
        scene_prompt: scenePrompt,
        // Add other inputs if your specific workflow requires them (e.g., seed, negative_prompt)
        // "seed": 42, 
        // "negative_prompt": "low quality, blurry..." 
    };

    console.log("Sending payload to Segmind PixelFlow Workflow:", payload);

    try {
        // Initial POST request to start the workflow
        const initialResponse = await axios.post(PIXELFLOW_WORKFLOW_URL, payload, {
            headers: {
                'x-api-key': SEGMIND_API_KEY,
                'Content-Type': 'application/json',
            },
            timeout: 30000 // Timeout for initial request (30 seconds)
        });

        if (initialResponse.data && initialResponse.data.poll_url) {
            console.log(`Segmind Workflow started. Request ID: ${initialResponse.data.request_id}. Polling URL: ${initialResponse.data.poll_url}`);
            // Start polling for the result using the dedicated helper
            return await pollForResult(initialResponse.data.poll_url, SEGMIND_API_KEY);
        } else {
            console.error("Unexpected initial response from Segmind PixelFlow:", initialResponse.data);
            throw new Error('Failed to start Segmind PixelFlow workflow. Response missing poll_url.');
        }

    } catch (error) {
         let errorMessage = error.message;
         if (axios.isAxiosError(error)) {
             console.error('Axios error details:', {
                 message: error.message,
                 code: error.code,
                 status: error.response?.status,
                 data: error.response?.data,
                 config: error.config
            });
            if (error.response) {
                // Extract more specific error message if available
                 const apiError = error.response.data?.detail || error.response.data?.error || error.response.data;
                 errorMessage = `Segmind API Error (${error.response.status}): ${apiError || error.message}`;
             } else if (error.request) {
                 errorMessage = 'Segmind API Error: No response received from server.';
             } else {
                 errorMessage = `Segmind API Error: ${error.message}`;
             }
             if (error.code === 'ECONNABORTED') {
                 errorMessage = 'Segmind API request timed out.';
             }
         }
         console.error('Error calling Segmind PixelFlow API:', errorMessage);
         // Re-throw a cleaner error message
         throw new Error(errorMessage);
    }
};

// --- Keep upscaleImage function defined but unused in main flow ---
// /** * Upscales an image using Segmind ESRGAN API (FOR LATER PRINT USE). */
// export const upscaleImage = async (imageBase64, scale = 4) => { ... };