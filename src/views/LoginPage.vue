<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-3xl font-extrabold text-indigo-600 tracking-tight">PromptBox</h1>
        <h2 class="mt-6 text-2xl font-bold text-gray-900">Sign in to your account</h2>
      </div>
      
      <div v-if="error" 
           class="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm text-red-700">{{ error }}</p>
          </div>
        </div>
      </div>
      
      <div class="mt-8 space-y-6">
        <button 
          @click="handleGoogleSignIn" 
          :disabled="loading"
          class="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border-gray-300"
        >
          <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
            <div class="h-5 w-5 border-t-2 border-b-2 border-gray-500 rounded-full animate-spin"></div>
          </span>
          <span v-else class="absolute left-0 inset-y-0 flex items-center pl-3">
            <svg class="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </span>
          Sign in with Google
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/modules/authStore';
import { useNotificationStore } from '@/store/modules/notificationStore';

const router = useRouter();
const authStore = useAuthStore();
const notificationStore = useNotificationStore();

const loading = ref(false);
const error = ref(null);

// Handle Google sign in
async function handleGoogleSignIn() {
  if (loading.value) return;
  
  error.value = null;
  loading.value = true;
  
  try {
    await authStore.loginWithGoogle();
    
    // Add haptic feedback if available
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(30);
    }
    
    notificationStore.success('Successfully signed in');
    router.push('/');
  } catch (err) {
    console.error('Login failed:', err);
    error.value = err.message || 'Failed to sign in with Google';
    
    // Error haptic feedback
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([100]);
    }
  } finally {
    loading.value = false;
  }
}

// Check if user is already logged in
onMounted(() => {
  if (authStore.isAuthenticated) {
    router.push('/');
  }
});
</script>