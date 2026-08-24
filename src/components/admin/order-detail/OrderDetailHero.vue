<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'

const props = defineProps<{
  order: OrderDTO
  canRetry: boolean
  retrying: boolean
}>()

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'print'): void
}>()

// El ciclo real del pedido, en el orden del tablero. El riel marca dónde está la orden.
// Un retiro en local no pasa por «En entrega»: del mostrador va directo a entregado.
const isPickup = computed(() => props.order.deliveryType === 'pickup')
const steps = computed(() => isPickup.value
  ? [
      { key: 'pending', label: 'Pendiente', icon: 'fa-clock' },
      { key: 'paid', label: 'Pagada', icon: 'fa-credit-card' },
      { key: 'preparing', label: 'Preparando', icon: 'fa-kitchen-set' },
      { key: 'awaiting_pickup', label: 'Lista para retiro', icon: 'fa-bag-shopping' },
      { key: 'delivered', label: 'Retirada', icon: 'fa-circle-check' },
    ]
  : [
      { key: 'pending', label: 'Pendiente', icon: 'fa-clock' },
      { key: 'paid', label: 'Pagada', icon: 'fa-credit-card' },
      { key: 'preparing', label: 'Preparando', icon: 'fa-kitchen-set' },
      { key: 'awaiting_pickup', label: 'Por recoger', icon: 'fa-box' },
      { key: 'ready', label: 'En entrega', icon: 'fa-truck-fast' },
      { key: 'delivered', label: 'Entregada', icon: 'fa-circle-check' },
    ])

const isCancelled = computed(() => props.order.status === 'cancelled')
const currentIndex = computed(() => steps.value.findIndex((step) => step.key === props.order.status))

// Quién canceló: primero el registro directo; si es un pedido viejo, se rescata de la auditoría.
const cancelledBy = computed(() => {
  if (props.order.cancellation?.byEmail) return props.order.cancellation
  const entry = [...(props.order.audit || [])].reverse().find((item) => item.toValue === 'cancelled')
  if (!entry) return null
  return { byEmail: entry.performedByEmail || 'system', reason: entry.details || '', at: entry.timestamp }
})
const cancelledAtLabel = computed(() => cancelledBy.value?.at
  ? new Date(cancelledBy.value.at).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
  : '')
// Cancelar no reversa el cobro: hay que avisarlo aquí, arriba, no solo en el panel de pago.
const cardStillCharged = computed(() => Boolean(
  props.order.paymentMethod === 'card'
  && props.order.payphone?.transactionId
  && props.order.payphone?.refund?.status !== 'refunded'))

const statusLabels: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagada', preparing: 'En preparación',
  awaiting_pickup: 'Por recoger', ready: 'En entrega', delivered: 'Entregada', cancelled: 'Cancelada',
}
const statusColors: Record<string, string> = {
  pending: '#b8860b', paid: '#0066cc', preparing: '#00a523',
  awaiting_pickup: '#7c3aed', ready: '#0066cc', delivered: '#235931', cancelled: '#a52323',
}
const statusIcons: Record<string, string> = {
  pending: 'fa-clock', paid: 'fa-credit-card', preparing: 'fa-kitchen-set',
  awaiting_pickup: 'fa-box', ready: 'fa-truck-fast', delivered: 'fa-circle-check', cancelled: 'fa-ban',
}

const createdLabel = computed(() =>
  props.order.createdAt
    ? new Date(props.order.createdAt).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
    : ''
)
</script>

<template>
  <header class="order-hero">
    <div class="order-hero__top">
      <div class="order-hero__id">
        <p class="order-hero__eyebrow">Orden</p>
        <h1>{{ order.orderNumber }}</h1>
        <p class="order-hero__meta">
          <i class="fa-solid fa-user" /> {{ order.customerName || order.customerEmail }}
          <span v-if="createdLabel"> · {{ createdLabel }}</span>
        </p>
      </div>

      <div class="order-hero__side">
        <span class="order-hero__status" :style="{ background: statusColors[order.status] || '#555' }">
          <i :class="['fa-solid', statusIcons[order.status] || 'fa-circle-info']" /> {{ statusLabels[order.status] || order.status }}
        </span>
        <div class="order-hero__actions">
          <button type="button" class="order-hero__print" @click="emit('print')">
            <i class="fa-solid fa-print" /> Imprimir ticket
          </button>
          <button v-if="canRetry" type="button" class="order-hero__retry" :disabled="retrying" @click="emit('retry')">
            <i class="fa-solid fa-truck-fast" /> {{ retrying ? 'Solicitando…' : 'Reintentar delivery' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="isCancelled" class="order-hero__cancelled">
      <p class="order-hero__cancelled-head">
        <i class="fa-solid fa-ban" />
        <span v-if="cancelledBy">Cancelada por <b>{{ cancelledBy.byEmail }}</b><template v-if="cancelledAtLabel"> · {{ cancelledAtLabel }}</template></span>
        <span v-else>Esta orden fue cancelada. Revisa la auditoría para ver quién y por qué.</span>
      </p>
      <p v-if="cancelledBy?.reason" class="order-hero__cancelled-reason"><b>Motivo:</b> {{ cancelledBy.reason }}</p>
      <p v-if="cardStillCharged" class="order-hero__cancelled-refund">
        <i class="fa-solid fa-credit-card" /> El cobro con tarjeta <b>sigue vigente</b>: cancelar no lo anula.
        Para devolver el dinero usa <b>Devolver</b> en la tarjeta de Pago.
      </p>
    </div>
    <ol v-else class="order-hero__steps">
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        :class="{ done: index < currentIndex, current: index === currentIndex }"
      >
        <span class="order-hero__dot"><i :class="['fa-solid', index < currentIndex ? 'fa-check' : step.icon]" /></span>
        <small>{{ step.label }}</small>
      </li>
    </ol>
  </header>
</template>

<style scoped lang="scss">
.order-hero {
  background: linear-gradient(135deg, #173e22, #235931);
  border-radius: 22px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: clamp(1.1rem, 3vw, 1.75rem);
}

.order-hero__top { display: flex; flex-direction: column; gap: 1rem; }
.order-hero__id { min-width: 0; }

.order-hero__eyebrow {
  color: #efd537;
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.order-hero h1 {
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 900;
  letter-spacing: -0.04em;
  line-height: 1;
  margin: 0.25rem 0 0.4rem;
}

.order-hero__meta { align-items: center; color: rgba(255, 255, 255, 0.78); display: flex; flex-wrap: wrap; font-size: 0.9rem; gap: 0.4rem; }
.order-hero__meta i { color: #efd537; font-size: 0.8rem; }

.order-hero__side { align-items: stretch; display: flex; flex-direction: column; gap: 0.6rem; }

.order-hero__status {
  align-items: center;
  border-radius: 999px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
  color: #fff;
  display: flex;
  font-size: 0.9rem;
  font-weight: 900;
  gap: 0.5rem;
  justify-content: center;
  letter-spacing: 0.1em;
  min-height: 48px;
  padding: 0.7rem 1.3rem;
  text-transform: uppercase;
}

.order-hero__actions { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.order-hero__actions > button { flex: 1 1 150px; }

.order-hero__print {
  align-items: center;
  background: #efd537;
  border: 0;
  border-radius: 12px;
  box-shadow: 0 4px 0 #b89e12;
  color: #18211b;
  cursor: pointer;
  display: flex;
  font-size: 0.82rem;
  font-weight: 900;
  gap: 0.5rem;
  justify-content: center;
  min-height: 46px;
  padding: 0.65rem 1rem;
}

.order-hero__print:active { box-shadow: none; transform: translateY(4px); }

.order-hero__retry {
  align-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: 12px;
  color: #fff;
  cursor: pointer;
  display: flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 46px;
  padding: 0.65rem 1rem;
}

.order-hero__retry:disabled { cursor: wait; opacity: 0.6; }

.order-hero__cancelled {
  background: rgba(165, 35, 35, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  font-size: 0.88rem;
  gap: 0.35rem;
  padding: 0.75rem 0.9rem;
}

.order-hero__cancelled-head { align-items: center; display: flex; font-weight: 800; gap: 0.55rem; }
.order-hero__cancelled-reason { font-weight: 600; line-height: 1.45; opacity: 0.92; }
.order-hero__cancelled-refund {
  align-items: flex-start;
  background: rgba(239, 213, 55, 0.22);
  border-radius: 10px;
  display: flex;
  font-weight: 600;
  gap: 0.45rem;
  line-height: 1.45;
  padding: 0.5rem 0.65rem;
}

.order-hero__steps {
  display: flex;
  gap: 0.35rem;
  list-style: none;
  margin: 0;
  overflow-x: auto;
  padding: 0 0 0.25rem;
  scrollbar-width: none;
}

.order-hero__steps::-webkit-scrollbar { display: none; }

.order-hero__steps li {
  align-items: center;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 74px;
  opacity: 0.42;
  position: relative;
}

// Conector entre pasos: la línea sale hacia el paso siguiente.
.order-hero__steps li:not(:last-child)::after {
  background: rgba(255, 255, 255, 0.3);
  content: '';
  height: 2px;
  left: calc(50% + 22px);
  position: absolute;
  top: 18px;
  width: calc(100% - 44px);
}

.order-hero__steps li.done { opacity: 0.85; }
.order-hero__steps li.done::after { background: #00a523; }
.order-hero__steps li.current { opacity: 1; }

.order-hero__dot {
  align-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  display: flex;
  font-size: 0.8rem;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.order-hero__steps li.done .order-hero__dot { background: #00a523; border-color: #00a523; }
.order-hero__steps li.current .order-hero__dot { background: #efd537; border-color: #efd537; box-shadow: 0 0 0 5px rgba(239, 213, 55, 0.25); color: #18211b; }

.order-hero__steps small { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.04em; text-align: center; text-transform: uppercase; white-space: nowrap; }

@media (min-width: 900px) {
  .order-hero__top { align-items: flex-start; flex-direction: row; justify-content: space-between; }
  .order-hero__side { align-items: flex-end; flex: 0 0 auto; }
  .order-hero__actions > button { flex: 0 0 auto; }
}
</style>
