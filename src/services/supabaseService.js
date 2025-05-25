import { supabase } from '../lib/supabase'

/**
 * Generate story content using Supabase Edge Function
 * @param {string} prompt - The story generation prompt
 * @param {Object} options - Additional options for story generation
 * @returns {Promise<Object>} - Generated story content
 */
export const generateStoryContent = async (prompt, options = {}) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: {
        prompt,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1000,
        model: options.model || 'gpt-4'
      }
    })

    if (error) {
      console.error('Error calling generate-story function:', error)
      throw new Error(error.message || 'Failed to generate story content')
    }

    if (data?.error) {
      console.error('Error from generate-story function:', data.error)
      throw new Error(data.error)
    }

    return {
      content: data.content,
      usage: data.usage
    }
  } catch (error) {
    console.error('Error in generateStoryContent:', error)
    throw error
  }
}

/**
 * Generate image using Supabase Edge Function (matches existing OpenAI implementation)
 * @param {string} prompt - The image generation prompt
 * @param {Object} options - Additional options for image generation
 * @returns {Promise<string>} - Generated image data URL
 */
export const generateImage = async (prompt, options = {}) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        prompt,
        size: options.size || '1024x1024',
        quality: options.quality || 'medium',
        model: options.model || 'gpt-image-1',
        n: options.n || 1,
        timeout: options.timeout || 60000
      }
    })

    if (error) {
      console.error('Error calling generate-image function:', error)
      throw new Error(error.message || 'Failed to generate image')
    }

    if (data?.error) {
      console.error('Error from generate-image function:', data.error)
      throw new Error(data.error)
    }

    return data.imageUrl
  } catch (error) {
    console.error('Error in generateImage:', error)
    throw error
  }
}

/**
 * Generate image with reference images for character/style consistency
 * @param {string} prompt - The image generation prompt
 * @param {Array<string>} referenceImages - Array of base64 data URLs for reference images
 * @param {Object} options - Additional options for image generation
 * @returns {Promise<string>} - Generated image data URL
 */
export const generateImageWithReferences = async (prompt, referenceImages = [], options = {}) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        prompt,
        referenceImages,
        size: options.size || '1024x1024',
        quality: options.quality || 'medium',
        model: options.model || 'gpt-image-1',
        mask: options.mask || null,
        n: options.n || 1,
        timeout: options.timeout || 120000 // Longer timeout for complex operations
      }
    })

    if (error) {
      console.error('Error calling generate-image function with references:', error)
      throw new Error(error.message || 'Failed to generate image with references')
    }

    if (data?.error) {
      console.error('Error from generate-image function:', data.error)
      throw new Error(data.error)
    }

    return data.imageUrl
  } catch (error) {
    console.error('Error in generateImageWithReferences:', error)
    throw error
  }
}

/**
 * Generate character image using reference images for consistency
 * @param {Object} characterData - Character data object
 * @param {string} styleDescription - Description of the art style
 * @param {string} photoReference - Optional base64 photo reference
 * @param {Array<string>} additionalReferences - Additional reference images
 * @returns {Promise<string>} - Generated character image data URL
 */
export const generateCharacterImage = async (characterData, styleDescription, photoReference = null, additionalReferences = []) => {
  // Build character description (matching existing implementation)
  const { name, age, gender, type, traits = [], interests = [] } = characterData
  
  let characterDescription = `${name}, a ${age || ''} year old ${gender || 'child'}`
  
  if (type === 'child') {
    characterDescription += `, the main character`
  } else if (type === 'sibling') {
    characterDescription += `, a sibling`
  } else if (type === 'friend') {
    characterDescription += `, a friend`
  } else if (type === 'magical') {
    characterDescription += `, a magical character`
  } else if (type === 'animal') {
    characterDescription += `, an animal companion`
  }

  if (traits.length > 0) {
    characterDescription += `. Personality traits: ${traits.join(', ')}`
  }

  if (interests.length > 0) {
    characterDescription += `. Interests: ${interests.join(', ')}`
  }

  const prompt = `Create a character portrait of ${characterDescription}. ${styleDescription}. Children's book illustration style, friendly and approachable appearance.`

  // Collect reference images
  const referenceImages = []
  if (photoReference) {
    referenceImages.push(photoReference)
  }
  referenceImages.push(...additionalReferences)

  if (referenceImages.length > 0) {
    return generateImageWithReferences(prompt, referenceImages, {
      size: "1024x1024", // Square format for character portraits
      quality: "medium",
      timeout: 120000
    })
  } else {
    return generateImage(prompt, {
      size: "1024x1024",
      quality: "medium",
      timeout: 120000
    })
  }
}

/**
 * Generate scene image with character and style references
 * @param {string} sceneDescription - Description of the scene
 * @param {string|Array} characterDescriptions - Character descriptions
 * @param {string} styleDescription - Art style description
 * @param {string} styleReferenceImageUrl - Style reference image
 * @param {number} pageNumber - Page number
 * @param {Object} characterReferenceInfo - Character reference information
 * @returns {Promise<string>} - Generated scene image data URL
 */
export const generateSceneImage = async (
  sceneDescription,
  characterDescriptions,
  styleDescription,
  styleReferenceImageUrl = null,
  pageNumber = 1,
  characterReferenceInfo = {}
) => {
  // Handle multiple characters (matching existing implementation)
  let characterPrompt
  if (Array.isArray(characterDescriptions)) {
    if (characterDescriptions.length === 1) {
      characterPrompt = characterDescriptions[0]
    } else if (characterDescriptions.length === 2) {
      characterPrompt = `${characterDescriptions[0]} and ${characterDescriptions[1]}`
    } else {
      const lastChar = characterDescriptions.pop()
      characterPrompt = `${characterDescriptions.join(', ')}, and ${lastChar}`
    }
  } else {
    characterPrompt = characterDescriptions
  }

  // Build enhanced prompt with style guidance
  const enhancedStyleGuidance = `
    Maintain a consistent animation style throughout the book with these characteristics:
    - Characters should have consistent proportions and features across all pages
    - Maintain consistent lighting direction and color palette across all illustrations
    - Create depth with subtle background details that don't distract from the main characters
    - This is page ${pageNumber} of the story, so maintain visual continuity with previous pages
    - Ensure characters maintain the EXACT SAME outfit, hairstyle, and appearance as in their reference images

    ${styleDescription ? `Additional style notes: ${styleDescription}` : ''}
  `

  const prompt = `Create a scene showing ${characterPrompt} in ${sceneDescription}. ${enhancedStyleGuidance}`

  // Collect reference images
  const referenceImages = []
  
  // Add character reference images
  Object.values(characterReferenceInfo).forEach(charInfo => {
    if (charInfo.referenceImageUrl && charInfo.referenceImageUrl.startsWith('data:image')) {
      referenceImages.push(charInfo.referenceImageUrl)
    }
  })

  // Add style reference image
  if (styleReferenceImageUrl && styleReferenceImageUrl.startsWith('data:image')) {
    referenceImages.push(styleReferenceImageUrl)
  }

  if (referenceImages.length > 0) {
    console.log(`Generating scene image with ${referenceImages.length} reference images`)
    return generateImageWithReferences(prompt, referenceImages, {
      size: "1536x1024", // Landscape format for scenes
      quality: "high",
      timeout: 120000
    })
  } else {
    return generateImage(prompt, {
      size: "1536x1024",
      quality: "high",
      timeout: 120000
    })
  }
}

/**
 * Generate cover image with character references
 * @param {string} title - Book title
 * @param {string|Array} characterDescriptions - Character descriptions
 * @param {string} styleDescription - Art style description
 * @param {Array} characterReferenceImages - Character reference images
 * @param {string} styleCode - Style code for additional references
 * @returns {Promise<string>} - Generated cover image data URL
 */
export const generateCoverImage = async (title, characterDescriptions, styleDescription, characterReferenceImages = [], styleCode = null) => {
  // Handle multiple characters
  let characterPrompt
  if (Array.isArray(characterDescriptions)) {
    if (characterDescriptions.length === 1) {
      characterPrompt = characterDescriptions[0]
    } else if (characterDescriptions.length === 2) {
      characterPrompt = `${characterDescriptions[0]} and ${characterDescriptions[1]}`
    } else {
      const lastChar = characterDescriptions.pop()
      characterPrompt = `${characterDescriptions.join(', ')}, and ${lastChar}`
    }
  } else {
    characterPrompt = characterDescriptions
  }

  const prompt = `Create a book cover for "${title}" featuring ${characterPrompt}. ${styleDescription}. Children's book cover style with title space at the top.`

  if (characterReferenceImages.length > 0) {
    return generateImageWithReferences(prompt, characterReferenceImages, {
      size: "1024x1536", // Portrait format for book covers
      quality: "high",
      timeout: 120000
    })
  } else {
    return generateImage(prompt, {
      size: "1024x1536",
      quality: "high",
      timeout: 120000
    })
  }
}

/**
 * Edit an existing image using mask (inpainting)
 * @param {string} imageBase64 - Base64 encoded image data
 * @param {string} prompt - Text prompt for editing
 * @param {string} maskBase64 - Base64 encoded mask data
 * @param {Object} options - Additional options
 * @returns {Promise<string>} - Edited image data URL
 */
export const editImage = async (imageBase64, prompt, maskBase64 = null, options = {}) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        prompt,
        referenceImages: [imageBase64], // Use the image as a reference
        mask: maskBase64,
        size: options.size || '1024x1024',
        quality: options.quality || 'medium',
        model: options.model || 'gpt-image-1',
        timeout: options.timeout || 120000
      }
    })

    if (error) {
      console.error('Error calling generate-image function for editing:', error)
      throw new Error(error.message || 'Failed to edit image')
    }

    if (data?.error) {
      console.error('Error from generate-image function:', data.error)
      throw new Error(data.error)
    }

    return data.imageUrl
  } catch (error) {
    console.error('Error in editImage:', error)
    throw error
  }
}

/**
 * Create story outline using AI
 * @param {Object} storyData - Story parameters
 * @returns {Promise<Array>} - Story outline as array of spreads
 */
export const createStoryOutline = async (storyData) => {
  const { bookCharacters, category, ageRange, storyType } = storyData
  const mainCharacter = bookCharacters.find(c => c.role === 'main') || bookCharacters[0]
  const supportingCharacters = bookCharacters.filter(c => c.id !== mainCharacter.id)

  let characterDescriptions = `Main Character: ${mainCharacter.name}, a ${mainCharacter.age || ''} year old ${mainCharacter.gender || 'child'}. `
  
  if (supportingCharacters.length > 0) {
    characterDescriptions += "Supporting Characters: "
    characterDescriptions += supportingCharacters.map(char =>
      `${char.name}, a ${char.age || ''} year old ${char.gender || 'child'} (${char.customRole || 'friend'})`
    ).join('; ')
  }

  const numSpreads = storyType === 'board_book' ? 6 : storyType === 'picture_book' ? 12 : 8

  const prompt = `
Create a story outline for a children's book with the following details:
- Characters: ${characterDescriptions}
- Category: ${category}
- Age Range: ${ageRange}
- Book Type: ${storyType}
- Number of Spreads: ${numSpreads}

Generate a JSON array of ${numSpreads} strings, where each string describes one spread (2 pages) of the book. Each spread should advance the story and include the characters appropriately.

Return ONLY a JSON array like:
["Spread 1: Introduction of characters...", "Spread 2: The adventure begins...", ...]
`

  const content = await generateStoryContent(prompt, {
    temperature: 0.7,
    max_tokens: 1000
  })

  try {
    // Try to parse as JSON array
    const outline = JSON.parse(content)
    if (Array.isArray(outline)) {
      return outline
    }
    
    // If not an array, try to extract array from the content
    const arrayMatch = content.match(/\[[\s\S]*\]/)
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0])
    }
    
    throw new Error('Could not parse outline as JSON array')
  } catch (error) {
    console.error('Error parsing story outline:', error)
    // Fallback: split by lines and filter
    return content.split('\n')
      .filter(line => line.trim().length > 0)
      .slice(0, numSpreads)
  }
}

/**
 * Generate page content (text and image prompt)
 * @param {Object} params - Page generation parameters
 * @returns {Promise<Object>} - Page content with text and visual prompt
 */
export const generatePageContent = async ({ storyData, outline, spreadIndex, spreadOutline }) => {
  const { bookCharacters, ageRange, storyType } = storyData
  const mainCharacter = bookCharacters.find(c => c.role === 'main') || bookCharacters[0]
  const supportingCharacters = bookCharacters.filter(c => c.id !== mainCharacter.id)

  let characterDescriptions = `Main Character: ${mainCharacter.name}, a ${mainCharacter.age || ''} year old ${mainCharacter.gender || 'child'}. `
  
  if (supportingCharacters.length > 0) {
    characterDescriptions += "Supporting Characters: "
    characterDescriptions += supportingCharacters.map(char =>
      `${char.name}, a ${char.age || ''} year old ${char.gender || 'child'} (${char.customRole || 'friend'})`
    ).join('; ')
  }

  const prompt = `
Generate page content for a children's book spread.

Book Details:
- Characters: ${characterDescriptions}
- Age Range: ${ageRange}
- Book Type: ${storyType}
- Current Spread: ${spreadIndex + 1}
- Spread Description: "${spreadOutline}"

Full Story Outline:
${outline.map((item, index) => `${index + 1}. ${item}`).join('\n')}

Generate content for this specific spread that includes:
1. Text that will appear on the pages (age-appropriate for ${ageRange})
2. A visual prompt for image generation

Return ONLY a JSON object:
{
  "text": "The story text for this spread...",
  "visualPrompt": "Detailed visual description for image generation..."
}
`

  const content = await generateStoryContent(prompt, {
    temperature: 0.7,
    max_tokens: 800
  })

  try {
    const pageContent = JSON.parse(content)
    return {
      text: pageContent.text || `Spread ${spreadIndex + 1} text`,
      visualPrompt: pageContent.visualPrompt || pageContent.imagePrompt || `Scene for spread ${spreadIndex + 1}`
    }
  } catch (error) {
    console.error('Error parsing page content:', error)
    return {
      text: `Spread ${spreadIndex + 1} text could not be generated.`,
      visualPrompt: `Scene for spread ${spreadIndex + 1}`
    }
  }
} 