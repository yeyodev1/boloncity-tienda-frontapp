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
  background:
    radial-gradient(circle at 10% 0%, rgba(239, 213, 55, 0.16), transparent 34%),
    linear-gradient(180deg, #f8f6ec 0%, #f4f4f0 48%, #fff 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.track-page__main {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  gap: clamp(1rem, 3vw, 1.5rem);
  margin: 0 auto;
  max-width: 1180px;
  padding: clamp(1.25rem, 4vw, 2.5rem) 1rem clamp(2.5rem, 6vw, 5rem);
  width: 100%;
}

.track-hero,
.track-shell {
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 28px;
  box-shadow: 0 22px 54px rgba(26, 26, 26, 0.08);
  margin: 0;
  padding: clamp(1.15rem, 4vw, 1.75rem);
}

.track-hero {
  background:
    linear-gradient(135deg, rgba(35, 89, 49, 0.96), rgba(12, 34, 18, 0.94)),
    radial-gradient(circle at 90% 15%, rgba(239, 213, 55, 0.25), transparent 28%);
  color: #fff;
}

.track-hero__eyebrow,
.track-result__eyebrow {
  @include eyebrow;
  color: #00a523;
  margin-bottom: 0.5rem;
}

.track-hero__eyebrow {
  color: #efd537;
}

.track-hero h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.95;
  text-transform: uppercase;
}

.track-hero p {
  color: rgba(255, 255, 255, 0.78);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.65;
  margin-top: 0.85rem;
  max-width: 36rem;
}

.track-shell {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.track-form {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.track-form input {
  min-height: 56px;
}

.track-form button {
  justify-content: center;
  min-height: 56px;
  min-width: 150px;
}

.track-error {
  color: #a02828;
}

.track-result {
  border-top: 1px solid rgba(26, 26, 26, 0.08);
  display: flex;
  flex-direction: column;
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
  display: flex;
  flex-direction: column;
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
  background: rgba(35, 89, 49, 0.04);
  border: 1px dashed rgba(35, 89, 49, 0.18);
  border-radius: 20px;
  padding: 1.25rem;
  text-align: center;
}

@media (min-width: 761px) {
  .track-form {
    flex-direction: row;
  }

  .track-form input {
    flex: 1 1 0;
  }

  .track-form button {
    flex: 0 0 160px;
  }
}

@media (min-width: 1180px) {
  .track-hero,
  .track-shell {
    padding: 2.75rem;
  }
}
</style>
