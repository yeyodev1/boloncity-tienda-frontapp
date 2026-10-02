<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'
import { absoluteTime, relativeTime, statusIcon, statusLabel } from './orderStory'

const props = defineProps<{
  order: OrderDTO
  canRetry: boolean
  retrying: boolean
}>()

const emit = defineEmits<{
  (e: 'retry'): void
  (e: 'print'): void
}>()

// El backend sí manda `source` (web | whatsapp); el tipo compartido todavía no lo declara.
const source = computed(() => props.order.source || 'web')

// El ciclo real del pedido. Un retiro en local no pasa por «En entrega».
const isPickup = computed(() => props.order.deliveryType === 'pickup')
const steps = computed(() => isPickup.value
  ? [
      { key: 'pending', label: 'Recibido' },
      { key: 'paid', label: 'Pagado' },
      { key: 'preparing', label: 'En cocina' },
      { key: 'awaiting_pickup', label: 'Listo' },
      { key: 'delivered', label: 'Retirado' },
    ]
  : [
      { key: 'pending', label: 'Recibido' },
      { key: 'paid', label: 'Pagado' },
      { key: 'preparing', label: 'En cocina' },
      { key: 'awaiting_pickup', label: 'Por recoger' },
      { key: 'ready', label: 'En camino' },
      { key: 'delivered', label: 'Entregado' },
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
// Cancelar no reversa el cobro: hay que avisarlo aquí, arriba, no solo en el panel de pago.
const cardStillCharged = computed(() => Boolean(
  props.order.paymentMethod === 'card'
  && props.order.payphone?.transactionId
  && props.order.payphone?.refund?.status !== 'refunded'))

const phoneDigits = computed(() => (props.order.customerPhone || '').replace(/\D/g, ''))
const whatsappLink = computed(() => (phoneDigits.value.length >= 9 ? `https://wa.me/${phoneDigits.value}` : ''))
</script>

<template>
  <header class="hero">
    <div class="hero__main">
      <div class="hero__id">
        <p class="hero__eyebrow">
          <span class="hero__source" :data-source="source">
            <i :class="source === 'whatsapp' ? 'fa-brands fa-whatsapp' : 'fa-solid fa-globe'" aria-hidden="true" />
            {{ source === 'whatsapp' ? 'Pedido por WhatsApp' : 'Pedido web' }}
          </span>
          <span v-if="order.createdAt" :title="absoluteTime(order.createdAt)">{{ relativeTime(order.createdAt) }} · {{ absoluteTime(order.createdAt) }}</span>
        </p>
        <h1>{{ order.orderNumber }}</h1>
        <span class="status-pill hero__status" :data-status="order.status">
          <i :class="['fa-solid', statusIcon(order.status)]" aria-hidden="true" /> {{ statusLabel(order.status) }}
        </span>
      </div>

      <div class="hero__actions">
        <button type="button" class="hero__btn hero__btn--primary" @click="emit('print')">
          <i class="fa-solid fa-print" aria-hidden="true" /> Imprimir ticket
        </button>
        <button v-if="canRetry" type="button" class="hero__btn" :disabled="retrying" @click="emit('retry')">
          <i class="fa-solid fa-motorcycle" aria-hidden="true" /> {{ retrying ? 'Solicitando…' : 'Reintentar delivery' }}
        </button>
      </div>
    </div>

    <div class="hero__customer">
      <span class="hero__avatar" aria-hidden="true">{{ (order.customerName || order.customerEmail || '?').trim().slice(0, 1).toUpperCase() }}</span>
      <div class="hero__who">
        <strong>{{ order.customerName || 'Cliente sin nombre' }}</strong>
        <small>{{ order.customerEmail }}<template v-if="order.customerPhone"> · {{ order.customerPhone }}</template></small>
      </div>
      <div class="hero__contact">
        <a v-if="whatsappLink" :href="whatsappLink" target="_blank" rel="noopener" class="hero__chip hero__chip--wa" aria-label="Escribir por WhatsApp">
          <i class="fa-brands fa-whatsapp" aria-hidden="true" /><span>WhatsApp</span>
        </a>
        <a v-if="order.customerPhone" :href="`tel:${order.customerPhone}`" class="hero__chip" aria-label="Llamar al cliente">
          <i class="fa-solid fa-phone" aria-hidden="true" /><span>Llamar</span>
        </a>
        <a v-if="order.customerEmail" :href="`mailto:${order.customerEmail}`" class="hero__chip" aria-label="Escribir un correo">
          <i class="fa-solid fa-envelope" aria-hidden="true" /><span>Correo</span>
        </a>
      </div>
    </div>

    <div v-if="isCancelled" class="hero__cancelled" role="note">
      <p>
        <i class="fa-solid fa-ban" aria-hidden="true" />
        <span v-if="cancelledBy">Cancelado por <b>{{ cancelledBy.byEmail }}</b><template v-if="cancelledBy.at"> · {{ absoluteTime(cancelledBy.at) }}</template></span>
        <span v-else>Este pedido fue cancelado. Mira la historia para ver quién y por qué.</span>
      </p>
      <p v-if="cancelledBy?.reason" class="hero__cancelled-reason"><b>Motivo:</b> {{ cancelledBy.reason }}</p>
      <p v-if="cardStillCharged" class="hero__cancelled-refund">
        <i class="fa-solid fa-credit-card" aria-hidden="true" />
        <span>El cobro con tarjeta <b>sigue vigente</b>: cancelar no lo anula. Para devolver el dinero usa <b>Devolver</b> en la tarjeta de Pago.</span>
      </p>
    </div>
    <ol v-else class="hero__steps" aria-label="Avance del pedido">
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        :class="{ done: index < currentIndex, current: index === currentIndex }"
        :aria-current="index === currentIndex ? 'step' : undefined"
      >
        <span class="hero__bar" aria-hidden="true" />
        <small>{{ step.label }}</small>
      </li>
    </ol>
  </header>
</template>

<style scoped lang="scss">
.hero {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: 22px;
  box-shadow: var(--admin-shadow);
  color: var(--admin-text);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  overflow: hidden;
  padding: 1.15rem;
  position: relative;

  // Franja de marca arriba: amarillo sobre verde, la firma de Boloncity.
  &::before {
    background: linear-gradient(90deg, var(--admin-accent) 0 70%, var(--admin-yellow) 70% 100%);
    content: '';
    height: 4px;
    inset: 0 0 auto;
    position: absolute;
  }
}

.hero__main { display: flex; flex-direction: column; gap: 1rem; }
.hero__id { display: flex; flex-direction: column; gap: 0.45rem; min-width: 0; }

.hero__eyebrow {
  align-items: center;
  color: var(--admin-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.76rem;
  gap: 0.4rem 0.7rem;
  margin: 0;
}

.hero__source {
  align-items: center;
  background: var(--admin-hover);
  border-radius: 999px;
  color: var(--admin-text);
  display: inline-flex;
  font-weight: 800;
  gap: 0.35rem;
  padding: 0.22rem 0.6rem;

  &[data-source='whatsapp'] { background: var(--admin-success-soft); color: var(--admin-success); }
}

.hero h1 {
  font-size: clamp(1.9rem, 6vw, 2.7rem);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1;
  margin: 0;
}

.hero__status { align-self: flex-start; font-size: 0.82rem; padding: 0.4rem 0.85rem; }
.hero__status::before { display: none; }

.hero__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.hero__btn {
  align-items: center;
  background: var(--admin-hover);
  border: 1px solid var(--admin-line);
  border-radius: 12px;
  color: var(--admin-text);
  display: inline-flex;
  flex: 1 1 auto;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 44px;
  padding: 0.6rem 1rem;
  transition: filter 0.2s ease, background 0.2s ease;

  &:hover:not(:disabled) { background: var(--admin-accent-soft); }
  &:disabled { cursor: wait; opacity: 0.6; }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
}

.hero__btn--primary {
  background: var(--admin-yellow);
  border-color: transparent;
  color: var(--admin-on-yellow);

  &:hover:not(:disabled) { background: var(--admin-yellow); filter: brightness(1.05); }
}

.hero__customer {
  align-items: center;
  background: var(--admin-surface-2);
  border: 1px solid var(--admin-line);
  border-radius: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem;
}

.hero__avatar {
  align-items: center;
  background: var(--admin-accent);
  border-radius: 50%;
  color: var(--admin-on-accent);
  display: flex;
  flex: 0 0 40px;
  font-weight: 800;
  height: 40px;
  justify-content: center;
}

.hero__who {
  display: flex;
  flex: 1 1 180px;
  flex-direction: column;
  min-width: 0;

  strong { font-size: 0.95rem; }
  small { color: var(--admin-muted); font-size: 0.78rem; overflow-wrap: anywhere; }
}

.hero__contact { display: flex; flex-wrap: wrap; gap: 0.4rem; }

.hero__chip {
  align-items: center;
  background: var(--admin-surface);
  border: 1px solid var(--admin-line-strong);
  border-radius: 999px;
  color: var(--admin-text);
  display: inline-flex;
  font-size: 0.76rem;
  font-weight: 800;
  gap: 0.4rem;
  min-height: 36px;
  padding: 0.35rem 0.75rem;
  text-decoration: none;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover { background: var(--admin-hover); }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
}

.hero__chip--wa { background: var(--admin-success-soft); border-color: transparent; color: var(--admin-success); }

.hero__cancelled {
  background: var(--admin-danger-soft);
  border-radius: 14px;
  color: var(--admin-danger);
  display: flex;
  flex-direction: column;
  font-size: 0.86rem;
  gap: 0.35rem;
  padding: 0.75rem 0.9rem;

  p { margin: 0; }
  > p:first-child { align-items: center; display: flex; font-weight: 700; gap: 0.5rem; }
}

.hero__cancelled-reason { color: var(--admin-text); line-height: 1.45; }

.hero__cancelled-refund {
  align-items: flex-start;
  background: var(--admin-warning-soft);
  border-radius: 10px;
  color: var(--admin-warning);
  display: flex;
  gap: 0.45rem;
  line-height: 1.45;
  padding: 0.5rem 0.65rem;
}

// Riel de avance: barras que se llenan hasta el paso actual.
.hero__steps {
  display: flex;
  gap: 0.35rem;
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;
  }

  small {
    color: var(--admin-subtle);
    font-size: 0.68rem;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .done small { color: var(--admin-muted); }
  .current small { color: var(--admin-text); font-weight: 800; }
}

.hero__bar {
  background: var(--admin-line-strong);
  border-radius: 999px;
  height: 6px;

  .done & { background: var(--admin-accent); }
  .current & { background: var(--admin-yellow); box-shadow: 0 0 0 3px color-mix(in srgb, var(--admin-yellow) 30%, transparent); }
}

@media (min-width: 900px) {
  .hero { padding: 1.4rem 1.5rem; }
  .hero__main { align-items: flex-start; flex-direction: row; justify-content: space-between; }
  .hero__actions { flex-wrap: nowrap; }
  .hero__btn { flex: 0 0 auto; }
}

@media (prefers-reduced-motion: reduce) {
  .hero__btn, .hero__chip { transition: none; }
}
</style>
