import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBookStore, useCharacterStore } from '../../store';
import CharacterWizard from '../CharacterWizard';
import { getDzineStyles } from '../../services/dzineService.js';

// Import Art Style Images using relative paths and new filenames
import watercolorImg from '../../assets/watercolor-theme.png';
import pastelImg from '../../assets/pastel-theme.png';
import pencilWashImg from '../../assets/gentle-pencil-wash.png';
import softDigitalImg from '../../assets/soft-brush-digital.png';
import pencilInkImg from '../../assets/pencil-sketch-ink.png';
import goldenBooksImg from '../../assets/golden-books-style.png';
import beatrixPotterImg from '../../assets/beatrix-potter-style.png';
import cartoonImg from '../../assets/cartoon-2d-animation-style.png';
import flatVectorImg from '../../assets/flat-vector-illustration.png';
import storybookPopImg from '../../assets/storybook-pop-style.png';
import papercutImg from '../../assets/cut-paper-collage-style.png';
import oilPastelImg from '../../assets/oil-pastel-gouache-style.png';
import stylizedRealismImg from '../../assets/stylized-realism.png';
import digitalPainterlyImg from '../../assets/digital-painterly.png';
import kawaiiImg from '../../assets/japanese-kawaii.png';
import scandinavianImg from '../../assets/scandinavian-folk-art.png';
import africanPatternImg from '../../assets/african-patterned-illustration.png';

// Character roles
const CHARACTER_ROLES = [
  { id: 'main', label: 'Main Character', description: 'The hero of the story (usually your child)' },
  { id: 'sidekick', label: 'Sidekick', description: 'Friend or companion who helps the main character' },
  { id: 'mentor', label: 'Mentor', description: 'Wise character who guides the main character' },
  { id: 'pet', label: 'Pet', description: 'Animal companion on the adventure' },
  { id: 'magical', label: 'Magical Friend', description: 'A fairy, creature or magical being' },
];

// Map our internal IDs to the preview images
const styleImageMap = {
  watercolor: watercolorImg,
  pastel: pastelImg,
  pencil_wash: pencilWashImg,
  soft_digital: softDigitalImg,
  pencil_ink: pencilInkImg,
  golden_books: goldenBooksImg,
  beatrix_potter: beatrixPotterImg,
  cartoon: cartoonImg,
  flat_vector: flatVectorImg,
  storybook_pop: storybookPopImg,
  papercut: papercutImg,
  oil_pastel: oilPastelImg,
  stylized_realism: stylizedRealismImg,
  digital_painterly: digitalPainterlyImg,
  kawaii: kawaiiImg,
  scandinavian: scandinavianImg,
  african_pattern: africanPatternImg,
};

// Base structure for UI grouping
const ART_STYLE_CATEGORIES_STRUCTURE = [
  {
    category: '🎨 Whimsical & Soft (Ages 0–5)',
    styleIds: ['watercolor', 'pastel', 'pencil_wash', 'soft_digital'] // Use IDs for matching later
  },
  {
    category: '✏️ Classic & Timeless',
    styleIds: ['pencil_ink', 'golden_books', 'beatrix_potter']
  },
  {
    category: '✨ Modern & Colorful',
    styleIds: ['cartoon', 'flat_vector', 'storybook_pop', 'papercut']
  },
  {
    category: '🖼️ Artistic & Elevated',
    styleIds: ['oil_pastel', 'stylized_realism', 'digital_painterly']
  },
  {
    category: '🌍 Cultural or Regional (Optional)',
    styleIds: ['kawaii', 'scandinavian', 'african_pattern']
  },
  {
    category: '💡 Custom Style',
    styleIds: ['custom']
  },
];

function CharactersStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  const { characters } = useCharacterStore();
  
  const [bookCharacters, setBookCharacters] = useState(wizardState.storyData.bookCharacters || []);
  const [showCharacterWizard, setShowCharacterWizard] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [error, setError] = useState('');
  const [artStyleCode, setArtStyleCode] = useState(wizardState.storyData.artStyleCode || '');
  const [customStyleDescription, setCustomStyleDescription] = useState(wizardState.storyData.customStyleDescription || '');

  // State for fetched styles and mapping
  const [dzineStyles, setDzineStyles] = useState([]);
  const [styleIdToCodeMap, setStyleIdToCodeMap] = useState({});
  const [noStyleCode, setNoStyleCode] = useState(null); // For custom style
  const [isLoadingStyles, setIsLoadingStyles] = useState(true);
  const [styleFetchError, setStyleFetchError] = useState(null);

  // Fetch styles from Dzine API on mount
  useEffect(() => {
    const fetchStyles = async () => {
      setIsLoadingStyles(true);
      setStyleFetchError(null);
      try {
        const data = await getDzineStyles();
        setDzineStyles(data.list || []);
        
        // Create a map from name (or a generated ID) to style_code
        const map = {};
        let foundNoStyle = null;
        (data.list || []).forEach(style => {
          // Generate a simple ID from the name for mapping
          const simpleId = style.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/_v\d+$/, ''); 
          map[simpleId] = style.style_code;
          
          if (style.name === 'No Style v2') {
             foundNoStyle = style.style_code;
          }
        });
        setStyleIdToCodeMap(map);
        setNoStyleCode(foundNoStyle);

        // Set initial artStyleCode if not already set
        if (!wizardState.storyData.artStyleCode) {
           // Auto-suggest style based on category (can be refined)
           const category = wizardState.storyData.category;
           let suggestedStyleId = 'cartoon'; // Default ID
           if (category === 'adventure') suggestedStyleId = 'cartoon';
           else if (category === 'fantasy') suggestedStyleId = 'watercolor';
           else if (category === 'bedtime') suggestedStyleId = 'pastel';
           else if (category === 'learning') suggestedStyleId = 'flat_vector';
           else if (category === 'birthday') suggestedStyleId = 'storybook_pop';
         
           const suggestedCode = map[suggestedStyleId] || foundNoStyle || ''; // Fallback
           setArtStyleCode(suggestedCode);
        }

      } catch (err) {
        console.error("Failed to fetch Dzine styles:", err);
        setStyleFetchError(err.message || 'Could not load art styles.');
      } finally {
        setIsLoadingStyles(false);
      }
    };

    fetchStyles();
  }, []); // Fetch only once
  
  // Load wizard state when it changes (e.g., navigating back)
  useEffect(() => {
    setBookCharacters(wizardState.storyData.bookCharacters || []);
    setArtStyleCode(wizardState.storyData.artStyleCode || '');
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
    // We don't store artStyle on individual characters anymore
    const characterWithRole = {
      ...character,
      role: selectedRole,
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
    if (isLoadingStyles) {
      setError('Styles are still loading, please wait.');
      return;
    }
    if (bookCharacters.length === 0) {
      setError('Please add at least one character');
      return;
    }
    const hasMainCharacter = bookCharacters.some(char => char.role === 'main');
    if (!hasMainCharacter) {
      setError('Please add a main character');
      return;
    }
    // Use artStyleCode for validation
    if (!artStyleCode && customStyleDescription === '') { 
        setError('Please select an art style or describe a custom one.');
        return;
    }
    if (artStyleCode === 'custom' && !customStyleDescription.trim()) {
      setError('Please describe your custom art style');
      return;
    }

    updateStoryData({ 
      bookCharacters,
      artStyleCode: artStyleCode === 'custom' ? noStyleCode : artStyleCode, // Use noStyleCode for custom
      customStyleDescription: artStyleCode === 'custom' ? customStyleDescription : ''
    });
    setWizardStep(4); // Skip to generating step
  };

  // Helper to get style details from fetched list based on ID
  const getStyleDetails = (id) => {
      return dzineStyles.find(s => s.style_code === id);
  };

  return (
    <div className="space-y-6">
      {showCharacterWizard ? (
        <CharacterWizard 
          onComplete={handleCharacterComplete} 
          initialStep={1}
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
          {styleFetchError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              Error loading styles: {styleFetchError}
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
                          className="w-full h-full object-contain"
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
            
            {isLoadingStyles ? (
              <div className="text-center p-4 text-gray-500">Loading styles...</div>
            ) : (
              <div className="space-y-6">
                {ART_STYLE_CATEGORIES_STRUCTURE.map((categoryData) => {
                    // Filter the fetched styles that match the IDs in this UI category
                    const stylesToShow = categoryData.styleIds
                      .map(id => {
                         if (id === 'custom') return { style_code: 'custom', name: 'Describe Your Own', description: 'Enter details below.', id: 'custom' };
                         const code = styleIdToCodeMap[id];
                         if (!code) return null; // Skip if no matching code found
                         const details = dzineStyles.find(s => s.style_code === code);
                         return details ? { ...details, id } : null;
                      })
                      .filter(Boolean); // Remove nulls

                    if (stylesToShow.length === 0 && categoryData.styleIds[0] !== 'custom') return null; // Don't render empty categories (except custom)

                    return (
                      <div key={categoryData.category}>
                        <h4 className="text-md font-semibold mb-3 border-b pb-1">{categoryData.category}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
                          {stylesToShow.map((style) => (
                            <div
                              key={style.style_code}
                              className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 flex flex-col items-center text-center shadow-sm hover:shadow-md ${ 
                                artStyleCode === style.style_code 
                                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                                  : 'border-gray-200 bg-white hover:border-blue-300'
                              }`}
                              onClick={() => {
                                setArtStyleCode(style.style_code); // Use style_code now
                                if (style.style_code !== 'custom') {
                                  setError('');
                                  setCustomStyleDescription(''); // Clear custom if selecting preset
                                }
                              }}
                            >
                              <div className="w-full aspect-[3/4] bg-gray-100 mb-2 rounded flex items-center justify-center text-gray-400 overflow-hidden">
                                {styleImageMap[style.id] ? ( // Use our local images for preview
                                  <img src={styleImageMap[style.id]} alt={style.name} className="w-full h-full object-contain" />
                                ) : style.id === 'custom' ? (
                                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                   </svg>
                                ) : (
                                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                   </svg>
                                )}
                              </div>
                              <h5 className="text-sm font-medium leading-tight mb-1">{style.name}</h5>
                              {/* Use description from fetched data if available, else from our structure */}
                              {/* <p className="text-xs text-gray-500 leading-snug">{style.description || ''}</p> */}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Custom Style Description */}
          {artStyleCode === 'custom' && (
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
              disabled={isLoadingStyles || styleFetchError} // Disable continue if styles loading/failed
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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