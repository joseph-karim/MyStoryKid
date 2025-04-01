const API_BASE_URL = 'https://papi.dzine.ai/openapi/v1';
const API_KEY = import.meta.env.VITE_DZINE_API_KEY;

// Generic fetch handler for Dzine API calls
export const fetchDzine = async (endpoint, options = {}) => {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Make sure headers are included and API key is set
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Authorization': process.env.VITE_DZINE_API_KEY || ''
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
    // Using the correct endpoint from the curl command
    const response = await fetch('https://papi.dzine.ai/openapi/v1/style/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': process.env.VITE_DZINE_API_KEY || ''
      }
    });

    if (!response.ok) {
      // Get the response as text first to see what we're dealing with
      const errorText = await response.text();
      console.error('Error fetching Dzine styles - raw response:', errorText);
      throw new Error(`Failed to fetch styles: ${response.statusText}`);
    }

    // Try to parse the response as JSON safely
    let data;
    try {
      const responseText = await response.text();
      console.log('Raw API response (first 100 chars):', responseText.substring(0, 100) + '...');
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error(`Failed to parse API response: ${parseError.message}`);
    }
    
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
    
    const response = await fetchDzine('/img2img', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    console.log('Full Dzine API response:', response);
    
    if (response && response.code === 200 && response.data) {
      return response.data;
    } else {
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
      const response = await fetchDzine(`/task/query?task_id=${taskId}`, {
        method: 'GET'
      });
      
      if (response && response.code === 200 && response.data) {
        return response.data;
      } else {
        console.warn(`Invalid response structure from API (attempt ${retries + 1}/${maxRetries + 1}):`, response);
        
        if (retries === maxRetries) {
          throw new Error('Invalid response structure from API after retries');
        }
      }
    } catch (error) {
      console.error(`Error checking task progress (attempt ${retries + 1}/${maxRetries + 1}):`, error);
      
      if (retries === maxRetries) {
        throw error;
      }
    }
    
    retries++;
    // Add a small delay before retry
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  throw new Error('Failed to get task progress after retries');
};

// --- Potentially add other functions like face detect/swap later if needed --- 