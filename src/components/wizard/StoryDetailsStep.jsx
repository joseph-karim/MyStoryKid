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
    title: wizardState.storyData.title || '',
    storyType: wizardState.storyData.storyType || 'standard',
    ageRange: wizardState.storyData.ageRange || '4-8',
    narrativeStyle: wizardState.storyData.narrativeStyle || 'third_person_limited',
    toneStyle: wizardState.storyData.toneStyle || 'playful',
    mainChallengePlot: wizardState.storyData.mainChallengePlot || '',
    customMainChallenge: wizardState.storyData.customMainChallenge || '',
    desiredEnding: wizardState.storyData.desiredEnding || '',
    customEnding: wizardState.storyData.customEnding || '',
    rhymeScheme: wizardState.storyData.rhymeScheme || 'AABB',
    wordCount: wizardState.storyData.wordCount || 500,
    specificRequests: wizardState.storyData.specificRequests || '',
  });
  
  const [error, setError] = useState('');
  
  // New state variables for custom inputs
  const [isCustomChallenge, setIsCustomChallenge] = useState(formData.mainChallengePlot === 'custom' || (formData.mainChallengePlot && !mainChallengeOptions.some(o => o.value === formData.mainChallengePlot)));
  const [isCustomEnding, setIsCustomEnding] = useState(formData.desiredEnding === 'custom' || (formData.desiredEnding && !endingOptions.some(o => o.value === formData.desiredEnding)));

  // Update local state if global state changes (e.g., navigating back)
  useEffect(() => {
    setFormData({
      ...wizardState.storyData,
      title: wizardState.storyData.title || '',
      storyType: wizardState.storyData.storyType || 'standard',
      ageRange: wizardState.storyData.ageRange || '4-8',
      narrativeStyle: wizardState.storyData.narrativeStyle || 'third_person_limited',
      toneStyle: wizardState.storyData.toneStyle || 'playful',
      mainChallengePlot: wizardState.storyData.mainChallengePlot || '',
      customMainChallenge: wizardState.storyData.customMainChallenge || '',
      desiredEnding: wizardState.storyData.desiredEnding || '',
      customEnding: wizardState.storyData.customEnding || '',
      rhymeScheme: wizardState.storyData.rhymeScheme || 'AABB',
      wordCount: wizardState.storyData.wordCount || 500,
      specificRequests: wizardState.storyData.specificRequests || '',
    });
    
    // Check if we need to set the custom flags based on data
    setIsCustomChallenge(wizardState.storyData.mainChallengePlot === 'custom' || (wizardState.storyData.mainChallengePlot && !mainChallengeOptions.some(o => o.value === wizardState.storyData.mainChallengePlot)));
    setIsCustomEnding(wizardState.storyData.desiredEnding === 'custom' || (wizardState.storyData.desiredEnding && !endingOptions.some(o => o.value === wizardState.storyData.desiredEnding)));
  }, [wizardState.storyData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Special handling for select inputs that toggle custom fields
    if (name === 'mainChallengePlot') {
      setIsCustomChallenge(value === 'custom');
    } else if (name === 'desiredEnding') {
      setIsCustomEnding(value === 'custom');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBack = () => {
    setWizardStep(3); // Go back to Characters step
  };

  const handleContinue = () => {
    // Validate required fields
    if (!formData.title) {
      setError('Please enter a title for your story');
      return;
    }

    if (!formData.mainChallengePlot) {
      setError('Please select a main challenge or plot for your story');
      return;
    }

    if (isCustomChallenge && !formData.customMainChallenge) {
      setError('Please describe your custom challenge');
      return;
    }

    if (!formData.desiredEnding) {
      setError('Please select a desired ending for your story');
      return;
    }

    if (isCustomEnding && !formData.customEnding) {
      setError('Please describe your custom ending');
      return;
    }

    // All validation passed, update store with form data
    updateStoryData(formData);
    
    // Move to next step (Summary)
    setWizardStep(5);
  };

  // Show rhyming scheme options only for rhyming story type
  const showRhymeOptions = formData.storyType === 'rhyming';

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Story Details</h2>
      <p className="text-gray-600 mb-6">
        Let's add some details to your story. These will help us generate a story that's just right for you.
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Story Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            placeholder="Enter a title for your story"
          />
        </div>

        {/* Story Type */}
        <div>
          <label htmlFor="storyType" className="block text-sm font-medium text-gray-700 mb-1">
            Story Type
          </label>
          <select
            id="storyType"
            name="storyType"
            value={formData.storyType}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {storyTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Age Range */}
        <div>
          <label htmlFor="ageRange" className="block text-sm font-medium text-gray-700 mb-1">
            Target Age Range
          </label>
          <select
            id="ageRange"
            name="ageRange"
            value={formData.ageRange}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {ageRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Narrative Style */}
        <div>
          <label htmlFor="narrativeStyle" className="block text-sm font-medium text-gray-700 mb-1">
            Narrative Style
          </label>
          <select
            id="narrativeStyle"
            name="narrativeStyle"
            value={formData.narrativeStyle}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {narrativeStyleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Tone */}
        <div>
          <label htmlFor="toneStyle" className="block text-sm font-medium text-gray-700 mb-1">
            Story Tone
          </label>
          <select
            id="toneStyle"
            name="toneStyle"
            value={formData.toneStyle}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {toneOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Main Challenge / Plot */}
        <div>
          <label htmlFor="mainChallengePlot" className="block text-sm font-medium text-gray-700 mb-1">
            Main Challenge or Plot
          </label>
          <select
            id="mainChallengePlot"
            name="mainChallengePlot"
            value={formData.mainChallengePlot}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Select a challenge or plot...</option>
            {mainChallengeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom challenge input */}
        {isCustomChallenge && (
          <div>
            <label htmlFor="customMainChallenge" className="block text-sm font-medium text-gray-700 mb-1">
              Describe Your Custom Challenge
            </label>
            <textarea
              id="customMainChallenge"
              name="customMainChallenge"
              value={formData.customMainChallenge}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
              placeholder="Describe the main challenge or plot for your story..."
            />
          </div>
        )}

        {/* Desired Ending */}
        <div>
          <label htmlFor="desiredEnding" className="block text-sm font-medium text-gray-700 mb-1">
            Desired Ending
          </label>
          <select
            id="desiredEnding"
            name="desiredEnding"
            value={formData.desiredEnding}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="">Select an ending style...</option>
            {endingOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom ending input */}
        {isCustomEnding && (
          <div>
            <label htmlFor="customEnding" className="block text-sm font-medium text-gray-700 mb-1">
              Describe Your Custom Ending
            </label>
            <textarea
              id="customEnding"
              name="customEnding"
              value={formData.customEnding}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
              placeholder="Describe how you would like the story to end..."
            />
          </div>
        )}

        {/* Rhyme Scheme (only for rhyming stories) */}
        {showRhymeOptions && (
          <div>
            <label htmlFor="rhymeScheme" className="block text-sm font-medium text-gray-700 mb-1">
              Rhyme Scheme
            </label>
            <select
              id="rhymeScheme"
              name="rhymeScheme"
              value={formData.rhymeScheme}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              {rhymeSchemeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Story Length */}
        <div>
          <label htmlFor="wordCount" className="block text-sm font-medium text-gray-700 mb-1">
            Story Length
          </label>
          <select
            id="wordCount"
            name="wordCount"
            value={formData.wordCount}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {lengthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label} - Print: {option.printCost} / Digital: {option.digitalCost}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            This affects the detail and complexity of your story.
          </p>
        </div>

        {/* Specific Requests / Notes */}
        <div>
          <label htmlFor="specificRequests" className="block text-sm font-medium text-gray-700 mb-1">
            Specific Requests or Notes (Optional)
          </label>
          <textarea
            id="specificRequests"
            name="specificRequests"
            value={formData.specificRequests}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
            placeholder="Any specific elements you'd like to include or exclude from the story..."
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 mt-6 border-t border-gray-200">
        <button
          onClick={handleBack}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Continue to Summary
        </button>
      </div>
    </div>
  );
}

export default StoryDetailsStep;