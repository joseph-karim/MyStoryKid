// Debug test for image generation
async function testImageDirectly() {
  console.log('🔍 Testing image generation directly...')
  
  try {
    const response = await fetch('https://uvziaiimktymmjwqgknl.supabase.co/functions/v1/generate-image', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2emlhaWlta3R5bW1qd3Fna25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxMzQxMDQsImV4cCI6MjA1OTcxMDEwNH0.kpWCq74TWOyKeZuhhqgmg7aZvMMXuREY5bWIXozcRto',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'A cute cartoon mouse',
        size: '1024x1024',
        model: 'gpt-image-1'
      })
    })

    console.log('📊 Response status:', response.status)
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()))
    
    const responseText = await response.text()
    console.log('📄 Response body:', responseText)
    
    if (response.ok) {
      console.log('✅ Success!')
      const data = JSON.parse(responseText)
      console.log('🖼️ Image URL length:', data?.imageUrl?.length || 0)
    } else {
      console.log('❌ Error response')
    }
    
  } catch (error) {
    console.error('❌ Exception:', error.message)
  }
}

testImageDirectly() 