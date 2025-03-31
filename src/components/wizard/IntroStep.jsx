import { useState, useEffect } from 'react';
import { useBookStore } from '../../store';

// Rich Theme Categories
const themeCategories = [
  {
    category: 'Social & Emotional Learning',
    description: 'Focuses on developing social skills, emotional awareness, and interpersonal relationships',
    themes: [
      { value: 'friendship', label: 'Friendship' },
      { value: 'empathy_kindness', label: 'Empathy & Kindness' },
      { value: 'managing_emotions', label: 'Managing Emotions' },
      { value: 'cooperation_teamwork', label: 'Cooperation & Teamwork' },
      { value: 'conflict_resolution', label: 'Conflict Resolution' },
      { value: 'resilience_perseverance', label: 'Resilience & Perseverance' },
    ]
  },
  {
    category: 'Identity & Self-Discovery',
    description: 'Focuses on understanding oneself, building confidence, and discovering personal strengths',
    themes: [
      { value: 'individuality_uniqueness', label: 'Individuality & Uniqueness' },
      { value: 'self_esteem_confidence', label: 'Self-Esteem & Confidence' },
      { value: 'finding_your_voice', label: 'Finding Your Voice' },
      { value: 'personal_growth', label: 'Personal Growth' },
      { value: 'cultural_identity', label: 'Cultural Identity & Heritage' },
    ]
  },
  {
    category: 'Family & Relationships',
    description: 'Explores family bonds, different family structures, and navigating relationships',
    themes: [
      { value: 'parent_child_bonds', label: 'Parent/Caregiver-Child Bonds' },
      { value: 'sibling_dynamics', label: 'Sibling Dynamics' },
      { value: 'extended_family', label: 'Extended Family Connections' },
      { value: 'diverse_family_structures', label: 'Diverse Family Structures' },
      { value: 'family_traditions', label: 'Family Traditions & Routines' },
      { value: 'family_change', label: 'Dealing with Family Change' },
    ]
  },
  {
    category: 'Adventure & Exploration',
    description: 'Features journeys, discoveries, and facing challenges in new environments',
    themes: [
      { value: 'call_to_adventure', label: 'The Call to Adventure' },
      { value: 'journeys_quests', label: 'Journeys & Quests' },
      { value: 'overcoming_obstacles', label: 'Overcoming Obstacles' },
      { value: 'discovery', label: 'Discovery & Hidden Treasures' },
      { value: 'problem_solving', label: 'Problem-Solving on the Go' },
      { value: 'exploration', label: 'Exploration of New Environments' },
    ]
  },
  {
    category: 'Fantasy & Magic',
    description: 'Incorporates magical elements, enchanted worlds, and fantastical possibilities',
    themes: [
      { value: 'magical_creatures', label: 'Magical Creatures' },
      { value: 'enchanted_objects', label: 'Enchanted Objects/Places' },
      { value: 'learning_magic', label: 'Learning Magic/Special Abilities' },
      { value: 'power_of_belief', label: 'The Power of Belief/Imagination' },
      { value: 'good_vs_evil', label: 'Good vs. Evil (Simplified)' },
      { value: 'wishes_consequences', label: 'Wishes & Consequences' },
    ]
  },
  {
    category: 'Educational & Informational',
    description: 'Teaches concepts or facts in an engaging narrative format',
    themes: [
      { value: 'basic_concepts', label: 'Basic Concepts (Letters, Numbers, etc.)' },
      { value: 'stem_concepts', label: 'STEM Concepts' },
      { value: 'nature_science', label: 'Nature & Science' },
      { value: 'history_culture', label: 'History & Culture' },
      { value: 'arts', label: 'Arts & Creativity' },
      { value: 'life_skills', label: 'Life Skills & Routines' },
    ]
  },
  {
    category: 'Nature & Environment',
    description: 'Focuses on the natural world and our relationship with it',
    themes: [
      { value: 'natural_beauty', label: 'Appreciation of Natural Beauty' },
      { value: 'animals_plants', label: 'Understanding Animals & Plants' },
      { value: 'conservation', label: 'Conservation & Responsibility' },
      { value: 'ecosystems', label: 'Interconnectedness of Ecosystems' },
      { value: 'outdoor_play', label: 'Outdoor Play & Connection with Nature' },
      { value: 'respect_living_things', label: 'Respect for All Living Things' },
    ]
  },
  {
    category: 'Humor & Playfulness',
    description: 'Emphasizes fun, silliness, and the joy of laughter',
    themes: [
      { value: 'absurdity_nonsense', label: 'Absurdity & Nonsense' },
      { value: 'wordplay', label: 'Wordplay & Puns' },
      { value: 'situational_comedy', label: 'Situational Comedy' },
      { value: 'character_humor', label: 'Character-Driven Humor' },
      { value: 'imagination_play', label: 'Joy of Imagination & Pretend Play' },
      { value: 'lighthearted_mischief', label: 'Lighthearted Mischief' },
    ]
  },
];

function IntroStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  const [selectedThemes, setSelectedThemes] = useState(wizardState.storyData.selectedThemes || []);
  const [customTheme, setCustomTheme] = useState(wizardState.storyData.customTheme || '');
  const [isCustomTheme, setIsCustomTheme] = useState(!!wizardState.storyData.customTheme);
  const [error, setError] = useState('');
  const [expandedCategories, setExpandedCategories] = useState({});
  
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
    
    // Update store with selected themes
    updateStoryData({ 
      selectedThemes: selectedThemes,
      customTheme: isCustomTheme ? customTheme : '',
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
        <p className="text-gray-600 mb-4">Select multiple themes to create a rich, layered story</p>
        
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
                <div>
                  <h4 className="font-medium">{category.category}</h4>
                  <p className="text-sm text-gray-600">{category.description}</p>
                </div>
                <div className="text-gray-500">
                  {expandedCategories[category.category] ? '▼' : '►'}
                </div>
              </div>
              
              {expandedCategories[category.category] && (
                <div className="p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {category.themes.map(theme => (
                      <div key={theme.value} className="flex items-center">
                        <input 
                          type="checkbox" 
                          id={`theme_${theme.value}`}
                          name={`theme_${theme.value}`}
                          value={theme.value}
                          checked={selectedThemes.includes(theme.value)}
                          onChange={handleThemeChange}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`theme_${theme.value}`} className="ml-2 text-sm">
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
        <div className="mt-4 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <input 
              type="checkbox" 
              id="enableCustomTheme" 
              checked={isCustomTheme}
              onChange={(e) => setIsCustomTheme(e.target.checked)}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="enableCustomTheme" className="ml-2 font-medium">
              Add a Custom Theme
            </label>
          </div>
          
          {isCustomTheme && (
            <div>
              <textarea
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-3 h-24 mt-2"
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