const API_BASE_URL = 'https://papi.dzine.ai/openapi/v1';
const API_KEY = import.meta.env.VITE_DZINE_API_KEY;

// Helper function for making authenticated requests
const fetchDzine = async (endpoint, options = {}) => {
  if (!API_KEY) {
    console.warn('Dzine API Key not found. Please set VITE_DZINE_API_KEY in your .env file.');
    throw new Error('Dzine API Key not configured');
  }

  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': API_KEY,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Attempt to read error details from the response body
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch (e) {
        // Ignore if response body is not JSON
      }
      console.error('Dzine API Error:', response.status, response.statusText, errorBody);
      throw new Error(`Dzine API request failed: ${response.status} ${response.statusText} - ${errorBody.msg || 'Unknown error'}`);
    }

    const data = await response.json();
    if (data.code !== 200) {
      console.error('Dzine API Error (Code != 200):', data);
      throw new Error(`Dzine API Error: ${data.msg || 'Unknown error'} (Code: ${data.code})`);
    }
    return data.data;

  } catch (error) {
    console.error('Error calling Dzine API:', error);
    throw error; // Re-throw the error to be handled by the caller
  }
};

// Fetch all styles from Dzine API
export const getDzineStyles = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/styles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.REACT_APP_DZINE_API_KEY || ''
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching Dzine styles:', errorData);
      throw new Error(`Failed to fetch styles: ${errorData.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Log available styles for debugging
    console.log('Available Dzine styles:', data.list ? data.list.map(style => ({
      name: style.name, 
      style_code: style.style_code
    })) : 'No styles available');
    
    // Store styles in local cache for reuse
    if (data.list) {
      localStorage.setItem('dzine_styles', JSON.stringify(data.list));
    }
    
    return data;
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
  if (!API_KEY) {
    throw new Error('Dzine API Key not configured. Please check your environment variables.');
  }
  
  // Basic validation per API documentation
  if (!payload.prompt || !payload.style_code || !payload.images) {
    throw new Error('Missing required fields: prompt, style_code, or images');
  }
  
  // Ensure style_code is a string as per documentation
  const cleanPayload = {
    ...payload,
    style_code: String(payload.style_code) // Ensure it's a string
  };
  
  // Log what we're sending (without the full base64 data)
  const logPayload = {
    ...cleanPayload,
    images: cleanPayload.images.map(img => ({
      ...img,
      base64_data: img.base64_data ? (
        img.base64_data.substring(0, 30) + '...'
      ) : undefined
    }))
  };
  
  console.log('Sending to Dzine API:', JSON.stringify(logPayload, null, 2));
  
  try {
    // Make the API call with proper headers
    const response = await fetch(`${API_BASE_URL}/create_task_img2img`, {
      method: 'POST',
      headers: {
        'Authorization': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanPayload)
    });

    // Handle non-OK response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dzine API HTTP error:', response.status, errorText);
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    // Parse the response
    const data = await response.json();
    console.log('Full Dzine API response:', data);
    
    // Check response code
    if (data.code !== 200) {
      throw new Error(`Dzine API Error: ${data.msg || 'Unknown error'} (Code: ${data.code})`);
    }
    
    return data.data;
  } catch (error) {
    console.error('Error calling Dzine API:', error);
    throw error;
  }
};

// 7. Get Task Progress
export const getTaskProgress = async (taskId) => {
  if (!taskId) throw new Error('Task ID is required');
  return fetchDzine(`/get_task_progress/${taskId}`, { method: 'GET' });
};

// --- Potentially add other functions like face detect/swap later if needed --- 