import { createApp } from 'vue'
import { createPinia } from 'pinia' 
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import './styles/style.css'
import App from './App.vue'
import router from './router'
import { useSettingsStore } from './store/modules/settingsStore'
import { useNotificationStore } from './store/modules/notificationStore'
import mitt from 'tiny-emitter/instance'

// Create Vue app
const app = createApp(App)

// Create and configure Pinia directly here to avoid any import issues
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Create global event emitter
const emitter = {
  on: (...args) => mitt.on(...args),
  off: (...args) => mitt.off(...args),
  emit: (...args) => mitt.emit(...args)
}

// Make emitter available to all components
app.provide('emitter', emitter)

// Make app version available to all components
app.provide('appVersion', __APP_VERSION__)

// Use plugins
app.use(router)
app.use(pinia)

// Initialize settings store
const settingsStore = useSettingsStore()
settingsStore.loadAllSettings()

// Initialize notification store for update messages
const notificationStore = useNotificationStore()

// Set up periodic checks for updates in PWA mode
if (window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true) {
  console.log('Running in PWA mode, setting up periodic checks');
  
  // Set up periodic checks every 30 minutes
  setInterval(() => {
    // Use Vue's emitter to trigger update check
    emitter.emit('check-for-updates', { silent: true });
    console.log('Automatically checking for updates (PWA mode)');
  }, 30 * 60 * 1000);
}

// Mount app
app.mount('#app')

