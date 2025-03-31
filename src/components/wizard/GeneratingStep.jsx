import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store';
import { createImg2ImgTask, getTaskProgress } from '../../services/dzineService.js';

// Function to check if a string is a Base64 data URL
const isBase64DataUrl = (str) => {
  if (typeof str !== 'string') return false;
  return /^data:image\/(png|jpeg|jpg|webp);base64,/.test(str);
};

// This component simulates the AI generation process
// In a real implementation, it would make API calls to OpenAI for text and images
function GeneratingStep() {
  const { wizardState, addBook, updateBook, setCurrentBook } = useBookStore();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('initializing');
  const navigate = useNavigate();
  
  // State for actual API progress
  const [characterTasks, setCharacterTasks] = useState({});
  const [overallStatus, setOverallStatus] = useState('initializing');
  const [errorMessage, setErrorMessage] = useState(null);
  const pollIntervalRef = useRef(null);

  // Simulate generating the book
  useEffect(() => {
    const startGeneration = async () => {
      setOverallStatus('creating_tasks');
      setErrorMessage(null);
      const tasks = {};
      let taskCreationError = false;

      for (const character of wizardState.storyData.bookCharacters) {
        // Only generate if a photo was uploaded (assuming photoUrl holds base64)
        if (character.photoUrl && isBase64DataUrl(character.photoUrl)) {
          try {
            // Construct prompt 
            let prompt = `${character.age || 'a'} year old ${character.gender || 'child'} named ${character.name}`;
            if (wizardState.storyData.customStyleDescription) {
              prompt += `, ${wizardState.storyData.customStyleDescription}`;
            }

            const payload = {
              prompt: prompt.substring(0, 800), // Max 800 chars
              style_code: wizardState.storyData.artStyleCode, // This is the API style code
              style_intensity: 0.9, // Default, can be adjusted
              structure_match: 0.7, // Default, can be adjusted
              face_match: 1, // Enable face matching
              color_match: 0, // Optional: Enable if color preservation is desired
              quality_mode: 0, // 0=standard, 1=high
              generate_slots: [1, 0, 0, 0], // Only need one result per character
              images: [
                { base64_data: character.photoUrl } // Send the base64 image
              ],
              output_format: 'webp' // Or jpeg
            };

            const taskData = await createImg2ImgTask(payload);
            tasks[character.id] = { taskId: taskData.task_id, status: 'waiting', imageUrl: null };
          } catch (error) {
            console.error(`Error creating task for character ${character.id}:`, error);
            tasks[character.id] = { taskId: null, status: 'failed', imageUrl: null, error: error.message };
            taskCreationError = true;
            setErrorMessage(`Failed to start generation for ${character.name}. ${error.message}`);
            // Optionally break or continue based on desired behavior
            // break; 
          }
        } else {
          // If no photo, mark as skipped or handle differently
          tasks[character.id] = { taskId: null, status: 'skipped', imageUrl: null };
        }
      }

      setCharacterTasks(tasks);
      if (!taskCreationError && Object.keys(tasks).some(id => tasks[id].taskId)) {
        setOverallStatus('polling'); // Start polling if at least one task was created
      } else if (taskCreationError) {
        setOverallStatus('error');
      } else {
        // No tasks needed generation, proceed directly
        setOverallStatus('generating_story');
      }
    };

    startGeneration();

    // Cleanup interval on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };

  }, []);

  // --- 2. Poll Task Progress --- 
  useEffect(() => {
    if (overallStatus !== 'polling') {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    const pollTasks = async () => {
      let allDone = true;
      let pollError = false;
      const updatedTasks = { ...characterTasks };

      for (const charId in updatedTasks) {
        const task = updatedTasks[charId];
        if (task.taskId && task.status !== 'succeeded' && task.status !== 'failed') {
          allDone = false;
          try {
            const progressData = await getTaskProgress(task.taskId);
            updatedTasks[charId].status = progressData.status;
            if (progressData.status === 'succeeded') {
              // Find the first non-empty URL in results
              const imageUrl = progressData.generate_result_slots?.find(url => url);
              updatedTasks[charId].imageUrl = imageUrl || null; // Store the first valid image URL
            } else if (progressData.status === 'failed') {
              console.error(`Task ${task.taskId} failed:`, progressData.error_reason);
              updatedTasks[charId].error = progressData.error_reason || 'Generation failed';
              setErrorMessage(prev => prev || `Image generation failed for one or more characters.`);
              pollError = true; // Consider a task failure as a polling error for status update
            }
          } catch (error) {
            console.error(`Error polling task ${task.taskId}:`, error);
            updatedTasks[charId].status = 'failed'; // Mark as failed on polling error
            updatedTasks[charId].error = error.message || 'Polling failed';
            setErrorMessage(prev => prev || `Error checking generation progress.`);
            allDone = true; // Stop polling if there's an error fetching status
            pollError = true;
            break; // Exit loop on error
          }
        }
      }

      setCharacterTasks(updatedTasks);

      if (allDone) {
        setOverallStatus(pollError ? 'error' : 'generating_story');
      }
    };

    // Start polling immediately and then set interval
    pollTasks(); 
    pollIntervalRef.current = setInterval(pollTasks, 5000); // Poll every 5 seconds

    // Cleanup function for this effect
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };

  }, [overallStatus, characterTasks]);

  // --- 3. Finalize Book Creation --- 
  useEffect(() => {
    if (overallStatus === 'generating_story') {
      // Update characters in wizard state with generated images before creating book
      const updatedBookCharacters = wizardState.storyData.bookCharacters.map(char => {
        const taskResult = characterTasks[char.id];
        if (taskResult?.status === 'succeeded' && taskResult.imageUrl) {
          return { ...char, stylePreview: taskResult.imageUrl }; // Update stylePreview
        } 
        return char; // Keep original if no task or failed
      });
      
      // Create the book data (potentially with updated character previews)
      handleBookCreated(updatedBookCharacters);
    }
  }, [overallStatus, characterTasks]);

  // Modified to accept updated characters
  const handleBookCreated = (finalCharacters) => {
    setOverallStatus('finalizing');
    const mainCharacter = finalCharacters.find(
      character => character.role === 'main'
    );
    const childName = mainCharacter ? mainCharacter.name : 'Child';

    const newBook = {
      id: `book-${Date.now()}`,
      title: generateTitle(wizardState.storyData.category, childName),
      status: 'draft',
      childName,
      artStyleCode: wizardState.storyData.artStyleCode,
      customStyleDescription: wizardState.storyData.customStyleDescription,
      characters: finalCharacters, // Use the characters with potentially updated previews
      category: wizardState.storyData.category,
      pages: [
        {
          id: 'page-cover',
          type: 'cover',
          text: generateTitle(wizardState.storyData.category, childName),
          imageUrl: 'https://via.placeholder.com/600x800?text=Generated+Cover',
        },
        {
          id: 'page-title',
          type: 'title',
          text: `${generateTitle(wizardState.storyData.category, childName)}\n\nA story about ${childName}`,
          imageUrl: '',
        },
        {
          id: 'page-1',
          type: 'content',
          text: generateFirstPageText(wizardState.storyData.category, childName),
          imageUrl: 'https://via.placeholder.com/600x400?text=Page+1+Illustration',
        },
        {
          id: 'page-2',
          type: 'content',
          text: 'The adventure continues...',
          imageUrl: 'https://via.placeholder.com/600x400?text=Page+2+Illustration',
        },
        {
          id: 'page-back',
          type: 'back-cover',
          text: 'The End\n\nCreated with love for ' + childName,
          imageUrl: '',
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add the book to the store
    addBook(newBook);
    setCurrentBook(newBook); // Set as current book for immediate editing
    setOverallStatus('completed');

    // Short delay before navigating to allow state update
    setTimeout(() => {
      navigate(`/edit/${newBook.id}`);
    }, 500);
  };
  
  // Helper to generate a title based on category and child name
  const generateTitle = (category, name) => {
    switch (category) {
      case 'adventure':
        return `${name}'s Big Adventure`;
      case 'bedtime':
        return `${name}'s Sleepy Time Journey`;
      case 'learning':
        return `${name} Learns the ABCs`;
      case 'birthday':
        return `${name}'s Birthday Surprise`;
      case 'fantasy':
        return `${name} and the Magic Forest`;
      case 'custom':
        return `${name}'s Special Story`;
      default:
        return `${name}'s Storybook`;
    }
  };
  
  // Helper to generate first page text
  const generateFirstPageText = (category, name) => {
    switch (category) {
      case 'adventure':
        return `${name} was always looking for adventure. Today was going to be the start of something amazing.`;
      case 'bedtime':
        return `As the stars began to twinkle in the night sky, ${name} snuggled into bed, ready for a magical journey through dreamland.`;
      case 'learning':
        return `${name} loved learning new things. Today, ${name} was excited to explore the wonderful world of letters.`;
      case 'birthday':
        return `It was ${name}'s birthday! The sun seemed to shine extra bright on this special day.`;
      case 'fantasy':
        return `${name} discovered a hidden path behind the old oak tree. It sparkled with tiny lights that danced in the air.`;
      default:
        return `Once upon a time, there was a child named ${name} who was about to begin an amazing journey.`;
    }
  };

  // Determine the display style name
  const getDisplayStyleName = () => {
    if (wizardState.storyData.artStyle === 'custom') {
      return wizardState.storyData.customStyleDescription.substring(0, 30) + '...'; // Show snippet of custom style
    }
    // Find the selected style title from the categories (requires access or passing the categories data)
    // For now, just use the ID capitalized
    return wizardState.storyData.artStyle.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const calculateProgress = () => {
    const taskIds = Object.values(characterTasks).filter(t => t.taskId).map(t => t.taskId);
    if (taskIds.length === 0) {
      if (overallStatus === 'generating_story' || overallStatus === 'finalizing' || overallStatus === 'completed') return 100;
      return 0; // No tasks to track
    }

    const completedTasks = Object.values(characterTasks).filter(
      t => t.taskId && (t.status === 'succeeded')
    ).length;
    const failedTasks = Object.values(characterTasks).filter(
      t => t.taskId && t.status === 'failed').length;

    // Give some progress even for failed tasks to avoid getting stuck at < 100%
    const consideredDone = completedTasks + failedTasks; 
    const baseProgress = (consideredDone / taskIds.length) * 90; // Cap image generation at 90%

    if (overallStatus === 'finalizing') return 95;
    if (overallStatus === 'completed') return 100;
    
    return Math.min(Math.floor(baseProgress), 90); // Ensure it doesn't exceed 90 until finalizing
  };

  const getStatusMessage = () => {
    switch (overallStatus) {
      case 'initializing': return 'Preparing generation...';
      case 'creating_tasks': return 'Initiating image generation tasks...';
      case 'polling': 
        const processing = Object.values(characterTasks).filter(t => t.status === 'processing').length;
        const waiting = Object.values(characterTasks).filter(t => ['waiting', 'in_queue'].includes(t.status)).length;
        return `Generating images (${processing} processing, ${waiting} waiting)...`;
      case 'generating_story': return 'Assembling story pages...';
      case 'finalizing': return 'Finalizing your book...';
      case 'completed': return 'Your book is ready!';
      case 'error': return errorMessage || 'An error occurred during generation.';
      default: return 'Working...';
    }
  };

  const calculatedProgress = calculateProgress();

  return (
    <div className="text-center space-y-6 py-8">
      <h2 className="text-2xl font-bold">Creating Your Story</h2>
      
      <div className="max-w-md mx-auto">
        <div className="mb-2 flex justify-between text-sm">
          <span>Progress</span>
          <span>{calculatedProgress}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${overallStatus === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-purple-600'}`}
            style={{ width: `${calculatedProgress}%` }}
          />
        </div>
      </div>
      
      <div className="my-8 min-h-[40px] flex items-center justify-center">
        {overallStatus !== 'completed' && overallStatus !== 'error' && (
          <svg className="animate-spin h-8 w-8 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {overallStatus === 'error' && (
          <svg className="h-8 w-8 text-red-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
         {overallStatus === 'completed' && (
          <svg className="h-8 w-8 text-green-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
           </svg>
         )}
        <span className={`text-lg ${overallStatus === 'error' ? 'text-red-600' : 'text-gray-700'}`}>{getStatusMessage()}</span>
      </div>
      
      {overallStatus !== 'error' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-blue-700">
            We're creating your personalized book with AI. This might take a few minutes...
          </p>
        </div>
      )}
    </div>
  );
}

export default GeneratingStep; 