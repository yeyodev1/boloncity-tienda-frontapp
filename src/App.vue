<script setup lang="ts">
import ToastNotification from '@/components/global/ToastNotification.vue'
import ConfirmModal from '@/components/global/ConfirmModal.vue'
</script>

<template>
  <div class="app-container">
    <ToastNotification />
    <ConfirmModal />
    <RouterView v-slot="{ Component, route }">
      <transition name="page-fade" mode="out-in">
        <component :is="Component" :key="route.path" />
      </transition>
    </RouterView>
  </div>
</template>

<style lang="scss">
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>
