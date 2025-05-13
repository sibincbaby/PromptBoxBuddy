import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '../../db/db'
import { useSettingsStore } from './settingsStore' // Import settings store

export const useHistoryStore = defineStore('history', () => {
  // State
  const history = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  
  // Actions
  async function fetchAllChats() {
    isLoading.value = true
    error.value = null
    
    try {
      // Fetch all chats from database
      const chats = await db.chats.orderBy('timestamp').toArray()
      history.value = chats
    } catch (err) {
      error.value = err.message || 'Failed to fetch chats'
      console.error('Error fetching chats:', err)
    } finally {
      isLoading.value = false
    }
  }
  
  async function getChatById(id) {
    try {
      return await db.chats.get(id)
    } catch (err) {
      error.value = err.message || `Failed to get chat with id ${id}`
      console.error(`Error fetching chat ${id}:`, err)
      return null
    }
  }
  
  async function addChat(chatData) {
    try {
      // Add to database
      const id = await db.chats.add(chatData)
      
      // Update local state
      history.value.push({ id, ...chatData })
      
      // Enforce history limit after adding new chat
      await enforceHistoryLimit()
      
      return id
    } catch (err) {
      error.value = err.message || 'Failed to add chat'
      console.error('Error adding chat:', err)
      return null
    }
  }
  
  async function updateChat(id, chatData) {
    try {
      // Update in database
      await db.chats.update(id, chatData)
      
      // Update local state
      const index = history.value.findIndex(chat => chat.id === id)
      if (index !== -1) {
        history.value[index] = { id, ...chatData }
      }
      
      return id
    } catch (err) {
      error.value = err.message || `Failed to update chat with id ${id}`
      console.error(`Error updating chat ${id}:`, err)
      return null
    }
  }
  
  async function deleteChat(id) {
    try {
      // Delete from database
      await db.chats.delete(id)
      
      // Update local state
      history.value = history.value.filter(chat => chat.id !== id)
    } catch (err) {
      error.value = err.message || `Failed to delete chat with id ${id}`
      console.error(`Error deleting chat ${id}:`, err)
    }
  }
  
  async function clearAllChats() {
    try {
      // Clear database
      await db.chats.clear()
      
      // Clear local state
      history.value = []
    } catch (err) {
      error.value = err.message || 'Failed to clear all chats'
      console.error('Error clearing chats:', err)
    }
  }
  
  // Existing methods kept for backwards compatibility
  async function fetchHistory() {
    await fetchAllChats()
  }
  
  async function addToHistory(item) {
    return await addChat(item)
  }
  
  async function removeFromHistory(id) {
    await deleteChat(id)
  }
  
  async function clearHistory() {
    await clearAllChats()
  }
  
  // Improved method that uses the settings store directly
  async function enforceHistoryLimit() {
    const settingsStore = useSettingsStore()
    const limit = settingsStore.maxHistoryItems
    
    if (history.value.length <= limit) return
    
    try {
      // Get ids of items to remove (oldest first)
      const itemsToRemove = getItemsToRemove(history.value, limit)
      
      // Remove items from database
      await removeOldItems(itemsToRemove)
      
      // Update state
      history.value = history.value.filter(
        item => !itemsToRemove.some(i => i.id === item.id)
      )
    } catch (err) {
      console.error('Error enforcing history limit:', err)
    }
  }
  
  // Helper function to determine which items to remove
  function getItemsToRemove(items, limit) {
    return items
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(0, items.length - limit)
  }
  
  // Helper function to delete items from database
  async function removeOldItems(itemsToRemove) {
    for (const item of itemsToRemove) {
      await db.chats.delete(item.id)
    }
  }
  
  // Getters
  const historyItems = computed(() => history.value)
  const hasHistory = computed(() => history.value.length > 0)
  const sortedChats = computed(() => 
    [...history.value].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    )
  )
  
  return {
    // State
    history,
    isLoading,
    error,
    
    // Actions
    fetchAllChats,
    getChatById,
    addChat,
    updateChat, 
    deleteChat,
    clearAllChats,
    
    // Legacy methods (for backwards compatibility)
    fetchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    enforceHistoryLimit,
    
    // Getters
    historyItems,
    hasHistory,
    sortedChats
  }
}, {
  // Persistence configuration
  persist: {
    key: 'promptbox-history-state',
    storage: localStorage
  }
})