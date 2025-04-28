/**
 * Simple script to test the OpenAI API key
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get the API key from environment variables
const apiKey = process.env.VITE_OPENAI_API_KEY;

console.log('API Key (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'Not found');

// Function to test the OpenAI API key
async function testOpenAIKey() {
  try {
    // Make a simple request to the OpenAI API
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Check if the request was successful
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API key is valid!');
      console.log(`Found ${data.data.length} models`);
      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ API key is invalid:', response.status, errorData);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing API key:', error);
    return false;
  }
}

// Test the API key
console.log('Testing OpenAI API key...');
testOpenAIKey()
  .then(isValid => {
    if (isValid) {
      console.log('API key is working correctly.');
    } else {
      console.log('API key is not working. Please check your API key and try again.');
    }
  })
  .catch(error => {
    console.error('Error during API key test:', error);
  });
