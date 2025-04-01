import { useState, useEffect } from 'react';
import { useBookStore } from '../../store';

// Simplified Core Themes for Children's Stories
const themeCategories = [
  {
    category: 'Friendship & Getting Along',
    icon: '👪',
    description: 'Stories about relationships with others and social skills',
    themes: [
      { value: 'making_keeping_friends', label: 'Making & Keeping Friends' },
      { value: 'understanding_others_feelings', label: 'Understanding Others\' Feelings' },
      { value: 'working_together', label: 'Working Together' },
    ]
  },
  {
    category: 'Feelings & Emotions',
    icon: '😊',
    description: 'Stories about understanding and managing different emotions',
    themes: [
      { value: 'understanding_your_feelings', label: 'Understanding Your Own Feelings' },
      { value: 'coping_with_big_emotions', label: 'Coping with Big Emotions' },
      { value: 'finding_joy', label: 'Finding Joy & Expressing Happiness' },
    ]
  },
  {
    category: 'Family & Belonging',
    icon: '🏠',
    description: 'Stories about home, family bonds, and feeling secure',
    themes: [
      { value: 'family_love', label: 'Family Love & Support' },
      { value: 'feeling_you_belong', label: 'Feeling Like You Belong' },
      { value: 'family_routines', label: 'Family Routines & Change' },
    ]
  },
  {
    category: 'Growing Up & Being Yourself',
    icon: '🌱',
    description: 'Stories about developing skills, confidence, and responsibility',
    themes: [
      { value: 'learning_new_skills', label: 'Learning & Trying New Skills' },
      { value: 'being_unique', label: 'Being Unique & Confident' },
      { value: 'making_choices', label: 'Making Choices & Responsibility' },
    ]
  },
  {
    category: 'Adventure & Curiosity',
    icon: '🔍',
    description: 'Stories about exploring, discovering, and learning about the world',
    themes: [
      { value: 'exploring_world', label: 'Exploring the World' },
      { value: 'being_brave', label: 'Being Brave & Facing Challenges' },
      { value: 'asking_questions', label: 'Asking Questions & Learning' },
    ]
  },
  {
    category: 'Imagination & Wonder',
    icon: '✨',
    description: 'Stories about creativity, magic, and seeing the extraordinary',
    themes: [
      { value: 'pretend_play', label: 'Pretend Play' },
      { value: 'magic_fantasy', label: 'Magic & Fantasy' },
      { value: 'finding_wonder', label: 'Finding Wonder' },
    ]
  },
];

function IntroStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  const [selectedThemes, setSelectedThemes] = useState(wizardState.storyData.selectedThemes || []);
  const [customTheme, setCustomTheme] = useState(wizardState.storyData.customTheme || '');
  const [isCustomTheme, setIsCustomTheme] = useState(!!wizardState.storyData.customTheme);
  const [error, setError] = useState('');
  // Initialize with all categories expanded for better visibility
  const [expandedCategories, setExpandedCategories] = useState(
    themeCategories.reduce((acc, category) => ({
      ...acc,
      [category.category]: true
    }), {})
  );
  
  // Set the selected themes from store when component mounts
  useEffect(() => {
    setSelectedThemes(wizardState.storyData.selectedThemes || []);
    setCustomTheme(wizardState.storyData.customTheme || '');
    setIsCustomTheme(!!wizardState.storyData.customTheme);
  }, [wizardState.storyData]);
  
  const handleThemeChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      // Add theme to selectedThemes array
      setSelectedThemes(prev => [...prev, value]);
    } else {
      // Remove theme from selectedThemes array
      setSelectedThemes(prev => prev.filter(theme => theme !== value));
    }
    setError('');
  };
  
  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };
  
  const handleContinue = () => {
    if (selectedThemes.length === 0 && !customTheme) {
      setError('Please select at least one theme or add a custom theme');
      return;
    }
    
    if (isCustomTheme && !customTheme.trim()) {
      setError('Please provide a description for your custom theme');
      return;
    }
    
    // Get existing data we want to preserve
    const { mainScene, customSceneDescription } = wizardState.storyData;
    
    // Update store with selected themes while preserving scene data
    updateStoryData({ 
      selectedThemes: selectedThemes,
      customTheme: isCustomTheme ? customTheme : '',
      // Preserve existing scene data if any
      mainScene,
      customSceneDescription,
      // Keep category for backward compatibility, using the first selected theme as primary
      category: selectedThemes.length > 0 ? selectedThemes[0] : 'custom'
    });
    
    // Move to next step (Art Style step)
    setWizardStep(2);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Welcome to MyStoryKid</h2>
        <p className="text-gray-600 mt-2">Create a personalized storybook featuring your characters in just a few steps</p>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800 text-lg mb-2">How it works:</h3>
        <ol className="list-decimal pl-5 space-y-2 text-blue-700">
          <li>Choose story themes below</li>
          <li>Select an art style for your story</li>
          <li>Add characters (upload photos for custom characters)</li>
          <li>Add story details like title and plot elements</li>
          <li>Review and generate your personalized book</li>
        </ol>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-4">Choose Story Themes</h3>
        <p className="text-gray-600 mb-4">Select themes that will guide your child's story. You can choose more than one!</p>
        
        {/* Selected themes display */}
        {selectedThemes.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Selected Themes:</p>
            <div className="flex flex-wrap gap-2">
              {selectedThemes.map(theme => {
                // Find the theme details to display the proper label
                let themeLabel = theme;
                themeCategories.forEach(category => {
                  const foundTheme = category.themes.find(t => t.value === theme);
                  if (foundTheme) themeLabel = foundTheme.label;
                });
                
                return (
                  <span key={theme} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center">
                    {themeLabel}
                    <button 
                      onClick={() => setSelectedThemes(prev => prev.filter(t => t !== theme))}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Theme categories */}
        <div className="space-y-4">
          {themeCategories.map((category, index) => (
            <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="bg-gray-50 p-3 cursor-pointer flex justify-between items-center"
                onClick={() => toggleCategory(category.category)}
              >
                <div className="flex items-center">
                  <span className="text-2xl mr-3" role="img" aria-label={category.category}>{category.icon}</span>
                  <div>
                    <h4 className="font-medium">{category.category}</h4>
                    <p className="text-sm text-gray-600">{category.description}</p>
                  </div>
                </div>
                <div className="text-gray-500">
                  {expandedCategories[category.category] ? '▼' : '►'}
                </div>
              </div>
              
              {expandedCategories[category.category] && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 gap-3">
                    {category.themes.map(theme => (
                      <div key={theme.value} className={`flex items-center p-2 rounded-md ${selectedThemes.includes(theme.value) ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}>
                        <input 
                          type="checkbox" 
                          id={`theme_${theme.value}`}
                          name={`theme_${theme.value}`}
                          value={theme.value}
                          checked={selectedThemes.includes(theme.value)}
                          onChange={handleThemeChange}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`theme_${theme.value}`} className="ml-2 text-sm font-medium flex-1 cursor-pointer">
                          {theme.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Custom theme option */}
        <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
          <div 
            className="bg-gray-50 p-3 cursor-pointer flex justify-between items-center"
            onClick={() => setIsCustomTheme(!isCustomTheme)}
          >
            <div className="flex items-center">
              <span className="text-2xl mr-3" role="img" aria-label="Custom Theme">📝</span>
              <div>
                <h4 className="font-medium">Custom Theme</h4>
                <p className="text-sm text-gray-600">Create your own unique theme or combine elements</p>
              </div>
            </div>
            <div className="text-gray-500">
              {isCustomTheme ? '▼' : '►'}
            </div>
          </div>
          
          {isCustomTheme && (
            <div className="p-4 bg-white">
              <textarea
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 h-24"
                placeholder="Describe your own unique theme or specific elements you'd like to include in your story..."
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-between pt-4 mt-6 border-t border-gray-200">
        <button
          onClick={() => selectedThemes.length > 0 ? setSelectedThemes([]) : null}
          className="text-gray-600 px-4 py-2 rounded hover:bg-gray-100"
          disabled={selectedThemes.length === 0}
        >
          Clear Selections
        </button>
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Continue to Art Style
        </button>
      </div>
    </div>
  );
}

export default IntroStep; 