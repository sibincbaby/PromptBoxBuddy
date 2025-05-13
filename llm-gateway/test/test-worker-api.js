#!/usr/bin/env node

const fetch = require('node-fetch');
const readline = require('readline');

// Worker URL
const WORKER_URL = 'https://llm-gateway.promptbox.workers.dev';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test API functionality
async function testApi(apiKey) {
  try {
    console.log('\nTesting Gemini API integration...');
    
    // Simple test prompt
    const testPrompt = 'Say "Hello World! This is a test of the Gemini API via Cloudflare worker."';
    
    console.log(`Sending test prompt: "${testPrompt}"`);
    
    const response = await fetch(`${WORKER_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: testPrompt,
        modelName: 'gemini-pro',
        generationConfig: {
          temperature: 0.5,
          maxOutputTokens: 100
        }
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('\n✅ API integration test successful!');
      console.log('\nGemini API Response:');
      console.log('------------------------');
      console.log(data.response);
      console.log('------------------------');
      return true;
    } else {
      console.error('\n❌ API integration test failed');
      console.error('   Status:', response.status);
      console.error('   Error:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('\n❌ Failed to test API integration');
    console.error('   Error:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('=== Testing Cloudflare Worker Gemini API Integration ===');
  
  // First check if the worker is accessible
  try {
    console.log('Checking if worker is accessible...');
    const healthResponse = await fetch(`${WORKER_URL}/health`);
    if (!healthResponse.ok) {
      console.error('❌ Worker is not accessible. Please check your deployment.');
      return;
    }
    console.log('✅ Worker is accessible');
  } catch (error) {
    console.error('❌ Worker is not accessible:', error.message);
    console.error('Please ensure your worker is deployed correctly at:', WORKER_URL);
    return;
  }
  
  // Now test the API integration
  console.log('\nVerifying that you have set up your GEMINI_API_KEY as a secret in your Cloudflare Worker');
  console.log('If the next test fails, you may need to add your API key as a secret using:');
  console.log('npx wrangler secret put GEMINI_API_KEY');
  
  // Give the user a moment to read the message
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test the API integration
  const apiSuccess = await testApi();
  
  if (apiSuccess) {
    console.log('\n✅ Your Cloudflare Worker is correctly integrating with Gemini API!');
    console.log('You can now use the worker endpoint in your frontend application.');
  } else {
    console.log('\n❌ API integration test failed. Please check:');
    console.log('1. You have set up your GEMINI_API_KEY secret in Cloudflare');
    console.log('2. The API key is valid and has access to the Gemini API');
    console.log('3. Check your worker logs in the Cloudflare dashboard for more details');
  }
  
  process.exit(0);
}

// Start the tests
runTests();