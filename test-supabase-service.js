// Test script for our Supabase service
import { generateStoryContent, generateImage, generateImageWithReferences } from './src/services/supabaseService.js'

async function testStoryService() {
  console.log('🧪 Testing story generation service...')
  
  try {
    const result = await generateStoryContent('Write a short story about a brave little mouse.', {
      temperature: 0.7,
      max_tokens: 100,
      model: 'gpt-4'
    })

    console.log('✅ Story generation successful!')
    console.log('📖 Generated content:', result.content?.substring(0, 100) + '...')
    console.log('📊 Usage:', result.usage)
    return true
  } catch (error) {
    console.error('❌ Story generation failed:', error.message)
    return false
  }
}

async function testImageService() {
  console.log('🎨 Testing image generation service...')
  
  try {
    const imageUrl = await generateImage('A cute cartoon mouse wearing a red cape, children\'s book style', {
      size: '1024x1024',
      quality: 'medium',
      model: 'gpt-image-1'
    })

    console.log('✅ Image generation successful!')
    console.log('🖼️ Generated image URL length:', imageUrl?.length || 0)
    console.log('🖼️ Image URL preview:', imageUrl?.substring(0, 50) + '...')
    return true
  } catch (error) {
    console.error('❌ Image generation failed:', error.message)
    return false
  }
}

async function testImageWithReferencesService() {
  console.log('🎭 Testing image generation with references service...')
  
  try {
    // Test with empty references array (should work like regular generation)
    const imageUrl = await generateImageWithReferences(
      'A cute cartoon mouse wearing a red cape, children\'s book style',
      [], // Empty references for now
      {
        size: '1024x1024',
        quality: 'medium',
        model: 'gpt-image-1'
      }
    )

    console.log('✅ Image generation with references successful!')
    console.log('🖼️ Generated image URL length:', imageUrl?.length || 0)
    console.log('🖼️ Image URL preview:', imageUrl?.substring(0, 50) + '...')
    return true
  } catch (error) {
    console.error('❌ Image generation with references failed:', error.message)
    return false
  }
}

async function runServiceTests() {
  console.log('🚀 Starting Supabase service tests...\n')
  
  const results = {
    story: await testStoryService(),
    image: await testImageService(),
    imageWithReferences: await testImageWithReferencesService()
  }
  
  console.log('\n📊 Test Results:')
  console.log('Story Service:', results.story ? '✅ PASS' : '❌ FAIL')
  console.log('Image Service:', results.image ? '✅ PASS' : '❌ FAIL')
  console.log('Image with References Service:', results.imageWithReferences ? '✅ PASS' : '❌ FAIL')
  
  const passCount = Object.values(results).filter(Boolean).length
  console.log(`\n🎯 Overall: ${passCount}/3 tests passed`)
  
  if (passCount === 3) {
    console.log('🎉 All Supabase services are working correctly!')
    console.log('🔧 Ready to integrate with your existing book generation workflow!')
  } else {
    console.log('⚠️ Some services need attention. Check the errors above.')
    console.log('💡 Make sure your OpenAI API key is set in Supabase secrets.')
  }
}

// Run the tests
runServiceTests().catch(console.error) 