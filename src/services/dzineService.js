const API_BASE_URL = 'https://papi.dzine.ai/openapi/v1';
// Use environment variable first, fall back to the provided token if environment variable is not available
const API_KEY = import.meta.env.VITE_DZINE_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJPcGVuQUlEIjo3MSwiT3BlblVJRCI6MTE0MDk5NDMxNzM1NSwiTUlEIjo5OTg0MzMxLCJDcmVhdGVUaW1lIjoxNzQzNDQwMzk3LCJpc3MiOiJkemluZSIsInN1YiI6Im9wZW4ifQ.NfiLkQNPIhTlc7aaT0l_2Fs7AHwFQBgI3U3RlN5fzV4';

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
export const createImg2ImgTask = async (payload) => {
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

    // Prepare the payload exactly as per documentation
    // We don't need to upload manually, the API accepts base64_data directly
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
      quality_mode: payload.quality_mode !== undefined ? payload.quality_mode : 0, // Default if not provided
      color_match: payload.color_match !== undefined ? payload.color_match : 0, // Default if not provided
      face_match: payload.face_match !== undefined ? payload.face_match : 0, // Default if not provided
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
export const createTxt2ImgTask = async (payload) => {
  try {
    // Validate style code first
    if (!payload.style_code) {
      console.error('Missing style_code in payload');
      throw new Error('Style code is required');
    }
    
    // Log style details for debugging
    console.log('Style parameters for txt2img:', {
      styleCode: payload.style_code,
      styleIntensity: payload.style_intensity,
      promptStrength: payload.prompt_strength,
      cfgScale: payload.cfg_scale
    });
    
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
    
    // Check for task_id in different possible response structures
    if (data) {
      console.log(`Success with endpoint ${endpoint}:`, data);
      
      // Case 1: Standard structure with code 200
      if (data.code === 200 && data.data && data.data.task_id) {
        console.log(`Found task_id in standard structure:`, data.data.task_id);
        return data.data;
      }
      
      // Case 2: Direct task_id in data
      if (data.task_id) {
        console.log(`Found direct task_id:`, data.task_id);
        return { task_id: data.task_id };
      }
      
      // Case 3: Nested in a different structure
      if (data.data && data.data.task) {
        console.log(`Found task in nested structure:`, data.data.task);
        return { task_id: data.data.task };
      }
      
      // Check for style-related errors
      if (data.msg && data.msg.toLowerCase().includes('style')) {
        throw new Error(`Style error: ${data.msg}`);
      }
      
      // If we got here, log the structure for debugging
      console.warn(`Could not find task_id in response structure:`, data);
      throw new Error('Could not find task_id in API response');
    } else {
      console.error(`Empty response from ${endpoint}`);
      throw new Error('Empty response from API');
    }
  } catch (error) {
    console.error('Error in createTxt2ImgTask:', error);
    throw error;
  }
};

// 7. Get Task Progress (improved error handling and debugging)
export const getTaskProgress = async (taskId) => {
  if (!taskId) {
    console.error('No task ID provided to getTaskProgress');
    throw new Error('Task ID is required');
  }
  
  try {
    console.log(`Checking progress for task: ${taskId}`);
    
    // Construct the correct endpoint according to docs
    const endpoint = `/get_task_progress/${taskId}`;
    console.log(`Polling task progress using endpoint: GET ${API_BASE_URL}${endpoint}`); // Log the endpoint being used
    
    // Use a more robust approach with direct fetch and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // Reduced timeout (4 seconds)
    
    try {
      // Add specific user agent and headers to avoid issues
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_KEY,
          'User-Agent': 'MyStoryKid/1.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // If we get a 404, it might be that the task ID format is wrong
      // or that the task doesn't exist yet, return a "pending" status
      if (response.status === 404) {
        console.warn(`Task ${taskId} returned 404 - returning pending status`);
        // Return an object that looks like a pending status
        return { 
          status: 'pending', 
          message: 'Task is still initializing'
        };
      }
      
      // For other non-200 responses, try to get error information
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Task ${taskId} API error: ${response.status} ${errorText}`);
        return { 
          status: 'error', 
          error: `API error: ${response.status}`,
          message: errorText
        };
      }
      
      // Process successful response
      const responseText = await response.text();
      if (!responseText || responseText.trim() === '') {
        console.warn(`Task ${taskId} returned empty response`);
        return { status: 'pending', message: 'Empty response from server' };
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`Task ${taskId} JSON parse error:`, parseError);
        console.error(`Raw response: "${responseText}"`);
        return { status: 'error', message: 'Invalid response format' };
      }
      
      // Handle different response structures
      if (data) {
        // Debug log - truncate if too large to avoid console spam
        const logData = JSON.stringify(data).length > 1000 
          ? JSON.stringify(data).substring(0, 1000) + '...' 
          : JSON.stringify(data);
        console.log(`Task ${taskId} progress data:`, logData);
        
        // Check for common error codes in the data
        if (data.code && data.code !== 200) {
          console.error(`Task ${taskId} returned error code:`, data.code, data.msg || 'Unknown error');
          return { 
            status: 'error',
            error: `API error code ${data.code}`,
            message: data.msg || 'Unknown error'
          };
        }
        
        // Check if the response is in the data field
        if (data.data) {
          // Normalize response structure
          if (data.data.status) {
            return {
              ...data.data,
              status: normalizeStatus(data.data.status)
            };
          }
          return data.data;
        }
        
        // Check if the response is directly in the root
        if (data.status !== undefined) {
          return {
            ...data,
            status: normalizeStatus(data.status)
          };
        }
        
        // If response doesn't match either pattern, log it and return raw data
        console.warn('Unexpected response structure:', data);
        // Try to extract status from various possible fields
        const extractedStatus = extractStatus(data);
        if (extractedStatus) {
          return {
            status: normalizeStatus(extractedStatus),
            raw_data: data
          };
        }
        
        // Default to returning the data with 'pending' status
        return { 
          status: 'pending',
          message: 'Unrecognized response format',
          raw_data: data
        };
      } else {
        console.error('Empty response from task progress check');
        return { status: 'pending', message: 'Empty response' };
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Special handling for abort (timeout)
      if (fetchError.name === 'AbortError') {
        console.warn(`Task ${taskId} check timed out - returning pending status`);
        return { status: 'pending', message: 'Request timed out, still processing' };
      }
      
      // Network errors should also return pending to keep polling
      console.error(`Network error checking task ${taskId}:`, fetchError);
      return { status: 'pending', message: 'Network error, retrying' };
    }
  } catch (error) {
    // Any other error, log but don't fail completely
    console.error(`Error checking progress for task ${taskId}:`, error);
    return { status: 'pending', message: 'Error occurred, retrying' };
  }
};

// Helper function to normalize status values from different API responses
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
  // Try common paths where status might be found
  const possiblePaths = [
    'status', 'state', 'task_status', 'taskStatus',
    'result.status', 'data.status', 'task.status',
    'info.status', 'response.status'
  ];
  
  for (const path of possiblePaths) {
    // Navigate through the object using the path
    const parts = path.split('.');
    let value = data;
    let found = true;
    
    for (const part of parts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        found = false;
        break;
      }
    }
    
    if (found && value) {
      return value;
    }
  }
  
  // Check if any property contains status-like keywords
  for (const key in data) {
    if (typeof data[key] === 'string') {
      const val = data[key].toLowerCase();
      if (val.includes('success') || val.includes('complete')) return 'success';
      if (val.includes('fail') || val.includes('error')) return 'failed';
      if (val.includes('run') || val.includes('process')) return 'running';
    }
  }
  
  return null;
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
export const styleCodeMap = {
  starlit_fantasy: "Style-541a2afd-904a-4968-bc60-8ad0ede22a86",
  cheerful_storybook: "Style-2c25986f-12e7-4cdb-9888-01c9a04a433d", 
  enchanted_elegance: "Style-dd2ada7a-70a9-4a3f-93f8-1daf83fdd4f0",
  glossy_elegance: "Style-0c99c2d7-ef7b-4eea-ac58-0f80af232590",
  minimalist_cutesy: "Style-3de43a1f-fd88-4efe-bc35-1a453bedd5e5", 
  watercolor_whimsy: "Style-a33f4b39-d580-45ee-983e-d65c50f181fb", 
  pleasantly_warm: "Style-21a75e9c-3ff8-4728-99c4-94d448a489a1",
  ancient_china: "Style-38d99e9a-9f7a-4a9c-9a84-9aaca8bb8e1c",
  line_and_wash: "Style-74f0f70d-7c9f-4bb7-bc41-3636d2b9fa7a", 
  magic_portrait: "Style-09ffbb88-64e0-4a7b-8bf1-e8f9a0ec1e5d", 
  warm_portrait: "Style-e2a1d336-9eef-42e0-bc81-5b3388e0034e", 
  golden_hour: "Style-eab373f0-7ddb-4da9-82cf-5b70a8e63776", 
  dreamlike_portraiture: "Style-8ccd685e-4ea3-43bd-ba84-f9e73bd964ae", 
  luminous_narratives: "Style-6dadfd49-b399-4344-babe-a84d033c89d2", 
  aquarelle_life: "Style-a3d4214d-5654-4ab5-9c4d-2a2a7a4bd1fa", 
  vivid_tableaux: "Style-2d8b26df-5fbb-4e89-b731-696bdabc118e", 
  whimsical_coloring: "Style-cfd977fa-31bd-48d9-9ca7-3f30ac7c6d92", 
  ceramic_lifelike: "Style-1c4e74ab-0e28-4628-8f4e-a2de572cb3cd", 
  joyful_clay: "Style-4f89eb76-fb79-44dd-bb9d-b1007b7a5ef0", 
  yarn_realism: "Style-7c0e0809-ce5a-42f1-a9ca-ba0a18dfa51e", 
  fantasy_hero: "Style-9efbd18a-f2e4-4eb3-9845-6fbcbdc8f34b", 
  storytime_whimsy: "Style-5ad97bd1-8efd-4991-bb72-4d7c67e93356", 
  cute_exaggeration: "Style-0c54aead-23e7-4a3a-a238-d51de63a33c6", 
  enchanted_character: "Style-5b752a78-21d1-41f6-910b-5a1b5d9a9d43", 
  mystical_sovereignty: "Style-97e64014-2094-4fa6-aaa9-8dfc9ead288d", 
  soft_radiance: "Style-fbc31a98-00cd-48a8-bc1a-a1b0c2c9b21a"
};

// Function to get the proper style code when creating a task
export const getStyleCode = (styleId) => {
  // If already a full style code (starts with "Style-"), use as is
  if (styleId && styleId.startsWith('Style-')) {
    return styleId;
  }
  
  // Look up in the map of our curated styles
  if (styleId && styleCodeMap[styleId]) {
    return styleCodeMap[styleId];
  }
  
  // Default fallback style if mapping fails
  console.warn(`Style ID "${styleId}" not found in style map, using default style`);
  return "Style-7feccf2b-f2ad-43a6-89cb-354fb5d928d2"; // No Style v2
};

// --- Potentially add other functions like face detect/swap later if needed --- 