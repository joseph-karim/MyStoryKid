#!/bin/bash

# Set your OpenAI API key
API_KEY="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"

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
