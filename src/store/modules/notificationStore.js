import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref([])
  
  // Actions
  function show(message, options = {}) {
    const id = Date.now().toString()
    const notification = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration !== undefined ? options.duration : 3000,
      visible: true
    }
    
    notifications.value.push(notification)
    
    // Auto-close after duration if a positive duration is provided
    if (notification.duration > 0) {
      setTimeout(() => {
        close(id)
      }, notification.duration)
    }
    
    return id
  }
  
  function success(message, options = {}) {
    return show(message, { ...options, type: 'success' })
  }
  
  function error(message, options = {}) {
    return show(message, { ...options, type: 'error' })
  }
  
  function info(message, options = {}) {
    return show(message, { ...options, type: 'info' })
  }
  
  function warning(message, options = {}) {
    return show(message, { ...options, type: 'warning' })
  }
  
  function close(id) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      const notification = notifications.value[index]
      notification.visible = false
      
      // Remove from array after animation completes
      setTimeout(() => {
        notifications.value = notifications.value.filter(n => n.id !== id)
      }, 500) // Match the duration of the fade animation
    }
  }
  
  function closeAll() {
    notifications.value.forEach(notification => {
      notification.visible = false
    })
    
    // Remove all after animation completes
    setTimeout(() => {
      notifications.value = []
    }, 500)
  }
  
  return {
    notifications,
    show,
    success,
    error,
    info,
    warning,
    close,
    closeAll
  }
})