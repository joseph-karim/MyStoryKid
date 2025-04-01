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

// Story structure options with dropdown choices
const storyStartOptions = [
  { value: 'normal_day_interrupted', label: 'A normal day is interrupted by something unexpected.' },
  { value: 'special_invitation', label: 'Character receives a special invitation or message.' },
  { value: 'loses_something', label: 'Character loses something important.' },
  { value: 'discovers_something', label: 'Character discovers something mysterious (object, place).' },
  { value: 'wants_something', label: 'Character strongly wants something they don\'t have.' },
  { value: 'asked_for_help', label: 'Someone asks the character for help.' },
  { value: 'special_event', label: 'Character is preparing for a special event.' },
  { value: 'custom', label: '✏️ Custom Input...' },
];

const mainHurdleOptions = [
  { value: 'getting_lost', label: 'Getting lost or separated from loved ones.' },
  { value: 'finding_lost_item', label: 'Needing to find a specific lost item or person.' },
  { value: 'facing_fear', label: 'Having to face a specific fear (e.g., the dark, heights, performing).' },
  { value: 'misunderstanding', label: 'A big misunderstanding or argument with a friend/sibling.' },
  { value: 'difficult_task', label: 'Needing to accomplish a physically difficult task (e.g., climb, build, travel far).' },
  { value: 'blocked_path', label: 'Someone or something is blocking the character\'s path/goal.' },
  { value: 'unfair_situation', label: 'Dealing with someone being unfair or unkind.' },
  { value: 'race_against_time', label: 'A race against time to do something important.' },
  { value: 'custom', label: '✏️ Custom Input...' },
];

const bigTryOptions = [
  { value: 'journey', label: 'Goes on a journey/expedition.' },
  { value: 'asks_for_help', label: 'Asks different characters for help or advice.' },
  { value: 'builds_something', label: 'Tries (and maybe fails) to build, fix, or create something.' },
  { value: 'practices_skill', label: 'Practices a skill repeatedly to get better.' },
  { value: 'confronts_problem', label: 'Tries to confront the problem or fear directly.' },
  { value: 'talks_it_out', label: 'Attempts to talk things out, apologize, or explain.' },
  { value: 'follows_clues', label: 'Follows clues or a map.' },
  { value: 'clever_plan', label: 'Comes up with a clever plan or trick.' },
  { value: 'custom', label: '✏️ Custom Input...' },
];

const turningPointOptions = [
  { value: 'confronts_source', label: 'Finally confronting the source of the problem.' },
  { value: 'chase_scene', label: 'A chase scene or urgent race against time.' },
  { value: 'difficult_choice', label: 'Making a difficult but important choice.' },
  { value: 'near_failure', label: 'A moment of near failure, followed by a breakthrough.' },
  { value: 'using_new_skill', label: 'Successfully using a newly learned skill under pressure.' },
  { value: 'unexpected_help', label: 'Receiving unexpected help at a critical moment.' },
  { value: 'surprising_truth', label: 'Discovering a surprising secret or truth.' },
  { value: 'standing_up', label: 'Standing up to someone who was unfair.' },
  { value: 'custom', label: '✏️ Custom Input...' },
];

const resolutionOptions = [
  { value: 'found_item', label: 'The lost item/person/place is successfully found.' },
  { value: 'reached_goal', label: 'The character reaches their goal or destination.' },
  { value: 'misunderstanding_cleared', label: 'Misunderstandings are cleared; friendship/harmony is restored.' },
  { value: 'bravery_saves_day', label: 'The character\'s bravery or skill saves the day.' },
  { value: 'teamwork_success', label: 'Working together with others leads to success.' },
  { value: 'obstacle_overcome', label: 'The obstacle is overcome, removed, or understood.' },
  { value: 'sharing_success', label: 'The character shares what they found/created.' },
  { value: 'celebration', label: 'A celebration marks the success.' },
  { value: 'custom', label: '✏️ Custom Input...' },
];

const takeawayOptions = [
  { value: 'friendship_teamwork', label: 'Learns "Friendship/teamwork makes things better."' },
  { value: 'braver_than_thought', label: 'Realizes "I am braver/more capable than I thought."' },
  { value: 'handling_emotions', label: 'Understands "It\'s okay to feel [emotion] and how to handle it."' },
  { value: 'perseverance', label: 'Learns "Trying again/perseverance pays off."' },
  { value: 'family_appreciation', label: 'Gains appreciation for family/home.' },
  { value: 'kindness_honesty', label: 'Understands "Being kind/honest is important."' },
  { value: 'being_unique', label: 'Learns "It\'s okay to be different/unique."' },
  { value: 'proud_effort', label: 'Feels proud of their accomplishment and effort.' },
  { value: 'custom', label: '✏️ Custom Input...' },
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
    
    // Story structure elements
    storyStart: wizardState.storyData.storyStart || '',
    customStoryStart: wizardState.storyData.customStoryStart || '',
    mainHurdle: wizardState.storyData.mainHurdle || '',
    customMainHurdle: wizardState.storyData.customMainHurdle || '',
    bigTry: wizardState.storyData.bigTry || '',
    customBigTry: wizardState.storyData.customBigTry || '',
    turningPoint: wizardState.storyData.turningPoint || '',
    customTurningPoint: wizardState.storyData.customTurningPoint || '',
    resolution: wizardState.storyData.resolution || '',
    customResolution: wizardState.storyData.customResolution || '',
    takeaway: wizardState.storyData.takeaway || '',
    customTakeaway: wizardState.storyData.customTakeaway || '',
    
    rhymeScheme: wizardState.storyData.rhymeScheme || 'AABB',
    wordCount: wizardState.storyData.wordCount || 500,
    specificRequests: wizardState.storyData.specificRequests || '',
  });
  
  const [error, setError] = useState('');
  
  // State variables for custom inputs
  const [isCustomStoryStart, setIsCustomStoryStart] = useState(formData.storyStart === 'custom');
  const [isCustomMainHurdle, setIsCustomMainHurdle] = useState(formData.mainHurdle === 'custom');
  const [isCustomBigTry, setIsCustomBigTry] = useState(formData.bigTry === 'custom');
  const [isCustomTurningPoint, setIsCustomTurningPoint] = useState(formData.turningPoint === 'custom');
  const [isCustomResolution, setIsCustomResolution] = useState(formData.resolution === 'custom');
  const [isCustomTakeaway, setIsCustomTakeaway] = useState(formData.takeaway === 'custom');

  // Update local state if global state changes (e.g., navigating back)
  useEffect(() => {
    setFormData({
      ...wizardState.storyData,
      title: wizardState.storyData.title || '',
      storyType: wizardState.storyData.storyType || 'standard',
      ageRange: wizardState.storyData.ageRange || '4-8',
      narrativeStyle: wizardState.storyData.narrativeStyle || 'third_person_limited',
      toneStyle: wizardState.storyData.toneStyle || 'playful',
      
      // Story structure elements
      storyStart: wizardState.storyData.storyStart || '',
      customStoryStart: wizardState.storyData.customStoryStart || '',
      mainHurdle: wizardState.storyData.mainHurdle || '',
      customMainHurdle: wizardState.storyData.customMainHurdle || '',
      bigTry: wizardState.storyData.bigTry || '',
      customBigTry: wizardState.storyData.customBigTry || '',
      turningPoint: wizardState.storyData.turningPoint || '',
      customTurningPoint: wizardState.storyData.customTurningPoint || '',
      resolution: wizardState.storyData.resolution || '',
      customResolution: wizardState.storyData.customResolution || '',
      takeaway: wizardState.storyData.takeaway || '',
      customTakeaway: wizardState.storyData.customTakeaway || '',
      
      rhymeScheme: wizardState.storyData.rhymeScheme || 'AABB',
      wordCount: wizardState.storyData.wordCount || 500,
      specificRequests: wizardState.storyData.specificRequests || '',
    });
    
    // Set custom flags based on data
    setIsCustomStoryStart(wizardState.storyData.storyStart === 'custom');
    setIsCustomMainHurdle(wizardState.storyData.mainHurdle === 'custom');
    setIsCustomBigTry(wizardState.storyData.bigTry === 'custom');
    setIsCustomTurningPoint(wizardState.storyData.turningPoint === 'custom');
    setIsCustomResolution(wizardState.storyData.resolution === 'custom');
    setIsCustomTakeaway(wizardState.storyData.takeaway === 'custom');
  }, [wizardState.storyData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Toggle custom input fields when custom option is selected
    switch (name) {
      case 'storyStart':
        setIsCustomStoryStart(value === 'custom');
        break;
      case 'mainHurdle':
        setIsCustomMainHurdle(value === 'custom');
        break;
      case 'bigTry':
        setIsCustomBigTry(value === 'custom');
        break;
      case 'turningPoint':
        setIsCustomTurningPoint(value === 'custom');
        break;
      case 'resolution':
        setIsCustomResolution(value === 'custom');
        break;
      case 'takeaway':
        setIsCustomTakeaway(value === 'custom');
        break;
      default:
        break;
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

    // Validate all story structure elements
    const structureElements = [
      { field: 'storyStart', custom: 'customStoryStart', isCustom: isCustomStoryStart, label: 'starting point' },
      { field: 'mainHurdle', custom: 'customMainHurdle', isCustom: isCustomMainHurdle, label: 'main hurdle' },
      { field: 'bigTry', custom: 'customBigTry', isCustom: isCustomBigTry, label: 'character\'s big try' },
      { field: 'turningPoint', custom: 'customTurningPoint', isCustom: isCustomTurningPoint, label: 'turning point' },
      { field: 'resolution', custom: 'customResolution', isCustom: isCustomResolution, label: 'resolution' },
      { field: 'takeaway', custom: 'customTakeaway', isCustom: isCustomTakeaway, label: 'takeaway' }
    ];

    for (const element of structureElements) {
      if (!formData[element.field]) {
        setError(`Please select a ${element.label} for your story`);
        return;
      }

      if (element.isCustom && !formData[element.custom]) {
        setError(`Please describe your custom ${element.label}`);
        return;
      }
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
        Let's create the structure of your story. These choices will guide how the narrative unfolds.
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

        {/* Basic Story Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Story Structure Section Heading */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Story Structure</h3>
          <p className="text-sm text-gray-600 mb-4">
            Build your story by choosing key elements for each part of the narrative.
          </p>
        </div>

        {/* 1. Story Start */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <label htmlFor="storyStart" className="block text-sm font-medium text-blue-700 mb-1">
            1. The Starting Point / The Spark (What kicks off the story?)
          </label>
          <select
            id="storyStart"
            name="storyStart"
            value={formData.storyStart}
            onChange={handleChange}
            className="w-full border border-blue-200 bg-white rounded-md px-3 py-2"
          >
            <option value="">Select how the story begins...</option>
            {storyStartOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {isCustomStoryStart && (
            <div className="mt-2">
              <textarea
                id="customStoryStart"
                name="customStoryStart"
                value={formData.customStoryStart}
                onChange={handleChange}
                className="w-full border border-blue-200 rounded-md px-3 py-2 h-20"
                placeholder="Describe how your story begins..."
              />
            </div>
          )}
        </div>

        {/* 2. Main Hurdle */}
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <label htmlFor="mainHurdle" className="block text-sm font-medium text-purple-700 mb-1">
            2. The Main Hurdle / Core Conflict (Biggest challenge?)
          </label>
          <select
            id="mainHurdle"
            name="mainHurdle"
            value={formData.mainHurdle}
            onChange={handleChange}
            className="w-full border border-purple-200 bg-white rounded-md px-3 py-2"
          >
            <option value="">Select the main challenge...</option>
            {mainHurdleOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {isCustomMainHurdle && (
            <div className="mt-2">
              <textarea
                id="customMainHurdle"
                name="customMainHurdle"
                value={formData.customMainHurdle}
                onChange={handleChange}
                className="w-full border border-purple-200 rounded-md px-3 py-2 h-20"
                placeholder="Describe the main challenge or hurdle..."
              />
            </div>
          )}
        </div>

        {/* 3. Big Try */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <label htmlFor="bigTry" className="block text-sm font-medium text-green-700 mb-1">
            3. The Character's Big Try (What main action do they take?)
          </label>
          <select
            id="bigTry"
            name="bigTry"
            value={formData.bigTry}
            onChange={handleChange}
            className="w-full border border-green-200 bg-white rounded-md px-3 py-2"
          >
            <option value="">Select what action the character takes...</option>
            {bigTryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {isCustomBigTry && (
            <div className="mt-2">
              <textarea
                id="customBigTry"
                name="customBigTry"
                value={formData.customBigTry}
                onChange={handleChange}
                className="w-full border border-green-200 rounded-md px-3 py-2 h-20"
                placeholder="Describe what action the character takes..."
              />
            </div>
          )}
        </div>

        {/* 4. Turning Point */}
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
          <label htmlFor="turningPoint" className="block text-sm font-medium text-amber-700 mb-1">
            4. A Key Turning Point / Climax (Most exciting moment?)
          </label>
          <select
            id="turningPoint"
            name="turningPoint"
            value={formData.turningPoint}
            onChange={handleChange}
            className="w-full border border-amber-200 bg-white rounded-md px-3 py-2"
          >
            <option value="">Select the key turning point...</option>
            {turningPointOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {isCustomTurningPoint && (
            <div className="mt-2">
              <textarea
                id="customTurningPoint"
                name="customTurningPoint"
                value={formData.customTurningPoint}
                onChange={handleChange}
                className="w-full border border-amber-200 rounded-md px-3 py-2 h-20"
                placeholder="Describe the climax or turning point..."
              />
            </div>
          )}
        </div>

        {/* 5. Resolution */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <label htmlFor="resolution" className="block text-sm font-medium text-red-700 mb-1">
            5. The Happy Ending / Resolution (How is the problem solved?)
          </label>
          <select
            id="resolution"
            name="resolution"
            value={formData.resolution}
            onChange={handleChange}
            className="w-full border border-red-200 bg-white rounded-md px-3 py-2"
          >
            <option value="">Select how the story resolves...</option>
            {resolutionOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {isCustomResolution && (
            <div className="mt-2">
              <textarea
                id="customResolution"
                name="customResolution"
                value={formData.customResolution}
                onChange={handleChange}
                className="w-full border border-red-200 rounded-md px-3 py-2 h-20"
                placeholder="Describe how the problem is resolved..."
              />
            </div>
          )}
        </div>

        {/* 6. Takeaway */}
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <label htmlFor="takeaway" className="block text-sm font-medium text-indigo-700 mb-1">
            6. The Takeaway / Theme Connection (What is learned/felt differently?)
          </label>
          <select
            id="takeaway"
            name="takeaway"
            value={formData.takeaway}
            onChange={handleChange}
            className="w-full border border-indigo-200 bg-white rounded-md px-3 py-2"
          >
            <option value="">Select what is learned...</option>
            {takeawayOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          {isCustomTakeaway && (
            <div className="mt-2">
              <textarea
                id="customTakeaway"
                name="customTakeaway"
                value={formData.customTakeaway}
                onChange={handleChange}
                className="w-full border border-indigo-200 rounded-md px-3 py-2 h-20"
                placeholder="Describe what the character learns or feels differently..."
              />
            </div>
          )}
        </div>

        {/* Additional Options Section */}
        <div className="border-t border-gray-200 pt-6 mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Options</h3>
        </div>

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