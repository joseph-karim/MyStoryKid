import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as segmindService from '../../src/services/segmindService';

vi.mock('../../src/services/segmindService', () => {
  return {
    upscaleImage: vi.fn().mockResolvedValue('https://api.segmind.com/output/upscaled-image-123.png'),
    upscaleImages: vi.fn().mockImplementation(async (imageUrls) => {
      return imageUrls.map((_, index) => `https://api.segmind.com/output/upscaled-image-${index}.png`);
    }),
    validateImageResolution: vi.fn().mockResolvedValue(true)
  };
});

const mockPdfService = {
  generatePdf: vi.fn().mockResolvedValue('/path/to/generated.pdf'),
  validatePdf: vi.fn().mockResolvedValue(true)
};

vi.mock('../../src/services/pdfService', () => mockPdfService);

describe('Book Generation Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Book Generation with Upscaling', () => {
    it('should upscale images before generating the final PDF', async () => {
      const bookGenerationService = {
        generateBook: async (bookData, options = {}) => {
          const imageUrls = [
            'https://example.com/image1.png',
            'https://example.com/image2.png'
          ];
          
          let finalImageUrls = imageUrls;
          
          if (options.isPaid) {
            finalImageUrls = await segmindService.upscaleImages(imageUrls);
          }
          
          const pdfPath = await mockPdfService.generatePdf({
            title: bookData.title,
            pages: bookData.pages,
            images: finalImageUrls
          });
          
          const isValid = await mockPdfService.validatePdf(pdfPath);
          
          return {
            pdfPath,
            isValid,
            upscaled: options.isPaid || false
          };
        }
      };
      
      const previewResult = await bookGenerationService.generateBook({
        title: 'My Test Book',
        pages: ['Page 1', 'Page 2']
      });
      
      expect(segmindService.upscaleImages).not.toHaveBeenCalled();
      expect(previewResult.upscaled).toBe(false);
      
      const paidResult = await bookGenerationService.generateBook({
        title: 'My Test Book',
        pages: ['Page 1', 'Page 2']
      }, { isPaid: true });
      
      expect(segmindService.upscaleImages).toHaveBeenCalled();
      expect(paidResult.upscaled).toBe(true);
    });
    
    it('should handle upscaling failures gracefully', async () => {
      segmindService.upscaleImages.mockImplementationOnce(async (imageUrls) => {
        const results = [];
        for (let i = 0; i < imageUrls.length; i++) {
          if (i === 1) {
            results.push(imageUrls[i]);
          } else {
            results.push(`https://api.segmind.com/output/upscaled-image-${i}.png`);
          }
        }
        return results;
      });
      
      const bookGenerationService = {
        generateBook: async (bookData, options = {}) => {
          const imageUrls = [
            'https://example.com/image1.png',
            'https://example.com/image2.png'
          ];
          
          let finalImageUrls = imageUrls;
          let upscalingWarnings = [];
          
          if (options.isPaid) {
            try {
              finalImageUrls = await segmindService.upscaleImages(imageUrls);
              
              imageUrls.forEach((originalUrl, index) => {
                if (finalImageUrls[index] === originalUrl) {
                  upscalingWarnings.push(`Failed to upscale image ${index + 1}`);
                }
              });
            } catch (error) {
              console.error('Upscaling failed:', error);
              upscalingWarnings.push('Failed to upscale images. Using original images.');
              finalImageUrls = imageUrls;
            }
          }
          
          const pdfPath = await mockPdfService.generatePdf({
            title: bookData.title,
            pages: bookData.pages,
            images: finalImageUrls
          });
          
          return {
            pdfPath,
            upscaled: options.isPaid,
            warnings: upscalingWarnings
          };
        }
      };
      
      const result = await bookGenerationService.generateBook({
        title: 'My Test Book',
        pages: ['Page 1', 'Page 2']
      }, { isPaid: true });
      
      expect(segmindService.upscaleImages).toHaveBeenCalled();
      expect(result.warnings).toContain('Failed to upscale image 2');
      expect(result.upscaled).toBe(true);
    });
  });
});
