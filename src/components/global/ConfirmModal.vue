<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'

const { confirmState, accept, cancel } = useConfirm()
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm-modal">
      <div v-if="confirmState.open" class="confirm-backdrop" @click.self="cancel">
        <div class="confirm-modal" :class="`type-${confirmState.type}`">
          <div class="confirm-icon" :class="{ 'confirm-icon--custom': !!confirmState.icon }">
            <div v-if="confirmState.icon" v-html="confirmState.icon" />
            <template v-else>
              <svg v-if="confirmState.type === 'danger'" width="56" height="56" viewBox="0 0 56 56" fill="none">
                <rect x="4" y="4" width="48" height="48" rx="24" fill="#FEF2F2" />
                <rect x="4" y="4" width="48" height="48" rx="24" stroke="#FEE2E2" stroke-width="2" />
                <path d="M28 20v8m0 4v.01M38 28A10 10 0 1118 28a10 10 0 0120 0z" stroke="#B42318" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <svg v-else-if="confirmState.type === 'warning'" width="56" height="56" viewBox="0 0 56 56" fill="none">
                <rect x="4" y="4" width="48" height="48" rx="24" fill="#FFFBEB" />
                <rect x="4" y="4" width="48" height="48" rx="24" stroke="#FEF3C7" stroke-width="2" />
                <path d="M28 22v8m0 4v.01M24 34h8M22.5 22.5l-5 5A2 2 0 0017 29v7a2 2 0 002 2h18a2 2 0 002-2v-7a2 2 0 00-.5-1.5l-5-5A2 2 0 0024 22v.5z" stroke="#B45309" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <svg v-else width="56" height="56" viewBox="0 0 56 56" fill="none">
                <rect x="4" y="4" width="48" height="48" rx="24" fill="#EFF6FF" />
                <rect x="4" y="4" width="48" height="48" rx="24" stroke="#DBEAFE" stroke-width="2" />
                <circle cx="28" cy="28" r="10" stroke="#1D4ED8" stroke-width="2.5"/>
                <path d="M28 24v4m0 4v.01" stroke="#1D4ED8" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </template>
          </div>
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
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.06);
  border-radius: 28px;
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
  color: rgba(8, 17, 13, 0.6);
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
    background: rgba(8, 17, 13, 0.05);
    color: rgba(8, 17, 13, 0.6);
  }

  .secondary:hover { background: rgba(8, 17, 13, 0.08); }

  .primary {
    background: #235931;
    color: #fff;
  }

  .primary:hover { background: #00a523; transform: translateY(-1px); }
}

.type-danger .primary { background: #b42318; }
.type-danger .primary:hover { background: #a02828; }

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

@media (min-width: 641px) {
  .confirm-modal { padding: 2.5rem 2rem 1.5rem; }
}
</style>
