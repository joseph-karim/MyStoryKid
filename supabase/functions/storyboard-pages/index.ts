// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface StoryRequest {
  prompt: string
  temperature?: number
  max_tokens?: number
  model?: string
}

interface StoryResponse {
  content: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  error?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// --- Storyboarding Edge Function ---
// Accepts an array of story pages and returns structured scene/character/prompt info for each page.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { pages, characters = [], style = '', model = 'gpt-4o', temperature = 0.4, max_tokens = 2048 } = await req.json();
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Pages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // --- Enhanced System Prompt ---
    const systemPrompt = `You are a storyboarding assistant for children's books. For each page, extract:
- The characters present (by id, name, role, and referenceKey from the provided character list)
- For each character, specify their pose and expression in the scene (if possible)
- The setting (concise, e.g. 'Ezra's bedroom, morning light')
- A detailed imagePrompt for an illustrator (scene, mood, composition, style: ${style || 'default'})
Return a JSON array, one object per page, with keys: page, text, characters (array of {id, name, role, pose, expression, referenceKey}), setting, imagePrompt.`;

    // --- Enhanced User Prompt ---
    const userPrompt = `Book Characters (use these for id, name, role, referenceKey):\n${JSON.stringify(characters, null, 2)}\n\nPages:\n${pages.map((p, i) => `Page ${p.pageNum ?? i + 1}: ${p.text}`).join('\n')}\n\nFor each page, return an object like:\n{\n  "page": 1,\n  "text": "...",\n  "characters": [\n    { "id": "char-1", "name": "Ezra", "role": "main", "pose": "waking up in bed", "expression": "surprised", "referenceKey": "ezra-style-preview.png" },\n    { "id": "char-2", "name": "Luna", "role": "sibling", "pose": "standing in doorway", "expression": "smiling", "referenceKey": "luna-style-preview.png" }\n  ],\n  "setting": "Ezra's bedroom, morning light",\n  "imagePrompt": "A cozy child's bedroom at sunrise, Ezra waking up in bed, Luna standing in the doorway, sunlight streaming in, gentle colors"\n}`;

    // --- Call OpenAI API ---
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature,
        max_tokens,
        response_format: { type: 'json_object' }
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to generate storyboards' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openaiData = await openaiResponse.json();
    let storyboards: any[] = [];
    try {
      // The LLM should return a JSON array or an object with a key (e.g., { storyboards: [...] })
      const content = openaiData.choices[0]?.message?.content || '';
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        storyboards = parsed;
      } else if (parsed.storyboards && Array.isArray(parsed.storyboards)) {
        storyboards = parsed.storyboards;
      } else {
        // Try to find the array in any key
        const arrKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
        if (arrKey) storyboards = parsed[arrKey];
        else throw new Error('No array found in LLM response');
      }
      // Optional: Validate structure of each storyboard object
      for (const page of storyboards) {
        if (!Array.isArray(page.characters)) throw new Error('Storyboard page missing characters array');
        for (const char of page.characters) {
          if (!char.id || !char.name || !char.referenceKey) throw new Error('Character missing id, name, or referenceKey');
        }
      }
    } catch (err) {
      console.error('Failed to parse or validate LLM JSON:', err);
      return new Response(
        JSON.stringify({ error: 'Failed to parse or validate LLM response', raw: openaiData.choices[0]?.message?.content }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ storyboards }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in storyboard-pages function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
// --- End Storyboarding Edge Function ---

/* To invoke:

  curl -i --location --request POST 'https://uvziaiimktymmjwqgknl.supabase.co/functions/v1/generate-story' \
    --header 'Authorization: Bearer [YOUR_ANON_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{
      "prompt": "Create a story outline for a children'\''s book about a brave little mouse",
      "temperature": 0.7,
      "max_tokens": 1000
    }'

*/
