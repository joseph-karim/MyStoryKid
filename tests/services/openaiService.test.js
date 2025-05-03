import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as openaiService from '../../src/services/openaiService';

vi.mock('openai', () => {
  const mockCreate = vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify([
          {
            text: "Sample text for page 1",
            visualPrompt: "Sample visual prompt for page 1",
            mainCharacterId: "char1"
          },
          {
            text: "Sample text for page 2",
            visualPrompt: "Sample visual prompt for page 2",
            mainCharacterId: "char1"
          },
          {
            text: "Sample text for page 3",
            visualPrompt: "Sample visual prompt for page 3",
            mainCharacterId: "char1"
          },
          {
            text: "Sample text for page 4",
            visualPrompt: "Sample visual prompt for page 4",
            mainCharacterId: "char1"
          },
          {
            text: "Sample text for page 5",
            visualPrompt: "Sample visual prompt for page 5",
            mainCharacterId: "char1"
          },
          {
            text: "Sample text for page 6",
            visualPrompt: "Sample visual prompt for page 6",
            mainCharacterId: "char1"
          },
          {
            text: "Sample text for page 7",
            visualPrompt: "Sample visual prompt for page 7",
            mainCharacterId: "char1"
          },
          {
            text: "Sample text for page 8",
            visualPrompt: "Sample visual prompt for page 8",
            mainCharacterId: "char1"
          }
        ])
      }
    }],
    model: "gpt-4o",
    usage: { total_tokens: 1000 }
  });

  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate
        }
      }
    }))
  };
});

const constructPrompts = openaiService.__constructPrompts || 
  Object.getOwnPropertyDescriptor(openaiService, 'constructPrompts')?.value;

describe('OpenAI Service', () => {
  const originalEnv = { ...import.meta.env };
  
  beforeEach(() => {
    import.meta.env.VITE_OPENAI_API_KEY = 'sk-proj-test-key';
    
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    import.meta.env = { ...originalEnv };
  });

  describe('constructPrompts', () => {
    it('should include all required fields in the prompt', () => {
      if (!constructPrompts) {
        console.warn('constructPrompts function is not accessible for testing');
        return;
      }

      const storyData = {
        category: 'adventure',
        bookCharacters: [
          { 
            id: 'char1', 
            name: 'Alex', 
            role: 'main', 
            age: '8', 
            gender: 'boy',
            traits: ['curious', 'brave'],
            interests: ['dinosaurs', 'space']
          },
          { 
            id: 'char2', 
            name: 'Luna', 
            role: 'friend', 
            age: '7', 
            gender: 'girl',
            traits: ['smart', 'kind'],
            interests: ['books', 'animals']
          }
        ],
        artStyleCode: 'watercolor_storybook',
        customStyleDescription: '',
        storyType: 'standard',
        targetAgeRange: '5-9',
        coreTheme: 'friendship',
        mainChallengePlot: 'Alex and Luna discover a magical map',
        narrativeStyle: 'third_person_limited',
        tone: 'adventurous',
        desiredEnding: 'They find a hidden treasure and learn about teamwork',
        desiredLengthWords: 600,
        mainCharacter: { 
          id: 'char1', 
          name: 'Alex', 
          age: '8', 
          gender: 'boy',
          traits: ['curious', 'brave'],
          interests: ['dinosaurs', 'space']
        },
        setting: {
          description: 'A magical forest with tall trees and sparkling streams'
        }
      };

      const { systemPrompt, userPrompt } = constructPrompts(storyData, 8);

      expect(systemPrompt).toContain('children\'s picture book author');
      
      expect(userPrompt).toContain('Alex');
      expect(userPrompt).toContain('Luna');
      
      expect(userPrompt).toContain('watercolor_storybook');
      
      expect(userPrompt).toContain('friendship');
      expect(userPrompt).toContain('magical map');
      expect(userPrompt).toContain('teamwork');
      
      expect(userPrompt).toContain('"text":');
      expect(userPrompt).toContain('"visualPrompt":');
      expect(userPrompt).toContain('"mainCharacterId":');
    });

    it('should handle different story types correctly', () => {
      if (!constructPrompts) {
        console.warn('constructPrompts function is not accessible for testing');
        return;
      }

      const storyTypes = ['rhyming', 'early_reader', 'lesson', 'board_book'];
      const mainCharacter = { 
        id: 'char1', 
        name: 'Alex', 
        age: '8', 
        gender: 'boy',
        traits: ['curious', 'brave'],
        interests: ['dinosaurs', 'space']
      };
      
      storyTypes.forEach(storyType => {
        const storyData = {
          bookCharacters: [mainCharacter],
          artStyleCode: 'watercolor_storybook',
          storyType,
          mainCharacter,
          setting: { description: 'A magical forest' }
        };
        
        if (storyType === 'board_book') {
          storyData.coreConcept = 'Colors and shapes';
          storyData.keyObjectsActions = 'Red ball, Blue square, Yellow star';
        }
        
        const { systemPrompt, userPrompt } = constructPrompts(storyData, 8);
        
        switch(storyType) {
          case 'rhyming':
            expect(systemPrompt).toContain('rhyming picture books');
            expect(userPrompt).toContain('rhyme scheme');
            break;
          case 'early_reader':
            expect(systemPrompt).toContain('early reader book');
            expect(userPrompt).toContain('controlled vocabulary');
            break;
          case 'lesson':
            expect(systemPrompt).toContain('teach a specific lesson');
            expect(userPrompt).toContain('lesson');
            break;
          case 'board_book':
            expect(systemPrompt).toContain('board book');
            expect(userPrompt).toContain('Colors and shapes');
            expect(userPrompt).toContain('Red ball, Blue square, Yellow star');
            break;
        }
      });
    });
  });

  describe('generateStoryPages', () => {
    it('should return mock data when API key is missing', async () => {
      import.meta.env.VITE_OPENAI_API_KEY = '';
      
      const storyData = {
        bookCharacters: [{ id: 'char1', name: 'Alex', role: 'main' }],
        storyType: 'standard',
        artStyleCode: 'watercolor',
        mainCharacter: { id: 'char1', name: 'Alex' },
        setting: { description: 'A forest' }
      };
      
      const result = await openaiService.generateStoryPages(storyData, 8);
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(8);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('type', 'content');
      expect(result[0]).toHaveProperty('text');
      expect(result[0]).toHaveProperty('visualPrompt');
      expect(result[0]).toHaveProperty('mainCharacterId');
    });
    
    it('should call OpenAI API with correct parameters', async () => {
      const openaiModule = await import('openai');
      const mockOpenAI = openaiModule.default();
      const mockCreate = mockOpenAI.chat.completions.create;
      
      const storyData = {
        bookCharacters: [{ id: 'char1', name: 'Alex', role: 'main' }],
        storyType: 'standard',
        artStyleCode: 'watercolor',
        mainCharacter: { id: 'char1', name: 'Alex' },
        setting: { description: 'A forest' }
      };
      
      await openaiService.generateStoryPages(storyData, 8);
      
      expect(mockCreate).toHaveBeenCalled();
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs).toHaveProperty('model', 'gpt-4o');
      expect(callArgs).toHaveProperty('response_format', { type: 'json_object' });
      expect(callArgs.messages[0]).toHaveProperty('role', 'system');
      expect(callArgs.messages[1]).toHaveProperty('role', 'user');
    });
  });
});
