import { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { v4 as uuidv4 } from 'uuid';

// Predefined traits for selection
const TRAITS = [
  { id: 'brave', label: 'Brave' },
  { id: 'curious', label: 'Curious' },
  { id: 'kind', label: 'Kind' },
  { id: 'creative', label: 'Creative' },
  { id: 'funny', label: 'Funny' },
  { id: 'smart', label: 'Smart' },
  { id: 'adventurous', label: 'Adventurous' },
  { id: 'shy', label: 'Shy' },
  { id: 'caring', label: 'Caring' },
  { id: 'energetic', label: 'Energetic' },
];

// Predefined interests for selection
const INTERESTS = [
  { id: 'animals', label: 'Animals' },
  { id: 'space', label: 'Space' },
  { id: 'dinosaurs', label: 'Dinosaurs' },
  { id: 'princesses', label: 'Princesses' },
  { id: 'superheroes', label: 'Superheroes' },
  { id: 'sports', label: 'Sports' },
  { id: 'music', label: 'Music' },
  { id: 'art', label: 'Art' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'magic', label: 'Magic' },
  { id: 'robots', label: 'Robots' },
  { id: 'nature', label: 'Nature' },
];

function CharacterStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  const [formData, setFormData] = useState({
    childName: wizardState.storyData.childName || '',
    childAge: wizardState.storyData.childAge || '',
    childGender: wizardState.storyData.childGender || '',
    childTraits: wizardState.storyData.childTraits || [],
    childInterests: wizardState.storyData.childInterests || [],
  });
  const [errors, setErrors] = useState({});
  
  // Load data from store when component mounts
  useEffect(() => {
    setFormData({
      childName: wizardState.storyData.childName || '',
      childAge: wizardState.storyData.childAge || '',
      childGender: wizardState.storyData.childGender || '',
      childTraits: wizardState.storyData.childTraits || [],
      childInterests: wizardState.storyData.childInterests || [],
    });
  }, [wizardState.storyData]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const toggleTrait = (traitId) => {
    const updatedTraits = formData.childTraits.includes(traitId)
      ? formData.childTraits.filter(id => id !== traitId)
      : [...formData.childTraits, traitId];
    
    setFormData({ ...formData, childTraits: updatedTraits });
    
    // Clear error for traits if it exists
    if (errors.childTraits) {
      setErrors({ ...errors, childTraits: '' });
    }
  };
  
  const toggleInterest = (interestId) => {
    const updatedInterests = formData.childInterests.includes(interestId)
      ? formData.childInterests.filter(id => id !== interestId)
      : [...formData.childInterests, interestId];
    
    setFormData({ ...formData, childInterests: updatedInterests });
    
    // Clear error for interests if it exists
    if (errors.childInterests) {
      setErrors({ ...errors, childInterests: '' });
    }
  };
  
  const handleBack = () => {
    setWizardStep(1);
  };
  
  const handleContinue = () => {
    // Validate form
    const newErrors = {};
    
    if (!formData.childName.trim()) {
      newErrors.childName = 'Child name is required';
    }
    
    if (!formData.childAge) {
      newErrors.childAge = 'Age is required';
    } else if (isNaN(formData.childAge) || formData.childAge < 1 || formData.childAge > 12) {
      newErrors.childAge = 'Age must be a number between 1 and 12';
    }
    
    if (!formData.childGender) {
      newErrors.childGender = 'Please select a gender/pronouns option';
    }
    
    if (formData.childTraits.length === 0) {
      newErrors.childTraits = 'Please select at least one trait';
    }
    
    if (formData.childInterests.length === 0) {
      newErrors.childInterests = 'Please select at least one interest';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Create main character object from the form data
    const mainCharacter = {
      id: uuidv4(),
      name: formData.childName,
      type: 'child',
      age: formData.childAge,
      gender: formData.childGender,
      traits: formData.childTraits.map(traitId => 
        TRAITS.find(t => t.id === traitId)?.label || traitId
      ),
      interests: formData.childInterests.map(interestId => 
        INTERESTS.find(i => i.id === interestId)?.label || interestId
      ),
      role: 'main', // Explicitly set as main character
      photoUrl: null,
      stylePreview: null
    };
    
    // Get existing characters and filter out any existing main character
    const existingCharacters = wizardState.storyData.bookCharacters || [];
    const supportingCharacters = existingCharacters.filter(char => char.role !== 'main');
    
    // Update store with character data and the main character in bookCharacters
    updateStoryData({
      ...formData,
      bookCharacters: [mainCharacter, ...supportingCharacters] // Main character always first
    });
    
    // Move to next step
    setWizardStep(3);
  };
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Main Character Details</h2>
        <p className="text-gray-600">Tell us about the child who will be the hero of this story</p>
      </div>
      
      <div className="space-y-4">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Child's Name
            </label>
            <input
              type="text"
              name="childName"
              value={formData.childName}
              onChange={handleInputChange}
              className={`w-full border ${errors.childName ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
              placeholder="Enter name"
            />
            {errors.childName && (
              <p className="text-red-500 text-xs mt-1">{errors.childName}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Age
            </label>
            <input
              type="number"
              name="childAge"
              min="1"
              max="12"
              value={formData.childAge}
              onChange={handleInputChange}
              className={`w-full border ${errors.childAge ? 'border-red-500' : 'border-gray-300'} rounded-md p-2`}
              placeholder="1-12"
            />
            {errors.childAge && (
              <p className="text-red-500 text-xs mt-1">{errors.childAge}</p>
            )}
          </div>
        </div>
        
        {/* Gender/Pronouns */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender/Pronouns
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div
              className={`border rounded-md p-2 text-center cursor-pointer ${
                formData.childGender === 'boy' 
                  ? 'bg-blue-50 border-blue-500' 
                  : 'border-gray-300 hover:border-blue-300'
              }`}
              onClick={() => handleInputChange({ target: { name: 'childGender', value: 'boy' } })}
            >
              Boy (he/him)
            </div>
            <div
              className={`border rounded-md p-2 text-center cursor-pointer ${
                formData.childGender === 'girl' 
                  ? 'bg-blue-50 border-blue-500' 
                  : 'border-gray-300 hover:border-blue-300'
              }`}
              onClick={() => handleInputChange({ target: { name: 'childGender', value: 'girl' } })}
            >
              Girl (she/her)
            </div>
            <div
              className={`border rounded-md p-2 text-center cursor-pointer ${
                formData.childGender === 'neutral' 
                  ? 'bg-blue-50 border-blue-500' 
                  : 'border-gray-300 hover:border-blue-300'
              }`}
              onClick={() => handleInputChange({ target: { name: 'childGender', value: 'neutral' } })}
            >
              They/Them
            </div>
          </div>
          {errors.childGender && (
            <p className="text-red-500 text-xs mt-1">{errors.childGender}</p>
          )}
        </div>
        
        {/* Traits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Personality Traits (select at least one)
          </label>
          <div className="flex flex-wrap gap-2">
            {TRAITS.map((trait) => (
              <div
                key={trait.id}
                className={`border rounded-full px-3 py-1 text-sm cursor-pointer ${
                  formData.childTraits.includes(trait.id)
                    ? 'bg-blue-100 border-blue-500 text-blue-800'
                    : 'border-gray-300 hover:border-blue-300'
                }`}
                onClick={() => toggleTrait(trait.id)}
              >
                {trait.label}
              </div>
            ))}
          </div>
          {errors.childTraits && (
            <p className="text-red-500 text-xs mt-1">{errors.childTraits}</p>
          )}
        </div>
        
        {/* Interests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Interests (select at least one)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <div
                key={interest.id}
                className={`border rounded-full px-3 py-1 text-sm cursor-pointer ${
                  formData.childInterests.includes(interest.id)
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : 'border-gray-300 hover:border-green-300'
                }`}
                onClick={() => toggleInterest(interest.id)}
              >
                {interest.label}
              </div>
            ))}
          </div>
          {errors.childInterests && (
            <p className="text-red-500 text-xs mt-1">{errors.childInterests}</p>
          )}
        </div>
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

export default CharacterStep; 