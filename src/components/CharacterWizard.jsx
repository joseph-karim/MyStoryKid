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
  
  // Art styles with categories and descriptions to match CharactersStep component
  const ART_STYLE_CATEGORIES = [
    {
      category: '🎨 Whimsical & Soft',
      description: 'Warm, comforting styles with a dreamy quality',
      styles: [
        { id: 'watercolor', name: 'Watercolor', description: 'Soft, expressive, and magical. Great for fairy tales.' },
        { id: 'pastel', name: 'Pastel', description: 'Soft-edged and calming, like chalk or crayon textures.' },
        { id: 'pencil_wash', name: 'Gentle Pencil + Wash', description: 'Pencil lines with light color washes. Subtle and intimate.' },
        { id: 'soft_digital', name: 'Soft Digital', description: 'Digital painting with a hand-drawn aesthetic.' }
      ]
    },
    {
      category: '✏️ Classic & Timeless',
      description: 'Styles that evoke nostalgia and timelessness',
      styles: [
        { id: 'pencil_ink', name: 'Pencil & Ink', description: 'Monochrome or light inked outlines with shading.' },
        { id: 'golden_books', name: 'Golden Books', description: 'Inspired by mid-century illustrations. Bright and detailed.' },
        { id: 'beatrix_potter', name: 'Beatrix Potter', description: 'Classic English watercolor with fine detail.' }
      ]
    },
    {
      category: '✨ Modern & Colorful',
      description: 'Bold styles that pop with energy and imagination',
      styles: [
        { id: 'cartoon', name: 'Cartoon', description: 'Clean lines, bright colors, and exaggerated expressions.' },
        { id: 'flat_vector', name: 'Flat Vector', description: 'Bold, clean, and simple. Modern and educational.' },
        { id: 'storybook_pop', name: 'Storybook Pop', description: 'Bright, slightly surreal, and energetic. Great for adventures.' },
        { id: 'papercut', name: 'Paper Collage', description: 'Textured look like layers of paper or fabric.' }
      ]
    },
    {
      category: '🖼️ Artistic & Elevated',
      description: 'More sophisticated, painterly styles',
      styles: [
        { id: 'oil_pastel', name: 'Oil Pastel', description: 'Thick brush strokes, vivid colors, tactile textures.' },
        { id: 'stylized_realism', name: 'Stylized Realism', description: 'Semi-realistic with artistic lighting. Recognizable features.' },
        { id: 'digital_painterly', name: 'Digital Painterly', description: 'Mimics classical painting with digital precision.' }
      ]
    },
    {
      category: '🌍 Cultural Styles',
      description: 'Styles inspired by different traditions',
      styles: [
        { id: 'kawaii', name: 'Japanese Kawaii', description: 'Ultra-cute, rounded characters, soft palettes.' },
        { id: 'scandinavian', name: 'Scandinavian Folk', description: 'Geometric shapes, bold colors, often nature-themed.' },
        { id: 'african_pattern', name: 'African Pattern', description: 'Bright colors, bold patterns, and rich symbolism.' }
      ]
    }
  ];

  // Flatten for easy lookup
  const ALL_ART_STYLES = ART_STYLE_CATEGORIES.flatMap(category => category.styles);
  
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
  
  // Modify the step rendering to skip the art style selection if there's a forced style
  const renderStep = () => {
    // If we have a forced art style, skip step 3 (art style selection)
    if (forcedArtStyle && currentStep === 3) {
      console.log("Skipping style selection because forcedArtStyle is set:", forcedArtStyle);
      // Jump directly to preview step (with a slight delay for smoothness)
      setTimeout(() => {
        generateCharacterPreview();
      }, 100);
      return (
        <div className="text-center p-8">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Applying the story's art style to your character...</p>
        </div>
      );
    }
    
    switch (currentStep) {
      case 1:
        return renderExistingCharactersStep();
      case 2:
        return renderCharacterDetailsStep();
      case 3:
        return renderAppearanceStep();
      case 4:
        return renderPreviewStep();
      default:
        return null;
    }
  };
  
  // Generate character preview - updated to always use forced style if provided
  const generateCharacterPreview = () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Always use the forced art style if provided, otherwise use the one from character data
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
  
  // Render the appearance step - hide style selection when forcedArtStyle is provided
  const renderAppearanceStep = () => {
    return (
      <div>
        <div className="mb-6">
          <h3 className="font-medium mb-2">Upload Photo (Optional)</h3>
          <p className="text-sm text-gray-600 mb-4">
            A photo will help create a character that resembles the real person.
            <span className="block mt-1 text-xs text-blue-600">Photos are used only once for generation and are not stored.</span>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-4 w-40 h-40 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-sm text-gray-500">Upload Photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>
            
            <div className="text-sm text-gray-600">
              <ul className="list-disc list-inside space-y-1">
                <li>Choose a clear photo of the face</li>
                <li>Avoid photos with multiple people</li>
                <li>Front-facing photos work best</li>
                <li>Good lighting improves results</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Only show style selection if no forced style is provided */}
        {!forcedArtStyle && (
          <div className="mb-6">
            <h3 className="font-medium mb-3">Character Style</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a visual style for your character. This will determine how they appear in the story.
            </p>
            
            <div className="space-y-8">
              {ART_STYLE_CATEGORIES.map((category, idx) => (
                <div key={idx} className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">{category.category}</h4>
                  <p className="text-xs text-gray-600">{category.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {category.styles.map(style => (
                      <div
                        key={style.id}
                        onClick={() => !forcedArtStyle && setCharacterData({...characterData, artStyle: style.id})}
                        className={`border rounded-lg p-3 transition-colors ${
                          forcedArtStyle 
                            ? 'opacity-60 cursor-not-allowed' 
                            : characterData.artStyle === style.id
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'cursor-pointer hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="text-center mb-2">
                          <h5 className="font-medium">{style.name}</h5>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{style.description}</p>
                        
                        {forcedArtStyle && characterData.artStyle === style.id && (
                          <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded text-center">
                            Style set by book theme
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* If we have a forced style, show information about it */}
        {forcedArtStyle && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium mb-2 text-blue-800">Selected Story Style</h3>
            <p className="text-sm text-blue-700 mb-3">
              This character will use the art style you already selected for your story.
            </p>
            <div className="text-center">
              <button
                onClick={generateCharacterPreview}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Continue with Story Style
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => setCurrentStep(2)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            Back
          </button>
          
          <button
            onClick={generateCharacterPreview}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            disabled={!characterData.name || isGenerating}
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : 'Generate Preview'}
          </button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header with progress bar */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-500 p-4">
        <h2 className="text-xl font-bold text-white mb-2">
          {currentStep === 1 ? 'Select Character' :
           currentStep === 2 ? 'Character Details' :
           currentStep === 3 ? (forcedArtStyle ? 'Upload Photo' : 'Appearance') :
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
        {renderStep()}
      </div>
    </div>
  );
}

export default CharacterWizard; 