#!/usr/bin/env python3
"""
Script to generate art style thumbnails using the OpenAI API
"""

import os
import base64
import time
from openai import OpenAI

# OpenAI API key - replace with your actual key when running
API_KEY = "YOUR_OPENAI_API_KEY"

# Output directory
OUTPUT_DIR = "public/assets/style-thumbnails"

# Create output directory if it doesn't exist
os.makedirs(OUTPUT_DIR, exist_ok=True)
print(f"Output directory: {OUTPUT_DIR}")

# Initialize OpenAI client
client = OpenAI(api_key=API_KEY)

# Art styles to generate
art_styles = [
    {
        "id": "watercolor_storybook",
        "name": "Watercolor Storybook",
        "prompt": "Create a soft watercolor children's book illustration of a teddy bear. Gentle pastel colors, light brushstrokes, warm atmosphere, simple natural background."
    },
    {
        "id": "cartoon_semi_realistic",
        "name": "Cartoon Character (Semi-Realistic)",
        "prompt": "Create a cartoon-style teddy bear character. Bold outlines, colorful, expressive, children's book energy."
    },
    {
        "id": "storybook_fantasy",
        "name": "Storybook Fantasy Style (Detailed)",
        "prompt": "Create a richly detailed fantasy storybook teddy bear. Magical elements, lush textures, and glowing ambiance."
    }
]

def generate_image(style_id, prompt):
    """Generate an image for a style using the OpenAI API"""
    output_file = os.path.join(OUTPUT_DIR, f"{style_id}.png")

    print(f"Generating image for style: {style_id}")
    print(f"Prompt: {prompt}")

    try:
        # Make the API request
        response = client.images.generate(
            model="gpt-image-1",
            prompt=prompt,
            n=1,
            size="1024x1024",
            quality="high",
            response_format="b64_json"
        )

        # Get the image data
        image_data = response.data[0].b64_json
        image_bytes = base64.b64decode(image_data)

        # Save the image
        with open(output_file, "wb") as f:
            f.write(image_bytes)

        print(f"✅ Successfully generated image for {style_id}")
        print(f"   Saved to: {output_file}")
        return True

    except Exception as e:
        print(f"❌ Failed to generate image for {style_id}")
        print(f"   Error: {str(e)}")
        return False

def main():
    """Main function to generate all thumbnails"""
    print(f"Starting generation of {len(art_styles)} art style thumbnails...")

    success_count = 0

    # Process styles sequentially
    for style in art_styles:
        if generate_image(style["id"], style["prompt"]):
            success_count += 1

        # Add a delay to avoid rate limiting
        time.sleep(2)

    print(f"Generation complete! Successfully generated {success_count}/{len(art_styles)} thumbnails.")
    print(f"Check the {OUTPUT_DIR} directory for the generated images.")

if __name__ == "__main__":
    main()
