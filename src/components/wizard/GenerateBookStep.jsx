import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store';
import * as openaiService from '../../services/openaiService';
import * as openaiImageService from '../../services/openaiImageService';
import { getStyleNameFromCode } from '../../utils/styleUtils';
import { ensureAnonymousSession, storeCurrentBookId } from '../../services/anonymousAuthService';
import { v4 as uuidv4 } from 'uuid';
import { generateImagesForBookWithReferences } from '../../services/storyGenerator';

// Helper function to create the outline prompt
const createOutlinePrompt = (bookDetails, characters) => {
  const mainCharacter = characters.find(c => c.role === 'main') || characters[0] || {};
  const supportingCharacters = characters.filter(c => c.id !== mainCharacter.id);

  // Format character descriptions for the prompt
  let characterDescriptions = `Main Character: ${mainCharacter.name}, a ${mainCharacter.age || ''} year old ${mainCharacter.gender || 'child'}. `;

  if (supportingCharacters.length > 0) {
    characterDescriptions += "Supporting Characters: ";
    characterDescriptions += supportingCharacters.map(char =>
      `${char.name}, a ${char.age || ''} year old ${char.gender || 'child'} (${char.customRole || 'friend'})`
    ).join('; ');
  }

  // Calculate number of spreads based on book type
  let numSpreads = 8; // default
  if (bookDetails.storyType === 'board_book') {
    numSpreads = 6; // shorter for board books
  } else if (bookDetails.storyType === 'picture_book') {
    numSpreads = 12; // longer for picture books
  }

  // Get available fields from bookDetails with defaults
  const storyType = bookDetails.storyType || 'standard';
  const targetAgeRange = bookDetails.ageRange || bookDetails.targetAgeRange || '4-8 years old';
  const coreTheme = bookDetails.coreTheme || bookDetails.category || 'Friendship, adventure, and discovery';
  const mainChallengePlot = bookDetails.mainChallengePlot || bookDetails.storyStart || `A story about ${mainCharacter.name || 'the main character'}'s adventure finding something new`;

  // Extract more plot elements (some might be named differently or missing)
  const mainHurdle = bookDetails.mainHurdle || bookDetails.hurdle || 'Character faces a challenge that requires creativity to overcome';
  const bigTry = bookDetails.bigTry || bookDetails.characterBigTry || 'Character makes several attempts to solve the problem';
  const turningPoint = bookDetails.turningPoint || bookDetails.keyTurningPoint || 'Character realizes they need a different approach';
  const happyEnding = bookDetails.happyEnding || bookDetails.resolution || bookDetails.ending || 'Character succeeds and learns a valuable lesson';
  const takeaway = bookDetails.takeaway || bookDetails.lesson || 'The importance of perseverance and friendship';

  // Debug what we're actually using
  console.log("[createOutlinePrompt] Using story parameters:", {
    storyType,
    targetAgeRange,
    coreTheme,
    mainChallengePlot,
    mainHurdle,
    bigTry,
    turningPoint,
    happyEnding,
    takeaway,
    numSpreads
  });

  // Determine text complexity guidance based on age range and book type
  let textComplexityGuidance = '';

  // Parse age range (e.g., "3-5" -> lowest age is 3)
  const ageParts = targetAgeRange.split('-');
  const lowestAge = parseInt(ageParts[0]) || 4;

  if (bookDetails.storyType === 'board_book') {
    textComplexityGuidance = 'This is a BOARD BOOK for very young children (0-3). Use extremely simple concepts, minimal text, and focus on basic elements that toddlers can understand.';
  } else if (lowestAge <= 3) {
    textComplexityGuidance = 'This is for VERY YOUNG CHILDREN (0-3). Keep the story extremely simple with basic concepts and minimal complexity.';
  } else if (lowestAge <= 5) {
    textComplexityGuidance = 'This is for PRESCHOOL/KINDERGARTEN CHILDREN (3-5). Keep the story simple with clear cause-and-effect and familiar situations.';
  } else if (lowestAge <= 8) {
    textComplexityGuidance = 'This is for EARLY ELEMENTARY CHILDREN (6-8). The story can have more complexity but should still be straightforward.';
  } else {
    textComplexityGuidance = 'This is for OLDER ELEMENTARY CHILDREN (9+). The story can have more nuanced themes and character development.';
  }

  // Determine if we have custom inputs for any story elements
  const hasCustomStoryStart = bookDetails.storyStart === 'custom' && bookDetails.customStoryStart;
  const hasCustomMainHurdle = bookDetails.mainHurdle === 'custom' && bookDetails.customMainHurdle;
  const hasCustomBigTry = bookDetails.bigTry === 'custom' && bookDetails.customBigTry;
  const hasCustomTurningPoint = bookDetails.turningPoint === 'custom' && bookDetails.customTurningPoint;
  const hasCustomResolution = bookDetails.resolution === 'custom' && bookDetails.customResolution;
  const hasCustomTakeaway = bookDetails.takeaway === 'custom' && bookDetails.customTakeaway;

  // Create special instructions for custom inputs
  let customInputInstructions = '';
  if (hasCustomStoryStart || hasCustomMainHurdle || hasCustomBigTry ||
      hasCustomTurningPoint || hasCustomResolution || hasCustomTakeaway) {
    customInputInstructions = `
**IMPORTANT - CUSTOM STORY ELEMENTS:**
The user has provided custom descriptions for some story elements. These MUST be incorporated exactly as specified:
${hasCustomStoryStart ? `* Story Start: "${bookDetails.customStoryStart}"` : ''}
${hasCustomMainHurdle ? `* Main Hurdle: "${bookDetails.customMainHurdle}"` : ''}
${hasCustomBigTry ? `* Character's Big Try: "${bookDetails.customBigTry}"` : ''}
${hasCustomTurningPoint ? `* Key Turning Point: "${bookDetails.customTurningPoint}"` : ''}
${hasCustomResolution ? `* Happy Ending: "${bookDetails.customResolution}"` : ''}
${hasCustomTakeaway ? `* Takeaway: "${bookDetails.customTakeaway}"` : ''}
`;
  }

  return `
**Goal:** Generate a concise page-by-page OR spread-by-spread outline for a children's book based on the provided details.

**Core Book Details:**
* **Target Reading Age Range:** ${targetAgeRange}
* **Book Type:** ${bookDetails.storyType || 'standard'}
* **Target Illustration Age Range:** ${targetAgeRange}
* **Characters:** ${characterDescriptions}
* **Art Style:** ${bookDetails.artStyleCode?.replace(/_/g, ' ') || 'Defined by keywords'}
* **Core Theme:** ${coreTheme}
* **Overall Length:** ${numSpreads} Spreads (${numSpreads * 2} pages)
* **Story Spark:** ${mainChallengePlot}
* **Main Hurdle:** ${mainHurdle}
* **Character's Big Try:** ${bigTry}
* **Key Turning Point:** ${turningPoint}
* **Happy Ending:** ${happyEnding}
* **Takeaway:** ${takeaway}
* **Complexity Guidance:** ${textComplexityGuidance}
${customInputInstructions}
**Instructions for AI:**
1.  Based on all the core book details, create a brief outline distributing the story events across the specified **Overall Length** (${numSpreads} spreads). Define a "spread" as two facing pages (e.g., Spread 1 = Pages 2-3).
2.  For each spread, write 1-2 sentences describing:
    * The main action or event happening on that spread.
    * How it connects to the character(s) and the overall plot points.
3.  Ensure the plot progresses logically according to the Story Details.
4.  Include all relevant characters throughout the story, not just the main character.
5.  Supporting characters should have meaningful roles in the story.
6.  Keep descriptions concise and focused on the core content for each spread.
7.  CRITICAL: Adhere strictly to the age-appropriate complexity level specified above.
8.  If custom story elements were provided, they MUST be incorporated exactly as specified.

**Output Format:**
Return a JSON array of strings, where each string describes one spread. Example:
[
  "Spread 1 (Pages 2-3): Introduce [Main Character] and [Supporting Character] in [Setting]. They discover [Story Spark].",
  "Spread 2 (Pages 4-5): [Main Character] and [Supporting Character] encounter [Main Hurdle] and realize it's a problem.",
  ...and so on for each spread
]
`;
};

// Helper function to create the page content prompt
const createSpreadContentPrompt = (bookDetails, characters, outline, spreadIndex, spreadOutline) => {
  const mainCharacter = characters.find(c => c.role === 'main') || characters[0] || {};
  const supportingCharacters = characters.filter(c => c.id !== mainCharacter.id);

  // Format character descriptions for the prompt
  let characterDescriptions = `Main Character: ${mainCharacter.name}, a ${mainCharacter.age || ''} year old ${mainCharacter.gender || 'child'}. `;

  if (supportingCharacters.length > 0) {
    characterDescriptions += "Supporting Characters: ";
    characterDescriptions += supportingCharacters.map(char =>
      `${char.name}, a ${char.age || ''} year old ${char.gender || 'child'} (${char.customRole || 'friend'})`
    ).join('; ');
  }

  // Extract fields with defaults for consistent access
  const targetAgeRange = bookDetails.ageRange || bookDetails.targetAgeRange || '4-8 years old';
  const coreTheme = bookDetails.coreTheme || bookDetails.category || 'Friendship, adventure, and discovery';
  const artStyleReference = bookDetails.artStyleCode?.replace(/_/g, ' ') || 'N/A';

  // Debug what we're actually using
  console.log(`[createSpreadContentPrompt] Spread ${spreadIndex + 1} parameters:`, {
    targetAgeRange,
    coreTheme,
    artStyleReference,
    mainCharacterName: mainCharacter.name || 'Main Character',
    mainCharacterTraits: mainCharacter.traits?.join(', ') || 'friendly and adventurous',
    spreadOutline
  });

  // Determine text complexity guidance based on age range and book type
  let textComplexityGuidance = '';

  // Parse age range (e.g., "3-5" -> lowest age is 3)
  const ageParts = targetAgeRange.split('-');
  const lowestAge = parseInt(ageParts[0]) || 4;

  if (bookDetails.storyType === 'board_book') {
    textComplexityGuidance = 'Use EXTREMELY simple language with 1-2 very short sentences per page. Focus on basic concepts, repetition, and single-syllable words when possible. Vocabulary should be limited to words a 0-3 year old would understand.';
  } else if (lowestAge <= 3) {
    textComplexityGuidance = 'Use very simple language with 1-2 short sentences per page. Vocabulary should be basic and familiar to very young children (ages 0-3).';
  } else if (lowestAge <= 5) {
    textComplexityGuidance = 'Use simple language with 2-3 short sentences per page. Vocabulary should be appropriate for preschool/kindergarten children (ages 3-5).';
  } else if (lowestAge <= 8) {
    textComplexityGuidance = 'Use moderately complex language with 3-5 sentences per page. Vocabulary can include some challenging words but mostly familiar to early elementary children (ages 6-8).';
  } else {
    textComplexityGuidance = 'Use more complex language with 5+ sentences per page. Vocabulary can be more advanced but still appropriate for older elementary children (ages 9+).';
  }

  return `
**Goal:** Generate the page text AND an inferred image prompt for a specific page/spread of the children's book, using the outline and core details.

**Core Book Details (Reminder):**
* **Target Reading Age Range:** ${targetAgeRange}
* **Book Type:** ${bookDetails.storyType || 'standard'}
* **Characters:** ${characterDescriptions}
* **Art Style Reference:** ${artStyleReference}
* **Core Theme:** ${coreTheme}
* **Full Story Outline:**
${outline.map(item => `${item}`).join('\n')}

**Current Target:** **Spread ${spreadIndex + 1} (Pages ${(spreadIndex + 1) * 2}-${(spreadIndex + 1) * 2 + 1})**

**Outline Snippet for THIS Spread:** "${spreadOutline}"

**Instructions for AI:**
1.  **Generate Page Text:**
    * Write the text that should appear on **Spread ${spreadIndex + 1} / Pages ${(spreadIndex + 1) * 2}-${(spreadIndex + 1) * 2 + 1}**.
    * The text must accurately reflect the action described in the **Outline Snippet for THIS Spread**.
    * CRITICAL: ${textComplexityGuidance}
    * Include all relevant characters from the character list as appropriate for this spread.
    * Reflect the characters' personalities.
    * Ensure the amount of text is appropriate for the book type and age range.
    * If the book type is 'board_book', use EXTREMELY simple text (1-2 very short sentences) regardless of age range.
2.  **Generate Inferred Image Prompt:**
    * Create a descriptive prompt for an image generation AI.
    * Include all relevant characters from the character list that should appear in this spread.
    * Focus on Subject, Action, Setting, Composition, Mood.
    * **DO NOT include specific style keywords** (like 'watercolor') in this image prompt itself, as those will be added separately.
    * DO NOT include the page text.

**Output Format:**
Return ONLY a JSON object with two properties:
{
  "text": "The story text that will appear on this spread...",
  "visualPrompt": "Detailed visual prompt for image generation, including placeholder description..." // Changed key to visualPrompt
}
`;
};

// Helper: Convert URL to Base64 (Kept for reference)
// eslint-disable-next-line no-unused-vars
async function urlToBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image URL: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting URL to Base64:", error);
    throw error; // Re-throw to be caught by the caller
  }
}

// --- Helper function for ensuring proper Base64 format (Kept for reference) ---
// eslint-disable-next-line no-unused-vars
const ensureImageBase64Format = (dataUrl) => {
  if (!dataUrl) return null;

  console.log(`[Base64 Format] Checking format of data URL: ${dataUrl.substring(0, 40)}...`);

  // If it's already in the right format, return as is
  if (dataUrl.startsWith('data:image/')) {
    console.log('[Base64 Format] URL already has a valid image MIME type');
    return dataUrl;
  }

  // If it's a Base64 URL but with wrong MIME type, correct it
  if (dataUrl.startsWith('data:') && dataUrl.includes(';base64,')) {
    try {
      // Extract Base64 data without the MIME prefix
      const base64Data = dataUrl.split(';base64,')[1];
      // Create a new data URL with image/jpeg MIME type (common fallback)
      const correctedUrl = `data:image/jpeg;base64,${base64Data}`;
      console.log('[Base64 Format] Corrected MIME type to image/jpeg');
      return correctedUrl;
    } catch (error) {
      console.error('[Base64 Format] Error correcting data URL format:', error);
    }
  }

  // For URLs, return null (will be handled by the URL-to-Base64 conversion elsewhere)
  if (dataUrl.startsWith('http')) {
    console.log('[Base64 Format] URL is an HTTP address, not a Base64 string');
    return null;
  }

  // For completely unrecognized formats, log and return null
  console.error('[Base64 Format] Unrecognized data URL format');
  return null;
};

// Function to handle AI response validation (Kept for reference)
// eslint-disable-next-line no-unused-vars
const validateOutlineResponse = (response) => {
  try {
    const parsedResponse = JSON.parse(response);
    if (Array.isArray(parsedResponse.bookOutline)) {
      return parsedResponse.bookOutline;
    } else {
      throw new Error('Response is not in the expected array format');
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
    throw new Error('Invalid AI response format');
  }
};

/**
 * Generates the story pages with content and illustration prompts
 * @param {Object} storyData - The story data from the wizard state
 * @returns {Promise<Array>} - Array of page objects with text and illustration prompts
 */
// NOTE: This function is no longer used directly by generateBook, but kept for reference or potential future use
// eslint-disable-next-line no-unused-vars
const generateStoryPages = async (storyData) => {
  console.log('[generateStoryPages] Generating story with data:', storyData);

  // Get the main character and other data
  const characters = storyData.bookCharacters || [];
  const mainCharacter = characters.find(c => c.role === 'main') || characters[0];

  if (!mainCharacter) {
    throw new Error('Main character is required to generate a story');
  }

  try {
    // Step 1: Generate story outline
    console.log('[generateStoryPages] Generating story outline...');
    const outlinePrompt = createOutlinePrompt(storyData, characters);

    // Use OpenAI to generate the outline
    const outlineResponse = await openaiService.generateContent({
      prompt: outlinePrompt,
      temperature: 0.7,
      max_tokens: 1000
    });

    // Extract and parse the outline
    let storyOutline;
    try {
      // Try to parse as JSON array directly
      storyOutline = JSON.parse(outlineResponse);
      // If not an array, may be wrapped in another object
      if (!Array.isArray(storyOutline)) {
        // Try to find an array property
        const keys = Object.keys(storyOutline);
        for (const key of keys) {
          if (Array.isArray(storyOutline[key])) {
            storyOutline = storyOutline[key];
            break;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse outline as JSON, trying manual extraction:', error);
      // Try to extract array with regex
      const arrayMatch = outlineResponse.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        try {
          storyOutline = JSON.parse(arrayMatch[0]);
        } catch (e) {
          console.error('Failed to extract array from response:', e);
          throw new Error('Could not parse story outline from AI response');
        }
      } else {
        // Split by newlines as last resort
        storyOutline = outlineResponse.split('\n')
          .filter(line => line.trim().startsWith('Spread') || line.trim().startsWith('"Spread'))
          .map(line => line.replace(/^"/, '').replace(/",$/, '').trim());
      }
    }

    if (!Array.isArray(storyOutline) || storyOutline.length === 0) {
      console.error('Invalid outline format:', storyOutline);
      throw new Error('Failed to generate a valid story outline');
    }

    console.log('[generateStoryPages] Generated outline:', storyOutline);

    // Step 2: Generate detailed content for each spread
    console.log('[generateStoryPages] Generating content for each spread...');
    const pagesPromises = storyOutline.map(async (spreadOutline, index) => {
      const spreadPrompt = createSpreadContentPrompt(storyData, characters, storyOutline, index, spreadOutline);

      const contentResponse = await openaiService.generateContent({
        prompt: spreadPrompt,
        temperature: 0.7,
        max_tokens: 800
      });

      // Parse the response to extract text and image prompt
      let spreadContent;
      try {
        spreadContent = JSON.parse(contentResponse);
      } catch (error) {
        console.warn(`Failed to parse content for spread ${index + 1} as JSON:`, error);
        // Try to extract JSON with regex
        const jsonMatch = contentResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            spreadContent = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error(`Failed to extract JSON for spread ${index + 1}:`, e);
            // Create a basic object as fallback
            spreadContent = {
              text: `Spread ${index + 1} text could not be generated.`,
              imagePrompt: `Child character in a generic scene, spread ${index + 1}`
            };
          }
        } else {
          // Create a basic object as fallback
          spreadContent = {
            text: `Spread ${index + 1} text could not be generated.`,
            imagePrompt: `Child character in a generic scene, spread ${index + 1}`
          };
        }
      }

      // Add necessary fields for the page, using the single visualPrompt
      // Ensure spreadContent.imagePrompt corresponds to the visual prompt requested from OpenAI
      const visualPromptFromAI = spreadContent.imagePrompt || spreadContent.visualPrompt || `Error: Visual prompt missing from AI response for spread ${index + 1}`;

      // Removed duplicate declaration of visualPromptFromAI

      // Return the final page object with ONLY the required fields
      return {
        id: `page-${index + 1}`,
        type: 'content',
        text: spreadContent.text || `Spread ${index + 1}`,
        visualPrompt: visualPromptFromAI, // Use the variable holding the correct prompt
        spreadIndex: index
        // Ensure characterPrompt and scenePrompt are NOT included
      };
    });

    // Wait for all pages to be generated
    const generatedPages = await Promise.all(pagesPromises);
    console.log('[generateStoryPages] All pages generated successfully:', generatedPages.length);

    return generatedPages;
  } catch (error) {
    console.error('Error generating story pages:', error);
    throw new Error(`Failed to generate story: ${error.message}`);
  }
};

/**
 * Generates the prompt for the book cover
 * @param {Object} storyData - The story data from the wizard state
 * @returns {Promise<Object>} - Object with characterPrompt and scenePrompt for the cover
 */
const generateCoverPrompt = async (storyData) => {
  console.log('[generateCoverPrompt] Generating cover prompt for:', storyData.title);

  try {
    const characters = storyData.bookCharacters || [];
    const mainCharacter = characters.find(c => c.role === 'main') || characters[0];

    if (!mainCharacter) {
      throw new Error('Main character is required to generate a cover');
    }

    const title = storyData.title || `A Story About ${mainCharacter.name}`;
    const category = storyData.category || 'adventure';

    // Format character descriptions for the prompt
    let characterDescriptions = `Main Character: ${mainCharacter.name}, a ${mainCharacter.age || 'young'} ${mainCharacter.gender || 'child'}. `;

    const supportingCharacters = characters.filter(c => c.id !== mainCharacter.id);
    if (supportingCharacters.length > 0) {
      characterDescriptions += "Supporting Characters: ";
      characterDescriptions += supportingCharacters.map(char =>
        `${char.name}, a ${char.age || ''} year old ${char.gender || 'child'} (${char.customRole || 'friend'})`
      ).join('; ');
    }

    // Determine text complexity guidance based on age range and book type
    let ageGuidance = '';

    // Parse age range (e.g., "3-5" -> lowest age is 3)
    const ageRange = storyData.ageRange || '4-8';
    const ageParts = ageRange.split('-');
    const lowestAge = parseInt(ageParts[0]) || 4;

    if (storyData.storyType === 'board_book') {
      ageGuidance = 'This is a BOARD BOOK for very young children (0-3). The cover should be extremely simple, bold, and appealing to toddlers.';
    } else if (lowestAge <= 3) {
      ageGuidance = 'This is for VERY YOUNG CHILDREN (0-3). The cover should be simple, colorful, and immediately engaging.';
    } else if (lowestAge <= 5) {
      ageGuidance = 'This is for PRESCHOOL/KINDERGARTEN CHILDREN (3-5). The cover should be colorful and engaging with clear character focus.';
    } else if (lowestAge <= 8) {
      ageGuidance = 'This is for EARLY ELEMENTARY CHILDREN (6-8). The cover can have more detail but should remain bright and appealing.';
    } else {
      ageGuidance = 'This is for OLDER ELEMENTARY CHILDREN (9+). The cover can have more sophisticated composition and detail.';
    }

    // Check for custom story elements that should be featured on the cover
    let customElements = '';
    if (storyData.storyStart === 'custom' && storyData.customStoryStart) {
      customElements += `\nThe story starts with: "${storyData.customStoryStart}"`;
    }
    if (storyData.mainScene === 'custom_scene' && storyData.customSceneDescription) {
      customElements += `\nThe main setting is: "${storyData.customSceneDescription}"`;
    }

    // Build a comprehensive prompt for the cover
    const coverPrompt = `
    Generate a single visual prompt suitable for image generation for the cover of a children's book titled "${title}".

    Characters in the book:
    ${characterDescriptions}

    The book is about ${category}.
    ${ageGuidance}
    ${customElements}

    The prompt should describe an appealing cover image, including:
    1. The overall scene, setting, mood, and composition.
    2. Include all main and supporting characters in the cover image, with the main character being the focus.
    3. Characters should be in an engaging pose or action representing the book's theme.
    4. Include relevant style keywords (e.g., "${getStyleNameFromCode(storyData.artStyleCode)} style").
    5. The cover should be appropriate for the specified age range (${ageRange}).
    6. If custom story elements were provided above, incorporate them into the cover design.

    Return ONLY a JSON object with a single key "coverVisualPrompt":
    {
      "coverVisualPrompt": "Detailed visual prompt for the cover image..."
    }
    `;

    const coverResponse = await openaiService.generateContent({
      prompt: coverPrompt,
      temperature: 0.7,
      max_tokens: 400
    });

    // Parse the response
    let coverContent;
    try {
      coverContent = JSON.parse(coverResponse);
    } catch (error) {
      console.warn('Failed to parse cover prompt as JSON:', error);
      // Try to extract JSON with regex
      const jsonMatch = coverResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          coverContent = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error('Failed to extract JSON for cover prompt:', e);
          // Create a basic object as fallback
          coverContent = {
            coverVisualPrompt: `Colorful and engaging cover for a children's book titled "${title}" about ${category}, featuring ${mainCharacter.name} ${supportingCharacters.length > 0 ? 'and ' + supportingCharacters.map(c => c.name).join(', ') : ''}.`
          };
        }
      } else {
        // Create a basic object as fallback
        coverContent = {
          coverVisualPrompt: `Colorful and engaging cover for a children's book titled "${title}" about ${category}, featuring ${mainCharacter.name} ${supportingCharacters.length > 0 ? 'and ' + supportingCharacters.map(c => c.name).join(', ') : ''}.`
        };
      }
    }

    // Ensure the response structure matches the requested "coverVisualPrompt"
    const visualPrompt = coverContent.coverVisualPrompt || `Placeholder cover scene featuring ${mainCharacter.name}. ${getStyleNameFromCode(storyData.artStyleCode)} style.`;

    return {
      coverVisualPrompt: visualPrompt
    };
  } catch (error) {
    console.error('Error generating cover prompt:', error);
    throw new Error(`Failed to generate cover prompt: ${error.message}`);
  }
};

const GenerateBookStep = () => {
  const {
    wizardState,
    setWizardStep,
    addBook,
    resetWizard,
    setLatestGeneratedBookId,
  } = useBookStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [progressInfo, setProgressInfo] = useState('');
  // const [imageUrls, setImageUrls] = useState({}); // No longer needed for final assembly
  const [generatedBook, setGeneratedBook] = useState(null);
  const [error, setError] = useState(null);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState(null); // State for cover image URL
  const [generatedPagesData, setGeneratedPagesData] = useState([]); // State for progressively generated pages
  const navigate = useNavigate();

  useEffect(() => {
    // Ensure we have an anonymous session before starting generation
    const initializeAndGenerate = async () => {
      try {
        // Ensure we have an anonymous session (if not already authenticated)
        const { success, error } = await ensureAnonymousSession();
        if (!success) {
          console.error('Failed to create anonymous session:', error);
          setError(`Authentication error: ${error}`);
          return;
        }

        // Start book generation
        generateBook();
      } catch (err) {
        console.error('Error initializing session:', err);
        setError(`Session initialization error: ${err.message}`);
      }
    };

    initializeAndGenerate();
  }, []); // Empty dependency array ensures this runs only once on mount

  const updateProgressInfo = (info) => {
    console.log('[Progress]', info);
    setProgressInfo(info);
  };

  // --- REFACTORED generateBook Function ---
  const generateBook = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    updateProgressInfo('Starting book generation...');
    setError(null);
    // Reset progressive states
    setGeneratedCoverUrl(null);
    setGeneratedPagesData([]);
    setGeneratedBook(null); // Clear final book object

    const { storyData } = wizardState;
    const characters = storyData.bookCharacters || [];
    const mainCharacter = characters.find(c => c.role === 'main') || characters[0];
    const supportingCharacters = characters.filter(c => c.id !== mainCharacter?.id);

    // --- Validations (Keep these) ---
    if (!mainCharacter) {
      setError("Could not determine the main character.");
      setIsGenerating(false); return;
    }
    if (!mainCharacter.stylePreview || typeof mainCharacter.stylePreview !== 'string') {
      setError("Character style preview is missing.");
      setIsGenerating(false); return;
    }
    const stylePreview = mainCharacter.stylePreview;
    // Accept both HTTP URLs and Base64 data URLs for stylePreview
    const isValidUrl = stylePreview.startsWith('http') || stylePreview.startsWith('data:image');
    if (!isValidUrl) {
      setError("Character style preview is in an invalid format.");
      setIsGenerating(false); return;
    }
    // Character style preview is validated

    // --- Generation Start ---
    try {
      // Step 1: Generate the book structure (text, prompts, etc.)
      updateProgressInfo('Generating book structure...');
      const result = await openaiService.generateCompleteBook(storyData);
      if (!result || !result.success) {
        setError(result?.error || 'Failed to generate book structure.');
        setIsGenerating(false); return;
      }
      const book = result.book;

      // Step 2: Generate images for the book, updating as each is ready
      updateProgressInfo('Generating images for book pages...');
      await generateImagesForBookWithReferences(
        book,
        stylePreview,
        (updatedPages) => {
          setGeneratedPagesData(updatedPages);
          setGenerationProgress(Math.round((updatedPages.length / book.pages.length) * 100));
        }
      );
      updateProgressInfo('All images generated!');
      setIsGenerating(false);
    } catch (err) {
      setError(err.message || 'An error occurred during book generation.');
      setIsGenerating(false);
    }
  };
  // --- End of REFACTORED generateBook Function ---

  const handleBack = () => {
    console.log("[GenerateBookStep] Navigating back to summary (previous wizard step)...");
    // Navigate back to the previous step in the wizard
    setWizardStep(wizardState.currentStep - 1);
    // It might be better to navigate to a specific summary step number if defined
    // setWizardStep(5); // Assuming summary is step 5
    navigate('/create'); // Go back to the main wizard page
  };

  const handleViewBook = () => {
    if (generatedBook) {
      navigate(`/book/${generatedBook.id}`);
    }
  };

  // --- JSX Structure ---
  return (
    <div className="container mx-auto p-6 max-w-4xl bg-white rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-center mb-6 text-purple-700">Generating Your Book</h1>

      {isGenerating && (
        <div className="flex flex-col items-center space-y-4 my-8">
          <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-700">{progressInfo || 'Generation in progress...'}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-width duration-300 ease-in-out"
              style={{ width: `${generationProgress}%` }}>
            </div>
          </div>
          <p className="text-sm text-gray-500">{Math.round(generationProgress)}% Complete</p>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* --- Display Generated Content Progressively --- */}
      <div className="mt-8 space-y-6"> {/* Increased spacing */}
        {/* Display Cover */}
        {generatedCoverUrl && (
          <div className="border p-4 rounded shadow bg-gray-50"> {/* Added subtle background */}
            <h2 className="text-xl font-semibold mb-3 text-center text-gray-700">Cover</h2> {/* Centered title */}
            <img
              src={generatedCoverUrl === 'PLACEHOLDER_COVER_URL' ? '/placeholder-image.png' : generatedCoverUrl}
              alt="Generated Book Cover"
              className="w-full max-w-xs mx-auto rounded shadow-md border" // Added border
              onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }} // Fallback image
            />
            {generatedCoverUrl === 'PLACEHOLDER_COVER_URL' && <p className="text-center text-sm text-red-500 mt-2">(Placeholder - Generation Error)</p>}
          </div>
        )}

        {/* Display Pages */}
        {generatedPagesData.length > 0 && (
          <div className="border p-4 rounded shadow bg-gray-50">
            <h2 className="text-xl font-semibold mb-4 text-center text-gray-700">Pages</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Grid layout for pages */}
              {generatedPagesData.map((page, index) => (
                <div key={page.id} className="border p-3 rounded shadow-sm bg-white">
                  <h3 className="text-lg font-medium mb-2 text-gray-600">Page {index + 1}</h3>
                  <img
                    src={page.imageUrl === 'ERROR_MISSING' || page.imageUrl === 'ERROR_IMAGE_GEN' ? '/placeholder-image.png' : page.imageUrl}
                    alt={`Illustration for page ${index + 1}`}
                    className="w-full h-48 object-cover rounded border mb-2" // Fixed height, object-cover
                    onError={(e) => { e.target.onerror = null; e.target.src='/placeholder-image.png'; }}
                  />
                  {(page.imageUrl === 'ERROR_MISSING' || page.imageUrl === 'ERROR_IMAGE_GEN') && <p className="text-center text-xs text-red-500 mb-2">(Image Generation Error)</p>}
                  <p className="text-sm text-gray-700">{page.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* --- End Display Generated Content --- */}


      {!isGenerating && generatedBook && generationProgress === 100 && !error && ( // Added checks for completion and no error
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-semibold text-green-600 mb-4">Book Generation Complete!</h2>
          <p className="mb-6">Your book "{generatedBook.title}" has been created.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleViewBook}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              View Book
            </button>
            <button
              onClick={() => {
                resetWizard();
                navigate('/'); // Navigate to home or dashboard
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
            >
              Create Another Book
            </button>
          </div>
        </div>
      )}

      {!isGenerating && error && (
         <div className="mt-8 text-center">
           <p className="text-red-600 mb-4">Generation failed. Please check the error message above.</p>
           <button
             onClick={handleBack} // Allow user to go back and potentially fix input
             className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300"
           >
             Go Back
           </button>
         </div>
      )}
    </div>
  );
};

export default GenerateBookStep;