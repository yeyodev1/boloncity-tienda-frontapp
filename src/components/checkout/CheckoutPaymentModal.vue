<script setup lang="ts">
import PayPhoneBox from '@/components/checkout/PayPhoneBox.vue'
import type { OrderDTO } from '@/services/OrderService'

defineProps<{
  order: OrderDTO | null
  payphoneToken: string
  payphoneStoreId: string
  amounts: { amount: number; amountWithTax: number; amountWithoutTax: number; tax: number }
  email: string
  phoneNumber: string
  ready: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'ready'): void
}>()
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="order" class="payment-overlay">
      <div class="payment-modal">
        <div class="payment-modal__header">
          <button type="button" class="payment-modal__back" @click="emit('close')">
            <i class="fa-solid fa-arrow-left" /> Volver
          </button>
          <p class="payment-modal__eyebrow"><i class="fa-solid fa-lock" /> Pago seguro</p>
          <p class="payment-modal__secure">No almacenamos tus datos de pago</p>
          <h2>Pedido {{ order.orderNumber }}</h2>
        </div>

        <div class="payment-modal__content">
          <div class="payment-modal__summary">
            <div class="payment-modal__summary-icon"><i class="fa-solid fa-credit-card" /></div>
            <div>
              <span>Total a pagar</span>
              <strong>${{ (order.total / 100).toFixed(2) }}</strong>
            </div>
            <small><i class="fa-solid fa-shield-halved" /> Encriptado</small>
          </div>

          <div class="payment-modal__box">
            <PayPhoneBox
              :token="payphoneToken"
              :store-id="payphoneStoreId"
              :client-transaction-id="order.payphone?.clientTransactionId || ''"
              :amount="amounts.amount"
              :amount-with-tax="amounts.amountWithTax"
              :amount-without-tax="amounts.amountWithoutTax"
              :tax="amounts.tax"
              :reference="`Pedido ${order.orderNumber}`"
              :email="email"
              :phone-number="phoneNumber"
              :on-ready="() => emit('ready')"
            />
          </div>
        </div>

        <p v-if="ready" class="payment-modal__ready">
          <i class="fa-solid fa-circle-check" /> Módulo de pago listo
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.payment-overlay {
  align-items: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  position: fixed;
  inset: 0;
  z-index: 1000;
}

.payment-modal {
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 460px;
  padding: 1.5rem;
  width: 92vw;
}

.payment-modal__header { text-align: center; }

.payment-modal__back {
  align-items: center;
  background: rgba(35, 89, 49, 0.06);
  border-radius: 999px;
  color: #235931;
  display: inline-flex;
  font-size: 0.8rem;
  font-weight: 800;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
  padding: 0.55rem 0.9rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.payment-modal__back:hover { background: rgba(35, 89, 49, 0.12); color: #00a523; }

.payment-modal__eyebrow {
  align-items: center;
  color: #00a523;
  display: flex;
  font-size: 0.76rem;
  font-weight: 900;
  gap: 0.5rem;
  justify-content: center;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.payment-modal__secure { color: rgba(8, 17, 13, 0.45); font-size: 0.8rem; margin-top: 0.25rem; }

.payment-modal__header h2 {
  font-size: 1.6rem;
  font-weight: 900;
  letter-spacing: -0.04em;
  margin-top: 0.5rem;
  text-transform: uppercase;
}

.payment-modal__summary { align-items: center; background: linear-gradient(135deg, #102719, #235931); border-radius: 20px; color: #fff; display: flex; gap: 0.75rem; padding: 1rem; }
.payment-modal__summary-icon { align-items: center; background: #efd537; border-radius: 14px; color: #102719; display: flex; flex: 0 0 44px; height: 44px; justify-content: center; }
.payment-modal__summary div { display: flex; flex: 1 1 0; flex-direction: column; }
.payment-modal__summary span { color: rgba(255, 255, 255, 0.65); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; }
.payment-modal__summary strong { font-size: 1.35rem; letter-spacing: -0.04em; }
.payment-modal__summary small { color: #efd537; font-size: 0.68rem; font-weight: 800; }
.payment-modal__content { display: flex; flex-direction: column; gap: 1rem; }

.payment-modal__box {
  background: rgba(35, 89, 49, 0.03);
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 22px;
  padding: 1.5rem;
}

.payment-modal__ready { align-items: center; color: #00a523; display: flex; font-size: 0.85rem; font-weight: 700; gap: 0.4rem; justify-content: center; }

.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.35s cubic-bezier(0.65, 0, 0.35, 1); }
.modal-fade-enter-active .payment-modal { transition: opacity 0.35s ease, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.modal-fade-leave-active .payment-modal { transition: opacity 0.25s ease, transform 0.25s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .payment-modal { opacity: 0; transform: translateY(28px) scale(0.94); }
.modal-fade-leave-to .payment-modal { opacity: 0; transform: translateY(12px) scale(0.97); }

@media (min-width: 980px) {
  .payment-modal { max-width: 820px; padding: 2rem; width: min(90vw, 820px); }
  .payment-modal__header { text-align: left; }
  .payment-modal__eyebrow { justify-content: flex-start; }
  .payment-modal__content { align-items: stretch; flex-direction: row; }
  .payment-modal__summary { align-items: flex-start; flex: 0 0 230px; flex-direction: column; justify-content: center; padding: 1.5rem; }
  .payment-modal__summary div { flex: 0 0 auto; }
  .payment-modal__summary strong { font-size: 2rem; }
  .payment-modal__box { display: flex; flex: 1 1 0; flex-direction: column; justify-content: center; padding: 1.75rem; }
}
</style>
