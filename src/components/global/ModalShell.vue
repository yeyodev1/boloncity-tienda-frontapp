<script setup lang="ts">
import { onBeforeUnmount, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    subtitle?: string
    size?: 'sm' | 'md' | 'lg' | 'xl'
  }>(),
  {
    subtitle: '',
    size: 'lg',
  },
)

const emit = defineEmits<{
  (event: 'close'): void
}>()

function updateScrollLock(isOpen: boolean) {
  document.body.style.overflow = isOpen ? 'hidden' : ''
}

watch(
  () => props.open,
  (isOpen) => {
    updateScrollLock(isOpen)
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-shell">
      <div v-if="open" class="modal-shell" @click.self="emit('close')">
        <section class="modal-shell__panel" :class="`modal-shell__panel--${size}`" role="dialog" aria-modal="true">
          <header class="modal-shell__header">
            <div>
              <p class="modal-shell__eyebrow">Boloncity</p>
              <h2>{{ title }}</h2>
              <p v-if="subtitle" class="modal-shell__subtitle">{{ subtitle }}</p>
            </div>

            <button class="modal-shell__close" type="button" aria-label="Cerrar modal" @click="emit('close')">
              ×
            </button>
          </header>

          <div class="modal-shell__body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="modal-shell__footer">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-shell {
  align-items: flex-start;
  background: rgba(8, 17, 13, 0.72);
  backdrop-filter: blur(12px);
  display: flex;
  inset: 0;
  justify-content: center;
  overflow-y: auto;
  padding: 0.5rem;
  position: fixed;
  z-index: 99997;
}

.modal-shell__panel {
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 -24px 60px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  max-height: none;
  overflow: hidden;
  width: min(100%, 980px);
}

.modal-shell__panel--sm {
  width: min(100%, 520px);
}

.modal-shell__panel--md {
  width: min(100%, 680px);
}

.modal-shell__panel--lg {
  width: min(100%, 980px);
}

.modal-shell__panel--xl {
  width: min(100%, 1180px);
}

.modal-shell__footer {
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
}

.modal-shell__header {
  align-items: start;
  background: linear-gradient(135deg, rgba(35, 89, 49, 0.98), rgba(35, 89, 49, 0.9));
  color: #fff;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 1.25rem 1.25rem 1rem;
}

.modal-shell__eyebrow {
  color: rgba(239, 213, 55, 0.92);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.modal-shell__header h2 {
  font-size: clamp(1.4rem, 3vw, 2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  margin-top: 0.35rem;
}

.modal-shell__subtitle {
  color: rgba(255, 255, 255, 0.78);
  margin-top: 0.45rem;
  max-width: 48rem;
}

.modal-shell__close {
  align-items: center;
  background: rgba(255, 255, 255, 0.12);
  border: 0;
  border-radius: 50%;
  color: #fff;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 1.9rem;
  height: 44px;
  justify-content: center;
  line-height: 1;
  width: 44px;
}

.modal-shell__body {
  overflow-y: auto;
  padding: 1rem;
  background: #f4f4f0;
}

.modal-shell__footer {
  align-items: center;
  background: #f4f4f0;
  border-top: 1px solid rgba(8, 17, 13, 0.08);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1rem 1rem 1.25rem;
}

.modal-shell-enter-active {
  transition: opacity 0.25s ease, backdrop-filter 0.25s ease;
}

.modal-shell-leave-active {
  transition: opacity 0.2s ease, backdrop-filter 0.2s ease;
}

.modal-shell-enter-from,
.modal-shell-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.modal-shell-enter-active .modal-shell__panel {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-shell-leave-active .modal-shell__panel {
  transition: transform 0.2s ease;
}

.modal-shell-enter-from .modal-shell__panel {
  transform: translateY(30px) scale(0.96);
}

.modal-shell-leave-to .modal-shell__panel {
  transform: translateY(20px) scale(0.97);
}

@media (min-width: 768px) {
  .modal-shell {
    align-items: center;
    padding: 1rem;
  }

  .modal-shell__panel {
    max-height: calc(100vh - 3rem);
  }

  .modal-shell__body {
    padding: 1.25rem;
  }
  .modal-shell__footer {
    padding-bottom: 1rem;
  }
}
</style>
