<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import OrderService from '@/services/OrderService'
import type { OrderDTO } from '@/services/OrderService'
import { useToast } from '@/composables/useToast'
import { useCartStore } from '@/stores/cart'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'

const route = useRoute()
const router = useRouter()
function centsToDollars(cents: number): number {
  return cents / 100
}

const phase = ref<'loading' | 'success' | 'error'>('loading')
const status = ref('')
const order = ref<OrderDTO | null>(null)
const { success, error } = useToast()
const cart = useCartStore()

const deliveryLabels: Record<string, string> = {
  delivery: 'Delivery a domicilio',
  pickup: 'Recoger en sucursal',
}

onMounted(async () => {
  const id = Number(route.query.id)
  const clientTxId = String(route.query.clientTransactionId || '')

  if (!id || !clientTxId) {
    status.value = 'No se recibieron los datos de la transacción.'
    phase.value = 'error'
    return
  }

  try {
    const response = await OrderService.confirm(id, clientTxId)
    order.value = (response.data as any).order as OrderDTO
    if (order.value.status === 'cancelled') {
      status.value = 'El pago fue cancelado o rechazado.'
      phase.value = 'error'
      error('Pago cancelado')
      return
    }
    phase.value = 'success'
    cart.clear()
    success('Pago confirmado')
  } catch (err: any) {
    const fallback = err?.data?.message || err?.message || 'No se pudo confirmar el pago.'
    if (err?.data?.order) {
      order.value = err.data.order
    }
    status.value = fallback
    phase.value = 'error'
    error('Error al confirmar el pago')
  }
})
</script>

<template>
  <div class="response-page">
    <StoreHeader />

    <main class="response-page__main">
      <div v-if="phase === 'loading'" class="response-card response-card--loading">
        <div class="response-card__spinner" />
        <p class="response-card__loading-text">Confirmando tu pago...</p>
      </div>

      <template v-else-if="phase === 'success' && order">
        <div class="response-card">
          <div class="response-card__icon response-card__icon--success">
            <i class="fa-solid fa-check" />
          </div>
          <p class="response-card__eyebrow">Pago exitoso</p>
          <h1 class="response-card__title">Pedido {{ order.orderNumber }}</h1>
          <p class="response-card__msg">Tu pago fue procesado correctamente.</p>
          <p class="response-card__secure"><i class="fa-solid fa-lock" /> No almacenamos tus datos de pago</p>

          <ul class="response-card__details">
            <li>
              <span>Estado</span>
              <strong class="response-card__badge">Pagado</strong>
            </li>
            <li v-if="order.customerName">
              <span>Cliente</span>
              <strong>{{ order.customerName }}</strong>
            </li>
            <li>
              <span>Email</span>
              <strong>{{ order.customerEmail }}</strong>
            </li>
            <li v-if="order.branch?.name">
              <span>Sucursal</span>
              <strong>{{ order.branch.name }}</strong>
            </li>
            <li>
              <span>{{ deliveryLabels[order.deliveryType as string] || 'Tipo' }}</span>
              <strong>{{ deliveryLabels[order.deliveryType as string] || '—' }}</strong>
            </li>
            <li v-if="(order.deliveryCost ?? 0) > 0">
              <span>Costo de envío</span>
              <strong>${{ centsToDollars(order.deliveryCost ?? 0).toFixed(2) }}</strong>
            </li>
            <li>
              <span>Total pagado</span>
              <strong class="response-card__price">${{ centsToDollars(order.total ?? 0).toFixed(2) }}</strong>
            </li>
            <li v-if="order.deliveryAddress && order.deliveryType === 'delivery'">
              <span>Dirección</span>
              <strong class="response-card__address">{{ order.deliveryAddress }}</strong>
            </li>
          </ul>

          <div v-if="order.items?.length" class="response-card__items">
            <p class="response-card__items-head"><i class="fa-solid fa-receipt" /> Productos</p>
            <div v-for="item in order.items" :key="item.name" class="response-card__item">
              <div class="response-card__item-media">
                <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
                <span v-else><i class="fa-solid fa-utensils" /></span>
              </div>
              <div class="response-card__item-copy">
                <strong>{{ item.name }}</strong>
                <span class="response-card__item-qty">x{{ item.quantity }}</span>
              </div>
              <span class="response-card__item-price">${{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
          <a v-if="order.picker?.smrURL" :href="order.picker.smrURL" target="_blank" rel="noopener noreferrer" class="response-card__tracking">
            <i class="fa-solid fa-location-crosshairs" /> Seguir delivery en vivo
          </a>
        </div>

        <div class="response-actions">
          <button class="btn-primary response-actions__btn" @click="router.push({ path: '/pedido', query: { order: order?.orderNumber, email: order?.customerEmail } })">
            <i class="fa-solid fa-magnifying-glass" /> Seguir mi pedido
          </button>
          <button class="btn-secondary response-actions__btn" @click="router.push('/catalogo')">
            <i class="fa-solid fa-utensils" /> Seguir comprando
          </button>
        </div>
      </template>

      <template v-else>
        <div class="response-card">
          <div class="response-card__icon response-card__icon--error">
            <i class="fa-solid fa-xmark" />
          </div>
          <p class="response-card__eyebrow">Pago no procesado</p>
          <h1 class="response-card__title">Algo salió mal</h1>
          <p class="response-card__msg">{{ status }}</p>
        </div>

        <div class="response-actions">
          <button class="btn-primary response-actions__btn" @click="router.push('/checkout')">
            <i class="fa-solid fa-arrow-left" /> Intentar de nuevo
          </button>
        </div>
      </template>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.response-page {
  background:
    radial-gradient(circle at 8% 0%, rgba(239, 213, 55, 0.2), transparent 32%),
    linear-gradient(180deg, #f8f6ec 0%, #f2f4ed 52%, #fff 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.response-page__main {
  align-items: center;
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  padding: 2rem 1rem;
}

.response-card {
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(28, 22, 12, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-width: 460px;
  padding: 2.25rem 1.5rem;
  text-align: center;
  width: 100%;
}

.response-card--loading {
  gap: 1.5rem;
}

.response-card__spinner {
  animation: spin 0.8s linear infinite;
  border: 4px solid rgba(35, 89, 49, 0.12);
  border-top-color: #235931;
  border-radius: 50%;
  height: 72px;
  width: 72px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.response-card__loading-text {
  color: rgba(8, 17, 13, 0.6);
  font-weight: 700;
}

.response-card__icon {
  align-items: center;
  border-radius: 50%;
  display: inline-flex;
  height: 72px;
  justify-content: center;
  width: 72px;
  font-size: 1.8rem;
}

.response-card__icon--success {
  background: rgba(35, 89, 49, 0.08);
  color: #235931;
}

.response-card__icon--error {
  background: rgba(160, 40, 40, 0.08);
  color: #a02828;
}

.response-card__eyebrow {
  color: #00a523;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.response-card__title {
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  text-transform: uppercase;
}

.response-card__msg {
  color: rgba(8, 17, 13, 0.6);
  font-size: 0.95rem;
  line-height: 1.5;
}

.response-card__secure {
  color: rgba(8, 17, 13, 0.4);
  font-size: 0.78rem;
  margin-top: 0.25rem;
}

.response-card__badge {
  background: rgba(35, 89, 49, 0.08);
  border-radius: 999px;
  color: #235931;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.25rem 0.7rem;
  text-transform: uppercase;
}

.response-card__price {
  color: #235931;
  font-size: 1.05rem;
}

.response-card__address {
  font-size: 0.8rem;
  max-width: 220px;
  text-align: right;
  line-height: 1.4;
}

.response-card__details {
  border-top: 1px solid rgba(8, 17, 13, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  list-style: none;
  margin-top: 0.25rem;
  padding: 1rem 0;
  width: 100%;
}

.response-card__details li {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.response-card__details li span {
  color: rgba(8, 17, 13, 0.5);
  font-size: 0.85rem;
}

.response-card__details li strong {
  font-size: 0.9rem;
}

.response-card__items {
  border-top: 1px solid rgba(8, 17, 13, 0.06);
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1rem 0 0;
  width: 100%;
  text-align: left;
}

.response-card__items-head {
  align-items: center;
  color: rgba(8, 17, 13, 0.5);
  display: flex;
  font-size: 0.78rem;
  font-weight: 800;
  gap: 0.4rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.response-card__items-head i {
  color: #235931;
}

.response-card__item {
  align-items: center;
  display: flex;
  gap: 0.65rem;
  padding: 0.4rem 0;
}

.response-card__item:not(:last-child) {
  border-bottom: 1px solid rgba(8, 17, 13, 0.04);
}

.response-card__item-media {
  background: linear-gradient(145deg, #eef1e6, #dfe8d9);
  border-radius: 10px;
  flex: 0 0 44px;
  height: 44px;
  overflow: hidden;
}

.response-card__item-media img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.response-card__item-media > span {
  align-items: center;
  color: #235931;
  display: flex;
  font-size: 0.95rem;
  height: 100%;
  justify-content: center;
}

.response-card__item-copy {
  align-items: center;
  display: flex;
  flex: 1 1 0;
  gap: 0.5rem;
  min-width: 0;
}

.response-card__item-copy strong {
  font-size: 0.88rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.response-card__item-qty {
  color: rgba(8, 17, 13, 0.45);
  flex: 0 0 auto;
  font-size: 0.78rem;
}

.response-card__item-price {
  color: #235931;
  flex: 0 0 auto;
  font-size: 0.88rem;
  font-weight: 700;
}

.response-actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  max-width: 460px;
  width: 100%;
}

.response-actions__btn {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  min-height: 52px;
  width: 100%;
  font-size: 1rem;
}

@media (min-width: 480px) {
.response-card__tracking {
  align-items: center;
  background: #235931;
  border-radius: 14px;
  color: #fff;
  display: flex;
  font-size: 0.88rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 48px;
  padding: 0.65rem 1rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
  width: 100%;
}

.response-card__tracking:hover {
  background: #00a523;
  transform: translateY(-1px);
}

.response-actions {
    flex-direction: row;
  }
}
</style>
