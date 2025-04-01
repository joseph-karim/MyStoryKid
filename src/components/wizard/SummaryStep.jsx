import { useState } from 'react';
import { useBookStore } from '../../store';

function SummaryStep() {
  const { wizardState, updateStoryData, setWizardStep, generateBook } = useBookStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  
  const { storyData } = wizardState;
  
  const handleBack = () => {
    // Go back to Story Details step
    setWizardStep(4);
  };
  
  const handleGenerate = async () => {
    if (isGenerating) return; // Prevent multiple clicks
    
    setIsGenerating(true);
    setError('');
    
    try {
      // Call the generate function (this would be implemented in your bookStore)
      await generateBook();
      
      // Navigate to book viewer or success page
      // (This would be implemented based on your app's navigation)
      console.log("Book generation successful!");
      
      // For now, just show a mock success alert
      alert("Your book has been generated successfully! You can view it in your library.");
      
    } catch (err) {
      console.error("Error generating book:", err);
      setError(err.message || 'Failed to generate your book. Please try again.');
    } finally {
      setIsGenerating(false);
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
        'Style-7f3f81ad-1c2d-4a15-944d-66bf549641de': 'Watercolor Whimsy',
        'Style-206baa8c-5bbe-4299-b984-9243d05dce9b': 'Whimsical Coloring',
        'Style-d37c13c6-4c5b-43a8-b86c-ab75a109bce7': 'Enchanted Character',
        'Style-9f0b81f0-c773-4788-a83e-9ea2a25c6895': 'Minimalist Cutesy',
        'Style-85480a6c-4aa6-4260-8ad1-a0b7423910cf': 'Cheerful Storybook',
        'Style-21a75e9c-3ff8-4728-99c4-94d448a489a1': 'Pleasantly Warm',
        'Style-a97e1a5a-97d9-4eb1-a81e-0c1cf0dce23a': 'Storytime Whimsy',
        'Style-bc151055-fd2b-4650-acd7-52e8e8818eb9': 'Line and Wash',
        'Style-a37d7b69-1f9a-42c4-a8e4-f429c29f4512': 'Golden Hour',
        'Style-b484beb8-143e-4776-9a87-355e0456cfa3': 'Cute Exaggeration',
        'Style-2ee57e3c-108a-41dd-8b28-b16d0ceb6280': 'Glossy Elegance',
        'Style-9cde0ca9-78f0-4be5-a6a1-44dd74cfbaa0': 'Starlit Fantasy',
        'Style-7a23990c-65f7-4300-b2a1-f5a97263e66f': 'Fantasy Hero',
        'Style-455da805-d716-4bc8-a960-4ac505aa7875': 'Joyful Clay',
        'Style-bfb2db5f-ecfc-4fe9-b864-1a5770d59347': 'Enchanted Elegance',
        'Style-12325d6b-f0c2-4570-a8a3-1c15124ea703': 'Warm Portrait',
        'Style-552954ec-d5bc-4148-a5f9-4c7a42e41b2c': 'Magic Portrait',
        'Style-b7c0d088-e046-4e9b-a0fb-a329d2b9a36a': 'Vivid Tableaux',
        'Style-ce7b4279-1398-4964-882c-19911e12aef3': 'Luminous Narratives',
        'Style-5aebfb83-ff06-48ae-a8df-1560a32eded1': 'Ancient China',
        'Style-5e5c3d6f-8a05-49bc-89bd-281c11a7b96d': 'Dreamlike Portraiture',
        'Style-4cc27c59-8418-41c3-acc1-6fef4518b14b': 'Aquarelle Life',
        'Style-d0fbfa6f-59bb-4578-a567-bde0c82bd833': 'Ceramic Lifelike',
        'Style-b3a85eaa-5c3a-4c96-af0f-db5c984a955a': 'Yarn Realism',
        'Style-1e39bdee-4d33-4f5b-9bbc-12f8f1505fc6': 'Mystical Sovereignty',
        'Style-2a7de14d-6712-4115-a6a9-d3c7be55eaf2': 'Soft Radiance'
      };
      
      return styleMap[styleCode] || 'API Style';
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
            <p className="font-medium">
              {getStyleDisplayName(storyData.artStyleCode) || 'Not Selected'}
            </p>
            {storyData.artStyleCode === 'custom' && storyData.customStyleDescription && (
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
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`px-6 py-3 rounded-lg text-white font-medium ${
              isGenerating ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isGenerating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : 'Generate My Storybook'}
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