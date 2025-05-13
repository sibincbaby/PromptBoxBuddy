<template>
  <div class="p-4 pb-16">
    <h2 class="text-xl font-medium mb-5 px-1">Templates</h2>
    
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center py-8">
      <div class="flex space-x-2">
        <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
        <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
        <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
      </div>
    </div>
    
    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fade-in">
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
    
    <!-- Empty State -->
    <div v-else-if="templates.length === 0" class="py-12 flex flex-col items-center justify-center animate-fade-in">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      </div>
      <p class="text-gray-500 mb-4">No templates yet</p>
      <button @click="navigateToNewTemplate()" 
              class="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors active:scale-95">
        Create Template
      </button>
    </div>
    
    <!-- Templates List -->
    <div v-else>
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <div class="text-sm text-gray-500">
          {{ templates.length }} template{{ templates.length !== 1 ? 's' : '' }}
        </div>
      </div>
      
      <!-- Templates Cards -->
      <ul class="space-y-3">
        <li v-for="template in templates" :key="template.id" 
            class="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md animate-slide-up">
          <div class="relative template-card">
            <!-- Card Content -->
            <div class="p-4">
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center">
                  <h3 class="font-medium text-gray-800">{{ template.name }}</h3>
                  <span v-if="isActiveTemplate(template.id)" class="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                  <span v-else-if="template.isDefault" class="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    Default
                  </span>
                </div>
              </div>
              
              <!-- Template Details Preview -->
              <div class="mt-2 grid grid-cols-2 gap-2 text-xs border-t border-gray-50 pt-2">
                <div class="bg-gray-50 p-2 rounded">
                  <span class="font-medium">Model:</span> {{ getModelLabel(template.config.modelName) }}
                </div>
                <div class="bg-gray-50 p-2 rounded">
                  <span class="font-medium">Temperature:</span> {{ template.config.temperature.toFixed(1) }}
                </div>
                <div class="bg-gray-50 p-2 rounded truncate">
                  <span class="font-medium">System:</span> {{ template.config.systemPrompt ? (template.config.systemPrompt.substring(0, 15) + "...") : "None" }}
                </div>
                <div class="bg-gray-50 p-2 rounded">
                  <span class="font-medium">Max Tokens:</span> {{ template.config.maxOutputTokens }}
                </div>
              </div>
              
              <!-- Action Area -->
              <div class="flex mt-3 pt-2 border-t border-gray-100">
                <!-- Only show action buttons for non-default templates -->
                <template v-if="!template.isDefault">
                  <button @click="viewTemplate(template.id)" 
                        class="flex-1 py-1 text-sm text-gray-600 flex items-center justify-center transition-transform active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                  
                  <div class="w-px h-6 bg-gray-100 self-center"></div>
                  
                  <button @click="editTemplate(template.id)"
                        class="flex-1 py-1 text-sm text-indigo-600 flex items-center justify-center transition-transform active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    Edit
                  </button>
                  
                  <div class="w-px h-6 bg-gray-100 self-center"></div>
                  
                  <button @click="confirmDelete(template.id)"
                        class="flex-1 py-1 text-sm text-red-500 flex items-center justify-center transition-transform active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </template>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" 
         class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fade-in"
         style="overflow: hidden;">
      <div class="bg-white rounded-lg w-11/12 max-w-sm p-5 shadow-lg animate-slide-up transform translate-y-0 my-auto mx-auto">
        <h3 class="text-lg font-medium mb-3">Delete Template</h3>
        <p class="text-gray-600 mb-5">Are you sure you want to delete this template? This action cannot be undone.</p>
        
        <div class="flex justify-end space-x-3">
          <button @click="showDeleteModal = false"
                 class="px-4 py-2 text-gray-500 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors">
            Cancel
          </button>
          <button @click="deleteConfirmed"
                 class="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useSettingsStore } from '@/store/modules/settingsStore';
import { useNotificationStore } from '@/store/modules/notificationStore';
import { inject } from 'vue';

const router = useRouter();
const route = useRoute();
const settingsStore = useSettingsStore();
const notificationStore = useNotificationStore();
const emitter = inject('emitter');

// State
const templates = ref([]);
const isLoading = ref(true);
const error = ref(null);
const showDeleteModal = ref(false);
const templateToDelete = ref(null);

// Available model options for display
const availableModels = [
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' }
];

// Current template from the store
const currentTemplateId = computed(() => settingsStore.currentTemplateId);

// Listen for the event from the FAB
const openModalListener = () => {
  // Navigate to the new template creation page
  navigateToNewTemplate();
};

// Watch for changes in the route query parameters
watch(() => route.query.refresh, async (newVal) => {
  if (newVal) {
    console.log('Detected refresh parameter, reloading templates');
    await refreshTemplates();
  }
});

// Set up optimistic template handling
onMounted(async () => {
  isLoading.value = true;
  
  try {
    // Load templates with cache-first approach
    await settingsStore.loadTemplates();
    templates.value = [...settingsStore.templates]; 
  } catch (err) {
    console.error("Failed to load templates:", err);
    error.value = err.message || 'Could not load templates.';
  } finally {
    isLoading.value = false;
  }

  // Add event listener for FAB
  emitter.on('open-new-template-modal', openModalListener);
});

// Watch for changes in the templates store
watch(() => settingsStore.templates, (newTemplates) => {
  // Update the local templates reference to trigger reactivity
  templates.value = [...newTemplates];
}, { deep: true });

// Methods
const isActiveTemplate = (templateId) => {
  return currentTemplateId.value === templateId.toString();
};

const getModelLabel = (modelValue) => {
  const model = availableModels.find(m => m.value === modelValue);
  return model ? model.label : modelValue;
};

const applyTemplate = async (templateId) => {
  try {
    await settingsStore.loadTemplate(templateId);
    
    // Add haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([20, 30, 20]);
    }
    
    // Show success message
    showStatusMessage('Template applied successfully');
  } catch (err) {
    console.error("Failed to apply template:", err);
    showStatusMessage('Failed to apply template');
  }
};

const navigateToNewTemplate = () => {
  // Add haptic feedback
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(20);
  }
  
  // Force component recreation with timestamp
  router.push(`/template/new?t=${Date.now()}`);
};

const editTemplate = (templateId) => {
  // Add haptic feedback
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(20);
  }
  
  router.push(`/template/edit/${templateId}`);
};

const viewTemplate = (templateId) => {
  // Add haptic feedback
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(20);
  }
  
  router.push(`/template/view/${templateId}`);
};

const confirmDelete = (templateId) => {
  // Add haptic feedback
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate([20, 30, 20]);
  }
  
  templateToDelete.value = templateId;
  showDeleteModal.value = true;
};

const deleteConfirmed = async () => {
  if (!templateToDelete.value) return;
  
  try {
    // Use optimistic delete for instant UI update
    showDeleteModal.value = false;
    
    // Show success message immediately
    showStatusMessage('Template deleted');
    
    // Perform optimistic delete - UI updates instantly
    await settingsStore.deleteTemplateOptimistic(templateToDelete.value);
    templateToDelete.value = null;
    
    // Add haptic feedback for confirmation
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  } catch (err) {
    console.error(`Failed to delete template ${templateToDelete.value}:`, err);
    showStatusMessage('Failed to delete template');
    showDeleteModal.value = false;
  }
};

// Create template button
const createTemplate = () => {
  router.push('/template/create');
};

// Method to refresh templates list when needed
const refreshTemplates = async () => {
  isLoading.value = true;
  try {
    await settingsStore.loadTemplates();
    templates.value = settingsStore.templates;
  } catch (err) {
    console.error("Failed to refresh templates:", err);
  } finally {
    isLoading.value = false;
  }
};

// Show status message that automatically hides after a delay
const showStatusMessage = (message) => {
  // Use notification store instead of local state
  notificationStore.info(message);
};
</script>

<style scoped>
/* Template card hover effect */
.template-card {
  transition: all 0.2s ease;
}

.template-card:active {
  transform: scale(0.98);
}

/* Animation for toast notification */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.2s ease-in-out;
}

.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>