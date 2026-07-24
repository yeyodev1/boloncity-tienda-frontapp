<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const icons: Record<string, string> = {
  success: 'fa-solid fa-check',
  error: 'fa-solid fa-xmark',
  info: 'fa-solid fa-info',
  warning: 'fa-solid fa-exclamation',
}
</script>

<template>
  <Teleport to="body">
    <div class="toast-stack">
      <transition-group name="toast">
        <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast--${toast.type}`">
          <div class="toast__icon-wrap">
            <div class="toast__icon" :class="`toast__icon--${toast.type}`">
              <i :class="icons[toast.type] || icons.info" />
            </div>
          </div>
          <div class="toast__body">
            <span class="toast__label">{{ toast.label || toast.type }}</span>
            <span class="toast__text">{{ toast.message }}</span>
          </div>
          <button class="toast__close" type="button" @click="remove(toast.id)">
            <i class="fa-solid fa-xmark" />
          </button>
          <div class="toast__bar" />
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
  gap: 0.6rem;
  pointer-events: none;
  max-width: 100%;
}

.toast {
  pointer-events: auto;
  width: 380px;
  max-width: calc(100vw - 2rem);
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.85rem 0.85rem 0.85rem 0.85rem;
  border-radius: 18px;
  color: #fff;
  position: relative;
  overflow: hidden;
}

.toast::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.10);
  pointer-events: none;
}

.toast--success {
  background: linear-gradient(135deg, #1d4a2a 0%, #235931 50%, #1d4a2a 100%);
  box-shadow: 0 20px 48px -8px rgba(35, 89, 49, 0.35);
}

.toast--error {
  background: linear-gradient(135deg, #8a1c13 0%, #b42318 50%, #8a1c13 100%);
  box-shadow: 0 20px 48px -8px rgba(180, 35, 24, 0.35);
}

.toast--info {
  background: linear-gradient(135deg, #153ca8 0%, #1d4ed8 50%, #153ca8 100%);
  box-shadow: 0 20px 48px -8px rgba(29, 78, 216, 0.35);
}

.toast--warning {
  background: linear-gradient(135deg, #8a3f07 0%, #b45309 50%, #8a3f07 100%);
  box-shadow: 0 20px 48px -8px rgba(180, 83, 9, 0.35);
}

.toast__icon-wrap {
  flex: 0 0 auto;
}

.toast__icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 0.9rem;
}

.toast__icon--success { background: rgba(0, 165, 35, 0.25); }
.toast__icon--error { background: rgba(252, 165, 165, 0.15); }
.toast__icon--info { background: rgba(147, 197, 253, 0.15); }
.toast__icon--warning { background: rgba(252, 211, 77, 0.15); }

.toast__body {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding: 0.15rem 0;
}

.toast__label {
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.5;
}

.toast__text {
  font-size: 0.88rem;
  font-weight: 550;
  line-height: 1.35;
}

.toast__close {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s ease, color 0.2s ease;
  margin-top: 0.1rem;
}

.toast__close:hover {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}

.toast__bar {
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.25);
  animation: toast-bar 3.5s linear forwards;
}

@keyframes toast-bar {
  from { width: 100%; }
  to { width: 0%; }
}

.toast-enter-active {
  transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-leave-active {
  transition: all 0.25s cubic-bezier(0.65, 0, 0.35, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(70px) scale(0.88);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(70px) scale(0.88);
}

@media (max-width: 480px) {
  .toast-stack {
    left: 1rem;
    right: 1rem;
    top: auto;
    bottom: 1.5rem;
  }

  .toast {
    width: 100%;
  }

  .toast-enter-from {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }

  .toast-leave-to {
    opacity: 0;
    transform: translateY(30px) scale(0.95);
  }
}
</style>
