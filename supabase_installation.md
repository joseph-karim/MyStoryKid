# Supabase Installation Instructions

To use the Supabase client for image uploads, you need to install the Supabase JavaScript client library:

```bash
npm install @supabase/supabase-js
```

## Supabase Setup

### Option 1: Using the Setup Script (Recommended)

We've created a setup script to help you configure Supabase storage:

1. Make sure you have a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Run the setup script:
   ```bash
   npm run setup-storage
   ```

3. Follow any additional instructions provided by the script.

### Option 2: Manual Setup

1. **Create a Supabase Project** (if you haven't already):
   - Go to [https://supabase.com](https://supabase.com)
   - Sign up or log in
   - Create a new project

2. **Set Up Storage**:
   - In your Supabase dashboard, go to "Storage"
   - Create a new bucket named `character-references`
   - Set the bucket's privacy settings:
     - For development: You can set it to public read access
     - For production: Consider more restrictive policies

3. **Update Storage Policies**:
   - Go to the "Policies" tab for your bucket
   - Create a policy that allows public read access:
     ```sql
     -- Example policy for public read access
     CREATE POLICY "Public Access"
     ON storage.objects
     FOR SELECT
     USING (bucket_id = 'character-references');
     ```
   - Create a policy that allows authenticated uploads (if you implement authentication):
     ```sql
     -- Example policy for authenticated uploads
     CREATE POLICY "Authenticated Uploads"
     ON storage.objects
     FOR INSERT
     TO authenticated
     USING (bucket_id = 'character-references');
     ```
   - For development without authentication, you might want to allow anonymous uploads:
     ```sql
     -- Example policy for anonymous uploads (development only)
     CREATE POLICY "Anonymous Uploads"
     ON storage.objects
     FOR INSERT
     TO anon
     USING (bucket_id = 'character-references');
     ```

4. **Environment Variables**:
   - Make sure your `.env` file contains:
     ```
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```
   - These should match the values you've already added to Netlify

## Testing

After installation, you can test the image upload functionality by:

1. Running your application locally
2. Uploading a character image
3. Checking the Supabase Storage dashboard to confirm the image was uploaded
4. Verifying that the Segmind workflow receives a valid image URL

## Troubleshooting

If you encounter issues:

1. Check browser console for errors
2. Verify that the Supabase URL and anon key are correctly set
3. Confirm that the storage bucket exists and has appropriate policies
4. Check network requests to see if the upload to Supabase is being attempted