/**
 * Style utilities for the application
 * Replaces functionality previously provided by dzineService
 */

// Style code mapping with our consolidated art styles
export const styleCodeMap = {
  // WATERCOLOR & TRADITIONAL PAINTING STYLES
  'watercolor_storybook': 'watercolor_storybook',
  'watercolor_splash': 'watercolor_splash',
  'gouache_painting': 'gouache_painting',
  'oil_pastel': 'oil_pastel',

  // INK & DRAWING STYLES
  'ink_wash': 'ink_wash',
  'pencil_sketch': 'pencil_sketch',
  'colored_pencil': 'colored_pencil',
  'chalk_drawing': 'chalk_drawing',

  // CARTOON & VECTOR STYLES
  'cartoon_character': 'cartoon_character',
  'flat_vector': 'flat_vector',
  'pixel_art': 'pixel_art',

  // 3D & TEXTURED STYLES
  'clay_animation': 'clay_animation',
  'plush_toy': 'plush_toy',
  'felt_craft': 'felt_craft',
  'paper_cutout': 'paper_cutout',
  'paper_diorama': 'paper_diorama',

  // FANTASY & MAGICAL STYLES
  'fantasy_storybook': 'fantasy_storybook',
  'dreamy_glow': 'dreamy_glow',
  'magical_light': 'magical_light',
  'stained_glass': 'stained_glass',

  // CULTURAL & HISTORICAL STYLES
  'folk_art': 'folk_art',
  'vintage_midcentury': 'vintage_midcentury',
  'retro_70s': 'retro_70s',
  'asian_brushwork': 'asian_brushwork',
  'nordic_cozy': 'nordic_cozy',

  // LIGHTING & MOOD STYLES
  'golden_hour': 'golden_hour',
  'night_glow': 'night_glow',
  'vibrant_scene': 'vibrant_scene',

  // DIGITAL & MODERN STYLES
  'digital_airbrush': 'digital_airbrush',
  'mixed_media': 'mixed_media',

  // DEFAULT STYLE
  'default': 'default',

  // Legacy mappings for backward compatibility
  'Storytime Whimsy': 'watercolor_storybook',
  'Fantasy Hero': 'fantasy_storybook',
  'Soft Radiance': 'dreamy_glow',
  'Joyful Clay': 'clay_animation',
  'Ceramic Lifelike': 'clay_animation',
  'Colorful Felt': 'felt_craft',
  'Sketch Elegance': 'pencil_sketch',
  'Aquarelle Life': 'watercolor_storybook',
  'Vivid Tableaux': 'vibrant_scene',
  'Dreamy 3D': 'dreamy_glow',
  'Cutie 3D': 'clay_animation',
  'Shimmering Glow': 'magical_light',
  'Surreal Iridescence': 'magical_light',
  'Golden Hour': 'golden_hour',
  'Inked Realism': 'ink_wash',
  'Magic Portrait': 'magical_light',
  'Warm Portrait': 'golden_hour',
  'Vintage Engraving': 'vintage_midcentury',
  'Ancient China': 'asian_brushwork',
  'Graffiti Splash': 'digital_airbrush',
  'Line & Wash': 'ink_wash',
  'Paper Cutout': 'paper_cutout',
  'Starlit Fantasy': 'fantasy_storybook',
  'Cheerful Storybook': 'watercolor_storybook'
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
