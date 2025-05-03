# MyStoryKid Testing Documentation

This document outlines the testing approach for the MyStoryKid project, focusing on unit tests, integration tests, and manual QA processes.

## Testing Framework

The project uses [Vitest](https://vitest.dev/) as the testing framework, which is compatible with Vite and provides a modern, fast testing experience for React applications.

### Setup

1. Install testing dependencies:
   ```bash
   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom
   ```

2. Configure Vitest in `vitest.config.js`:
   ```javascript
   import { defineConfig } from 'vitest/config';
   import react from '@vitejs/plugin-react';

   export default defineConfig({
     plugins: [react()],
     test: {
       environment: 'jsdom',
       globals: true,
       setupFiles: ['./tests/setup.js'],
     },
   });
   ```

3. Create a test setup file at `tests/setup.js`:
   ```javascript
   import { expect, afterEach } from 'vitest';
   import { cleanup } from '@testing-library/react';
   import '@testing-library/jest-dom/vitest';

   afterEach(() => {
     cleanup();
   });
   ```

4. Add test scripts to `package.json`:
   ```json
   "scripts": {
     "test": "vitest run",
     "test:watch": "vitest"
   }
   ```

## Test Categories

### 1. OpenAI Integration & Prompting

- **Unit Tests**: Test prompt construction to ensure all required fields are present
- **Mocked API Tests**: Verify correct parsing of responses and error handling
- **Logging Tests**: Ensure all API requests and responses are properly logged

### 2. Art Style Consistency

- **Unit Tests**: Verify that every prompt includes artStyleCode or customStyleDescription
- **Visual Regression**: Compare generated images for style drift (manual QA)
- **Documentation**: Document supported art styles and how to add new ones

### 3. Multiple Characters Handling

- **Unit Tests**: Verify that all characters are referenced in prompts
- **Integration Tests**: Test prompt generation for stories with multiple characters
- **Validation**: Ensure all bookCharacters are referenced in at least one page

### 4. Image Generation & Upscaling

- **Unit Tests**: Test image generation with proper mocking
- **Integration Tests**: Verify upscaled images meet required resolution and format
- **Validation Scripts**: Check all images in a book for correct dimensions

### 5. PDF Generation

- **Unit Tests**: Test PDF assembly components
- **Validation Scripts**: Check page size, DPI, and bleed/cut marks
- **Manual QA**: Review sample PDFs for layout and print-readiness

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch

# Run specific test file
npm test -- tests/services/openaiService.test.js
```

## Mocking External Services

The tests use mocking to avoid making actual API calls to external services:

1. **OpenAI API**: Mock the API responses to test prompt construction and response handling
2. **Image Generation**: Mock image generation to test the process without making actual API calls
3. **File System**: Mock file operations for testing PDF generation and image handling

Example of mocking OpenAI:

```javascript
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify([{ text: "Sample text" }])
              }
            }]
          })
        }
      }
    }))
  };
});
```

## Pre-commit Hooks

To ensure code quality, the project uses pre-commit hooks to run linting and tests before each commit:

1. Install husky and lint-staged:
   ```bash
   npm install --save-dev husky lint-staged
   ```

2. Configure in `package.json`:
   ```json
   "husky": {
     "hooks": {
       "pre-commit": "lint-staged"
     }
   },
   "lint-staged": {
     "src/**/*.{js,jsx,ts,tsx}": [
       "eslint --fix",
       "vitest related --run"
     ]
   }
   ```

## Manual QA Checklist

For features that require visual inspection:

1. **Story Generation**:
   - Verify that all characters appear in the story
   - Check that the art style is consistent with the selected style
   - Ensure age-appropriate language is used

2. **Image Generation**:
   - Verify style and content accuracy
   - Check resolution and quality
   - Ensure character consistency across images

3. **PDF Output**:
   - Verify layout and page order
   - Check print specifications (bleed, margins, etc.)
   - Test PDF rendering on different devices

## Authentication Testing

Since authentication is only required at the final book generation step:

1. **Development Testing**: Auth can be bypassed or stubbed
2. **Integration Testing**: Verify auth wall appears at the correct stage
3. **Flow Testing**: Test both unauthenticated (preview) and authenticated (full book) flows
