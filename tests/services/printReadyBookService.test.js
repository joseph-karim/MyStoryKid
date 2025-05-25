import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as printReadyBookService from '../../src/services/printReadyBookService';
import * as segmindService from '../../src/services/segmindService';
import * as digitalDownloadService from '../../src/services/digitalDownloadService';

// Mock the dependencies
vi.mock('../../src/services/segmindService', () => ({
  enhanceImagesForPrint: vi.fn(),
  validateImageForPrint: vi.fn(),
  getEnhancementStrategy: vi.fn(),
  LULU_PRINT_REQUIREMENTS: {
    minDPI: 300,
    minWidth: 2400,
    minHeight: 2400,
    colorProfile: 'sRGB',
    maxFileSize: 50 * 1024 * 1024,
    formats: ['PNG', 'JPEG', 'PDF']
  }
}));

vi.mock('../../src/services/digitalDownloadService', () => ({
  generateBookPDF: vi.fn()
}));

describe('Print-Ready Book Service', () => {
  const mockBook = {
    id: 'test-book-123',
    title: 'Test Story',
    coverImageUrl: 'https://example.com/cover.jpg',
    pages: [
      { id: 1, imageUrl: 'https://example.com/page1.jpg', text: 'Page 1 content' },
      { id: 2, imageUrl: 'https://example.com/page2.jpg', text: 'Page 2 content' },
      { id: 3, imageUrl: 'https://example.com/page3.jpg', text: 'Page 3 content' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations
    segmindService.validateImageForPrint.mockResolvedValue({
      isValid: false,
      width: 1024,
      height: 1024,
      meetsMinWidth: false,
      meetsMinHeight: false,
      estimatedDPI: 128,
      recommendations: ['Width should be at least 2400px for print quality']
    });

    segmindService.getEnhancementStrategy.mockResolvedValue({
      needsEnhancement: true,
      recommendedScale: "2x",
      useAdvancedEnhancement: true,
      estimatedProcessingTime: 45
    });

    segmindService.enhanceImagesForPrint.mockResolvedValue([
      {
        originalUrl: 'https://example.com/cover.jpg',
        enhancedUrl: 'https://segmind.com/enhanced/cover.jpg',
        success: true,
        error: null
      },
      {
        originalUrl: 'https://example.com/page1.jpg',
        enhancedUrl: 'https://segmind.com/enhanced/page1.jpg',
        success: true,
        error: null
      },
      {
        originalUrl: 'https://example.com/page2.jpg',
        enhancedUrl: 'https://segmind.com/enhanced/page2.jpg',
        success: true,
        error: null
      },
      {
        originalUrl: 'https://example.com/page3.jpg',
        enhancedUrl: 'https://segmind.com/enhanced/page3.jpg',
        success: true,
        error: null
      }
    ]);

    digitalDownloadService.generateBookPDF.mockResolvedValue('https://example.com/print-ready.pdf');
  });

  describe('analyzeBookImages', () => {
    it('should analyze all images in a book', async () => {
      const analysis = await printReadyBookService.analyzeBookImages(mockBook);

      expect(analysis).toEqual({
        totalImages: 4, // cover + 3 pages
        allImagesPrintReady: false,
        imagesNeedingEnhancement: 4,
        analyses: expect.arrayContaining([
          expect.objectContaining({
            imageUrl: 'https://example.com/cover.jpg',
            needsEnhancement: true
          })
        ]),
        recommendations: ['4 images need enhancement for optimal print quality'],
        estimatedEnhancementTime: 180 // 4 images * 45 seconds each
      });

      expect(segmindService.validateImageForPrint).toHaveBeenCalledTimes(4);
      expect(segmindService.getEnhancementStrategy).toHaveBeenCalledTimes(4);
    });

    it('should handle books with no images', async () => {
      const emptyBook = { id: 'empty', title: 'Empty Book', pages: [] };
      const analysis = await printReadyBookService.analyzeBookImages(emptyBook);

      expect(analysis.totalImages).toBe(0);
      expect(analysis.allImagesPrintReady).toBe(true);
      expect(analysis.imagesNeedingEnhancement).toBe(0);
    });
  });

  describe('enhanceBookImages', () => {
    it('should enhance all images in a book', async () => {
      const enhancedBook = await printReadyBookService.enhanceBookImages(mockBook);

      expect(enhancedBook.coverImageUrl).toBe('https://segmind.com/enhanced/cover.jpg');
      expect(enhancedBook.pages[0].imageUrl).toBe('https://segmind.com/enhanced/page1.jpg');
      expect(enhancedBook.pages[1].imageUrl).toBe('https://segmind.com/enhanced/page2.jpg');
      expect(enhancedBook.pages[2].imageUrl).toBe('https://segmind.com/enhanced/page3.jpg');

      expect(enhancedBook.enhancementMetadata).toEqual({
        enhancedAt: expect.any(String),
        enhancementResults: expect.any(Array),
        successfulEnhancements: 4,
        failedEnhancements: 0
      });

      expect(segmindService.enhanceImagesForPrint).toHaveBeenCalledWith(
        ['https://example.com/cover.jpg', 'https://example.com/page1.jpg', 'https://example.com/page2.jpg', 'https://example.com/page3.jpg'],
        {
          targetWidth: 2400,
          targetHeight: 2400,
          enhanceQuality: true,
          optimizeForPrint: true
        },
        null
      );
    });

    it('should handle enhancement failures gracefully', async () => {
      segmindService.enhanceImagesForPrint.mockResolvedValue([
        {
          originalUrl: 'https://example.com/cover.jpg',
          enhancedUrl: 'https://example.com/cover.jpg', // Fallback to original
          success: false,
          error: 'Enhancement failed'
        },
        {
          originalUrl: 'https://example.com/page1.jpg',
          enhancedUrl: 'https://segmind.com/enhanced/page1.jpg',
          success: true,
          error: null
        }
      ]);

      const enhancedBook = await printReadyBookService.enhanceBookImages({
        ...mockBook,
        pages: [mockBook.pages[0]] // Only one page for this test
      });

      expect(enhancedBook.coverImageUrl).toBe('https://example.com/cover.jpg'); // Original URL
      expect(enhancedBook.pages[0].imageUrl).toBe('https://segmind.com/enhanced/page1.jpg');
      expect(enhancedBook.enhancementMetadata.successfulEnhancements).toBe(1);
      expect(enhancedBook.enhancementMetadata.failedEnhancements).toBe(1);
    });
  });

  describe('generatePrintReadyBook', () => {
    it('should generate a complete print-ready book', async () => {
      const progressCallback = vi.fn();
      
      const result = await printReadyBookService.generatePrintReadyBook(mockBook, {
        onProgress: progressCallback
      });

      expect(result.success).toBe(true);
      expect(result.originalBook).toEqual(mockBook);
      expect(result.enhancedBook.coverImageUrl).toBe('https://segmind.com/enhanced/cover.jpg');
      expect(result.printReadyPDF).toBe('https://example.com/print-ready.pdf');
      expect(result.luluSpecs.meetsRequirements).toBe(true);

      // Verify progress callbacks were called
      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'analyzing',
        message: 'Analyzing images for print quality...'
      });
      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'enhancing',
        message: 'Enhancing images for print quality...'
      });
      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'generating',
        message: 'Generating print-ready PDF...'
      });
      expect(progressCallback).toHaveBeenCalledWith({
        stage: 'validating',
        message: 'Validating print-ready book...'
      });
    });

    it('should handle validation-only mode', async () => {
      const result = await printReadyBookService.generatePrintReadyBook(mockBook, {
        validateOnly: true
      });

      expect(result.success).toBe(true);
      expect(result.printReady).toBe(false);
      expect(result.analysis.totalImages).toBe(4);
      expect(segmindService.enhanceImagesForPrint).not.toHaveBeenCalled();
      expect(digitalDownloadService.generateBookPDF).not.toHaveBeenCalled();
    });

    it('should skip enhancement if all images are already print-ready', async () => {
      // Mock all images as already print-ready
      segmindService.validateImageForPrint.mockResolvedValue({
        isValid: true,
        width: 2400,
        height: 2400,
        meetsMinWidth: true,
        meetsMinHeight: true,
        estimatedDPI: 300,
        recommendations: []
      });

      segmindService.getEnhancementStrategy.mockResolvedValue({
        needsEnhancement: false,
        recommendedScale: "1x",
        useAdvancedEnhancement: false,
        estimatedProcessingTime: 0
      });

      const result = await printReadyBookService.generatePrintReadyBook(mockBook);

      expect(result.success).toBe(true);
      expect(result.enhancedBook.coverImageUrl).toBe('https://example.com/cover.jpg'); // Original URLs
      expect(segmindService.enhanceImagesForPrint).not.toHaveBeenCalled();
    });

    it('should force enhancement when requested', async () => {
      // Mock all images as already print-ready
      segmindService.validateImageForPrint.mockResolvedValue({
        isValid: true,
        width: 2400,
        height: 2400,
        meetsMinWidth: true,
        meetsMinHeight: true,
        estimatedDPI: 300,
        recommendations: []
      });

      const result = await printReadyBookService.generatePrintReadyBook(mockBook, {
        forceEnhancement: true
      });

      expect(result.success).toBe(true);
      expect(segmindService.enhanceImagesForPrint).toHaveBeenCalled();
    });
  });

  describe('getEnhancementCostEstimate', () => {
    it('should calculate enhancement costs correctly', async () => {
      const costEstimate = await printReadyBookService.getEnhancementCostEstimate(mockBook);

      expect(costEstimate).toEqual({
        totalImages: 4,
        imagesNeedingEnhancement: 4,
        costPerImage: 0.10,
        totalCost: 0.40, // 4 images * $0.10
        estimatedTime: 180, // 4 images * 45 seconds
        savings: {
          printQualityImprovement: 'Significant',
          customerSatisfaction: 'Higher',
          returnRate: 'Lower'
        }
      });
    });

    it('should handle books with no enhancement needed', async () => {
      segmindService.getEnhancementStrategy.mockResolvedValue({
        needsEnhancement: false,
        estimatedProcessingTime: 0
      });

      const costEstimate = await printReadyBookService.getEnhancementCostEstimate(mockBook);

      expect(costEstimate.totalCost).toBe(0);
      expect(costEstimate.imagesNeedingEnhancement).toBe(0);
    });
  });

  describe('checkPrintEnhancementService', () => {
    it('should return service availability status', async () => {
      const status = await printReadyBookService.checkPrintEnhancementService();

      expect(status).toEqual({
        available: true,
        configured: false, // No API key in test environment
        status: 'operational',
        features: {
          imageEnhancement: true,
          batchProcessing: true,
          printOptimization: true
        }
      });
    });
  });

  describe('generatePrintReadyPDF', () => {
    it('should generate PDF with print specifications', async () => {
      const enhancedBook = {
        ...mockBook,
        enhancementMetadata: {
          enhancedAt: new Date().toISOString(),
          successfulEnhancements: 4
        }
      };

      const pdfUrl = await printReadyBookService.generatePrintReadyPDF(enhancedBook);

      expect(pdfUrl).toBe('https://example.com/print-ready.pdf');
      expect(digitalDownloadService.generateBookPDF).toHaveBeenCalledWith(enhancedBook, {
        quality: 'print',
        resolution: 300,
        colorProfile: 'sRGB',
        includeBleed: true,
        format: 'PDF/X-1a',
        compression: 'minimal'
      });
    });

    it('should handle PDF generation errors', async () => {
      digitalDownloadService.generateBookPDF.mockRejectedValue(new Error('PDF generation failed'));

      await expect(printReadyBookService.generatePrintReadyPDF(mockBook))
        .rejects.toThrow('Print PDF generation failed: PDF generation failed');
    });
  });

  describe('validatePrintReadyBook', () => {
    it('should validate a print-ready PDF', async () => {
      const validation = await printReadyBookService.validatePrintReadyBook('https://example.com/test.pdf');

      expect(validation).toEqual({
        isValid: true,
        pdfUrl: 'https://example.com/test.pdf',
        fileSize: null,
        estimatedQuality: 'high',
        recommendations: [],
        luluCompatibility: {
          formatSupported: true,
          resolutionAdequate: true,
          colorProfileCorrect: true,
          fileSizeAcceptable: true
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle service errors gracefully', async () => {
      // Mock a more severe error that would actually cause the function to fail
      segmindService.enhanceImagesForPrint.mockRejectedValue(new Error('Service unavailable'));
      segmindService.validateImageForPrint.mockRejectedValue(new Error('Service unavailable'));

      await expect(printReadyBookService.generatePrintReadyBook(mockBook))
        .rejects.toThrow('Print-ready book generation failed');
    });

    it('should handle network errors during enhancement', async () => {
      segmindService.enhanceImagesForPrint.mockRejectedValue(new Error('Network error'));

      await expect(printReadyBookService.enhanceBookImages(mockBook))
        .rejects.toThrow('Network error');
    });
  });
}); 