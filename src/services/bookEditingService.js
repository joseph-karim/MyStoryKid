/**
 * Book Editing Service
 * 
 * This service handles all book editing operations including:
 * - Text content editing and validation
 * - Image regeneration with new prompts
 * - Image modification with specific instructions
 * - Version control and change tracking
 */

import { generateImage, generateImageEdit } from './openaiImageService.js';
import { saveBook, updateBookStatus } from './databaseService.js';

/**
 * Text Editing Operations
 */

/**
 * Update text content for a specific page
 * @param {Object} book - The book object
 * @param {number} pageIndex - Index of the page to update
 * @param {string} newText - New text content
 * @returns {Object} Updated book object
 */
export const updatePageText = (book, pageIndex, newText) => {
  try {
    const updatedBook = { ...book };
    
    if (!updatedBook.pages || pageIndex < 0 || pageIndex >= updatedBook.pages.length) {
      throw new Error('Invalid page index');
    }

    // Validate text length based on page type and age range
    const maxLength = getMaxTextLength(updatedBook.pages[pageIndex].type, book.ageRange);
    if (newText.length > maxLength) {
      throw new Error(`Text too long. Maximum ${maxLength} characters for this page type.`);
    }

    // Update the page text
    updatedBook.pages[pageIndex] = {
      ...updatedBook.pages[pageIndex],
      text: newText,
      lastModified: new Date().toISOString(),
      isEdited: true
    };

    // Update book metadata
    updatedBook.lastEditedAt = new Date().toISOString();
    updatedBook.hasUserEdits = true;

    return updatedBook;
  } catch (error) {
    console.error('[bookEditingService] Error updating page text:', error);
    throw error;
  }
};

/**
 * Get maximum text length based on page type and age range
 */
const getMaxTextLength = (pageType, ageRange) => {
  const baseLimits = {
    'cover': 50,
    'title': 100,
    'content': 200,
    'back-cover': 100
  };

  const ageMultipliers = {
    '0-2': 0.5,
    '2-4': 0.7,
    '4-6': 1.0,
    '6-8': 1.3,
    '8-12': 1.5
  };

  const baseLimit = baseLimits[pageType] || 200;
  const multiplier = ageMultipliers[ageRange] || 1.0;
  
  return Math.floor(baseLimit * multiplier);
};

/**
 * Image Generation and Editing Operations
 */

/**
 * Regenerate image for a specific page with a new prompt
 * @param {Object} book - The book object
 * @param {number} pageIndex - Index of the page
 * @param {string} newPrompt - New image generation prompt
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Updated book with new image
 */
export const regeneratePageImage = async (book, pageIndex, newPrompt, options = {}) => {
  try {
    console.log('[bookEditingService] Regenerating image for page:', pageIndex);
    
    if (!book.pages || pageIndex < 0 || pageIndex >= book.pages.length) {
      throw new Error('Invalid page index');
    }

    const page = book.pages[pageIndex];
    
    // Build comprehensive prompt
    const fullPrompt = buildImagePrompt(book, page, newPrompt, options);
    
    // Generate new image
    const imageUrl = await generateImage(fullPrompt, {
      size: options.size || '1024x1024',
      quality: options.quality || 'standard'
    });

    // Update book with new image
    const updatedBook = { ...book };
    updatedBook.pages[pageIndex] = {
      ...page,
      imageUrl,
      visualPrompt: newPrompt,
      imageGenerationStatus: 'completed',
      lastImageUpdate: new Date().toISOString(),
      isImageEdited: true,
      imageGenerationAttempts: (page.imageGenerationAttempts || 0) + 1
    };

    updatedBook.lastEditedAt = new Date().toISOString();
    updatedBook.hasUserEdits = true;

    return updatedBook;
  } catch (error) {
    console.error('[bookEditingService] Error regenerating image:', error);
    
    // Update page with error status
    const updatedBook = { ...book };
    updatedBook.pages[pageIndex] = {
      ...updatedBook.pages[pageIndex],
      imageGenerationStatus: 'failed',
      imageGenerationError: error.message,
      imageGenerationAttempts: (updatedBook.pages[pageIndex].imageGenerationAttempts || 0) + 1
    };
    
    throw error;
  }
};

/**
 * Modify existing image with specific instructions
 * @param {Object} book - The book object
 * @param {number} pageIndex - Index of the page
 * @param {string} instructions - Specific modification instructions
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Updated book with modified image
 */
export const modifyPageImage = async (book, pageIndex, instructions, options = {}) => {
  try {
    console.log('[bookEditingService] Modifying image for page:', pageIndex);
    
    if (!book.pages || pageIndex < 0 || pageIndex >= book.pages.length) {
      throw new Error('Invalid page index');
    }

    const page = book.pages[pageIndex];
    
    if (!page.imageUrl) {
      throw new Error('No existing image to modify');
    }

    // Build modification prompt based on existing image and instructions
    const modificationPrompt = buildModificationPrompt(book, page, instructions);
    
    // Generate modified image using OpenAI
    const imageUrl = await generateImage(modificationPrompt, {
      size: options.size || '1024x1024',
      quality: options.quality || 'standard'
    });

    // Update book with modified image
    const updatedBook = { ...book };
    updatedBook.pages[pageIndex] = {
      ...page,
      imageUrl,
      visualPrompt: `${page.visualPrompt || ''}\n\nModification: ${instructions}`,
      imageGenerationStatus: 'completed',
      lastImageUpdate: new Date().toISOString(),
      isImageEdited: true,
      imageModificationHistory: [
        ...(page.imageModificationHistory || []),
        {
          timestamp: new Date().toISOString(),
          instructions,
          previousImageUrl: page.imageUrl
        }
      ],
      imageGenerationAttempts: (page.imageGenerationAttempts || 0) + 1
    };

    updatedBook.lastEditedAt = new Date().toISOString();
    updatedBook.hasUserEdits = true;

    return updatedBook;
  } catch (error) {
    console.error('[bookEditingService] Error modifying image:', error);
    
    // Update page with error status
    const updatedBook = { ...book };
    updatedBook.pages[pageIndex] = {
      ...updatedBook.pages[pageIndex],
      imageGenerationStatus: 'failed',
      imageGenerationError: error.message,
      imageGenerationAttempts: (updatedBook.pages[pageIndex].imageGenerationAttempts || 0) + 1
    };
    
    throw error;
  }
};

/**
 * Build comprehensive image generation prompt
 */
const buildImagePrompt = (book, page, userPrompt, options = {}) => {
  const baseStyle = book.artStyleCode || book.customStyleDescription || 'children\'s book illustration';
  const characters = book.characters || [];
  const mainCharacter = characters.find(c => c.role === 'main');
  
  let prompt = `${baseStyle} style illustration. `;
  
  // Add character descriptions if relevant
  if (mainCharacter && userPrompt.toLowerCase().includes(mainCharacter.name.toLowerCase())) {
    prompt += `Main character ${mainCharacter.name}: ${mainCharacter.appearanceDescription || `${mainCharacter.age} year old ${mainCharacter.gender}`}. `;
  }
  
  // Add scene context from page text
  if (page.text) {
    prompt += `Scene context: ${page.text}. `;
  }
  
  // Add user's specific prompt
  prompt += userPrompt;
  
  // Add quality and style modifiers
  prompt += '. High quality, detailed, colorful, engaging for children';
  
  // Add age-appropriate modifiers
  if (book.ageRange) {
    const ageModifiers = {
      '0-2': ', simple shapes, bright colors, very simple composition',
      '2-4': ', clear simple imagery, bright cheerful colors',
      '4-6': ', detailed but not complex, vibrant colors, friendly characters',
      '6-8': ', detailed illustration, rich colors, engaging scene',
      '8-12': ', sophisticated illustration, complex scene, detailed artwork'
    };
    prompt += ageModifiers[book.ageRange] || '';
  }
  
  return prompt;
};

/**
 * Build modification prompt for existing images
 */
const buildModificationPrompt = (book, page, instructions) => {
  const baseStyle = book.artStyleCode || book.customStyleDescription || 'children\'s book illustration';
  
  let prompt = `${baseStyle} style illustration. `;
  
  // Add context from existing image
  if (page.visualPrompt) {
    prompt += `Based on existing scene: ${page.visualPrompt}. `;
  }
  
  if (page.text) {
    prompt += `Scene context: ${page.text}. `;
  }
  
  // Add specific modification instructions
  prompt += `Modification requested: ${instructions}. `;
  
  // Maintain consistency
  prompt += 'Keep the same overall style, composition, and character appearance while making the requested changes. High quality, detailed, colorful, engaging for children';
  
  return prompt;
};

/**
 * Batch Operations
 */

/**
 * Apply multiple edits to a book
 * @param {Object} book - The book object
 * @param {Array} edits - Array of edit operations
 * @returns {Promise<Object>} Updated book with all edits applied
 */
export const applyBatchEdits = async (book, edits) => {
  try {
    let updatedBook = { ...book };
    
    for (const edit of edits) {
      switch (edit.type) {
        case 'text':
          updatedBook = updatePageText(updatedBook, edit.pageIndex, edit.newText);
          break;
        case 'regenerate_image':
          updatedBook = await regeneratePageImage(updatedBook, edit.pageIndex, edit.prompt, edit.options);
          break;
        case 'modify_image':
          updatedBook = await modifyPageImage(updatedBook, edit.pageIndex, edit.instructions, edit.options);
          break;
        default:
          console.warn('[bookEditingService] Unknown edit type:', edit.type);
      }
    }
    
    return updatedBook;
  } catch (error) {
    console.error('[bookEditingService] Error applying batch edits:', error);
    throw error;
  }
};

/**
 * Version Control and History
 */

/**
 * Create a snapshot of the current book state
 * @param {Object} book - The book object
 * @param {string} description - Description of the snapshot
 * @returns {Object} Snapshot object
 */
export const createBookSnapshot = (book, description = 'Auto-save') => {
  return {
    id: `snapshot_${Date.now()}`,
    timestamp: new Date().toISOString(),
    description,
    bookData: JSON.parse(JSON.stringify(book)), // Deep clone
    version: (book.version || 0) + 1
  };
};

/**
 * Restore book from snapshot
 * @param {Object} snapshot - The snapshot to restore
 * @returns {Object} Restored book object
 */
export const restoreFromSnapshot = (snapshot) => {
  return {
    ...snapshot.bookData,
    restoredFrom: snapshot.id,
    restoredAt: new Date().toISOString()
  };
};

/**
 * Save edited book to database
 * @param {Object} book - The edited book object
 * @param {string} anonymousSessionId - Anonymous session ID if applicable
 * @returns {Promise<Object>} Saved book data
 */
export const saveEditedBook = async (book, anonymousSessionId = null) => {
  try {
    // Mark book as edited
    const bookToSave = {
      ...book,
      status: 'completed', // Edited books are considered completed
      lastEditedAt: new Date().toISOString(),
      hasUserEdits: true,
      version: (book.version || 0) + 1
    };
    
    const savedBook = await saveBook(bookToSave, anonymousSessionId);
    return savedBook;
  } catch (error) {
    console.error('[bookEditingService] Error saving edited book:', error);
    throw error;
  }
};

/**
 * Validation and Utilities
 */

/**
 * Validate book edits before applying
 * @param {Object} book - The book object
 * @param {Object} edit - The edit to validate
 * @returns {Object} Validation result
 */
export const validateEdit = (book, edit) => {
  const errors = [];
  const warnings = [];
  
  switch (edit.type) {
    case 'text':
      if (!edit.newText || edit.newText.trim().length === 0) {
        errors.push('Text cannot be empty');
      }
      
      const maxLength = getMaxTextLength(
        book.pages[edit.pageIndex]?.type || 'content',
        book.ageRange
      );
      
      if (edit.newText.length > maxLength) {
        errors.push(`Text too long. Maximum ${maxLength} characters allowed.`);
      }
      break;
      
    case 'regenerate_image':
    case 'modify_image':
      if (!edit.prompt && !edit.instructions) {
        errors.push('Prompt or instructions required for image operations');
      }
      break;
      
    default:
      errors.push(`Unknown edit type: ${edit.type}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get edit suggestions based on content analysis
 * @param {Object} book - The book object
 * @returns {Array} Array of suggested edits
 */
export const getEditSuggestions = (book) => {
  const suggestions = [];
  
  if (!book.pages) return suggestions;
  
  book.pages.forEach((page, index) => {
    // Check for very short text
    if (page.text && page.text.trim().length < 20 && page.type === 'content') {
      suggestions.push({
        type: 'text',
        pageIndex: index,
        suggestion: 'Consider adding more descriptive text to this page',
        priority: 'low'
      });
    }
    
    // Check for missing images
    if (!page.imageUrl && page.type === 'content') {
      suggestions.push({
        type: 'regenerate_image',
        pageIndex: index,
        suggestion: 'This page is missing an illustration',
        priority: 'high'
      });
    }
    
    // Check for failed image generation
    if (page.imageGenerationStatus === 'failed') {
      suggestions.push({
        type: 'regenerate_image',
        pageIndex: index,
        suggestion: 'Image generation failed. Try regenerating with a different prompt.',
        priority: 'high'
      });
    }
  });
  
  return suggestions;
};

export default {
  // Text editing
  updatePageText,
  
  // Image operations
  regeneratePageImage,
  modifyPageImage,
  
  // Batch operations
  applyBatchEdits,
  
  // Version control
  createBookSnapshot,
  restoreFromSnapshot,
  
  // Database operations
  saveEditedBook,
  
  // Validation and utilities
  validateEdit,
  getEditSuggestions
}; 