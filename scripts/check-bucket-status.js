// Simple script to check the status of Supabase storage buckets
// Run this script with: node scripts/check-bucket-status.js

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

async function checkBucketStatus() {
  console.log('🔍 Checking Supabase storage bucket status...\n');
  
  try {
    // List all buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw new Error(`Error listing buckets: ${bucketsError.message}`);
    }
    
    console.log(`📁 Found ${buckets.length} storage buckets:\n`);
    
    buckets.forEach((bucket, index) => {
      console.log(`${index + 1}. ${bucket.name}`);
      console.log(`   - ID: ${bucket.id}`);
      console.log(`   - Public: ${bucket.public}`);
      console.log(`   - Created: ${bucket.created_at}`);
      console.log(`   - Updated: ${bucket.updated_at}`);
      console.log(`   - File size limit: ${bucket.file_size_limit || 'default'}`);
      console.log(`   - Allowed MIME types: ${bucket.allowed_mime_types?.join(', ') || 'all'}`);
      console.log('');
    });
    
    // Check specifically for digital-downloads bucket
    const digitalDownloadsBucket = buckets.find(bucket => bucket.name === 'digital-downloads');
    
    if (digitalDownloadsBucket) {
      console.log('✅ digital-downloads bucket exists');
      console.log(`   - Public access: ${digitalDownloadsBucket.public ? 'ENABLED (❌ Security concern!)' : 'DISABLED (✅ Secure)'}`);
      console.log(`   - File size limit: ${digitalDownloadsBucket.file_size_limit || 'unlimited'}`);
      console.log(`   - MIME types: ${digitalDownloadsBucket.allowed_mime_types?.join(', ') || 'all types allowed'}`);
      
      // Test bucket access
      console.log('\n🔐 Testing bucket access...');
      try {
        const { data: files, error: listError } = await supabase.storage
          .from('digital-downloads')
          .list('', { limit: 1 });
        
        if (listError) {
          console.log(`   - List access: RESTRICTED (${listError.message})`);
          console.log(`   - This is expected for a properly secured private bucket`);
        } else {
          console.log(`   - List access: ALLOWED`);
          console.log(`   - Found ${files.length} files`);
        }
      } catch (error) {
        console.log(`   - List access: ERROR (${error.message})`);
      }
      
    } else {
      console.log('❌ digital-downloads bucket NOT FOUND');
      console.log('\n📝 You need to create the digital-downloads bucket manually:');
      console.log('   1. Go to your Supabase dashboard → Storage');
      console.log('   2. Create a new bucket named "digital-downloads"');
      console.log('   3. Set it as PRIVATE (not public)');
      console.log('   4. Set file size limit to 50MB');
      console.log('   5. Restrict MIME types to application/pdf');
    }
    
    // Check character-references bucket for comparison
    const characterRefsBucket = buckets.find(bucket => bucket.name === 'character-references');
    
    if (characterRefsBucket) {
      console.log('\n📋 character-references bucket status:');
      console.log(`   - Public access: ${characterRefsBucket.public ? 'ENABLED' : 'DISABLED'}`);
      console.log(`   - File size limit: ${characterRefsBucket.file_size_limit || 'unlimited'}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking bucket status:', error.message);
    process.exit(1);
  }
}

checkBucketStatus(); 