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
  <div class="rpage">
    <StoreHeader />

    <main class="rpage__main">
      <div v-if="phase === 'loading'" class="rpage__loader">
        <div class="rpage__spinner" />
        <p class="rpage__loader-text">Confirmando tu pago...</p>
      </div>

      <template v-else-if="phase === 'success' && order">
        <div class="rpage__hero">
          <div class="rpage__check">
            <i class="fa-solid fa-check" />
          </div>
          <p class="rpage__eyebrow">Pago exitoso</p>
          <h1 class="rpage__hero-title">Pedido {{ order.orderNumber }}</h1>
          <p class="rpage__hero-sub">Tu pago fue procesado correctamente.</p>
        </div>

        <div class="rpage__card">
          <div class="rpage__row">
            <span class="rpage__label">Estado</span>
            <span class="rpage__badge">Pagado</span>
          </div>
          <div v-if="order.customerName" class="rpage__row">
            <span class="rpage__label">Cliente</span>
            <span class="rpage__value">{{ order.customerName }}</span>
          </div>
          <div class="rpage__row">
            <span class="rpage__label">Email</span>
            <span class="rpage__value">{{ order.customerEmail }}</span>
          </div>
          <div v-if="order.branch?.name" class="rpage__row">
            <span class="rpage__label">Sucursal</span>
            <span class="rpage__value">{{ order.branch.name }}</span>
          </div>
          <div class="rpage__row">
            <span class="rpage__label">{{ deliveryLabels[order.deliveryType as string] || 'Tipo' }}</span>
            <span class="rpage__value">{{ deliveryLabels[order.deliveryType as string] || '—' }}</span>
          </div>
          <div v-if="(order.deliveryCost ?? 0) > 0" class="rpage__row">
            <span class="rpage__label">Costo de envío</span>
            <span class="rpage__value">${{ centsToDollars(order.deliveryCost ?? 0).toFixed(2) }}</span>
          </div>
          <div class="rpage__row rpage__row--total">
            <span class="rpage__label">Total pagado</span>
            <span class="rpage__total">${{ centsToDollars(order.total ?? 0).toFixed(2) }}</span>
          </div>
          <div v-if="order.deliveryAddress && order.deliveryType === 'delivery'" class="rpage__row">
            <span class="rpage__label">Dirección</span>
            <span class="rpage__value rpage__value--addr">{{ order.deliveryAddress }}</span>
          </div>
        </div>

        <div v-if="order.items?.length" class="rpage__card">
          <p class="rpage__card-heading">
            <i class="fa-solid fa-receipt" /> Productos
          </p>
          <div v-for="item in order.items" :key="item.name" class="rpage__item">
            <div class="rpage__item-media">
              <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
              <span v-else><i class="fa-solid fa-utensils" /></span>
            </div>
            <div class="rpage__item-info">
              <strong>{{ item.name }}</strong>
              <span class="rpage__item-qty">x{{ item.quantity }}</span>
            </div>
            <span class="rpage__item-price">${{ (item.price * item.quantity).toFixed(2) }}</span>
          </div>
        </div>

        <a v-if="order.picker?.smrURL" :href="order.picker.smrURL" target="_blank" rel="noopener noreferrer" class="rpage__tracking">
          <i class="fa-solid fa-location-crosshairs" /> Seguir delivery en vivo
        </a>

        <div class="rpage__actions">
          <button class="rpage__btn rpage__btn--primary" @click="router.push({ path: '/pedido', query: { order: order?.orderNumber, email: order?.customerEmail } })">
            <i class="fa-solid fa-magnifying-glass" /> Seguir mi pedido
          </button>
          <button class="rpage__btn rpage__btn--outline" @click="router.push('/catalogo')">
            <i class="fa-solid fa-utensils" /> Seguir comprando
          </button>
        </div>
      </template>

      <template v-else>
        <div class="rpage__hero rpage__hero--error">
          <div class="rpage__check rpage__check--error">
            <i class="fa-solid fa-xmark" />
          </div>
          <p class="rpage__eyebrow">Pago no procesado</p>
          <h1 class="rpage__hero-title">Algo salió mal</h1>
          <p class="rpage__hero-sub">{{ status }}</p>
        </div>

        <div class="rpage__actions">
          <button class="rpage__btn rpage__btn--primary" @click="router.push('/checkout')">
            <i class="fa-solid fa-arrow-left" /> Intentar de nuevo
          </button>
        </div>
      </template>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.rpage {
  background:
    radial-gradient(circle at 8% 0%, rgba(239, 213, 55, 0.18), transparent 32%),
    linear-gradient(180deg, #f8f6ec 0%, #f2f4ed 52%, #fff 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.rpage__main {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  gap: clamp(0.85rem, 2.5vw, 1.25rem);
  margin: 0 auto;
  max-width: 520px;
  padding: calc(72px + clamp(1.5rem, 4vw, 2.5rem)) 1.25rem clamp(4rem, 8vw, 7rem);
  width: 100%;
}

.rpage__loader {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 3rem 0;
}

.rpage__spinner {
  animation: rpage-spin 0.8s linear infinite;
  border: 4px solid rgba(35, 89, 49, 0.1);
  border-top-color: #235931;
  border-radius: 50%;
  height: 64px;
  width: 64px;
}

@keyframes rpage-spin {
  to { transform: rotate(360deg); }
}

.rpage__loader-text {
  color: rgba(8, 17, 13, 0.5);
  font-size: 0.95rem;
  font-weight: 700;
}

.rpage__hero {
  align-items: center;
  background: linear-gradient(135deg, #235931 0%, #1a4728 50%, #102719 100%);
  border-radius: 28px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow: hidden;
  padding: clamp(2.25rem, 6vw, 3rem) 1.5rem 1.75rem;
  position: relative;
  text-align: center;
}

.rpage__hero--error {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #7f1d1d 100%);
}

.rpage__check {
  align-items: center;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  color: #fff;
  display: flex;
  font-size: 1.6rem;
  height: 64px;
  justify-content: center;
  width: 64px;
}

.rpage__check--error {
  background: rgba(255, 255, 255, 0.1);
}

.rpage__eyebrow {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  margin-top: 0.25rem;
  text-transform: uppercase;
}

.rpage__hero-title {
  color: #fff;
  font-size: clamp(1.4rem, 3.5vw, 1.85rem);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin: 0;
  text-transform: uppercase;
}

.rpage__hero-sub {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
  max-width: 30ch;
}

.rpage__card {
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(35, 89, 49, 0.06);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 1.15rem 1.25rem;
}

.rpage__card-heading {
  align-items: center;
  color: rgba(8, 17, 13, 0.45);
  display: flex;
  font-size: 0.75rem;
  font-weight: 800;
  gap: 0.4rem;
  letter-spacing: 0.08em;
  margin: 0 0 0.6rem;
  text-transform: uppercase;
}

.rpage__card-heading i { color: #235931; font-size: 0.7rem; }

.rpage__row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 0.55rem 0;
}

.rpage__row + .rpage__row {
  border-top: 1px solid rgba(35, 89, 49, 0.04);
}

.rpage__row--total {
  border-top-color: rgba(35, 89, 49, 0.1);
  padding: 0.7rem 0 0.4rem;
}

.rpage__label {
  color: rgba(8, 17, 13, 0.45);
  font-size: 0.85rem;
}

.rpage__value {
  font-size: 0.9rem;
  font-weight: 600;
  text-align: right;
}

.rpage__value--addr {
  font-size: 0.82rem;
  font-weight: 500;
  max-width: 55%;
  line-height: 1.4;
}

.rpage__badge {
  background: rgba(35, 89, 49, 0.07);
  border-radius: 999px;
  color: #235931;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.25rem 0.75rem;
  text-transform: uppercase;
}

.rpage__total {
  color: #235931;
  font-size: 1.1rem;
  font-weight: 800;
}

.rpage__item {
  align-items: center;
  display: flex;
  gap: 0.65rem;
  padding: 0.45rem 0;
}

.rpage__item + .rpage__item {
  border-top: 1px solid rgba(35, 89, 49, 0.04);
}

.rpage__item-media {
  background: linear-gradient(145deg, #eef1e6, #dfe8d9);
  border-radius: 10px;
  flex: 0 0 44px;
  height: 44px;
  overflow: hidden;
}

.rpage__item-media img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.rpage__item-media > span {
  align-items: center;
  color: #235931;
  display: flex;
  font-size: 0.95rem;
  height: 100%;
  justify-content: center;
}

.rpage__item-info {
  align-items: center;
  display: flex;
  flex: 1 1 0;
  gap: 0.5rem;
  min-width: 0;
}

.rpage__item-info strong {
  font-size: 0.88rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rpage__item-qty {
  color: rgba(8, 17, 13, 0.4);
  flex: 0 0 auto;
  font-size: 0.78rem;
}

.rpage__item-price {
  color: #235931;
  flex: 0 0 auto;
  font-size: 0.88rem;
  font-weight: 700;
}

.rpage__tracking {
  align-items: center;
  background: #235931;
  border-radius: 14px;
  color: #fff;
  display: flex;
  font-size: 0.88rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 50px;
  padding: 0.7rem 1rem;
  text-decoration: none;
  transition: background-color 0.25s ease, transform 0.25s ease;
}

.rpage__tracking:hover {
  background: #00a523;
  transform: translateY(-2px);
}

.rpage__actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.rpage__btn {
  align-items: center;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  display: flex;
  font-size: 0.95rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 52px;
  padding: 0.75rem 1.25rem;
  transition: all 0.25s ease;
  width: 100%;
}

.rpage__btn--primary {
  background: #235931;
  color: #fff;
}

.rpage__btn--primary:hover {
  background: #00a523;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 165, 35, 0.3);
}

.rpage__btn--outline {
  background: rgba(255, 255, 255, 0.8);
  border: 1.5px solid rgba(35, 89, 49, 0.12);
  color: #235931;
}

.rpage__btn--outline:hover {
  background: #fff;
  border-color: #235931;
  transform: translateY(-2px);
}

@media (min-width: 600px) {
  .rpage__main {
    max-width: 560px;
    padding-left: 2rem;
    padding-right: 2rem;
  }

  .rpage__hero { border-radius: 32px; padding: 3rem 2rem 2rem; }
  .rpage__check { height: 72px; width: 72px; font-size: 1.8rem; }
  .rpage__card { border-radius: 28px; padding: 1.35rem 1.5rem; }
  .rpage__actions { flex-direction: row; }
}
</style>
