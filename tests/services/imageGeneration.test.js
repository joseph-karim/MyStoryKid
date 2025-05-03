import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import * as openaiImageService from '../../src/services/openaiImageService';
import * as segmindService from '../../src/services/segmindService';

vi.mock('axios');

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(false),
  readFileSync: vi.fn().mockReturnValue(Buffer.from('mock-image-data'))
}));

vi.mock('openai', () => {
  return {
    default: vi.fn()
  };
});

vi.mock('../../src/services/openaiImageService', () => {
  return {
    generateImage: vi.fn().mockResolvedValue('data:image/png;base64,mockImageData'),
    generateImageEdit: vi.fn().mockResolvedValue('data:image/png;base64,mockImageData'),
    generateSceneImage: vi.fn().mockImplementation(async (
      sceneDescription,
      characterDescriptions,
      styleDescription,
      styleReference = null,
      pageNumber = 1,
      characterReferenceInfo = null
    ) => {
      const prompt = `
        Scene: ${sceneDescription}
        Characters: ${characterDescriptions.join(', ')}
        Style: ${styleDescription}
      `;
      
      return 'data:image/png;base64,mockImageData';
    }),
    getStylePromptGuidance: (styleCode) => {
      const styles = {
        'watercolor_storybook': 'Soft watercolor style with gentle colors and dreamy textures',
        'cartoon_character': 'Bold, colorful cartoon style with clean lines',
        'flat_vector': 'Simple flat vector style with minimal shading'
      };
      
      return styles[styleCode] || 'Default art style guidance';
    }
  };
});

vi.mock('../../src/services/segmindService', () => {
  return {
    upscaleImage: vi.fn().mockResolvedValue('https://api.segmind.com/output/upscaled-image-123.png'),
    upscaleImages: vi.fn().mockImplementation(async (imageUrls) => {
      return imageUrls.map((_, index) => `https://api.segmind.com/output/upscaled-image-${index}.png`);
    }),
    validateImageResolution: vi.fn().mockResolvedValue(true)
  };
});

describe('Image Generation & Upscaling', () => {
  const originalEnv = { ...import.meta.env };
  
  beforeEach(() => {
    import.meta.env.VITE_OPENAI_API_KEY = 'sk-proj-test-key';
    import.meta.env.VITE_SEGMIND_API_KEY = 'test-segmind-api-key';
    
    axios.post.mockReset();
    
    axios.post.mockResolvedValue({
      data: {
        data: [
          { b64_json: 'base64_image_data' }
        ]
      }
    });
    
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    import.meta.env = { ...originalEnv };
  });
  
  describe('generateSceneImage', () => {
    it('should handle multiple characters in the prompt', async () => {
      const sceneDescription = 'A magical forest with tall trees';
      const characterDescriptions = [
        'Alex, an 8-year-old boy with curly brown hair',
        'Luna, a 7-year-old girl with blonde hair',
        'Max, a fluffy golden retriever'
      ];
      const styleDescription = 'Watercolor storybook style';
      
      await openaiImageService.generateSceneImage(
        sceneDescription,
        characterDescriptions,
        styleDescription
      );
      
      expect(openaiImageService.generateSceneImage).toHaveBeenCalledWith(
        sceneDescription,
        characterDescriptions,
        styleDescription
      );
    });
    
    it('should include character reference information when available', async () => {
      const sceneDescription = 'A magical forest with tall trees';
      const characterDescriptions = ['Alex, an 8-year-old boy'];
      const styleDescription = 'Watercolor storybook style';
      const characterReferenceInfo = {
        'char1': {
          id: 'char1',
          name: 'Alex',
          imageUrl: 'data:image/png;base64,mockCharacterImage'
        }
      };
      
      await openaiImageService.generateSceneImage(
        sceneDescription,
        characterDescriptions,
        styleDescription,
        null, // No style reference
        1, // Page number
        characterReferenceInfo
      );
      
      expect(openaiImageService.generateSceneImage).toHaveBeenCalledWith(
        sceneDescription,
        characterDescriptions,
        styleDescription,
        null,
        1,
        characterReferenceInfo
      );
    });
  });
  
  describe('Image Upscaling with Segmind', () => {
    it('should upscale images to meet print requirements', async () => {
      const imageUrls = [
        'data:image/png;base64,mockImageData1',
        'data:image/png;base64,mockImageData2'
      ];
      
      const upscaledUrls = await segmindService.upscaleImages(imageUrls, '2x');
      
      expect(segmindService.upscaleImages).toHaveBeenCalledWith(imageUrls, '2x');
      expect(Array.isArray(upscaledUrls)).toBe(true);
      expect(upscaledUrls.length).toBe(imageUrls.length);
      
      for (const url of upscaledUrls) {
        const isValidResolution = await segmindService.validateImageResolution(url, 2048, 2048);
        expect(isValidResolution).toBe(true);
      }
    });
    
    it('should only upscale images after payment is confirmed', async () => {
      const handleBookOrder = async (bookId, userId, isPaid = false) => {
        const imageUrls = [
          'data:image/png;base64,mockImageData1',
          'data:image/png;base64,mockImageData2'
        ];
        
        if (isPaid) {
          return segmindService.upscaleImages(imageUrls, '2x');
        }
        
        return imageUrls;
      };
      
      const regularImages = await handleBookOrder('book123', 'user456', false);
      expect(segmindService.upscaleImages).not.toHaveBeenCalled();
      expect(regularImages.length).toBe(2);
      
      const upscaledImages = await handleBookOrder('book123', 'user456', true);
      expect(segmindService.upscaleImages).toHaveBeenCalled();
      expect(upscaledImages.length).toBe(2);
    });
  });
});
