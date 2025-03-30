import { useState, useEffect } from 'react';
import { useBookStore } from '../../store';

// Story category options
const CATEGORIES = [
  {
    id: 'adventure',
    title: 'Adventure',
    description: 'Exciting journeys to new places and thrilling challenges',
    icon: '🚀',
  },
  {
    id: 'bedtime',
    title: 'Bedtime Story',
    description: 'Soothing tales perfect for winding down before sleep',
    icon: '🌙',
  },
  {
    id: 'learning',
    title: 'Learning ABCs',
    description: 'Educational stories that help teach the alphabet',
    icon: '📚',
  },
  {
    id: 'birthday',
    title: 'Birthday Surprise',
    description: 'Special stories to celebrate a birthday',
    icon: '🎂',
  },
  {
    id: 'fantasy',
    title: 'Fantasy Quest',
    description: 'Magical adventures in enchanted worlds',
    icon: '🧙‍♂️',
  },
  {
    id: 'custom',
    title: 'Custom Story',
    description: 'Create your own unique story concept',
    icon: '✏️',
  },
];

function CategoryStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  const [selectedCategory, setSelectedCategory] = useState(wizardState.storyData.category || '');
  const [customPrompt, setCustomPrompt] = useState('');
  const [error, setError] = useState('');
  
  // Set the selected category from store when component mounts
  useEffect(() => {
    setSelectedCategory(wizardState.storyData.category || '');
  }, [wizardState.storyData.category]);
  
  const handleContinue = () => {
    if (!selectedCategory) {
      setError('Please select a story category');
      return;
    }
    
    if (selectedCategory === 'custom' && !customPrompt.trim()) {
      setError('Please provide a description for your custom story');
      return;
    }
    
    // Update store with selected category
    updateStoryData({ 
      category: selectedCategory,
      customPrompt: selectedCategory === 'custom' ? customPrompt : '',
    });
    
    // Move to next step
    setWizardStep(2);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Choose a Story Foundation</h2>
        <p className="text-gray-600">Select a category that will guide the theme of your story</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CATEGORIES.map((category) => (
          <div 
            key={category.id}
            className={`border rounded-lg p-4 cursor-pointer transition-colors ${
              selectedCategory === category.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => {
              setSelectedCategory(category.id);
              setError('');
            }}
          >
            <div className="flex items-start">
              <div className="text-3xl mr-3">{category.icon}</div>
              <div>
                <h3 className="font-semibold">{category.title}</h3>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedCategory === 'custom' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe Your Story Concept
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 h-32"
            placeholder="E.g., A story about a child who discovers they can talk to plants and uses this ability to help create a community garden..."
          />
        </div>
      )}
      
      <div className="flex justify-end pt-4">
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default CategoryStep; 