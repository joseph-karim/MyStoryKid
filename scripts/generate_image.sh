#!/bin/bash

# Set your OpenAI API key - replace with your actual key when running
API_KEY="YOUR_OPENAI_API_KEY"

# Create the output directory if it doesn't exist
mkdir -p public/assets/style-thumbnails

# Style to generate
STYLE_ID="watercolor_storybook"
PROMPT="Create a soft watercolor children's book illustration of a teddy bear. Gentle pastel colors, light brushstrokes, warm atmosphere, simple natural background."

echo "Generating image for style: $STYLE_ID"
echo "Prompt: $PROMPT"

# Make the API request
curl -s https://api.openai.com/v1/images/generations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d "{
    \"model\": \"gpt-image-1\",
    \"prompt\": \"$PROMPT\",
    \"n\": 1,
    \"size\": \"1024x1024\",
    \"quality\": \"high\",
    \"response_format\": \"b64_json\"
  }" | jq -r '.data[0].b64_json' | base64 --decode > public/assets/style-thumbnails/$STYLE_ID.png

echo "Image saved to public/assets/style-thumbnails/$STYLE_ID.png"
