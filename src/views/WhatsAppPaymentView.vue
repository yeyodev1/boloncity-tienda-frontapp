<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import PayPhoneBox from '@/components/checkout/PayPhoneBox.vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'

const route = useRoute()
const order = ref<OrderDTO | null>(null)
const error = ref('')
const ready = ref(false)
// Identificador de ESTE intento de pago. PayPhone no acepta dos veces el mismo
// ("Ya existe una transacción con el ClientTransactionId especificado"), y este link vive en el
// chat de WhatsApp: se abre cuantas veces quiera. Por eso el backend emite uno fresco en cada carga.
const clientTransactionId = ref('')
// Pedido de PRUEBAS del bot (payphone.mode === 'test'): se abre la cajita con la app de PRUEBAS de PayPhone,
// que aprueba sin cobrar de verdad. Cualquier otro pedido usa siempre las credenciales de producción.
const payphoneToken = computed(() => {
  const esPrueba = order.value?.payphone?.mode === 'test'
  const tokenPrueba = String(import.meta.env.VITE_PAYPHONE_TEST_TOKEN || '').trim()
  return esPrueba && tokenPrueba ? tokenPrueba : (import.meta.env.VITE_PAYPHONE_TOKEN as string)
})
// El cobro debe caer en la tienda de la sucursal que tomó el pedido, no en la global.
const payphoneStoreId = computed(
  () => order.value?.payphone?.storeId || (import.meta.env.VITE_PAYPHONE_STORE_ID as string) || ''
)

onMounted(async () => {
  const orderNumber = String(route.params.orderNumber || '')
  const email = String(route.query.email || '')
  if (!orderNumber || !email) {
    error.value = 'El enlace de pago está incompleto.'
    return
  }

  try {
    const response = await OrderService.getByNumber(orderNumber, email)
    order.value = response.data
    if (order.value.paymentMethod !== 'card' || order.value.status !== 'pending') {
      error.value = 'Este pedido no tiene un pago con tarjeta pendiente.'
      return
    }
  } catch {
    error.value = 'No pudimos encontrar el pedido para pagar.'
    return
  }

  try {
    const intento = await OrderService.createPaymentIntent(orderNumber, email)
    clientTransactionId.value = intento.data.clientTransactionId
  } catch (err) {
    // 409 = el pedido dejó de estar pendiente entre la consulta y ahora (lo pagaron en otra pestaña).
    error.value =
      (err as { status?: number })?.status === 409
        ? 'Este pedido ya no tiene un pago pendiente.'
        : 'No pudimos preparar el pago. Recarga la página.'
  }
})
</script>

<template>
  <main class="payment-page">
    <section class="payment-card">
      <p class="payment-card__brand">BOLONCITY</p>
      <h1>Pago seguro</h1>
      <p v-if="error" class="payment-card__error">{{ error }}</p>
      <template v-else-if="order && clientTransactionId">
        <p>Pedido <strong>{{ order.orderNumber }}</strong></p>
        <p class="payment-card__total">${{ (order.total / 100).toFixed(2) }}</p>
        <PayPhoneBox
          :token="payphoneToken"
          :store-id="payphoneStoreId"
          :client-transaction-id="clientTransactionId"
          :amount="order.total"
          :amount-with-tax="order.total"
          :reference="`Pedido ${order.orderNumber}`"
          :email="order.customerEmail"
          :phone-number="order.customerPhone"
          :on-ready="() => { ready = true }"
        />
        <p v-if="ready" class="payment-card__ready">Módulo de pago listo.</p>
      </template>
      <p v-else-if="!error">Cargando pedido...</p>
    </section>
  </main>
</template>

<style scoped lang="scss">
.payment-page { align-items: center; background: #f8f6ec; display: flex; justify-content: center; min-height: 100vh; padding: 1rem; }
.payment-card { background: #fff; border-radius: 20px; box-shadow: 0 20px 48px rgba(0, 0, 0, .12); max-width: 440px; padding: 2rem; text-align: center; width: 100%; }
.payment-card__brand { color: #235931; font-size: .75rem; font-weight: 800; letter-spacing: .16em; margin: 0; }
h1 { color: #235931; margin: .4rem 0 1rem; }
.payment-card__total { color: #235931; font-size: 2rem; font-weight: 800; margin: 1rem 0 1.5rem; }
.payment-card__error { color: #b42318; font-weight: 700; }
.payment-card__ready { color: #00a523; font-weight: 700; }
</style>
