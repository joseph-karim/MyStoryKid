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
    if (!mainCharacter.stylePreview || typeof mainCharacter.stylePreview !== 'string' || !mainCharacter.stylePreview.startsWith('http')) {
        console.error("Main character's stylePreview is not a valid URL:", mainCharacter.stylePreview);
        setError("Character style preview is missing or not a valid URL, which is required for image generation. Please go back and ensure the character style was generated.");
        setIsGenerating(false);
        return;
    }
    const dzinePreviewUrl = mainCharacter.stylePreview;

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
        setGenerationProgress(prev => prev + (60 / storyPages.length)); 
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
            text: 'The End\n\nCreated with love for ${mainCharacter.name}',
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
    // Navigate to the wizard's summary step instead of a specific route
    // The URL should be the CreateBookPage URL with the summary step
    console.log("[GenerateBookStep] Navigating back to summary...");
    navigate('/create'); // Navigate to the create book wizard
    
    // This will trigger useEffect in CreateBookPage, so we also need to
    // make sure the step is set to summary (6)
    useBookStore.getState().setWizardStep(6);
  };
  
  const handleSave = () => {
    // Future functionality: Save the book to the database
    alert('Book saved successfully! (Future functionality)');
    navigate('/dashboard');
  };
  
  // Function to get image URL or status (No longer needs URL cleaning if storing Base64)
  const getImageUrlOrStatus = (index) => {
    const url = imageUrls[index];
    const status = imageStatus[index];
    
    if (status === 'success' && url && url.startsWith('data:image')) {
      return { type: 'url', value: url };
    } else if (status === 'loading') {
      return { type: 'status', value: 'loading' };
    } else if (status === 'error') {
      return { type: 'status', value: 'error' };
    } else {
      return { type: 'status', value: 'pending' }; // Or 'unavailable'
    }
  };
  
  // Add new handler for starting edit mode for a specific spread
  const handleEditSpread = (spreadIndex) => {
    const spread = spreadContents[spreadIndex];
    setEditingSpreadIndex(spreadIndex);
    setEditingText(spread.text);
    setEditingPrompt(spread.imagePrompt);
  };
  
  // Add handler for canceling edit mode
  const handleCancelEdit = () => {
    setEditingSpreadIndex(null);
    setEditingText('');
    setEditingPrompt('');
  };
  
  // Add handler for saving text edits
  const handleSaveTextEdit = () => {
    if (editingSpreadIndex === null) return;
    
    // Create a copy of the spread contents array
    const updatedContents = [...spreadContents];
    
    // Update the text for the specific spread
    updatedContents[editingSpreadIndex] = {
      ...updatedContents[editingSpreadIndex],
      text: editingText,
      imagePrompt: editingPrompt
    };
    
    // Update state
    setSpreadContents(updatedContents);
    
    // Exit edit mode
    setEditingSpreadIndex(null);
    setEditingText('');
    setEditingPrompt('');
  };
  
  // Add handler for regenerating a specific image
  const handleRegenerateImage = async (spreadIndex) => {
    if (regeneratingImage) return; // Prevent multiple regeneration requests
    
    try {
      setRegeneratingImage(true);
      setImageStatus(prev => ({ ...prev, [spreadIndex]: 'loading' }));
      
      const spread = spreadContents[spreadIndex];
      setProgressInfo(`Regenerating illustration ${spreadIndex + 1}...`);
      
      // Get the required data
      const mainCharacter = characters.find(c => c.role === 'main');
      if (!mainCharacter) throw new Error("Main character not found");
      
      let referenceBase64 = mainCharacter.stylePreview;
      const styleKeywords = bookDetails.selectedStyleKeywords || getKeywordsForDzineStyle(bookDetails.artStyleCode);
      
      // Apply the same Base64 format correction as in the main generation flow
      if (!referenceBase64) {
        throw new Error("Missing stylePreview for the main character");
      }
      
      // Try to correct the Base64 format if needed
      const correctedBase64 = ensureImageBase64Format(referenceBase64);
      if (correctedBase64) {
        referenceBase64 = correctedBase64;
      }
      
      console.log(`Regenerating image for spread ${spreadIndex}. Prompt: ${spread.imagePrompt}`);
      
      const segmindImageBase64 = await segmindService.generateConsistentCharacter(
        referenceBase64,
        spread.imagePrompt,
        styleKeywords
      );
      
      // Update the image URLs state
      if (segmindImageBase64 && segmindImageBase64.startsWith('data:image')) {
        setImageUrls(prev => ({ ...prev, [spreadIndex]: segmindImageBase64 }));
        setImageStatus(prev => ({ ...prev, [spreadIndex]: 'success' }));
        console.log(`Successfully regenerated image for spread ${spreadIndex}.`);
      } else {
        throw new Error('Segmind service did not return a valid Base64 image.');
      }
    } catch (error) {
      console.error(`Error regenerating image for spread ${spreadIndex}:`, error);
      setImageStatus(prev => ({ ...prev, [spreadIndex]: 'error' }));
      setError(`Failed to regenerate image ${spreadIndex + 1}: ${error.message}`);
    } finally {
      setRegeneratingImage(false);
    }
  };
  
  // Add helper for style name display if needed
  const getStyleDisplayName = (styleCode) => {
    return getStyleNameFromCode(styleCode);
  };
  
  // Render Content with Loading State
  const renderContent = () => {
    switch (generationState) {
      case 'idle':
        return <p className="text-lg">Preparing to generate your book...</p>;
        
      case 'generatingOutline':
      case 'generatingSpreadContent':
      case 'generatingImages':
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            <p className="text-lg font-medium">{progressInfo}</p>
          </div>
        );
        
      case 'displayingPreview':
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-center">Your Generated Book</h2>
            
            {/* Book spreads - with Edit functionality */}
            <div className="space-y-12">
              {spreadContents.map((spread, index) => (
                <div key={index} className="border rounded-lg overflow-hidden shadow-md">
                  <div className="bg-gray-50 p-3 border-b flex justify-between items-center">
                    <h3 className="font-medium">Spread {index + 1} (Pages {(index + 1) * 2}-{(index + 1) * 2 + 1})</h3>
                    {editingSpreadIndex !== index && (
                      <button 
                        onClick={() => handleEditSpread(index)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  
                  <div className="p-4 md:flex">
                    {/* Image with regenerate button */}
                    <div className="md:w-1/2 p-4 relative">
                      {(() => {
                        const imageResult = getImageUrlOrStatus(index);
                        
                        if (imageResult.type === 'url') {
                          return (
                            <div className="relative">
                              <img 
                                src={imageResult.value} 
                                alt={`Illustration for spread ${index + 1}`}
                                className="rounded-md shadow-sm mx-auto max-h-64 object-contain"
                                onError={(e) => {
                                  console.error(`[ImageDebug] Error rendering Base64 image for spread ${index + 1}`);
                                  e.target.onerror = null;
                                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' text-anchor='middle' dominant-baseline='middle' fill='%23999'%3EImage error%3C/text%3E%3C/svg%3E";
                                }}
                              />
                              
                              {/* Regenerate button */}
                              {editingSpreadIndex !== index && (
                                <div className="mt-2 flex justify-center">
                                  <button 
                                    onClick={() => handleRegenerateImage(index)}
                                    disabled={regeneratingImage}
                                    className={`text-xs px-2 py-1 rounded ${
                                      regeneratingImage 
                                        ? 'bg-gray-300 text-gray-700 cursor-not-allowed' 
                                        : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                                  >
                                    Regenerate Image
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        } else if (imageResult.value === 'loading') {
                          return (
                            <div className="bg-gray-100 rounded-md h-48 flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-10 h-10 border-t-2 border-blue-500 border-solid rounded-full animate-spin mx-auto mb-2"></div>
                                <p className="text-gray-500">Generating image...</p>
                              </div>
                            </div>
                          );
                        } else {
                          return (
                            <div className="bg-gray-200 rounded-md h-48 flex items-center justify-center">
                              <p className="text-gray-500">
                                {imageResult.value === 'error'
                                  ? 'Image generation failed'
                                  : 'Image unavailable'}
                              </p>
                              
                              {/* Retry button for failed images */}
                              {imageResult.value === 'error' && (
                                <button 
                                  onClick={() => handleRegenerateImage(index)}
                                  disabled={regeneratingImage}
                                  className="ml-2 text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                  Retry
                                </button>
                              )}
                            </div>
                          );
                        }
                      })()}
                    </div>
                    
                    {/* Text - Editable or Static */}
                    <div className="md:w-1/2 p-4">
                      {editingSpreadIndex === index ? (
                        <div className="space-y-4">
                          <h4 className="text-sm font-medium text-gray-700">Story Text:</h4>
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md h-32 text-sm"
                            placeholder="Enter story text for this spread..."
                          />
                          
                          <h4 className="text-sm font-medium text-gray-700">Image Prompt:</h4>
                          <textarea
                            value={editingPrompt}
                            onChange={(e) => setEditingPrompt(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md h-32 text-sm"
                            placeholder="Enter image generation prompt for this spread..."
                          />
                          
                          <div className="flex space-x-2">
                            <button
                              onClick={handleSaveTextEdit}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-lg">{spread.text}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Actions */}
            <div className="flex justify-between mt-8">
              <button
                onClick={handleBack}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Summary
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Save Book
              </button>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className="bg-red-50 border border-red-200 rounded-md p-6">
            <h2 className="text-xl font-medium text-red-800 mb-3">Error Generating Book</h2>
            <p className="text-red-700 mb-4">Sorry, something went wrong:</p>
            <pre className="bg-red-100 p-3 rounded overflow-auto text-sm mb-4">{error}</pre>
            <button 
              onClick={handleBack}
              className="px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Back to Summary
            </button>
          </div>
        );
        
      default:
        return <p>Loading...</p>;
    }
  };

  return (
    <div className="generate-book-step p-4 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">Generating Your Book</h1>
      {renderContent()}
    </div>
  );
};

export default GenerateBookStep; 