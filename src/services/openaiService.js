import OpenAI from 'openai';

const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
// Ensure the key is present. Handle the error appropriately in a real app.
if (!apiKey) {
  console.error('OpenAI API key not found. Make sure VITE_OPENAI_API_KEY is set.');
  // Potentially throw an error or handle this state appropriately
}

const openai = new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true }); // Enable browser usage (ensure security implications are understood)

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
 * Generates story pages using OpenAI Chat Completions based on detailed story data.
 * 
 * @param {object} storyData - Contains all story parameters from the wizard.
 * @param {number} numPages - The desired number of page objects in the output array (may not perfectly match AI word count focus).
 * @returns {Promise<Array<{id: string, type: string, text: string, visualPrompt: string, mainCharacterId: string | null}>>} - Array of generated page objects.
 */
export const generateStoryPages = async (storyData, numPages = 8) => {
  if (!apiKey) {
    console.warn('OpenAI API key missing. Returning mock story data.');
    // Return mock data reflecting the new structure
    const mockMainCharId = storyData.bookCharacters?.find(c => c.role === 'main')?.id || storyData.bookCharacters?.[0]?.id || null;
    return Array.from({ length: numPages }, (_, i) => ({
      id: `mock-page-${i + 1}`,
      type: 'content',
      text: `This is mock story text for page ${i + 1} based on type: ${storyData.storyType || 'standard'}.`,
      visualPrompt: `Mock visual prompt for page ${i + 1}, style: ${storyData.artStyleCode || 'default'}`, 
      mainCharacterId: storyData.storyType === 'board_book' ? null : mockMainCharId 
    }));
  }

  // --- Use the helper to construct prompts ---
  const { systemPrompt, userPrompt } = constructPrompts(storyData, numPages);
  
  // Determine the target number of pages based on type
  let targetPageCount = numPages;
  if (storyData.storyType === 'board_book') {
     const items = storyData.keyObjectsActions?.split(',').map(s => s.trim()).filter(Boolean) || [];
     targetPageCount = items.length > 0 ? items.length : 6; // Use item count or default for board book
  }
  // Could add logic for early reader chapters here too if needed

  console.log("--- OpenAI Story Generation Request ---");
  console.log("System Prompt:", systemPrompt);
  console.log("User Prompt:", userPrompt);
  console.log("Story Type:", storyData.storyType);
  console.log("Art Style:", storyData.artStyleCode);
  console.log("Characters:", storyData.bookCharacters.map(c => `${c.name} (${c.id})`).join(', '));
  console.log("Target Page Count:", targetPageCount);
  console.log("----------------------");

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" }, 
      temperature: 0.7, 
      // max_tokens: Calculate based on desiredLengthWords? More complex.
    });

    console.log("Received response from OpenAI:");
    console.log("  Model:", completion.model);
    console.log("  Usage:", completion.usage);
    console.log("  Response type:", completion.choices[0]?.message?.content ? "Content received" : "No content");
    console.log("  Content length:", completion.choices[0]?.message?.content?.length || 0);

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error('OpenAI response content is empty.');
    }

    // Attempt to parse the JSON response (assuming it's an array possibly within an object)
    let parsedResponse;
    try {
      const potentialJson = JSON.parse(responseContent);
      const keys = Object.keys(potentialJson);
      if (keys.length === 1 && Array.isArray(potentialJson[keys[0]])) {
          parsedResponse = potentialJson[keys[0]];
      } else if (Array.isArray(potentialJson)) {
          parsedResponse = potentialJson; 
      } else {
          throw new Error('Parsed JSON is not in the expected array format or wrapped object format.');
      }
      if (!Array.isArray(parsedResponse)) {
           throw new Error('Parsed JSON response is not an array.');
      }
      console.log(`Parsed ${parsedResponse.length} pages from OpenAI response.`);
    } catch (parseError) {
      console.error("Failed to parse OpenAI JSON response:", parseError);
      console.error("Raw response content:", responseContent);
      throw new Error(`Failed to parse story structure from OpenAI: ${parseError.message}. Raw content: ${responseContent.substring(0, 500)}`);
    }

    // Validate and structure the response array
    const generatedPages = parsedResponse.map((page, index) => {
      // Basic validation
      const text = typeof page.text === 'string' ? page.text.trim() : `Error: Missing text for page ${index + 1}`;
      const visualPrompt = typeof page.visualPrompt === 'string' ? page.visualPrompt.trim() : `Error: Missing visual prompt for page ${index + 1}`;
      let mainCharacterId = page.mainCharacterId !== undefined ? page.mainCharacterId : null;
      
      // Ensure null is used, not undefined string
      if (mainCharacterId === 'undefined' || mainCharacterId === 'null') {
          mainCharacterId = null;
      }
      
      // Validate character ID exists if not null
      const isValidCharId = mainCharacterId === null || storyData.bookCharacters?.some(c => c.id === mainCharacterId);
      if (mainCharacterId !== null && !isValidCharId) {
           console.warn(`Invalid mainCharacterId \'${mainCharacterId}\' received for page ${index + 1}. Setting to null.`);
           mainCharacterId = null;
      }
      
      // Special override for board books if needed
      if (storyData.storyType === 'board_book') {
           mainCharacterId = null; // Board books generally don't track a single narrative character ID this way
      }

      return {
        id: `gen-page-${index + 1}`, 
        type: 'content',
        text: text,
        visualPrompt: visualPrompt,
        mainCharacterId: mainCharacterId
      };
    });

    // Adjust page count based on targetPageCount (especially for board books)
    // We still use the AI's output length primarily, but can pad/truncate if necessary
    if (generatedPages.length < targetPageCount) {
        console.warn(`OpenAI returned fewer pages (${generatedPages.length}) than expected target (${targetPageCount}). Padding may occur if needed later.`);
        // Padding logic might be better handled during final book assembly if strict page count is required
    }
    if (generatedPages.length > targetPageCount && storyData.storyType === 'board_book') {
         console.warn(`OpenAI returned more pages (${generatedPages.length}) than board book target (${targetPageCount}). Truncating.`);
         generatedPages.length = targetPageCount; // Truncate extra pages for board books
    }
    // For other types, we might allow variable page counts closer to the word count

    return generatedPages;

  } catch (error) {
    console.error("Error calling OpenAI API or processing response:", error);
    // Return mock data on error
    console.warn('OpenAI API call failed. Returning mock story data.');
    const mockMainCharId = storyData.bookCharacters?.find(c => c.role === 'main')?.id || storyData.bookCharacters?.[0]?.id || null;
     return Array.from({ length: numPages }, (_, i) => ({
       id: `error-page-${i + 1}`,
       type: 'content',
       text: `Error generating story text for page ${i + 1}. ${error.message}`,
       visualPrompt: `Error generating visual prompt for page ${i + 1}`,
       mainCharacterId: storyData.storyType === 'board_book' ? null : mockMainCharId
     }));
  }
};
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
 * Generates a story outline using OpenAI based on a detailed prompt.
 * Expects the prompt to request a JSON array of strings as output.
 */
export const generateOutlineFromPrompt = async (prompt) => {
  console.log("[openaiService] Generating outline...");
  if (!apiKey) return { success: false, error: "OpenAI API key not configured." };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Or another suitable model like gpt-4-turbo
      messages: [
        { role: "system", content: "You are a helpful assistant designed to create structured outlines for children's books. Output ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6, // Adjust for creativity vs consistency
      response_format: { type: "json_object" },
    });

    const responseJsonString = completion.choices[0]?.message?.content;
    if (!responseJsonString) {
      throw new Error('No content received from OpenAI for outline.');
    }

    console.log("[openaiService] Raw outline response string:", responseJsonString);

    // Attempt to parse the JSON response
    let parsedResponse;
    try {
      // Clean potential markdown blocks before parsing
      const cleanedJsonString = cleanMarkdownCodeBlocks(responseJsonString);
      parsedResponse = JSON.parse(cleanedJsonString);
    } catch (parseError) {
      console.error("[openaiService] Failed to parse outline JSON:", parseError);
      console.error("[openaiService] Cleaned string was:", cleanedJsonString);
      console.error("[openaiService] Original raw string was:", responseJsonString);
      throw new Error(`AI returned invalid JSON format for outline: ${parseError.message}`);
    }

    // Validate the parsed response structure (expecting an array)
    // Sometimes the model might wrap the array in a key like {"outline": [...]}
    let outlineArray = null;
    if (Array.isArray(parsedResponse)) {
        outlineArray = parsedResponse;
    } else if (typeof parsedResponse === 'object' && parsedResponse !== null) {
        // Check for common key names if it's an object
        const possibleKeys = ['outline', 'spreads', 'result', 'data'];
        const key = possibleKeys.find(k => Array.isArray(parsedResponse[k]));
        if (key) {
            outlineArray = parsedResponse[key];
        }
    }

    if (!outlineArray || !Array.isArray(outlineArray)) {
         console.error("[openaiService] Parsed outline response is not an array or in expected object wrapper:", parsedResponse);
        throw new Error('AI response for outline was not in the expected array format.');
    }

    // Further validation: check if all elements are strings?
    if (!outlineArray.every(item => typeof item === 'string')) {
        console.warn("[openaiService] Outline array contains non-string elements:", outlineArray);
        // Decide how to handle this - maybe try to convert or filter?
        // For now, let's proceed but be aware.
    }

    console.log("[openaiService] Successfully parsed outline:", outlineArray);
    return { success: true, outline: outlineArray };

  } catch (error) {
    console.error("[openaiService] Error generating outline:", error);
    return { success: false, error: error.message || 'Failed to generate outline from OpenAI.' };
  }
};

/**
 * Generates spread content (text and image prompt) using OpenAI based on a detailed prompt.
 * Expects the prompt to request a JSON object like { "text": "...", "imagePrompt": "..." }.
 */
export const generateSpreadContentFromPrompt = async (prompt) => {
  console.log("[openaiService] Generating spread content...");
  if (!apiKey) return { success: false, error: "OpenAI API key not configured." };

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // Or another suitable model
      messages: [
        { role: "system", content: "You are a helpful assistant designed to write children's book page text and corresponding image prompts. Output ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7, // Slightly higher for more creative text?
      response_format: { type: "json_object" },
    });

    const responseJsonString = completion.choices[0]?.message?.content;
    if (!responseJsonString) {
      throw new Error('No content received from OpenAI for spread content.');
    }

    console.log("[openaiService] Raw spread content response string:", responseJsonString);

    // Attempt to parse the JSON response
    let parsedResponse;
    try {
      // Clean potential markdown blocks before parsing
      const cleanedJsonString = cleanMarkdownCodeBlocks(responseJsonString);
      parsedResponse = JSON.parse(cleanedJsonString);
    } catch (parseError) {
      console.error("[openaiService] Failed to parse spread content JSON:", parseError);
      console.error("[openaiService] Cleaned string was:", cleanedJsonString);
      console.error("[openaiService] Original raw string was:", responseJsonString);
      throw new Error(`AI returned invalid JSON format for spread content: ${parseError.message}`);
    }

    // Validate the parsed response structure
    if (typeof parsedResponse !== 'object' || parsedResponse === null || typeof parsedResponse.text !== 'string' || typeof parsedResponse.imagePrompt !== 'string') {
      console.error("[openaiService] Parsed spread content response does not match expected format {text: string, imagePrompt: string}:", parsedResponse);
      // Attempt to find the data if nested?
       let content = null;
       if (typeof parsedResponse === 'object' && parsedResponse !== null) {
           const possibleKeys = ['content', 'spread', 'result', 'data'];
           const key = possibleKeys.find(k => typeof parsedResponse[k] === 'object' && parsedResponse[k] !== null && typeof parsedResponse[k].text === 'string' && typeof parsedResponse[k].imagePrompt === 'string');
           if (key) {
               content = parsedResponse[key];
           }
       }
       if (!content) {
          throw new Error('AI response for spread content did not match the expected format {text: string, imagePrompt: string}.');
       }
       parsedResponse = content; // Use the nested content
    }

    console.log("[openaiService] Successfully parsed spread content:", parsedResponse);
    return { success: true, content: parsedResponse };

  } catch (error) {
    console.error("[openaiService] Error generating spread content:", error);
    return { success: false, error: error.message || 'Failed to generate spread content from OpenAI.' };
  }
};

// Optional: Add any other OpenAI related functions you might need here
// e.g., function for suggesting titles, themes, etc.

/**
 * Simple utility function to generate content with OpenAI
 * @param {Object} options - Options for content generation
 * @param {string} options.prompt - The prompt to send to OpenAI
 * @param {number} options.temperature - Temperature setting (0-1)
 * @param {number} options.max_tokens - Maximum tokens to generate
 * @returns {Promise<string>} - The generated content
 */
export const generateContent = async (options) => {
  const { prompt, temperature = 0.7, max_tokens = 1000 } = options;
  
  if (!apiKey) {
    console.warn('OpenAI API key missing. Returning mock content.');
    return JSON.stringify({ text: "Sample text for this page.", imagePrompt: "Sample image prompt." });
  }
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o", 
      messages: [
        { role: "system", content: "You are a creative children's book author." },
        { role: "user", content: prompt }
      ],
      temperature,
      max_tokens
    });
    
    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No content received from OpenAI.');
    }
    
    // Clean potential markdown blocks before returning
    const cleanedResponse = cleanMarkdownCodeBlocks(response);
    console.log("[generateContent] Returning cleaned response.");
    return cleanedResponse;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error(`Failed to generate content: ${error.message}`);
  }
};
