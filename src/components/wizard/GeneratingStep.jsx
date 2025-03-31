import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../../store';

// This component simulates the AI generation process
// In a real implementation, it would make API calls to OpenAI for text and images
function GeneratingStep() {
  const { wizardState, addBook } = useBookStore();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('initializing');
  const navigate = useNavigate();
  
  // Simulate generating the book
  useEffect(() => {
    const steps = [
      { status: 'initializing', message: 'Setting up your story...', time: 1000 },
      { status: 'creating-characters', message: 'Creating characters...', time: 3000 },
      { status: 'building-plot', message: 'Developing the plot...', time: 3000 },
      { status: 'drawing-illustrations', message: 'Drawing illustrations...', time: 3000 },
      { status: 'finalizing', message: 'Finalizing your book...', time: 1000 },
    ];

    let currentStep = 0;
    const totalSteps = steps.length;

    const interval = setInterval(() => {
      if (currentStep < totalSteps) {
        setStatus(steps[currentStep].status);
        setProgress(Math.floor((currentStep / (totalSteps - 1)) * 100));
        currentStep++;
      } else {
        clearInterval(interval);
        handleBookCreated();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleBookCreated = () => {
    // Get main character name
    const mainCharacter = wizardState.storyData.bookCharacters.find(
      character => character.role === 'main'
    );
    
    const childName = mainCharacter ? mainCharacter.name : 'Child';
    
    // Create a new book
    const newBook = {
      id: `book-${Date.now()}`,
      title: generateTitle(wizardState.storyData.category, childName),
      status: 'draft',
      childName,
      artStyleCode: wizardState.storyData.artStyleCode,
      customStyleDescription: wizardState.storyData.customStyleDescription,
      characters: wizardState.storyData.bookCharacters,
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
    
    // Navigate to edit page
    navigate(`/edit/${newBook.id}`);
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

  return (
    <div className="text-center space-y-6 py-8">
      <h2 className="text-2xl font-bold">Creating Your Story</h2>
      
      <div className="max-w-md mx-auto">
        <div className="mb-2 flex justify-between text-sm">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="my-8">
        {status === 'initializing' && (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg">Setting up your story...</span>
          </div>
        )}
        
        {status === 'creating-characters' && (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg">Creating characters based on your selections...</span>
          </div>
        )}
        
        {status === 'building-plot' && (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg">Crafting a unique storyline for your book...</span>
          </div>
        )}
        
        {status === 'drawing-illustrations' && (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg">Creating illustrations in {getDisplayStyleName()} style...</span>
          </div>
        )}
        
        {status === 'finalizing' && (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-10 w-10 text-blue-500 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg">Finalizing your book...</span>
          </div>
        )}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
        <p className="text-blue-700">
          We're creating your personalized book. This may take a minute or two...
        </p>
      </div>
    </div>
  );
}

export default GeneratingStep; 