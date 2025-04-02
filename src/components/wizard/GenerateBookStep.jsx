import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store';
import * as openaiService from '../../services/openaiService';
import * as dzineService from '../../services/dzineService';

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
* **Art Style:** ${bookDetails.artStyleCode?.replace(/_/g, ' ') || 'Colorful cartoon style'} 
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
  const artStyle = bookDetails.artStyleCode?.replace(/_/g, ' ') || 'Colorful cartoon style';
  
  // Debug what we're actually using
  console.log(`[createSpreadContentPrompt] Spread ${spreadIndex + 1} parameters:`, {
    targetAgeRange,
    coreTheme,
    artStyle,
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
* **Art Style:** ${artStyle}
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
    * Based on the **Page Text you just generated** for this spread, create a descriptive prompt for an image generation AI.
    * The prompt must specify:
        * **Subject(s) & Action:** Main character(s) visible and what they are actively doing/feeling.
        * **Setting:** Key elements mentioned or implied.
        * **Composition/Focus:** Any important details.
        * **Art Style:** Reiterate the specified style.
        * **Mood/Atmosphere:** The emotional tone of the scene.
        * **DO NOT include the actual page text within the image prompt.**

**Output Format:**
Return a JSON object with two properties:
{
  "text": "The story text that will appear on this spread...",
  "imagePrompt": "Detailed visual prompt for image generation..."
}
`;
};

// Add debugging and validation for image URLs
const validateAndLogImageUrl = (imageUrl, spreadIndex) => {
  if (!imageUrl) {
    console.error(`[ImageDebug] No image URL provided for spread ${spreadIndex}`);
    return false;
  }
  
  console.log(`[ImageDebug] Processing image URL for spread ${spreadIndex}: ${imageUrl}`);
  
  // Check if URL is well-formed
  try {
    new URL(imageUrl);
    console.log(`[ImageDebug] URL format is valid for spread ${spreadIndex}`);
    return true;
  } catch (e) {
    console.error(`[ImageDebug] Invalid URL format for spread ${spreadIndex}: ${e.message}`);
    return false;
  }
};

const GenerateBookStep = () => {
  const navigate = useNavigate();
  const wizardState = useBookStore(state => state.wizardState);
  
  // Get data from the correct location in the store
  const { storyData = {} } = wizardState || {};
  const bookDetails = storyData;
  const characters = storyData.bookCharacters || [];
  
  // Generation state management
  const [generationState, setGenerationState] = useState('idle'); // 'idle', 'generatingOutline', 'generatingSpreadContent', 'generatingImages', 'pollingImages', 'displayingPreview', 'error'
  const [progressInfo, setProgressInfo] = useState('');
  const [error, setError] = useState(null);
  
  // Content state
  const [outline, setOutline] = useState([]);
  const [spreadContents, setSpreadContents] = useState([]);
  const [pollingStatus, setPollingStatus] = useState({});
  const [imageUrls, setImageUrls] = useState({});
  
  // Add to make image URLs more robust
  const getImageUrl = (index) => {
    const url = imageUrls[index];
    if (!url) return null;
    
    // Validate URL
    if (!validateAndLogImageUrl(url, index)) return null;
    
    // If the URL doesn't have https protocol, add it
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    // If the URL has no protocol at all, add https
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    
    return url;
  };
  
  // Add detailed logging of all available fields to help debug
  useEffect(() => {
    console.log("[GenerateBookStep] ⭐️ FULL STORE STATE DEBUG:", useBookStore.getState());
    console.log("[GenerateBookStep] ⭐️ Full story data keys:", Object.keys(storyData));
    console.log("[GenerateBookStep] ⭐️ All bookDetails fields:", storyData);
    console.log("[GenerateBookStep] ⭐️ Characters:", characters);
    
    // Add more fine-grained debugging for specific fields
    console.log("[GenerateBookStep] Story type:", bookDetails.storyType);
    console.log("[GenerateBookStep] Target age range:", bookDetails.ageRange || bookDetails.targetAgeRange);
    console.log("[GenerateBookStep] Core theme:", bookDetails.coreTheme || bookDetails.category);
    console.log("[GenerateBookStep] Main challenge plot:", bookDetails.mainChallengePlot || bookDetails.storyStart);
    console.log("[GenerateBookStep] Art style code:", bookDetails.artStyleCode);
  }, []);
  
  // Start the generation process
  useEffect(() => {
    console.log("🚀 GenerateBookStep mounted! This new component is being used!");
    console.log("GenerateBookStep mounted. Book Details:", bookDetails);
    console.log("Characters:", characters);
    
    // Additional debugging for the store structure
    console.log("Raw wizardState:", wizardState);
    console.log("Story Data:", storyData);
    
    // Validate required data
    if (!bookDetails || !characters || characters.length === 0) {
      setError("Missing required book details or characters. Please go back and complete all required steps.");
      setGenerationState('error');
      return;
    }
    
    // Start the book generation process
    generateBook();
  }, []);
  
  const generateBook = async () => {
    try {
      // ---------- STEP 1: Generate story outline ----------
      setGenerationState('generatingOutline');
      setProgressInfo('Creating your book outline...');
      
      const outlinePrompt = createOutlinePrompt(bookDetails, characters);
      console.log("Outline Prompt:", outlinePrompt);
      
      const outlineResponse = await openaiService.generateOutlineFromPrompt(outlinePrompt);
      
      if (!outlineResponse.success) {
        throw new Error(`Failed to generate outline: ${outlineResponse.error || 'Unknown error'}`);
      }
      
      const generatedOutline = outlineResponse.outline;
      console.log("Generated Outline:", generatedOutline);
      setOutline(generatedOutline);
      
      // ---------- STEP 2: Generate spread content (text + image prompts) ----------
      setGenerationState('generatingSpreadContent');
      
      const spreadResults = [];
      
      for (let i = 0; i < generatedOutline.length; i++) {
        setProgressInfo(`Generating page ${i + 1} of ${generatedOutline.length}...`);
        
        const spreadPrompt = createSpreadContentPrompt(
          bookDetails,
          characters,
          generatedOutline,
          i,
          generatedOutline[i]
        );
        
        console.log(`Spread ${i + 1} Prompt:`, spreadPrompt);
        
        const spreadResponse = await openaiService.generateSpreadContentFromPrompt(spreadPrompt);
        
        if (!spreadResponse.success) {
          throw new Error(`Failed to generate spread content ${i + 1}: ${spreadResponse.error || 'Unknown error'}`);
        }
        
        // Extract the text and image prompt
        const { text, imagePrompt } = spreadResponse.content;
        console.log(`Spread ${i + 1} Content:`, { text, imagePrompt });
        
        spreadResults.push({
          spreadIndex: i,
          text,
          imagePrompt
        });
      }
      
      setSpreadContents(spreadResults);
      
      // ---------- STEP 3: Generate images ----------
      setGenerationState('generatingImages');
      setProgressInfo('Creating illustrations for your book...');
      
      const taskIds = {};
      
      for (let i = 0; i < spreadResults.length; i++) {
        const spread = spreadResults[i];
        setProgressInfo(`Generating image ${i + 1} of ${spreadResults.length}...`);
        
        try {
          // Use the art style code from bookDetails - make sure it's properly formatted
          // The artStyleCode may include 'Style-' prefix or not, handle both cases
          let styleCode = bookDetails.artStyleCode || 'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9'; // Default to a style if none selected
          
          // Ensure the style code begins with 'Style-' as expected by the API
          if (styleCode && !styleCode.startsWith('Style-')) {
            styleCode = `Style-${styleCode}`;
          }
          
          console.log(`Creating image task for spread ${i+1} with style code: ${styleCode}`);
          
          // Create a text-to-image task with the updated function signature
          const result = await dzineService.createTxt2ImgTask(
            spread.imagePrompt,  // prompt text
            styleCode,           // style code
            {                    // options
              target_h: 1024,
              target_w: 1024,
              quality_mode: 1,   // high quality
              generate_slots: [1, 1, 0, 0] // Generate 2 images
            }
          );
          
          if (result && result.task_id) {
            console.log(`Created image generation task for spread ${i + 1}, task ID: ${result.task_id}`);
            taskIds[i] = result.task_id;
          } else {
            console.error(`Failed to create image generation task for spread ${i + 1}`);
          }
        } catch (err) {
          console.error(`Error creating image generation task for spread ${i + 1}:`, err);
          // Continue with other images even if one fails
        }
        
        // Short delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // ---------- STEP 4: Poll for image results ----------
      setGenerationState('pollingImages');
      
      const pollInterval = 5000; // Poll every 5 seconds
      const maxAttempts = 60; // Max 5 minutes of polling (60 * 5 seconds)
      
      const pollForResults = async () => {
        // Keep track of which spreads have completed
        const pendingTaskIds = { ...taskIds };
        const newImageUrls = { ...imageUrls };
        let attempts = 0;
        
        // Debug what tasks we're polling for
        console.log(`[PollingDebug] Starting to poll for ${Object.keys(pendingTaskIds).length} tasks:`, pendingTaskIds);
        
        while (Object.keys(pendingTaskIds).length > 0 && attempts < maxAttempts) {
          attempts++;
          setProgressInfo(`Waiting for illustrations to complete (${Object.keys(newImageUrls).length} of ${spreadResults.length} done)...`);
          
          for (const spreadIndex in pendingTaskIds) {
            const taskId = pendingTaskIds[spreadIndex];
            
            try {
              console.log(`[PollingDebug] Polling attempt ${attempts} for task ${taskId} (spread ${spreadIndex})`);
              const result = await dzineService.getTaskProgress(taskId);
              console.log(`[PollingDebug] Poll result for task ${taskId}:`, result);
              
              if (result && result.status === 'SUCCESS' || result?.status === 'succeed') {
                // Image ready - look in multiple possible locations for the image URL
                console.log(`[PollingDebug] ✅ Success! Image for spread ${spreadIndex} ready`);
                
                let imageUrl = null;
                
                // Try to get the image URL from one of the known response patterns
                if (result.image_list && result.image_list.length > 0) {
                  imageUrl = result.image_list[0];
                  console.log(`[PollingDebug] Found image at result.image_list[0]:`, imageUrl);
                } 
                else if (result.data?.image_list && result.data.image_list.length > 0) {
                  imageUrl = result.data.image_list[0];
                  console.log(`[PollingDebug] Found image at result.data.image_list[0]:`, imageUrl);
                }
                else if (result.data?.generate_result_slots && result.data.generate_result_slots.length > 0) {
                  // Try each slot until we find a non-empty one
                  for (let i = 0; i < result.data.generate_result_slots.length; i++) {
                    if (result.data.generate_result_slots[i]) {
                      imageUrl = result.data.generate_result_slots[i];
                      console.log(`[PollingDebug] Found image at result.data.generate_result_slots[${i}]:`, imageUrl);
                      break;
                    }
                  }
                }
                
                if (imageUrl) {
                  newImageUrls[spreadIndex] = imageUrl;
                  setImageUrls({ ...newImageUrls });
                  delete pendingTaskIds[spreadIndex];
                  console.log(`[PollingDebug] Successfully saved image URL for spread ${spreadIndex}:`, imageUrl);
                } else {
                  console.error(`[PollingDebug] ❌ Task status is success but no image URL found for spread ${spreadIndex}:`, result);
                  delete pendingTaskIds[spreadIndex]; // Remove from pending to avoid infinite polling
                }
              } else if (result && (result.status === 'FAILED' || result.status === 'ERROR' || result.status === 'error' || result.status === 'failed')) {
                // Task failed
                console.error(`[PollingDebug] ❌ Image generation for spread ${spreadIndex} failed:`, result);
                delete pendingTaskIds[spreadIndex];
              } else {
                // Still in progress
                console.log(`[PollingDebug] ⏳ Task ${taskId} for spread ${spreadIndex} still in progress`);
              }
              
              // Update status for UI
              setPollingStatus(prev => ({
                ...prev,
                [spreadIndex]: result?.status || 'UNKNOWN'
              }));
            } catch (err) {
              console.error(`[PollingDebug] ❌ Error polling for spread ${spreadIndex}:`, err);
              // Keep trying on error - don't delete from pendingTaskIds as we want to retry
            }
          }
          
          // Wait before next poll if there are still pending tasks
          if (Object.keys(pendingTaskIds).length > 0) {
            console.log(`[PollingDebug] Waiting ${pollInterval/1000}s before next poll. ${Object.keys(pendingTaskIds).length} tasks still pending.`);
            await new Promise(resolve => setTimeout(resolve, pollInterval));
          }
        }
        
        // If we reached max attempts but still have pending tasks
        if (Object.keys(pendingTaskIds).length > 0) {
          console.warn(`[PollingDebug] ⚠️ Some images did not complete within the time limit: ${Object.keys(pendingTaskIds).join(', ')}`);
        }
        
        // Proceed to displaying the preview even if some images failed
        console.log(`[PollingDebug] 🎉 Polling complete. Moving to preview with ${Object.keys(newImageUrls).length} images`);
        setGenerationState('displayingPreview');
      };
      
      // Start polling
      await pollForResults();
      
    } catch (err) {
      console.error("Error generating book:", err);
      setError(err.message || 'An unknown error occurred during generation.');
      setGenerationState('error');
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
  
  // Render Content with Loading State
  const renderContent = () => {
    switch (generationState) {
      case 'idle':
        return <p className="text-lg">Preparing to generate your book...</p>;
        
      case 'generatingOutline':
      case 'generatingSpreadContent':
      case 'generatingImages':
      case 'pollingImages':
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
            <p className="text-lg font-medium">{progressInfo}</p>
            
            {generationState === 'pollingImages' && (
              <div className="w-full max-w-md">
                <p className="text-sm text-gray-500 mb-2">Image generation progress:</p>
                <div className="grid grid-cols-1 gap-2">
                  {spreadContents.map((spread, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-sm">Spread {index + 1}:</span>
                      {imageUrls[index] ? (
                        <span className="text-green-500">✅ Complete</span>
                      ) : (
                        <span className="text-gray-500">
                          {pollingStatus[index] === 'PROCESSING' || pollingStatus[index] === 'processing' ? '⏳ Processing...' : 
                           pollingStatus[index] === 'FAILED' || pollingStatus[index] === 'failed' || pollingStatus[index] === 'ERROR' || pollingStatus[index] === 'error' ? '❌ Failed' : 
                           pollingStatus[index] === 'SUCCESS' || pollingStatus[index] === 'succeed' ? '✅ Complete' : 
                           '⏳ Waiting...'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  Task ID Debug Info: {JSON.stringify(Object.keys(pollingStatus)).substring(0, 60) + "..."}
                </p>
              </div>
            )}
          </div>
        );
        
      case 'displayingPreview':
        return (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-center">Your Generated Book</h2>
            
            {/* Book spreads */}
            <div className="space-y-12">
              {spreadContents.map((spread, index) => (
                <div key={index} className="border rounded-lg overflow-hidden shadow-md">
                  <div className="bg-gray-50 p-3 border-b">
                    <h3 className="font-medium">Spread {index + 1} (Pages {(index + 1) * 2}-{(index + 1) * 2 + 1})</h3>
                  </div>
                  
                  <div className="p-4 md:flex">
                    {/* Image */}
                    <div className="md:w-1/2 p-4">
                      {getImageUrl(index) ? (
                        <div>
                          <img 
                            src={getImageUrl(index)} 
                            alt={`Illustration for spread ${index + 1}`}
                            className="rounded-md shadow-sm mx-auto max-h-64 object-contain"
                            onError={(e) => {
                              console.error(`[ImageDebug] Error loading image for spread ${index + 1}: ${e}`);
                              e.target.onerror = null; // Prevent infinite error loop
                              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' text-anchor='middle' dominant-baseline='middle' fill='%23999'%3EImage loading error%3C/text%3E%3C/svg%3E";
                            }}
                          />
                          <p className="text-xs text-center text-gray-500 mt-2">Click image to enlarge</p>
                        </div>
                      ) : (
                        <div className="bg-gray-200 rounded-md h-48 flex items-center justify-center">
                          <p className="text-gray-500">Image unavailable</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Text */}
                    <div className="md:w-1/2 p-4">
                      <p className="text-lg">{spread.text}</p>
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