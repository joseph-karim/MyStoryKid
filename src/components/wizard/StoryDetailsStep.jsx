import React, { useState, useEffect } from 'react';
import { useBookStore } from '../../store';
import { motion } from 'framer-motion';

// Define options for selects
const storyTypeOptions = [
  { value: 'standard', label: 'Standard Picture Book (Ages 3-8)' },
  { value: 'rhyming', label: 'Rhyming Story (Ages 3-6)' },
  { value: 'early_reader', label: 'Early Reader / Simple Chapters (Ages 6-9)' },
  { value: 'lesson', label: 'Lesson/Challenge Focused Story (Flexible Age)' },
  { value: 'board_book', label: 'Board Book (Ages 0-3)' },
];

const ageRangeOptions = [
  { value: '0-3', label: '0-3 Years Old (Board Book Focus)' },
  { value: '3-6', label: '3-6 Years Old (Preschool / Early Picture Book)' },
  { value: '4-8', label: '4-8 Years Old (Standard Picture Book)' },
  { value: '6-9', label: '6-9 Years Old (Early Reader / Simple Chapters)' },
];

const narrativeStyleOptions = [
  { value: 'third_person_limited', label: 'Third-Person (Focus on main character)' },
  { value: 'third_person_omniscient', label: 'Third-Person (All-knowing narrator)' },
  { value: 'first_person', label: 'First-Person (From main character\'s view)' },
];

const toneOptions = [
  { value: 'gentle', label: 'Gentle / Calm' },
  { value: 'adventurous', label: 'Adventurous / Exciting' },
  { value: 'humorous', label: 'Humorous / Funny' },
  { value: 'reassuring', label: 'Reassuring / Comforting' },
  { value: 'playful', label: 'Playful / Lighthearted' },
  { value: 'didactic', label: 'Didactic / Instructive' }, // Use with caution
];

const rhymeSchemeOptions = [
    { value: 'AABB', label: 'AABB (Simple couplets)' },
    { value: 'ABAB', label: 'ABAB (Alternating rhymes)' },
    { value: 'ABCB', label: 'ABCB (Common ballad stanza)' },
    { value: 'Free Verse', label: 'Free Verse (No strict rhyme)' },
];

function StoryDetailsStep() {
  const { wizardState, updateStoryData, setWizardStep } = useBookStore();
  const [formData, setFormData] = useState(wizardState.storyData);
  const [error, setError] = useState('');

  // Update local state if global state changes (e.g., navigating back)
  useEffect(() => {
    setFormData(wizardState.storyData);
  }, [wizardState.storyData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Ensure number inputs are stored as numbers
    const newValue = type === 'checkbox' ? checked : type === 'number' ? parseInt(value, 10) || 0 : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
    
    // Also update the global store immediately on change
    updateStoryData({ [name]: newValue }); 
  };

  const handleBack = () => {
    setWizardStep(1); // Go back to the first step (adjust if your first step is different)
  };

  const handleContinue = () => {
    setError(''); // Clear previous errors
    // Basic validation (can be expanded)
    if (!formData.coreTheme && formData.storyType !== 'board_book') {
      setError('Please describe the Core Theme or main idea of the story.');
      return;
    }
    if (!formData.mainChallengePlot && formData.storyType !== 'board_book') {
      setError('Please describe the Main Challenge or Plot for the story.');
      return;
    }
    if (formData.storyType === 'board_book' && !formData.coreConcept) {
         setError('Please specify the Core Concept for the board book (e.g., Colors, Animals).');
         return;
    }
     if (formData.storyType === 'board_book' && !formData.keyObjectsActions) {
         setError('Please list the Key Objects/Actions for the board book.');
         return;
     }

    // Data is already updated in the store via handleChange
    setWizardStep(3); // Proceed to the next step (Characters & Style) - adjust if needed
  };

  // Helper component for form fields to reduce repetition
  const FormField = ({ label, name, children, helpText, required }) => (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {helpText && <p className="text-xs text-gray-500 mt-1">{helpText}</p>}
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Story Details</h2>
        <p className="text-gray-600">Help us craft the perfect narrative by providing more details.</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Story Type */}
        <FormField label="Type of Story" name="storyType" required>
          <select
            id="storyType"
            name="storyType"
            value={formData.storyType}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            {storyTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </FormField>

        {/* Target Age Range */}
        <FormField label="Target Age Range" name="targetAgeRange" required>
           <select
             id="targetAgeRange"
             name="targetAgeRange"
             value={formData.targetAgeRange}
             onChange={handleChange}
             className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
           >
             {ageRangeOptions.map(option => (
               <option key={option.value} value={option.value}>{option.label}</option>
             ))}
           </select>
         </FormField>
      </div>

      {/* Fields for most story types */}
      {formData.storyType !== 'board_book' && (
        <>
          <FormField label="Core Theme" name="coreTheme" required helpText="What is the main message or lesson? (e.g., Friendship, Sharing, Being Brave)">
            <input
              type="text"
              id="coreTheme"
              name="coreTheme"
              value={formData.coreTheme}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., The importance of teamwork"
            />
          </FormField>

          <FormField label="Main Challenge / Plot Summary" name="mainChallengePlot" required helpText="Briefly describe the main problem or sequence of events.">
            <textarea
              id="mainChallengePlot"
              name="mainChallengePlot"
              rows="3"
              value={formData.mainChallengePlot}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Leo the lion loses his roar and must find it before the big concert."
            />
          </FormField>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
             <FormField label="Narrative Style" name="narrativeStyle" required>
               <select
                 id="narrativeStyle"
                 name="narrativeStyle"
                 value={formData.narrativeStyle}
                 onChange={handleChange}
                 className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
               >
                 {narrativeStyleOptions.map(option => (
                   <option key={option.value} value={option.value}>{option.label}</option>
                 ))}\
               </select>
             </FormField>
             
             <FormField label="Tone" name="tone" required>
               <select
                 id="tone"
                 name="tone"
                 value={formData.tone}
                 onChange={handleChange}
                 className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
               >
                 {toneOptions.map(option => (
                   <option key={option.value} value={option.value}>{option.label}</option>
                 ))}\
               </select>
             </FormField>
           </div>

           <FormField label="Desired Ending" name="desiredEnding" helpText="How should the story conclude? (Optional)">
             <textarea
               id="desiredEnding"
               name="desiredEnding"
               rows="2"
               value={formData.desiredEnding}
               onChange={handleChange}
               className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
               placeholder="e.g., Leo finds his roar was just hiding because he was nervous, and sings beautifully."
             />
           </FormField>

           <FormField label="Approximate Length (Words)" name="desiredLengthWords" helpText="Target word count for the story.">
              <input
                type="number"
                id="desiredLengthWords"
                name="desiredLengthWords"
                value={formData.desiredLengthWords}
                onChange={handleChange}
                min="50"
                step="50"
                className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
           </FormField>
           
           {/* Rhyming Specific Field */}
           {formData.storyType === 'rhyming' && (
              <FormField label="Rhyme Scheme" name="rhymeScheme" required>
                 <select
                   id="rhymeScheme"
                   name="rhymeScheme"
                   value={formData.rhymeScheme}
                   onChange={handleChange}
                   className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                 >
                   {rhymeSchemeOptions.map(option => (
                     <option key={option.value} value={option.value}>{option.label}</option>
                   ))}\
                 </select>
              </FormField>
           )}
        </>
      )}

      {/* Fields specific to Board Books */}
      {formData.storyType === 'board_book' && (
        <>
           <FormField label="Core Concept" name="coreConcept" required helpText="The central theme for the board book (e.g., Animal Sounds, Colors, Shapes).">
             <input
               type="text"
               id="coreConcept"
               name="coreConcept"
               value={formData.coreConcept}
               onChange={handleChange}
               className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
               placeholder="e.g., Bedtime Routine"
             />
           </FormField>
           
           <FormField label="Key Objects / Actions / Characters" name="keyObjectsActions" required helpText="List the 5-8 key things to feature, separated by commas.">
             <textarea
               id="keyObjectsActions"
               name="keyObjectsActions"
               rows="2"
               value={formData.keyObjectsActions}
               onChange={handleChange}
               className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
               placeholder="e.g., Bath, Pajamas, Toothbrush, Book, Teddy Bear, Bed, Kiss Goodnight"
             />
           </FormField>
           
           <FormField label="Interactive Element (Optional)" name="interactiveElement" helpText="Any specific sounds, questions, or routine phrases to include?">
             <input
               type="text"
               id="interactiveElement"
               name="interactiveElement"
               value={formData.interactiveElement}
               onChange={handleChange}
               className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
               placeholder="e.g., Include animal sounds, End with 'All done!'"
             />
           </FormField>
           
            {/* Automatically set lower word count for board books */}
            <input type="hidden" name="desiredLengthWords" value={50} /> 
        </>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6">
        <button onClick={handleBack} className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
          Back
        </button>
        <button onClick={handleContinue} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Continue
        </button>
      </div>
    </motion.div>
  );
}

export default StoryDetailsStep;