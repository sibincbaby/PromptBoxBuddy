<template>
  <div class="notification-container">
    <template v-for="notification in notificationStore.notifications" :key="notification.id">
      <NotificationToast
        :message="notification.message"
        :type="notification.type"
        :duration="notification.duration"
        :visible="notification.visible"
        @close="notificationStore.close(notification.id)"
      />
    </template>
  </div>
</template>

<script setup>
import { useNotificationStore } from '@/store/modules/notificationStore';
import NotificationToast from './NotificationToast.vue';

const notificationStore = useNotificationStore();
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  pointer-events: none;
}

.notification-container > * {
  pointer-events: auto;
}
</style>