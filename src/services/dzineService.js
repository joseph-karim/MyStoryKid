const API_BASE_URL = 'https://papi.dzine.ai/openapi/v1';
const API_KEY = import.meta.env.VITE_DZINE_API_KEY;

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
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      }
    });
    
    if (!response.ok) {
      // Try to get error info from response
      try {
        const errorText = await response.text();
        try {
          const errorData = JSON.parse(errorText);
          console.error('Dzine API error response:', errorData);
          throw new Error(`API error (Code: ${errorData.code || response.status}): ${errorData.msg || response.statusText}`);
        } catch (parseError) {
          // If we can't parse the error as JSON
          console.error('Error response (not JSON):', errorText);
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
      } catch (e) {
        // If we can't read the error as text
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
    }
    
    // Read and parse response text manually to catch JSON errors
    const responseText = await response.text();
    
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response text:', responseText.slice(0, 500) + '...');
      throw new Error(`Failed to parse API response: ${parseError.message}`);
    }
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
    
    console.log(`Success with endpoint ${endpoint}:`, data);
    
    if (data && data.code === 200 && data.data) {
      return data.data;
    } else {
      console.error(`Invalid response structure from ${endpoint}:`, data);
      throw new Error('Invalid response structure from API');
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
      
      const data = await fetchDzine(endpoint, {
        method: 'GET'
      });
      
      console.log(`Task progress response:`, data);
      
      if (data && data.code === 200 && data.data) {
        return data.data;
      } else {
        console.warn(`Invalid task progress response:`, data);
        
        if (retries === maxRetries) {
          throw new Error('Invalid response structure from task progress endpoint');
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