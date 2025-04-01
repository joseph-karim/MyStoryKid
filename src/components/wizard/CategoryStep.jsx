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

// Scene options for each category
const SCENE_OPTIONS = {
  adventure: [
    { id: 'space', title: 'Space Exploration', description: 'Discover planets, stars, and cosmic wonders', icon: '🌌' },
    { id: 'ocean', title: 'Undersea Adventure', description: 'Explore the depths of the ocean with sea creatures', icon: '🌊' },
    { id: 'jungle', title: 'Jungle Expedition', description: 'Navigate through dense jungles and discover wildlife', icon: '🌴' },
    { id: 'mountains', title: 'Mountain Climb', description: 'Scale towering peaks and overcome challenges', icon: '⛰️' },
    { id: 'safari', title: 'Wildlife Safari', description: 'Encounter amazing animals on a safari adventure', icon: '🦁' },
  ],
  bedtime: [
    { id: 'dreams', title: 'Dreamland', description: 'Journey through magical dreams and sleepy landscapes', icon: '💫' },
    { id: 'stars', title: 'Starry Night', description: 'Adventures under a peaceful night sky', icon: '✨' },
    { id: 'bedroom', title: 'Cozy Bedroom', description: 'Magical happenings in a child\'s bedroom', icon: '🛏️' },
    { id: 'night_forest', title: 'Night Forest', description: 'Gentle adventures in a moonlit forest', icon: '🌲' },
    { id: 'cloud_kingdom', title: 'Cloud Kingdom', description: 'Drift among fluffy clouds in a sky kingdom', icon: '☁️' },
  ],
  learning: [
    { id: 'school', title: 'School Adventure', description: 'Learn ABCs in a magical school setting', icon: '🏫' },
    { id: 'library', title: 'Enchanted Library', description: 'Discover letters in a magical library', icon: '📚' },
    { id: 'alphabet_land', title: 'Alphabet Land', description: 'A world where letters come to life', icon: '🔤' },
    { id: 'zoo_letters', title: 'Zoo of Letters', description: 'Each animal represents a letter to learn', icon: '🦒' },
    { id: 'garden', title: 'Letter Garden', description: 'Letters bloom and grow in a magical garden', icon: '🌷' },
  ],
  birthday: [
    { id: 'party', title: 'Surprise Party', description: 'A magical birthday celebration with friends', icon: '🎈' },
    { id: 'amusement_park', title: 'Amusement Park', description: 'Birthday adventures in a magical park', icon: '🎢' },
    { id: 'treasure_hunt', title: 'Birthday Treasure Hunt', description: 'Find birthday presents through clues', icon: '🗝️' },
    { id: 'bakery', title: 'Magical Bakery', description: 'Adventures in a cake shop making the perfect birthday cake', icon: '🎂' },
    { id: 'parade', title: 'Birthday Parade', description: 'Lead a special birthday celebration through town', icon: '🎪' },
  ],
  fantasy: [
    { id: 'enchanted_forest', title: 'Enchanted Forest', description: 'Magical adventures among talking trees and woodland creatures', icon: '🌳' },
    { id: 'dragon_mountain', title: 'Dragon Mountain', description: 'Discover friendly dragons in their mountain home', icon: '🐉' },
    { id: 'fairy_kingdom', title: 'Fairy Kingdom', description: 'Visit the tiny world of fairies and sprites', icon: '🧚' },
    { id: 'wizard_castle', title: 'Wizard\'s Castle', description: 'Explore a magical castle full of wonders', icon: '🏰' },
    { id: 'crystal_caves', title: 'Crystal Caves', description: 'Journey through glittering caves with magical powers', icon: '💎' },
  ],
  custom: [
    { id: 'custom_scene', title: 'Custom Setting', description: 'Create your own unique story setting', icon: '🖌️' },
  ],
};

function CategoryStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  const [selectedCategory, setSelectedCategory] = useState(wizardState.storyData.category || '');
  const [selectedScene, setSelectedScene] = useState(wizardState.storyData.mainScene || '');
  const [customPrompt, setCustomPrompt] = useState('');
  const [customScene, setCustomScene] = useState('');
  const [error, setError] = useState('');
  
  // Set the selected category and scene from store when component mounts
  useEffect(() => {
    setSelectedCategory(wizardState.storyData.category || '');
    setSelectedScene(wizardState.storyData.mainScene || '');
  }, [wizardState.storyData.category, wizardState.storyData.mainScene]);
  
  // Reset the selected scene when the category changes
  useEffect(() => {
    setSelectedScene('');
  }, [selectedCategory]);
  
  const handleContinue = () => {
    if (!selectedCategory) {
      setError('Please select a story category');
      return;
    }
    
    if (selectedCategory === 'custom' && !customPrompt.trim()) {
      setError('Please provide a description for your custom story');
      return;
    }
    
    if (!selectedScene) {
      setError('Please select a scene for your story');
      return;
    }
    
    if (selectedScene === 'custom_scene' && !customScene.trim()) {
      setError('Please describe your custom scene');
      return;
    }
    
    // Update store with selected category and scene
    updateStoryData({ 
      category: selectedCategory,
      customPrompt: selectedCategory === 'custom' ? customPrompt : '',
      mainScene: selectedScene,
      customSceneDescription: selectedScene === 'custom_scene' ? customScene : '',
    });
    
    // Move to next step
    setWizardStep(2);
  };
  
  // Get the current scene options based on selected category
  const currentSceneOptions = selectedCategory ? SCENE_OPTIONS[selectedCategory] || [] : [];
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Choose a Story Foundation</h2>
        <p className="text-gray-600">Select a category that will guide the theme of your story</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
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
      
      {selectedCategory && (
        <>
          <div className="text-center mt-8 mb-4">
            <h2 className="text-xl font-bold">Choose a Scene Setting</h2>
            <p className="text-gray-600">Select the main setting where your story will take place</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentSceneOptions.map((scene) => (
              <div 
                key={scene.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedScene === scene.id 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 hover:border-green-300'
                }`}
                onClick={() => {
                  setSelectedScene(scene.id);
                  setError('');
                }}
              >
                <div className="flex items-start">
                  <div className="text-3xl mr-3">{scene.icon}</div>
                  <div>
                    <h3 className="font-semibold">{scene.title}</h3>
                    <p className="text-sm text-gray-600">{scene.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      
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
      
      {selectedScene === 'custom_scene' && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe Your Custom Scene
          </label>
          <textarea
            value={customScene}
            onChange={(e) => setCustomScene(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-3 h-32"
            placeholder="E.g., A magical floating island with rainbow bridges connecting different parts, where clouds can be used as trampolines..."
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