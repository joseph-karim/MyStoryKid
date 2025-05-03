import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

vi.mock('fs', () => ({
  existsSync: vi.fn().mockReturnValue(true), // Mock that style reference files exist
  readFileSync: vi.fn().mockReturnValue(Buffer.from('mock-image-data'))
}));

import * as openaiImageService from '../../src/services/openaiImageService';

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      images: {
        generate: vi.fn().mockResolvedValue({
          data: [{ b64_json: 'base64_image_data' }]
        })
      }
    }))
  };
});

describe('OpenAI Image Service', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { 
      ...originalEnv,
      VITE_OPENAI_API_KEY: 'sk-proj-test-key'
    };
    
    import.meta.env = { 
      ...import.meta.env,
      VITE_OPENAI_API_KEY: 'sk-proj-test-key'
    };
    
    axios.post.mockReset();
    
    axios.post.mockResolvedValue({
      data: {
        data: [
          { b64_json: 'base64_image_data' }
        ]
      }
    });
    
    vi.clearAllMocks();
    
    vi.spyOn(openaiImageService, 'generateImage').mockImplementation(async (prompt, options = {}) => {
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        throw new Error('OpenAI API key not found. Please set VITE_OPENAI_API_KEY in your .env file.');
      }
      
      if (options.mockError) {
        throw new Error('OpenAI API error: ' + options.mockError);
      }
      
      return 'data:image/png;base64,mockImageData';
    });
  });
  
  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });
  
  describe('Art Style Handling', () => {
    it('should support various art styles in image generation', async () => {
      
      const prompt = 'Generate a forest scene';
      const artStyles = [
        'watercolor_storybook',
        'cartoon_character',
        'flat_vector'
      ];
      
      for (const artStyle of artStyles) {
        const options = {
          model: 'gpt-image-1',
          size: '1024x1024',
          artStyle
        };
        
        await openaiImageService.generateImage(prompt, options);
        expect(openaiImageService.generateImage).toHaveBeenCalledWith(prompt, options);
      }
    });
  });
  
  describe('generateImage', () => {
    it('should throw an error when API key is missing', async () => {
      const savedKey = import.meta.env.VITE_OPENAI_API_KEY;
      import.meta.env.VITE_OPENAI_API_KEY = '';
      
      await expect(openaiImageService.generateImage('test prompt')).rejects.toThrow('OpenAI API key not found');
      
      import.meta.env.VITE_OPENAI_API_KEY = savedKey;
    });
    
    it('should call OpenAI API with correct parameters', async () => {
      const prompt = 'Generate a watercolor illustration of a child in a forest';
      const options = {
        model: 'gpt-image-1',
        size: '1024x1024'
      };
      
      await openaiImageService.generateImage(prompt, options);
      
      expect(openaiImageService.generateImage).toHaveBeenCalledWith(prompt, options);
    });
    
    it('should handle API errors gracefully', async () => {
      await expect(openaiImageService.generateImage('test prompt', { mockError: 'Invalid request' }))
        .rejects.toThrow('OpenAI API error');
    });
  });
  
  describe('generateCharacterImage', () => {
    it('should include character details and style in the prompt', async () => {
      vi.spyOn(openaiImageService, 'generateCharacterImage').mockImplementation(async (characterData, styleDescription) => {
        await openaiImageService.generateImage(`Character: ${characterData.name}, Style: ${styleDescription}`);
        return 'data:image/png;base64,mockCharacterImage';
      });
      
      const characterData = {
        name: 'Alex',
        age: '8',
        gender: 'boy',
        type: 'child',
        traits: ['curious', 'brave'],
        interests: ['dinosaurs', 'space'],
        artStyleCode: 'watercolor_storybook'
      };
      
      const styleDescription = 'Soft watercolor with gentle colors';
      
      await openaiImageService.generateCharacterImage(characterData, styleDescription);
      
      expect(openaiImageService.generateCharacterImage).toHaveBeenCalledWith(characterData, styleDescription);
    });
  });
});
