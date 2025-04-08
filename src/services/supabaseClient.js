import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

// Define auth configuration
const authConfig = {
  auth: {
    // The site URL to use for the auth flow
    // This should match the site URL configured in Supabase Auth settings
    site: 'https://mystorykid.com',
    
    // The URL to redirect to after a successful sign-in or sign-up
    redirectTo: 'https://mystorykid.com/dashboard',
    
    // Persist the session in localStorage
    persistSession: true,
    
    // Detect session changes and update the store
    detectSessionInUrl: true,
    
    // Use secure cookies in production
    cookieSecure: import.meta.env.PROD,
    
    // Set the storage mechanism (default is 'localStorage')
    storage: {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
      removeItem: (key) => localStorage.removeItem(key),
    },
  },
};

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey, authConfig);

/**
 * Uploads a Base64 image to Supabase Storage and returns the public URL
 * @param {string} base64Image - Base64 image data URL (e.g., 'data:image/webp;base64,...')
 * @param {string} bucketName - The name of the storage bucket (default: 'character-references')
 * @returns {Promise<string>} - Public URL of the uploaded image
 */
export const uploadImageToSupabase = async (base64Image, bucketName = 'character-references') => {
  if (!base64Image || !base64Image.startsWith('data:image')) {
    throw new Error('Invalid Base64 image format');
  }

  // Extract content type and base64 data
  const [meta, base64Data] = base64Image.split(',');
  const contentType = meta.match(/data:(.*);base64/)?.[1] || 'image/jpeg';
  const fileExtension = contentType.split('/')[1] || 'jpg';

  // Generate a unique filename
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExtension}`;
  const filePath = `${fileName}`;

  try {
    // Convert base64 to Uint8Array
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, bytes, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Error uploading to Supabase Storage:', error);
      throw new Error(`Supabase Storage upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log('Image uploaded to Supabase Storage, public URL:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadImageToSupabase:', error);
    throw error;
  }
};

export default supabase;