const API_BASE_URL = 'https://papi.dzine.ai/openapi/v1';
// Use environment variable first, fall back to the provided token if environment variable is not available
const API_KEY = import.meta.env.VITE_DZINE_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJPcGVuQUlEIjo3MSwiT3BlblVJRCI6MTE0MDk5NDMxNzM1NSwiTUlEIjo5OTg0MzMxLCJDcmVhdGVUaW1lIjoxNzQzNDQwMzk3LCJpc3MiOiJkemluZSIsInN1YiI6Im9wZW4ifQ.NfiLkQNPIhTlc7aaT0l_2Fs7AHwFQBgI3U3RlN5fzV4';

// --- Start: Style Keyword Mapping for Segmind --- //

// Example mapping (TODO: Add all relevant Dzine styles used in the app)
const dzineToSegmindKeywordsMap = {
  // Watercolor Styles
  'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f': "watercolor art, children's book illustration, soft colors, whimsical", // PixiePop 3D (Assuming this maps to watercolor)
  'Style-aquarelle_life': "aquarelle painting style, watercolor life, vibrant details", // Placeholder - get actual code
  'Style-watercolor_whimsy': "watercolor whimsy style, pastel colors, lighthearted", // Placeholder
  
  // Cartoon/Storybook Styles
  'Style-cheerful_storybook': "cheerful storybook style, bright colors, cartoonish, simple lines", // Placeholder
  'Style-minimalist_cutesy': "minimalist cutesy style, simple shapes, flat colors, adorable", // Placeholder
  'Style-storytime_whimsy': "storytime whimsy style, charming, playful characters, warm colors", // Placeholder
  'Style-9cde0ca9-78f0-4be5-a6a1-44dd74cfbaa0': "playful cartoon style, vibrant, expressive characters", // Added from logs
  'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1': "adventure cartoon style, dynamic poses, bright scenery", // Added from logs
  
  // Other Potential Styles (Map based on visual similarity)
  'Style-enchanted_elegance': "enchanted elegance style, fantasy illustration, detailed, soft lighting", // Placeholder
  'Style-line_and_wash': "line and wash style, ink outlines, watercolor wash, sketch aesthetic", // Placeholder
  'Style-golden_hour': "golden hour lighting, warm tones, soft shadows, realistic fantasy", // Placeholder
  
  // Add more style mappings here...
};

/**
 * Gets descriptive keywords for Segmind based on a Dzine style code.
 * @param {string} dzineCode - The Dzine style code (e.g., 'Style-7a23...').
 * @returns {string} - A string of descriptive keywords for Segmind prompt, or a default.
 */
export const getKeywordsForDzineStyle = (dzineCode) => {
  if (!dzineCode) return "children's book illustration style"; // Default if no code provided
  return dzineToSegmindKeywordsMap[dzineCode] || "children's book illustration style, colorful"; 
};

// --- End: Style Keyword Mapping --- //

// Generic fetch handler for Dzine API calls
export const fetchDzine = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Create header with direct API key (per documentation)
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': API_KEY // Use API key directly as shown in documentation
    };
    
    console.log(`Calling Dzine API: ${url}`);
    
    // Make the request to the API
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });
    
    // Log response status and headers
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    // Get the response text first for analysis
    const responseText = await response.text();
    
    // Always log the response body for debugging (truncate if too long)
    const truncatedResponse = responseText.length > 1000 
      ? responseText.substring(0, 1000) + '...' 
      : responseText;
    console.log(`Response body (${responseText.length} chars): ${truncatedResponse}`);
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing response as JSON:', parseError);
      
      // If status is success but not JSON, return the raw text
      if (response.ok) {
        return { text: responseText, status: response.status };
      }
      
      throw new Error(`API returned non-JSON response: ${response.status} ${response.statusText}`);
    }
    
    // Check for error codes in response body
    if (data && data.code && data.code !== 200) {
      console.error('Dzine API error in response body:', data);
      throw new Error(`API error in response body (Code: ${data.code}): ${data.msg || 'Unknown error'}`);
    }
    
    // Return data even if status is not 200, as some APIs return error details as JSON
    return data;
  } catch (error) {
    console.error('Error in fetchDzine:', error);
    throw error;
  }
};

// Fetch all styles from Dzine API
export const getDzineStyles = async () => {
  try {
    console.log('Attempting to fetch Dzine styles...');
    
    // Run full style analysis
    await analyzeAllStyles();
    
    // Using fetchDzine function with the correct endpoint and query parameters
    const data = await fetchDzine('/style/list?page_no=0&page_size=100', { 
      method: 'GET'
    });
    
    // Log available styles for debugging
    if (data && data.data && data.data.list) {
      console.log('Available Dzine styles:', data.data.list.slice(0, 5).map(style => ({
        name: style.name, 
        style_code: style.style_code
      })), '... and more');
      
      // Store styles in local cache for reuse
      localStorage.setItem('dzine_styles', JSON.stringify(data.data.list));
      
      return { list: data.data.list };
    } else {
      console.error('Unexpected API response structure:', data);
      throw new Error('API response did not contain expected style list');
    }
  } catch (error) {
    console.error('Error in getDzineStyles:', error);
    
    // Try to use cached styles if available
    const cachedStyles = localStorage.getItem('dzine_styles');
    if (cachedStyles) {
      console.log('Using cached styles');
      return { list: JSON.parse(cachedStyles) };
    }
    
    throw error;
  }
};

// Helper function to get a style by name (case insensitive)
export const getStyleByName = async (styleName) => {
  try {
    // Try to get from cache first
    const cachedStyles = localStorage.getItem('dzine_styles');
    let styles = [];
    
    if (cachedStyles) {
      styles = JSON.parse(cachedStyles);
    } else {
      // If not in cache, fetch from API
      const data = await getDzineStyles();
      styles = data.list || [];
    }
    
    // Find style by name (case insensitive)
    const style = styles.find(s => 
      s.name.toLowerCase() === styleName.toLowerCase() ||
      s.name.toLowerCase().includes(styleName.toLowerCase())
    );
    
    if (!style) {
      console.log(`Style not found for name: ${styleName}, using default style`);
      // Return PixiePop 3D as default style
      return 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f';
    }
    
    return style.style_code;
  } catch (error) {
    console.error('Error getting style by name:', error);
    // Return PixiePop 3D as fallback
    return 'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f';
  }
};

// Helper function to get all available styles
export const getAvailableStyles = async () => {
  try {
    // Try to get from cache first
    const cachedStyles = localStorage.getItem('dzine_styles');
    
    if (cachedStyles) {
      const styles = JSON.parse(cachedStyles);
      // Debug: Print all available styles
      console.log('All available styles:');
      styles.forEach(style => {
        console.log(`${style.name}: ${style.style_code}`);
      });
      return styles;
    }
    
    // If not in cache, fetch from API
    const data = await getDzineStyles();
    if (data.list) {
      // Debug: Print all available styles
      console.log('All available styles:');
      data.list.forEach(style => {
        console.log(`${style.name}: ${style.style_code}`);
      });
    }
    return data.list || [];
  } catch (error) {
    console.error('Error getting available styles:', error);
    return [];
  }
};

// 2. Get Token Balance (Example, not strictly needed for img2img)
export const getTokenBalance = async () => {
  return fetchDzine('/get_token_balance', { method: 'GET' });
};

// 3. Upload Image (Optional, we'll use base64 first)
// export const uploadImage = async (formData) => { ... };

// Add new function to upload file to Dzine CDN
export const uploadFileToDzine = async (file) => {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', file);

    // Make the API call
    const response = await fetchDzine('/file/upload', {
      method: 'POST',
      body: formData
    });

    console.log('File upload response:', response);
    return response.data.file_path;
  } catch (error) {
    console.error('Error uploading file to Dzine:', error);
    throw error;
  }
};

// 5. Image-to-Image Task Creation (Corrected Implementation)
export const createImg2ImgTask = async (payload, applyFaceMatch = true) => {
  try {
    // --- Start Validation based on Documentation ---
    if (!payload.style_code) throw new Error('style_code is required');
    if (!payload.prompt) throw new Error('prompt is required');
    if (!payload.images || !Array.isArray(payload.images) || payload.images.length === 0) {
      throw new Error('images array is required and must not be empty');
    }
    if (!payload.images[0].base64_data && !payload.images[0].url) {
      throw new Error('Each image object must contain either base64_data or url');
    }
    if (payload.images[0].base64_data && !payload.images[0].base64_data.startsWith('data:image')) {
      // Ensure base64_data includes the data URI prefix as per docs example
      throw new Error('base64_data must be a valid data URL (e.g., data:image/png;base64,...)');
    }
    // --- End Validation ---

    // Determine face_match based on the flag
    const faceMatchValue = applyFaceMatch ? 1 : 0;
    console.log(`Setting face_match based on applyFaceMatch flag: ${faceMatchValue}`); // Log decision

    // Prepare the payload exactly as per documentation
    let apiPayload = {
      prompt: payload.prompt.substring(0, 800), // Ensure prompt length limit
      style_code: payload.style_code,
      images: payload.images.map(img => ({ // Map to ensure only allowed fields are sent
        base64_data: img.base64_data || undefined, // Send only if present
        url: img.url || undefined // Send only if present
      })),
      // Optional fields with defaults or from payload
      style_intensity: payload.style_intensity !== undefined ? payload.style_intensity : 0.8, // Default if not provided
      structure_match: payload.structure_match !== undefined ? payload.structure_match : 0.8, // Default if not provided
      quality_mode: payload.quality_mode !== undefined ? payload.quality_mode : 1, // Use 1 for better quality based on logs
      color_match: payload.color_match !== undefined ? payload.color_match : 0, // Default if not provided
      face_match: faceMatchValue, // Use calculated face_match value
      seed: payload.seed !== undefined ? payload.seed : Math.floor(Math.random() * 2147483647) + 1, // Random seed if not provided
      generate_slots: payload.generate_slots || [1, 1], // Default for Model X is [1, 1] based on wizard code
      output_format: payload.output_format || 'webp', // Default
      negative_prompt: payload.negative_prompt || '', // Optional
    };

    // Log the final payload being sent (masking base64 data)
    console.log('Creating img2img task with API payload:', JSON.stringify({
      ...apiPayload,
      images: apiPayload.images.map(img => ({
        base64_data: img.base64_data ? 'base64_data_present' : undefined,
        url: img.url
      }))
    }, null, 2));

    // Use the correct endpoint from the documentation
    const endpoint = '/create_task_img2img';
    console.log(`Calling documented img2img endpoint: POST ${endpoint}`);

    // Make the API call using fetchDzine helper
    const response = await fetchDzine(endpoint, {
      method: 'POST',
      body: JSON.stringify(apiPayload)
    });

    // Log the raw response for debugging
    console.log('Raw response from img2img API:', JSON.stringify(response));

    // Process response - check for task_id
    if (response && response.code === 200 && response.data && response.data.task_id) {
      console.log('Img2img task created successfully:', response.data.task_id);
      return response.data; // Return the data part containing task_id
    } else if (response && response.task_id) {
       console.log('Img2img task created successfully (direct task_id):', response.task_id);
       return { task_id: response.task_id }; // Normalize response
    } else {
      console.error('Invalid response from img2img API:', response);
      const errorMessage = response?.msg || 'Failed to create image generation task, invalid response structure.';
      throw new Error(errorMessage);
    }
  } catch (error) {
    // Log the specific error from validation or API call
    console.error('Error in createImg2ImgTask:', error.message);
    // Re-throw the error so the calling function (generateCharacterPreview) can handle it
    throw error;
  }
};

// 6. Text-to-Image Task Creation
export const createTxt2ImgTask = async (promptText, styleCode, options = {}) => {
  try {
    // Validate required parameters
    if (!promptText) {
      throw new Error('Prompt text is required');
    }
    
    if (!styleCode) {
      console.error('Missing style_code in payload');
      throw new Error('Style code is required');
    }
    
    // Create a properly structured payload according to the API documentation
    const payload = {
      prompt: promptText.substring(0, 800), // Ensure prompt stays within 800 char limit
      style_code: styleCode,
      target_h: options.target_h || 1024, // Default height if not specified
      target_w: options.target_w || 1024, // Default width if not specified
      
      // Optional parameters with defaults
      style_intensity: options.style_intensity !== undefined ? options.style_intensity : 0.8,
      quality_mode: options.quality_mode !== undefined ? options.quality_mode : 1, // Default to high quality
      seed: options.seed || Math.floor(Math.random() * 2147483647) + 1, // Random seed if not provided
      generate_slots: options.generate_slots || [1, 1, 0, 0], // Default configuration
      output_format: options.output_format || 'webp'
    };
    
    // Log the final request for debugging
    console.log('Sending Text-to-Image request to Dzine API:', JSON.stringify(payload, null, 2));
    
    // Use the EXACT endpoint from the documentation
    const endpoint = '/create_task_txt2img';
    console.log(`Using documented text-to-image endpoint: ${endpoint}`);
    
    const data = await fetchDzine(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    // Log full response for debugging
    console.log(`Raw response from Text-to-Image API:`, JSON.stringify(data));
    
    // Handle response based on documented structure
    if (data && data.code === 200 && data.data && data.data.task_id) {
      console.log(`Success! Task ID: ${data.data.task_id}`);
      return data.data;
    } 
    // Fallback handler for potentially different response structures
    else if (data) {
      console.log(`Processing alternative response structure:`, data);
      
      // Try to extract task_id from different possible locations
      let taskId = null;
      
      if (data.task_id) {
        taskId = data.task_id;
      } else if (data.data && data.data.task) {
        taskId = data.data.task;
      } else if (typeof data === 'string' && data.includes('task_id')) {
        // Try to parse a string response that might contain task_id
        try {
          const parsedData = JSON.parse(data);
          taskId = parsedData.data?.task_id || parsedData.task_id;
        } catch (e) {
          console.error('Failed to parse string response:', e);
        }
      }
      
      if (taskId) {
        console.log(`Found task_id: ${taskId}`);
        return { task_id: taskId };
      }
      
      // If we reach here, we couldn't extract a task_id
      throw new Error('Could not find task_id in API response: ' + JSON.stringify(data));
    } else {
      throw new Error('Empty or invalid response from API');
    }
  } catch (error) {
    console.error('Error in createTxt2ImgTask:', error);
    throw error;
  }
};

// 7. Get Task Progress (Reverted to simpler polling handled by component)
export const getTaskProgress = async (taskId) => {
  if (!taskId) {
    console.error('No task ID provided to getTaskProgress');
    throw new Error('Task ID is required');
  }
  
  try {
    console.log(`Checking progress for task: ${taskId}`);
    
    // Construct the correct endpoint according to docs
    const endpoint = `/get_task_progress/${taskId}`;
    console.log(`Polling task progress using endpoint: GET ${API_BASE_URL}${endpoint}`);
    
    // Use a direct fetch call here, as the component will handle the interval
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY,
        'User-Agent': 'MyStoryKid/1.0',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  
    // Handle 404 specifically
    if (response.status === 404) {
      console.warn(`Task ${taskId} returned 404 - treating as pending`);
      return { status: 'pending', message: 'Task not found or initializing' };
    }
    
    // Handle other non-OK statuses
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error text');
      console.error(`Task ${taskId} API error: ${response.status} ${errorText}`);
      // Return an error object compatible with the component's polling logic
      return { 
        status: 'error', 
        error: `API error: ${response.status}`,
        message: errorText || `API Error ${response.status}` // Provide fallback message
      };
    }
    
    // Process successful response
    const responseText = await response.text();
    if (!responseText || responseText.trim() === '') {
      console.warn(`Task ${taskId} returned empty response - treating as pending`);
      return { status: 'pending', message: 'Empty response from server' };
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error(`Task ${taskId} JSON parse error:`, parseError);
      console.error(`Raw response: "${responseText}"`);
      return { status: 'error', message: 'Invalid JSON response format' };
    }
    
    // Process the JSON data
    if (data) {
      // Log truncated data
      const logData = JSON.stringify(data).length > 1000 
        ? JSON.stringify(data).substring(0, 1000) + '...' 
        : JSON.stringify(data);
      console.log(`Task ${taskId} progress data:`, logData);
      
      // Handle API error codes within the JSON response
      if (data.code && data.code !== 200) {
        console.error(`Task ${taskId} returned error code in JSON:`, data.code, data.msg || 'Unknown error');
        return { 
          status: 'error',
          error: `API error code ${data.code}`,
          message: data.msg || `API Error ${data.code}`
        };
      }
      
      // Normalize the status from various possible fields
      const statusData = data.data || data; // Look in 'data' field or root
      const normalizedStatus = normalizeStatus(statusData.status);
      
      return {
        ...statusData, // Return all fields from the data part
        status: normalizedStatus, // Ensure status is normalized
        error_reason: statusData.error_reason || (normalizedStatus === 'failed' ? 'Unknown failure reason' : '') // Provide fallback error reason
      };

    } else {
      // Should not happen if parsing succeeded, but handle defensively
      console.error('Parsed JSON but data is null/undefined');
      return { status: 'error', message: 'Invalid data structure after parsing' };
    }

  } catch (error) {
    // Catch network errors or other fetch-related issues
    console.error(`Error fetching progress for task ${taskId}:`, error);
    // Return a pending status to allow component to retry polling
    return { status: 'pending', message: `Network error: ${error.message}` };
  }
};

// Helper function to normalize status strings
// (Keep this function as it is useful)
function normalizeStatus(status) {
  if (!status) return 'pending';
  
  const statusStr = String(status).toLowerCase();
  
  // Map various status values to standard ones
  if (['success', 'completed', 'done', 'finish', 'finished'].includes(statusStr)) {
    return 'success';
  }
  
  if (['running', 'processing', 'in_progress', 'pending', 'waiting', 'queued'].includes(statusStr)) {
    return 'running';
  }
  
  if (['failed', 'error', 'failure', 'exception'].includes(statusStr)) {
    return 'failed';
  }
  
  // Default to original status if not recognized
  return statusStr;
}

// Helper function to extract status from various response formats
function extractStatus(data) {
  if (!data || !data.data) {
    console.error("Invalid data structure passed to extractStatus:", data);
    return 'unknown';
  }
  
  const taskData = data.data;
  const status = taskData.status ? taskData.status.toLowerCase() : 'unknown';
  const errorReason = taskData.error_reason || '';
  
  // Debug log for status and reason
  // console.log(`[extractStatus] Raw Status: ${status}, Raw Reason: ${errorReason}`);

  return status;
}

// Simple fallback URL extractor (adjust if needed based on actual failed response structure)
function extractFallbackUrls(data) {
  let urls = [];
  if (data && data.generate_result_slots && Array.isArray(data.generate_result_slots)) {
    urls = data.generate_result_slots.filter(slot => 
      slot && typeof slot === 'string' && slot.startsWith('http')
    );
  }
  // Add other potential locations if the structure varies for failures
  return urls;
}

// Check API access - to diagnose issues with API connectivity
export const checkApiAccess = async () => {
  try {
    console.log('Performing Dzine API connectivity check...');
    console.log('API key exists:', !!API_KEY);
    console.log('API key length:', API_KEY ? API_KEY.length : 0);
    
    // Test with a simple endpoint
    const response = await fetch(`${API_BASE_URL}/style/list?page_no=0&page_size=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY // Direct API key as documented
      }
    });
    
    console.log('API connectivity test - status code:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API connectivity successful:', data.code, data.msg);
      return {
        success: true,
        message: 'API connection successful',
        status: response.status
      };
    } else {
      const text = await response.text();
      console.error('API connectivity failed:', response.status, text);
      return {
        success: false,
        message: `API returned error: ${response.status}`,
        status: response.status,
        details: text
      };
    }
  } catch (error) {
    console.error('API connectivity error:', error);
    return {
      success: false,
      message: `API connection error: ${error.message}`,
      error
    };
  }
};

// Helper function to determine if we need to prefix the API key
// Some APIs require "Bearer " prefix, others don't
export const getFormattedApiKey = () => {
  if (!API_KEY) return '';
  
  // If already has a prefix, use as is
  if (API_KEY.startsWith('Bearer ')) return API_KEY;
  
  // Otherwise, try both formats
  return API_KEY;
};

// Map our human-readable style names to their API style codes
const styleCodeMap = {
  // Whimsical & Soft
  'watercolor_whimsy': { name: 'Watercolor Whimsy', code: 'Style-7f3f81ad-1c2d-4a15-944d-66bf549641de' },
  'enchanted_character': { name: 'Enchanted Character', code: 'Style-d7081cbc-bdb3-4d75-8eed-88d42813b31e' },
  'minimalist_cutesy': { name: 'Minimalist Cutesy', code: 'Style-2bdfdfec-0ddb-4bca-aa2a-cca1abbc48f7' },
  'soft_radiance': { name: 'Soft Radiance', code: 'Style-7c3af5f6-4945-4eb2-b00b-34f77b0b8d41' },
  'cheerful_storybook': { name: 'Cheerful Storybook', code: 'Style-a941aee9-7964-4445-b76a-7c3ff912f926' },
  'pleasantly_warm': { name: 'Pleasantly Warm', code: 'Style-f8ee0e8d-62ea-48b6-8323-15c5a6c62e2c' },
  'storytime_whimsy': { name: 'Storytime Whimsy', code: 'Style-05c3d679-f8e9-4883-b9c9-adfe0988d1a5' },

  // Classic & Timeless
  'line_and_wash': { name: 'Line & Wash', code: 'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9' },
  'golden_hour': { name: 'Golden Hour', code: 'Style-90a8d36d-9a67-4619-a995-4036fda8474d' },
  'ancient_china': { name: 'Ancient China', code: 'Style-666d19e1-2e33-4e64-95e8-588c8e20b02c' },
  'storybook_charm': { name: 'Storybook Charm', code: 'Style-85480a6c-4aa6-4260-8ad1-a0b7423910cf' },
  'luminous_narratives': { name: 'Luminous Narratives', code: 'Style-ce7b4279-1398-4964-882c-19911e12aef3' },
  'sketch_elegance': { name: 'Sketch Elegance', code: 'Style-e9021405-1b37-4773-abb9-bd80485527b0' },

  // Modern & Colorful
  'cute_exaggeration': { name: 'Cute Exaggeration', code: 'Style-11393e3a-ec40-402f-82cf-57c19bea8d12' },
  'glossy_elegance': { name: 'Glossy Elegance', code: 'Style-04d8cbcf-6496-4d68-997e-516303502507' },
  'fantasy_hero': { name: 'Fantasy Hero', code: 'Style-caa14e89-823b-4f8e-8d84-7368f9cec7cf' },
  'joyful_clay': { name: 'Joyful Clay', code: 'Style-7729f1f6-578b-4035-8514-edaa0637dd6d' },
  'starlit_fantasy': { name: 'Starlit Fantasy', code: 'Style-9cde0ca9-78f0-4be5-a6a1-44dd74cfbaa0' },
  'paper_cutout': { name: 'Paper Cutout', code: 'Style-541a2afd-904a-4968-bc60-8ad0ede22a86' },

  // Realistic & Artistic
  'ceramic_lifelike': { name: 'Ceramic Lifelike', code: 'Style-3f616e35-6423-4c53-aa27-be28860a4a7d' },
  'yarn_realism': { name: 'Yarn Realism', code: 'Style-d77e6917-f36e-42f4-a0f5-427dda9e3deb' },
  'mystical_sovereignty': { name: 'Mystical Sovereignty', code: 'Style-04329eae-1af6-4f06-a97c-f4b2b48516de' },
  'enchanted_elegance': { name: 'Enchanted Elegance', code: 'Style-27caad74-d49c-4b4f-b3c3-88ae56f24a25' },
  'warm_portrait': { name: 'Warm Portrait', code: 'Style-4ab783c7-2955-4092-878e-965162241bf7' },
  'magic_portrait': { name: 'Magic Portrait', code: 'Style-8d281dba-698e-41d0-98d1-6227e4f3c6c4' },
  'vivid_tableaux': { name: 'Vivid Tableaux', code: 'Style-589373f8-1283-4570-baf9-61d02eb13391' },
  'dreamlike_portraiture': { name: 'Dreamlike Portraiture', code: 'Style-c0bde410-94f1-42d1-a1f6-d968aabbf689' },
  'aquarelle_life': { name: 'Aquarelle Life', code: 'Style-ada3a8d4-0e66-4bb0-aab3-e04a0ade4333' },
  // ... add more styles as needed from the API list if they fit categories
};

// Function to get the style code based on the friendly name
export const getStyleCode = (friendlyName) => {
  const style = Object.values(styleCodeMap).find(s => s.name === friendlyName);
  // If already a full style code (starts with "Style-"), use as is
  if (friendlyName && friendlyName.startsWith('Style-')) {
    return friendlyName;
  }
  return style ? style.code : "Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2"; // Fallback to No Style v2 if lookup fails
};

// Function to get the friendly name based on the style code
export const getFriendlyStyleName = (styleCode) => {
  const entry = Object.entries(styleCodeMap).find(([key, value]) => value.code === styleCode);
  return entry ? entry[1].name : 'Unknown Style'; // Return name or a default
};

// Scene name mapping (for the scene dropdown in the wizard)
const sceneNameMap = {
  // Adventure scenes
  space: 'Space Adventure',
  ocean: 'Undersea Quest',
  jungle: 'Jungle Expedition',
  mountains: 'Mountain Journey',
  safari: 'Safari Adventure',
  
  // Bedtime scenes
  dreams: 'Dream Journey',
  stars: 'Starry Night',
  bedroom: 'Bedtime Magic',
  night_forest: 'Moonlit Forest',
  cloud_kingdom: 'Cloud Kingdom',
  
  // Learning scenes
  school: 'School Adventure',
  library: 'Library Quest',
  alphabet_land: 'Alphabet Land',
  zoo_letters: 'Alphabet Zoo',
  garden: 'Garden of Letters',
  
  // Birthday scenes
  party: 'Birthday Party',
  amusement_park: 'Amusement Park',
  treasure_hunt: 'Treasure Hunt',
  bakery: 'Bakery Adventure',
  parade: 'Birthday Parade',
  
  // Fantasy scenes
  enchanted_forest: 'Enchanted Forest',
  dragon_mountain: 'Dragon Mountain',
  fairy_kingdom: 'Fairy Kingdom',
  wizard_castle: 'Wizard Castle',
  crystal_caves: 'Crystal Caves',
  
  // Custom scene
  custom_scene: 'Custom Setting',
};

// Function to get a friendly scene name from a scene ID
export const getFriendlySceneName = (sceneId) => {
  return sceneNameMap[sceneId] || 'Unknown Scene';
};

// Debug function to compare our style mappings with API
export const compareStyleMappings = async () => {
  try {
    console.log('Comparing style mappings with API...');
    
    // Get styles from API
    const { list: apiStyles } = await getDzineStyles();
    
    // Create a map of API styles for easy lookup
    const apiStyleMap = {};
    apiStyles.forEach(style => {
      apiStyleMap[style.style_code] = style.name;
    });
    
    // Compare our mappings with API
    console.log('\nChecking our style codes against API:');
    Object.entries(styleCodeMap).forEach(([ourName, ourCode]) => {
      const apiName = apiStyleMap[ourCode];
      if (!apiName) {
        console.warn(`❌ Our style "${ourName}" with code ${ourCode} not found in API`);
      } else if (apiName.toLowerCase() !== ourName.split('_').join(' ').toLowerCase()) {
        console.warn(`⚠️ Style name mismatch for ${ourCode}:`);
        console.warn(`   Our name: "${ourName}"`);
        console.warn(`   API name: "${apiName}"`);
      } else {
        console.log(`✅ Style "${ourName}" matches API`);
      }
    });
    
    // Check for API styles we don't have
    console.log('\nChecking API styles not in our mappings:');
    apiStyles.forEach(apiStyle => {
      const ourStyleName = Object.entries(styleCodeMap)
        .find(([_, code]) => code === apiStyle.style_code)?.[0];
      if (!ourStyleName) {
        console.log(`➕ New API style available: "${apiStyle.name}" (${apiStyle.style_code})`);
      }
    });
    
    return {
      apiStyles,
      ourStyles: styleCodeMap
    };
  } catch (error) {
    console.error('Error comparing style mappings:', error);
    throw error;
  }
};

// Debug function to fetch and analyze all styles from API
export const analyzeAllStyles = async () => {
  const apiKey = localStorage.getItem('dzineApiKey');
  if (!apiKey) {
    console.error('Dzine API key not found in local storage.');
    return;
  }

  const url = `${API_BASE_URL}/style/list?page_no=0&page_size=1000`; // Fetch a large number to get all styles

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Dzine API error fetching all styles: ${response.status} ${response.statusText}`);
      const errorBody = await response.json();
      console.error('Error details:', errorBody);
      return;
    }

    const data = await response.json();
    const apiStyles = data?.data?.list;

    if (!apiStyles || !Array.isArray(apiStyles)) {
      console.error('Unexpected API response structure for all styles:', data);
      return;
    }

    console.log(`🔍 Found ${apiStyles.length} styles in the API.`);

    const localKeys = Object.keys(styleCodeMap);
    const apiStyleMap = new Map(apiStyles.map(style => [style.style_code, style.name]));
    const apiNameMap = new Map(apiStyles.map(style => [style.name.toLowerCase(), style.style_code])); // Map lowercase names to codes

    console.log("--- Analyzing Local Style Codes vs API ---");

    localKeys.forEach(localKey => {
      const localStyle = styleCodeMap[localKey];
      if (!localStyle || !localStyle.code) {
         console.warn(`❓ Local key "${localKey}" has invalid data:`, localStyle);
         return;
      }
      const localCode = localStyle.code;
      const localName = localStyle.name;

      if (apiStyleMap.has(localCode)) {
        const apiName = apiStyleMap.get(localCode);
        if (apiName.toLowerCase() === localName.toLowerCase()) {
          console.log(`✅ Match: "${localKey}" (${localName}) - Code: ${localCode}`);
        } else {
          console.warn(`⚠️ Name Mismatch: "${localKey}" (Local: "${localName}", API: "${apiName}") - Code: ${localCode}`);
        }
      } else {
         // Check if the name exists in the API with a different code
         const apiCodeForName = apiNameMap.get(localName.toLowerCase());
         if(apiCodeForName) {
            console.error(`❌ Code Mismatch: "${localKey}" (Local Name: "${localName}", Local Code: ${localCode}) - API has this name with CODE: ${apiCodeForName}. UPDATE NEEDED!`);
         } else {
            console.error(`❌ Not Found in API: "${localKey}" (Local Name: "${localName}", Code: ${localCode}) - This style might be deprecated.`);
         }
      }
    });

    console.log("--- Analyzing API Styles Not in Local Map ---");
    const localCodeSet = new Set(Object.values(styleCodeMap).map(s => s.code));
    apiStyles.forEach(apiStyle => {
      if (!localCodeSet.has(apiStyle.style_code)) {
        console.log(`➕ New API Style: "${apiStyle.name}" - Code: ${apiStyle.style_code}`);
      }
    });

     // Specific check for Starlit Fantasy again
     const starlitLocal = styleCodeMap['starlit_fantasy'];
     const starlitApiCode = apiNameMap.get('starlit fantasy');
     console.log("--- Starlit Fantasy Check ---");
     if (starlitLocal && starlitApiCode) {
         if (starlitLocal.code === starlitApiCode) {
             console.log(`✅ Starlit Fantasy mapping is correct: ${starlitLocal.code}`);
         } else {
             console.error(`❌ Starlit Fantasy MAPPING IS WRONG! Local code: ${starlitLocal.code}, API code: ${starlitApiCode}`);
         }
     } else if (starlitApiCode) {
         console.error(`❌ Starlit Fantasy is in API (Code: ${starlitApiCode}) but not mapped correctly locally.`);
     } else {
         console.warn(`❓ Starlit Fantasy style not found in API under that name.`);
     }
     console.log("--- End Analysis ---");


  } catch (error) {
    console.error('Error during full style analysis:', error);
  }
};

// --- Potentially add other functions like face detect/swap later if needed ---
