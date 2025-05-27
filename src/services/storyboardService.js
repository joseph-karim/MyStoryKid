// --- Storyboard Service ---
import { supabase } from './supabaseClient';

/**
 * Calls the Supabase Edge Function to generate storyboards for book pages.
 * @param {Object[]} pages - Array of story pages ({ text, pageNum?, ... })
 * @param {Object[]} characters - Array of character metadata ({ id, name, role, referenceKey, referenceUrl })
 * @param {string} [style] - Optional style string
 * @returns {Promise<Object[]>} - Array of storyboard objects ({ page, text, characters, setting, imagePrompt })
 */
export async function generateStoryboards({ pages, characters, style }) {
  const { data, error } = await supabase.functions.invoke('storyboard-pages', {
    body: { pages, characters, style },
  });
  if (error) {
    console.error('[storyboardService] Error calling storyboard-pages:', error);
    throw new Error(error.message || 'Failed to generate storyboards');
  }
  if (!data || !Array.isArray(data.storyboards)) {
    throw new Error('Invalid response from storyboard-pages edge function');
  }
  return data.storyboards;
} 