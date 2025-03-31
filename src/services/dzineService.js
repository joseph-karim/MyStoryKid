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
  
  // Ensure the payload structure matches the API docs
  // Required fields according to Dzine API: prompt, style_code, images
  if (!payload.prompt) {
    throw new Error('Prompt is required for img2img task');
  }
  
  if (payload.style_code === undefined || payload.style_code === null) {
    throw new Error('Style code is required for img2img task');
  }
  
  if (!payload.images || !Array.isArray(payload.images) || payload.images.length === 0) {
    throw new Error('At least one image is required for img2img task');
  }
  
  // Log the raw payload
  console.log('Creating Dzine img2img task with payload structure:', JSON.stringify({
    prompt: payload.prompt,
    style_code: payload.style_code,
    images: '[base64 data omitted]',
    style_intensity: payload.style_intensity,
    structure_match: payload.structure_match,
    face_match: payload.face_match
  }, null, 2));
  
  // Format the payload EXACTLY as expected by Dzine API
  // Based on console logs, the API is expecting a very specific structure
  const formattedPayload = {
    prompt: payload.prompt,
    style_code: payload.style_code, // Use as-is (number)
    images: payload.images,
    style_intensity: payload.style_intensity ?? 1,
    structure_match: payload.structure_match ?? 0.5,
    face_match: payload.face_match ?? 0.9
  };
  
  // Convert the payload to a clean JSON string without extra escaping
  const jsonPayload = JSON.stringify(formattedPayload);
  console.log('Final API payload JSON:', jsonPayload.substring(0, 200) + '...');
  
  try {
    // Make the API call with clean JSON
    const result = await fetchDzine('/create_task_img2img', {
      method: 'POST',
      body: jsonPayload,
    });
    console.log('Dzine task created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating Dzine task:', error);
    throw error;
  }
};

// 7. Get Task Progress
export const getTaskProgress = async (taskId) => {
  if (!taskId) throw new Error('Task ID is required');
  return fetchDzine(`/get_task_progress/${taskId}`, { method: 'GET' });
};

// --- Potentially add other functions like face detect/swap later if needed --- 