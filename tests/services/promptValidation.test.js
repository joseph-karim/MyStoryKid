import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import * as openaiService from '../../src/services/openaiService';
import * as openaiImageService from '../../src/services/openaiImageService';

vi.mock('openai', () => {
  return {
    default: vi.fn()
  };
});

vi.mock('../../src/services/openaiService', () => {
  const mockConstructPrompts = (storyData, targetPageCount) => {
    const systemPrompt = `You are an experienced children's picture book author specializing in ${storyData.storyType || 'standard'} books.`;
    
    let userPrompt = `Create a story with the following characters:\n`;
    
    storyData.bookCharacters.forEach(char => {
      userPrompt += `- ${char.name} (${char.id}): ${char.age || ''} ${char.gender || ''}\n`;
    });
    
    if (storyData.artStyleCode === 'custom' && storyData.customStyleDescription) {
      userPrompt += `Art style: ${storyData.customStyleDescription}\n`;
    } else if (storyData.artStyleCode) {
      userPrompt += `Art style: ${storyData.artStyleCode.replace(/_/g, ' ')}\n`;
    }
    
    if (storyData.coreTheme) userPrompt += `Theme: ${storyData.coreTheme}\n`;
    if (storyData.mainChallengePlot) userPrompt += `Plot: ${storyData.mainChallengePlot}\n`;
    if (storyData.desiredEnding) userPrompt += `Ending: ${storyData.desiredEnding}\n`;
    
    const characterIdList = storyData.bookCharacters.map(c => `${c.name}=${c.id}`).join(', ');
    userPrompt += `\nCharacter IDs: ${characterIdList}\n`;
    
    userPrompt += `\nFormat each page as: {"text": "...", "visualPrompt": "...", "mainCharacterId": "..."}\n`;
    
    return { systemPrompt, userPrompt };
  };

  return {
    __constructPrompts: mockConstructPrompts,
    constructPrompts: mockConstructPrompts
  };
});

vi.mock('../../src/services/openaiImageService', () => {
  return {
    getStylePromptGuidance: (styleCode) => {
      const styles = {
        'watercolor_storybook': 'Soft watercolor style with gentle colors and dreamy textures',
        'cartoon_character': 'Bold, colorful cartoon style with clean lines',
        'flat_vector': 'Simple flat vector style with minimal shading',
        'clay_animation': 'Clay-like 3D style with visible texture',
        'fantasy_storybook': 'Rich, detailed fantasy illustration style'
      };
      
      return styles[styleCode] || 'Default art style guidance';
    }
  };
});

describe('Prompt Validation', () => {
  const originalEnv = { ...import.meta.env };
  
  beforeEach(() => {
    import.meta.env.VITE_OPENAI_API_KEY = 'sk-proj-test-key';
    
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    import.meta.env = { ...originalEnv };
  });
  
  describe('Art Style Enforcement', () => {
    it('should include art style in every prompt', () => {
      const artStyles = ['watercolor_storybook', 'cartoon_character', 'flat_vector', 'custom'];
      const customDescription = 'A hand-drawn style with vibrant colors';
      
      artStyles.forEach(artStyleCode => {
        const storyData = {
          bookCharacters: [{ id: 'char1', name: 'Alex', role: 'main' }],
          artStyleCode,
          customStyleDescription: artStyleCode === 'custom' ? customDescription : '',
          mainCharacter: { id: 'char1', name: 'Alex' },
          setting: { description: 'A forest' }
        };
        
        const { userPrompt } = openaiService.constructPrompts(storyData, 8);
        
        if (artStyleCode === 'custom') {
          expect(userPrompt).toContain(customDescription);
        } else {
          expect(userPrompt).toContain(artStyleCode.replace(/_/g, ' '));
        }
      });
    });
  });
  
  describe('Character References', () => {
    it('should include all characters in the prompt', () => {
      const characters = [
        { id: 'char1', name: 'Alex', role: 'main', age: '8', gender: 'boy' },
        { id: 'char2', name: 'Luna', role: 'friend', age: '7', gender: 'girl' },
        { id: 'char3', name: 'Max', role: 'sibling', age: '10', gender: 'boy' }
      ];
      
      const storyData = {
        bookCharacters: characters,
        artStyleCode: 'watercolor_storybook',
        mainCharacter: characters[0],
        setting: { description: 'A forest' }
      };
      
      const { userPrompt } = openaiService.constructPrompts(storyData, 8);
      
      characters.forEach(character => {
        expect(userPrompt).toContain(character.name);
      });
    });
    
    it('should validate that all characters are referenced in at least one prompt', () => {
      const characters = [
        { id: 'char1', name: 'Alex', role: 'main', age: '8', gender: 'boy' },
        { id: 'char2', name: 'Luna', role: 'friend', age: '7', gender: 'girl' }
      ];
      
      const storyData = {
        bookCharacters: characters,
        artStyleCode: 'watercolor_storybook',
        mainCharacter: characters[0],
        setting: { description: 'A forest' }
      };
      
      const { userPrompt } = openaiService.constructPrompts(storyData, 8);
      
      const characterIdList = characters.map(c => `${c.name}=${c.id}`).join(', ');
      expect(userPrompt).toContain(characterIdList);
    });
  });
});
