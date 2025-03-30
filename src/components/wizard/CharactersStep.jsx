import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBookStore, useCharacterStore } from '../../store';
import CharacterWizard from '../CharacterWizard';

// Import Art Style Images
import watercolorImg from '../../assets/water color theme.png';
import pastelImg from '../../assets/pastel theme.png';
import pencilWashImg from '../../assets/gentle pencil wash.png';
import softDigitalImg from '../../assets/Soft Brush Digital.png';
import pencilInkImg from '../../assets/Pencil Sketch : Ink + Pencil.png';
import goldenBooksImg from '../../assets/golden books style.png';
import beatrixPotterImg from '../../assets/Beatrix Potter Style.png';
import cartoonImg from '../../assets/Cartoon : 2D Animation Style.png';
import flatVectorImg from '../../assets/Flat Vector Illustration.png';
import storybookPopImg from '../../assets/Storybook Pop Style.png';
import papercutImg from '../../assets/Cut-Paper : Collage Style.png';
import oilPastelImg from '../../assets/Oil Pastel : Gouache Style.png';
import stylizedRealismImg from '../../assets/Stylized Realism.png';
import digitalPainterlyImg from '../../assets/Digital Painterly.png';
import kawaiiImg from '../../assets/Japanese Kawaii.png';
import scandinavianImg from '../../assets/Scandinavian Folk Art.png';
import africanPatternImg from '../../assets/African Patterned Illustration.png';

// Character roles
const CHARACTER_ROLES = [
  { id: 'main', label: 'Main Character', description: 'The hero of the story (usually your child)' },
  { id: 'sidekick', label: 'Sidekick', description: 'Friend or companion who helps the main character' },
  { id: 'mentor', label: 'Mentor', description: 'Wise character who guides the main character' },
  { id: 'pet', label: 'Pet', description: 'Animal companion on the adventure' },
  { id: 'magical', label: 'Magical Friend', description: 'A fairy, creature or magical being' },
];

// New Art Styles grouped by category with images
const ART_STYLE_CATEGORIES = [
  {
    category: '🎨 Whimsical & Soft (Ages 0–5)',
    styles: [
      { id: 'watercolor', title: 'Watercolor', description: 'Soft, expressive, magical. Great for fairy tales.', imageUrl: watercolorImg },
      { id: 'pastel', title: 'Pastel Illustration', description: 'Soft-edged, calming, chalk/crayon feel. Kid-friendly.', imageUrl: pastelImg },
      { id: 'pencil_wash', title: 'Gentle Pencil + Wash', description: 'Subtle, intimate feel. Combines lines and light color.', imageUrl: pencilWashImg },
      { id: 'soft_digital', title: 'Soft Brush Digital', description: 'Painterly but crisp, hand-drawn aesthetic.', imageUrl: softDigitalImg },
    ]
  },
  {
    category: '✏️ Classic & Timeless',
    styles: [
      { id: 'pencil_ink', title: 'Pencil Sketch / Ink', description: 'Monochrome or light ink. Vintage feel.', imageUrl: pencilInkImg },
      { id: 'golden_books', title: 'Golden Books Style', description: 'Mid-century inspired, bright, expressive faces.', imageUrl: goldenBooksImg },
      { id: 'beatrix_potter', title: 'Beatrix Potter Style', description: 'Classic watercolor + fine detail. Great for animal tales.', imageUrl: beatrixPotterImg },
    ]
  },
  {
    category: '✨ Modern & Colorful',
    styles: [
      { id: 'cartoon', title: 'Cartoon / 2D Animation', description: 'Clean lines, bright colors, exaggerated expressions.', imageUrl: cartoonImg },
      { id: 'flat_vector', title: 'Flat Vector Illustration', description: 'Bold, clean, simple. Modern educational look.', imageUrl: flatVectorImg },
      { id: 'storybook_pop', title: 'Storybook Pop Style', description: 'Bright, slightly surreal, energetic. For wacky themes.', imageUrl: storybookPopImg },
      { id: 'papercut', title: 'Cut-Paper / Collage', description: 'Layered paper/fabric look. Textured and charming.', imageUrl: papercutImg },
    ]
  },
  {
    category: '🖼️ Artistic & Elevated',
    styles: [
      { id: 'oil_pastel', title: 'Oil Pastel / Gouache', description: 'Thick strokes, vivid color, tactile. For emotional stories.', imageUrl: oilPastelImg },
      { id: 'stylized_realism', title: 'Stylized Realism', description: 'Semi-realistic with artistic lighting. Recognizable child.', imageUrl: stylizedRealismImg },
      { id: 'digital_painterly', title: 'Digital Painterly', description: 'Mimics classical painting. Dramatic and immersive.', imageUrl: digitalPainterlyImg },
    ]
  },
  {
    category: '🌍 Cultural or Regional (Optional)',
    styles: [
      { id: 'kawaii', title: 'Japanese Kawaii', description: 'Ultra-cute, rounded characters, soft palettes.', imageUrl: kawaiiImg },
      { id: 'scandinavian', title: 'Scandinavian Folk Art', description: 'Geometric, bold color, nature-themed.', imageUrl: scandinavianImg },
      { id: 'african_pattern', title: 'African Patterned', description: 'Bright colors, bold patterns, symbolism.', imageUrl: africanPatternImg },
    ]
  },
  {
    category: '💡 Custom Style',
    styles: [
      { id: 'custom', title: 'Describe Your Own', description: 'Enter details below for a unique style.' }, // No image for custom
    ]
  },
];

function CharactersStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  const { characters } = useCharacterStore();
  
  const [bookCharacters, setBookCharacters] = useState(wizardState.storyData.bookCharacters || []);
  const [showCharacterWizard, setShowCharacterWizard] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [artStyle, setArtStyle] = useState(wizardState.storyData.artStyle || 'cartoon');
  const [customStyleDescription, setCustomStyleDescription] = useState(wizardState.storyData.customStyleDescription || '');

  // Auto-suggest style based on category (can be refined)
  useEffect(() => {
    if (!wizardState.storyData.artStyle && wizardState.storyData.category) {
      const category = wizardState.storyData.category;
      let suggestedStyle = 'cartoon'; // Default
      if (category === 'adventure') suggestedStyle = 'cartoon';
      else if (category === 'fantasy') suggestedStyle = 'watercolor';
      else if (category === 'bedtime') suggestedStyle = 'pastel';
      else if (category === 'learning') suggestedStyle = 'flat_vector';
      else if (category === 'birthday') suggestedStyle = 'storybook_pop';
      setArtStyle(suggestedStyle);
    }
  }, [wizardState.storyData.category, wizardState.storyData.artStyle]);
  
  // Load data from store when component mounts
  useEffect(() => {
    setBookCharacters(wizardState.storyData.bookCharacters || []);
    setArtStyle(wizardState.storyData.artStyle || 'cartoon');
    setCustomStyleDescription(wizardState.storyData.customStyleDescription || '');
  }, [wizardState.storyData]);

  const handleAddCharacter = (role) => {
    setSelectedRole(role);
    setShowCharacterWizard(true);
  };

  const handleCharacterComplete = (character) => {
    if (!character) {
      setShowCharacterWizard(false);
      return;
    }
    const characterWithRole = {
      ...character,
      role: selectedRole,
      artStyle: artStyle, 
    };
    setBookCharacters([...bookCharacters, characterWithRole]);
    setShowCharacterWizard(false);
    setError('');
  };

  const removeCharacter = (characterId) => {
    setBookCharacters(bookCharacters.filter(char => char.id !== characterId));
  };

  const handleBack = () => {
    setWizardStep(1);
  };

  const handleContinue = () => {
    if (bookCharacters.length === 0) {
      setError('Please add at least one character');
      return;
    }
    const hasMainCharacter = bookCharacters.some(char => char.role === 'main');
    if (!hasMainCharacter) {
      setError('Please add a main character');
      return;
    }
    if (artStyle === 'custom' && !customStyleDescription.trim()) {
      setError('Please describe your custom art style');
      return;
    }

    updateStoryData({ 
      bookCharacters,
      artStyle,
      customStyleDescription: artStyle === 'custom' ? customStyleDescription : ''
    });
    setWizardStep(4); // Skip to generating step
  };

  return (
    <div className="space-y-6">
      {showCharacterWizard ? (
        <CharacterWizard 
          onComplete={handleCharacterComplete} 
          initialStep={1}
          forcedArtStyle={artStyle}
        />
      ) : (
        <>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold">Add Characters & Choose Style</h2>
            <p className="text-gray-600">Define who's in the story and the overall illustration style.</p>
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {/* Characters List */}
          <div className="mb-6">
             <h3 className="text-lg font-medium mb-3">Story Characters</h3>
             {bookCharacters.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {bookCharacters.map((character) => (
                    <motion.div
                      key={character.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex border rounded-lg p-3 items-center bg-white shadow-sm"
                    >
                      <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden mr-3 flex-shrink-0">
                        <img 
                          src={character.stylePreview || 'https://via.placeholder.com/64'} 
                          alt={character.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{character.name}</p>
                        <p className="text-sm text-gray-600">
                          {CHARACTER_ROLES.find(r => r.id === character.role)?.label}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeCharacter(character.id)}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
             ) : (
               <p className="text-gray-500 text-sm mb-4">No characters added yet. Start by adding the Main Character!</p>
             )}
            <h4 className="text-md font-medium mb-2">Add Character by Role</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {CHARACTER_ROLES.map((role) => (
                <div
                  key={role.id}
                  onClick={() => handleAddCharacter(role.id)}
                  className="border rounded-lg p-4 cursor-pointer bg-white shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <h5 className="font-medium">{role.label}</h5>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Art Style Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Select Character Art Style</h3>
            <p className="text-sm text-gray-600 mb-4">
              Choose one style that will be applied to all characters and illustrations in your book.
            </p>
            
            <div className="space-y-6">
              {ART_STYLE_CATEGORIES.map((categoryData) => (
                <div key={categoryData.category}>
                  <h4 className="text-md font-semibold mb-3 border-b pb-1">{categoryData.category}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categoryData.styles.map((style) => (
                      <div
                        key={style.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 flex flex-col items-center text-center shadow-sm hover:shadow-md ${ 
                          artStyle === style.id 
                            ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                        onClick={() => {
                          if (style.id !== 'custom') { // Don't clear error for custom until text is entered
                             setError('');
                          }
                          setArtStyle(style.id);
                        }}
                      >
                        {/* Render image or placeholder SVG */}
                        <div className="w-full h-24 bg-gray-100 mb-2 rounded flex items-center justify-center text-gray-400 overflow-hidden">
                          {style.imageUrl ? (
                            <img src={style.imageUrl} alt={style.title} className="w-full h-full object-cover" />
                          ) : style.id !== 'custom' ? (
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          ) : (
                             // Placeholder for custom style
                             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                          )}
                        </div>
                        <h5 className="text-sm font-medium leading-tight mb-1">{style.title}</h5>
                        <p className="text-xs text-gray-500 leading-snug">{style.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Custom Style Description */}
          {artStyle === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }} 
              className="mb-6"
            >
              <h4 className="text-md font-semibold mb-2">Describe Your Custom Style</h4>
              <textarea
                value={customStyleDescription}
                onChange={(e) => {
                  setCustomStyleDescription(e.target.value);
                  if (error) setError(''); // Clear error when typing
                }}
                className={`w-full border rounded-md p-3 h-32 ${error && !customStyleDescription.trim() ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Be specific! e.g., 'Like Studio Ghibli backgrounds but with characters that look like Pixar animations.' or 'A dark, Tim Burton-esque pencil sketch style.'"
              />
              {error && !customStyleDescription.trim() && (
                 <p className="text-red-500 text-xs mt-1">{error}</p>
              )}
            </motion.div>
          )}
          
          <div className="flex justify-between pt-4">
            <button
              onClick={handleBack}
              className="border border-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-100"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Continue
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CharactersStep; 