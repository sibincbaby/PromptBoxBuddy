<template>
  <Analytics />
  <div id="app" class="flex flex-col h-screen bg-surface-variant">
    <!-- Status Bar -->
    <header class="bg-surface shadow-sm z-10">
      <div class="px-4 py-3 flex justify-between items-center">
        <h1 class="text-lg font-semibold bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">PromptBox</h1>
        <div class="flex items-center space-x-1">
          <!-- Optional header actions (like search, account, etc) -->
        </div>
      </div>
    </header>

    <!-- Main Content Area with animations -->
    <main class="flex-grow overflow-auto thin-scrollbar pb-safe relative">
      <router-view v-slot="{ Component }">
        <transition
          name="page"
          mode="out-in"
          @before-leave="beforePageLeave"
          @enter="onPageEnter"
        >
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </transition>
      </router-view>
      
      <!-- Floating Action Button (FAB) for New Template -->
      <button 
        v-if="$route.path === '/templates'" 
        @click="navigateToNewTemplate"
        class="fab fixed right-5 bottom-20 w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg z-20 flex items-center justify-center transition-transform active:scale-95 hover:bg-indigo-700">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </main>

    <!-- Mobile Bottom Navigation Bar -->
    <nav class="bg-surface shadow-lg border-t border-gray-100 pb-safe">
      <div class="flex justify-around items-center">
        <router-link to="/" class="mobile-tab-button group py-2 px-4" active-class="text-indigo-600">
          <div class="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-transform group-active:scale-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span class="text-xs mt-1">Chat</span>
          </div>
        </router-link>
        
        <router-link to="/history" class="mobile-tab-button group py-2 px-4" active-class="text-indigo-600">
          <div class="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-transform group-active:scale-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-xs mt-1">History</span>
          </div>
        </router-link>
        
        <router-link to="/templates" class="mobile-tab-button group py-2 px-4" active-class="text-indigo-600">
          <div class="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-transform group-active:scale-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <span class="text-xs mt-1">Templates</span>
          </div>
        </router-link>
        
        <router-link to="/settings" class="mobile-tab-button group py-2 px-4" active-class="text-indigo-600">
          <div class="flex flex-col items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 transition-transform group-active:scale-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span class="text-xs mt-1">Settings</span>
          </div>
        </router-link>
      </div>
    </nav>
    
    <!-- Global Notification Container -->
    <NotificationContainer />
  </div>
</template>

<script setup>
import { Analytics } from '@vercel/analytics/vue';
import { inject } from 'vue';
import { useRouter } from 'vue-router';
import NotificationContainer from '@/components/ui/NotificationContainer.vue';

// Get router and event bus
const router = useRouter();
const emitter = inject('emitter');

// Scripts for handling page transitions
const beforePageLeave = (el) => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(10px)';
};

const onPageEnter = (el) => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(10px)';
  setTimeout(() => {
    el.style.transition = 'all 0.3s ease';
    el.style.opacity = 1;
    el.style.transform = 'translateY(0)';
  }, 50);
};

// Function to navigate to the new template page
const navigateToNewTemplate = () => {
  // Add haptic feedback if available
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(20);
  }
  
  // Navigate directly to the new template page
  router.push('/template/new');
};
</script>

<style>
/* Ensure html and body take full height */
html, body {
  height: 100%;
  margin: 0;
}

/* Safe area padding for iOS devices */
.pb-safe {
  padding-bottom: calc(0.5rem + var(--safe-area-bottom));
}

/* Active tab indicator animation */
.router-link-active::after {
  content: '';
  @apply block w-1/2 h-1 mx-auto mt-1 rounded-full bg-indigo-600;
  animation: scaleIn 0.3s ease forwards;
}

@keyframes scaleIn {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

/* Page transition effects */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Floating Action Button animation */
.fab {
  animation: fabIn 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes fabIn {
  from { 
    transform: translateY(20px) scale(0.8); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0) scale(1); 
    opacity: 1; 
  }
}
</style>

