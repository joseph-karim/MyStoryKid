/**
 * Script to organize art style thumbnails
 * 
 * This script:
 * 1. Creates a directory for style thumbnails if it doesn't exist
 * 2. Creates placeholder images for all art styles
 * 3. Copies existing thumbnails from dist/assets if available
 */

const fs = require('fs');
const path = require('path');

// Directories
const OUTPUT_DIR = path.join(__dirname, '../public/assets/style-thumbnails');
const DIST_ASSETS_DIR = path.join(__dirname, '../dist/assets');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created output directory: ${OUTPUT_DIR}`);
}

// Art styles with their categories
const artStyles = [
  // Traditional/Classic Styles
  {
    id: 'watercolor_storybook',
    name: 'Watercolor Storybook',
    category: 'Traditional/Classic Styles',
    prompt: 'Create a soft watercolor children\'s book illustration of a teddy bear. Gentle pastel colors, light brushstrokes, warm atmosphere, simple natural background.'
  },
  {
    id: 'ink_watercolor_wash',
    name: 'Ink and Watercolor Wash',
    category: 'Traditional/Classic Styles',
    prompt: 'Create a fine ink line and watercolor wash illustration of a teddy bear. Clean, classic lines with bright washes of color, lively children\'s book feel.'
  },
  {
    id: 'pencil_sketch_soft_color',
    name: 'Pencil Sketch with Soft Color',
    category: 'Traditional/Classic Styles',
    prompt: 'Create a lightly colored pencil sketch illustration of a teddy bear. Soft pastels and delicate textures, storybook aesthetic.'
  },
  {
    id: 'oil_pastel',
    name: 'Oil Pastel Illustration',
    category: 'Traditional/Classic Styles',
    prompt: 'Create an oil pastel style children\'s illustration of a teddy bear. Rich, creamy textures and bold, joyful colors.'
  },
  {
    id: 'gouache_painting',
    name: 'Gouache Painting Style',
    category: 'Traditional/Classic Styles',
    prompt: 'Create a gouache-style children\'s book illustration of a teddy bear. Matte colors, thick brush strokes, vibrant and playful.'
  },
  
  // Bold, Playful, and Cartoon Styles
  {
    id: 'cartoon_semi_realistic',
    name: 'Cartoon Character (Semi-Realistic)',
    category: 'Bold, Playful, and Cartoon Styles',
    prompt: 'Create a cartoon-style teddy bear character. Bold outlines, colorful, expressive, children\'s book energy.'
  },
  {
    id: 'flat_vector_soft_gradient',
    name: 'Flat Vector Art (Soft Gradient)',
    category: 'Bold, Playful, and Cartoon Styles',
    prompt: 'Create a flat vector-style illustration of a teddy bear. Clean lines, soft shading, bright minimalistic colors.'
  },
  {
    id: 'cut_paper_collage',
    name: 'Cut-Paper Collage (Eric Carle Inspired)',
    category: 'Bold, Playful, and Cartoon Styles',
    prompt: 'Create a cut-paper collage style illustration of a teddy bear. Bright textured paper layers, playful and vivid, inspired by Eric Carle.'
  },
  {
    id: 'crayon_watercolor',
    name: 'Crayon Drawing with Watercolor Wash',
    category: 'Bold, Playful, and Cartoon Styles',
    prompt: 'Create a crayon-drawn teddy bear with watercolor textures. Childlike, joyful, and colorful.'
  },
  {
    id: 'claymation',
    name: '3D Claymation Illustration Style',
    category: 'Bold, Playful, and Cartoon Styles',
    prompt: 'Create a 3D claymation-style children\'s book teddy bear character. Soft clay textures, rounded features, bright colors.'
  },
  
  // Whimsical, Dreamy, and Fantasy Styles
  {
    id: 'pastel_dreamscape',
    name: 'Pastel Dreamscape',
    category: 'Whimsical, Dreamy, and Fantasy Styles',
    prompt: 'Create a pastel dreamscape style teddy bear. Light colors, glowing soft highlights, magical dreamy mood.'
  },
  {
    id: 'storybook_fantasy',
    name: 'Storybook Fantasy Style (Detailed)',
    category: 'Whimsical, Dreamy, and Fantasy Styles',
    prompt: 'Create a richly detailed fantasy storybook teddy bear. Magical elements, lush textures, and glowing ambiance.'
  },
  {
    id: 'soft_plush_toy',
    name: 'Soft Plush Toy Style',
    category: 'Whimsical, Dreamy, and Fantasy Styles',
    prompt: 'Create a plush toy-style illustration of a teddy bear. Soft textures, slightly simplified features, extremely cuddly look.'
  },
  {
    id: 'glow_in_dark',
    name: 'Glow-In-The-Dark Illustration Style',
    category: 'Whimsical, Dreamy, and Fantasy Styles',
    prompt: 'Create a children\'s book illustration of a teddy bear using glow-in-the-dark style: dark background, character softly illuminated, magical feel.'
  },
  {
    id: 'stained_glass',
    name: 'Stained Glass Storybook Style',
    category: 'Whimsical, Dreamy, and Fantasy Styles',
    prompt: 'Create a stained-glass inspired children\'s book teddy bear. Bright vibrant color panels, storybook setting.'
  },
  
  // Cultural, Folk, and Retro-Inspired Styles
  {
    id: 'folk_art',
    name: 'Folk Art Style (Flat, Traditional Motifs)',
    category: 'Cultural, Folk, and Retro-Inspired Styles',
    prompt: 'Create a folk-art inspired children\'s book teddy bear. Bold shapes, traditional motifs, rich flat colors.'
  },
  {
    id: 'vintage_european',
    name: 'Vintage European Storybook (1950s)',
    category: 'Cultural, Folk, and Retro-Inspired Styles',
    prompt: 'Create a mid-century European children\'s book illustration of a teddy bear. Muted palette, geometric shapes, nostalgic feel.'
  },
  {
    id: 'retro_70s',
    name: 'Retro 1970s Children\'s Book Style',
    category: 'Cultural, Folk, and Retro-Inspired Styles',
    prompt: 'Create a 1970s retro-style teddy bear. Warm oranges, browns, and golds, stylized and cheerful.'
  },
  {
    id: 'modern_sumi_e',
    name: 'Traditional Japanese Sumi-e with a Modern Twist',
    category: 'Cultural, Folk, and Retro-Inspired Styles',
    prompt: 'Create a children\'s teddy bear illustration using a modern sumi-e style: ink brush textures, light color accents, serene mood.'
  },
  {
    id: 'nordic_storybook',
    name: 'Nordic Storybook Style (Winter Cozy)',
    category: 'Cultural, Folk, and Retro-Inspired Styles',
    prompt: 'Create a Nordic storybook teddy bear. Cool tones, woolly clothes, snow and cozy winter forest setting.'
  },
  
  // Mixed Media, Creative, and Experimental Styles
  {
    id: 'chalkboard',
    name: 'Chalkboard Drawing Style',
    category: 'Mixed Media, Creative, and Experimental Styles',
    prompt: 'Create a colorful chalk drawing of a teddy bear. Bright simple lines on a dark background, playful and whimsical.'
  },
  {
    id: 'watercolor_collage',
    name: 'Watercolor + Collage Hybrid',
    category: 'Mixed Media, Creative, and Experimental Styles',
    prompt: 'Create a children\'s illustration of a teddy bear, blending watercolor painting and cut-paper collage for layered textures.'
  },
  {
    id: 'soft_pixel_art',
    name: 'Soft Pixel Art Style (Retro Game Inspired)',
    category: 'Mixed Media, Creative, and Experimental Styles',
    prompt: 'Create a soft pixel art version of a teddy bear. Rounded pixels, bright colors, gentle gradients for a children\'s book look.'
  },
  {
    id: 'digital_airbrush',
    name: 'Digital Airbrush Painting',
    category: 'Mixed Media, Creative, and Experimental Styles',
    prompt: 'Create a smooth airbrushed digital painting of a teddy bear. Bright colors, soft gradients, friendly and vibrant style.'
  },
  {
    id: 'colored_pencil_marker',
    name: 'Colored Pencil and Marker Combo Style',
    category: 'Mixed Media, Creative, and Experimental Styles',
    prompt: 'Create a children\'s book illustration of a teddy bear with colored pencil textures and bright marker accents. Playful and vivid.'
  },
  {
    id: 'paper_theater',
    name: 'Paper Theater Diorama Style',
    category: 'Mixed Media, Creative, and Experimental Styles',
    prompt: 'Create a children\'s book teddy bear styled like a 3D paper diorama theater scene. Layered paper depth and lighting.'
  },
  {
    id: 'minimalist_watercolor',
    name: 'Minimalist Line Art + Watercolor Splash',
    category: 'Mixed Media, Creative, and Experimental Styles',
    prompt: 'Create a minimalist line art illustration of a teddy bear with loose watercolor splashes for color. Clean, elegant, gentle style for children.'
  },
  
  // Original styles from previous implementation
  {
    id: 'storytime_whimsy',
    name: 'Storytime Whimsy',
    category: 'Original Styles',
    prompt: 'Use a whimsical, storybook-style with soft colors, gentle outlines, and a classic children\'s book feel.'
  },
  {
    id: 'fantasy_hero',
    name: 'Fantasy Hero',
    category: 'Original Styles',
    prompt: 'Create a bold, heroic illustration with vibrant colors and dynamic poses, similar to fantasy adventure books.'
  },
  {
    id: 'soft_radiance',
    name: 'Soft Radiance',
    category: 'Original Styles',
    prompt: 'Use soft, glowing lighting with gentle gradients and a dreamy atmosphere.'
  },
  {
    id: 'joyful_clay',
    name: 'Joyful Clay',
    category: 'Original Styles',
    prompt: 'Create a 3D clay-like appearance with smooth textures and rounded forms.'
  },
  {
    id: 'ceramic_lifelike',
    name: 'Ceramic Lifelike',
    category: 'Original Styles',
    prompt: 'Use a 3D ceramic quality with smooth textures and subtle shading.'
  },
  {
    id: 'colorful_felt',
    name: 'Colorful Felt',
    category: 'Original Styles',
    prompt: 'Create a textured illustration mimicking felt crafts with visible texture and rich colors.'
  },
  {
    id: 'sketch_elegance',
    name: 'Sketch Elegance',
    category: 'Original Styles',
    prompt: 'Use detailed pencil sketch style with subtle shading and fine linework.'
  },
  {
    id: 'aquarelle_life',
    name: 'Aquarelle Life',
    category: 'Original Styles',
    prompt: 'Create a watercolor painting effect with soft edges, color bleeds, and transparent layers.'
  },
  {
    id: 'vivid_tableaux',
    name: 'Vivid Tableaux',
    category: 'Original Styles',
    prompt: 'Use rich, vibrant colors with detailed scenes and dramatic lighting.'
  },
  {
    id: 'dreamy_3d',
    name: 'Dreamy 3D',
    category: 'Original Styles',
    prompt: 'Create a soft 3D rendered illustration with a dreamy quality and gentle lighting.'
  },
  {
    id: 'cutie_3d',
    name: 'Cutie 3D',
    category: 'Original Styles',
    prompt: 'Use adorable 3D characters with expressive features and smooth textures.'
  },
  {
    id: 'shimmering_glow',
    name: 'Shimmering Glow',
    category: 'Original Styles',
    prompt: 'Create an illustration with a magical luminous quality and soft glowing highlights.'
  },
  {
    id: 'surreal_iridescence',
    name: 'Surreal Iridescence',
    category: 'Original Styles',
    prompt: 'Use dreamlike scenes with shimmering, rainbow-like colors and fantastical elements.'
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour',
    category: 'Original Styles',
    prompt: 'Create a warm, golden-lit scene with rich amber tones and soft shadows.'
  },
  {
    id: 'inked_realism',
    name: 'Inked Realism',
    category: 'Original Styles',
    prompt: 'Use detailed portraits with an ink-drawn quality and fine linework.'
  },
  {
    id: 'magic_portrait',
    name: 'Magic Portrait',
    category: 'Original Styles',
    prompt: 'Create semi-stylized portraits with a magical, fantasy quality and ethereal lighting.'
  },
  {
    id: 'warm_portrait',
    name: 'Warm Portrait',
    category: 'Original Styles',
    prompt: 'Use realistic portraits with warm lighting and preserved facial features.'
  },
  {
    id: 'vintage_engraving',
    name: 'Vintage Engraving',
    category: 'Original Styles',
    prompt: 'Create an old-fashioned engraved look with fine lines and cross-hatching details.'
  },
  {
    id: 'ancient_china',
    name: 'Ancient China',
    category: 'Original Styles',
    prompt: 'Use traditional Chinese painting style with elegant brushwork and subtle ink washes.'
  },
  {
    id: 'graffiti_splash',
    name: 'Graffiti Splash',
    category: 'Original Styles',
    prompt: 'Create an urban street art style with bold colors and spray paint effects.'
  }
];

// Create a simple placeholder SVG for styles without thumbnails
function createPlaceholderSVG(styleId, styleName) {
  // Generate a color based on the style ID (for visual variety)
  const hash = styleId.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  const hue = hash % 360;
  const saturation = 70 + (hash % 30);
  const lightness = 60 + (hash % 20);
  const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    <rect width="1024" height="1024" fill="${color}" />
    <rect x="12" y="12" width="1000" height="1000" fill="white" fill-opacity="0.1" stroke="white" stroke-width="4" />
    <text x="512" y="480" font-family="Arial, sans-serif" font-size="48" text-anchor="middle" fill="white">${styleName}</text>
    <text x="512" y="560" font-family="Arial, sans-serif" font-size="32" text-anchor="middle" fill="white">${styleId}</text>
    <text x="512" y="640" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="white">Placeholder Thumbnail</text>
  </svg>`;
}

// Process each art style
console.log(`Processing ${artStyles.length} art styles...`);

// Group styles by category for reporting
const stylesByCategory = {};

artStyles.forEach(style => {
  const outputFile = path.join(OUTPUT_DIR, `${style.id}.png`);
  
  // Check if we already have this thumbnail in dist/assets
  const possibleExistingFiles = [
    path.join(DIST_ASSETS_DIR, `${style.id}.png`),
    path.join(DIST_ASSETS_DIR, `${style.name.replace(/\s+/g, '-')}.png`),
    path.join(DIST_ASSETS_DIR, `style-${style.id}.png`)
  ];
  
  let thumbnailCreated = false;
  
  // Try to copy from existing files
  for (const existingFile of possibleExistingFiles) {
    if (fs.existsSync(existingFile)) {
      try {
        fs.copyFileSync(existingFile, outputFile);
        console.log(`✅ Copied existing thumbnail for ${style.id} from ${existingFile}`);
        thumbnailCreated = true;
        break;
      } catch (error) {
        console.error(`❌ Error copying ${existingFile}:`, error);
      }
    }
  }
  
  // If no existing thumbnail was found, create a placeholder
  if (!thumbnailCreated) {
    try {
      const placeholderSVG = createPlaceholderSVG(style.id, style.name);
      fs.writeFileSync(outputFile.replace('.png', '.svg'), placeholderSVG);
      console.log(`✅ Created placeholder SVG for ${style.id}`);
    } catch (error) {
      console.error(`❌ Error creating placeholder for ${style.id}:`, error);
    }
  }
  
  // Add to category for reporting
  if (!stylesByCategory[style.category]) {
    stylesByCategory[style.category] = [];
  }
  stylesByCategory[style.category].push(style);
});

// Generate a report
console.log('\n=== Art Style Thumbnails Report ===');
console.log(`Total styles: ${artStyles.length}`);
console.log(`Output directory: ${OUTPUT_DIR}`);
console.log('\nStyles by category:');

Object.entries(stylesByCategory).forEach(([category, styles]) => {
  console.log(`\n${category} (${styles.length} styles):`);
  styles.forEach(style => {
    console.log(`  - ${style.name} (${style.id})`);
  });
});

// Generate an HTML preview page
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
  </style>
</head>
<body>
  <h1>Art Style Thumbnails</h1>
  
  ${Object.entries(stylesByCategory).map(([category, styles]) => `
    <div class="category">
      <h2 class="category-title">${category} (${styles.length} styles)</h2>
      <div class="thumbnails">
        ${styles.map(style => `
          <div class="thumbnail">
            <img src="style-thumbnails/${style.id}.png" onerror="this.src='style-thumbnails/${style.id}.svg'" alt="${style.name}">
            <div class="thumbnail-info">
              <div class="thumbnail-name">${style.name}</div>
              <div class="thumbnail-id">${style.id}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')}
</body>
</html>`;

// Save the HTML preview
fs.writeFileSync(path.join(__dirname, '../public/style-thumbnails-preview.html'), htmlPreview);
console.log('\n✅ Generated HTML preview page: public/style-thumbnails-preview.html');
