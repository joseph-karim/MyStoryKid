const API_BASE_URL = 'https://papi.dzine.ai/openapi/v1';
// Use environment variable first, fall back to the provided token if environment variable is not available
const API_KEY = import.meta.env.VITE_DZINE_API_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJPcGVuQUlEIjo3MSwiT3BlblVJRCI6MTE0MDk5NDMxNzM1NSwiTUlEIjo5OTg0MzMxLCJDcmVhdGVUaW1lIjoxNzQzNDQwMzk3LCJpc3MiOiJkemluZSIsInN1YiI6Im9wZW4ifQ.NfiLkQNPIhTlc7aaT0l_2Fs7AHwFQBgI3U3RlN5fzV4';

// Global rate limiting configuration
const API_RATE_LIMIT = {
  lastCallTime: 0,
  minIntervalMs: 500, // Minimum 500ms between API calls
  backoffFactor: 1.5, // Exponential backoff factor
  maxBackoffMs: 5000, // Maximum backoff time
  currentBackoff: 500, // Starting backoff time
  retryCount: 0
};

// Add rate limiting helper function
const respectRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - API_RATE_LIMIT.lastCallTime;
  
  // Apply exponential backoff if we've had retries
  const currentWaitTime = API_RATE_LIMIT.retryCount > 0 
    ? Math.min(API_RATE_LIMIT.currentBackoff, API_RATE_LIMIT.maxBackoffMs)
    : API_RATE_LIMIT.minIntervalMs;
  
  if (timeSinceLastCall < currentWaitTime) {
    // Need to wait before making another call
    const waitTime = currentWaitTime - timeSinceLastCall;
    console.log(`Rate limiting: Waiting ${waitTime}ms before next API call`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  // Update the last call time
  API_RATE_LIMIT.lastCallTime = Date.now();
  return true;
};

// Handle rate limit error and increase backoff
const handleRateLimitError = () => {
  API_RATE_LIMIT.retryCount++;
  API_RATE_LIMIT.currentBackoff = Math.min(
    API_RATE_LIMIT.currentBackoff * API_RATE_LIMIT.backoffFactor,
    API_RATE_LIMIT.maxBackoffMs
  );
  console.log(`Rate limit hit. Increased backoff to ${API_RATE_LIMIT.currentBackoff}ms`);
};

// Reset backoff when a call succeeds
const resetBackoff = () => {
  if (API_RATE_LIMIT.retryCount > 0) {
    console.log(`Resetting rate limit backoff after ${API_RATE_LIMIT.retryCount} retries`);
    API_RATE_LIMIT.retryCount = 0;
    API_RATE_LIMIT.currentBackoff = API_RATE_LIMIT.minIntervalMs;
  }
};

// --- Start: Style Keyword Mapping for Segmind --- //

// Map populated based on ArtStyleStep.jsx structure and descriptions
const dzineToSegmindKeywordsMap = {
  // Whimsical & Fun
  'Style-05c3d679-f8e9-4883-b9c9-adfe0988d1a5': "Storytime Whimsy, whimsical storybook-style illustrations, classic feel, children's book illustration",
  'Style-caa14e89-823b-4f8e-8d84-7368f9cec7cf': "Fantasy Hero, bold heroic character illustrations, fantasy adventure feel, children's book illustration",
  'Style-7c3af5f6-4945-4eb2-b00b-34f77b0b8d41': "Soft Radiance, gentle glowing artwork, soft lighting, delicate details, children's book illustration",
  'Style-541a2afd-904a-4968-bc60-8ad0ede22a86': "Paper Cutout, layered paper cutouts, clean edges, children's book illustration",
  'Style-7729f1f6-578b-4035-8514-edaa0637dd6d': "Joyful Clay, cheerful characters, colorful clay look, children's book illustration",
  'Style-0cd971cb-1e19-4909-a389-9b0c4fc79fd8': "Playful Enamel, bright, glossy illustrations with an enamel-like finish, children's book illustration",
  'Style-455da805-d716-4bc8-a960-4ac505aa7875': "Everything Kawaii, ultra-cute Japanese-inspired style, adorable characters, children's book illustration",
  
  // Illustrated & Artistic
  'Style-3f616e35-6423-4c53-aa27-be28860a4a7d': "Ceramic Lifelike, 3D ceramic quality, smooth textures, children's book illustration",
  'Style-48f44663-b5cc-4f8d-ace8-d0a12bf0f4df': "Colorful Felt, textured felt craft look, children's book illustration",
  'Style-e9021405-1b37-4773-abb9-bd80485527b0': "Sketch Elegance, beautiful detailed pencil sketches, subtle shading, children's book illustration",
  'Style-5ad47638-c430-4cda-8bae-681c7af4e59e': "Skyborne Realm, majestic airy illustrations, sense of height and wonder, children's book illustration",
  'Style-ada3a8d4-0e66-4bb0-aab3-e04a0ade4333': "Aquarelle Life, vibrant watercolor style, flowing colors, rich textures, children's book illustration",
  'Style-589373f8-1283-4570-baf9-61d02eb13391': "Vivid Tableaux, rich textured scenes, vibrant colors, detailed compositions, children's book illustration",
  'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9': "Line & Wash, delicate line drawings, light watercolor washes, children's book illustration",
  
  // Stylized & Modern
  'Style-ae3dc56b-33b6-4f29-bd76-7f6aa1a87e8d': "Dreamy 3D, soft 3D rendered illustrations, dreamy quality, children's book illustration",
  'Style-f45b720c-656d-4ef0-bd86-f9f5afa63f0f': "Cutie 3D, adorable 3D characters, expressive features, children's book illustration",
  'Style-16dd4ac7-63e1-40ae-bb87-472e820c93f8': "Shimmering Glow, magical luminous quality, children's book illustration",
  'Style-43226b0-4b66-412c-a240-0a214019b895': "Surreal Iridescence, dreamlike scenes, shimmering rainbow-like colors, children's book illustration",
  'Style-90a8d36d-9a67-4619-a995-4036fda8474d': "Golden Hour, warm sunset-toned illustrations, nostalgic feel, children's book illustration",
  'Style-b7c0d088-e046-4e9b-a0fb-a329d2b9a36a': "Vibrant Impasto, bold paintings, thick textured brush strokes, children's book illustration",
  'Style-4a3b38cd-a49d-4b69-81e8-69134ca9cdc0': "Sketchbook Sticker, fun casual illustrations, sticker-like appearance, children's book illustration",
  
  // Portraits & Characters
  'Style-11ead7fd-0a37-4f3d-a1a2-66558f036f74': "Inked Realism, detailed ink-drawn portraits, children's book illustration",
  'Style-8d281dba-698e-41d0-98d1-6227e4f3c6c4': "Magic Portrait, semi-stylized portrait, magical fantasy quality, children's book illustration",
  'Style-4ab783c7-2955-4092-878e-965162241bf7': "Warm Portrait, realistic portrait, warm lighting, preserved facial features, children's book illustration",
  'Style-e54a8400-fb2c-47a5-9418-8895c01382ce': "Retro Noir Chromatics, stylish noir-inspired portraits, bold colors, children's book illustration",
  'Style-9cde0ca9-78f0-4be5-a6a1-44dd74cfbaa0': "Starlit Fantasy, dreamy ethereal style, magical starlit quality, characters with dreamy quality, children's book illustration",
  'Style-a941aee9-7964-4445-b76a-7c3ff912f926': "Cheerful Storybook, bright cheerful character illustrations, classic storybook style, children's book illustration",
  
  // Special Styles
  'Style-a8311e8a-ba8b-4cdf-84f9-4001f82cee83': "Vintage Engraving, old-fashioned engraved look, fine lines and details, children's book illustration",
  'Style-666d19e1-2e33-4e64-95e8-588c8e20b02c': "Ancient China, traditional Chinese painting style, elegant brushwork, children's book illustration",
  'Style-f9ba459d-addd-4e80-9a2e-67439fb50446': "Graffiti Splash, urban street art style, bold colors, spray paint effects, children's book illustration",
  'Style-f8ee0e8d-62ea-48b6-8323-15c5a6c62e2c': "Pleasantly Warm, cozy warm-toned illustrations, comfortable feeling, children's book illustration",
  'Style-f22b0501-07a8-4f93-ac65-182c1cd5b4ca': "8-Bit Arcade, retro pixel art style, classic video games, children's book illustration",
  'Style-01b37b76-4f5b-421d-a6cc-759e8d7aba3f': "Impressionist, artistic style, visible brushstrokes, light effects, children's book illustration",
  'Style-24b334a4-52eb-4f77-94fa-f37d7367d956': "Zen Spirit, tranquil mindful illustrations, Eastern artistic influences, children's book illustration",
  'Style-89c94c8f-9c94-4ef2-8fbd-e058648c92c7': "Vibrant Whimsy, bright colorful whimsical style, children's book illustration",
  'Style-e2f14b9b-819d-4389-980f-71b83f55271d': "Whimsical Brushwork, playful brush style, flowing artistic strokes, children's book illustration",
  'Style-8ee4b050-ef89-4058-8521-66223259bb30': "Bedtime Story, cozy nighttime illustrations, dreamlike quality, children's book illustration",
  'Style-7b57d4ef-98ea-4101-b048-db2b4fd28c70': "Nouveau Classic, art nouveau inspired style, elegant flowing lines, children's book illustration",
  'Style-c7e442ba-261c-450a-899b-5ae85c918b4b': "Innocent Cutie, sweet innocent style, adorable character design, children's book illustration",
  'Style-04d8cbcf-6496-4d68-997e-516303502507': "Glossy Elegance, clean sleek modern illustration, glossy finish, children's book illustration",
  'Style-30dd5a41-c881-4281-a093-ab79f71e6479': "Memphis Illustration, colorful geometric patterns, 80s-90s inspired, children's book illustration", 
  'Style-2bdfdfec-0ddb-4bca-aa2a-cca1abbc48f7': "Minimalist Cutesy, simple cute design, minimal details, soft colors, children's book illustration",
  'Style-7f3f81ad-1c2d-4a15-944d-66bf549641de': "Watercolor Whimsy, gentle watercolor style, soft colors, children's book illustration",
  'Style-e72b9767-6244-4d6f-b295-7a015de0e031': "Dreamy Spectrum, colorful dreamlike illustrations, fantasy atmosphere, children's book illustration",
  'Style-e9a4495e-2f15-4ab7-909d-473af6fb6c9c': "Enhanced Elegance, refined detailed illustrations, sophisticated look, children's book illustration",
  'Style-31bbb0d0-20e2-460b-9280-6835200a4b73': "Delicate Aquarelle, gentle watercolor style, delicate appearance, children's book illustration"
};

/**
 * Gets descriptive keywords for Segmind based on a Dzine style code.
 * @param {string} dzineCode - The Dzine style code (e.g., 'Style-7a23...').
 * @returns {string} - A string of descriptive keywords for Segmind prompt, or a default.
 */
export const getKeywordsForDzineStyle = (dzineCode) => {
  if (!dzineCode) return "children's book illustration style"; // Default if no code provided
  // Updated fallback to be more generic if code not found in map
  return dzineToSegmindKeywordsMap[dzineCode] || "children's book illustration, colorful, illustrated style"; 
};

// --- End: Style Keyword Mapping --- //

// Modify fetchDzine to use rate limiting
export const fetchDzine = async (endpoint, options = {}) => {
  try {
    // Apply rate limiting before making the call
    await respectRateLimit();
    
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
        resetBackoff(); // Reset backoff on success
        return { text: responseText, status: response.status };
      }
      
      throw new Error(`API returned non-JSON response: ${response.status} ${response.statusText}`);
    }
    
    // Check for error codes in response body
    if (data && data.code && data.code !== 200) {
      console.error('Dzine API error in response body:', data);
      
      // Check for rate limit errors (code 108009)
      if (data.code === 108009 || (data.msg && data.msg.toLowerCase().includes('too many requests'))) {
        handleRateLimitError();
        throw new Error(`API rate limit exceeded (Code: ${data.code}): ${data.msg || 'Too many requests'}`);
      }
      
      throw new Error(`API error in response body (Code: ${data.code}): ${data.msg || 'Unknown error'}`);
    }
    
    // Success - reset backoff
    resetBackoff();
    
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

// Modify getTaskProgress to use rate limiting and more efficient polling
export const getTaskProgress = async (taskId) => {
  if (!taskId) {
    console.error('No task ID provided to getTaskProgress');
    throw new Error('Task ID is required');
  }
  
  try {
    console.log(`Checking progress for task: ${taskId}`);
    
    // Apply rate limiting before making the call
    await respectRateLimit();
    
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
    
    // Handle 429 (Too Many Requests) specifically
    if (response.status === 429) {
      handleRateLimitError();
      console.warn(`Task ${taskId} returned 429 (Too Many Requests) - backing off`);
      return { status: 'pending', message: 'Rate limit exceeded, backing off' };
    }
    
    // Handle other non-OK statuses
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Could not read error text');
      console.error(`Task ${taskId} API error: ${response.status} ${errorText}`);
      
      // Check if error contains rate limit message
      if (errorText.toLowerCase().includes('too many requests')) {
        handleRateLimitError();
      }
      
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
      
      // Check for rate limit errors in the response
      if (data.code === 108009 || (data.msg && data.msg.toLowerCase().includes('too many requests'))) {
        handleRateLimitError();
        return { status: 'pending', message: 'Rate limit hit, backing off' };
      }
      
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
      
      // If task completed successfully, reset backoff
      if (normalizedStatus === 'success') {
        resetBackoff();
      }
      
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
    // Check if it's a rate limit error
    if (error.message && error.message.toLowerCase().includes('too many requests')) {
      handleRateLimitError();
      return { status: 'pending', message: 'Rate limit hit, backing off' };
    }
    
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
  // Whimsical & Fun
  'storytime_whimsy': { name: 'Storytime Whimsy', code: 'Style-05c3d679-f8e9-4883-b9c9-adfe0988d1a5' },
  'fantasy_hero': { name: 'Fantasy Hero', code: 'Style-caa14e89-823b-4f8e-8d84-7368f9cec7cf' },
  'soft_radiance': { name: 'Soft Radiance', code: 'Style-7c3af5f6-4945-4eb2-b00b-34f77b0b8d41' },
  'paper_cutout': { name: 'Paper Cutout', code: 'Style-541a2afd-904a-4968-bc60-8ad0ede22a86' },
  'joyful_clay': { name: 'Joyful Clay', code: 'Style-7729f1f6-578b-4035-8514-edaa0637dd6d' },
  'playful_enamel': { name: 'Playful Enamel', code: 'Style-0cd971cb-1e19-4909-a389-9b0c4fc79fd8' },
  'everything_kawaii': { name: 'Everything Kawaii', code: 'Style-455da805-d716-4bc8-a960-4ac505aa7875' },
  
  // Illustrated & Artistic 
  'ceramic_lifelike': { name: 'Ceramic Lifelike', code: 'Style-3f616e35-6423-4c53-aa27-be28860a4a7d' },
  'colorful_felt': { name: 'Colorful Felt', code: 'Style-48f44663-b5cc-4f8d-ace8-d0a12bf0f4df' },
  'sketch_elegance': { name: 'Sketch Elegance', code: 'Style-e9021405-1b37-4773-abb9-bd80485527b0' },
  'skyborne_realm': { name: 'Skyborne Realm', code: 'Style-5ad47638-c430-4cda-8bae-681c7af4e59e' },
  'aquarelle_life': { name: 'Aquarelle Life', code: 'Style-ada3a8d4-0e66-4bb0-aab3-e04a0ade4333' },
  'vivid_tableaux': { name: 'Vivid Tableaux', code: 'Style-589373f8-1283-4570-baf9-61d02eb13391' },
  'line_and_wash': { name: 'Line & Wash', code: 'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9' },
  
  // Stylized & Modern
  'dreamy_3d': { name: 'Dreamy 3D', code: 'Style-ae3dc56b-33b6-4f29-bd76-7f6aa1a87e8d' },
  'cutie_3d': { name: 'Cutie 3D', code: 'Style-f45b720c-656d-4ef0-bd86-f9f5afa63f0f' },
  'shimmering_glow': { name: 'Shimmering Glow', code: 'Style-16dd4ac7-63e1-40ae-bb87-472e820c93f8' },
  'surreal_iridescence': { name: 'Surreal Iridescence', code: 'Style-43226b0-4b66-412c-a240-0a214019b895' },
  'golden_hour': { name: 'Golden Hour', code: 'Style-90a8d36d-9a67-4619-a995-4036fda8474d' },
  'vibrant_impasto': { name: 'Vibrant Impasto', code: 'Style-b7c0d088-e046-4e9b-a0fb-a329d2b9a36a' },
  'sketchbook_sticker': { name: 'Sketchbook Sticker', code: 'Style-4a3b38cd-a49d-4b69-81e8-69134ca9cdc0' },
  
  // Portraits & Characters
  'inked_realism': { name: 'Inked Realism', code: 'Style-11ead7fd-0a37-4f3d-a1a2-66558f036f74' },
  'magic_portrait': { name: 'Magic Portrait', code: 'Style-8d281dba-698e-41d0-98d1-6227e4f3c6c4' },
  'warm_portrait': { name: 'Warm Portrait', code: 'Style-4ab783c7-2955-4092-878e-965162241bf7' },
  'retro_noir_chromatics': { name: 'Retro Noir Chromatics', code: 'Style-e54a8400-fb2c-47a5-9418-8895c01382ce' },
  'starlit_fantasy': { name: 'Starlit Fantasy', code: 'Style-9cde0ca9-78f0-4be5-a6a1-44dd74cfbaa0' },
  'cheerful_storybook': { name: 'Cheerful Storybook', code: 'Style-a941aee9-7964-4445-b76a-7c3ff912f926' },
  
  // Special Styles
  'vintage_engraving': { name: 'Vintage Engraving', code: 'Style-a8311e8a-ba8b-4cdf-84f9-4001f82cee83' },
  'ancient_china': { name: 'Ancient China', code: 'Style-666d19e1-2e33-4e64-95e8-588c8e20b02c' },
  'graffiti_splash': { name: 'Graffiti Splash', code: 'Style-f9ba459d-addd-4e80-9a2e-67439fb50446' },
  'pleasantly_warm': { name: 'Pleasantly Warm', code: 'Style-f8ee0e8d-62ea-48b6-8323-15c5a6c62e2c' },
  '8bit_arcade': { name: '8-Bit Arcade', code: 'Style-f22b0501-07a8-4f93-ac65-182c1cd5b4ca' },
  'impressionist': { name: 'Impressionist', code: 'Style-01b37b76-4f5b-421d-a6cc-759e8d7aba3f' },
  'zen_spirit': { name: 'Zen Spirit', code: 'Style-24b334a4-52eb-4f77-94fa-f37d7367d956' },
  'vibrant_whimsy': { name: 'Vibrant Whimsy', code: 'Style-89c94c8f-9c94-4ef2-8fbd-e058648c92c7' },
  'whimsical_brushwork': { name: 'Whimsical Brushwork', code: 'Style-e2f14b9b-819d-4389-980f-71b83f55271d' },
  'bedtime_story': { name: 'Bedtime Story', code: 'Style-8ee4b050-ef89-4058-8521-66223259bb30' },
  'nouveau_classic': { name: 'Nouveau Classic', code: 'Style-7b57d4ef-98ea-4101-b048-db2b4fd28c70' },
  'innocent_cutie': { name: 'Innocent Cutie', code: 'Style-c7e442ba-261c-450a-899b-5ae85c918b4b' },
  'glossy_elegance': { name: 'Glossy Elegance', code: 'Style-04d8cbcf-6496-4d68-997e-516303502507' },
  'memphis_illustration': { name: 'Memphis Illustration', code: 'Style-30dd5a41-c881-4281-a093-ab79f71e6479' },
  'minimalist_cutesy': { name: 'Minimalist Cutesy', code: 'Style-2bdfdfec-0ddb-4bca-aa2a-cca1abbc48f7' },
  'watercolor_whimsy': { name: 'Watercolor Whimsy', code: 'Style-7f3f81ad-1c2d-4a15-944d-66bf549641de' },
  'dreamy_spectrum': { name: 'Dreamy Spectrum', code: 'Style-e72b9767-6244-4d6f-b295-7a015de0e031' },
  'enhanced_elegance': { name: 'Enhanced Elegance', code: 'Style-e9a4495e-2f15-4ab7-909d-473af6fb6c9c' },
  'delicate_aquarelle': { name: 'Delicate Aquarelle', code: 'Style-31bbb0d0-20e2-460b-9280-6835200a4b73' }
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
