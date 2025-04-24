/**
 * Style utilities for the application
 * Replaces functionality previously provided by dzineService
 */

// Style code mapping (previously in dzineService)
export const styleCodeMap = {
  'children_book': 'Children\'s Book Illustration',
  'watercolor': 'Watercolor Painting',
  'cartoon': 'Cartoon Style',
  'pixar': 'Pixar Animation',
  'anime': 'Anime Style',
  'disney': 'Disney Animation',
  'claymation': 'Claymation',
  'comic_book': 'Comic Book Style',
  'storybook': 'Storybook Illustration',
  'hand_drawn': 'Hand-drawn Animation',
  'papercut': 'Papercut Art',
  'origami': 'Origami Style',
  'crayon': 'Crayon Drawing',
  'collage': 'Paper Collage',
  'felt': 'Felt Art',
  'puppet': 'Puppet Style',
  'stop_motion': 'Stop Motion',
  'doodle': 'Doodle Art',
  'pastel': 'Pastel Drawing',
  'pencil_sketch': 'Pencil Sketch'
};

/**
 * Get a friendly style name from a style code
 * @param {string} styleCode - The style code
 * @returns {string} - The friendly style name
 */
export const getStyleNameFromCode = (styleCode) => {
  if (!styleCode) return 'Default Style';
  
  // If the style code is in our map, return the friendly name
  if (styleCodeMap[styleCode]) {
    return styleCodeMap[styleCode];
  }
  
  // Otherwise, make a best effort to format the code as a readable name
  return styleCode
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get a friendly scene name from a scene code
 * @param {string} sceneCode - The scene code
 * @returns {string} - The friendly scene name
 */
export const getFriendlySceneName = (sceneCode) => {
  if (!sceneCode) return 'Default Scene';
  
  // Format the scene code as a readable name
  return sceneCode
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
