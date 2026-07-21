<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'pay'): void
}>()

defineProps<{
  total: number
  canSubmit: boolean
  submitting: boolean
  error: string
}>()

const acceptedTerms = ref(false)
</script>

<template>
  <div class="checkout-payment panel">
    <div class="checkout-payment__header">
      <span class="checkout-payment__icon"><i class="fa-solid fa-shield-halved" /></span>
      <div><p class="checkout-payment__eyebrow">Pago</p><h2>Método de pago</h2></div>
    </div>

    <p class="checkout-payment__info">Selecciona tu método de pogo. Todos los datos se procesan de forma segura.</p>

    <label class="checkout-payment__terms">
      <input v-model="acceptedTerms" type="checkbox" />
      <span>Acepto los <RouterLink to="/terminos">términos y condiciones</RouterLink> y las <RouterLink to="/privacidad">políticas de privacidad</RouterLink>.</span>
    </label>

    <button
      type="button"
      class="checkout-payment__submit"
      :class="{
        'is-loading': submitting,
        'is-disabled': !canSubmit || !acceptedTerms || submitting,
      }"
      :disabled="!canSubmit || !acceptedTerms || submitting"
      @click="emit('pay')"
    >
      <span v-if="!submitting"><i class="fa-solid fa-lock" /> Pagar ${{ total.toFixed(2) }}</span>
      <span v-else><i class="fa-solid fa-spinner fa-spin" /> Procesando pago…</span>
    </button>

    <Transition name="fade">
      <p v-if="error" class="checkout-payment__error"><i class="fa-solid fa-circle-exclamation" /> {{ error }}</p>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.checkout-payment {
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(28, 22, 12, 0.06);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: clamp(1rem, 3vw, 1.5rem);
}

.checkout-payment__header { align-items: center; display: flex; gap: 0.85rem; }

.checkout-payment__icon {
  align-items: center;
  background: linear-gradient(135deg, #235931, #00a523);
  border-radius: 16px;
  color: #fff;
  display: flex;
  flex: 0 0 48px;
  height: 48px;
  justify-content: center;
}

.checkout-payment__eyebrow { color: #00a523; font-size: 0.7rem; margin-bottom: 0.15rem; }
.checkout-payment__header h2 { font-size: 1.25rem; letter-spacing: -0.03em; }
.checkout-payment__info { color: rgba(26, 26, 26, 0.6); font-size: 0.85rem; line-height: 1.55; }

.checkout-payment__terms {
  align-items: flex-start;
  display: flex;
  font-size: 0.88rem;
  font-weight: 600;
  gap: 0.65rem;
  line-height: 1.6;
}

.checkout-payment__terms input[type='checkbox'] { accent-color: #235931; margin-top: 0.35rem; }
.checkout-payment__terms a { color: #235931; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; }
.checkout-payment__terms a:hover { color: #00a523; }

.checkout-payment__submit {
  align-items: center;
  background: #235931;
  border-radius: 999px;
  color: #fff;
  display: flex;
  font-size: 1rem;
  font-weight: 900;
  gap: 0.5rem;
  justify-content: center;
  letter-spacing: 0.02em;
  min-height: 58px;
  padding: 1rem 2rem;
  transition: background-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.checkout-payment__submit:hover:not(.is-loading):not(.is-disabled) { background: #00a523; transform: translateY(-2px); }
.checkout-payment__submit.is-loading { cursor: wait; opacity: 0.8; }
.checkout-payment__submit.is-disabled { cursor: not-allowed; opacity: 0.5; }

.checkout-payment__error {
  background: rgba(254, 196, 196, 0.5);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 14px;
  color: #a02828;
  font-size: 0.82rem;
  line-height: 1.5;
  padding: 0.85rem 1rem;
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
