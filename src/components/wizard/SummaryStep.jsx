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
            
            <p><span className="font-medium">Setting:</span> {storyData.setting || 'Not specified'}</p>
            
            <p><span className="font-medium">Core Theme:</span> {storyData.theme || 'Not specified'}</p>
            
            <p><span className="font-medium">Challenge:</span> {storyData.challenge || 'Not specified'}</p>
            
            <p><span className="font-medium">Ending:</span> {storyData.ending || 'Not specified'}</p>
            
            <p><span className="font-medium">Book Length:</span> {storyData.length || 'Standard (10-12 pages)'}</p>
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