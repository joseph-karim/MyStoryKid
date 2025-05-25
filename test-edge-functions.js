// Test script for Supabase Edge Functions
import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://uvziaiimktymmjwqgknl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2emlhaWlta3R5bW1qd3Fna25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzQxMDQsImV4cCI6MjA1OTcxMDEwNH0.kpWCq74TWOyKeZuhhqgmg7aZvMMXuREY5bWIXozcRto'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testStoryGeneration() {
  console.log('🧪 Testing story generation Edge Function...')
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-story', {
      body: {
        prompt: 'Write a short story about a brave little mouse.',
        temperature: 0.7,
        max_tokens: 100,
        model: 'gpt-4'
      }
    })

    if (error) {
      console.error('❌ Story generation error:', error)
      return false
    }

    console.log('✅ Story generation successful!')
    console.log('📖 Generated content:', data?.content?.substring(0, 100) + '...')
    return true
  } catch (error) {
    console.error('❌ Story generation failed:', error.message)
    return false
  }
}

async function testImageGeneration() {
  console.log('🎨 Testing image generation Edge Function...')
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        prompt: 'A cute cartoon mouse wearing a red cape, children\'s book style',
        size: '1024x1024',
        quality: 'medium',
        model: 'gpt-image-1'
      }
    })

    if (error) {
      console.error('❌ Image generation error:', error)
      return false
    }

    console.log('✅ Image generation successful!')
    console.log('🖼️ Generated image URL length:', data?.imageUrl?.length || 0)
    return true
  } catch (error) {
    console.error('❌ Image generation failed:', error.message)
    return false
  }
}

async function testImageWithReferences() {
  console.log('🎭 Testing image generation with references...')
  
  // This is a simple test - in real usage you'd have actual reference images
  try {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        prompt: 'A cute cartoon mouse wearing a red cape, children\'s book style',
        referenceImages: [], // Empty for now - would contain base64 images
        size: '1024x1024',
        quality: 'medium',
        model: 'gpt-image-1'
      }
    })

    if (error) {
      console.error('❌ Image with references error:', error)
      return false
    }

    console.log('✅ Image generation with references successful!')
    console.log('🖼️ Generated image URL length:', data?.imageUrl?.length || 0)
    return true
  } catch (error) {
    console.error('❌ Image generation with references failed:', error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 Starting Edge Functions tests...\n')
  
  const results = {
    story: await testStoryGeneration(),
    image: await testImageGeneration(),
    imageWithReferences: await testImageWithReferences()
  }
  
  console.log('\n📊 Test Results:')
  console.log('Story Generation:', results.story ? '✅ PASS' : '❌ FAIL')
  console.log('Image Generation:', results.image ? '✅ PASS' : '❌ FAIL')
  console.log('Image with References:', results.imageWithReferences ? '✅ PASS' : '❌ FAIL')
  
  const passCount = Object.values(results).filter(Boolean).length
  console.log(`\n🎯 Overall: ${passCount}/3 tests passed`)
  
  if (passCount === 3) {
    console.log('🎉 All Edge Functions are working correctly!')
  } else {
    console.log('⚠️ Some Edge Functions need attention. Check the errors above.')
  }
}

// Run the tests
runTests().catch(console.error) 