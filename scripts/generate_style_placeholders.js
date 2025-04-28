/**
 * Script to generate placeholder SVG thumbnails for all art styles
 */

const fs = require('fs');
const path = require('path');

// Output directory
const OUTPUT_DIR = path.join(__dirname, '../public/assets/style-thumbnails');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Art styles with their categories and colors
const artStyles = [
  // WATERCOLOR & TRADITIONAL PAINTING STYLES
  { id: 'watercolor_storybook', name: 'Watercolor Storybook', category: 'Watercolor & Traditional', color: '#7eb5d6', description: 'Soft watercolor with gentle colors' },
  { id: 'watercolor_splash', name: 'Watercolor Splash', category: 'Watercolor & Traditional', color: '#3498db', description: 'Minimalist with watercolor splashes' },
  { id: 'gouache_painting', name: 'Gouache Painting', category: 'Watercolor & Traditional', color: '#9b59b6', description: 'Matte colors with thick brush strokes' },
  { id: 'oil_pastel', name: 'Oil Pastel', category: 'Watercolor & Traditional', color: '#e74c3c', description: 'Rich, creamy textures and bold colors' },
  
  // INK & DRAWING STYLES
  { id: 'ink_wash', name: 'Ink & Watercolor Wash', category: 'Ink & Drawing', color: '#34495e', description: 'Fine ink lines with color washes' },
  { id: 'pencil_sketch', name: 'Pencil Sketch', category: 'Ink & Drawing', color: '#95a5a6', description: 'Soft pencil with delicate textures' },
  { id: 'colored_pencil', name: 'Colored Pencil', category: 'Ink & Drawing', color: '#f1c40f', description: 'Colored pencil with marker accents' },
  { id: 'chalk_drawing', name: 'Chalk Drawing', category: 'Ink & Drawing', color: '#2c3e50', description: 'Bright lines on dark background' },
  
  // CARTOON & VECTOR STYLES
  { id: 'cartoon_character', name: 'Cartoon Character', category: 'Cartoon & Vector', color: '#e67e22', description: 'Bold outlines with expressive features' },
  { id: 'flat_vector', name: 'Flat Vector', category: 'Cartoon & Vector', color: '#1abc9c', description: 'Clean lines with minimalistic colors' },
  { id: 'pixel_art', name: 'Pixel Art', category: 'Cartoon & Vector', color: '#3498db', description: 'Rounded pixels with gentle gradients' },
  
  // 3D & TEXTURED STYLES
  { id: 'clay_animation', name: 'Clay Animation', category: '3D & Textured', color: '#d35400', description: 'Soft clay textures with rounded features' },
  { id: 'plush_toy', name: 'Plush Toy', category: '3D & Textured', color: '#f39c12', description: 'Soft textures with cuddly look' },
  { id: 'felt_craft', name: 'Felt Craft', category: '3D & Textured', color: '#27ae60', description: 'Textured felt with rich colors' },
  { id: 'paper_cutout', name: 'Paper Cutout', category: '3D & Textured', color: '#16a085', description: 'Bright textured paper layers' },
  { id: 'paper_diorama', name: 'Paper Diorama', category: '3D & Textured', color: '#2980b9', description: 'Layered paper depth and lighting' },
  
  // FANTASY & MAGICAL STYLES
  { id: 'fantasy_storybook', name: 'Fantasy Storybook', category: 'Fantasy & Magical', color: '#8e44ad', description: 'Richly detailed with magical elements' },
  { id: 'dreamy_glow', name: 'Dreamy Glow', category: 'Fantasy & Magical', color: '#9b59b6', description: 'Pastel colors with soft highlights' },
  { id: 'magical_light', name: 'Magical Light', category: 'Fantasy & Magical', color: '#3498db', description: 'Luminous quality with glowing highlights' },
  { id: 'stained_glass', name: 'Stained Glass', category: 'Fantasy & Magical', color: '#2c3e50', description: 'Vibrant color panels with dark outlines' },
  
  // CULTURAL & HISTORICAL STYLES
  { id: 'folk_art', name: 'Folk Art', category: 'Cultural & Historical', color: '#c0392b', description: 'Bold shapes with traditional motifs' },
  { id: 'vintage_midcentury', name: 'Vintage Midcentury', category: 'Cultural & Historical', color: '#7f8c8d', description: 'Muted palette with geometric shapes' },
  { id: 'retro_70s', name: 'Retro 70s', category: 'Cultural & Historical', color: '#d35400', description: 'Warm oranges, browns, and golds' },
  { id: 'asian_brushwork', name: 'Asian Brushwork', category: 'Cultural & Historical', color: '#2c3e50', description: 'Ink textures with light color accents' },
  { id: 'nordic_cozy', name: 'Nordic Cozy', category: 'Cultural & Historical', color: '#3498db', description: 'Cool tones with cozy winter setting' },
  
  // LIGHTING & MOOD STYLES
  { id: 'golden_hour', name: 'Golden Hour', category: 'Lighting & Mood', color: '#f39c12', description: 'Warm, golden tones with soft shadows' },
  { id: 'night_glow', name: 'Night Glow', category: 'Lighting & Mood', color: '#2c3e50', description: 'Dark background with illuminated elements' },
  { id: 'vibrant_scene', name: 'Vibrant Scene', category: 'Lighting & Mood', color: '#e74c3c', description: 'Rich colors with dramatic lighting' },
  
  // DIGITAL & MODERN STYLES
  { id: 'digital_airbrush', name: 'Digital Airbrush', category: 'Digital & Modern', color: '#3498db', description: 'Smooth gradients with vibrant colors' },
  { id: 'mixed_media', name: 'Mixed Media', category: 'Digital & Modern', color: '#9b59b6', description: 'Blended watercolor and collage textures' }
];

// Create a placeholder SVG for each style
artStyles.forEach(style => {
  const outputFile = path.join(OUTPUT_DIR, `${style.id}.svg`);
  
  // Skip if the file already exists
  if (fs.existsSync(outputFile)) {
    console.log(`Skipping ${style.id} - file already exists`);
    return;
  }
  
  // Create SVG content
  const svgContent = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect width="1024" height="1024" fill="${style.color}" />
  <rect x="12" y="12" width="1000" height="1000" fill="white" fill-opacity="0.1" stroke="white" stroke-width="4" />
  <text x="512" y="400" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">${style.category}</text>
  <text x="512" y="480" font-family="Arial, sans-serif" font-size="48" text-anchor="middle" fill="white">${style.name}</text>
  <text x="512" y="560" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="white">${style.id}</text>
  <text x="512" y="640" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">${style.description}</text>
</svg>`;
  
  // Write the file
  try {
    fs.writeFileSync(outputFile, svgContent);
    console.log(`✅ Created placeholder SVG for ${style.id}`);
  } catch (error) {
    console.error(`❌ Error creating placeholder for ${style.id}:`, error);
  }
});

// Create an HTML preview page
const htmlPreview = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Art Style Thumbnails</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 30px;
    }
    .category {
      margin-bottom: 40px;
    }
    .category-title {
      font-size: 1.5rem;
      color: #444;
      border-bottom: 2px solid #ddd;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .thumbnails {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 20px;
    }
    .thumbnail {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .thumbnail:hover {
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.15);
    }
    .thumbnail img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
    }
    .thumbnail-info {
      padding: 15px;
    }
    .thumbnail-name {
      font-weight: bold;
      margin-bottom: 5px;
      color: #333;
    }
    .thumbnail-id {
      font-size: 0.8rem;
      color: #777;
    }
    .thumbnail-description {
      font-size: 0.9rem;
      margin-top: 5px;
      color: #555;
    }
  </style>
</head>
<body>
  <h1>Art Style Thumbnails</h1>
  
  ${Array.from(new Set(artStyles.map(style => style.category))).map(category => `
    <div class="category">
      <h2 class="category-title">${category}</h2>
      <div class="thumbnails">
        ${artStyles.filter(style => style.category === category).map(style => `
          <div class="thumbnail">
            <img src="assets/style-thumbnails/${style.id}.svg" alt="${style.name}">
            <div class="thumbnail-info">
              <div class="thumbnail-name">${style.name}</div>
              <div class="thumbnail-id">${style.id}</div>
              <div class="thumbnail-description">${style.description}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')}
  
  <script>
    // Add error handling for images that fail to load
    document.querySelectorAll('.thumbnail img').forEach(img => {
      img.onerror = function() {
        this.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%3E%3Crect%20fill%3D%22%23ddd%22%20width%3D%22200%22%20height%3D%22200%22%2F%3E%3Ctext%20fill%3D%22%23666%22%20font-family%3D%22sans-serif%22%20font-size%3D%2220%22%20dy%3D%22.35em%22%20text-anchor%3D%22middle%22%20x%3D%22100%22%20y%3D%22100%22%3EImage%20not%20found%3C%2Ftext%3E%3C%2Fsvg%3E';
        this.parentNode.querySelector('.thumbnail-info').innerHTML += '<div style="color: #c00; font-size: 0.8rem; margin-top: 5px;">Image not found</div>';
      };
    });
  </script>
</body>
</html>`;

// Save the HTML preview
fs.writeFileSync(path.join(__dirname, '../public/style-thumbnails-preview.html'), htmlPreview);
console.log('\n✅ Generated HTML preview page: public/style-thumbnails-preview.html');

console.log('\nAll done! Generated placeholders for all art styles.');
