#!/usr/bin/env node

const fetch = require('node-fetch');

// Worker URL
const WORKER_URL = 'https://llm-gateway.promptbox.workers.dev';

// Test health endpoint
async function testHealth() {
  try {
    console.log('Testing health endpoint...');
    const response = await fetch(`${WORKER_URL}/health`);
    const data = await response.json();
    
    if (response.ok && data.status === 'ok') {
      console.log('✅ Health endpoint is working correctly');
      console.log('   Response:', JSON.stringify(data));
      return true;
    } else {
      console.error('❌ Health endpoint returned unexpected response');
      console.error('   Status:', response.status);
      console.error('   Response:', JSON.stringify(data));
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to access health endpoint');
    console.error('   Error:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('=== Testing Cloudflare Worker ===');
  const healthOk = await testHealth();
  
  if (healthOk) {
    console.log('\n✅ Cloudflare Worker is accessible');
  } else {
    console.log('\n❌ Worker health check failed. Please check worker deployment.');
  }
}

runTests();