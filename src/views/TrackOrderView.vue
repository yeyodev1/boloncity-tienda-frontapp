<script setup lang="ts">
import { computed, ref } from 'vue'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'

const email = ref('')
const orderNumber = ref('')
const order = ref<OrderDTO | null>(null)
const loading = ref(false)
const errorMessage = ref('')

async function search() {
  loading.value = true
  errorMessage.value = ''
  order.value = null

  try {
    const response = await OrderService.getByNumber(orderNumber.value.trim(), email.value.trim() || undefined)
    order.value = response.data
  } catch {
    errorMessage.value = 'No encontramos ese pedido.'
  } finally {
    loading.value = false
  }
}

const timeline = [
  { key: 'pending', label: 'Pendiente' },
  { key: 'paid', label: 'Pagado' },
  { key: 'preparing', label: 'Preparando' },
  { key: 'ready', label: 'Listo' },
  { key: 'delivered', label: 'Entregado' },
]

const currentStepIndex = computed(() => {
  if (!order.value) return -1
  return timeline.findIndex((item) => item.key === order.value?.status)
})
</script>

<template>
  <div class="track-page">
    <StoreHeader />

    <main class="track-page__main">
      <section class="track-hero panel">
        <div>
          <p class="track-hero__eyebrow">Seguimiento</p>
          <h1>Seguir pedido</h1>
          <p>
            Busca por correo y número de pedido para ver el estado de tu compra.
          </p>
        </div>
      </section>

      <section class="track-shell panel">
        <form class="track-form" @submit.prevent="search">
          <input v-model.trim="email" type="email" placeholder="tu@email.com" autocomplete="email" />
          <input v-model.trim="orderNumber" type="text" placeholder="Número de pedido" />
          <button class="btn-primary" type="submit" :disabled="loading || !orderNumber">
            {{ loading ? 'Buscando...' : 'Buscar' }}
          </button>
        </form>

        <p v-if="errorMessage" class="track-error">{{ errorMessage }}</p>
        <SkeletonLoader v-if="loading" type="list" :count="3" />

        <div v-else-if="order" class="track-result">
          <div class="track-result__head">
            <div>
              <p class="track-result__eyebrow">Pedido {{ order.orderNumber }}</p>
              <h2>${{ order.total.toFixed(2) }}</h2>
            </div>
            <span class="track-result__status">{{ order.status }}</span>
          </div>

          <div class="track-timeline">
            <div
              v-for="(step, index) in timeline"
              :key="step.key"
              class="track-timeline__row"
              :class="{ active: currentStepIndex >= index }"
            >
              <span class="track-timeline__dot" />
              <span>{{ step.label }}</span>
            </div>
          </div>
        </div>

        <div v-else class="track-empty muted">
          Ingresa tus datos para ver el estado del pedido.
        </div>
      </section>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.track-page {
  display: grid;
  min-height: 100vh;
}

.track-page__main {
  display: grid;
  gap: 1.25rem;
  margin: 0 auto;
  max-width: 900px;
  width: 100%;
}

.track-hero,
.track-shell {
  margin: 0 1.25rem;
  padding: 1.5rem;
}

.track-hero__eyebrow,
.track-result__eyebrow {
  @include eyebrow;
  color: #00a523;
  margin-bottom: 0.5rem;
}

.track-hero h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.95;
  text-transform: uppercase;
}

.track-hero p {
  @include body-text;
  margin-top: 0.85rem;
  max-width: 36rem;
}

.track-shell {
  display: grid;
  gap: 1rem;
}

.track-form {
  display: grid;
  gap: 0.75rem;
}

.track-error {
  color: #a02828;
}

.track-result {
  border-top: 1px solid rgba(26, 26, 26, 0.08);
  display: grid;
  gap: 1rem;
  padding-top: 1.25rem;
}

.track-result__head {
  align-items: start;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.track-result h2 {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800;
}

.track-result__status {
  @include pill-button(rgba(35, 89, 49, 0.08), #235931);
  min-height: 40px;
  padding: 0.7rem 0.95rem;
  text-transform: capitalize;
}

.track-timeline {
  display: grid;
  gap: 0.7rem;
}

.track-timeline__row {
  align-items: center;
  color: rgba(26, 26, 26, 0.52);
  display: flex;
  gap: 0.85rem;
  position: relative;
}

.track-timeline__row::before {
  background: rgba(26, 26, 26, 0.08);
  content: '';
  height: calc(100% + 0.7rem);
  left: 6px;
  position: absolute;
  top: 12px;
  width: 2px;
}

.track-timeline__row:last-child::before {
  display: none;
}

.track-timeline__row.active {
  color: var(--text);
}

.track-timeline__dot {
  background: rgba(26, 26, 26, 0.18);
  border-radius: 50%;
  box-shadow: 0 0 0 6px rgba(35, 89, 49, 0.04);
  height: 12px;
  position: relative;
  width: 12px;
  z-index: 1;
}

.track-timeline__row.active .track-timeline__dot {
  background: #235931;
}

.track-empty {
  padding-top: 0.5rem;
}
</style>
