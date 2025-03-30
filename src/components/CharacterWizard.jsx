import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCharacterStore } from '../store';

function CharacterWizard({ onComplete, initialStep = 1, bookCharacters = [], forcedArtStyle = null }) {
  const { characters, addCharacter, updateCharacter } = useCharacterStore();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [currentCharacter, setCurrentCharacter] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef(null);
  
  // Character data
  const [characterData, setCharacterData] = useState({
    id: crypto.randomUUID(),
    name: '',
    type: 'child',
    age: '',
    gender: '',
    traits: [],
    interests: [],
    photoUrl: '',
    stylePreview: null,
    artStyle: forcedArtStyle || 'cartoon'
  });
  
  // Character types
  const CHARACTER_TYPES = [
    { id: 'child', name: 'Child', description: 'The main character - based on your child' },
    { id: 'sibling', name: 'Sibling', description: 'Brother or sister' },
    { id: 'friend', name: 'Friend', description: 'A friend to join the adventure' },
    { id: 'magical', name: 'Magical Character', description: 'A fairy, wizard or magical creature' },
    { id: 'animal', name: 'Animal', description: 'A pet or wild animal companion' },
  ];
  
  // Art styles
  const ART_STYLES = [
    { id: 'cartoon', name: 'Cartoon', previewUrl: 'https://via.placeholder.com/150?text=Cartoon' },
    { id: 'watercolor', name: 'Watercolor', previewUrl: 'https://via.placeholder.com/150?text=Watercolor' },
    { id: 'realistic', name: 'Realistic', previewUrl: 'https://via.placeholder.com/150?text=Realistic' },
    { id: 'pixel', name: 'Pixel Art', previewUrl: 'https://via.placeholder.com/150?text=Pixel' },
  ];
  
  // Handle selecting an existing character
  const handleSelectExistingCharacter = (character) => {
    setCurrentCharacter(character);
    setPhotoPreview(character.photoUrl);
    setCurrentStep(4); // Skip to preview
  };
  
  // Handle photo upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result);
      setCharacterData(prev => ({ ...prev, photoUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };
  
  // Generate character preview
  const generateCharacterPreview = () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Use the forced art style if provided, otherwise use the one from character data
      const styleToUse = forcedArtStyle || characterData.artStyle;
      const stylePreviewUrl = `https://via.placeholder.com/300x400?text=${characterData.name}+in+${styleToUse}+style`;
      
      setCharacterData(prev => ({
        ...prev,
        artStyle: styleToUse,
        stylePreview: stylePreviewUrl
      }));
      
      setIsGenerating(false);
      setCurrentStep(4); // Move to preview
    }, 1500);
  };
  
  // Save character and complete wizard
  const handleSaveCharacter = () => {
    // If we're using an existing character
    if (currentCharacter) {
      // If we have a forced art style, update the character style
      if (forcedArtStyle && currentCharacter.artStyle !== forcedArtStyle) {
        const updatedCharacter = {
          ...currentCharacter,
          artStyle: forcedArtStyle,
          // In a real app, you would regenerate the style preview here
          stylePreview: `https://via.placeholder.com/300x400?text=${currentCharacter.name}+in+${forcedArtStyle}+style`
        };
        onComplete(updatedCharacter);
      } else {
        onComplete(currentCharacter);
      }
      return;
    }
    
    // Otherwise save the new character
    const newCharacter = {
      ...characterData,
      id: characterData.id || crypto.randomUUID(),
      // Ensure we use the forced art style if provided
      artStyle: forcedArtStyle || characterData.artStyle
    };
    
    addCharacter(newCharacter);
    onComplete(newCharacter);
  };
  
  // Cancel the wizard
  const handleCancel = () => {
    onComplete(null);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header with progress bar */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-4">
        <h2 className="text-xl font-bold text-white mb-2">
          {currentStep === 1 ? 'Select Character' :
           currentStep === 2 ? 'Character Details' :
           currentStep === 3 ? 'Appearance' :
           'Preview Character'}
        </h2>
        <div className="w-full bg-white/30 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-white h-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>
      
      <div className="p-4">
        {/* Step 1: Select existing or create new */}
        {currentStep === 1 && (
          <div>
            <p className="text-gray-600 mb-4">Select an existing character or create a new one for your story.</p>
            
            {characters.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Existing Characters</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {characters.map(character => (
                    <div
                      key={character.id}
                      onClick={() => handleSelectExistingCharacter(character)}
                      className="border rounded-lg p-3 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      <div className="aspect-[3/4] bg-gray-100 rounded mb-2 overflow-hidden">
                        <img 
                          src={character.stylePreview || 'https://via.placeholder.com/120x160?text=Character'} 
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-800">{character.name}</p>
                        <p className="text-xs text-gray-500">{character.age} year old {character.gender}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-center">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Character
              </button>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {/* Step 2: Basic character info */}
        {currentStep === 2 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Character Type</label>
                  <div className="space-y-2">
                    {CHARACTER_TYPES.map(type => (
                      <label 
                        key={type.id}
                        className={`block border rounded-lg p-3 cursor-pointer transition-colors ${
                          characterData.type === type.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="characterType"
                          value={type.id}
                          checked={characterData.type === type.id}
                          onChange={() => setCharacterData({...characterData, type: type.id})}
                          className="sr-only"
                        />
                        <div className="flex items-center">
                          <span className="font-medium">{type.name}</span>
                          <span className="ml-2 text-sm text-gray-600">{type.description}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Name</label>
                  <input 
                    type="text"
                    value={characterData.name}
                    onChange={(e) => setCharacterData({...characterData, name: e.target.value})}
                    className="w-full border border-gray-300 rounded p-2"
                    placeholder="Enter character name"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Age</label>
                    <input 
                      type="text"
                      value={characterData.age}
                      onChange={(e) => setCharacterData({...characterData, age: e.target.value})}
                      className="w-full border border-gray-300 rounded p-2"
                      placeholder="Age"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">Gender</label>
                    <select
                      value={characterData.gender}
                      onChange={(e) => setCharacterData({...characterData, gender: e.target.value})}
                      className="w-full border border-gray-300 rounded p-2"
                    >
                      <option value="">Select...</option>
                      <option value="Boy">Boy</option>
                      <option value="Girl">Girl</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (characterData.name.trim() === '') {
                    alert('Please enter a character name');
                    return;
                  }
                  setCurrentStep(3);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Photo and style selection */}
        {currentStep === 3 && (
          <div>
            <div className="mb-6">
              <h3 className="font-medium mb-2">Upload a Photo (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                This will help generate a character that looks like your child
              </p>
              
              <div className="flex items-center space-x-4">
                <div 
                  className="h-32 w-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current.click()}
                >
                  {photoPreview ? (
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="text-center p-4">
                      <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span className="block text-xs mt-1">Upload Photo</span>
                    </div>
                  )}
                </div>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                <div>
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 mb-2 w-full"
                    onClick={() => fileInputRef.current.click()}
                  >
                    Select Photo
                  </button>
                  
                  {photoPreview && (
                    <button
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 w-full"
                      onClick={() => {
                        setPhotoPreview(null);
                        setCharacterData({...characterData, photoUrl: ''});
                      }}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Art Style Selection - only shown if forcedArtStyle is not provided */}
            {!forcedArtStyle && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Character Style</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {ART_STYLES.map(style => (
                    <div
                      key={style.id}
                      onClick={() => setCharacterData({...characterData, artStyle: style.id})}
                      className={`border rounded-lg p-2 cursor-pointer ${
                        characterData.artStyle === style.id 
                          ? 'border-blue-500 ring-2 ring-blue-200' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="aspect-square bg-gray-200 mb-2 rounded overflow-hidden">
                        <img 
                          src={style.previewUrl}
                          alt={style.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center text-sm">{style.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* If forcedArtStyle is provided, show a message */}
            {forcedArtStyle && (
              <div className="mb-6">
                <h3 className="font-medium mb-2">Character Style</h3>
                <p className="text-sm text-gray-600 mb-2">
                  All characters in your story will use the same style.
                </p>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden mr-3">
                      {/* This would be a preview of the forced style */}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{forcedArtStyle} Style</p>
                      <p className="text-sm text-gray-600">Selected for all characters in this story</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={generateCharacterPreview}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isGenerating ? 'Generating...' : 'Generate Preview'}
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Character preview */}
        {currentStep === 4 && (
          <div>
            <div className="flex flex-col items-center mb-6">
              <div className="w-48 h-64 bg-gray-200 rounded-lg overflow-hidden mb-4">
                <img 
                  src={currentCharacter ? currentCharacter.stylePreview : characterData.stylePreview || 'https://via.placeholder.com/192x256'} 
                  alt="Character Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              
              <h3 className="text-xl font-semibold">
                {currentCharacter ? currentCharacter.name : characterData.name}
              </h3>
              <p className="text-gray-600">
                {currentCharacter 
                  ? `${currentCharacter.age} year old ${currentCharacter.gender}` 
                  : `${characterData.age} year old ${characterData.gender}`
                }
              </p>
              <p className="text-sm text-gray-500 capitalize mt-1">
                {currentCharacter 
                  ? `${currentCharacter.type} character in ${forcedArtStyle || currentCharacter.artStyle} style` 
                  : `${characterData.type} character in ${forcedArtStyle || characterData.artStyle} style`
                }
              </p>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={handleSaveCharacter}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Save Character
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CharacterWizard; 