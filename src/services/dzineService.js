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

// 1. Load Dzine Style List
export const getDzineStyles = async (pageNo = 0, pageSize = 200) => {
  try {
    // Fetch a large number to likely get all styles at once
    const params = new URLSearchParams({ page_no: pageNo, page_size: pageSize }).toString();
    return fetchDzine(`/style/list?${params}`, { method: 'GET' });
  } catch (error) {
    console.warn('Could not load styles from Dzine API:', error.message);
    // Return a minimal structure to prevent UI breakage
    return { 
      list: [],
      total: 0
    };
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