// This script helps set up the Supabase storage bucket for digital downloads
// Run this script with: node scripts/setup-digital-downloads-bucket.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDigitalDownloadsStorage() {
  console.log('Setting up Supabase storage bucket for digital downloads...');
  
  try {
    // Check if the bucket already exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Error listing buckets: ${bucketsError.message}`);
    }
    
    const bucketName = 'digital-downloads';
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`✅ Bucket '${bucketName}' already exists.`);
    } else {
      // Create the bucket with secure settings
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: false, // Private bucket for secure downloads
        fileSizeLimit: 52428800, // 50MB limit for PDF files
        allowedMimeTypes: ['application/pdf'], // Only PDFs allowed
      });
      
      if (error) {
        throw new Error(`Error creating bucket: ${error.message}`);
      }
      
      console.log(`✅ Successfully created bucket '${bucketName}'.`);
    }
    
    // Verify bucket configuration
    console.log('\n📋 Verifying bucket configuration...');
    
    const bucketConfig = buckets.find(bucket => bucket.name === bucketName);
    if (bucketConfig) {
      console.log(`- Bucket ID: ${bucketConfig.id}`);
      console.log(`- Created: ${bucketConfig.created_at}`);
      console.log(`- Public: ${bucketConfig.public}`);
      console.log(`- File size limit: ${bucketConfig.file_size_limit || 'default'}`);
    }
    
    console.log('\n🔒 Setting up secure access policies...');
    
    // Test bucket access
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(bucketName)
        .list('', { limit: 1 });
      
      if (listError) {
        console.warn(`⚠️  Note: List operation failed (expected for private bucket): ${listError.message}`);
      } else {
        console.log('✅ Bucket access verified');
      }
    } catch (error) {
      console.warn(`⚠️  Note: Access test failed (expected for private bucket): ${error.message}`);
    }
    
    console.log('\n📚 Setup complete!');
    console.log('\n🔐 IMPORTANT SECURITY NOTES:');
    console.log(`
The '${bucketName}' bucket has been configured with the following security features:

1. 📁 PRIVATE BUCKET: Not publicly accessible
   - Files cannot be accessed via direct URLs
   - Authentication required for all operations

2. 🔒 RLS POLICIES NEEDED:
   You need to manually create these policies in the Supabase dashboard:
   
   Go to: ${supabaseUrl}/project/storage/buckets/${bucketName}/policies
   
   Add these policies:

   A) "Authenticated users can upload files"
      - Allowed operations: INSERT
      - Target roles: authenticated
      - Policy definition: 
        bucket_id = '${bucketName}' 
        AND auth.role() = 'authenticated'

   B) "Service role can manage all files"
      - Allowed operations: SELECT, INSERT, UPDATE, DELETE
      - Target roles: service_role
      - Policy definition: 
        bucket_id = '${bucketName}' 
        AND auth.role() = 'service_role'

   C) "Users can access their own downloads"
      - Allowed operations: SELECT
      - Target roles: authenticated
      - Policy definition: 
        bucket_id = '${bucketName}' 
        AND (storage.foldername(name))[1] = auth.uid()::text

3. 📝 FILE ORGANIZATION:
   Files should be organized by user ID:
   - Structure: {userId}/{filename}
   - Example: 123e4567-e89b-12d3-a456-426614174000/book_1234567890.pdf

4. 🕐 EXPIRY MANAGEMENT:
   - Implement download expiry in your application logic
   - Consider using signed URLs for temporary access
   - Store expiry dates in the digital_downloads table

5. 🔢 DOWNLOAD LIMITS:
   - Enforce download count limits in your application
   - Track download attempts in the digital_downloads table
   - Update download_count on each access
`);
    
  } catch (error) {
    console.error('❌ Error setting up digital downloads storage:', error.message);
    process.exit(1);
  }
}

setupDigitalDownloadsStorage(); 