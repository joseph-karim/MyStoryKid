import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store';
import * as openaiService from '../../services/openaiService';
import * as openaiImageService from '../../services/openaiImageService';
import { getStyleNameFromCode } from '../../services/dzineService';
import { ensureAnonymousSession, storeCurrentBookId } from '../../services/anonymousAuthService';
import { v4 as uuidv4 } from 'uuid';

// Helper function to create the outline prompt
const createOutlinePrompt = (bookDetails, characters) => {
  const mainCharacter = characters.find(c => c.role === 'main') || characters[0] || {};
  const supportingCharacters = characters.filter(c => c.id !== mainCharacter.id);

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

  return `
**Goal:** Generate a concise page-by-page OR spread-by-spread outline for a children's book based on the provided details.

**Core Book Details:**
* **Target Reading Age Range:** ${targetAgeRange}
* **Target Illustration Age Range:** ${targetAgeRange}
* **Main Character(s):** ${mainCharacter.name || 'Main Character'}, ${mainCharacter.traits?.join(', ') || 'friendly and adventurous'}
* **Supporting Characters (Optional):** ${supportingCharacters.map(c => `${c.name}: ${c.traits?.join(', ')}`).join('; ') || 'None'}
* **Art Style:** ${bookDetails.artStyleCode?.replace(/_/g, ' ') || 'Defined by keywords'}
* **Core Theme:** ${coreTheme}
* **Overall Length:** ${numSpreads} Spreads (${numSpreads * 2} pages)
* **Story Spark:** ${mainChallengePlot}
* **Main Hurdle:** ${mainHurdle}
* **Character's Big Try:** ${bigTry}
* **Key Turning Point:** ${turningPoint}
* **Happy Ending:** ${happyEnding}
* **Takeaway:** ${takeaway}

**Instructions for AI:**
1.  Based on all the core book details, create a brief outline distributing the story events across the specified **Overall Length** (${numSpreads} spreads). Define a "spread" as two facing pages (e.g., Spread 1 = Pages 2-3).
2.  For each spread, write 1-2 sentences describing:
    * The main action or event happening on that spread.
    * How it connects to the character(s) and the overall plot points.
3.  Ensure the plot progresses logically according to the Story Details.
4.  Keep descriptions concise and focused on the core content for each spread.

**Output Format:**
Return a JSON array of strings, where each string describes one spread. Example:
[
  "Spread 1 (Pages 2-3): Introduce [Character] in [Setting]. They discover [Story Spark].",
  "Spread 2 (Pages 4-5): [Character] encounters [Main Hurdle] and realizes it's a problem.",
  ...and so on for each spread
]
`;
};

// Helper function to create the page content prompt
const createSpreadContentPrompt = (bookDetails, characters, outline, spreadIndex, spreadOutline) => {
  const mainCharacter = characters.find(c => c.role === 'main') || characters[0] || {};

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

  return `
**Goal:** Generate the page text AND an inferred image prompt for a specific page/spread of the children's book, using the outline and core details.

**Core Book Details (Reminder):**
* **Target Reading Age Range:** ${targetAgeRange}
* **Target Illustration Age Range:** ${targetAgeRange}
* **Main Character(s):** ${mainCharacter.name || 'Main Character'}, ${mainCharacter.traits?.join(', ') || 'friendly and adventurous'}
* **Art Style Reference (Dzine Code):** ${artStyleReference}
* **Core Theme:** ${coreTheme}
* **Full Story Outline:**
${outline.map(item => `${item}`).join('\n')}

**Current Target:** **Spread ${spreadIndex + 1} (Pages ${(spreadIndex + 1) * 2}-${(spreadIndex + 1) * 2 + 1})**

**Outline Snippet for THIS Spread:** "${spreadOutline}"

**Instructions for AI:**
1.  **Generate Page Text:**
    * Write the text that should appear on **Spread ${spreadIndex + 1} / Pages ${(spreadIndex + 1) * 2}-${(spreadIndex + 1) * 2 + 1}**.
    * The text must accurately reflect the action described in the **Outline Snippet for THIS Spread**.
    * Adhere strictly to the **Target Reading Age Range** regarding vocabulary, sentence length, and complexity.
    * Reflect the characters' personalities.
    * Ensure the amount of text is appropriate for the book type.
2.  **Generate Inferred Image Prompt:**
    * Create a descriptive prompt for an image generation AI (Segmind).
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
      console.warn('Failed to parse outline as JSON, trying to extract array manually:', error);
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

    // Build a basic prompt for the cover
    const coverPrompt = `
    Generate a single visual prompt suitable for Dzine Text-to-Image for the cover of a children's book titled "${title}".
    The main character is ${mainCharacter.name}, a ${mainCharacter.age || 'young'} ${mainCharacter.gender || 'child'}.
    The book is about ${category}.

    The prompt should describe an appealing cover image, including:
    1. The overall scene, setting, mood, and composition.
    2. A description of a placeholder character (e.g., 'a ${mainCharacter.age || 'young'} ${mainCharacter.gender || 'child'} placeholder') in an engaging pose or action representing the book's theme.
    3. Include relevant style keywords (e.g., "${getStyleNameFromCode(storyData.artStyleCode)} style").

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
            characterPrompt: `${mainCharacter.name}, the main character of the story`,
            scenePrompt: `Colorful and engaging cover for a children's book about ${category}`
          };
        }
      } else {
        // Create a basic object as fallback
        coverContent = {
          characterPrompt: `${mainCharacter.name}, the main character of the story`,
          scenePrompt: `Colorful and engaging cover for a children's book about ${category}`
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
    let storyOutline = []; // Define outline variable outside try block
    try {
      const coverProgressAllocation = 15; // % for cover
      const outlineProgressAllocation = 5; // % for outline
      const pagesBaseProgress = coverProgressAllocation + outlineProgressAllocation;

      // ---------- STEP 1: Generate Story Outline ----------
      updateProgressInfo('Generating story outline...');
      setGenerationProgress(outlineProgressAllocation / 2);
      const outlinePrompt = createOutlinePrompt(storyData, characters);
      const outlineResponse = await openaiService.generateContent({ prompt: outlinePrompt, temperature: 0.7, max_tokens: 1000 });

      // let storyOutline; // Moved definition outside
      try {
        const parsedOutline = JSON.parse(outlineResponse);
        storyOutline = Array.isArray(parsedOutline) ? parsedOutline : Object.values(parsedOutline).find(Array.isArray);
        if (!storyOutline) throw new Error('Outline not in expected array format.');
      } catch (e) {
         console.warn('Failed to parse outline JSON, trying manual extraction:', e);
         const arrayMatch = outlineResponse.match(/\[[\s\S]*\]/);
         if (arrayMatch) storyOutline = JSON.parse(arrayMatch[0]);
         else throw new Error('Could not parse story outline from AI response.');
      }
      if (!Array.isArray(storyOutline) || storyOutline.length === 0) {
        throw new Error('Failed to generate a valid story outline');
      }
      updateProgressInfo('Story outline generated.');
      setGenerationProgress(outlineProgressAllocation);

      // ---------- STEP 2: Generate Cover Image ----------
      updateProgressInfo('Generating cover image...');
      let coverImageUrl = 'PLACEHOLDER_COVER_URL'; // Default placeholder
      try {
        const { coverVisualPrompt } = await generateCoverPrompt(storyData);
        if (!coverVisualPrompt) throw new Error("Failed to generate cover visual prompt.");

        // --- OpenAI Cover Image Generation ---
        updateProgressInfo('Generating cover image with OpenAI...');
        setGenerationProgress(outlineProgressAllocation + coverProgressAllocation * 0.5); // Progress update

        // Get style description based on art style code
        const styleDescription = getStyleNameFromCode(storyData.artStyleCode) || 'colorful, child-friendly illustration style';

        // Generate cover image using OpenAI
        coverImageUrl = await openaiImageService.generateCoverImage(
          storyData.title,
          `${mainCharacter.name}, a ${mainCharacter.age || ''} year old ${mainCharacter.gender || 'child'}`,
          `Use a ${styleDescription} style. ${coverVisualPrompt}`
        );

        if (!coverImageUrl) throw new Error("OpenAI cover generation failed.");
        updateProgressInfo('Cover image completed.');

        // Store the generated cover URL
        setGeneratedCoverUrl(coverImageUrl); // Update state immediately

      } catch (coverError) {
        console.error("Error generating cover illustration:", coverError);
        updateProgressInfo(`Error generating cover: ${coverError.message}. Using placeholder.`);
        setGeneratedCoverUrl(coverImageUrl); // Set placeholder on error
      }
      setGenerationProgress(pagesBaseProgress); // Update progress after cover attempt

      // ---------- STEP 3: Generate Pages Sequentially ----------
      const totalPagesToGenerate = storyOutline.length;
      const progressPerPage = (100 - pagesBaseProgress) / totalPagesToGenerate; // Remaining progress

      for (let index = 0; index < totalPagesToGenerate; index++) {
        const currentSpreadOutline = storyOutline[index];
        const currentPageProgressBase = pagesBaseProgress + (index * progressPerPage);

        let spreadText = `Error generating text for page ${index + 1}`;
        let spreadVisualPrompt = `Error generating prompt for page ${index + 1}`;
        let finalImageUrl = 'ERROR_MISSING'; // Default for page image

        try {
          // --- Generate Text & Visual Prompt for Current Spread ---
          updateProgressInfo(`Generating text/prompt for page ${index + 1}/${totalPagesToGenerate}...`);
          setGenerationProgress(Math.round(currentPageProgressBase + progressPerPage * 0.1));
          const spreadPrompt = createSpreadContentPrompt(storyData, characters, storyOutline, index, currentSpreadOutline);
          const contentResponse = await openaiService.generateContent({ prompt: spreadPrompt, temperature: 0.7, max_tokens: 800 });

          let spreadContent;
          try {
            spreadContent = JSON.parse(contentResponse);
          } catch (e) {
             console.warn(`Failed to parse content JSON for spread ${index + 1}, trying manual extraction:`, e);
             const jsonMatch = contentResponse.match(/\{[\s\S]*\}/);
             if (jsonMatch) spreadContent = JSON.parse(jsonMatch[0]);
             else throw new Error('Could not parse spread content from AI response.');
          }
          spreadText = spreadContent.text || spreadText;
          spreadVisualPrompt = spreadContent.visualPrompt || spreadContent.imagePrompt || spreadVisualPrompt;
          updateProgressInfo(`Text/prompt for page ${index + 1} generated.`);

          // --- Generate Image for Current Spread (OpenAI) ---
          try {
            // OpenAI Scene Generation
            updateProgressInfo(`Generating image for page ${index + 1} with OpenAI...`);
            setGenerationProgress(Math.round(currentPageProgressBase + progressPerPage * 0.4));
            if (!spreadVisualPrompt || spreadVisualPrompt.startsWith('Error:')) throw new Error("Visual prompt is missing or invalid.");
            if (!storyData.artStyleCode) throw new Error("Missing art style code.");

            // Get style description based on art style code
            const styleDescription = getStyleNameFromCode(storyData.artStyleCode) || 'colorful, child-friendly illustration style';

            // Generate scene image using OpenAI
            finalImageUrl = await openaiImageService.generateSceneImage(
              spreadVisualPrompt,
              `${mainCharacter.name}, a ${mainCharacter.age || ''} year old ${mainCharacter.gender || 'child'}`,
              `Use a ${styleDescription} style.`
            );

            if (!finalImageUrl) throw new Error("OpenAI image generation failed.");
            updateProgressInfo(`Image for page ${index + 1} completed.`);

          } catch (imageGenError) {
            console.error(`Error generating image for page ${index + 1}:`, imageGenError);
            updateProgressInfo(`Error generating image for page ${index + 1}: ${imageGenError.message}`);
            finalImageUrl = 'ERROR_IMAGE_GEN'; // Mark image as error
          }
        } catch (pageGenError) {
           console.error(`Error processing page ${index + 1}:`, pageGenError);
           updateProgressInfo(`Error processing page ${index + 1}: ${pageGenError.message}`);
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
        setGenerationProgress(Math.round(currentPageProgressBase + progressPerPage)); // Mark page as fully done

      } // End loop through pages

      // ---------- STEP 4: Assemble Final Book Object ----------
      updateProgressInfo('Assembling final book...');
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
          { id: 'page-title', type: 'title', text: `${storyData.title}\n\nA story about ${mainCharacter.name}`, imageUrl: '' },
          ...generatedPagesData, // Use the progressively generated pages array from state
          { id: 'page-back', type: 'back-cover', text: `The End\n\nCreated with love for ${mainCharacter.name}`, imageUrl: '' }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        setting: storyData.setting,
        ageRange: storyData.ageRange,
      };

      setGeneratedBook(finalBookData); // Set the final book object
      storeCurrentBookId(finalBookData.id);
      console.log(`[GenerateBookStep] Stored book ID ${finalBookData.id} for potential claiming`);
      if (typeof addBook === 'function') addBook(finalBookData);
      else console.error("[GenerateBookStep] Error: addBook function not available");
      if (typeof setLatestGeneratedBookId === 'function') setLatestGeneratedBookId(finalBookData.id);
      else console.error("[GenerateBookStep] Error: setLatestGeneratedBookId function not available");

      updateProgressInfo('Book generation complete!');
      setGenerationProgress(100);

    } catch (error) {
      console.error('Book generation failed:', error);
      setError(`Generation failed: ${error.message}`);
      updateProgressInfo(`Error: ${error.message}`);
      setGenerationProgress(100); // End progress on error
    } finally {
      setIsGenerating(false); // Set generating to false now that all steps are done or failed
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