<script setup lang="ts">
const model = defineModel<'card' | 'cash'>({ required: true })
</script>

<template>
  <div class="checkout-payment-method">
    <span class="checkout-payment-method__label"><i class="fa-solid fa-credit-card" /> Método de pago</span>
    <div class="checkout-payment-method__options">
      <label class="checkout-payment-method__option" :class="{ active: model === 'card' }">
        <input v-model="model" type="radio" value="card" />
        <i class="fa-solid fa-credit-card" />
        <span><strong>Tarjeta</strong><small>Pago seguro con PayPhone</small></span>
      </label>
      <label class="checkout-payment-method__option" :class="{ active: model === 'cash' }">
        <input v-model="model" type="radio" value="cash" />
        <i class="fa-solid fa-money-bill-wave" />
        <span><strong>Efectivo</strong><small>Paga al motorizado al recibir</small></span>
      </label>
    </div>
  </div>
</template>

<style scoped lang="scss">
.checkout-payment-method { display: flex; flex-direction: column; gap: 0.6rem; }

.checkout-payment-method__label {
  align-items: center;
  color: rgba(8, 17, 13, 0.62);
  display: flex;
  font-size: 0.78rem;
  font-weight: 900;
  gap: 0.45rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.checkout-payment-method__label i { color: #235931; font-size: 0.72rem; opacity: 0.8; }

.checkout-payment-method__options { display: flex; flex-direction: column; gap: 0.6rem; }
.checkout-payment-method__option { align-items: center; background: #fff; border: 1px solid rgba(35, 89, 49, 0.12); border-radius: 16px; cursor: pointer; display: flex; gap: 0.7rem; min-height: 64px; padding: 0.85rem; position: relative; transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; }
.checkout-payment-method__option:hover { border-color: rgba(35, 89, 49, 0.35); transform: translateY(-1px); }
.checkout-payment-method__option.active { background: linear-gradient(145deg, #f5f9f4, #e9f4eb); border-color: #235931; box-shadow: 0 10px 24px rgba(35, 89, 49, 0.12); }
.checkout-payment-method__option input { height: 1px; opacity: 0; pointer-events: none; position: absolute; width: 1px; }
.checkout-payment-method__option > i { align-items: center; background: rgba(35, 89, 49, 0.08); border-radius: 12px; color: #235931; display: flex; flex: 0 0 38px; font-size: 1rem; height: 38px; justify-content: center; }
.checkout-payment-method__option.active > i { background: #235931; color: #fff; }
.checkout-payment-method__option span { display: flex; flex-direction: column; gap: 0.12rem; }
.checkout-payment-method__option strong { font-size: 0.92rem; }
.checkout-payment-method__option small { color: rgba(8, 17, 13, 0.55); font-size: 0.75rem; }

@media (min-width: 980px) {
  .checkout-payment-method__options { flex-direction: row; }
  .checkout-payment-method__option { align-items: flex-start; flex: 1 1 0; flex-direction: column; min-height: 108px; padding: 1rem 1.1rem; }
  .checkout-payment-method__option > i { flex-basis: 44px; font-size: 1.15rem; height: 44px; width: 44px; }
  .checkout-payment-method__option small { max-width: 14rem; }
}
</style>
