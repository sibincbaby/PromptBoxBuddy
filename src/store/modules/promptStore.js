import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { geminiChat } from '../../services/geminiService'
import { db } from '../../db/db'

export const usePromptStore = defineStore('prompt', () => {
  // State
  const prompt = ref('')
  const response = ref('')
  const isLoading = ref(false)
  const error = ref(null)
  const currentChatId = ref(null)
  
  // Actions
  function setPrompt(value) {
    prompt.value = value
  }
  
  function setResponse(value) {
    response.value = value
  }
  
  async function submitPrompt() {
    if (!prompt.value.trim()) return
    
    isLoading.value = true
    error.value = null
    
    try {
      const result = await geminiChat(prompt.value)
      response.value = result // Directly update state for simplicity
      
      // Save to chat history in the database
      await saveToHistory(prompt.value, result)
      
      return result
    } catch (err) {
      error.value = err.message || 'Failed to get response'
      console.error('Error submitting prompt:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  // Split the saveToHistory function into smaller, more focused functions
  async function saveToHistory(userPrompt, modelResponse) {
    try {
      const timestamp = new Date().toISOString()
      
      if (currentChatId.value) {
        await appendToExistingChat(userPrompt, modelResponse, timestamp)
      } else {
        await createNewChat(userPrompt, modelResponse, timestamp)
      }
    } catch (err) {
      console.error('Error saving to history:', err)
    }
  }
  
  async function appendToExistingChat(userPrompt, modelResponse, timestamp) {
    const chat = await db.chats.get(currentChatId.value)
    if (!chat) {
      // If chat not found, create a new one
      await createNewChat(userPrompt, modelResponse, timestamp)
      return
    }
      
    // Add new messages to existing chat
    chat.messages.push(
      { sender: 'user', text: userPrompt },
      { sender: 'model', text: modelResponse }
    )
    chat.timestamp = timestamp // Update timestamp
    
    await db.chats.put(chat)
  }
  
  async function createNewChat(userPrompt, modelResponse, timestamp) {
    const chatId = await db.chats.add({
      timestamp,
      messages: [
        { sender: 'user', text: userPrompt },
        { sender: 'model', text: modelResponse }
      ]
    })
    
    // Set as current chat
    currentChatId.value = chatId
  }
  
  function clearPrompt() {
    prompt.value = ''
    response.value = ''
    error.value = null
  }
  
  function startNewChat() {
    currentChatId.value = null
    clearPrompt()
  }
  
  async function loadChat(chatId) {
    try {
      const chat = await db.chats.get(chatId)
      if (chat) {
        currentChatId.value = chatId
        // You might want to set the last prompt/response here
        // Or handle this differently depending on your UI needs
      }
    } catch (err) {
      console.error('Error loading chat:', err)
      error.value = 'Failed to load chat.'
    }
  }
  
  // Getters
  const hasResponse = computed(() => !!response.value)
  const isPromptEmpty = computed(() => !prompt.value.trim())
  
  return {
    // State
    prompt,
    response,
    isLoading,
    error,
    currentChatId,
    
    // Actions
    setPrompt,
    setResponse,
    submitPrompt,
    saveToHistory,
    clearPrompt,
    startNewChat,
    loadChat,
    
    // Getters
    hasResponse,
    isPromptEmpty
  }
}, {
  // Persistence configuration
  persist: {
    key: 'promptbox-current-prompt',
    storage: localStorage,
    paths: ['prompt', 'response', 'currentChatId'] // Persist these fields
  }
})