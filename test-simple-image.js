// Simple test for image generation debugging
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://uvziaiimktymmjwqgknl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2emlhaWlta3R5bW1qd3Fna25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzQxMDQsImV4cCI6MjA1OTcxMDEwNH0.kpWCq74TWOyKeZuhhqgmg7aZvMMXuREY5bWIXozcRto'
)

async function testSimpleImage() {
  console.log('🎨 Testing simple image generation...')
  
  try {
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: {
        prompt: 'A cute cartoon mouse',
        size: '1024x1024',
        model: 'gpt-image-1'
        // Removed quality parameter to test
      }
    })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    console.log('✅ Success!')
    console.log('📊 Response data:', data)
    
  } catch (error) {
    console.error('❌ Exception:', error.message)
    
    // Try to get more details from the response
    if (error.context) {
      try {
        const errorText = await error.context.text()
        console.error('📄 Error response body:', errorText)
      } catch (e) {
        console.error('Could not read error response body')
      }
    }
  }
}

testSimpleImage() 