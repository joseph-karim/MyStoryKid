#!/bin/bash

# Simple script to generate art style thumbnails using the OpenAI API

# OpenAI API key - replace with your actual key when running
API_KEY="YOUR_OPENAI_API_KEY"

# Output directory
OUTPUT_DIR="public/assets/style-thumbnails"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Function to generate an image for a style
generate_image() {
  local style_id="$1"
  local prompt="$2"
  local output_file="$OUTPUT_DIR/$style_id.png"

  echo "Generating image for style: $style_id"
  echo "Prompt: $prompt"

  # Make the API request
  curl -s "https://api.openai.com/v1/images/generations" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "{
      \"model\": \"gpt-image-1\",
      \"prompt\": \"$prompt\",
      \"n\": 1,
      \"size\": \"1024x1024\",
      \"quality\": \"high\",
      \"response_format\": \"b64_json\"
    }" | jq -r '.data[0].b64_json' | base64 --decode > "$output_file"

  # Check if the file was created successfully
  if [ -s "$output_file" ]; then
    echo "✅ Successfully generated image for $style_id"
    echo "   Saved to: $output_file"
  else
    echo "❌ Failed to generate image for $style_id"
    # Check if there was an error message
    curl -s "https://api.openai.com/v1/images/generations" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $API_KEY" \
      -d "{
        \"model\": \"gpt-image-1\",
        \"prompt\": \"$prompt\",
        \"n\": 1,
        \"size\": \"1024x1024\",
        \"quality\": \"high\",
        \"response_format\": \"b64_json\"
      }" | jq '.error'
  fi

  # Add a delay to avoid rate limiting
  sleep 2
}

# Generate thumbnails for different art styles
generate_image "watercolor_storybook" "Create a soft watercolor children's book illustration of a teddy bear. Gentle pastel colors, light brushstrokes, warm atmosphere, simple natural background."
generate_image "cartoon_semi_realistic" "Create a cartoon-style teddy bear character. Bold outlines, colorful, expressive, children's book energy."
generate_image "storybook_fantasy" "Create a richly detailed fantasy storybook teddy bear. Magical elements, lush textures, and glowing ambiance."

echo "All thumbnails generated!"
echo "Check the $OUTPUT_DIR directory for the generated images."
