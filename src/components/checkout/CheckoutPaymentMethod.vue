<script setup lang="ts">
const model = defineModel<'card' | 'cash'>({ required: true })

// Los pedidos programados aceptan ambos métodos: con efectivo se cobra al entregar o retirar.
defineProps<{ scheduleEnabled?: boolean; deliveryType?: 'delivery' | 'pickup' }>()
</script>

<template>
  <div class="checkout-payment-method">
    <!--
      Sin título ni bajada propios: vive dentro del paso «¿Cuándo y cómo pagas?»,
      que ya los dice. Repetirlos era una tarjeta con encabezado dentro de otra
      tarjeta con encabezado.
    -->
    <div class="checkout-payment-method__options">
      <label class="checkout-payment-method__option" :class="{ active: model === 'card' }">
        <input v-model="model" type="radio" value="card" />
        <i class="fa-solid fa-credit-card" />
        <span><strong>Tarjeta</strong><small>Pago seguro con PayPhone</small></span>
      </label>
      <label class="checkout-payment-method__option" :class="{ active: model === 'cash' }">
        <input v-model="model" type="radio" value="cash" />
        <i class="fa-solid fa-money-bill-wave" />
        <span>
          <strong>Efectivo</strong>
          <small>{{ deliveryType === 'pickup' ? 'Paga en el local al retirar' : 'Paga al motorizado al recibir' }}</small>
        </span>
      </label>
    </div>
    <p class="checkout-payment-method__next">
      <i class="fa-solid fa-circle-info" />
      <span>{{ model === 'card'
        ? 'Al tocar «Pedir» se abrirá una ventana segura para escribir los datos de tu tarjeta. No guardamos tus datos.'
        : scheduleEnabled
          ? `Tu pedido programado queda reservado y pagas en efectivo ${deliveryType === 'pickup' ? 'al retirarlo en el local' : 'al recibirlo'}.`
          : 'No necesitas tarjeta: tu pedido queda confirmado y pagas en efectivo cuando lo recibas.' }}</span>
    </p>
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

.checkout-payment-method__intro { color: rgba(8, 17, 13, 0.6); font-size: 0.85rem; }

.checkout-payment-method__next { align-items: flex-start; background: rgba(35, 89, 49, 0.05); border-radius: 12px; color: rgba(8, 17, 13, 0.72); display: flex; font-size: 0.82rem; gap: 0.5rem; line-height: 1.45; padding: 0.65rem 0.85rem; }
.checkout-payment-method__next i { color: #235931; margin-top: 0.15rem; }

.checkout-payment-method__options { display: flex; flex-direction: column; gap: 0.6rem; }
.checkout-payment-method__option { align-items: center; background: #fff; border: 1px solid rgba(35, 89, 49, 0.12); border-radius: 16px; cursor: pointer; display: flex; gap: 0.7rem; min-height: 64px; padding: 0.85rem; position: relative; transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; }
.checkout-payment-method__option:hover { border-color: rgba(35, 89, 49, 0.35); transform: translateY(-1px); }
.checkout-payment-method__option.disabled { cursor: not-allowed; opacity: 0.55; }
.checkout-payment-method__option.disabled:hover { border-color: rgba(35, 89, 49, 0.12); transform: none; }
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
