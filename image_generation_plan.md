# Plan: Implement Two-Stage Image Generation Workflow

This plan outlines the steps to refactor the image generation process to use a two-stage workflow: Dzine Text-to-Image for scene generation followed by Segmind Character Swap for consistent character insertion.

## Summary of Required Changes:

1.  **`src/services/dzineService.js`:**
    *   Update `createTxt2ImgTask`: Change default `generate_slots` to `[1, 0, 0, 0]`.
    *   Remove `dzineToSegmindKeywordsMap` and `getKeywordsForDzineStyle`.
2.  **`src/services/segmindService.js`:**
    *   Define a constant `CHARACTER_SWAP_URL` with the value `"https://api.segmind.com/workflows/678aa4026426baad7e5392fb-v6"`.
    *   Create the `swapCharacterInImage(sceneImageUrl, referenceCharacterUrl, characterSelector)` async function as detailed in the user request (using `CHARACTER_SWAP_URL`, accepting URLs, building the correct payload).
    *   Modify the `pollForResult` helper function: Change the line extracting the result URL to check for `response.data.output?.character_swap_image || response.data.character_swap_image`.
3.  **`src/services/openaiService.js`:**
    *   Modify `constructPrompts`: Update JSON instructions to request a single `visualPrompt` (combining scene and placeholder character details) instead of separate `characterPrompt` and `scenePrompt`.
4.  **`src/components/wizard/GenerateBookStep.jsx`:**
    *   Rewrite the image generation loop within `generateBook`:
        *   Remove call to `segmindService.generateIllustrationWithWorkflow`.
        *   Implement Dzine scene generation (call `createDzineSceneTask`, poll with `getTaskProgress`).
        *   Implement Segmind swap (call `swapCharacterInImage`).
    *   Update prompt handling to use the single `visualPrompt`.
    *   Remove import/usage of `getKeywordsForDzineStyle`.
    *   Update progress reporting (`updateProgressInfo`) for the two stages.
    *   Decide and update cover generation logic.
5.  **`src/components/wizard/ArtStyleStep.jsx`:**
    *   Remove import/usage of `getKeywordsForDzineStyle`.
    *   Update `handleSelectStyle` to only call `updateStoryData` with `artStyleCode`.

## Plan Diagram:

```mermaid
graph TD
    A[Start: User Request] --> B{Review Code};
    B --> C[Identify Changes Needed];

    subgraph Service Layer Changes
        C --> D[Modify dzineService.js];
        D --> D1[Update createTxt2ImgTask generate_slots];
        D --> D2[Remove getKeywordsForDzineStyle & map];
        C --> E[Modify segmindService.js];
        E --> E1[Define CHARACTER_SWAP_URL];
        E --> E2[Create swapCharacterInImage function];
        E --> E3[Modify pollForResult for character_swap_image];
        C --> F[Modify openaiService.js];
        F --> F1[Update constructPrompts for single visualPrompt];
    end

    subgraph Component Layer Changes
        C --> G[Refactor GenerateBookStep.jsx];
        G --> G1[Remove old image generation logic];
        G1 --> G2[Implement Dzine scene generation call & polling];
        G2 --> G3[Implement Segmind swap call];
        G --> G4[Update prompt handling for visualPrompt];
        G --> G5[Remove getKeywordsForDzineStyle usage];
        G --> G6[Update progress reporting];
        G --> G7[Update cover generation (if needed)];
        C --> H[Modify ArtStyleStep.jsx];
        H --> H1[Remove getKeywordsForDzineStyle usage];
        H --> H2[Update handleSelectStyle to only send artStyleCode];
    end

    subgraph Finalization
        D2 --> I;
        E3 --> I;
        F1 --> I;
        G7 --> I;
        H2 --> I[All Code Changes Identified];
        I --> J{Propose Plan to User};
        J -- User Approves --> K[Switch to Code Mode];
        K --> L[Implement Changes];
        L --> M[Test & Verify];
        M --> N[Complete Task];
    end

    style D fill:#f9f,stroke:#333,stroke-width:2px
    style E fill:#f9f,stroke:#333,stroke-width:2px
    style F fill:#f9f,stroke:#333,stroke-width:2px
    style G fill:#ccf,stroke:#333,stroke-width:2px
    style H fill:#ccf,stroke:#333,stroke-width:2px
    style K fill:#f9d,stroke:#333,stroke-width:2px
    style L fill:#f9d,stroke:#333,stroke-width:2px
```

## Detailed Implementation Steps:

1.  **Modify `dzineService.js`:**
    *   In `createTxt2ImgTask`, change the default for `generate_slots` from `[1, 1, 0, 0]` to `[1, 0, 0, 0]`.
    *   Delete the `dzineToSegmindKeywordsMap` constant and the `getKeywordsForDzineStyle` function.
2.  **Modify `segmindService.js`:**
    *   Define a constant `CHARACTER_SWAP_URL` with the value `"https://api.segmind.com/workflows/678aa4026426baad7e5392fb-v6"`.
    *   Create the `swapCharacterInImage(sceneImageUrl, referenceCharacterUrl, characterSelector)` async function as detailed in the user request (using `CHARACTER_SWAP_URL`, accepting URLs, building the correct payload).
    *   Modify the `pollForResult` helper function: Change the line extracting the result URL (currently line 235) to check for `response.data.output?.character_swap_image || response.data.character_swap_image`.
3.  **Modify `openaiService.js`:**
    *   In the `constructPrompts` helper, update the `jsonOutputInstructions` string:
        *   Remove the lines defining `characterPrompt` and `scenePrompt`.
        *   Add a definition for `visualPrompt`: `"visualPrompt": (string) A detailed description for Dzine Text-to-Image, including the full scene (background, setting, lighting, mood, composition) AND a description of a placeholder character (e.g., 'a 6-year-old girl placeholder') with specific pose, action, and expression instructions relevant to this scene. Include desired art style keywords."` (Adjust placeholder description as needed based on testing).
4.  **Modify `ArtStyleStep.jsx`:**
    *   Remove the import statement for `getKeywordsForDzineStyle`.
    *   In the `handleSelectStyle` function, remove the line `const keywords = getKeywordsForDzineStyle(styleCode);`.
    *   Change the `updateStoryData` call to `updateStoryData({ artStyleCode: styleCode });`.
5.  **Refactor `GenerateBookStep.jsx`:**
    *   Remove the import of `getKeywordsForDzineStyle` and `generateIllustrationWithWorkflow`.
    *   Inside the `generateBook` function's main loop (iterating through `storyPages`):
        *   Remove the existing call to `segmindService.generateIllustrationWithWorkflow`.
        *   Get the `visualPrompt` from the current `page` object.
        *   Get the `artStyleCode` from `storyData`.
        *   **Dzine Scene Generation:**
            *   Call `dzineService.createDzineSceneTask(visualPrompt, artStyleCode, 1024, 768)`.
            *   Update progress: `updateProgressInfo(\`Generating scene for page ${index + 1} (Dzine)...\`);`
            *   Poll using `dzineService.getTaskProgress(taskId)` until complete. Handle errors.
            *   Store the resulting `dzineSceneImageUrl`.
        *   **Segmind Character Swap:**
            *   Get the main character's `stylePreview` URL (`referenceCharacterUrl`).
            *   Define the `selectCharacterText` (e.g., `"${mainCharacter.name}, a ${mainCharacter.age}-year-old ${mainCharacter.gender}"` - Requires testing/refinement).
            *   Update progress: `updateProgressInfo(\`Swapping character for page ${index + 1} (Segmind)...\`);`
            *   Call `segmindService.swapCharacterInImage(dzineSceneImageUrl, referenceCharacterUrl, selectCharacterText)`. This function handles its own polling. Handle errors.
            *   Store the final image URL returned by Segmind in the `imageUrls` state for the current `index`.
    *   Update the cover generation logic (lines ~552-577) similarly if the two-step process is desired for the cover as well. Otherwise, simplify it (e.g., use Dzine Txt2Img only).