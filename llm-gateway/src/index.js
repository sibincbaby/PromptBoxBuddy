/**
 * Cloudflare Worker for PromptBox Gemini API Gateway
 * 
 * This worker acts as a secure proxy for Google's Gemini API, allowing us to:
 * 1. Keep the API key secure (stored as a Cloudflare secret)
 * 2. Provide a consistent API endpoint for the frontend
 * 3. Handle rate limiting and error management
 * 4. Verify Firebase authentication tokens
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Define allowed origins for CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://promptbox.app'
];

// Helper function to handle CORS
function handleCors(request) {
  const origin = request.headers.get('Origin');
  const corsHeaders = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };

  // Add the origin if it's allowed
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  }

  return corsHeaders;
}

// Helper function to verify Firebase JWT token
async function verifyFirebaseToken(token, env) {
  try {
    // For production, ideally use Firebase Admin SDK with Workers
    // This is a simplified approach using Firebase's REST API for verification
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${env.FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          idToken: token
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error("Token verification failed:", data.error);
      return null;
    }
    
    // Return user data if token is valid
    return data.users?.[0] || null;
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// Process Gemini API request
async function processGeminiRequest(request, env) {
  try {
    // Check for authentication token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify token
    const userData = await verifyFirebaseToken(token, env);
    if (!userData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // User is authenticated, continue with request processing
    console.log(`Authenticated user: ${userData.email}`);
    
    // Parse request body
    const requestData = await request.json();
    const { 
      prompt, 
      modelName, 
      systemPrompt, 
      generationConfig, 
      structuredOutputConfig 
    } = requestData;

    // Validate required fields
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize the Gemini API with the secret API key
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    
    // Configure the model
    const model = genAI.getGenerativeModel({ 
      model: modelName || 'gemini-pro',
      // Add systemInstruction if systemPrompt is provided
      ...(systemPrompt && { systemInstruction: systemPrompt })
    });

    let response;
    
    // Handle structured output if configured
    if (structuredOutputConfig && structuredOutputConfig.schema) {
      try {
        const result = await model.generateContent({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            ...generationConfig,
            responseMimeType: "application/json",
            responseSchema: structuredOutputConfig.schema
          }
        });
        
        response = await result.response;
        const text = response.text();
        
        // Format the JSON response for better readability
        try {
          const jsonResponse = JSON.parse(text);
          return new Response(
            JSON.stringify({ 
              success: true, 
              response: JSON.stringify(jsonResponse, null, 2) 
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        } catch (jsonError) {
          // Return as is if it's not valid JSON
          return new Response(
            JSON.stringify({ success: true, response: text }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (schemaError) {
        console.error("Structured output error:", schemaError);
        return new Response(
          JSON.stringify({ 
            error: `Schema error: ${schemaError.message}. Please check your JSON schema.` 
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Simple text-only prompt without structured output
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: generationConfig || {}
      });
      
      response = await result.response;
      const text = response.text();
      
      return new Response(
        JSON.stringify({ success: true, response: text }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Provide specific error messages for common issues
    let errorMessage = 'An unknown error occurred while contacting the Gemini API.';
    let statusCode = 500;
    
    if (error.message.includes('API key not valid')) {
      errorMessage = 'Invalid API Key. Please check your environment variables.';
      statusCode = 401;
    } else if (error.message.includes('quota')) {
      errorMessage = 'API quota exceeded. Please check your usage or try again later.';
      statusCode = 429;
    } else if (error.message.includes('Schema error')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: statusCode, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Main worker entry point
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const corsHeaders = handleCors(request);
    
    // Handle OPTIONS request (preflight)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }
    
    // Handle Gemini API endpoint
    if (url.pathname === '/api/generate' && request.method === 'POST') {
      const response = await processGeminiRequest(request, env);
      
      // Add CORS headers to the response
      const responseHeaders = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });
      
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    }
    
    // Health check endpoint
    if (url.pathname === '/health' || url.pathname === '/') {
      return new Response(
        JSON.stringify({ status: 'ok', version: '1.0.0' }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Handle 404 for other routes
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
};
