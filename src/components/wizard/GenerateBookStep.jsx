import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store';
import * as openaiService from '../../services/openaiService';
import * as segmindService from '../../services/segmindService';
import { getKeywordsForDzineStyle, getStyleNameFromCode } from '../../services/dzineService';
import { generateIllustrationWithWorkflow } from '../../services/segmindService';
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
${outline.map((item, i) => `${item}`).join('\n')}

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
Return a JSON object with two properties:
{
  "text": "The story text that will appear on this spread...",
  "imagePrompt": "Detailed visual prompt for image generation..."
}
`;
};

// Helper: Convert URL to Base64 (Add this if stylePreview might be a URL)
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

// --- Add new helper function for ensuring proper Base64 format --- 
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

// Function to handle AI response validation
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
  const [imageUrls, setImageUrls] = useState({}); // Store generated image URLs by page index
  const [generatedBook, setGeneratedBook] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically start generation when the component mounts
    // Or you could have a button call generateBook()
    generateBook();
  }, []); // Empty dependency array ensures this runs only once on mount

  const updateProgressInfo = (info) => {
    console.log('[Progress]', info);
    setProgressInfo(info);
  };

  const generateBook = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    updateProgressInfo('Starting book generation...');
    setError(null);
    setImageUrls({});
    setGeneratedBook(null);
    
    const { storyData } = wizardState;
    
    // Basic validation
    if (!storyData.bookCharacters || storyData.bookCharacters.length === 0) {
        setError("Main character information is missing.");
        setIsGenerating(false);
        return;
    }
    const mainCharacter = storyData.bookCharacters.find(c => c.role === 'main') || storyData.bookCharacters[0];
    if (!mainCharacter) {
        setError("Could not determine the main character.");
        setIsGenerating(false);
        return;
    }
    // **** CRITICAL VALIDATION: Ensure stylePreview is a URL ****
    if (!mainCharacter.stylePreview || typeof mainCharacter.stylePreview !== 'string') {
        console.error("Main character's stylePreview is missing or not a string:", mainCharacter.stylePreview);
        setError("Character style preview is missing. Please go back and ensure the character style was generated.");
        setIsGenerating(false);
        return;
    }
    
    // Accept both HTTP URLs and Base64 data URLs
    const stylePreview = mainCharacter.stylePreview;
    const isValidUrl = stylePreview.startsWith('http') || stylePreview.startsWith('data:image');
    
    if (!isValidUrl) {
        console.error("Main character's stylePreview is not a valid URL or Base64 data:", stylePreview.substring(0, 50) + '...');
        setError("Character style preview is in an invalid format. Please go back and ensure the character style was properly generated.");
        setIsGenerating(false);
        return;
    }
    
    // Use the stylePreview as is
    const dzinePreviewUrl = stylePreview;

    try {
      // ---------- STEP 1: Generate story outline ----------
      updateProgressInfo('Generating story text and prompts...');
      const storyPages = await generateStoryPages(storyData);
      setGenerationProgress(30);
      updateProgressInfo('Story text and prompts generated.');

      // ---------- STEP 2: Generate Illustrations via PixelFlow ----------
      updateProgressInfo(`Preparing to generate ${storyPages.length} illustrations...`);
      const illustrationPromises = storyPages.map(async (spread, index) => {
        updateProgressInfo(`Requesting illustration ${index + 1}/${storyPages.length}...`);
        
        // Extract prompts from the generated story pages
        const characterPrompt = spread.characterPrompt;
        const scenePrompt = spread.scenePrompt;
        
        if (!characterPrompt || !scenePrompt) {
            console.error(`Missing prompts for spread ${index}:`, spread);
            setImageUrls(prev => ({ ...prev, [index]: 'ERROR_MISSING_PROMPTS' }));
            return; // Skip this illustration
        }

        try {
            // Call the new workflow function (handles polling internally)
            const finalImageUrl = await generateIllustrationWithWorkflow(
                dzinePreviewUrl, 
                characterPrompt, 
                scenePrompt
            );
            setImageUrls(prev => ({ ...prev, [index]: finalImageUrl }));
            updateProgressInfo(`Illustration ${index + 1}/${storyPages.length} completed.`);
        } catch (segmindError) {
            console.error(`Segmind PixelFlow error for spread ${index}:`, segmindError);
            setImageUrls(prev => ({ ...prev, [index]: 'ERROR_PIXELFLOW' }));
            updateProgressInfo(`Error generating illustration ${index + 1}: ${segmindError.message}`);
            // Optionally re-throw or handle specific errors if needed
        }
        // Update progress incrementally
        if (storyPages.length > 0) {
           setGenerationProgress(prev => prev + (60 / storyPages.length)); 
        }
      });
      
      // Wait for all illustration requests (including polling) to complete
      await Promise.all(illustrationPromises);
      updateProgressInfo('All illustration generation processes finished.');
      setGenerationProgress(90); // Progress after illustration generation attempts

      // ---------- STEP 3: Generate Cover ----------
      updateProgressInfo('Generating cover image...');
      let coverImageUrl = 'PLACEHOLDER_COVER_URL'; // Default placeholder
      try {
          const { characterPrompt: coverCharPrompt, scenePrompt: coverScenePrompt } = await generateCoverPrompt(storyData);
          if (coverCharPrompt && coverScenePrompt) {
             coverImageUrl = await generateIllustrationWithWorkflow(
                dzinePreviewUrl, 
                coverCharPrompt, 
                coverScenePrompt
             );
          } else {
             console.warn("Could not generate specific cover prompts, using placeholder.");
          }
       } catch(coverError) {
          console.error("Error generating cover illustration:", coverError);
          updateProgressInfo(`Error generating cover: ${coverError.message}`);
          // Keep placeholder URL on error
       }
       updateProgressInfo('Cover image generated.');

      // ---------- STEP 4: Assemble Book Object ----------
      updateProgressInfo('Assembling final book...');
      const finalBook = {
        id: uuidv4(),
        title: storyData.title || 'My Custom Story',
        status: 'draft',
        childName: mainCharacter.name,
        category: storyData.category,
        artStyleCode: storyData.artStyleCode, // Keep the original Dzine code for reference
        characters: storyData.bookCharacters,
        pages: [
          {
            id: 'page-cover',
            type: 'cover',
            text: storyData.title,
            imageUrl: coverImageUrl, // Use generated or placeholder cover URL
          },
          {
            id: 'page-title',
            type: 'title',
            text: `${storyData.title}\n\nA story about ${mainCharacter.name}`,
            imageUrl: '', // Usually no image on title page
          },
          ...storyPages.map((page, index) => ({
            ...page,
            imageUrl: imageUrls[index] || 'ERROR_MISSING' // Use generated URL or error marker
          })),
          {
            id: 'page-back',
            type: 'back-cover',
            text: `The End\n\nCreated with love for ${mainCharacter.name}`,
            imageUrl: '', // Usually no image on back cover
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Add other relevant details from storyData if needed
        setting: storyData.setting,
        ageRange: storyData.ageRange,
        // ... etc
      };

      setGeneratedBook(finalBook);
      addBook(finalBook); // Add to the global store
      setLatestGeneratedBookId(finalBook.id); // Track the ID
      updateProgressInfo('Book generation complete!');
      setGenerationProgress(100);

    } catch (error) {
      console.error('Book generation failed:', error);
      setError(`Generation failed: ${error.message}`);
      updateProgressInfo(`Error: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

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

      {!isGenerating && generatedBook && (
        <div className="text-center space-y-4 my-8">
          <svg className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-semibold text-green-700">Generation Complete!</h2>
          <p className="text-gray-600">Your book "{generatedBook.title}" has been successfully created.</p>
          <button 
            onClick={handleViewBook}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md"
          >
            View Your Book
          </button>
        </div>
      )}

      {/* Buttons - Show back button always, show view button only when complete */} 
      <div className="flex justify-between mt-8">
        <button 
          onClick={handleBack}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:opacity-50"
          disabled={isGenerating} // Disable back while generating
        >
          &larr; Back to Summary
        </button>
        
        {!isGenerating && generatedBook && (
          <button 
            onClick={handleViewBook} // Reuse the view book handler
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 ease-in-out shadow-md"
          >
            View Book Again
          </button>
        )}
      </div>
    </div>
  );
};

export default GenerateBookStep; 