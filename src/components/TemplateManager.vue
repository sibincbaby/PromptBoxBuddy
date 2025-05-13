<template>
  <div class="template-manager">
    <!-- Template Selector (used in HomePage) -->
    <div v-if="mode === 'selector'" class="template-selector">
      <Combobox v-model="selectedTemplate" as="div" class="relative" :by="(a, b) => a?.id === b?.id">
        <div class="relative w-full">
          <ComboboxInput
            :displayValue="() => isOpen ? query : (selectedTemplate ? selectedTemplate.name : '')"
            placeholder="Select or search template"
            @change="query = $event.target.value"
            @focus="isOpen = true; query = ''"
            @click="isOpen = true; query = ''"
            v-model="query"
            class="w-full p-3 bg-white border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-shadow text-sm"
            :disabled="!hasTemplates"
          />
          <ComboboxButton 
            @click="isOpen = !isOpen"
            class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </ComboboxButton>
        </div>
        
        <Transition
          enter-active-class="transition duration-100 ease-out"
          enter-from-class="transform scale-95 opacity-0"
          enter-to-class="transform scale-100 opacity-100"
          leave-active-class="transition duration-75 ease-in"
          leave-from-class="transform scale-100 opacity-100"
          leave-to-class="transform scale-95 opacity-0"
        >
          <ComboboxOptions 
            v-if="isOpen" 
            static
            class="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
          >
            <div v-if="filteredTemplates.length === 0 && query !== ''" class="relative cursor-default select-none py-2 px-4 text-gray-600">
              No templates found.
            </div>
            
            <ComboboxOption
              v-for="template in filteredTemplates"
              :key="template.id"
              :value="template"
              v-slot="{ selected, active }"
              as="template"
            >
              <li 
                class="relative cursor-default select-none py-2 px-4"
                :class="{ 
                  'bg-indigo-600 text-white': active,
                  'text-gray-900': !active
                }"
                @click="isOpen = false"
              >
                <span class="block truncate" :class="{ 'font-medium': selected, 'font-normal': !selected }">
                  {{ template.name }}
                </span>
                <span 
                  v-if="selected"
                  class="absolute inset-y-0 right-0 flex items-center pr-3"
                  :class="{ 'text-white': active, 'text-indigo-600': !active }"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </span>
              </li>
            </ComboboxOption>
          </ComboboxOptions>
        </Transition>
      </Combobox>
    </div>

    <!-- Template Manager (used in SettingsPage) -->
    <div v-else-if="mode === 'manager'" class="template-manager-full">
      <div class="template-manager-header mb-4">
        <h3 class="text-base font-medium text-gray-800 mb-1">Configuration Templates</h3>
        <p class="text-sm text-gray-600">Your saved configurations that can be quickly applied.</p>
      </div>
    
      <div v-if="hasTemplates" class="saved-templates">
        <h4 class="text-sm font-medium text-gray-700 mb-3">Saved Templates</h4>
        <div class="templates-list space-y-3">
          <div 
            v-for="template in templates" 
            :key="template.id" 
            class="template-item bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md"
            :class="{ 
              'border-indigo-200 bg-indigo-50/30': isActiveTemplate(template.id),
              'border-green-200 bg-green-50/30': template.isDefault && !isActiveTemplate(template.id)
            }"
          >
            <div class="p-4">
              <div class="flex justify-between items-start mb-3">
                <div class="flex items-center">
                  <span class="font-medium text-gray-800">{{ template.name }}</span>
                  <span v-if="isActiveTemplate(template.id)" class="ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                  <span v-else-if="template.isDefault" class="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    Default
                  </span>
                </div>
              </div>
              
              <div class="flex border-t border-gray-100 pt-3 -mx-4 -mb-4">
                <button 
                  @click="loadTemplate(template.id)" 
                  class="flex-1 py-2 text-sm text-indigo-600 flex items-center justify-center hover:bg-indigo-50 transition-colors active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Load
                </button>
                <div class="w-px h-10 bg-gray-100 self-center"></div>
                <button 
                  @click="deleteTemplate(template.id)" 
                  class="flex-1 py-2 text-sm text-red-500 flex items-center justify-center hover:bg-red-50 transition-colors active:scale-95"
                  :class="{ 'opacity-50 cursor-not-allowed': template.isDefault }"
                  :disabled="template.isDefault"
                  :title="template.isDefault ? 'Default templates cannot be deleted' : 'Delete template'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 10h16" />
                  </svg>
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="py-8 flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-gray-100 text-center animate-fade-in">
        <div class="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
        </div>
        <p class="text-gray-600">You don't have any saved templates yet.</p>
        <p class="text-sm mt-2 text-gray-600">Use "Save Settings" to create templates.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSettingsStore } from '@/store/modules/settingsStore';
import { Combobox, ComboboxInput, ComboboxButton, ComboboxOptions, ComboboxOption } from '@headlessui/vue';

const props = defineProps({
  // 'selector' for dropdown in HomePage, 'manager' for full management in SettingsPage
  mode: {
    type: String,
    default: 'selector',
    validator: (value) => ['selector', 'manager'].includes(value)
  }
});

const emit = defineEmits(['template-changed']);

const settingsStore = useSettingsStore();
const selectedTemplateId = ref('');
const selectedTemplate = ref(null);
const query = ref('');
const isOpen = ref(false);

// Computed properties
const templates = computed(() => settingsStore.templates);
const currentTemplateId = computed(() => settingsStore.currentTemplateId);
const currentTemplateName = computed(() => settingsStore.currentTemplateName);
const hasTemplates = computed(() => templates.value.length > 0);

const filteredTemplates = computed(() => {
  if (query.value === '') return templates.value;
  
  const filtered = templates.value.filter((template) => 
    template.name.toLowerCase().includes(query.value.toLowerCase())
  );
  
  return filtered;
});

// Set selected template to match current template
onMounted(async () => {
  await settingsStore.loadTemplates();
  if (currentTemplateId.value) {
    selectedTemplateId.value = currentTemplateId.value;
    selectedTemplate.value = templates.value.find(t => t.id.toString() === currentTemplateId.value.toString());
  }
});

// Watch for changes in the templates collection
watch(() => templates.value, async (newTemplates) => {
  // Check if the selected template still exists in the templates collection
  if (selectedTemplateId.value) {
    const templateExists = newTemplates.some(t => t.id.toString() === selectedTemplateId.value.toString());
    
    if (!templateExists) {
      console.log('Selected template no longer exists, updating UI');
      // Get the default template
      const defaultTemplate = newTemplates.find(t => t.isDefault);
      
      if (defaultTemplate) {
        // Switch to default template
        selectedTemplateId.value = defaultTemplate.id.toString();
        selectedTemplate.value = defaultTemplate;
        await settingsStore.loadTemplate(defaultTemplate.id);
        emit('template-changed', defaultTemplate.id);
      } else {
        // Clear selection if no default template exists
        selectedTemplateId.value = '';
        selectedTemplate.value = null;
        await settingsStore.resetToDefaultSettings();
        emit('template-changed', null);
      }
    }
  }
}, { deep: true });

// Watch for changes in the selected template
watch(selectedTemplate, async (newTemplate) => {
  if (newTemplate) {
    selectedTemplateId.value = newTemplate.id.toString();
    // Close the dropdown when a template is selected
    isOpen.value = false;
    await settingsStore.loadTemplate(parseInt(newTemplate.id));
    // Emit event to notify parent component that template has changed
    emit('template-changed', newTemplate.id);
  }
});

// Methods
function isActiveTemplate(templateId) {
  return currentTemplateId.value === templateId.toString();
}

async function handleTemplateChange() {
  if (selectedTemplateId.value) {
    await settingsStore.loadTemplate(parseInt(selectedTemplateId.value));
    // Emit event after template is loaded
    emit('template-changed', parseInt(selectedTemplateId.value));
  }
}

async function loadTemplate(templateId) {
  await settingsStore.loadTemplate(templateId);
  selectedTemplateId.value = templateId.toString();
  selectedTemplate.value = templates.value.find(t => t.id.toString() === templateId.toString());
  
  // Emit event after template is loaded
  emit('template-changed', templateId);
  
  // Add haptic feedback if available
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(20);
  }
}

async function deleteTemplate(templateId) {
  if (confirm('Are you sure you want to delete this template?')) {
    await settingsStore.deleteTemplate(templateId);
    
    // Add haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([20, 30, 20]);
    }
  }
}

function onInputFocus() {
  query.value = '';
}

function openDropdown() {
  query.value = '';
}
</script>

<style scoped>
/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}
</style>