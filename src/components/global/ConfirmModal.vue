<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'

const { confirmState, accept, cancel } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-modal">
      <div v-if="confirmState.open" class="confirm-backdrop" @click.self="cancel">
        <div class="confirm-modal" :class="`type-${confirmState.type}`">
          <div v-if="confirmState.imageUrl" class="confirm-product-image">
            <img :src="confirmState.imageUrl" alt="" />
            <span><i class="fa-solid fa-trash" /></span>
          </div>
          <div v-else class="confirm-icon" :class="{ 'confirm-icon--custom': !!confirmState.icon }"><i :class="confirmState.icon || (confirmState.type === 'danger' ? 'fa-solid fa-triangle-exclamation' : confirmState.type === 'warning' ? 'fa-solid fa-circle-exclamation' : 'fa-solid fa-circle-info')" /></div>
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
  -webkit-backdrop-filter: blur(10px);
  align-items: center;
  display: flex;
  justify-content: center;
  padding: 1rem;
}

.confirm-modal {
  width: min(100%, 400px);
  background: var(--admin-surface, #fff);
  border: 1px solid var(--admin-line, rgba(8, 17, 13, 0.06));
  border-radius: 28px;
  color: var(--admin-text, inherit);
  padding: 2rem 1.5rem 1.5rem;
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.3);
  text-align: center;
}

.confirm-icon {
  align-items: center;
  display: flex;
  justify-content: center;
  margin: 0 auto 1rem;
}

.confirm-icon img {
  display: block;
  height: auto;
  max-width: 120px;
}

.confirm-icon { background: var(--admin-info-soft, #eff6ff); border: 1px solid var(--admin-line, #dbeafe); border-radius: 50%; color: var(--admin-info, #1d4ed8); height: 56px; width: 56px; }
.confirm-icon i { font-size: 1.45rem; }
.type-danger .confirm-icon { background: var(--admin-danger-soft, #fef2f2); border-color: var(--admin-line, #fee2e2); color: var(--admin-danger, #b42318); }
.type-warning .confirm-icon { background: var(--admin-warning-soft, #fffbeb); border-color: var(--admin-line, #fef3c7); color: var(--admin-warning, #b45309); }
.confirm-icon--custom i { font-size: 1.45rem; }

.confirm-product-image {
  border: 3px solid #fee2e2;
  border-radius: 18px;
  height: 88px;
  margin: 0 auto 1rem;
  overflow: visible;
  position: relative;
  width: 88px;
}

.confirm-product-image img { border-radius: 15px; display: block; height: 100%; object-fit: cover; width: 100%; }
.confirm-product-image span { align-items: center; background: #b42318; border: 3px solid var(--admin-surface, #fff); border-radius: 50%; bottom: -9px; color: #fff; display: flex; font-size: .75rem; height: 30px; justify-content: center; position: absolute; right: -9px; width: 30px; }

.confirm-icon--emoji span {
  font-size: 3rem;
  line-height: 1;
}

h3 {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  margin: 0 0 0.5rem;
}

.confirm-modal__message {
  color: var(--admin-muted, rgba(8, 17, 13, 0.6));
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0 0 1.5rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  button {
    border: 0;
    border-radius: 999px;
    cursor: pointer;
    font-size: 0.88rem;
    font-weight: 800;
    min-height: 46px;
    padding: 0.75rem 1rem;
    transition: all 0.2s ease;
    width: 100%;
  }

  .secondary {
    background: var(--admin-hover, rgba(8, 17, 13, 0.05));
    color: var(--admin-muted, rgba(8, 17, 13, 0.6));
  }

  .secondary:hover { background: var(--admin-line-strong, rgba(8, 17, 13, 0.08)); color: var(--admin-text, rgba(8, 17, 13, 0.75)); }

  .primary {
    background: var(--admin-accent, #235931);
    color: var(--admin-on-accent, #fff);
  }

  .primary:hover { background: #00a523; transform: translateY(-1px); }
}

.type-danger .primary { background: #b42318; color: #fff; }
.type-danger .primary:hover { background: #a02828; }

.type-warning .primary { background: #b45309; color: #fff; }
.type-info .primary { background: #1d4ed8; color: #fff; }

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
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.confirm-modal-leave-active .confirm-modal {
  transition: transform 0.2s ease;
}

.confirm-modal-enter-from .confirm-modal {
  transform: translateY(24px) scale(0.92);
}

.confirm-modal-leave-to .confirm-modal {
  transform: scale(0.92);
}

@media (prefers-reduced-motion: reduce) {
  .confirm-modal-enter-active .confirm-modal,
  .confirm-modal-leave-active .confirm-modal { transition: none; }
  .actions .primary:hover { transform: none; }
}

@media (min-width: 641px) {
  .confirm-modal { padding: 2.5rem 2rem 1.5rem; }
}
</style>
