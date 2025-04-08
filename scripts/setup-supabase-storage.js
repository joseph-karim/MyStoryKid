// This script helps set up the Supabase storage bucket for character references
// Run this script with: node scripts/setup-supabase-storage.js

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

async function setupStorage() {
  console.log('Setting up Supabase storage bucket for character references...');
  
  try {
    // Check if the bucket already exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Error listing buckets: ${bucketsError.message}`);
    }
    
    const bucketName = 'character-references';
    const bucketExists = buckets.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket '${bucketName}' already exists.`);
    } else {
      // Create the bucket
      const { data, error } = await supabase.storage.createBucket(bucketName, {
        public: true, // Make the bucket public
        fileSizeLimit: 5242880, // 5MB limit
      });
      
      if (error) {
        throw new Error(`Error creating bucket: ${error.message}`);
      }
      
      console.log(`Successfully created bucket '${bucketName}'.`);
    }
    
    // Set up public access policy
    console.log('Setting up storage policies...');
    
    // Allow public read access
    const { error: policyError } = await supabase.storage.from(bucketName).getPublicUrl('test.txt');
    
    if (policyError) {
      console.warn(`Note: You may need to manually set up public read access policy in the Supabase dashboard.`);
    } else {
      console.log('Public read access is already configured.');
    }
    
    console.log('\nSetup complete!');
    console.log('\nIMPORTANT: If you need to manually set up policies, go to:');
    console.log(`${supabaseUrl}/project/storage/buckets/${bucketName}/policies`);
    console.log('\nAnd add these policies:');
    console.log(`
1. Public Read Access:
   - Name: "Public Read Access"
   - Allowed operations: SELECT
   - Target roles: anon, authenticated
   - Policy definition: bucket_id == "${bucketName}"

2. Authenticated Upload:
   - Name: "Authenticated Upload"
   - Allowed operations: INSERT
   - Target roles: authenticated
   - Policy definition: bucket_id == "${bucketName}"

3. For development without authentication:
   - Name: "Anonymous Upload"
   - Allowed operations: INSERT
   - Target roles: anon
   - Policy definition: bucket_id == "${bucketName}"
`);
    
  } catch (error) {
    console.error('Error setting up Supabase storage:', error.message);
    process.exit(1);
  }
}

setupStorage();