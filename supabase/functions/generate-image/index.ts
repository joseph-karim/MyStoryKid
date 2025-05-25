// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface ImageRequest {
  prompt: string
  size?: '1024x1024' | '1536x1024' | '1024x1536'
  quality?: 'low' | 'medium' | 'high'
  model?: string
  referenceImages?: string[] // Array of base64 encoded reference images
  mask?: string // Base64 encoded mask for inpainting
  timeout?: number
  n?: number
}

interface ImageResponse {
  imageUrl: string
  revisedPrompt?: string
  error?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to convert base64 data URL to blob
const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const base64Data = dataUrl.replace(/^data:image\/[a-z]+;base64,/, '')
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
  return new Blob([binaryData], { type: 'image/png' })
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      prompt, 
      size = '1024x1024',
      quality = 'medium',
      model = 'gpt-image-1',
      referenceImages = [],
      mask,
      timeout = 60000,
      n = 1
    }: ImageRequest = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    let endpoint = 'https://api.openai.com/v1/images/generations'
    let requestBody: any = null
    let formData: FormData | null = null

    // If we have reference images, use the edits endpoint (matching your existing implementation)
    if (referenceImages.length > 0) {
      endpoint = 'https://api.openai.com/v1/images/edits'
      
      // Create FormData for multipart request
      formData = new FormData()
      formData.append('model', model)
      formData.append('prompt', prompt)
      formData.append('size', size)
      if (n) formData.append('n', n.toString())

      // For gpt-image-1, we need to handle the API differently
      // The API expects all images (main + references) as 'image[]'
      for (let i = 0; i < referenceImages.length; i++) {
        const refBlob = await dataUrlToBlob(referenceImages[i])
        formData.append('image[]', refBlob, `reference_${i}.png`)
      }

      // Add mask if provided
      if (mask) {
        const maskBlob = await dataUrlToBlob(mask)
        formData.append('mask', maskBlob, 'mask.png')
      }

      console.log('Using image edits endpoint with reference images:', referenceImages.length)
    } else {
      // Standard image generation without references
      requestBody = {
        model,
        prompt,
        size,
        n
      }
      console.log('Using standard image generation endpoint')
    }

    // Make the API request
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      }
    }

    if (formData) {
      // For edits endpoint with FormData
      requestOptions.body = formData
    } else {
      // For generations endpoint with JSON
      requestOptions.headers = {
        ...requestOptions.headers,
        'Content-Type': 'application/json'
      }
      requestOptions.body = JSON.stringify(requestBody)
    }

    const openaiResponse = await fetch(endpoint, requestOptions)

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text()
      console.error('OpenAI API error:', errorData)
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${openaiResponse.status} - ${errorData}` }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiData = await openaiResponse.json()
    
    if (!openaiData.data || openaiData.data.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No image data in response' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract the base64 image data - handle both response formats
    const imageData = openaiData.data[0].b64_json || openaiData.data[0].url
    const revisedPrompt = openaiData.data[0].revised_prompt

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'Invalid image data in response' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // If we got a URL, return it directly
    let finalImageUrl: string
    if (imageData.startsWith('http')) {
      finalImageUrl = imageData
    } else {
      // Return as data URL
      finalImageUrl = `data:image/png;base64,${imageData}`
    }

    const response: ImageResponse = {
      imageUrl: finalImageUrl,
      revisedPrompt
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in generate-image function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To invoke:

  // Standard image generation:
  curl -i --location --request POST 'https://uvziaiimktymmjwqgknl.supabase.co/functions/v1/generate-image' \
    --header 'Authorization: Bearer [YOUR_ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{
      "prompt": "A colorful illustration of a brave little mouse wearing a red cape, children'\''s book style",
      "size": "1024x1024",
      "quality": "high"
    }'

  // Image generation with reference images (for character/style consistency):
  curl -i --location --request POST 'https://uvziaiimktymmjwqgknl.supabase.co/functions/v1/generate-image' \
    --header 'Authorization: Bearer [YOUR_ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{
      "prompt": "A colorful illustration of a brave little mouse wearing a red cape, children'\''s book style",
      "referenceImages": [
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
      ],
      "size": "1536x1024",
      "quality": "high"
    }'

*/
