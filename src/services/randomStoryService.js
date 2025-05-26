/**
 * Random Story Generator Service
 * 
 * This service generates random story parameters to quickly create a story
 * with randomized settings, characters, themes, and plot elements.
 */

import { v4 as uuidv4 } from 'uuid';

// Random story categories
const RANDOM_CATEGORIES = [
  'adventure',
  'bedtime',
  'learning',
  'birthday',
  'fantasy'
];

// Random scenes for each category
const RANDOM_SCENES = {
  adventure: ['forest', 'space', 'ocean', 'mountain', 'jungle'],
  bedtime: ['bedroom', 'dreamland', 'cozy_cottage', 'starry_night'],
  learning: ['school', 'library', 'science_lab', 'art_studio'],
  birthday: ['party_venue', 'backyard', 'park', 'home'],
  fantasy: ['magical_forest', 'castle', 'enchanted_garden', 'fairy_realm']
};

// Random art styles (subset of available styles)
const RANDOM_ART_STYLES = [
  'Style-watercolor-whimsy',
  'Style-cartoon-classic',
  'Style-storybook-illustration',
  'Style-digital-painting',
  'Style-hand-drawn-sketch',
  'Style-vintage-children',
  'Style-modern-minimalist',
  'Style-fantasy-adventure'
];

// Random character names
const RANDOM_NAMES = {
  boy: ['Alex', 'Sam', 'Max', 'Leo', 'Finn', 'Noah', 'Eli', 'Ben', 'Jack', 'Luke'],
  girl: ['Emma', 'Lily', 'Zoe', 'Maya', 'Ava', 'Sophie', 'Grace', 'Mia', 'Ella', 'Ruby'],
  neutral: ['River', 'Sky', 'Sage', 'Quinn', 'Rowan', 'Blake', 'Casey', 'Jordan', 'Taylor', 'Avery']
};

// Random character traits
const RANDOM_TRAITS = [
  'Brave', 'Curious', 'Kind', 'Creative', 'Funny', 'Smart', 
  'Adventurous', 'Caring', 'Energetic', 'Thoughtful'
];

// Random character interests
const RANDOM_INTERESTS = [
  'Animals', 'Space', 'Art', 'Music', 'Sports', 'Nature', 
  'Science', 'Magic', 'Dancing', 'Reading'
];

// Random story structure elements
const RANDOM_STORY_STARTS = [
  'normal_day_interrupted',
  'special_invitation',
  'loses_something',
  'discovers_something',
  'wants_something',
  'asked_for_help'
];

const RANDOM_MAIN_HURDLES = [
  'getting_lost',
  'finding_lost_item',
  'facing_fear',
  'misunderstanding',
  'difficult_task',
  'blocked_path'
];

const RANDOM_BIG_TRIES = [
  'journey',
  'asks_for_help',
  'builds_something',
  'practices_skill',
  'confronts_problem',
  'follows_clues'
];

const RANDOM_TURNING_POINTS = [
  'confronts_source',
  'difficult_choice',
  'near_failure',
  'using_new_skill',
  'unexpected_help',
  'surprising_truth'
];

const RANDOM_RESOLUTIONS = [
  'problem_solved',
  'goal_achieved',
  'friendship_restored',
  'lesson_learned',
  'fear_overcome',
  'mystery_solved'
];

const RANDOM_TAKEAWAYS = [
  'importance_of_friendship',
  'being_brave',
  'helping_others',
  'never_giving_up',
  'being_yourself',
  'sharing_is_caring'
];

// Random titles based on category
const RANDOM_TITLES = {
  adventure: [
    'The Great Adventure',
    'Journey to the Unknown',
    'Quest for the Magic Crystal',
    'The Secret Expedition',
    'Adventure in the Wild'
  ],
  bedtime: [
    'Sweet Dreams',
    'The Sleepy Adventure',
    'Goodnight Stars',
    'The Dream Journey',
    'Peaceful Slumber'
  ],
  learning: [
    'The Learning Adventure',
    'Discovery Day',
    'The Curious Explorer',
    'Knowledge Quest',
    'The Smart Detective'
  ],
  birthday: [
    'The Best Birthday Ever',
    'Birthday Surprise',
    'The Magic Birthday Wish',
    'Celebration Time',
    'The Special Day'
  ],
  fantasy: [
    'The Magical Quest',
    'Enchanted Adventures',
    'The Fairy Tale Journey',
    'Magic and Wonder',
    'The Mystical Adventure'
  ]
};

/**
 * Get a random element from an array
 */
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

/**
 * Get multiple random elements from an array
 */
const getRandomElements = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * Generate a random character
 */
const generateRandomCharacter = (role = 'main', isMainChild = true) => {
  const genders = ['boy', 'girl', 'neutral'];
  const gender = getRandomElement(genders);
  const name = getRandomElement(RANDOM_NAMES[gender]);
  
  // For main character, always make them a child
  const type = role === 'main' ? 'child' : getRandomElement(['child', 'adult', 'pet', 'animal']);
  
  // Age based on type
  let age;
  if (type === 'child') {
    age = Math.floor(Math.random() * 10) + 3; // 3-12 years old
  } else if (type === 'adult') {
    age = Math.floor(Math.random() * 40) + 25; // 25-65 years old
  } else {
    age = Math.floor(Math.random() * 8) + 1; // 1-8 for pets/animals
  }

  const traits = getRandomElements(RANDOM_TRAITS, Math.floor(Math.random() * 3) + 2); // 2-4 traits
  const interests = getRandomElements(RANDOM_INTERESTS, Math.floor(Math.random() * 3) + 2); // 2-4 interests

  const character = {
    id: uuidv4(),
    name,
    type,
    age: age.toString(),
    gender: gender === 'neutral' ? 'other' : gender,
    traits,
    interests,
    role,
    photoUrl: null,
    stylePreview: null,
    useTextToImage: true,
    generationPrompt: generateCharacterDescription(name, type, gender, age, traits)
  };

  // Add relationship info for non-main characters
  if (role !== 'main') {
    const relationships = ['Mom', 'Dad', 'Sister', 'Brother', 'Best Friend', 'Grandma', 'Grandpa', 'Teacher', 'Pet Cat', 'Pet Dog'];
    character.customRole = getRandomElement(relationships);
    character.relationshipType = 'other';
  }

  return character;
};

/**
 * Generate a character description for text-to-image
 */
const generateCharacterDescription = (name, type, gender, age, traits) => {
  const genderDesc = gender === 'boy' ? 'boy' : gender === 'girl' ? 'girl' : 'child';
  const typeDesc = type === 'adult' ? (gender === 'boy' ? 'man' : gender === 'girl' ? 'woman' : 'adult') : genderDesc;
  
  if (type === 'pet' || type === 'animal') {
    const animals = ['cat', 'dog', 'rabbit', 'bird', 'hamster'];
    return `A friendly ${getRandomElement(animals)} with a happy expression, cute and child-friendly appearance`;
  }

  const traitDesc = traits.slice(0, 2).join(' and ').toLowerCase();
  return `A ${traitDesc} ${age} year old ${typeDesc} with a friendly smile, wearing casual clothes, child-friendly illustration style`;
};

/**
 * Generate random story data
 */
export const generateRandomStoryData = () => {
  // Pick random category and scene
  const category = getRandomElement(RANDOM_CATEGORIES);
  const scenes = RANDOM_SCENES[category] || RANDOM_SCENES.adventure;
  const mainScene = getRandomElement(scenes);
  
  // Pick random art style
  const artStyleCode = getRandomElement(RANDOM_ART_STYLES);
  
  // Generate main character (always a child)
  const mainCharacter = generateRandomCharacter('main', true);
  
  // Maybe add a supporting character (50% chance)
  const characters = [mainCharacter];
  if (Math.random() > 0.5) {
    const supportingCharacter = generateRandomCharacter('supporting', false);
    characters.push(supportingCharacter);
  }
  
  // Pick random story structure
  const storyStart = getRandomElement(RANDOM_STORY_STARTS);
  const mainHurdle = getRandomElement(RANDOM_MAIN_HURDLES);
  const bigTry = getRandomElement(RANDOM_BIG_TRIES);
  const turningPoint = getRandomElement(RANDOM_TURNING_POINTS);
  const resolution = getRandomElement(RANDOM_RESOLUTIONS);
  const takeaway = getRandomElement(RANDOM_TAKEAWAYS);
  
  // Generate random title
  const titles = RANDOM_TITLES[category] || RANDOM_TITLES.adventure;
  const title = getRandomElement(titles).replace('The', `${mainCharacter.name}'s`);
  
  // Random age range and word count
  const ageRanges = ['3-5', '4-8', '6-10'];
  const ageRange = getRandomElement(ageRanges);
  const wordCounts = [300, 500, 800];
  const wordCount = getRandomElement(wordCounts);
  
  return {
    // Step 1: Category & Scene
    category,
    mainScene,
    
    // Step 2: Art Style
    artStyleCode,
    
    // Step 3: Characters
    bookCharacters: characters,
    
    // Step 4: Story Details
    title,
    ageRange,
    wordCount,
    storyType: 'standard',
    narrativeStyle: 'third_person_limited',
    toneStyle: getRandomElement(['playful', 'educational', 'adventurous']),
    
    // Story structure
    storyStart,
    mainHurdle,
    bigTry,
    turningPoint,
    resolution,
    takeaway,
    
    // Additional settings
    rhymeScheme: 'none',
    specificRequests: ''
  };
};

/**
 * Generate random story structure elements only
 */
export const generateRandomStoryStructure = () => {
  return {
    storyStart: getRandomElement(RANDOM_STORY_STARTS),
    mainHurdle: getRandomElement(RANDOM_MAIN_HURDLES),
    bigTry: getRandomElement(RANDOM_BIG_TRIES),
    turningPoint: getRandomElement(RANDOM_TURNING_POINTS),
    resolution: getRandomElement(RANDOM_RESOLUTIONS),
    takeaway: getRandomElement(RANDOM_TAKEAWAYS),
    // Clear any custom fields since we're using predefined options
    customStoryStart: '',
    customMainHurdle: '',
    customBigTry: '',
    customTurningPoint: '',
    customResolution: '',
    customTakeaway: ''
  };
};

/**
 * Generate a random story name for the button
 */
export const generateRandomStoryName = () => {
  const adjectives = ['Magical', 'Amazing', 'Wonderful', 'Exciting', 'Mysterious', 'Fantastic'];
  const nouns = ['Adventure', 'Journey', 'Quest', 'Story', 'Tale', 'Discovery'];
  
  return `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`;
}; 