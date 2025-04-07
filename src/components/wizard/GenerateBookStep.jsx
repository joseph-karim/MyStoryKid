import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store';
import * as openaiService from '../../services/openaiService';
import * as segmindService from '../../services/segmindService';
import { getKeywordsForDzineStyle } from '../../services/dzineService';

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

const GenerateBookStep = () => {
  const navigate = useNavigate();
  const wizardState = useBookStore(state => state.wizardState);
  
  // Get data from the correct location in the store
  const { storyData = {} } = wizardState || {};
  const bookDetails = storyData;
  const characters = storyData.bookCharacters || [];
  
  // Generation state management
  const [generationState, setGenerationState] = useState('idle'); // 'idle', 'generatingOutline', 'generatingSpreadContent', 'generatingImages', 'displayingPreview', 'error'
  const [progressInfo, setProgressInfo] = useState('');
  const [error, setError] = useState(null);
  
  // Content state
  const [outline, setOutline] = useState([]);
  const [spreadContents, setSpreadContents] = useState([]);
  const [imageUrls, setImageUrls] = useState({}); // Stores Base64 URLs from Segmind
  const [imageStatus, setImageStatus] = useState({}); // Tracks status per image: 'pending', 'loading', 'success', 'error'
  
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
    console.log("🚀 GenerateBookStep mounted! Using Segmind for illustrations.");
    console.log("GenerateBookStep mounted. Book Details:", bookDetails);
    console.log("Characters:", characters);
    console.log("Selected Style Keywords:", bookDetails.selectedStyleKeywords);
    
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
        setImageStatus(prev => ({ ...prev, [i]: 'pending' })); // Initialize image status
      }
      
      setSpreadContents(spreadResults);
      
      // ---------- STEP 3: Generate images ----------
      setGenerationState('generatingImages');
      setProgressInfo('Creating illustrations for your book...');
      
      // --- Prepare Segmind Generation --- 
      const mainCharacter = characters.find(c => c.role === 'main');
      if (!mainCharacter) throw new Error("Main character not found in book details.");
      
      let referenceBase64 = mainCharacter.stylePreview; // Get Dzine preview from character data
      const styleKeywords = bookDetails.selectedStyleKeywords || getKeywordsForDzineStyle(bookDetails.artStyleCode); // Get keywords
      
      console.log("Using Segmind Style Keywords:", styleKeywords);
      // -------- DEBUG LOG --------
      console.log("[Segmind Prep] Raw stylePreview from character:", referenceBase64); 
      console.log("[Segmind Prep] Type of stylePreview:", typeof referenceBase64);
      if (referenceBase64) {
          console.log("[Segmind Prep] stylePreview startsWith 'data:image':", referenceBase64.startsWith('data:image'));
      }
      
      // Validate and potentially convert reference image
      if (!referenceBase64) {
          throw new Error("Missing Dzine stylePreview for the main character. Cannot generate illustrations.");
      }
      
      // --- ADDED CORRECTION STEP ---
      // Try to correct the Base64 format if needed
      const correctedBase64 = ensureImageBase64Format(referenceBase64);
      if (correctedBase64) {
          console.log("[Segmind Prep] Using corrected Base64 format with proper MIME type");
          referenceBase64 = correctedBase64;
      }
      // --- END ADDED CORRECTION STEP ---
      
      // If stylePreview is a URL (less likely now, but good check)
      if (referenceBase64.startsWith('http')) {
          console.log("Converting stylePreview URL to Base64...");
          setProgressInfo('Preparing reference image...');
          try {
              referenceBase64 = await urlToBase64(referenceBase64);
              console.log("Reference image converted successfully.");
          } catch (convError) {
              throw new Error(`Failed to convert reference image URL to Base64: ${convError.message}`);
          }
      } 
      // --- Temporarily removing this check to let segmindService handle it ---
      // else if (!referenceBase64.startsWith('data:image')) {
      //      throw new Error("Invalid stylePreview format. Expected Base64 Data URL.");
      // }
      
      // --- Generate Images Serially (or with controlled concurrency) --- 
      // Simple serial generation to avoid overwhelming API / simplify logic first
      const generatedImageUrls = {};
      for (let i = 0; i < spreadResults.length; i++) {
          const spread = spreadResults[i];
          setProgressInfo(`Generating illustration ${i + 1} of ${spreadResults.length}...`);
          setImageStatus(prev => ({ ...prev, [i]: 'loading' }));
          
          try {
              console.log(`Calling Segmind for spread ${i}. Prompt: ${spread.imagePrompt}`);
              const segmindImageBase64 = await segmindService.generateConsistentCharacter(
                  referenceBase64, 
                  spread.imagePrompt,
                  styleKeywords
              );
              
              // Validate the result is a Base64 string
              if (segmindImageBase64 && segmindImageBase64.startsWith('data:image')) {
                  generatedImageUrls[i] = segmindImageBase64;
                  setImageStatus(prev => ({ ...prev, [i]: 'success' }));
                  console.log(`Successfully generated image for spread ${i}.`);
              } else {
                  throw new Error('Segmind service did not return a valid Base64 image.');
              }

          } catch (error) {
              console.error(`Segmind error for spread ${i}:`, error);
              setImageStatus(prev => ({ ...prev, [i]: 'error' }));
              // Store error state or null? For now, just log and status update
              generatedImageUrls[i] = null; // Indicate failure 
              // Optional: Decide whether to stop or continue on error
              // if (!confirm(`Failed to generate image ${i+1}. Continue anyway?`)) {
              //    throw error; // Stop generation
              // }
          }
          
          // Optional delay between Segmind calls if needed
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
      
      setImageUrls(generatedImageUrls);
      console.log("Segmind image generation complete.", generatedImageUrls);
      
      // ---------- STEP 4: Display Preview ----------
      setGenerationState('displayingPreview');
      setProgressInfo('Book ready for preview!');
      
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
                              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity duration-200 opacity-0 hover:opacity-100">
                                <span className="text-white text-sm bg-black bg-opacity-60 px-2 py-1 rounded">Segmind Image</span>
                              </div>
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
                            </div>
                          );
                        }
                      })()}
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