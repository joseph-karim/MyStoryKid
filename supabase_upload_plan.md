# Plan: Implement Image Upload via Supabase

**Goal:** Implement a reliable and secure method for converting the Base64 character reference image into a public URL required by the Segmind PixelFlow workflow, using Supabase Edge Functions and Storage.

**Problem:** The current client-side attempts to upload Base64 images to third-party services (ImgBB, FreeImageHost) fail due to CORS errors and potentially invalid requests. This prevents the Segmind workflow from receiving the necessary public image URL, causing illustration generation to fail.

**Solution:** Handle image uploads server-side using Supabase.

**Steps:**

1.  **Set up Supabase Infrastructure:**
    *   Ensure a Supabase project is created.
    *   Enable Supabase Storage.
    *   Create a Storage bucket (e.g., `character-references`).
    *   Configure bucket policies (consider public reads for development, signed URLs for production).

2.  **Create Supabase Edge Function (`upload-image`):**
    *   **Purpose:** Acts as a secure backend endpoint for uploads.
    *   **Trigger:** HTTP POST request.
    *   **Input:** JSON body containing Base64 image data (e.g., `{ "imageData": "data:image/webp;base64,..." }`).
    *   **Logic:**
        *   Parse and validate the incoming Base64 data.
        *   Extract the image type (e.g., `webp`, `png`) and Base64 content.
        *   Generate a unique filename (e.g., using UUID).
        *   Use the Supabase client library (`@supabase/supabase-js`) to upload the decoded image data to the `character-references` bucket. Set the correct `contentType`.
        *   Use the Supabase client library to get the public URL for the uploaded file.
        *   Return a JSON response: `200 OK` with `{ "imageUrl": "..." }` on success.
        *   Return appropriate error responses (e.g., `400 Bad Request` for invalid input, `500 Internal Server Error` for upload failures).
    *   **Deployment:** Deploy via Supabase CLI (`supabase functions deploy upload-image`).

3.  **Update Frontend Code (`src/services/segmindService.js`):**
    *   Locate the `uploadBase64ToGetUrl` function (or similar logic within `generateIllustrationWithWorkflow`).
    *   Remove the direct `axios` calls to `api.imgbb.com` and `freeimage.host`.
    *   Implement a call (using `fetch` or `axios`) to the deployed Supabase Edge Function URL (e.g., `https://<project-ref>.supabase.co/functions/v1/upload-image`).
    *   Include the Supabase Anon Key in the `Authorization: Bearer <key>` header.
    *   Send the Base64 data string in the POST request body (e.g., `{ "imageData": base64Image }`).
    *   Handle the response: parse the JSON and extract `imageUrl`.
    *   Update error handling for this new API call.
    *   Consider keeping the `directBase64Illustration` placeholder as an ultimate fallback if the Edge Function call fails.

4.  **Environment Configuration:**
    *   Ensure frontend code has access to Supabase URL and Anon Key (e.g., via `.env` file and `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

**Diagram:**

```mermaid
sequenceDiagram
    participant FE as Frontend (segmindService.js)
    participant SupaEdge as Supabase Edge Function (upload-image)
    participant SupaStorage as Supabase Storage
    participant Segmind as Segmind Workflow API

    FE->>+SupaEdge: POST /functions/v1/upload-image (with Base64 data, Anon Key)
    SupaEdge->>+SupaStorage: Upload Image Data (using Supabase client)
    SupaStorage-->>-SupaEdge: Confirm Upload & Provide Path
    SupaEdge->>SupaStorage: Get Public URL for Path
    SupaStorage-->>SupaEdge: Return Public URL
    SupaEdge-->>-FE: Respond with Public URL { "imageUrl": "..." }
    FE->>+Segmind: Start Workflow (with Public URL, prompts)
    Segmind-->>-FE: Return Poll URL
    loop Poll for Result
        FE->>+Segmind: GET Poll URL
        alt Workflow Succeeded
            Segmind-->>-FE: Return Final Image URL/Data
        else Workflow Pending/Failed
            Segmind-->>-FE: Return Status
        end
    end
```

**Benefits:**

*   Resolves CORS issues.
*   Keeps API keys secure on the backend (Edge Function).
*   Provides a more reliable upload mechanism.
*   Leverages planned Supabase infrastructure.