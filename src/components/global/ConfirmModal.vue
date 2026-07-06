<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'

const { confirmState, accept, cancel } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-modal">
      <div v-if="confirmState.open" class="confirm-backdrop" @click.self="cancel">
        <div class="confirm-modal" :class="`type-${confirmState.type}`">
          <p class="confirm-modal__eyebrow">Boloncity</p>
          <h3>{{ confirmState.title }}</h3>
          <p class="confirm-modal__message">{{ confirmState.message }}</p>
          <div class="actions">
            <button type="button" class="secondary" @click="cancel">{{ confirmState.cancelText }}</button>
            <button type="button" class="primary" @click="accept">{{ confirmState.confirmText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.confirm-backdrop {
  position: fixed;
  inset: 0;
  z-index: 99998;
  background: rgba(8, 17, 13, 0.72);
  backdrop-filter: blur(10px);
  align-items: center;
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.confirm-modal {
  width: min(100%, 520px);
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.08);
  border-radius: 24px;
  padding: 1.25rem;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.28);

  .confirm-modal__eyebrow {
    color: #00a523;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  h3 {
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1.1;
    margin: 0 0 0.65rem;
    text-transform: uppercase;
  }

  .confirm-modal__message {
    color: rgba(8, 17, 13, 0.72);
    line-height: 1.6;
    margin: 0 0 1.25rem;
  }
}

.actions {
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.75rem;

  button {
    border: 0;
    border-radius: 999px;
    min-height: 44px;
    padding: 0.8rem 1rem;
    font-weight: 800;
    cursor: pointer;
    width: 100%;
  }

  .secondary { background: rgba(8, 17, 13, 0.06); color: #08110d; }
  .primary { background: #235931; color: #fff; }
}

.type-danger .primary { background: #b42318; }
.type-warning .primary { background: #b45309; }
.type-info .primary { background: #1d4ed8; }

.confirm-modal-enter-active {
  transition: opacity 0.25s ease, backdrop-filter 0.25s ease;
}

.confirm-modal-leave-active {
  transition: opacity 0.2s ease;
}

.confirm-modal-enter-from,
.confirm-modal-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.confirm-modal-enter-active .confirm-modal {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.confirm-modal-leave-active .confirm-modal {
  transition: transform 0.2s ease;
}

.confirm-modal-enter-from .confirm-modal {
  transform: translateY(24px) scale(0.95);
}

.confirm-modal-leave-to .confirm-modal {
  transform: scale(0.95);
}

@media (min-width: 641px) {
  .confirm-modal {
    padding: 1.5rem;
  }

  .actions {
    flex-direction: row;

    button {
      width: auto;
    }
  }
}
</style>
