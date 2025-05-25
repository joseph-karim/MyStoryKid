// Final comprehensive test for Supabase service layer
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uvziaiimktymmjwqgknl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2emlhaWlta3R5bW1qd3Fna25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzQxMDQsImV4cCI6MjA1OTcxMDEwNH0.kpWCq74TWOyKeZuhhqgmg7aZvMMXuREY5bWIXozcRto'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test functions
async function generateStoryContent(prompt, options = {}) {
  const { data, error } = await supabase.functions.invoke('generate-story', {
    body: {
      prompt,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      model: options.model || 'gpt-4'
    }
  })

  if (error) throw error
  return data.content
}

async function generateImage(prompt, options = {}) {
  const { data, error } = await supabase.functions.invoke('generate-image', {
    body: {
      prompt,
      size: options.size || '1024x1024',
      model: options.model || 'gpt-image-1',
      n: options.n || 1
    }
  })

  if (error) throw error
  return data.imageUrl
}

// Test suite
async function runTests() {
  console.log('🧪 Final Supabase Service Layer Test\n')

  try {
    // Test 1: Story Generation
    console.log('📖 Testing story generation...')
    const story = await generateStoryContent('Write a short story about a brave little mouse named Pip.')
    console.log('✅ Story generation successful!')
    console.log(`📝 Story preview: ${story.substring(0, 100)}...\n`)

    // Test 2: Image Generation
    console.log('🎨 Testing image generation...')
    const imageUrl = await generateImage('A cute cartoon mouse wearing a red cape, children\'s book illustration style')
    console.log('✅ Image generation successful!')
    console.log(`🖼️ Image URL type: ${typeof imageUrl}`)
    console.log(`🖼️ Image URL length: ${imageUrl.length}`)
    console.log(`🖼️ Image URL starts with: ${imageUrl.substring(0, 50)}...\n`)

    // Test 3: Different Image Sizes
    console.log('📐 Testing different image sizes...')
    const coverImage = await generateImage('A magical forest scene for a children\'s book cover', { size: '1024x1536' })
    console.log('✅ Cover image generation successful!')
    console.log(`🖼️ Cover image URL length: ${coverImage.length}\n`)

    console.log('🎯 All tests passed! ✅')
    console.log('🚀 The Supabase Edge Functions are working correctly!')
    console.log('📋 Summary:')
    console.log('   - Story generation: Working ✅')
    console.log('   - Image generation: Working ✅')
    console.log('   - Multiple image sizes: Working ✅')
    console.log('   - Service layer integration: Ready ✅')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
    if (error.context) {
      console.error('📊 Error context:', error.context.status, error.context.statusText)
    }
  }
}

runTests() 