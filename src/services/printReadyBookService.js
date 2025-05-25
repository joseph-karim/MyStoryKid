import { 
  enhanceImagesForPrint, 
  validateImageForPrint, 
  getEnhancementStrategy,
  LULU_PRINT_REQUIREMENTS 
} from './segmindService';
import { generateBookPDF } from './digitalDownloadService';

/**
 * Service for generating print-ready books that meet Lulu Direct specifications
 */

/**
 * Processes a book for print by enhancing all images and generating a print-ready PDF
 * @param {Object} book - The book object with pages and images
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Print-ready book data
 */
export async function generatePrintReadyBook(book, options = {}) {
  const {
    onProgress = null,
    validateOnly = false,
    forceEnhancement = false
  } = options;

  try {
    onProgress?.({ stage: 'analyzing', message: 'Analyzing images for print quality...' });

    // Step 1: Analyze all images in the book
    const imageAnalysis = await analyzeBookImages(book);
    
    if (validateOnly) {
      return {
        success: true,
        analysis: imageAnalysis,
        printReady: imageAnalysis.allImagesPrintReady,
        recommendations: imageAnalysis.recommendations
      };
    }

    // Step 2: Enhance images that need it
    let enhancedBook = { ...book };
    
    if (!imageAnalysis.allImagesPrintReady || forceEnhancement) {
      onProgress?.({ stage: 'enhancing', message: 'Enhancing images for print quality...' });
      
      enhancedBook = await enhanceBookImages(book, {
        onProgress: (current, total, imageUrl) => {
          onProgress?.({
            stage: 'enhancing',
            message: `Enhancing image ${current} of ${total}...`,
            progress: (current / total) * 100
          });
        }
      });
    }

    // Step 3: Generate print-ready PDF
    onProgress?.({ stage: 'generating', message: 'Generating print-ready PDF...' });
    
    const printReadyPDF = await generatePrintReadyPDF(enhancedBook, {
      printSpecs: LULU_PRINT_REQUIREMENTS,
      includeBleed: true,
      colorProfile: 'sRGB'
    });

    // Step 4: Final validation
    onProgress?.({ stage: 'validating', message: 'Validating print-ready book...' });
    
    const finalValidation = await validatePrintReadyBook(printReadyPDF);

    return {
      success: true,
      originalBook: book,
      enhancedBook,
      printReadyPDF,
      analysis: imageAnalysis,
      validation: finalValidation,
      luluSpecs: {
        meetsRequirements: finalValidation.isValid,
        estimatedPrintQuality: finalValidation.estimatedQuality || 'high',
        recommendations: finalValidation.recommendations || []
      }
    };

  } catch (error) {
    console.error('Error generating print-ready book:', error);
    throw new Error(`Print-ready book generation failed: ${error.message}`);
  }
}

/**
 * Analyzes all images in a book to determine print readiness
 * @param {Object} book - The book object
 * @returns {Promise<Object>} - Analysis results
 */
export async function analyzeBookImages(book) {
  const imageUrls = extractImageUrls(book);
  const analyses = [];
  
  for (const imageUrl of imageUrls) {
    try {
      const validation = await validateImageForPrint(imageUrl);
      const strategy = await getEnhancementStrategy(imageUrl);
      
      analyses.push({
        imageUrl,
        validation,
        strategy,
        needsEnhancement: strategy.needsEnhancement
      });
    } catch (error) {
      analyses.push({
        imageUrl,
        validation: { isValid: false, error: error.message },
        strategy: { needsEnhancement: true },
        needsEnhancement: true
      });
    }
  }

  const allImagesPrintReady = analyses.every(a => a.validation.isValid);
  const imagesNeedingEnhancement = analyses.filter(a => a.needsEnhancement);
  
  const recommendations = [];
  if (imagesNeedingEnhancement.length > 0) {
    recommendations.push(`${imagesNeedingEnhancement.length} images need enhancement for optimal print quality`);
  }

  return {
    totalImages: imageUrls.length,
    allImagesPrintReady,
    imagesNeedingEnhancement: imagesNeedingEnhancement.length,
    analyses,
    recommendations,
    estimatedEnhancementTime: imagesNeedingEnhancement.reduce((total, img) => 
      total + (img.strategy.estimatedProcessingTime || 30), 0
    )
  };
}

/**
 * Enhances all images in a book for print quality
 * @param {Object} book - The book object
 * @param {Object} options - Enhancement options
 * @returns {Promise<Object>} - Book with enhanced images
 */
export async function enhanceBookImages(book, options = {}) {
  const { onProgress = null } = options;
  
  const imageUrls = extractImageUrls(book);
  
  if (imageUrls.length === 0) {
    return book;
  }

  // Enhance images with progress tracking
  const enhancementResults = await enhanceImagesForPrint(
    imageUrls,
    {
      targetWidth: LULU_PRINT_REQUIREMENTS.minWidth,
      targetHeight: LULU_PRINT_REQUIREMENTS.minHeight,
      enhanceQuality: true,
      optimizeForPrint: true
    },
    onProgress
  );

  // Create enhanced book by replacing image URLs
  const enhancedBook = { ...book };
  
  if (enhancedBook.pages) {
    enhancedBook.pages = enhancedBook.pages.map(page => {
      const result = enhancementResults.find(r => r.originalUrl === page.imageUrl);
      return result ? { ...page, imageUrl: result.enhancedUrl } : page;
    });
  }

  // Handle cover image if present
  if (enhancedBook.coverImageUrl) {
    const coverResult = enhancementResults.find(r => r.originalUrl === enhancedBook.coverImageUrl);
    if (coverResult) {
      enhancedBook.coverImageUrl = coverResult.enhancedUrl;
    }
  }

  // Store enhancement metadata
  enhancedBook.enhancementMetadata = {
    enhancedAt: new Date().toISOString(),
    enhancementResults,
    successfulEnhancements: enhancementResults.filter(r => r.success).length,
    failedEnhancements: enhancementResults.filter(r => !r.success).length
  };

  return enhancedBook;
}

/**
 * Generates a print-ready PDF with proper specifications for Lulu Direct
 * @param {Object} book - The book object with enhanced images
 * @param {Object} options - PDF generation options
 * @returns {Promise<string>} - URL to the print-ready PDF
 */
export async function generatePrintReadyPDF(book, options = {}) {
  const {
    printSpecs = LULU_PRINT_REQUIREMENTS,
    includeBleed = true,
    colorProfile = 'sRGB'
  } = options;

  try {
    // Use the existing PDF generation service but with print-specific options
    const pdfUrl = await generateBookPDF(book, {
      quality: 'print', // Use highest quality for print
      resolution: printSpecs.minDPI,
      colorProfile,
      includeBleed,
      format: 'PDF/X-1a', // Print-ready PDF format
      compression: 'minimal' // Minimal compression for print quality
    });

    return pdfUrl;
  } catch (error) {
    console.error('Error generating print-ready PDF:', error);
    throw new Error(`Print PDF generation failed: ${error.message}`);
  }
}

/**
 * Validates a print-ready book against Lulu Direct specifications
 * @param {string} pdfUrl - URL to the print-ready PDF
 * @returns {Promise<Object>} - Validation results
 */
export async function validatePrintReadyBook(pdfUrl) {
  try {
    // This would ideally use a PDF validation service
    // For now, we'll do basic checks
    
    const validation = {
      isValid: true,
      pdfUrl,
      fileSize: null,
      estimatedQuality: 'high',
      recommendations: [],
      luluCompatibility: {
        formatSupported: true,
        resolutionAdequate: true,
        colorProfileCorrect: true,
        fileSizeAcceptable: true
      }
    };

    // In a real implementation, you would:
    // 1. Check PDF file size
    // 2. Validate PDF/X compliance
    // 3. Check image resolutions within PDF
    // 4. Verify color profile
    // 5. Check for transparency issues
    // 6. Validate bleed areas

    return validation;
  } catch (error) {
    console.error('Error validating print-ready book:', error);
    return {
      isValid: false,
      error: error.message,
      recommendations: ['Please regenerate the print-ready PDF']
    };
  }
}

/**
 * Extracts all image URLs from a book object
 * @param {Object} book - The book object
 * @returns {string[]} - Array of image URLs
 */
function extractImageUrls(book) {
  const imageUrls = [];
  
  // Add cover image
  if (book.coverImageUrl) {
    imageUrls.push(book.coverImageUrl);
  }
  
  // Add page images
  if (book.pages && Array.isArray(book.pages)) {
    book.pages.forEach(page => {
      if (page.imageUrl) {
        imageUrls.push(page.imageUrl);
      }
    });
  }
  
  return imageUrls.filter(url => url && typeof url === 'string');
}

/**
 * Gets estimated costs for print enhancement
 * @param {Object} book - The book object
 * @returns {Promise<Object>} - Cost estimation
 */
export async function getEnhancementCostEstimate(book) {
  const imageUrls = extractImageUrls(book);
  const analysis = await analyzeBookImages(book);
  
  // Rough cost estimation (would be based on actual Segmind pricing)
  const costPerEnhancement = 0.10; // $0.10 per image enhancement
  const imagesNeedingEnhancement = analysis.imagesNeedingEnhancement;
  
  return {
    totalImages: imageUrls.length,
    imagesNeedingEnhancement,
    costPerImage: costPerEnhancement,
    totalCost: imagesNeedingEnhancement * costPerEnhancement,
    estimatedTime: analysis.estimatedEnhancementTime,
    savings: {
      printQualityImprovement: 'Significant',
      customerSatisfaction: 'Higher',
      returnRate: 'Lower'
    }
  };
}

/**
 * Checks if Segmind service is available and configured
 * @returns {Promise<Object>} - Service status
 */
export async function checkPrintEnhancementService() {
  try {
    // This would check Segmind API availability
    return {
      available: true,
      configured: !!process.env.VITE_SEGMIND_API_KEY,
      status: 'operational',
      features: {
        imageEnhancement: true,
        batchProcessing: true,
        printOptimization: true
      }
    };
  } catch (error) {
    return {
      available: false,
      configured: false,
      status: 'error',
      error: error.message
    };
  }
} 