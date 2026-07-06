<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack">
      <transition-group name="toast-fade">
        <div v-for="toast in toasts" :key="toast.id" class="toast-item" :class="`toast-${toast.type}`">
          <span>{{ toast.message }}</span>
          <button type="button" @click="remove(toast.id)">×</button>
        </div>
      </transition-group>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.toast-stack {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 99998;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.toast-item {
  min-width: 280px;
  max-width: 360px;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  color: #fff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);

  button {
    border: 0;
    background: transparent;
    color: inherit;
    font-size: 1.15rem;
    cursor: pointer;
  }
}

.toast-success { background: #235931; }
.toast-error { background: #b42318; }
.toast-info { background: #1d4ed8; }
.toast-warning { background: #b45309; }

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.25s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
