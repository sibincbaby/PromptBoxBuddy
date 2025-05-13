<template>
  <div class="p-4 pb-16">
    <h2 class="text-xl font-medium mb-5 px-1">Chat History</h2>
    
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
    <div v-else-if="chatHistory.length === 0" class="py-12 flex flex-col items-center justify-center animate-fade-in">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p class="text-gray-600">No chat history yet</p>
    </div>
    
    <!-- History List -->
    <ul v-else class="space-y-3">
      <li v-for="(chat, index) in chatHistory" :key="chat.id" 
          class="bg-white rounded-xl shadow-sm overflow-hidden transition-all animate-slide-up" 
          :style="{ animationDelay: `${index * 50}ms` }">
        <div class="relative history-card">
          <!-- Card Content -->
          <div @click="loadChat(chat.id)" class="p-4 active:bg-gray-50 transition-colors">
            <div class="flex justify-between items-start">
              <div class="flex-1 pr-4">
                <p class="text-sm text-accessible-gray mb-1">{{ formatTimestamp(chat.timestamp) }}</p>
                <p class="text-gray-800 font-medium text-base truncate">{{ getChatTitle(chat.messages) }}</p>
                <p class="text-sm text-accessible-gray mt-1 line-clamp-2 overflow-hidden">{{ getChatPreview(chat.messages) }}</p>
              </div>
              
              <div class="flex flex-col items-center text-xs text-gray-600">
                <span class="bg-gray-100 rounded-full w-7 h-7 flex items-center justify-center mb-1">
                  {{ chat.messages.length }}
                </span>
                <span>msgs</span>
              </div>
            </div>
            
            <!-- Action Area -->
            <div class="flex mt-3 pt-2 border-t border-gray-100">
              <button @click.stop="loadChat(chat.id)" 
                    class="flex-1 py-1 text-sm text-indigo-600 flex items-center justify-center transition-transform active:scale-95 focus-visible-ring rounded">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Open Chat
              </button>
              
              <div class="w-px h-6 bg-gray-100 self-center"></div>
              
              <button @click.stop="confirmDelete(chat.id)"
                    class="flex-1 py-1 text-sm text-red-500 flex items-center justify-center transition-transform active:scale-95 focus-visible-ring rounded">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </li>
    </ul>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" 
         class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 animate-fade-in"
         style="overflow: hidden;">
      <div class="bg-white rounded-lg w-11/12 max-w-sm p-5 shadow-lg animate-slide-up transform translate-y-0 my-auto mx-auto">
        <h3 class="text-lg font-medium mb-3">Delete Chat</h3>
        <p class="text-gray-600 mb-5">Are you sure you want to delete this chat? This action cannot be undone.</p>
        
        <div class="flex justify-end space-x-3">
          <button @click="showDeleteModal = false"
                 class="px-4 py-2 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors focus-visible-ring">
            Cancel
          </button>
          <button @click="deleteConfirmed"
                 class="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors focus-visible-ring">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
// Replace direct DB import with historyStore
import { useHistoryStore } from '@/store/modules/historyStore';
import { useObservable } from '@vueuse/rxjs'; // Using vueuse for live updates
import { liveQuery } from 'dexie';

const router = useRouter();
const historyStore = useHistoryStore(); // Initialize history store
const isLoading = ref(true);
const error = ref(null);
const showDeleteModal = ref(false);
const chatToDelete = ref(null);
const chatHistoryData = ref([]);

// Use liveQuery to automatically update the list when DB changes
const chatHistory = computed(() => chatHistoryData.value || []);

onMounted(async () => {
  try {
    isLoading.value = true;
    error.value = null;
    // Use the history store to fetch chats instead of direct DB access
    await historyStore.fetchAllChats();
    chatHistoryData.value = historyStore.sortedChats;
  } catch (err) {
    console.error("Failed to fetch chat history:", err);
    error.value = err.message || 'Could not load history.';
    chatHistoryData.value = []; // Ensure it's always an array
  } finally {
    isLoading.value = false;
  }
  
  // Set up live query for real-time updates
  // We can still use liveQuery here but fetch data through the store
  useObservable(
    liveQuery(async () => {
      try {
        await historyStore.fetchAllChats();
        chatHistoryData.value = historyStore.sortedChats;
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
        error.value = err.message || 'Could not load history.';
      }
    })
  );
});

const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'Unknown date';
  
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();
  
  if (isToday) {
    return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (isYesterday) {
    return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return date.toLocaleDateString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }
};

const getChatTitle = (messages) => {
  if (!messages || messages.length === 0) return 'Empty chat';
  // Find the first user message as a title
  const firstUserMessage = messages.find(m => m.sender === 'user');
  if (!firstUserMessage) return 'Chat session';
  
  // Extract first line or first few words
  const text = firstUserMessage.text.trim();
  const firstLine = text.split('\n')[0];
  if (firstLine.length <= 40) return firstLine;
  return firstLine.substring(0, 40) + '...';
};

const getChatPreview = (messages) => {
  if (!messages || messages.length === 0) return 'No messages';
  
  // If there's a model response, use that as preview
  const lastModelMessage = [...messages].reverse().find(m => m.sender === 'model');
  if (lastModelMessage) {
    const preview = lastModelMessage.text.trim();
    return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
  }
  
  // Fallback to last message regardless of sender
  const lastMessage = messages[messages.length - 1];
  const preview = lastMessage.text.trim();
  return preview.length > 100 ? preview.substring(0, 100) + '...' : preview;
};

const loadChat = (chatId) => {
  // Add haptic feedback
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(20);
  }
  router.push({ path: '/', query: { chatId } });
};

const confirmDelete = (chatId) => {
  // Add haptic feedback
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate([20, 30, 20]);
  }
  chatToDelete.value = chatId;
  showDeleteModal.value = true;
};

const deleteConfirmed = async () => {
  if (!chatToDelete.value) return;
  
  try {
    // Use the store's delete method instead of direct DB access
    await historyStore.deleteChat(chatToDelete.value);
    console.log(`Chat session ${chatToDelete.value} deleted.`);
    
    // The list will update automatically thanks to liveQuery
    showDeleteModal.value = false;
    chatToDelete.value = null;
    
    // Add haptic feedback for confirmation
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  } catch (err) {
    console.error(`Failed to delete chat ${chatToDelete.value}:`, err);
    error.value = 'Failed to delete chat session.';
    showDeleteModal.value = false;
  }
};
</script>

<style scoped>
/* Chat card hover effect */
.history-card {
  transition: all 0.2s ease;
}

.history-card:active {
  transform: scale(0.98);
}

/* Line clamping for preview text */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>

