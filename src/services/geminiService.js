import { useSettingsStore } from '@/store/modules/settingsStore';

// Define API endpoint for the Cloudflare worker
// In production, this should point to your deployed Cloudflare worker URL
const API_ENDPOINT = import.meta.env.VITE_GEMINI_API_ENDPOINT || 'https://llm-gateway.promptbox.workers.dev/api/generate';

export async function callGeminiApi(prompt) {
  const settingsStore = useSettingsStore();
  
  // Force a fresh load of settings before each API call to ensure the latest template settings are used
  await settingsStore.loadAllSettings();

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
    
    // Make the API call to our Cloudflare worker
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });
    
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
    
    throw new Error(error.message || 'An unknown error occurred while contacting the Gemini API.');
  }
}

// TODO: Implement streaming support
// TODO: Implement chat history context passing

