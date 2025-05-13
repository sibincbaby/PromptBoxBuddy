import Dexie from 'dexie';

export const db = new Dexie('GeminiPromptTesterDB');

db.version(2).stores({
  settings: 'key', // Simple key-value store for settings like API key, modelName, etc.
  chats: '++id, timestamp', // Auto-incrementing ID, index on timestamp. Store chat messages array here.
  // Schema for chats store: { id?, timestamp: Date, messages: [{sender: string, text: string}], settings?: object }
  templates: '++id, name', // Store named configuration templates
  // Schema for templates: { id?, name: string, config: {modelName, systemPrompt, temperature, etc.} }
});

// Example: Initialize default settings if they don't exist
// This helps ensure the app has some defaults to work with on first load.
async function initializeDefaultSettings() {
  const defaultSettings = {
    apiKey: '',
    modelName: 'gemini-1.5-flash',
    systemPrompt: '',
    temperature: 0.9,
    topP: 1,
    maxOutputTokens: 2048,
    structuredOutput: false,
    outputSchema: '{\n  "type": "object",\n  "properties": {\n    "result": {\n      "type": "string"\n    }\n  }\n}',
    currentTemplateId: null, // Track the currently active template
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    const existing = await db.settings.get(key);
    if (!existing) {
      await db.settings.put({ key, value });
    }
  }
}

// Call initialization on startup
initializeDefaultSettings().catch(err => {
  console.error("Failed to initialize default settings:", err);
});

