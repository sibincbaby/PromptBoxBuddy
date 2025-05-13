import { useSettingsStore } from '@/store/modules/settingsStore';
import { useAuthStore } from '@/store/modules/authStore';

// Define API endpoint for the Cloudflare worker
// In production, this should point to your deployed Cloudflare worker URL
const API_ENDPOINT = import.meta.env.VITE_GEMINI_API_ENDPOINT || 'https://llm-gateway.promptbox.workers.dev/api/generate';

export async function callGeminiApi(prompt) {
  const settingsStore = useSettingsStore();
  const authStore = useAuthStore();
  
  // Force a fresh load of settings before each API call to ensure the latest template settings are used
  await settingsStore.loadAllSettings();

  // Check if user is authenticated
  if (!authStore.isAuthenticated) {
    throw new Error('You must be signed in to use this feature.');
  }

  // If currentTemplateId exists, verify that the template still exists
  if (settingsStore.currentTemplateId) {
    const templateExists = settingsStore.templates.some(
      t => t.id === parseInt(settingsStore.currentTemplateId)
    );
    
    if (!templateExists) {
      console.log('Template used for this chat no longer exists, using default settings');
      await settingsStore.resetToDefaultSettings();
    }
  }

  // Check if API key is set locally (for development/fallback purposes)
  if (!settingsStore.apiKey) {
    throw new Error('API Key not set. Please configure it in the Settings page.');
  }

  try {
    // Get fresh id token for authentication
    let token = authStore.idToken;
    if (!token) {
      // Try to refresh the token
      token = await authStore.refreshIdToken();
      if (!token) {
        throw new Error('Authentication failed. Please sign in again.');
      }
    }
    
    // Log the current template being used
    console.log('Using template:', settingsStore.currentTemplateName || 'Default');
    
    // Get generation config from the settings store
    const generationConfig = settingsStore.getModelConfig();
    console.log('Current generation config:', JSON.stringify(generationConfig));

    // Check if structured output is enabled and has a valid schema
    const structuredOutputConfig = settingsStore.getStructuredOutputConfig();
    
    // Prepare request data for the worker
    const requestData = {
      prompt,
      modelName: settingsStore.modelName,
      systemPrompt: settingsStore.systemPrompt,
      generationConfig,
      structuredOutputConfig
    };
    
    // Make the API call to our Cloudflare worker with authentication
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });
    
    // Handle 401 Unauthorized errors by refreshing token and retrying
    if (response.status === 401) {
      // Try to refresh the token
      const newToken = await authStore.refreshIdToken();
      
      if (newToken) {
        // Retry with new token
        const retryResponse = await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`
          },
          body: JSON.stringify(requestData)
        });
        
        const retryData = await retryResponse.json();
        
        if (!retryResponse.ok) {
          throw new Error(retryData.error || 'Failed to get response from API');
        }
        
        return retryData.response;
      } else {
        throw new Error('Session expired. Please sign in again.');
      }
    }
    
    // Parse the JSON response
    const data = await response.json();
    
    // Check for errors
    if (!response.ok) {
      throw new Error(data.error || 'Failed to get response from API');
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Return the response
    return data.response;
  } catch (error) {
    console.error("Gemini API Error:", error);
    
    // Provide more specific error messages if possible
    if (error.message.includes('API key not valid')) {
      throw new Error('Invalid API Key. Please check your key in the Settings page.');
    }
    if (error.message.includes('quota')) {
      throw new Error('API quota exceeded. Please check your usage or try again later.');
    }
    if (error.message.includes('Schema error')) {
      throw error; // Pass through schema validation errors
    }
    if (error.message.includes('Authentication failed')) {
      throw new Error('Authentication failed. Please sign in again.');
    }
    
    throw new Error(error.message || 'An unknown error occurred while contacting the Gemini API.');
  }
}

// TODO: Implement streaming support
// TODO: Implement chat history context passing

