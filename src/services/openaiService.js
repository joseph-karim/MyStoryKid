import { supabase } from './supabaseClient';

// --- Helper Function to Construct Prompts ---
const constructPrompts = (storyData, numPages) => {
  const { 
      category, // Keep for context if needed, but storyType is primary
      bookCharacters = [], 
      artStyleCode, 
      customStyleDescription, 
      storyType = 'standard', 
      targetAgeRange = '4-8', 
      coreTheme = '', 
      mainChallengePlot = '', 
      narrativeStyle = 'third_person_limited',
      tone = 'gentle',
      desiredEnding = '',
      desiredLengthWords = 500,
      rhymeScheme = 'AABB',
      coreConcept = '',
      keyObjectsActions = '',
      interactiveElement = '',
      mainCharacter,
      setting
  } = storyData;

  const otherCharacters = bookCharacters.filter(c => c.id !== mainCharacter?.id);

  // Common Character Descriptions
  let characterDescriptions = "Characters:\n";
  characterDescriptions += `- ${mainCharacter.name}: (Main Character, ID: ${mainCharacter.id || 'N/A'}) ${mainCharacter.age || 'Age not specified'} year old ${mainCharacter.gender || 'Gender not specified'}. Traits: ${mainCharacter.traits?.join(', ') || 'None listed'}. Interests: ${mainCharacter.interests?.join(', ') || 'None listed'}.\n`;
  otherCharacters.forEach(char => {
    characterDescriptions += `- ${char.name}: (${char.role || 'Character'}, ID: ${char.id}) ${char.age || 'Age not specified'} year old ${char.gender || 'Gender not specified'}. Traits: ${char.traits?.join(', ') || 'None listed'}. Interests: ${char.interests?.join(', ') || 'None listed'}.\n`;
  });
  const characterIdList = bookCharacters.map(c => `${c.name}=${c.id}`).join(', ') || 'N/A';

  // Common Style Description
  const styleDesc = artStyleCode === 'custom' && customStyleDescription ? customStyleDescription : `a ${artStyleCode?.replace(/_/g, ' ') || 'default illustration'} style`;

  // Common JSON Output Instructions
  const jsonOutputInstructions = `
Output the result STRICTLY as a JSON array of objects. Each object represents a page/spread and MUST have these exact keys:

"text": (string) The story text for the page/spread.
"visualPrompt": (string) A detailed description for Dzine Text-to-Image, including the full scene (background, setting elements like '${setting.description}', lighting, mood, composition) AND a description of a placeholder character (e.g., 'a ${mainCharacter.age || 'young'} ${mainCharacter.gender || 'child'} placeholder') with specific pose, action, and expression instructions relevant to this scene. Include desired art style keywords (e.g., "${styleDesc}").
"mainCharacterId": (string or null) The ID of the main character ("${mainCharacter.id || 'null'}").

Ensure the entire output is a single valid JSON array. Example page object: { "text": "${mainCharacter.name || 'The character'} skipped through the forest.", "visualPrompt": "Wide angle shot of an enchanted forest path at dusk, large softly glowing blue mushrooms line the path. A ${mainCharacter.age || 'young'} ${mainCharacter.gender || 'child'} placeholder is skipping happily, looking amazed, wearing a red jacket. Magical twilight lighting, wondrous mood. ${styleDesc}.", "mainCharacterId": "${mainCharacter.id || 'null'}" }`;

  // Common Story Flow Instructions
  const storyFlowInstructions = `
7.  Ensure the story flows logically across the pages and has a simple narrative arc (beginning, middle, end).
8.  Keep the language simple, positive, and age-appropriate for the target range: ${targetAgeRange}.`;

  let systemPrompt = "";
  let userPrompt = "";

  switch (storyType) {
    case 'rhyming':
      systemPrompt = `You are a children's story writer specializing in rhyming picture books. Create a playful and engaging story suitable for ages ${targetAgeRange}. The story should have a target length of approximately ${desiredLengthWords} words and be structured into about ${numPages} page-like segments. Adhere strictly to the following instructions:`;
      userPrompt = `Write a rhyming children's story manuscript suitable for reading aloud, based on these specifications:

*   **Target Age Range:** ${targetAgeRange}
*   **Main Character(s):** ${mainCharacter.name}
*   ${characterDescriptions}
*   **Setting:** (Infer from plot/theme or use a simple, common setting like a park, home, or school)
*   **Core Theme:** ${coreTheme || 'Friendship and fun'}
*   **Plot Idea:** ${mainChallengePlot || `A simple adventure featuring ${mainCharacter.name}`}
*   **Rhyme Scheme/Rhythm:** ${rhymeScheme || 'AABB'}. Ensure rhymes feel natural and not forced.
*   **Tone:** ${tone || 'Playful, humorous, lighthearted'}
*   **Desired Ending:** ${desiredEnding || 'A happy and simple resolution'}

**Instructions:**
1.  Maintain the specified rhyme scheme and rhythm consistently.
2.  Use simple, engaging language suitable for the age range.
3.  Tell a coherent story following the plot idea.
4.  Emphasize fun sounds and wordplay where appropriate.
5.  Divide the story into logical segments, each suitable for a page spread.
${jsonOutputInstructions}
${storyFlowInstructions.replace('simple narrative arc', 'simple rhyming narrative arc')}`; // Modify story flow slightly
      break;

    case 'early_reader':
      systemPrompt = `You are an author writing an early reader book for children aged ${targetAgeRange}. Create a simple story with controlled vocabulary. The story should have a target length of approximately ${desiredLengthWords} words and be structured into about ${numPages} page-like segments (or 2-3 very short conceptual chapters). Adhere strictly to the following instructions:`;
      userPrompt = `Generate a short children's story suitable for an early reader format based on these details:

*   **Target Age Range:** ${targetAgeRange}
*   **Main Character:** ${mainCharacter.name}
*   ${characterDescriptions}
*   **Setting:** (Infer from plot/theme or use a simple, relatable setting like school, home, park)
*   **Core Theme:** ${coreTheme || 'Learning something new or making a friend'}
*   **Main Challenge/Plot:** ${mainChallengePlot || `A simple challenge or event in ${mainCharacter.name}'s day`}
*   **Narrative Style:** ${narrativeStyle || 'Third-person limited'}
*   **Desired Ending:** ${desiredEnding || 'A positive and encouraging resolution'}
*   **Tone:** ${tone || 'Hopeful, realistic, encouraging'}

**Instructions:**
1.  Use controlled vocabulary and simpler sentence structures appropriate for children learning to read independently. Repetition of key phrases can be helpful.
2.  Develop the plot clearly, focusing on the character's emotional journey and interactions.
3.  Focus tightly on the main character and the central challenge/theme.
4.  Provide a satisfying and positive resolution.
${jsonOutputInstructions}
${storyFlowInstructions}`; 
      break;

    case 'lesson':
      systemPrompt = `You are a writer creating a children's story to teach a specific lesson or explore overcoming a challenge for ages ${targetAgeRange}. The story should have a target length of approximately ${desiredLengthWords} words and be structured into about ${numPages} page-like segments. Adhere strictly to the following instructions:`;
      userPrompt = `Generate a children's story focused on teaching a specific lesson or overcoming a challenge:

*   **Target Age Range:** ${targetAgeRange}
*   **Main Character:** ${mainCharacter.name}
*   ${characterDescriptions}
*   **Setting:** (Infer from plot/theme or use a relevant setting)
*   **Core Theme/Lesson:** ${coreTheme || 'A common childhood lesson (e.g., sharing, patience, honesty)'}
*   **Main Challenge/Plot:** ${mainChallengePlot || `Illustrate the character learning the core lesson through a specific situation.`}
*   **Narrative Style:** ${narrativeStyle || 'Third-person, clear and direct'}
*   **Tone:** ${tone || 'Didactic but engaging'}
*   **Desired Ending:** ${desiredEnding || `The character understands and applies the lesson.`}

**Instructions:**
1.  Clearly illustrate the character's initial behavior related to the lesson.
2.  Show the negative consequences or the challenge faced.
3.  Depict a moment of realization or learning.
4.  Show the positive outcomes of adopting the desired behavior/understanding.
5.  Keep the language and concepts appropriate for the age range.
6.  Ensure the lesson is demonstrated through the story, not just stated explicitly.
${jsonOutputInstructions}
${storyFlowInstructions}`; 
      break;

    case 'board_book':
        // Board books are very different - focus on concepts, not narrative.
        // The number of pages is more driven by the key items list.
        const items = keyObjectsActions.split(',').map(s => s.trim()).filter(Boolean);
        const boardBookPages = items.length > 0 ? items.length : 6; // Target ~6 pages if no items given
        systemPrompt = `You are creating content for a children's board book (ages ${targetAgeRange}). Focus on extreme simplicity, repetition, and clear association between text and potential illustration. The target is ${boardBookPages} simple page concepts. Adhere strictly to the following instructions:`;
        userPrompt = `Generate simple text content for a children's board book manuscript targeting ages ${targetAgeRange}.

*   **Core Concept/Theme:** ${coreConcept || 'Everyday Objects'}
*   **Key Objects/Characters/Actions to Feature:** ${keyObjectsActions || '(Use common objects/animals related to the concept)'}
*   **Desired Format/Style:** Use only single words or very short, simple phrases (max 4 words) per conceptual page. Employ repetition. Focus on identification, simple actions, or sounds.
*   **Tone:** ${tone || 'Very simple, clear, gentle'}
*   **Interactive Element:** ${interactiveElement ? `Include this element: ${interactiveElement}` : 'No specific interactive element required.'}

**Instructions:**
1.  **Extreme Simplicity:** Use only the most basic vocabulary. No complex sentences.
2.  **Illustration Focus:** Generate text assuming each line/phrase corresponds to ONE clear, simple illustration idea.
3.  **Structure:** Output the text sequentially, representing the flow page-by-page.
4.  **No Narrative:** Do NOT create a plot. Focus solely on presenting the core concept using the key elements.
5.  **Output Format:** ${jsonOutputInstructions.replace('"mainCharacterId" (string or null, the ID of the single most prominent character from this list: ...)', '"mainCharacterId" (null, as board books usually don\'t focus on a single narrative character ID)').replace('visual description for the illustrator, max 15 words, mentioning characters and the style', 'simple visual concept based directly on the text (e.g., \'A red ball\', \'Dog goes woof\')')}
`; // Adjusted JSON instructions for board books
      break;

    case 'standard':
    default:
      systemPrompt = `You are a creative children's picture book author. Create a simple, engaging story suitable for ages ${targetAgeRange}. The story should have a target length of approximately ${desiredLengthWords} words and be structured into about ${numPages} page-like segments. Adhere strictly to the following instructions:`;
      userPrompt = `Generate a complete children's picture book story manuscript based on the following details:

*   **Target Age Range:** ${targetAgeRange}
*   **Main Character(s):** ${mainCharacter.name}
*   ${characterDescriptions}
*   **Setting:** (Infer from plot/theme or use a simple, common setting)
*   **Core Theme:** ${coreTheme || 'A story about adventure and friendship'}
*   **Main Challenge/Plot:** ${mainChallengePlot || `A day in the life of ${mainCharacter.name}`}
*   **Narrative Style:** ${narrativeStyle || 'Third-person limited'}
*   **Tone:** ${tone || 'Gentle, slightly adventurous, reassuring'}
*   **Desired Ending:** ${desiredEnding || 'A happy and satisfying conclusion'}

**Instructions:**
1.  Write a complete story with a clear beginning, rising action, climax, falling action, and resolution.
2.  Ensure vocabulary and sentence structure are simple and appropriate for the target age range.
3.  Weave the theme naturally into the story.
4.  Focus on showing emotions and actions.
5.  Keep the tone consistent.
${jsonOutputInstructions}
${storyFlowInstructions}`; 
      break;
  }

  return { systemPrompt, userPrompt };
};

// --- End Helper Function --- 


/**
 * Generates story pages using the Supabase Edge Function (generate-story).
 * @param {object} storyData - Contains all story parameters from the wizard.
 * @param {number} numPages - The desired number of page objects in the output array.
 * @returns {Promise<Array<{id: string, type: string, text: string, visualPrompt: string, mainCharacterId: string | null}>>}
 */
export const generateStoryPages = async (storyData, numPages = 8) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: { storyData, numPages }
    });
    if (error) throw error;
    return data.pages;
  } catch (err) {
    console.error('[openaiService] Error generating story pages via edge function:', err);
    return Array.from({ length: numPages }, (_, i) => ({
      id: `error-page-${i + 1}`,
      type: 'content',
      text: `Error generating story text for page ${i + 1}. ${err.message}`,
      visualPrompt: `Error generating visual prompt for page ${i + 1}`,
      mainCharacterId: null
    }));
  }
};

/**
 * Generates a story outline using the Supabase Edge Function (generate-story-outline).
 * @param {string} prompt - The prompt for outline generation.
 * @returns {Promise<{success: boolean, outline?: Array<string>, error?: string}>}
 */
export const generateOutlineFromPrompt = async (prompt) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-story-outline', {
      body: { prompt }
    });
    if (error) throw error;
    return { success: true, outline: data.outline };
  } catch (err) {
    console.error('[openaiService] Error generating outline via edge function:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Generates spread content (text and image prompt) using the Supabase Edge Function (generate-spread-content).
 * @param {string} prompt - The prompt for spread content generation.
 * @returns {Promise<{success: boolean, content?: {text: string, imagePrompt: string}, error?: string}>}
 */
export const generateSpreadContentFromPrompt = async (prompt) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-spread-content', {
      body: { prompt }
    });
    if (error) throw error;
    return { success: true, content: data.content };
  } catch (err) {
    console.error('[openaiService] Error generating spread content via edge function:', err);
    return { success: false, error: err.message };
  }
};

// All OpenAI API calls must go through secure edge functions. No direct OpenAI SDK/API usage is allowed in the client for security reasons.

// Helper function to remove markdown code blocks around JSON
const cleanMarkdownCodeBlocks = (rawString) => {
  if (!rawString || typeof rawString !== 'string') {
    return rawString;
  }
  // Regex to find ```json ... ``` or ``` ... ``` blocks
  const regex = /^```(?:json)?\s*([\s\S]*?)\s*```$/;
  const match = rawString.trim().match(regex);
  if (match && match[1]) {
    console.log("[CleanJSON] Removed markdown code blocks.");
    return match[1].trim(); // Return the content inside the blocks
  }
  return rawString.trim(); // Return the original string (trimmed) if no blocks found
};

/**
 * Simple utility function to generate content with OpenAI via edge function
 * @param {Object} options - Options for content generation
 * @param {string} options.prompt - The prompt to send to OpenAI
 * @param {number} options.temperature - Temperature setting (0-1)
 * @param {number} options.max_tokens - Maximum tokens to generate
 * @returns {Promise<string>} - The generated content
 */
export const generateContent = async (options) => {
  const { prompt, temperature = 0.7, max_tokens = 1000 } = options;
  try {
    const { data, error } = await supabase.functions.invoke('generate-generic-content', {
      body: { prompt, temperature, max_tokens }
    });
    if (error) throw error;
    return data.content;
  } catch (err) {
    console.error('[openaiService] Error generating generic content via edge function:', err);
    return JSON.stringify({ error: err.message || 'Failed to generate content.' });
  }
};
