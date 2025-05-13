<template>
  <div class="home-page flex flex-col h-full bg-gray-50">
    <!-- Chat Area -->
    <div ref="chatAreaRef" class="chat-area flex-grow overflow-y-auto px-3 py-4 thin-scrollbar">
      <div class="flex flex-col space-y-4 mb-2">
        <!-- Empty State -->
        <div v-if="chatMessages.length === 0" class="flex flex-col items-center justify-center h-48 animate-fade-in">
          <!-- Template Selector -->
          <div class="mb-4 w-full max-w-md">
            <TemplateManager mode="selector" @template-changed="handleTemplateChanged" />
          </div>
          
          <div class="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p class="text-gray-600 text-center">Start a new conversation</p>
        </div>

        <!-- Messages -->
        <div v-for="(message, index) in chatMessages" :key="index" 
            :class="[
              'group max-w-[85%] break-words',
              message.sender === 'user' 
                ? 'ml-auto animate-slide-in' 
                : 'mr-auto animate-slide-in'
            ]">
          <!-- Message Content -->
          <div :class="[
            'px-4 py-3 rounded-2xl shadow-sm',
            message.sender === 'user' 
              ? 'bg-indigo-600 text-white rounded-br-sm' 
              : 'bg-white text-gray-800 rounded-bl-sm'
          ]">
            <pre class="whitespace-pre-wrap font-sans text-sm leading-relaxed">{{ message.text }}</pre>
          </div>
          
          <!-- Message Actions -->
          <div class="flex justify-end mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button v-if="message.sender === 'model'" 
                   @click="copyToClipboard(message.text)" 
                   class="text-xs text-gray-600 hover:text-gray-800 flex items-center focus-visible-ring rounded">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Copy
            </button>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="isLoading" class="flex items-center justify-center py-4">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0s"></div>
            <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-fade-in">
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
      </div>
    </div>

    <!-- Input Area -->
    <div class="input-area p-3 bg-white border-t border-gray-100 shadow-inner">
      <!-- Current Template Indicator -->
      <div v-if="currentTemplateName && chatMessages.length > 0" class="flex justify-center items-center mb-2">
        <span class="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
          {{ currentTemplateName }}
        </span>
      </div>
      
      <div class="flex items-end space-x-2 bg-gray-50 rounded-2xl px-3 py-2">
        <button @click="startNewChat" 
                class="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-indigo-600 focus:outline-none focus-visible-ring">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      
        <textarea ref="textareaRef" v-model="promptInput" 
                @input="autoResizeTextarea" 
                @keydown.enter.prevent="handleEnterKey" 
                placeholder="Ask anything..." 
                class="flex-grow bg-transparent text-sm p-2 max-h-32 min-h-[2.5rem] focus:outline-none resize-none" 
                rows="1"></textarea>
      
        <button v-if="promptInput.trim()"
                @click="clearInput" 
                class="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800 focus:outline-none focus-visible-ring">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      
        <button @click="sendPrompt" 
                :disabled="isLoading || !promptInput.trim()"
                :class="[
                  'p-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 transition-all transform',
                  promptInput.trim() && !isLoading 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-90' 
                    : 'bg-gray-400 text-white cursor-not-allowed'
                ]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { callGeminiApi } from '@/services/geminiService';
// Remove direct DB import and import stores instead
import { useHistoryStore } from '@/store/modules/historyStore';
import { useSettingsStore } from '@/store/modules/settingsStore';
import { useNotificationStore } from '@/store/modules/notificationStore';
import TemplateManager from '@/components/TemplateManager.vue';

const route = useRoute();
const router = useRouter();
const historyStore = useHistoryStore(); // Initialize history store
const settingsStore = useSettingsStore(); // Initialize settings store
const notificationStore = useNotificationStore(); // Initialize notification store

const promptInput = ref('');
const chatMessages = ref([]); // { sender: 'user' | 'model', text: '...' }
const isLoading = ref(false);
const error = ref(null);
const textareaRef = ref(null); // Ref for the textarea element
const chatAreaRef = ref(null); // Ref for the chat area div
const currentChatId = ref(null); // To track the current chat session ID in the DB

// Get current template name
const currentTemplateName = computed(() => settingsStore.currentTemplateName);

// Load templates on mount
onMounted(async () => {
  await settingsStore.loadTemplates();
});

// Handle template changed event from TemplateManager
const handleTemplateChanged = async (templateId) => {
  console.log('Template changed to ID:', templateId);
  
  // Refresh settings after template change
  await settingsStore.loadAllSettings();
  
  // Add haptic feedback to confirm the template change
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate([20, 30, 20]);
  }
  
  // Show a notification to confirm template change
  const templateName = settingsStore.currentTemplateName;
  if (templateName) {
    notificationStore.info(`Template changed to: ${templateName}`);
  }
};

// Function to scroll chat area to bottom with smooth animation
const scrollToBottom = () => {
  nextTick(() => {
    const chatArea = chatAreaRef.value;
    if (chatArea) {
      chatArea.scrollTo({
        top: chatArea.scrollHeight,
        behavior: 'smooth'
      });
    }
  });
};

// Auto-resize textarea based on content
const autoResizeTextarea = () => {
  const textarea = textareaRef.value;
  if (textarea) {
    textarea.style.height = 'auto'; // Reset height
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`; // Set to scroll height with max
  }
};

// Load chat if ID is provided in route query params
const loadChat = async (chatId) => {
  if (!chatId) {
    startNewChat(); // Ensure it's a new chat if no ID
    return;
  }
  try {
    const id = parseInt(chatId);
    // Use historyStore to get chat by id instead of direct DB access
    const chat = await historyStore.getChatById(id);
    if (chat) {
      chatMessages.value = chat.messages;
      currentChatId.value = chat.id;
      
      // Check if this chat was using a template, and if that template still exists
      if (chat.templateId) {
        await settingsStore.loadTemplates(); // Make sure templates are loaded
        const templateExists = settingsStore.templates.some(t => t.id === parseInt(chat.templateId));
        
        if (templateExists) {
          // Load the template this chat was using
          await settingsStore.loadTemplate(parseInt(chat.templateId));
          console.log('Loaded template for chat:', settingsStore.currentTemplateName);
        } else {
          // Template was deleted, switch to default
          console.log('Template used by this chat was deleted, switching to default settings');
          await settingsStore.resetToDefaultSettings();
          
          // Add an informative message to the chat
          chatMessages.value.push({
            sender: 'model',
            text: 'Note: The template previously used in this conversation has been deleted. Using default settings now.'
          });
        }
      }
      
      scrollToBottom();
    } else {
      console.warn(`Chat with ID ${chatId} not found. Starting new chat.`);
      router.replace({ query: {} }); // Remove invalid ID from URL
      startNewChat();
    }
  } catch (err) {
    console.error('Failed to load chat:', err);
    error.value = 'Failed to load chat history.';
    startNewChat();
  }
};

// Watch for changes in route query parameter 'chatId'
onMounted(() => {
  autoResizeTextarea();
  loadChat(route.query.chatId);
});

watch(() => route.query.chatId, (newChatId) => {
  // Only reload if the ID actually changes or if navigating back to Home without an ID
  if (newChatId !== currentChatId.value?.toString()) {
     loadChat(newChatId);
  }
});

const handleEnterKey = (event) => {
  if (event.shiftKey) {
    return;
  }
  sendPrompt();
};

// Function to save the current chat session using the store
const saveChatSession = async () => {
  if (chatMessages.value.length === 0) return; // Don't save empty chats

  const chatData = {
    messages: JSON.parse(JSON.stringify(chatMessages.value)), // Deep copy
    timestamp: new Date(),
    // Store template ID with the chat
    templateId: settingsStore.currentTemplateId,
    templateName: settingsStore.currentTemplateName
  };

  try {
    let id;
    if (currentChatId.value) {
      // Update existing chat through the store
      id = await historyStore.updateChat(currentChatId.value, chatData);
    } else {
      // Add new chat and get the new ID through the store
      id = await historyStore.addChat(chatData);
      currentChatId.value = id;
      // Update URL without reloading page/triggering watcher unnecessarily
      router.replace({ query: { chatId: id } });
    }
    console.log('Chat session saved/updated with ID:', id);
  } catch (err) {
    console.error('Failed to save chat session:', err);
    // Don't show this error to the user directly, maybe log it
  }
};

const sendPrompt = async () => {
  if (!promptInput.value.trim() || isLoading.value) return;

  const currentPrompt = promptInput.value.trim();
  chatMessages.value.push({ sender: 'user', text: currentPrompt });
  promptInput.value = '';
  autoResizeTextarea();
  scrollToBottom();
  isLoading.value = true;
  error.value = null;

  try {
    const responseText = await callGeminiApi(currentPrompt);
    // Add a small delay for a more natural feeling conversation flow
    setTimeout(() => {
      chatMessages.value.push({ sender: 'model', text: responseText });
      isLoading.value = false;
      // Add subtle haptic feedback if available
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
      // Save chat session after successful response
      saveChatSession();
      scrollToBottom();
    }, 300);
  } catch (err) {
    console.error('API Error:', err);
    error.value = err.message || 'Failed to get response from API.';
    isLoading.value = false;
    scrollToBottom();
  }
};

const clearInput = () => {
  promptInput.value = '';
  autoResizeTextarea();
  // Add subtle haptic feedback
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(20);
  }
};

const startNewChat = () => {
  chatMessages.value = [];
  promptInput.value = '';
  error.value = null;
  isLoading.value = false;
  currentChatId.value = null; // Reset current chat ID
  autoResizeTextarea();
  // Remove chatId from URL query params
  if (route.query.chatId) {
    router.replace({ query: {} });
  }
  console.log('Started new chat session.');
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    // Add subtle haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([30, 30, 30]);
    }
    // Use notification store instead of DOM manipulation
    notificationStore.info('Copied to clipboard');
  } catch (err) {
    console.error('Failed to copy text: ', err);
    notificationStore.error('Failed to copy text');
  }
};
</script>

<style scoped>
/* Scoped styles for HomePage */
.home-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Improve animations for message appearance */
@keyframes messageAppear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Custom styling for the send button when active */
.send-button:active {
  transform: scale(0.9);
  transition: transform 0.2s;
}

/* Stylish scrollbar for mobile */
.chat-area {
  scrollbar-width: thin;
  scroll-behavior: smooth;
}

.chat-area::-webkit-scrollbar {
  width: 4px;
}

.chat-area::-webkit-scrollbar-thumb {
  background-color: rgba(203, 213, 225, 0.5);
  border-radius: 4px;
}

textarea {
  min-height: 40px;
  max-height: 200px;
  overflow-y: auto;
  transition: height 0.2s ease;
}
</style>

