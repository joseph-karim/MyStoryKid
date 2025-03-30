import { useState, useEffect } from 'react';
import { useBookStore } from '../../store';

// Art style options with example descriptions
// In a real app, these would have example images
const ART_STYLES = [
  {
    id: 'cartoon',
    title: 'Cartoon Fun',
    description: 'Colorful and playful cartoon style with bold outlines',
    // placeholder for image: imageUrl: '/images/styles/cartoon.jpg',
  },
  {
    id: 'watercolor',
    title: 'Watercolor Dreams',
    description: 'Soft, dreamy watercolor paintings with gentle colors',
    // placeholder for image: imageUrl: '/images/styles/watercolor.jpg',
  },
  {
    id: 'classic',
    title: 'Classic Storybook',
    description: 'Traditional children\'s book illustrations with rich details',
    // placeholder for image: imageUrl: '/images/styles/classic.jpg',
  },
  {
    id: 'pencil',
    title: 'Whimsical Pencil Sketch',
    description: 'Hand-drawn pencil sketches with a touch of whimsy',
    // placeholder for image: imageUrl: '/images/styles/pencil.jpg',
  },
  {
    id: 'pixel',
    title: 'Pixel Adventure',
    description: 'Retro pixel art reminiscent of classic video games',
    // placeholder for image: imageUrl: '/images/styles/pixel.jpg',
  },
  {
    id: 'papercut',
    title: 'Paper Cut-Out',
    description: 'Layered paper cut-out effect with tactile textures',
    // placeholder for image: imageUrl: '/images/styles/papercut.jpg',
  },
];

function ArtStyleStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  const [selectedStyle, setSelectedStyle] = useState(wizardState.storyData.artStyle || '');
  const [error, setError] = useState('');
  
  // Load data from store when component mounts
  useEffect(() => {
    setSelectedStyle(wizardState.storyData.artStyle || '');
  }, [wizardState.storyData.artStyle]);
  
  const handleBack = () => {
    setWizardStep(2);
  };
  
  const handleContinue = () => {
    if (!selectedStyle) {
      setError('Please select an art style');
      return;
    }
    
    // Update store with selected art style
    updateStoryData({ artStyle: selectedStyle });
    
    // Move to next step
    setWizardStep(4);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Select Art Style</h2>
        <p className="text-gray-600">Choose the visual style for your storybook illustrations</p>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ART_STYLES.map((style) => (
          <div 
            key={style.id}
            className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
              selectedStyle === style.id 
                ? 'border-blue-500 ring-2 ring-blue-300' 
                : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => {
              setSelectedStyle(style.id);
              setError('');
            }}
          >
            {/* Image placeholder - in a real app, this would be an actual image */}
            <div className="bg-gray-300 h-40 w-full">
              {/* <img src={style.imageUrl} alt={style.title} className="h-full w-full object-cover" /> */}
            </div>
            <div className="p-3">
              <h3 className="font-semibold">{style.title}</h3>
              <p className="text-sm text-gray-600">{style.description}</p>
            </div>
          </div>
        ))}
      </div>
      
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
    </div>
  );
}

export default ArtStyleStep; 