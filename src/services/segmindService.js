import axios from 'axios';
import { uploadImageToSupabase } from './supabaseClient';

const SEGMIND_API_KEY = import.meta.env.VITE_SEGMIND_API_KEY;
// Assuming the specific endpoint for Flux PuLID. Verify from Segmind docs.
const FLUX_PULID_URL = 'https://api.segmind.com/v1/flux-pulid'; 
const CONSISTENT_CHARACTER_URL = 'https://api.segmind.com/v1/consistent-character';
// Define the specific workflow URL
const PIXELFLOW_WORKFLOW_URL = "https://api.segmind.com/workflows/67f4b79fcd0ffd34e79d0b8e-v1";
const CHARACTER_SWAP_URL = "https://api.segmind.com/workflows/678aa4026426baad7e5392fb-v6"; // Added for Character Swap workflow
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
                    // Extract image URL from the specific output field name ('character_swap_image') for Character Swap workflow
                    const imageUrl = response.data.output?.character_swap_image || response.data.character_swap_image;
                    if (!imageUrl) {
                        console.error("Polling Succeeded but output image URL ('character_swap_image') not found:", response.data);
                        throw new Error("Workflow succeeded but 'character_swap_image' URL is missing in response.");
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
 * Swaps a character in an image using Segmind's Character Swap workflow.
 * Handles asynchronous polling. Returns the final image URL.
 * @param {string} sceneImageUrl - URL of the base scene image (from Dzine).
 * @param {string} referenceCharacterUrl - URL of the reference character image (Dzine preview).
 * @param {string} characterSelector - Text description to help identify the character to swap (e.g., "the girl", "the robot").
 * @returns {Promise<string>} - The URL of the image with the character swapped.
 */
export const swapCharacterInImage = async (sceneImageUrl, referenceCharacterUrl, characterSelector) => {
    if (!SEGMIND_API_KEY) throw new Error('Segmind API key missing.');
    if (!sceneImageUrl || !referenceCharacterUrl) throw new Error('Both scene image URL and reference character URL are required.');
    if (!characterSelector) throw new Error('Character selector text is required.');

    // Payload structure from the Character Swap API docs
    const payload = {
        character_image: sceneImageUrl,          // Dzine scene URL
        reference_character_image: referenceCharacterUrl, // Dzine preview URL
        select_character: characterSelector      // Text to guide swap
    };

    console.log("Sending payload to Segmind Character Swap:", payload);

    try {
        const initialResponse = await axios.post(CHARACTER_SWAP_URL, payload, {
            headers: { 'x-api-key': SEGMIND_API_KEY, 'Content-Type': 'application/json' },
            timeout: 30000 // 30 second timeout for initial request
        });

        if (initialResponse.data && initialResponse.data.poll_url) {
            console.log(`Swap workflow started. Polling: ${initialResponse.data.poll_url}`);
            // Use the modified pollForResult which looks for 'character_swap_image'
            const finalImageUrl = await pollForResult(initialResponse.data.poll_url, SEGMIND_API_KEY);
            console.log("Segmind Character Swap successful. Final image URL:", finalImageUrl);
            return finalImageUrl;
        } else {
            console.error("Unexpected initial response from Segmind Character Swap:", initialResponse.data);
            throw new Error('Failed to start Segmind Character Swap workflow. Response missing poll_url.');
        }
    } catch (error) {
         let errorMessage = error.message;
         if (axios.isAxiosError(error)) {
             console.error('Axios error details (Character Swap):', {
                 message: error.message,
                 code: error.code,
                 status: error.response?.status,
                 data: error.response?.data,
                 config: error.config
            });
            if (error.response) {
                 const apiError = error.response.data?.detail || error.response.data?.error || error.response.data;
                 errorMessage = `Segmind Character Swap API Error (${error.response.status}): ${apiError || error.message}`;
             } else if (error.request) {
                 errorMessage = 'Segmind Character Swap API Error: No response received from server.';
             } else {
                 errorMessage = `Segmind Character Swap API Error: ${error.message}`;
             }
             if (error.code === 'ECONNABORTED') {
                 errorMessage = 'Segmind Character Swap API request timed out.';
             }
         }
         console.error('Error calling Segmind Character Swap API:', errorMessage);
         throw new Error(errorMessage); // Re-throw a cleaner error message
    }
};

/**
 * Uploads a Base64 image to ImgBB to get a temporary URL
 * @param {string} base64Image - Base64 image data URL
 * @returns {Promise<string>} - Temporary image URL
 */
const uploadBase64ToGetUrl = async (base64Image) => {
    // If it's already a URL, just return it
    if (base64Image.startsWith('http')) {
        return base64Image;
    }
    
    // Validate the base64 image format
    if (!base64Image || !base64Image.startsWith('data:image')) {
        throw new Error('Invalid Base64 image format');
    }
    
    // Try Supabase upload first, then fall back to other services if needed
    try {
        // Use our Supabase client to upload the image
        console.log('Uploading image to Supabase Storage...');
        const publicUrl = await uploadImageToSupabase(base64Image);
        console.log('Image successfully uploaded to Supabase, public URL:', publicUrl);
        return publicUrl;
    } catch (supabaseError) {
        console.warn('Supabase upload failed, trying fallback services:', supabaseError.message);
        
        // Extract the base64 data without the prefix for fallback services
        const base64Data = base64Image.split(',')[1];
        if (!base64Data) {
            throw new Error('Invalid Base64 image format');
        }
        
        // Fallback services
        const fallbackServices = [
            // ImgBB - fallback service 1
            async () => {
                const apiKey = import.meta.env.VITE_IMGBB_API_KEY || 'f9cae7aa8c1df07a54e5c8cf11febe35';
                const formData = new FormData();
                formData.append('image', base64Data);
                
                const response = await axios.post(`https://api.imgbb.com/1/upload?key=${apiKey}`, formData);
                
                if (response.data && response.data.data && response.data.data.url) {
                    console.log('Base64 image uploaded to ImgBB, temporary URL:', response.data.data.url);
                    return response.data.data.url;
                }
                throw new Error('ImgBB did not return a valid URL');
            },
            // Free Image Host - fallback service 2
            async () => {
                const formData = new FormData();
                formData.append('source', base64Data);
                
                const response = await axios.post('https://freeimage.host/api/1/upload', formData, {
                    params: {
                        key: '6d207e02198a847aa98d0a2a901485a5'
                    }
                });
                
                if (response.data && response.data.image && response.data.image.url) {
                    console.log('Base64 image uploaded to FreeImageHost, temporary URL:', response.data.image.url);
                    return response.data.image.url;
                }
                throw new Error('FreeImageHost did not return a valid URL');
            }
        ];
        
        // Try each fallback service in sequence
        let lastError = supabaseError;
        for (const service of fallbackServices) {
            try {
                return await service();
            } catch (error) {
                console.warn('Fallback service failed:', error.message);
                lastError = error;
            }
        }
        
        // If all services fail, throw the last error
        throw lastError || new Error('All image upload services failed');
    }
};
// Helper function for fallback when Base64 upload fails
const directBase64Illustration = () => {
    console.warn("Falling back to placeholder image URL as Base64 upload failed.");
    return 'https://mystorykid.com/placeholder-fallback.jpg'; // Placeholder URL
};


/**
 * Generates an illustration using a deployed Segmind PixelFlow workflow.
 * Handles asynchronous polling. Returns BASE RESOLUTION image URL.
 */
export const generateIllustrationWithWorkflow = async (referenceImageUrl, characterPrompt, scenePrompt) => {
    if (!SEGMIND_API_KEY) throw new Error('Segmind API key is missing.');
    
    // Ensure we have a URL for the reference image - convert Base64 to URL if needed
    let imageUrl = referenceImageUrl;
    if (referenceImageUrl && typeof referenceImageUrl === 'string' && referenceImageUrl.startsWith('data:image')) {
        console.log('Converting Base64 reference image to URL for PixelFlow workflow');
        try {
            imageUrl = await uploadBase64ToGetUrl(referenceImageUrl);
        } catch (uploadError) {
            console.error('Failed to convert Base64 to URL, using fallback:', uploadError);
            // Fallback to placeholder if upload fails
            imageUrl = directBase64Illustration();
        }
    }
    
    // API expects URL for 'image_rqcw4', ensure reference is a URL
    if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.startsWith('http')) {
       console.error("PixelFlow workflow expects a URL for reference image ('image_rqcw4'), received:", typeof imageUrl);
       throw new Error('Invalid reference image format for this PixelFlow workflow (URL expected).');
    }
    if (!characterPrompt) throw new Error('Character prompt is required.');
    if (!scenePrompt) throw new Error('Scene prompt is required.');

    const payload = {
        // Match exact input names from the API documentation
        character_prompt: characterPrompt,
        image_rqcw4: imageUrl, // Use the URL (either original or converted from Base64)
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
            const segmindImageUrl = await pollForResult(initialResponse.data.poll_url, SEGMIND_API_KEY);
            console.log("Segmind workflow successful. Generated image URL (from Segmind):", segmindImageUrl);

            // --- New: Fetch image from Segmind URL, convert, and upload to Supabase ---
            try {
                console.log(`Fetching image data from Segmind URL: ${segmindImageUrl}`);
                const imageResponse = await fetch(segmindImageUrl);
                if (!imageResponse.ok) {
                    throw new Error(`Failed to fetch image from Segmind URL: ${imageResponse.status} ${imageResponse.statusText}`);
                }
                const imageBlob = await imageResponse.blob();
                console.log(`Fetched image as Blob (${imageBlob.size} bytes, type: ${imageBlob.type})`);

                // Convert Blob to Base64 Data URL
                const base64Image = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = (error) => {
                        console.error("Error converting fetched blob to Base64:", error);
                        reject(new Error("Failed to read fetched image blob."));
                    };
                    reader.readAsDataURL(imageBlob);
                });
                console.log("Converted fetched image to Base64 Data URL.");

                // Upload to Supabase Storage (using the dedicated bucket)
                const supabaseBucketName = 'generated-illustrations'; // Use dedicated bucket
                console.log(`Uploading generated image to Supabase bucket: ${supabaseBucketName}`);
                const supabasePublicUrl = await uploadImageToSupabase(base64Image, supabaseBucketName);
                console.log(`Successfully uploaded to Supabase. Public URL: ${supabasePublicUrl}`);

                return supabasePublicUrl; // Return the permanent Supabase URL

            } catch (uploadError) {
                console.error(`Failed to fetch/upload image from Segmind URL (${segmindImageUrl}) to Supabase:`, uploadError);
                // Decide on fallback behavior: throw error, return Segmind URL, or return placeholder?
                // For now, let's re-throw the error to make the failure explicit.
                throw new Error(`Failed to process and store generated image: ${uploadError.message}`);
            }
            // --- End of new section ---
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