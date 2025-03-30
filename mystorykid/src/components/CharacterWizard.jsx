import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useCharacterStore } from '../store';

function CharacterWizard({ onComplete, initialStep = 1, bookCharacters = [] }) {
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
    artStyle: 'cartoon'
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
      const stylePreviewUrl = `https://via.placeholder.com/300x400?text=${characterData.name}+in+${characterData.artStyle}+style`;
      
      setCharacterData(prev => ({
        ...prev,
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
      onComplete(currentCharacter);
      return;
    }
    
    // Otherwise save the new character
    const newCharacter = {
      ...characterData,
      id: characterData.id || crypto.randomUUID()
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
                          onChange={() => setCharacterData(prev => ({ ...prev, type: type.id }))}
                          className="sr-only"
                        />
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-gray-500">{type.description}</div>
                      </label>
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
                    value={characterData.name}
                    onChange={(e) => setCharacterData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter character name"
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="age" className="block text-gray-700 font-medium mb-2">Age</label>
                  <input
                    id="age"
                    type="text"
                    value={characterData.age}
                    onChange={(e) => setCharacterData(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="How old is this character?"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Gender</label>
                  <div className="flex gap-4">
                    {['Boy', 'Girl', 'Other'].map(gender => (
                      <label key={gender} className="flex items-center">
                        <input
                          type="radio"
                          checked={characterData.gender === gender}
                          onChange={() => setCharacterData(prev => ({ ...prev, gender: gender }))}
                          className="mr-2"
                        />
                        {gender}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                disabled={!characterData.name}
              >
                Next
              </button>
            </div>
          </div>
        )}
        
        {/* Step 3: Photo upload and style selection */}
        {currentStep === 3 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Photo upload */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Upload Photo</label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
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
                          setCharacterData(prev => ({ ...prev, photoUrl: '' }));
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
              
              {/* Art style selection */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Select Art Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {ART_STYLES.map(style => (
                    <div
                      key={style.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        characterData.artStyle === style.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => setCharacterData(prev => ({ ...prev, artStyle: style.id }))}
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
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={generateCharacterPreview}
                disabled={isGenerating}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
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
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Back
              </button>
            </div>
          </div>
        )}
        
        {/* Step 4: Character preview */}
        {currentStep === 4 && (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Original photo (if available) */}
                {(photoPreview || currentCharacter?.photoUrl) && (
                  <div className="absolute -left-4 -top-4 w-24 h-24 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                    <img 
                      src={photoPreview || currentCharacter?.photoUrl} 
                      alt="Original photo" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {/* Generated/selected character */}
                <div className="w-64 h-80 rounded-lg overflow-hidden border shadow-xl">
                  <img 
                    src={currentCharacter?.stylePreview || characterData.stylePreview} 
                    alt={currentCharacter?.name || characterData.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Sparkle effects */}
                <div className="absolute -right-3 -top-3 text-3xl">✨</div>
                <div className="absolute -left-2 -bottom-1 text-2xl">🌟</div>
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-blue-600 mb-1">
              {currentCharacter?.name || characterData.name}
            </h3>
            
            <p className="text-gray-600 mb-4">
              {currentCharacter?.age || characterData.age} year old {currentCharacter?.gender || characterData.gender}
            </p>
            
            <div className="mb-6">
              <p className="text-gray-600">This character will appear in your story!</p>
            </div>
            
            <div className="flex justify-center gap-4">
              {!currentCharacter && (
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  Edit Character
                </button>
              )}
              
              <button
                onClick={handleSaveCharacter}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full hover:opacity-90"
              >
                Add to Story
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CharacterWizard; 