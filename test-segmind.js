const axios = require('axios');

// Replace with your actual API key
const SEGMIND_API_KEY = process.env.VITE_SEGMIND_API_KEY;

// Test function
async function testSegmindAPI() {
  // Sample images - using publicly accessible images
  const sceneImage = "https://images.unsplash.com/photo-1615789591457-74a63395c990?q=80&w=1000";
  const referenceImage = "https://images.unsplash.com/photo-1546776310-eef45dd6d63c?q=80&w=1000";
  
  const payload = {
    reference_character_image: referenceImage,
    character_image: sceneImage,
    select_character: "boy"
  };
  
  console.log("Testing Segmind API with payload:", payload);
  
  try {
    const response = await axios.post(
      "https://api.segmind.com/workflows/678aa4026426baad7e5392fb-v6", 
      payload, 
      {
        headers: {
          'x-api-key': SEGMIND_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log("Initial response:", response.data);
    
    if (response.data && response.data.poll_url) {
      console.log("Polling URL:", response.data.poll_url);
      
      // Poll for results
      let attempts = 0;
      const maxAttempts = 30;
      
      while (attempts < maxAttempts) {
        attempts++;
        console.log(`Polling attempt ${attempts}...`);
        
        const pollResponse = await axios.get(response.data.poll_url, {
          headers: { 'x-api-key': SEGMIND_API_KEY }
        });
        
        console.log("Poll response:", pollResponse.data);
        
        if (pollResponse.data.status === "SUCCEEDED") {
          console.log("Success! Final image URL:", pollResponse.data.output?.character_swap_image || pollResponse.data.character_swap_image);
          break;
        } else if (pollResponse.data.status === "FAILED") {
          console.error("Failed:", pollResponse.data.error_message || "Unknown error");
          break;
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
  }
}

// Run the test
testSegmindAPI();
