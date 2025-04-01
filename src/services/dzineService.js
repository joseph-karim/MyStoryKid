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
    console.log('Sending to Dzine API:', JSON.stringify(payload, null, 2));
    
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

// Check task progress with retry logic
export const getTaskProgress = async (taskId) => {
  if (!taskId) {
    throw new Error('Task ID is required');
  }
  
  let retries = 0;
  const maxRetries = 3;
  
  while (retries <= maxRetries) {
    try {
      // The exact endpoint format from the documentation:
      // GET https://papi.dzine.ai/openapi/v1/get_task_progress/{task_id}
      const endpoint = `/get_task_progress/${taskId}`;
      console.log(`Using documented task progress endpoint: ${endpoint}`);
      
      const response = await fetchDzine(endpoint, {
        method: 'GET'
      });
      
      // Log the raw response for debugging
      console.log(`Raw task progress response:`, JSON.stringify(response));
      
      // Handle different response formats
      if (response) {
        console.log(`Task progress response:`, response);
        
        // Case 1: Standard format with code 200
        if (response.code === 200 && response.data) {
          console.log(`Found progress in standard format`);
          return response.data;
        }
        
        // Case 2: Direct task data
        if (response.status || response.task_id) {
          console.log(`Found direct task progress data`);
          return response;
        }
        
        // Case 3: Data property contains the progress directly
        if (response.data) {
          console.log(`Using data property as progress data`);
          return response.data;
        }
        
        console.warn(`Unknown task progress response format:`, response);
        
        if (retries === maxRetries) {
          throw new Error(`Unexpected response format: ${JSON.stringify(response)}`);
        }
      } else {
        console.warn(`Empty task progress response`);
        
        if (retries === maxRetries) {
          throw new Error('Empty response from task progress endpoint');
        }
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    } catch (error) {
      console.error(`Error in getTaskProgress (attempt ${retries + 1}/${maxRetries + 1}):`, error);
      
      if (retries === maxRetries) {
        throw error;
      }
      
      // Wait a bit before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries++;
    }
  }
  
  throw new Error(`Failed to get task progress after ${maxRetries} retries`);
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