<template>
  <transition name="fade">
    <div v-if="visible" 
        :class="[
          'fixed top-5 right-5 px-4 py-2 rounded-lg text-sm text-white shadow-lg z-50 flex items-center space-x-2',
          typeClasses
        ]"
        role="alert">
      <!-- Icon based on notification type -->
      <svg v-if="type === 'success'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
      
      <svg v-else-if="type === 'error'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
      
      <svg v-else-if="type === 'info'" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      
      <span>{{ message }}</span>
      
      <!-- Dismiss button for keyboard accessibility -->
      <button 
        @click="$emit('close')" 
        class="ml-2 focus-visible-ring rounded-full p-1 hover:bg-white hover:bg-opacity-20"
        aria-label="Dismiss notification">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';

const props = defineProps({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'info', 'warning'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000 // 3 seconds by default
  },
  visible: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['close']);

// Computed styles based on notification type
const typeClasses = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bg-green-500';
    case 'error':
      return 'bg-red-500';
    case 'warning':
      return 'bg-amber-500';
    case 'info':
    default:
      return 'bg-gray-800';
  }
});

// Auto-dismiss timer
let timer = null;

// Watch for visibility changes
watch(() => props.visible, (newVal) => {
  if (newVal && props.duration > 0) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      emit('close');
    }, props.duration);
  } else if (!newVal) {
    clearTimeout(timer);
  }
});

// Set auto-dismiss timer when component mounts
onMounted(() => {
  if (props.visible && props.duration > 0) {
    timer = setTimeout(() => {
      emit('close');
    }, props.duration);
  }
});
</script>

<style scoped>
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