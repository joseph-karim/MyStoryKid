# Art Style Thumbnail Generation

This directory contains scripts to generate art style thumbnails using the OpenAI API.

## Prerequisites

Before running these scripts, make sure you have:

1. Node.js installed
2. An OpenAI API key with access to the `gpt-image-1` model
3. The required dependencies installed:
   ```
   npm install axios dotenv
   ```

## Environment Setup

Create a `.env` file in the root directory of the project with your OpenAI API key:

```
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

## Scripts

### 1. Generate Sample Thumbnails

To test the thumbnail generation with just a few styles:

```bash
node scripts/generate_sample_thumbnails.js
```

This will generate 5 sample thumbnails to verify that the API is working correctly.

### 2. Generate All Thumbnails

To generate thumbnails for all 27 art styles:

```bash
node scripts/generate_style_thumbnails.js
```

This script will:
- Create a directory at `public/assets/style-thumbnails` if it doesn't exist
- Generate a thumbnail for each art style
- Save the thumbnails as PNG files named after their style IDs

### 3. View Generated Thumbnails

After generating the thumbnails, you can view them by opening:

```
scripts/view_style_thumbnails.html
```

This HTML file displays all the generated thumbnails organized by category.

## Notes

- The scripts include a delay between API calls to avoid rate limiting
- Each thumbnail uses a teddy bear as the subject for consistency
- The generated thumbnails are 1024x1024 pixels in size
- The scripts handle errors gracefully and will continue generating other thumbnails if one fails

## Style IDs

The generated thumbnails will have the following filenames (style IDs):

### Traditional/Classic Styles
- `watercolor_storybook.png`
- `ink_watercolor_wash.png`
- `pencil_sketch_soft_color.png`
- `oil_pastel.png`
- `gouache_painting.png`

### Bold, Playful, and Cartoon Styles
- `cartoon_semi_realistic.png`
- `flat_vector_soft_gradient.png`
- `cut_paper_collage.png`
- `crayon_watercolor.png`
- `claymation.png`

### Whimsical, Dreamy, and Fantasy Styles
- `pastel_dreamscape.png`
- `storybook_fantasy.png`
- `soft_plush_toy.png`
- `glow_in_dark.png`
- `stained_glass.png`

### Cultural, Folk, and Retro-Inspired Styles
- `folk_art.png`
- `vintage_european.png`
- `retro_70s.png`
- `modern_sumi_e.png`
- `nordic_storybook.png`

### Mixed Media, Creative, and Experimental Styles
- `chalkboard.png`
- `watercolor_collage.png`
- `soft_pixel_art.png`
- `digital_airbrush.png`
- `colored_pencil_marker.png`
- `paper_theater.png`
- `minimalist_watercolor.png`
