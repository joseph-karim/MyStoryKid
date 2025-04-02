import { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { getFriendlyStyleName } from '../../services/dzineService';
import { useNavigate } from 'react-router-dom';

function SummaryStep() {
  const {
    wizardState,
    setWizardStep,
    generateBook,
    isLoading,
    latestGeneratedBookId,
  } = useBookStore();
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const { storyData } = wizardState;
  
  useEffect(() => {
    if (latestGeneratedBookId) {
      console.log(`[SummaryStep] Detected new book ID: ${latestGeneratedBookId}. Navigating...`);
      const bookId = latestGeneratedBookId; 
      useBookStore.setState({ latestGeneratedBookId: null });
      navigate(`/book/${bookId}`);
    }
  }, [latestGeneratedBookId, navigate]);
  
  const handleBack = () => {
    // Go back to Story Details step
    setWizardStep(5);
  };
  
  const handleGenerateClick = () => {
    console.log("[SummaryStep] Generate button clicked. isLoading check:", isLoading);
    setError('');
    if (!isLoading) {
        console.log("[SummaryStep] isLoading is false, calling generateBook().");
        generateBook(); 
    } else {
        console.log("[SummaryStep] isLoading is true, generateBook() call skipped.");
    }
  };
  
  // Helper function to get a friendly style name
  const getStyleDisplayName = (styleCode) => {
    if (!styleCode) return null;
    
    // If it's a custom style
    if (styleCode === 'custom') return 'Custom Style';
    
    // If it's a style code (starts with Style-)
    if (styleCode.startsWith('Style-')) {
      // Try to map the API style code to a better name
      const styleMap = {
        // Whimsical & Soft styles
        'Style-7f3f81ad-1c2d-4a15-944d-66bf549641de': 'Watercolor Whimsy',
        'Style-206baa8c-5bbe-4299-b984-9243d05dce9b': 'Whimsical Coloring',
        'Style-d37c13c6-4c5b-43a8-b86c-ab75a109bce7': 'Enchanted Character',
        'Style-9f0b81f0-c773-4788-a83e-9ea2a25c6895': 'Minimalist Cutesy',
        'Style-2a7de14d-6712-4115-a6a9-d3c7be55eaf2': 'Soft Radiance',
        
        // Classic & Timeless styles
        'Style-85480a6c-4aa6-4260-8ad1-a0b7423910cf': 'Cheerful Storybook',
        'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1': 'Pleasantly Warm',
        'Style-a97e1a5a-97d9-4eb1-a81e-0c1cf0dce23a': 'Storytime Whimsy',
        'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9': 'Line and Wash',
        'Style-a37d7b69-1f9a-42c4-a8e4-f429c29f4512': 'Golden Hour',
        'Style-5aebfb83-ff06-48ae-a8df-1560a32eded1': 'Ancient China',
        
        // Modern & Colorful styles
        'Style-f45b720c-656d-4ef0-bd86-f9f5afa63f0f': 'Cutie 3D',
        'Style-2ee57e3c-108a-41dd-8b28-b16d0ceb6280': 'Glossy Elegance',
        'Style-9cde0ca9-78f0-4be5-a6a1-44dd74cfbaa0': 'Starlit Fantasy',
        'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f': 'Fantasy Hero',
        'Style-455da805-d716-4bc8-a960-4ac505aa7875': 'Joyful Clay',
        'Style-d0fbfa6f-59bb-4578-a567-bde0c82bd833': 'Ceramic Lifelike',
        'Style-b3a85eaa-5c3a-4c96-af0f-db5c984a955a': 'Yarn Realism',
        'Style-1e39bdee-4d33-4f5b-9bbc-12f8f1505fc6': 'Mystical Sovereignty',
        
        // Realistic & Artistic styles
        'Style-bfb2db5f-ecfc-4fe9-b864-1a5770d59347': 'Enchanted Elegance',
        'Style-12325d6b-f0c2-4570-a8a3-1c15124ea703': 'Warm Portrait',
        'Style-552954ec-d5bc-4148-a5f9-4c7a42e41b2c': 'Magic Portrait',
        'Style-b7c0d088-e046-4e9b-a0fb-a329d2b9a36a': 'Vivid Tableaux',
        'Style-ce7b4279-1398-4964-882c-19911e12aef3': 'Luminous Narratives',
        'Style-5e5c3d6f-8a05-49bc-89bd-281c11a7b96d': 'Dreamlike Portraiture',
        'Style-4cc27c59-8418-41c3-acc1-6fef4518b14b': 'Aquarelle Life',
        'Style-d808a5a7-379f-429d-ba07-30711964d577': 'Watercolor Whimsy',
        'Style-714e2f7a-04bb-420d-bd5e-2d1d0310a8c5': 'Playful Outline (legacy)',
        'Style-279e02a8-52c4-4732-a859-86a63d787b0d': 'Storybook Adventure',
        'Style-669000ef-4330-40c4-8104-4c04c4c22673': 'Enchanted Character',
        'Style-8e2b5a07-16b3-411c-b613-69ed7c31d3a6': 'Minimalist Cutesy',
        'Style-4168c76e-5872-4f25-87d8-f3f61437e370': 'Soft Radiance',
        'Style-3bb40c1e-55f1-4289-b075-15cb39ee9707': 'Storybook Charm',
        'Style-b09751bc-9046-4855-8fe9-0f07c23d8f9e': 'Warm Fables',
        'Style-c3a1f0d8-6a5a-4d9f-9ee9-965485ebf98f': 'Storytime Whimsy',
      };
      
      return styleMap[styleCode] || styleCode;
    }
    
    // Otherwise format the code into a friendly name
    return styleCode.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Helper function to get a friendly scene name
  const getSceneDisplayName = (sceneId) => {
    if (!sceneId) return null;
    
    // If it's a custom scene
    if (sceneId === 'custom_scene') return 'Custom Setting';
    
    // Map of scene IDs to readable names
    const sceneMap = {
      // Adventure scenes
      space: 'Space Exploration',
      ocean: 'Undersea Adventure',
      jungle: 'Jungle Expedition',
      mountains: 'Mountain Climb',
      safari: 'Wildlife Safari',
      
      // Bedtime scenes
      dreams: 'Dreamland',
      stars: 'Starry Night',
      bedroom: 'Cozy Bedroom',
      night_forest: 'Night Forest',
      cloud_kingdom: 'Cloud Kingdom',
      
      // Learning scenes
      school: 'School Adventure',
      library: 'Enchanted Library',
      alphabet_land: 'Alphabet Land',
      zoo_letters: 'Zoo of Letters',
      garden: 'Letter Garden',
      
      // Birthday scenes
      party: 'Surprise Party',
      amusement_park: 'Amusement Park',
      treasure_hunt: 'Birthday Treasure Hunt',
      bakery: 'Magical Bakery',
      parade: 'Birthday Parade',
      
      // Fantasy scenes
      enchanted_forest: 'Enchanted Forest',
      dragon_mountain: 'Dragon Mountain',
      fairy_kingdom: 'Fairy Kingdom',
      wizard_castle: 'Wizard\'s Castle',
      crystal_caves: 'Crystal Caves'
    };
    
    return sceneMap[sceneId] || 'Custom Setting';
  };
  
  // Use the new function to get the friendly name for display
  const selectedStyleName = getFriendlyStyleName(storyData.artStyle);
  
  // --- Loading State UI ---
  if (isLoading) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold mb-4">Generating Your Magical Story...</h2>
        <p className="text-gray-600 mb-6">This may take a minute or two...</p>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    );
  }
  
  // --- Default Summary UI ---
  return (
    <div className="space-y-6 pb-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Story Summary</h2>
        <p className="text-gray-600">Review your story details before generating your book</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        {/* Story Category */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Story Category</h3>
          <div className="mt-2 flex items-center">
            <span className="text-2xl mr-2">
              {
                storyData.category === 'adventure' ? '🚀' :
                storyData.category === 'bedtime' ? '🌙' :
                storyData.category === 'learning' ? '📚' :
                storyData.category === 'birthday' ? '🎂' :
                storyData.category === 'fantasy' ? '🧙‍♂️' :
                '✏️'
              }
            </span>
            <div>
              <p className="font-medium">
                {
                  storyData.category === 'adventure' ? 'Adventure' :
                  storyData.category === 'bedtime' ? 'Bedtime Story' :
                  storyData.category === 'learning' ? 'Learning ABCs' :
                  storyData.category === 'birthday' ? 'Birthday Surprise' :
                  storyData.category === 'fantasy' ? 'Fantasy Quest' :
                  'Custom Story'
                }
              </p>
              {storyData.category === 'custom' && storyData.customPrompt && (
                <p className="text-sm text-gray-600 mt-1">{storyData.customPrompt}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Scene/Setting */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Main Scene/Setting</h3>
          <div className="mt-2">
            <p className="font-medium">
              {storyData.mainScene ? getSceneDisplayName(storyData.mainScene) : 'Not Selected'}
            </p>
            {storyData.mainScene === 'custom_scene' && storyData.customSceneDescription && (
              <p className="text-sm text-gray-600 mt-1">{storyData.customSceneDescription}</p>
            )}
          </div>
        </div>
        
        {/* Art Style */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Art Style</h3>
          <div className="mt-2">
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700">Art Style:</h4>
              <p className="text-gray-600">{selectedStyleName || 'Not Selected'}</p>
            </div>
            {storyData.artStyle === 'custom' && storyData.customStyleDescription && (
              <p className="text-sm text-gray-600 mt-1">{storyData.customStyleDescription}</p>
            )}
          </div>
        </div>
        
        {/* Characters */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Characters</h3>
          <div className="mt-2 space-y-3">
            {storyData.bookCharacters && storyData.bookCharacters.length > 0 ? (
              storyData.bookCharacters.map(character => (
                <div key={character.id} className="flex items-center">
                  {character.stylePreview ? (
                    <img 
                      src={character.stylePreview} 
                      alt={character.name} 
                      className="w-12 h-12 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      <span className="text-gray-500">👤</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{character.name}</p>
                    <p className="text-sm text-gray-600">
                      {character.role === 'main' ? 'Main Character' : 
                       character.role === 'sidekick' ? 'Sidekick' :
                       character.role === 'mentor' ? 'Mentor' :
                       character.role === 'pet' ? 'Pet' :
                       'Magical Friend'}
                      {character.artStyle && (
                        <span className="ml-2 text-blue-600">• {
                          character.artStyleName ? character.artStyleName :
                          getStyleDisplayName(character.artStyle)
                        }</span>
                      )}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No characters added</p>
            )}
          </div>
        </div>
        
        {/* Story Details */}
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-800">Story Details</h3>
          <div className="mt-2 space-y-2">
            <p><span className="font-medium">Title:</span> {storyData.title || 'Not specified'}</p>
            
            <p><span className="font-medium">Story Type:</span> {
              storyData.storyType === 'standard' ? 'Standard Picture Book' :
              storyData.storyType === 'rhyming' ? 'Rhyming Story' :
              storyData.storyType === 'early_reader' ? 'Early Reader / Simple Chapters' :
              storyData.storyType === 'lesson' ? 'Lesson/Challenge Focused Story' :
              storyData.storyType === 'board_book' ? 'Board Book' :
              'Not specified'
            }</p>
            
            <p><span className="font-medium">Age Range:</span> {storyData.ageRange || 'Not specified'}</p>
            
            {/* Core Theme */}
            <p className="mt-2">
              <span className="font-medium">Core Themes:</span> 
              {storyData.selectedThemes && storyData.selectedThemes.length > 0 ? (
                <span className="flex flex-wrap gap-1 mt-1">
                  {storyData.selectedThemes.map(theme => (
                    <span key={theme} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
                      {theme.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </span>
                  ))}
                </span>
              ) : storyData.customTheme ? (
                <span className="italic">{storyData.customTheme}</span>
              ) : storyData.coreTheme ? (
                <span>{storyData.coreTheme}</span>
              ) : (
                <span className="text-gray-500">Not specified</span>
              )}
            </p>
            
            {/* Story Structure */}
            <div className="mt-4 border-t border-gray-100 pt-3">
              <h4 className="font-medium mb-2">Story Structure:</h4>
              
              <div className="space-y-3">
                {/* Starting Point */}
                <div className="bg-blue-50 p-2 rounded border border-blue-100">
                  <p className="text-sm font-medium text-blue-700">1. The Starting Point:</p>
                  <p className="text-sm">
                    {storyData.storyStart === 'custom' ? storyData.customStoryStart :
                     storyData.storyStart ? storyData.storyStart.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') :
                     'Not specified'}
                  </p>
                </div>
                
                {/* Main Hurdle */}
                <div className="bg-purple-50 p-2 rounded border border-purple-100">
                  <p className="text-sm font-medium text-purple-700">2. The Main Hurdle:</p>
                  <p className="text-sm">
                    {storyData.mainHurdle === 'custom' ? storyData.customMainHurdle :
                     storyData.mainHurdle ? storyData.mainHurdle.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') :
                     'Not specified'}
                  </p>
                </div>
                
                {/* Big Try */}
                <div className="bg-green-50 p-2 rounded border border-green-100">
                  <p className="text-sm font-medium text-green-700">3. The Character's Big Try:</p>
                  <p className="text-sm">
                    {storyData.bigTry === 'custom' ? storyData.customBigTry :
                     storyData.bigTry ? storyData.bigTry.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') :
                     'Not specified'}
                  </p>
                </div>
                
                {/* Turning Point */}
                <div className="bg-amber-50 p-2 rounded border border-amber-100">
                  <p className="text-sm font-medium text-amber-700">4. The Turning Point:</p>
                  <p className="text-sm">
                    {storyData.turningPoint === 'custom' ? storyData.customTurningPoint :
                     storyData.turningPoint ? storyData.turningPoint.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') :
                     'Not specified'}
                  </p>
                </div>
                
                {/* Resolution */}
                <div className="bg-red-50 p-2 rounded border border-red-100">
                  <p className="text-sm font-medium text-red-700">5. The Resolution:</p>
                  <p className="text-sm">
                    {storyData.resolution === 'custom' ? storyData.customResolution :
                     storyData.resolution ? storyData.resolution.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') :
                     'Not specified'}
                  </p>
                </div>
                
                {/* Takeaway */}
                <div className="bg-indigo-50 p-2 rounded border border-indigo-100">
                  <p className="text-sm font-medium text-indigo-700">6. The Takeaway:</p>
                  <p className="text-sm">
                    {storyData.takeaway === 'custom' ? storyData.customTakeaway :
                     storyData.takeaway ? storyData.takeaway.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') :
                     'Not specified'}
                  </p>
                </div>
              </div>
            </div>
            
            <p className="mt-3"><span className="font-medium">Word Count:</span> {storyData.wordCount || 'Not specified'} words</p>
            
            {storyData.specificRequests && (
              <div className="mt-2">
                <p className="font-medium">Special Requests:</p>
                <p className="text-sm text-gray-600 italic">{storyData.specificRequests}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Generate and Price Info */}
      <div className="mt-8 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-blue-800">Ready to create your storybook?</h3>
          <p className="text-blue-700 mt-1">
            Your personalized storybook will be generated based on the details you provided above.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h4 className="font-medium">Estimated Price:</h4>
            <div className="mt-1 space-y-1">
              <p className="text-sm"><span className="font-medium">Digital PDF:</span> $9.99</p>
              <p className="text-sm"><span className="font-medium">Printed Book:</span> $24.99 + shipping</p>
            </div>
          </div>
          
          <button
            onClick={handleGenerateClick}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full shadow-md hover:shadow-lg transition-all duration-300 w-full md:w-auto disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate My Book'}
          </button>
        </div>
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 mt-6 border-t border-gray-200">
        <button
          onClick={handleBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-100"
        >
          Back to Story Details
        </button>
      </div>
    </div>
  );
}

export default SummaryStep; 