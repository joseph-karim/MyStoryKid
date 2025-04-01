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
    
    return style ? style.style_code : null;
  } catch (error) {
    console.error('Error getting style by name:', error);
    return null;
  }
};

// Helper function to get all available styles
export const getAvailableStyles = async () => {
  try {
    // Try to get from cache first
    const cachedStyles = localStorage.getItem('dzine_styles');
    
    if (cachedStyles) {
      return JSON.parse(cachedStyles);
    }
    
    // If not in cache, fetch from API
    const data = await getDzineStyles();
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

// 5. Image-to-Image Task Creation
export const createImg2ImgTask = async (payload) => {
  try {
    // Validate style code first
    if (!payload.style_code) {
      console.error('Missing style_code in payload');
      throw new Error('Style code is required');
    }
    
    // Log style details for debugging
    console.log('Style parameters for img2img:', {
      styleCode: payload.style_code,
      styleIntensity: payload.style_intensity,
      structureMatch: payload.structure_match,
      faceMatch: payload.face_match,
      colorMatch: payload.color_match,
    });
    
    console.log('Sending to Dzine API:', JSON.stringify({
      ...payload,
      images: payload.images ? [`${payload.images.length} images`] : []
    }, null, 2));
    
    // Use the EXACT endpoint from the documentation
    const endpoint = '/create_task_img2img';
    console.log(`Using documented endpoint: ${endpoint}`);
    
    const data = await fetchDzine(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    // Log full response for debugging
    console.log(`Raw response from API:`, JSON.stringify(data));
    
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
      
      // If we got here, log the structure for debugging
      console.warn(`Could not find task_id in response structure:`, data);
      
      // Check for style-related errors
      if (data.msg && data.msg.toLowerCase().includes('style')) {
        throw new Error(`Style error: ${data.msg}`);
      }
      
      throw new Error('Could not find task_id in API response');
    } else {
      console.error(`Empty response from ${endpoint}`);
      throw new Error('Empty response from API');
    }
  } catch (error) {
    console.error('Error in createImg2ImgTask:', error);
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
    const endpoint = `/get_task_status?task_id=${taskId}`;
    
    // Use a more robust approach with direct fetch and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_KEY
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // If we get a 404, it might be that the task ID format is wrong
      // or that the task doesn't exist yet, return a "pending" status
      if (response.status === 404) {
        console.warn(`Task ${taskId} returned 404 - returning pending status`);
        return { status: 'pending', message: 'Task is still initializing' };
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
      let data;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`Task ${taskId} JSON parse error:`, parseError);
        return { status: 'error', message: 'Invalid response format' };
      }
      
      // Handle different response structures
      if (data) {
        // Debug log
        console.log(`Task ${taskId} progress data:`, JSON.stringify(data));
        
        // Check if the response is in the data field
        if (data.data) {
          return data.data;
        }
        
        // Check if the response is directly in the root
        if (data.status !== undefined) {
          return data;
        }
        
        // If response doesn't match either pattern, log it and return raw data
        console.warn('Unexpected response structure:', data);
        return data;
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

// --- Potentially add other functions like face detect/swap later if needed --- 