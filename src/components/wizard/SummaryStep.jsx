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
      return 'API Style'; // Generic name for API styles
    }
    
    // Otherwise format the code into a friendly name
    return styleCode.split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
        
        {/* Art Style */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-800">Art Style</h3>
          <div className="mt-2">
            <p className="font-medium">
              {storyData.artStyleCode === 'custom' ? 'Custom Style' : 
                storyData.artStyleCode?.startsWith('Style-') ? 'API Style' :
                storyData.artStyleCode?.split('_')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ') || 'Not Selected'
              }
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
                          getStyleDisplayName(character.artStyle) || 'Custom Style'
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