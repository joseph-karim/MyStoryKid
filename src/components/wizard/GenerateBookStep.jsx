import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store';
import useEnhancedBookStore from '../../store/useEnhancedBookStore.js';

import { 
  generateStoryContent, 
  generateImage, 
  generateImageWithReferences, 
  generateCharacterImage, 
  generateSceneImage, 
  generateCoverImage,
  createStoryOutline,
  generatePageContent 
} from '../../services/supabaseService';
import { getStyleNameFromCode } from '../../utils/styleUtils';
import { ensureAnonymousSession, storeCurrentBookId } from '../../services/anonymousAuthService';
import { v4 as uuidv4 } from 'uuid';
import fetchAndConvertToBase64 from '../CharacterWizard.jsx'; // Import the helper for base64 conversion
import useLoading from '../../hooks/useLoading';
import { BookGenerationModal } from '../LoadingModal';
import LoadingSpinner, { SpinnerPresets } from '../LoadingSpinner';

// Helper function to create the complete story prompt (similar to original OpenAI service)
const createCompleteStoryPrompt = (bookDetails, characters, numSpreads) => {
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

  // Determine text complexity guidance based on age range and book type
  let textComplexityGuidance = '';
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
**Goal:** Generate a complete children's book story as a JSON array of page objects.

**Core Book Details:**
* **Target Reading Age Range:** ${targetAgeRange}
* **Book Type:** ${bookDetails.storyType || 'standard'}
* **Characters:** ${characterDescriptions}
* **Art Style Reference:** ${artStyleReference}
* **Core Theme:** ${coreTheme}
* **Number of Pages/Spreads:** ${numSpreads}

**Instructions for AI:**
1. **Create a Complete Story:** Write a full story with beginning, middle, and end that flows naturally across ${numSpreads} pages/spreads.
2. **Text Complexity:** ${textComplexityGuidance}
3. **Story Structure:** Ensure logical progression with character development and a satisfying resolution.
4. **Include All Characters:** Make sure all characters have meaningful roles in the story.

**CRITICAL OUTPUT FORMAT:**
Return STRICTLY a JSON array of objects. Each object represents one page/spread and MUST have these exact keys:

- "text": (string) The story text for this page/spread. DO NOT include page numbers, spread numbers, or layout references - only the actual story content that children will read.
- "visualPrompt": (string) A detailed description for image generation, including the scene, characters, setting, mood, and composition. Include art style keywords like "${artStyleReference}".

**Example format:**
[
  {
    "text": "${mainCharacter.name} woke up excited for the day ahead.",
    "visualPrompt": "A cheerful bedroom scene with ${mainCharacter.name}, a ${mainCharacter.age || 'young'} ${mainCharacter.gender || 'child'}, stretching and smiling in bed. Warm morning sunlight streams through the window. ${artStyleReference} style illustration."
  },
  {
    "text": "Outside, ${mainCharacter.name} met their friend and they decided to explore.",
    "visualPrompt": "Two children meeting in a sunny yard, looking excited and ready for adventure. ${artStyleReference} style illustration."
  }
]

Ensure the entire output is a single valid JSON array with exactly ${numSpreads} page objects.
`;
};

// Helper function to create the outline prompt (kept for reference but not used)
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
Return a JSON array of strings, where each string describes one spread. DO NOT include page numbers in the descriptions. Example:
[
  "Introduce [Main Character] and [Supporting Character] in [Setting]. They discover [Story Spark].",
  "[Main Character] and [Supporting Character] encounter [Main Hurdle] and realize it's a problem.",
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
    * CRITICAL: DO NOT include page numbers, spread numbers, or any layout references in the story text itself. Only include the actual story content.
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

    // Use Supabase Edge Function to generate the outline
    const outlineResult = await generateStoryContent(outlinePrompt, {
      temperature: 0.7,
      max_tokens: 1000
    });
    const outlineResponse = outlineResult.content;

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

      const contentResult = await generateStoryContent(spreadPrompt, {
        temperature: 0.7,
        max_tokens: 800
      });
      const contentResponse = contentResult.content;

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

    const coverResult = await generateStoryContent(coverPrompt, {
      temperature: 0.7,
      max_tokens: 400
    });
    const coverResponse = coverResult.content;

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

  // Use the new loading system
  const {
    isLoading,
    progress,
    progressMessage,
    estimatedTimeRemaining,
    startLoading,
    stopLoading,
    updateProgressWithTimeEstimate,
    formatTimeRemaining
  } = useLoading('bookGeneration');

  const [generatedBook, setGeneratedBook] = useState(null);
  const [error, setError] = useState(null);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState(null); // State for cover image URL
  const [generatedPagesData, setGeneratedPagesData] = useState([]); // State for progressively generated pages
  const [showLoadingModal, setShowLoadingModal] = useState(false);
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

  // --- REFACTORED generateBook Function ---
  const generateBook = async () => {
    startLoading('Starting book generation...');
    setShowLoadingModal(true);
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
      stopLoading(); 
      setShowLoadingModal(false);
      return;
    }
    if (!mainCharacter.stylePreview || typeof mainCharacter.stylePreview !== 'string') {
      setError("Character style preview is missing.");
      stopLoading();
      setShowLoadingModal(false);
      return;
    }
    const stylePreview = mainCharacter.stylePreview;
    // Accept both HTTP URLs and Base64 data URLs for stylePreview
    const isValidUrl = stylePreview.startsWith('http') || stylePreview.startsWith('data:image');
    if (!isValidUrl) {
      setError("Character style preview is in an invalid format.");
      stopLoading();
      setShowLoadingModal(false);
      return;
    }
    // Character style preview is validated

    // --- Generation Start ---
    let storyOutline = []; // Define outline variable outside try block
    try {
      const coverProgressAllocation = 15; // % for cover
      const outlineProgressAllocation = 5; // % for outline
      const pagesBaseProgress = coverProgressAllocation + outlineProgressAllocation;

      // ---------- STEP 1: Generate Complete Story Pages ----------
      updateProgressWithTimeEstimate(outlineProgressAllocation / 2, 'Generating complete story...');
      
      // Calculate number of spreads based on book type
      let numSpreads = 8; // default
      if (storyData.storyType === 'board_book') {
        numSpreads = 6; // shorter for board books
      } else if (storyData.storyType === 'picture_book') {
        numSpreads = 12; // longer for picture books
      }
      
      const completeStoryPrompt = createCompleteStoryPrompt(storyData, characters, numSpreads);
      const storyResult = await generateStoryContent(completeStoryPrompt, { temperature: 0.7, max_tokens: 2000 });
      const storyResponse = storyResult.content;

      // Parse the complete story response
      let storyPages;
      try {
        const parsedStory = JSON.parse(storyResponse);
        storyPages = Array.isArray(parsedStory) ? parsedStory : Object.values(parsedStory).find(Array.isArray);
        if (!storyPages) throw new Error('Story not in expected array format.');
      } catch (e) {
         console.warn('Failed to parse story JSON, trying manual extraction:', e);
         const arrayMatch = storyResponse.match(/\[[\s\S]*\]/);
         if (arrayMatch) storyPages = JSON.parse(arrayMatch[0]);
         else throw new Error('Could not parse story pages from AI response.');
      }
      if (!Array.isArray(storyPages) || storyPages.length === 0) {
        throw new Error('Failed to generate valid story pages');
      }
      updateProgressWithTimeEstimate(outlineProgressAllocation, 'Complete story generated.');

      // ---------- STEP 2: Generate Cover Image ----------
      updateProgressWithTimeEstimate(outlineProgressAllocation + 2, 'Generating cover image...');
      let coverImageUrl = 'PLACEHOLDER_COVER_URL'; // Default placeholder
      try {
        const { coverVisualPrompt } = await generateCoverPrompt(storyData);
        if (!coverVisualPrompt) throw new Error("Failed to generate cover visual prompt.");

        // --- OpenAI Cover Image Generation ---
        updateProgressWithTimeEstimate(outlineProgressAllocation + coverProgressAllocation * 0.5, 'Generating cover image with OpenAI...');

        // Get style description based on art style code
        const styleDescription = getStyleNameFromCode(storyData.artStyleCode) || 'colorful, child-friendly illustration style';

        // Prepare character descriptions for all characters
        const characterDescriptions = storyData.bookCharacters.map(character => {
          return `${character.name}, a ${character.age || ''} year old ${character.gender || 'child'} ${character.role === 'main' ? '(main character)' : ''}`;
        });

        // Collect character reference images for cover generation
        let characterReferenceImageUrls = await Promise.all(
          storyData.bookCharacters
            .filter(character => character.stylePreview)
            .map(async character => {
              const img = character.stylePreview;
              if (img.startsWith('data:image')) return img;
              if (img.startsWith('http')) {
                const base64 = await fetchAndConvertToBase64(img);
                if (base64 && base64.startsWith('data:image')) return base64;
                return null;
              }
              return null;
            })
        );
        characterReferenceImageUrls = characterReferenceImageUrls.filter(Boolean);
        console.log('Filtered/converted character reference images:', characterReferenceImageUrls);
        if (characterReferenceImageUrls.length === 0) {
          setError('No valid character preview images available for cover generation. Please generate a character preview first.');
          stopLoading();
          setShowLoadingModal(false);
          return;
        }

        // Generate cover image using Supabase Edge Function with reference images and style code
        coverImageUrl = await generateCoverImage(
          storyData.title,
          characterDescriptions,
          `Use a ${styleDescription} style. ${coverVisualPrompt}`,
          characterReferenceImageUrls, // Pass reference images
          storyData.artStyleCode // Pass the art style code for style reference
        );

        if (!coverImageUrl) throw new Error("OpenAI cover generation failed.");
        updateProgressWithTimeEstimate(pagesBaseProgress - 2, 'Cover image completed.');

        // Store the generated cover URL
        setGeneratedCoverUrl(coverImageUrl); // Update state immediately

      } catch (coverError) {
        console.error("Error generating cover illustration:", coverError);
        updateProgressWithTimeEstimate(pagesBaseProgress - 1, `Error generating cover: ${coverError.message}. Using placeholder.`);
        setGeneratedCoverUrl(coverImageUrl); // Set placeholder on error
      }
      updateProgressWithTimeEstimate(pagesBaseProgress, 'Cover generation complete. Starting page generation...'); // Update progress after cover attempt

      // ---------- STEP 3: Generate Images for Pre-Generated Story Pages ----------
      const totalPagesToGenerate = storyPages.length;
      const progressPerPage = (100 - pagesBaseProgress) / totalPagesToGenerate; // Remaining progress

      // Character tracking system for reference images
      const characterReferenceImages = {}; // Store first appearance of each character
      let previousPageImageUrl = generatedCoverUrl; // Start with cover as reference for style
      // eslint-disable-next-line no-unused-vars
      let firstPageImageUrl = null; // Store the first page image as primary reference

      // Initialize character tracking with all book characters
      storyData.bookCharacters.forEach(character => {
        characterReferenceImages[character.id] = {
          name: character.name,
          firstAppearance: null, // Will be set when character first appears
          referenceImageUrl: character.stylePreview || null, // Use character preview if available
          appearedInPages: [], // Track which pages this character appears in
          appearanceDetails: {}, // Store appearance details for each page
          outfitDescription: '', // Will be populated after first appearance
          hairstyleDescription: '', // Will be populated after first appearance
          colorScheme: '' // Will be populated after first appearance
        };
      });

      console.log('Initialized character reference tracking:',
        Object.keys(characterReferenceImages).map(id => characterReferenceImages[id].name));

      for (let index = 0; index < totalPagesToGenerate; index++) {
        const currentPageData = storyPages[index];
        const currentPageProgressBase = pagesBaseProgress + (index * progressPerPage);
        const pageNumber = index + 1; // For logging and display

        // Extract text and visual prompt from pre-generated story
        let spreadText = currentPageData.text || `Error: Missing text for page ${pageNumber}`;
        let spreadVisualPrompt = currentPageData.visualPrompt || `Error: Missing visual prompt for page ${pageNumber}`;
        let finalImageUrl = 'ERROR_MISSING'; // Default for page image

        try {
          // --- Use Pre-Generated Text & Visual Prompt ---
          updateProgressWithTimeEstimate(Math.round(currentPageProgressBase + progressPerPage * 0.2), `Using pre-generated content for page ${pageNumber}/${totalPagesToGenerate}...`);

          // --- Analyze which characters appear in this page ---
          // This is a simple approach - in a more advanced implementation, we could use NLP to detect character mentions
          const charactersInThisPage = [];

          // Check which characters are mentioned in the text or prompt
          storyData.bookCharacters.forEach(character => {
            const characterName = character.name;
            if (
              spreadText.includes(characterName) ||
              spreadVisualPrompt.includes(characterName)
            ) {
              charactersInThisPage.push(character.id);
              // Record that this character appears on this page
              characterReferenceImages[character.id].appearedInPages.push(pageNumber);
            }
          });

          console.log(`Characters detected in page ${pageNumber}:`,
            charactersInThisPage.map(id => characterReferenceImages[id].name));

          // --- Generate Image for Current Spread (OpenAI) ---
          try {
            // OpenAI Scene Generation
            updateProgressWithTimeEstimate(Math.round(currentPageProgressBase + progressPerPage * 0.4), `Generating image for page ${pageNumber} with OpenAI...`);
            if (!spreadVisualPrompt || spreadVisualPrompt.startsWith('Error:')) throw new Error("Visual prompt is missing or invalid.");
            if (!storyData.artStyleCode) throw new Error("Missing art style code.");

            // Get style description based on art style code
            const styleDescription = getStyleNameFromCode(storyData.artStyleCode) || 'colorful, child-friendly illustration style';

            // Prepare character descriptions for all characters
            const characterDescriptions = storyData.bookCharacters.map(character => {
              return `${character.name}, a ${character.age || ''} year old ${character.gender || 'child'} ${character.role === 'main' ? '(main character)' : ''}`;
            });

            // Build character reference information
            const characterReferenceInfo = {};

            // For each character in this page
            charactersInThisPage.forEach(characterId => {
              const charInfo = characterReferenceImages[characterId];

              // If this is the character's first appearance in the story
              if (charInfo.appearedInPages.length === 1 && charInfo.appearedInPages[0] === pageNumber) {
                console.log(`First appearance of character ${charInfo.name} on page ${pageNumber}`);
                // No reference image yet for this character
                characterReferenceInfo[characterId] = {
                  name: charInfo.name,
                  isFirstAppearance: true,
                  referenceImageUrl: charInfo.referenceImageUrl, // Use character preview if available
                  outfitDescription: charInfo.outfitDescription || '',
                  hairstyleDescription: charInfo.hairstyleDescription || '',
                  colorScheme: charInfo.colorScheme || '',
                  storyData: storyData // Pass the story data for style reference
                };
              } else {
                // Character has appeared before, use their first appearance as reference
                if (!charInfo.firstAppearance && charInfo.appearedInPages.length > 0) {
                  // Set the first appearance if not already set
                  charInfo.firstAppearance = charInfo.appearedInPages[0];
                }

                characterReferenceInfo[characterId] = {
                  name: charInfo.name,
                  isFirstAppearance: false,
                  referenceImageUrl: charInfo.referenceImageUrl,
                  firstAppearancePage: charInfo.firstAppearance,
                  outfitDescription: charInfo.outfitDescription || '',
                  hairstyleDescription: charInfo.hairstyleDescription || '',
                  colorScheme: charInfo.colorScheme || '',
                  storyData: storyData // Pass the story data for style reference
                };
              }
            });

            // Determine which reference image to use for style consistency
            // For first page, no reference
            // For subsequent pages, use previous page for style consistency
            const styleReferenceImage = index === 0 ? null : previousPageImageUrl;

            // Log reference image usage
            console.log(`Using style reference image for page ${pageNumber}: ${styleReferenceImage ? 'Yes' : 'No'}`);
            console.log(`Character reference info for page ${pageNumber}:`,
              Object.keys(characterReferenceInfo).map(id => ({
                name: characterReferenceImages[id].name,
                isFirstAppearance: characterReferenceInfo[id].isFirstAppearance,
                hasReference: !!characterReferenceInfo[id].referenceImageUrl,
                outfitDescription: characterReferenceInfo[id].outfitDescription || 'Not yet defined',
                hairstyleDescription: characterReferenceInfo[id].hairstyleDescription || 'Not yet defined',
                colorScheme: characterReferenceInfo[id].colorScheme || 'Not yet defined'
              })));

            // Generate scene image using OpenAI with reference images and character info
            finalImageUrl = await generateSceneImage(
              spreadVisualPrompt,
              characterDescriptions,
              `Use a ${styleDescription} style.`,
              styleReferenceImage, // Style reference (previous page)
              pageNumber,
              characterReferenceInfo // Character-specific reference information
            );

            if (!finalImageUrl) throw new Error("OpenAI image generation failed.");
            updateProgressWithTimeEstimate(Math.round(currentPageProgressBase + progressPerPage * 0.9), `Image for page ${pageNumber} completed.`);

            // Store the first page image as our primary reference for style consistency
            if (index === 0 && finalImageUrl) {
              firstPageImageUrl = finalImageUrl;
              console.log('Stored first page image as primary style reference');
            }

            // Update reference images for characters that appear in this page
            charactersInThisPage.forEach(characterId => {
              const charInfo = characterReferenceImages[characterId];

              // If this is the character's first appearance, store this image as their reference
              if (charInfo.appearedInPages.length === 1 && charInfo.appearedInPages[0] === pageNumber) {
                charInfo.referenceImageUrl = finalImageUrl;
                charInfo.firstAppearance = pageNumber;

                // Generate appearance descriptions for the character based on the prompt
                // These will be used for consistency in future appearances
                charInfo.outfitDescription = `${charInfo.name} wears the same outfit as shown in their first appearance on page ${pageNumber}`;
                charInfo.hairstyleDescription = `${charInfo.name} has the same hairstyle as shown in their first appearance on page ${pageNumber}`;
                charInfo.colorScheme = `${charInfo.name} has the same color scheme as shown in their first appearance on page ${pageNumber}`;

                // Store appearance details for this page
                charInfo.appearanceDetails[pageNumber] = {
                  imageUrl: finalImageUrl,
                  outfitDescription: charInfo.outfitDescription,
                  hairstyleDescription: charInfo.hairstyleDescription,
                  colorScheme: charInfo.colorScheme
                };

                console.log(`Set reference image and appearance details for character ${charInfo.name} from page ${pageNumber}`);
              } else {
                // For subsequent appearances, store the image but don't change the reference
                charInfo.appearanceDetails[pageNumber] = {
                  imageUrl: finalImageUrl
                };
              }
            });

            // Update the previous page image reference for the next iteration
            previousPageImageUrl = finalImageUrl;

          } catch (imageGenError) {
            console.error(`Error generating image for page ${index + 1}:`, imageGenError);
            updateProgressWithTimeEstimate(Math.round(currentPageProgressBase + progressPerPage * 0.8), `Error generating image for page ${index + 1}: ${imageGenError.message}`);
            finalImageUrl = 'ERROR_IMAGE_GEN'; // Mark image as error
          }
        } catch (pageGenError) {
           console.error(`Error processing page ${index + 1}:`, pageGenError);
           updateProgressWithTimeEstimate(Math.round(currentPageProgressBase + progressPerPage * 0.5), `Error processing page ${index + 1}: ${pageGenError.message}`);
           // Keep default error values for text/image
        }

        // --- Update State with Completed Page ---
        const newPageObject = {
          id: `page-${index + 1}`,
          type: 'content',
          text: spreadText,
          // visualPrompt: spreadVisualPrompt, // Optional: Keep prompt for debugging/regen?
          imageUrl: finalImageUrl,
          spreadIndex: index
        };
        // Update state progressively
        setGeneratedPagesData(prev => [...prev, newPageObject]);
        updateProgressWithTimeEstimate(Math.round(currentPageProgressBase + progressPerPage), `Page ${pageNumber} completed.`); // Mark page as fully done

      } // End loop through pages

      // ---------- STEP 4: Assemble Final Book Object ----------
      updateProgressWithTimeEstimate(95, 'Assembling final book...');
      // Use the state variables populated during the sequential generation
      const finalBookData = {
        id: uuidv4(),
        title: storyData.title || 'My Custom Story',
        status: 'draft',
        childName: mainCharacter.name,
        category: storyData.category,
        artStyleCode: storyData.artStyleCode,
        characters: storyData.bookCharacters,
        pages: [
          { id: 'page-cover', type: 'cover', text: storyData.title, imageUrl: generatedCoverUrl || 'PLACEHOLDER_COVER_URL' },
          { id: 'page-title', type: 'title', text: `${storyData.title}\n\nA story about ${mainCharacter.name}${supportingCharacters.length > 0 ? ' and ' + supportingCharacters.map(c => c.name).join(', ') : ''}`, imageUrl: '' },
          ...generatedPagesData, // Use the progressively generated pages array from state
          { id: 'page-back', type: 'back-cover', text: `The End\n\nCreated with love for ${mainCharacter.name}${supportingCharacters.length > 0 ? ' and ' + supportingCharacters.map(c => c.name).join(', ') : ''}`, imageUrl: '' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        setting: storyData.setting,
        ageRange: storyData.ageRange,
      };

      // Save book to database
      updateProgressWithTimeEstimate(97, 'Saving book to database...');
      try {
        const { saveBookToDB } = useEnhancedBookStore.getState();
        const savedBook = await saveBookToDB(finalBookData);
        console.log(`[GenerateBookStep] Book saved to database:`, savedBook.id);
        
        setGeneratedBook(savedBook); // Set the saved book object
        storeCurrentBookId(savedBook.id);
        console.log(`[GenerateBookStep] Stored book ID ${savedBook.id} for potential claiming`);
        
        // Update legacy store for compatibility
        if (typeof addBook === 'function') addBook(savedBook);
        else console.error("[GenerateBookStep] Error: addBook function not available");
        if (typeof setLatestGeneratedBookId === 'function') setLatestGeneratedBookId(savedBook.id);
        else console.error("[GenerateBookStep] Error: setLatestGeneratedBookId function not available");
      } catch (dbError) {
        console.error('[GenerateBookStep] Error saving to database:', dbError);
        // Fall back to local storage only
        setGeneratedBook(finalBookData);
        storeCurrentBookId(finalBookData.id);
        if (typeof addBook === 'function') addBook(finalBookData);
        if (typeof setLatestGeneratedBookId === 'function') setLatestGeneratedBookId(finalBookData.id);
      }

      updateProgressWithTimeEstimate(100, 'Book generation complete!');
      setShowLoadingModal(false);
      stopLoading();

    } catch (error) {
      console.error('Book generation failed:', error);
      setError(`Generation failed: ${error.message}`);
      updateProgressWithTimeEstimate(100, `Error: ${error.message}`);
      setShowLoadingModal(false);
      stopLoading();
    } finally {
      console.log("Full book generation process finished.");
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
    <>
      {/* Loading Modal */}
      <BookGenerationModal 
        isOpen={showLoadingModal}
        allowCancel={false}
      />
      
      <div className="container mx-auto p-6 max-w-4xl bg-white rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-purple-700">Generating Your Book</h1>

        {isLoading && !showLoadingModal && (
          <div className="flex flex-col items-center space-y-4 my-8">
            <LoadingSpinner {...SpinnerPresets.bookGeneration} />
            <p className="text-lg font-medium text-gray-700">{progressMessage || 'Generation in progress...'}</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>{Math.round(progress)}% Complete</span>
              {estimatedTimeRemaining && (
                <span>~{formatTimeRemaining(estimatedTimeRemaining)} remaining</span>
              )}
            </div>
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


      {!isLoading && generatedBook && progress === 100 && !error && ( // Added checks for completion and no error
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

      {!isLoading && error && (
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
    </>
  );
};

export default GenerateBookStep;