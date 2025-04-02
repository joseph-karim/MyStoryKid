# Technical Documentation

## Overview

This document outlines key technical aspects of the MyStoryKid project, including API integration, state management, and component responsibilities.

## API Integration

### Dzine API

Interactions with the Dzine API are handled primarily through `src/services/dzineService.js`.

**Base URL:** `https://papi.dzine.ai/openapi/v1`

**Authentication:** Requires an API Key (`VITE_DZINE_API_KEY` environment variable) passed in the `X-API-KEY` header.

**Key Endpoints Used:**

*   **`GET /style/list`**: Retrieves the list of available art styles.
    *   Used in `getDzineStyles` and `analyzeAllStyles`.
    *   Params: `page_no`, `page_size`.
*   **`POST /create_task_img2img`**: Creates an image-to-image generation task.
    *   Used in `createImg2ImgTask` (within `dzineService.js`), called by `CharacterWizard.jsx` and `GenerateBookStep.jsx`.
    *   Requires `style_code`, `prompt`, `images` (base64), and other parameters like `style_intensity`, `structure_match`, `face_match`.
*   **`POST /create_task_txt2img`**: Creates a text-to-image generation task.
    *   Used in `createTxt2ImgTask` (within `dzineService.js`), called by `CharacterWizard.jsx` and `GenerateBookStep.jsx`.
    *   Requires `style_code`, `prompt`, and other parameters.
*   **`GET /get_task_progress`**: Retrieves the status and results of a generation task.
    *   Used in `getTaskProgress` (within `dzineService.js`), called repeatedly by polling logic in `CharacterWizard.jsx` and `GenerateBookStep.jsx`.
    *   Params: `task_id`.
*   **`GET /config/query`**: Used for API connectivity check (`checkApiAccess` in `dzineService.js`).

**Local Style Mapping:**

*   `dzineService.js` contains a `styleCodeMap` which maps user-friendly names (used in UI) to the API's `style_code` values.
*   The `analyzeAllStyles` function compares this local map against the live API `/style/list` endpoint to identify mismatches or new styles.

### OpenAI API

Interactions with the OpenAI API are handled through `src/services/openaiService.js`.

**Authentication:** Requires an API Key (`VITE_OPENAI_API_KEY` environment variable).

**Key Functions:**

*   **`generateOutlineFromPrompt(prompt)`**: Generates a story outline using the OpenAI GPT-4o model.
    *   Returns an array of spread descriptions that structure the story flow.
    *   Used in the first phase of book generation in `GenerateBookStep.jsx`.
*   **`generateSpreadContentFromPrompt(prompt)`**: Generates detailed content for a specific spread including text and an image prompt.
    *   Returns an object with `text` and `imagePrompt` properties.
    *   Used in the second phase of book generation in `GenerateBookStep.jsx`.

## State Management (Zustand)

*   **Main Wizard State (`useBookStore`)**: Located in `src/store/useBookStore.js`. Manages the overall wizard progress and collected story data. Exported as a default export.
    *   `wizardState`: Contains `currentStep`, `bookDetails`, and `characters`.
    *   `bookDetails`: Holds user inputs like `category`, `artStyleCode`, `targetAgeRange`, `coreTheme`, `mainChallengePlot`, etc.
    *   `characters`: Array of character objects with properties like `id`, `name`, `role`, `imageUrl`, etc.
    *   Actions: `setWizardStep`, `updateBookDetails`, `addCharacter`, `updateCharacter`, `resetWizard`.
*   **Character Store (`useCharacterStore`)**: Used internally by `CharacterWizard.jsx` to manage characters during the creation flow.
    *   State: `characters` (array).
    *   Actions: `addCharacter`, `updateCharacter`.

## Key Components & Flow

1.  **`CreateBookPage.jsx`**: Orchestrates the main wizard steps.
    *   Renders the current step component based on `wizardState.currentStep`.
    *   Handles the transition between steps (`setWizardStep`).
    *   Specifically handles the initial call to `CharacterWizard` after `ArtStyleStep` and saves the *first* character (assigning `role: 'main'`) to the `useBookWizardStore`.

2.  **Wizard Step Components**:
    *   **`CategoryStep.jsx`**: Selects the type of book.
    *   **`CharacterStep.jsx`**: Collects *child* details (name, age, traits).
    *   **`ArtStyleStep.jsx`**: Displays available styles from Dzine API.
    *   **`CharactersStep.jsx`**: Manages book characters using `CharacterWizard`.
    *   **`StoryDetailsStep.jsx`**: Collects story theme, plot, tone, etc.
    *   **`SummaryStep.jsx`**: Displays the final collected data before generation.
        *   Contains a "Generate Book" button that navigates to the `/generate-book` route.

3.  **`CharacterWizard.jsx`**: A reusable component for defining *individual book characters*.
    *   Takes `forcedArtStyle` and `onComplete` props.
    *   Handles photo upload or text description input.
    *   Triggers image generation (`createImg2ImgTask` or `createTxt2ImgTask`) via `dzineService`.
    *   Polls for results using `getTaskProgress`.
    *   Uses its *own* internal steps (Details, Photo/Style, Confirm).
    *   Calls `onComplete` with the final character data.

4.  **`GenerateBookStep.jsx`**: Handles the complete book generation process.
    *   Reads data from `useBookStore`.
    *   Implements a multi-phase generation process:
        1. **Outline Generation**: Constructs a detailed prompt and calls `openaiService.generateOutlineFromPrompt()`.
        2. **Page Content Generation**: For each spread in the outline, calls `openaiService.generateSpreadContentFromPrompt()`.
        3. **Image Generation**: For each image prompt, calls `dzineService.createTxt2ImgTask()` with the appropriate `styleCode`.
        4. **Image Polling**: Polls for image generation completion using `dzineService.getTaskProgress()`.
    *   Manages various loading states and progress indicators.
    *   Displays the final book preview with text and images for each spread.
    *   Provides options to go back to the wizard or save the book.

5.  **`dzineService.js`**: Service layer abstracting all direct Dzine API calls.

6.  **`openaiService.js`**: Service layer for OpenAI API interactions, focusing on text generation.

## Book Generation Process

The book generation process follows these steps:

1.  User completes all wizard steps and reaches the `SummaryStep`.
2.  User clicks "Generate Book" which navigates to the `/generate-book` route.
3.  `GenerateBookStep` component mounts and initiates the generation process:
    *   First, constructs a detailed prompt using the collected story details and characters.
    *   Calls `openaiService.generateOutlineFromPrompt()` to get a structured outline for the entire story.
    *   For each spread in the outline:
        *   Constructs a spread-specific prompt including the outline snippet for that spread.
        *   Calls `openaiService.generateSpreadContentFromPrompt()` to get the text and image prompt.
        *   Stores the results for later use.
    *   For each image prompt:
        *   Calls `dzineService.createTxt2ImgTask()` with the selected art style.
        *   Polls for completion using `dzineService.getTaskProgress()`.
        *   Stores the resulting image URL.
    *   Displays the complete book preview with text and images.
4.  User can save the book, go back to the wizard, or make other choices.

## Architecture Decisions/Notes

*   Separation of main wizard state (`useBookStore`) and internal character creation state (`useCharacterStore`).
*   Two-step book generation process (outline first, then page-by-page content) provides better narrative structure.
*   Style codes are mapped locally but validated against the API using `analyzeAllStyles`.
*   Image generation is asynchronous, requiring polling (`getTaskProgress`).
*   Error handling for API calls includes checking response codes and specific error messages.
*   Rate limiting protection added to prevent loops on generation failure. 