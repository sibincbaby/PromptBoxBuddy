<template>
  <div class="p-4 pb-16 bg-gray-50">
    <h2 class="text-xl font-medium mb-5 px-1">Settings</h2>

    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="flex space-x-2">
        <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
        <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
      </div>
    </div>
    
    <div v-else-if="error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4 animate-fade-in">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <div v-else class="space-y-5">
      <!-- API Key Configuration -->
      <form @submit.prevent="saveApiKey" class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="p-4 border-b border-gray-100">
          <h3 class="text-base font-medium text-gray-800">API Configuration</h3>
        </div>
        
        <!-- API Key -->
        <div class="p-4">
          <label for="apiKey" class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
          <div class="relative">
            <input :type="showApiKey ? 'text' : 'password'" id="apiKey" v-model="settings.apiKey" 
                  placeholder="Enter your Gemini API Key" 
                  class="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow text-sm" />
            <button 
              type="button" 
              @click="showApiKey = !showApiKey" 
              class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 hover:text-gray-800 focus-visible-ring rounded-full"
              :aria-label="showApiKey ? 'Hide API key' : 'Show API key'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                     :d="showApiKey 
                         ? 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21' 
                         : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'" />
              </svg>
            </button>
          </div>
          <p class="mt-2 text-xs text-accessible-gray">Your API key is stored locally in your browser and is required to use the Gemini API.</p>
          <p class="mt-1 text-xs text-accessible-gray">Visit <a href="https://ai.google.dev/" target="_blank" class="text-indigo-600 hover:underline focus-visible-ring rounded">Google AI Studio</a> to get an API key.</p>
          
          <!-- Save API Key button inside API Configuration section -->
          <div class="flex justify-end mt-4">
            <button 
              type="submit" 
              class="w-full sm:w-auto px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors active:scale-95 focus-visible-ring"
              :disabled="isApiKeyEmpty"
            >
              Save API Key
            </button>
          </div>
        </div>
      </form>

      <!-- Version Information and Updates -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden">
        <div class="p-4 border-b border-gray-100">
          <h3 class="text-base font-medium text-gray-800">App Information</h3>
        </div>
        
        <div class="p-4">
          <div class="flex justify-between items-center mb-3">
            <span class="text-sm text-gray-700">Version</span>
            <span v-if="updateAvailable" class="text-sm font-medium">
              {{ appVersion }} 
              <span class="text-green-600">
                (Update available: {{ pendingVersion || 'New version' }})
              </span>
            </span>
            <span v-else class="text-sm font-medium">{{ appVersion }}</span>
          </div>
          
          <div class="flex justify-between items-center mb-4">
            <span class="text-sm text-gray-700">Last Updated</span>
            <span class="text-sm font-medium">{{ lastUpdatedFormatted }}</span>
          </div>
          
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p class="text-xs text-accessible-gray">Check for new app updates and install them.</p>
            <button 
              type="button" 
              @click="checkForUpdates"
              :disabled="isCheckingForUpdates"
              class="w-full sm:w-auto px-3 py-2 text-xs font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors active:scale-95 focus-visible-ring whitespace-nowrap"
            >
              <span v-if="isCheckingForUpdates">Checking...</span>
              <span v-else>Check for Updates</span>
            </button>
          </div>
          
          <div v-if="updateAvailable" class="mt-3">
            <div class="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-green-700">Update available! Click to install:</p>
                  <button 
                    @click="installUpdate" 
                    class="mt-1 text-sm font-medium text-green-700 underline focus-visible-ring rounded"
                  >
                    Install Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, inject } from 'vue';
import { useSettingsStore } from '@/store/modules/settingsStore';
import { useNotificationStore } from '@/store/modules/notificationStore';

// Import the necessary registration functions from vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/vue';

// Use vite-plugin-pwa's built-in update registration
const { updateServiceWorker, needRefresh, offlineReady } = useRegisterSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    console.log('Service worker registered:', swUrl);
    swRegistration.value = registration;
  },
  onRegisterError(error) {
    console.error('Service worker registration error:', error);
  },
  onOfflineReady() {
    console.log('App ready for offline use');
    offlineReady.value = true;
  },
  onNeedRefresh() {
    console.log('New content available, need to refresh');
    updateAvailable.value = true;
    checkNewVersion();
  }
});

// Use the settings store
const settingsStore = useSettingsStore();
const notificationStore = useNotificationStore();

// Initialize reactive settings object with only API Key
const settings = reactive({
  apiKey: '', // Initialize with empty string
});

// UI state variables
const isLoading = ref(true);
const error = ref(null);
const showApiKey = ref(false);
const isCheckingForUpdates = ref(false);
const updateAvailable = ref(false);
const pendingVersion = ref(null); // Store pending version when update is available
const swRegistration = ref(null); // Store service worker registration

// Computed property to check if API key is empty
const isApiKeyEmpty = computed(() => {
  return !settings.apiKey || settings.apiKey.trim() === '';
});

// Get app version from the global variable via inject
const appVersion = inject('appVersion');

// Last updated date
const lastUpdatedFormatted = computed(() => {
  if (!settingsStore.lastUpdated) {
    return "Not available";
  }
  
  const date = new Date(settingsStore.lastUpdated);
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Load settings from store when component mounts
const loadSettings = async () => {
  isLoading.value = true;
  error.value = null;
  
  try {
    // Load only API key from the store
    settings.apiKey = settingsStore.apiKey;
    console.log("API Key loaded successfully");
  } catch (err) {
    console.error("Failed to load API Key:", err);
    error.value = err.message || 'Could not load settings from database.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadSettings();
  setupUpdateDetection();
});

// Save API Key to the store - updated method name for clarity
const saveApiKey = async () => {
  isLoading.value = true;
  
  try {
    // Save only API Key to the store
    await settingsStore.setApiKey(settings.apiKey);
    
    // Add haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([30, 30, 30]);
    }
    
    // Use notification store
    notificationStore.success('API Key saved successfully');
    
  } catch (err) {
    console.error("Failed to save API Key:", err);
    
    // Use notification store for error
    notificationStore.error('Failed to save API Key');
    
    // Add error haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }
  } finally {
    isLoading.value = false;
  }
};

// Enhanced update detection setup aligned with vite-plugin-pwa
const setupUpdateDetection = async () => {
  // Check if we're in a PWA context
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true;
  
  console.log(`Running in ${isPWA ? 'PWA' : 'browser'} mode`);
  
  // Set up polling for updates if in PWA mode
  if (isPWA) {
    // Poll for updates every 15 minutes in PWA mode
    setInterval(() => {
      if (!isCheckingForUpdates.value) {
        console.log('Auto-checking for updates...');
        checkForUpdates(true); // Silent check
      }
    }, 15 * 60 * 1000);
  }
};

// Fetch and check the new version from package.json
const checkNewVersion = async () => {
  try {
    // Add cache-busting parameter to avoid getting cached version
    const response = await fetch('/package.json?t=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (response.ok) {
      const packageData = await response.json();
      console.log('Remote version:', packageData.version, 'Current version:', appVersion);
      
      if (packageData.version !== appVersion) {
        pendingVersion.value = packageData.version;
        updateAvailable.value = true;
        notificationStore.success(`Update available: ${packageData.version}`);
      }
    }
  } catch (err) {
    console.error('Error fetching updated version:', err);
  }
};

// Check for app updates - enhanced for PWA support and aligned with vite-plugin-pwa
const checkForUpdates = async (silent = false) => {
  if (!silent) {
    isCheckingForUpdates.value = true;
    error.value = null;
  }
  
  try {
    // Force check for updates using vite-plugin-pwa's mechanism
    await updateServiceWorker(true);
    
    // Directly check for version updates by fetching package.json
    await checkNewVersion();
    
    // If no updates were found and this wasn't a silent check
    if (!updateAvailable.value && !silent) {
      notificationStore.info('Your app is up to date!');
      // Update the "last checked" timestamp
      settingsStore.setLastUpdated(new Date().toISOString());
    }
  } catch (err) {
    console.error('Error checking for updates:', err);
    if (!silent) {
      notificationStore.error('Failed to check for updates');
      error.value = err.message || 'Failed to check for updates';
    }
  } finally {
    if (!silent) {
      isCheckingForUpdates.value = false;
    }
  }
};

// Install available update using vite-plugin-pwa mechanism
const installUpdate = () => {
  if (needRefresh.value) {
    console.log('Installing update via vite-plugin-pwa reload mechanism');
    updateServiceWorker(false); // This activates the waiting service worker
  } else if (updateAvailable.value) {
    console.log('Manually triggering update process');
    // For PWA environments, use location reload with cache busting
    window.location.href = window.location.href.split('?')[0] + '?updated=' + Date.now();
  } else {
    // No update available, force a check
    checkForUpdates();
  }
};
</script>

<style scoped>
/* Animations for toast notifications */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

