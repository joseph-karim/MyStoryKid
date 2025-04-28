/**
 * Script to create SVG placeholders for all art styles
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../public/assets/style-thumbnails');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// List of all style codes used in the application
const styleCodes = [
  // Watercolor & Traditional Painting Styles
  'watercolor_storybook',
  'watercolor_splash',
  'gouache_painting',
  'oil_pastel',

  // Ink & Drawing Styles
  'ink_wash',
  'pencil_sketch',
  'colored_pencil',
  'chalk_drawing',

  // Cartoon & Vector Styles
  'cartoon_character',
  'flat_vector',
  'pixel_art',

  // 3D & Textured Styles
  'clay_animation',
  'plush_toy',
  'felt_craft',
  'paper_cutout',
  'paper_diorama',

  // Fantasy & Magical Styles
  'fantasy_storybook',
  'dreamy_glow',
  'magical_light',
  'stained_glass',

  // Cultural & Historical Styles
  'folk_art',
  'vintage_midcentury',
  'retro_70s',
  'asian_brushwork',
  'nordic_cozy',

  // Lighting & Mood Styles
  'golden_hour',
  'night_glow',
  'vibrant_scene',

  // Digital & Modern Styles
  'digital_airbrush',
  'mixed_media',

  // Legacy style names for backward compatibility
  'storytime_whimsy',
  'fantasy_hero',
  'soft_radiance',
  'joyful_clay',
  'ceramic_lifelike',
  'colorful_felt',
  'sketch_elegance',
  'aquarelle_life',
  'vivid_tableaux',
  'dreamy_3d',
  'cutie_3d',
  'shimmering_glow',
  'surreal_iridescence',
  'inked_realism',
  'magic_portrait',
  'warm_portrait',
  'vintage_engraving',
  'ancient_china',
  'graffiti_splash',
  'line_and_wash',
  'paper_cutout',
  'starlit_fantasy',
  'cheerful_storybook',
  'default'
];

// Create a placeholder SVG for each style
styleCodes.forEach(styleCode => {
  const outputFile = path.join(OUTPUT_DIR, `${styleCode}.svg`);

  // Skip if the file already exists
  if (fs.existsSync(outputFile)) {
    console.log(`Skipping ${styleCode} - file already exists`);
    return;
  }

  // Generate a color based on the style code (for visual variety)
  const hash = styleCode.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const hue = hash % 360;
  const saturation = 70 + (hash % 30);
  const lightness = 60 + (hash % 20);
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  // Format the style name for display
  const displayName = styleCode
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Create SVG content
  const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${color}" />
  <rect x="12" y="12" width="1000" height="1000" fill="white" fill-opacity="0.1" stroke="white" stroke-width="4" />
  <text x="512" y="480" font-family="Arial, sans-serif" font-size="48" text-anchor="middle" fill="white">${displayName}</text>
  <text x="512" y="560" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="white">${styleCode}</text>
  <text x="512" y="640" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">Art Style Placeholder</text>
</svg>`;

  // Write the file
  try {
    fs.writeFileSync(outputFile, svgContent);
    console.log(`✅ Created placeholder SVG for ${styleCode}`);
  } catch (error) {
    console.error(`❌ Error creating placeholder for ${styleCode}:`, error);
  }
});

console.log(`\nCreated ${styleCodes.length} placeholder SVGs in ${OUTPUT_DIR}`);
