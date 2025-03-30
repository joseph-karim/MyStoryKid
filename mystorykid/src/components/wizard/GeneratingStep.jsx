import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store';

// This component simulates the AI generation process
// In a real implementation, it would make API calls to OpenAI for text and images
function GeneratingStep() {
  const { wizardState, updateStoryData, setCurrentBook } = useBookStore();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('Preparing your story...');
  const navigate = useNavigate();
  
  useEffect(() => {
    // In a real implementation, this would be replaced with actual API calls
    // to generate text and images based on the wizard data
    
    const simulateGeneration = async () => {
      // Step 1: Generate story text
      setStatus('Creating the story text...');
      await simulateProgress(0, 30);
      
      // Step 2: Generate character descriptions
      setStatus('Developing characters...');
      await simulateProgress(30, 50);
      
      // Step 3: Generate images
      setStatus('Creating illustrations...');
      await simulateProgress(50, 90);
      
      // Step 4: Finalize book
      setStatus('Finalizing your book...');
      await simulateProgress(90, 100);
      
      // Create a mock book object
      const mockBook = createMockBook(wizardState.storyData);
      
      // Update the store with the new book
      setCurrentBook(mockBook);
      
      // Navigate to the book editor
      navigate(`/edit/${mockBook.id}`);
    };
    
    simulateGeneration();
  }, [wizardState.storyData, setCurrentBook, navigate, updateStoryData]);
  
  // Helper function to simulate progress over time
  const simulateProgress = (from, to) => {
    return new Promise((resolve) => {
      const duration = (to - from) * 50; // milliseconds per percentage point
      const startTime = Date.now();
      
      const interval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        const newProgress = from + (elapsedTime / duration) * (to - from);
        
        if (newProgress >= to) {
          setProgress(to);
          clearInterval(interval);
          resolve();
        } else {
          setProgress(newProgress);
        }
      }, 50);
    });
  };
  
  // Helper function to create a mock book based on user inputs
  const createMockBook = (storyData) => {
    const { category, childName, childAge, childGender, childTraits, childInterests, artStyle } = storyData;
    
    const childPronouns = {
      boy: { subject: 'he', object: 'him', possessive: 'his' },
      girl: { subject: 'she', object: 'her', possessive: 'her' },
      neutral: { subject: 'they', object: 'them', possessive: 'their' },
    }[childGender];
    
    // Generate a title based on the selected category and child's name
    let title;
    switch (category) {
      case 'adventure':
        title = `${childName}'s Epic Adventure`;
        break;
      case 'bedtime':
        title = `${childName}'s Dreamy Night`;
        break;
      case 'learning':
        title = `${childName} Learns the ABCs`;
        break;
      case 'birthday':
        title = `${childName}'s Birthday Surprise`;
        break;
      case 'fantasy':
        title = `${childName} and the Magical Quest`;
        break;
      case 'custom':
        title = `${childName}'s Special Story`;
        break;
      default:
        title = `${childName}'s Storybook`;
    }
    
    // Create mock pages based on the selected category
    // In a real app, these would be generated by AI
    const pages = [];
    
    // Cover page
    pages.push({
      id: 'page-cover',
      type: 'cover',
      text: title,
      imagePrompt: `A ${artStyle} style illustration for a children's book cover showing a child named ${childName} who is ${childTraits.join(', ')} and likes ${childInterests.join(', ')}`,
      imageUrl: 'https://via.placeholder.com/600x800?text=Cover+Image',
    });
    
    // Title page
    pages.push({
      id: 'page-title',
      type: 'title',
      text: `${title}\n\nA story about ${childName}`,
      imagePrompt: '',
      imageUrl: '',
    });
    
    // Content pages - just placeholders, would be AI-generated in production
    for (let i = 1; i <= 8; i++) {
      pages.push({
        id: `page-${i}`,
        type: 'content',
        text: `This is page ${i} of ${childName}'s story. In a real application, this text would be generated by AI based on the child's name, age, traits, interests, and the selected story category.`,
        imagePrompt: `A ${artStyle} style illustration for page ${i} of a children's book about ${childName}, who is ${childAge} years old and likes ${childInterests[0] || 'adventures'}`,
        imageUrl: `https://via.placeholder.com/600x400?text=Page+${i}+Illustration`,
      });
    }
    
    // Back cover
    pages.push({
      id: 'page-back',
      type: 'back-cover',
      text: `The End\n\nCreated with love for ${childName}`,
      imagePrompt: '',
      imageUrl: '',
    });
    
    // Return the mock book object
    return {
      id: `book-${Date.now()}`,
      title,
      pages,
      status: 'draft',
      childName,
      childAge,
      childGender,
      childPronouns,
      childTraits,
      childInterests,
      category,
      artStyle,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };
  
  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold">Creating Your Storybook</h2>
        <p className="text-gray-600 mt-2">
          Our AI is working its magic based on your inputs
        </p>
      </div>
      
      <div className="max-w-md mx-auto">
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700">{status}</span>
            <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
            <div 
              className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
        
        <div className="text-center text-sm text-gray-500 italic mt-4">
          <p>This could take a minute or two. We're carefully crafting a unique story just for {wizardState.storyData.childName}.</p>
        </div>
      </div>
    </div>
  );
}

export default GeneratingStep; 