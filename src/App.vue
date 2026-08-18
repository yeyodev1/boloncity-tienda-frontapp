<script setup lang="ts">
import ToastNotification from '@/components/global/ToastNotification.vue'
import ConfirmModal from '@/components/global/ConfirmModal.vue'
import SessionExpiredModal from '@/components/global/SessionExpiredModal.vue'
import EnvironmentBadge from '@/components/global/EnvironmentBadge.vue'
import NewVersionBanner from '@/components/global/NewVersionBanner.vue'
</script>

<template>
  <div class="app-container">
    <ToastNotification />
    <ConfirmModal />
    <SessionExpiredModal />
    <EnvironmentBadge />
    <NewVersionBanner />
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
