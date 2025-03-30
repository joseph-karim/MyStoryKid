import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

// Character types with different appearances
const CHARACTER_TYPES = [
  { id: 'child', name: 'Child', description: 'The main character - based on your child' },
  { id: 'sibling', name: 'Sibling', description: 'Brother or sister' },
  { id: 'friend', name: 'Friend', description: 'A friend to join the adventure' },
  { id: 'magical', name: 'Magical Character', description: 'A fairy, wizard or magical creature' },
  { id: 'animal', name: 'Animal', description: 'A pet or wild animal companion' },
];

function CharacterCreator({ onSave, onCancel, existingCharacter = null }) {
  const [character, setCharacter] = useState(existingCharacter || {
    id: crypto.randomUUID(),
    name: '',
    type: 'child',
    age: '',
    gender: '',
    traits: [],
    interests: [],
    photoUrl: '',
    stylePreview: null
  });
  
  const [photoPreview, setPhotoPreview] = useState(existingCharacter?.photoUrl || null);
  const [currentStep, setCurrentStep] = useState(1);
  const [stylePreview, setStylePreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);

  // Character traits for selection
  const TRAITS = [
    'Brave', 'Curious', 'Funny', 'Kind', 'Creative', 'Adventurous',
    'Smart', 'Shy', 'Energetic', 'Caring', 'Thoughtful', 'Playful'
  ];

  // Interests for selection
  const INTERESTS = [
    'Space', 'Animals', 'Dinosaurs', 'Magic', 'Sports', 'Art',
    'Music', 'Science', 'Nature', 'Dancing', 'Reading', 'Building'
  ];
  
  // Art styles for character visualization
  const ART_STYLES = [
    { id: 'cartoon', name: 'Cartoon', previewUrl: 'https://via.placeholder.com/150?text=Cartoon' },
    { id: 'watercolor', name: 'Watercolor', previewUrl: 'https://via.placeholder.com/150?text=Watercolor' },
    { id: 'pixel', name: 'Pixel Art', previewUrl: 'https://via.placeholder.com/150?text=Pixel' },
    { id: 'realistic', name: 'Realistic', previewUrl: 'https://via.placeholder.com/150?text=Realistic' },
  ];

  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setCharacter(prev => ({ ...prev, photoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // Handle trait selection
  const toggleTrait = (trait) => {
    setCharacter(prev => {
      const traits = prev.traits || [];
      if (traits.includes(trait)) {
        return { ...prev, traits: traits.filter(t => t !== trait) };
      } else {
        return { ...prev, traits: [...traits, trait] };
      }
    });
  };

  // Handle interest selection
  const toggleInterest = (interest) => {
    setCharacter(prev => {
      const interests = prev.interests || [];
      if (interests.includes(interest)) {
        return { ...prev, interests: interests.filter(i => i !== interest) };
      } else {
        return { ...prev, interests: [...interests, interest] };
      }
    });
  };
  
  // Select art style
  const selectArtStyle = (style) => {
    setCharacter(prev => ({ ...prev, artStyle: style.id }));
    setStylePreview(style);
  };
  
  // Simulate character generation
  const generateCharacterPreview = () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setCharacter(prev => ({
        ...prev,
        stylePreview: `https://via.placeholder.com/300x400?text=${prev.name}+in+${prev.artStyle || 'cartoon'}+style`
      }));
      setIsGenerating(false);
      setCurrentStep(4); // Move to preview step
    }, 2000);
  };

  // Save character
  const handleSave = () => {
    onSave(character);
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-6">
        <h2 className="text-2xl font-bold text-white">
          {existingCharacter ? 'Edit Character' : 'Create New Character'}
        </h2>
        <p className="text-blue-100">Bring your story characters to life</p>
      </div>
      
      {/* Progress indicator */}
      <div className="w-full bg-gray-200 h-2">
        <div 
          className="bg-blue-500 h-2 transition-all duration-300"
          style={{ width: `${(currentStep / 4) * 100}%` }}
        />
      </div>
      
      <div className="p-6">
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold mb-4">Character Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Character Type</label>
                  <div className="grid grid-cols-1 gap-2">
                    {CHARACTER_TYPES.map(type => (
                      <div 
                        key={type.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          character.type === type.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => setCharacter(prev => ({ ...prev, type: type.id }))}
                      >
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Name</label>
                  <input
                    id="name"
                    type="text"
                    value={character.name}
                    onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter character name"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="age" className="block text-gray-700 font-medium mb-2">Age</label>
                  <input
                    id="age"
                    type="text"
                    value={character.age}
                    onChange={(e) => setCharacter(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="How old is this character?"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Gender</label>
                  <div className="flex space-x-4">
                    {['Boy', 'Girl', 'Other'].map(gender => (
                      <div key={gender} className="flex items-center">
                        <input
                          type="radio"
                          id={`gender-${gender}`}
                          checked={character.gender === gender}
                          onChange={() => setCharacter(prev => ({ ...prev, gender: gender }))}
                          className="mr-2"
                        />
                        <label htmlFor={`gender-${gender}`}>{gender}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={!character.name}
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Step 2: Photo upload and characteristics */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold mb-4">Photo & Personality</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Upload Photo (Optional)</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current.click()}
                >
                  {photoPreview ? (
                    <div className="mb-2">
                      <img 
                        src={photoPreview} 
                        alt="Character preview" 
                        className="max-h-48 mx-auto rounded"
                      />
                      <button 
                        className="mt-2 text-sm text-blue-600 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoPreview(null);
                          setCharacter(prev => ({ ...prev, photoUrl: '' }));
                        }}
                      >
                        Remove photo
                      </button>
                    </div>
                  ) : (
                    <div className="py-8">
                      <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-500">Click to upload a photo</p>
                      <p className="text-xs text-gray-400">This will help create a personalized character</p>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              
              <div>
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Personality Traits (Select up to 3)</label>
                  <div className="flex flex-wrap gap-2">
                    {TRAITS.map(trait => (
                      <div
                        key={trait}
                        onClick={() => toggleTrait(trait)}
                        className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                          character.traits?.includes(trait)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {trait}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Interests (Select up to 3)</label>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(interest => (
                      <div
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-colors ${
                          character.interests?.includes(interest)
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {interest}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Step 3: Art Style Selection */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-xl font-bold mb-4">Choose Art Style</h3>
            <p className="text-gray-600 mb-6">Select how you want your character to look in the story</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ART_STYLES.map(style => (
                <div
                  key={style.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    character.artStyle === style.id
                      ? 'border-blue-500 transform scale-105 shadow-md'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                  onClick={() => selectArtStyle(style)}
                >
                  <div className="aspect-square mb-2 bg-gray-100 rounded overflow-hidden">
                    <img
                      src={style.previewUrl}
                      alt={style.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center font-medium">{style.name}</div>
                </div>
              ))}
            </div>
            
            <div className="mt-8">
              <button
                onClick={generateCharacterPreview}
                disabled={!character.artStyle || isGenerating}
                className={`w-full py-3 rounded-lg font-medium ${
                  isGenerating || !character.artStyle
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:opacity-90'
                }`}
              >
                {isGenerating ? (
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating Character...
                  </div>
                ) : 'Generate Character Preview'}
              </button>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
            </div>
          </motion.div>
        )}
        
        {/* Step 4: Character Preview */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h3 className="text-xl font-bold mb-4">Your Character is Ready!</h3>
            
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                {/* Original photo small and overlapping */}
                {photoPreview && (
                  <div className="absolute -left-4 -top-4 w-24 h-24 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                    <img 
                      src={photoPreview} 
                      alt="Original" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Generated character image */}
                <div className="w-64 h-80 rounded-lg overflow-hidden border shadow-xl">
                  <img 
                    src={character.stylePreview} 
                    alt={character.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Magical sparkle decorations */}
                <div className="absolute -right-3 -top-3 text-3xl">✨</div>
                <div className="absolute -left-2 -bottom-1 text-2xl">🌟</div>
              </div>
              
              <h3 className="text-xl font-bold text-blue-600">{character.name}</h3>
              <p className="text-gray-600">{character.age} year old {character.gender}</p>
              
              {/* Traits and interests */}
              {character.traits?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-xs">
                  {character.traits.map(trait => (
                    <span key={trait} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {trait}
                    </span>
                  ))}
                </div>
              )}
              
              {character.interests?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-xs">
                  {character.interests.map(interest => (
                    <span key={interest} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <h4 className="font-medium">Add this character to your story?</h4>
              <p className="text-sm text-gray-500">The character will be available to use in all your books</p>
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Edit Character
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full hover:opacity-90"
              >
                Save Character
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default CharacterCreator; 