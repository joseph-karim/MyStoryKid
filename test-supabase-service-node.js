// Node.js compatible test for Supabase service layer
import { createClient } from '@supabase/supabase-js'

// Direct configuration for Node.js testing
const supabaseUrl = 'https://uvziaiimktymmjwqgknl.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2emlhaWlta3R5bW1qd3Fna25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzQxMDQsImV4cCI6MjA1OTcxMDEwNH0.kpWCq74TWOyKeZuhhqgmg7aZvMMXuREY5bWIXozcRto'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Test functions that mirror the service layer
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

async function generateImageWithReferences(prompt, referenceImages, options = {}) {
  const { data, error } = await supabase.functions.invoke('generate-image', {
    body: {
      prompt,
      referenceImages,
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
  console.log('🧪 Testing Supabase Service Layer...\n')

  try {
    // Test 1: Story Generation
    console.log('📖 Testing story generation...')
    const story = await generateStoryContent('Write a short story about a brave little mouse.')
    console.log('✅ Story generation successful!')
    console.log(`📝 Story preview: ${story.substring(0, 100)}...\n`)

    // Test 2: Simple Image Generation
    console.log('🎨 Testing simple image generation...')
    const imageUrl = await generateImage('A cute cartoon mouse wearing a red cape')
    console.log('✅ Image generation successful!')
    console.log(`🖼️ Image URL length: ${imageUrl.length}\n`)

    // Test 3: Image Generation with References
    console.log('🎭 Testing image generation with references...')
    const imageWithRefs = await generateImageWithReferences(
      'A cute cartoon mouse in a magical forest',
      ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='], // Tiny placeholder image
      { size: '1024x1024' }
    )
    console.log('✅ Image generation with references successful!')
    console.log(`🖼️ Image URL length: ${imageWithRefs.length}\n`)

    console.log('🎯 All service layer tests passed! ✅')
    console.log('🚀 The Supabase service layer is ready for integration!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

runTests() 