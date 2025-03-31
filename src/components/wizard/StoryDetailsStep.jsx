import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { motion } from 'framer-motion';

// Define options for selects
const storyTypeOptions = [
  { value: 'standard', label: 'Standard Picture Book (Ages 3-8)' },
  { value: 'rhyming', label: 'Rhyming Story (Ages 3-6)' },
  { value: 'early_reader', label: 'Early Reader / Simple Chapters (Ages 6-9)' },
  { value: 'lesson', label: 'Lesson/Challenge Focused Story (Flexible Age)' },
  { value: 'board_book', label: 'Board Book (Ages 0-3)' },
];

const ageRangeOptions = [
  { value: '0-3', label: '0-3 Years Old (Board Book Focus)' },
  { value: '3-6', label: '3-6 Years Old (Preschool / Early Picture Book)' },
  { value: '4-8', label: '4-8 Years Old (Standard Picture Book)' },
  { value: '6-9', label: '6-9 Years Old (Early Reader / Simple Chapters)' },
];

const narrativeStyleOptions = [
  { value: 'third_person_limited', label: 'Third-Person (Focus on main character)' },
  { value: 'third_person_omniscient', label: 'Third-Person (All-knowing narrator)' },
  { value: 'first_person', label: 'First-Person (From main character\'s view)' },
];

const toneOptions = [
  { value: 'gentle', label: 'Gentle / Calm' },
  { value: 'adventurous', label: 'Adventurous / Exciting' },
  { value: 'humorous', label: 'Humorous / Funny' },
  { value: 'reassuring', label: 'Reassuring / Comforting' },
  { value: 'playful', label: 'Playful / Lighthearted' },
  { value: 'didactic', label: 'Didactic / Instructive' }, // Use with caution
];

const rhymeSchemeOptions = [
  { value: 'AABB', label: 'AABB (Simple couplets)' },
  { value: 'ABAB', label: 'ABAB (Alternating rhymes)' },
  { value: 'ABCB', label: 'ABCB (Common ballad stanza)' },
  { value: 'Free Verse', label: 'Free Verse (No strict rhyme)' },
];

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

// New dropdown options for Main Challenge / Plot
const mainChallengeOptions = [
  { value: 'new_sibling', label: 'Adjusting to a new sibling' },
  { value: 'new_school', label: 'First day at a new school' },
  { value: 'making_friends', label: 'Making new friends' },
  { value: 'overcoming_fear', label: 'Overcoming a specific fear' },
  { value: 'lost_item', label: 'Finding a lost favorite toy/item' },
  { value: 'learning_skill', label: 'Learning a new skill' },
  { value: 'solving_puzzle', label: 'Solving a puzzle or mystery' },
  { value: 'helping_friend', label: 'Helping a friend in need' },
  { value: 'magical_adventure', label: 'Going on a magical adventure' },
  { value: 'standing_up', label: 'Standing up for what\'s right' },
  { value: 'accepting_change', label: 'Accepting change in life' },
  { value: 'custom', label: '✏️ Custom Challenge (Write Your Own)' },
];

// New dropdown options for Story Ending
const endingOptions = [
  { value: 'happy', label: 'Happy ending with a clear resolution' },
  { value: 'lesson', label: 'Character learns an important lesson' },
  { value: 'surprise', label: 'Surprise twist ending' },
  { value: 'open', label: 'Open-ended (leaves room for imagination)' },
  { value: 'celebration', label: 'Celebration or gathering at the end' },
  { value: 'growth', label: 'Character shows growth or change' },
  { value: 'custom', label: '✏️ Custom Ending (Write Your Own)' },
];

// Length options with estimated print costs
const lengthOptions = [
  { value: 300, label: 'Short (300 words)', printCost: '$14.99', digitalCost: '$7.99' },
  { value: 500, label: 'Medium (500 words)', printCost: '$19.99', digitalCost: '$9.99' },
  { value: 800, label: 'Long (800 words)', printCost: '$24.99', digitalCost: '$12.99' },
  { value: 1200, label: 'Extended (1200 words)', printCost: '$29.99', digitalCost: '$14.99' },
];

function StoryDetailsStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  
  // Initialize formData with default values if not in wizardState
  const [formData, setFormData] = useState({
    ...wizardState.storyData,
    selectedThemes: wizardState.storyData.selectedThemes || [],
    customTheme: wizardState.storyData.customTheme || ''
  });
  
  const [error, setError] = useState('');
  
  // New state variables for custom inputs
  const [isCustomTheme, setIsCustomTheme] = useState(!!formData.customTheme);
  const [isCustomChallenge, setIsCustomChallenge] = useState(formData.mainChallengePlot && !mainChallengeOptions.some(o => o.value === formData.mainChallengePlot));
  const [isCustomEnding, setIsCustomEnding] = useState(formData.desiredEnding && !endingOptions.some(o => o.value === formData.desiredEnding));

  // Update local state if global state changes (e.g., navigating back)
  useEffect(() => {
    setFormData({
      ...wizardState.storyData,
      selectedThemes: wizardState.storyData.selectedThemes || [],
      customTheme: wizardState.storyData.customTheme || ''
    });
    
    // Check if we need to set the custom flags based on data
    setIsCustomTheme(!!wizardState.storyData.customTheme);
    setIsCustomChallenge(wizardState.storyData.mainChallengePlot && !mainChallengeOptions.some(o => o.value === wizardState.storyData.mainChallengePlot));
    setIsCustomEnding(wizardState.storyData.desiredEnding && !endingOptions.some(o => o.value === wizardState.storyData.desiredEnding));
  }, [wizardState.storyData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle theme checkboxes
    if (name.startsWith('theme_')) {
      const themeValue = name.replace('theme_', '');
      
      if (checked) {
        // Add theme to selectedThemes array
        setFormData(prev => ({
          ...prev,
          selectedThemes: [...prev.selectedThemes, themeValue]
        }));
      } else {
        // Remove theme from selectedThemes array
        setFormData(prev => ({
          ...prev,
          selectedThemes: prev.selectedThemes.filter(theme => theme !== themeValue)
        }));
      }
      return;
    }
    
    // Handle custom theme toggle
    if (name === 'enableCustomTheme') {
      setIsCustomTheme(checked);
      if (!checked) {
        // If unchecking custom theme, clear the custom theme value
        setFormData(prev => ({
          ...prev,
          customTheme: ''
        }));
      }
      return;
    }
    
    // Handle custom theme text input
    if (name === 'customTheme') {
      setFormData(prev => ({
        ...prev,
        customTheme: value
      }));
      return;
    }
    
    // Handle regular form inputs
    // Ensure number inputs are stored as numbers
    const newValue = type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value;
    
    // Handle dropdown changes that might affect custom fields
    if (name === 'mainChallengePlot') {
      setIsCustomChallenge(value === 'custom');
    } else if (name === 'desiredEnding') {
      setIsCustomEnding(value === 'custom');
    }
    
    // Update local state only (not global state)
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleBack = () => {
    // Update global state before navigating
    updateStoryData({
      ...formData,
      // Generate a combined coreTheme string for backward compatibility
      coreTheme: formData.selectedThemes.length > 0 
        ? formData.selectedThemes.join(', ') 
        : formData.customTheme || ''
    });
    
    setWizardStep(3); // Go back to CharactersStep
  };

  const handleContinue = () => {
    setError(''); // Clear previous errors
    
    // Basic validation (can be expanded)
    if (formData.selectedThemes.length === 0 && !formData.customTheme && formData.storyType !== 'board_book') {
      setError('Please select at least one theme or enter a custom theme for the story.');
      return;
    }
    
    if (!formData.mainChallengePlot && formData.storyType !== 'board_book') {
      setError('Please select or describe the Main Challenge or Plot for the story.');
      return;
    }
    
    if (formData.storyType === 'board_book' && !formData.coreConcept) {
      setError('Please specify the Core Concept for the board book (e.g., Colors, Animals).');
      return;
    }
    
    if (formData.storyType === 'board_book' && !formData.keyObjectsActions) {
      setError('Please list the Key Objects/Actions for the board book.');
      return;
    }

    // Update global state only when continuing to next step
    updateStoryData({
      ...formData,
      // Generate a combined coreTheme string for backward compatibility
      coreTheme: formData.selectedThemes.length > 0 
        ? formData.selectedThemes.join(', ') 
        : formData.customTheme || ''
    });
    
    setWizardStep(5); // Proceed to SummaryStep
  };

  // Helper component for form fields to reduce repetition
  const FormField = ({ label, name, children, helpText, required }) => (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );

  // Helper to check if a theme is selected
  const isThemeSelected = (themeValue) => {
    return formData.selectedThemes.includes(themeValue);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Story Details</h2>
        <p className="text-gray-600">Help us craft the perfect narrative by providing more details.</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Story Type */}
        <FormField label="Type of Story" name="storyType" required>
          <select
            id="storyType"
            name="storyType"
            value={formData.storyType}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {storyTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FormField>

        {/* Target Age Range */}
        <FormField label="Target Age Range" name="targetAgeRange" required>
           <select
             id="targetAgeRange"
             name="targetAgeRange"
             value={formData.targetAgeRange}
             onChange={handleChange}
             className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
           >
             {ageRangeOptions.map(option => (
               <option key={option.value} value={option.value}>{option.label}</option>
             ))}
           </select>
         </FormField>
      </div>

      {/* Fields for most story types */}
      {formData.storyType !== 'board_book' && (
        <>
          {/* Rich Theme Selection */}
          <FormField 
            label="Story Themes" 
            name="selectedThemes" 
            required 
            helpText="Select one or more themes for your story. Combining themes creates rich, layered narratives."
          >
            <div className="space-y-4 mt-2">
              {themeCategories.map((category, catIndex) => (
                <div key={catIndex} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-lg mb-1">{category.category}</h3>
                  <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                    {category.themes.map((theme) => (
                      <div key={theme.value} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`theme_${theme.value}`}
                          name={`theme_${theme.value}`}
                          checked={isThemeSelected(theme.value)}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={`theme_${theme.value}`} className="ml-2 text-sm text-gray-700">
                          {theme.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* Custom Theme Option */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="enableCustomTheme"
                    name="enableCustomTheme"
                    checked={isCustomTheme}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="enableCustomTheme" className="ml-2 font-medium">
                    Add Custom Theme
                  </label>
                </div>
                
                {isCustomTheme && (
                  <textarea
                    id="customTheme"
                    name="customTheme"
                    value={formData.customTheme}
                    onChange={handleChange}
                    rows="3"
                    className="w-full mt-2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Describe your custom theme or combine elements from multiple themes..."
                  />
                )}
              </div>
              
              {/* Selected Themes Summary */}
              {(formData.selectedThemes.length > 0 || formData.customTheme) && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800">Selected Themes:</h4>
                  <div className="mt-1">
                    {formData.selectedThemes.map(themeValue => {
                      // Find the theme details
                      let themeLabel = '';
                      themeCategories.forEach(category => {
                        const found = category.themes.find(t => t.value === themeValue);
                        if (found) themeLabel = found.label;
                      });
                      
                      return (
                        <span key={themeValue} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                          {themeLabel}
                        </span>
                      );
                    })}
                    
                    {formData.customTheme && (
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded mr-2 mb-1">
                        Custom: {formData.customTheme.substring(0, 30)}{formData.customTheme.length > 30 ? '...' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FormField>

          {/* Main Challenge - Changed to dropdown with custom option */}
          <FormField label="Main Challenge / Plot Summary" name="mainChallengePlot" required helpText="The main problem or sequence of events in the story.">
            <select
              id="mainChallengePlot"
              name="mainChallengePlot"
              value={isCustomChallenge ? 'custom' : formData.mainChallengePlot}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {mainChallengeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            {/* Show textarea input if custom is selected */}
            {isCustomChallenge && (
              <textarea
                id="customMainChallenge"
                name="mainChallengePlot"
                rows="3"
                value={formData.mainChallengePlot}
                onChange={handleChange}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your custom plot or challenge..."
              />
            )}
          </FormField>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <FormField label="Narrative Style" name="narrativeStyle" required>
              <select
                id="narrativeStyle"
                name="narrativeStyle"
                value={formData.narrativeStyle}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {narrativeStyleOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormField>
             
            <FormField label="Tone" name="tone" required>
              <select
                id="tone"
                name="tone"
                value={formData.tone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {toneOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Desired Ending - Changed to dropdown with custom option */}
          <FormField label="Desired Ending" name="desiredEnding" helpText="How should the story conclude?">
            <select
              id="desiredEnding"
              name="desiredEnding"
              value={isCustomEnding ? 'custom' : formData.desiredEnding}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">-- Select an ending type --</option>
              {endingOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            {/* Show textarea input if custom is selected */}
            {isCustomEnding && (
              <textarea
                id="customEnding"
                name="desiredEnding"
                rows="2"
                value={formData.desiredEnding}
                onChange={handleChange}
                className="w-full mt-2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your custom ending..."
              />
            )}
          </FormField>

          {/* Length with Cost Indicators */}
          <FormField 
            label="Approximate Length" 
            name="desiredLengthWords" 
            helpText="Select the desired length for your story. A longer story may affect pricing."
            required
          >
            <div className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
              {lengthOptions.map(option => (
                <div key={option.value} className="flex items-center mb-2 last:mb-0">
                  <input
                    type="radio"
                    id={`length-${option.value}`}
                    name="desiredLengthWords"
                    value={option.value}
                    checked={formData.desiredLengthWords === option.value}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor={`length-${option.value}`} className="flex-grow">
                    {option.label}
                  </label>
                  <div className="text-right text-xs">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-1">
                      Print: {option.printCost}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      Digital: {option.digitalCost}
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Custom length option */}
              <div className="flex items-center mt-2 pt-2 border-t border-gray-200">
                <input
                  type="radio"
                  id="length-custom"
                  name="desiredLengthWordsRadio"
                  checked={!lengthOptions.some(o => o.value === formData.desiredLengthWords)}
                  onChange={() => {
                    // If custom is selected but no value, set a default
                    if (!formData.desiredLengthWords || lengthOptions.some(o => o.value === formData.desiredLengthWords)) {
                      setFormData({...formData, desiredLengthWords: 600});
                    }
                  }}
                  className="mr-2"
                />
                <label htmlFor="length-custom" className="flex-grow">
                  Custom length:
                </label>
                <input
                  type="number"
                  id="desiredLengthWords"
                  name="desiredLengthWords"
                  value={formData.desiredLengthWords}
                  onChange={handleChange}
                  min="50"
                  max="2000"
                  step="50"
                  onClick={() => {
                    // When clicking directly on the number input, ensure custom radio is selected
                    if (lengthOptions.some(o => o.value === formData.desiredLengthWords)) {
                      setFormData({...formData, desiredLengthWords: formData.desiredLengthWords});
                    }
                  }}
                  className="w-24 p-1 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
                <span className="ml-2 text-xs text-gray-500">words</span>
              </div>
            </div>
          </FormField>
           
          {/* Rhyming Specific Field */}
          {formData.storyType === 'rhyming' && (
            <FormField label="Rhyme Scheme" name="rhymeScheme" required>
              <select
                id="rhymeScheme"
                name="rhymeScheme"
                value={formData.rhymeScheme}
                onChange={handleChange}
                className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                {rhymeSchemeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </FormField>
          )}
        </>
      )}

      {/* Board Book Specific Fields */}
      {formData.storyType === 'board_book' && (
        <>
          <FormField label="Core Concept" name="coreConcept" required helpText="What concept is this board book exploring? (e.g., Colors, Animals, Counting)">
            <input
              type="text"
              id="coreConcept"
              name="coreConcept"
              value={formData.coreConcept}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Farm Animals, Colors in Nature, Bedtime Routine"
            />
          </FormField>
          
          <FormField label="Key Objects/Actions" name="keyObjectsActions" required helpText="List the key items or actions to include, separated by commas (these will form the pages)">
            <textarea
              id="keyObjectsActions"
              name="keyObjectsActions"
              rows="3"
              value={formData.keyObjectsActions}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Red apple, Blue sky, Green frog"
            />
          </FormField>
          
          <FormField label="Interactive Element (Optional)" name="interactiveElement" helpText="Any interactive aspect you'd like in the book">
            <input
              type="text"
              id="interactiveElement"
              name="interactiveElement"
              value={formData.interactiveElement}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Questions like 'Can you find the...?', Sound words, Actions"
            />
          </FormField>
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        
        <button
          onClick={handleContinue}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}

export default StoryDetailsStep;