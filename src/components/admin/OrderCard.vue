<script setup lang="ts">
import { computed } from 'vue'
import { useNow } from '@vueuse/core'
import type { OrderDTO } from '@/services/OrderService'
import {
  formatOrderCurrency,
  getNextOrderStatus,
  getOrderItemCount,
  getOrderStatusLabel,
  orderStatusLabels,
  type OrderStatus,
} from '@/composables/useOrdersBoard'

const props = defineProps<{
  order: OrderDTO
  status: OrderStatus
  driverLoading?: boolean
  /** Solo administración general cancela; el backend lo vuelve a validar. */
  canCancel?: boolean
}>()

const emit = defineEmits<{
  (event: 'open', orderId: string): void
  (event: 'advance', order: OrderDTO, status: OrderStatus): void
  (event: 'note', order: OrderDTO): void
  (event: 'driver', order: OrderDTO): void
  (event: 'print', order: OrderDTO): void
  (event: 'cancel', order: OrderDTO): void
}>()

const isDelivery = computed(() => props.order.deliveryType === 'delivery')
// Los delivery normalmente avanzan solos con el webhook de Picker, pero el cajero
// puede moverlos manualmente (queda auditado) si Picker no reporta.
// Un retiro en local salta «En reparto»: de «Listas para retiro» pasa directo a entregado.
const nextStatus = computed(() => getNextOrderStatus(props.status, props.order.deliveryType))
const nextStatusLabel = computed(() => (nextStatus.value ? getOrderStatusLabel(nextStatus.value, props.order.deliveryType) : ''))
const finishesPickup = computed(() => props.order.deliveryType === 'pickup' && nextStatus.value === 'delivered')
// El texto del botón que cierra un retiro: «Entregado al cliente», no «mover a Retiradas».
const advanceLabel = computed(() => (finishesPickup.value ? 'Entregado al cliente' : `Pasar a ${nextStatusLabel.value}`))
const picker = computed(() => props.order.picker)
// Un pedido ya cancelado o ya entregado no se cancela.
const showCancel = computed(() => props.canCancel && !['cancelled', 'delivered'].includes(props.order.status))
// El bloque de delivery solo se muestra cuando ya existe una reserva de Picker real.
// Los programados no la tienen hasta pasar a "Listas para recolección".
const hasPickerBooking = computed(() => Boolean(picker.value?.bookingId))
const deliveryStatus = computed(() => ({
  READY_FOR_PICKUP: 'Buscando motorizado',
  ACCEPTED: 'Motorizado asignado',
  ARRIVED_AT_PICKUP: 'Motorizado en el local',
  WAY_TO_DELIVER: 'En camino al cliente',
  ARRIVED_AT_DELIVERY: 'Llegó a destino',
  COMPLETED: 'Delivery entregado',
}[picker.value?.currentStatus || ''] || picker.value?.statusText || 'Preparando el delivery'))
const deliveryIcon = computed(() => ({ WAY_TO_DELIVER: 'fa-truck-fast', ARRIVED_AT_DELIVERY: 'fa-location-dot', COMPLETED: 'fa-circle-check', ACCEPTED: 'fa-motorcycle', READY_FOR_PICKUP: 'fa-magnifying-glass' }[picker.value?.currentStatus || ''] || 'fa-motorcycle'))

// Estado de pago, claro para el cajero:
//  - Efectivo: se cobra al entregar (normal que esté "pendiente").
//  - Tarjeta pagada: PayPhone confirmó (hay transactionId).
//  - Tarjeta SIN pagar: no completó el pago — NO preparar hasta validar.
const payment = computed(() => {
  if (props.order.paymentMethod === 'cash') return { tone: 'cash', icon: 'fa-money-bill-wave', label: 'Efectivo · cobrar al entregar' }
  if (props.order.payphone?.transactionId) return { tone: 'ok', icon: 'fa-circle-check', label: 'Pagado con tarjeta' }
  return { tone: 'danger', icon: 'fa-triangle-exclamation', label: 'Tarjeta sin pagar' }
})

// Cronómetro de comanda: cuánto lleva el pedido. Solo en las etapas donde el tiempo importa.
const now = useNow({ interval: 30_000 })
const TIMED: OrderStatus[] = ['pending', 'paid', 'preparing', 'awaiting_pickup', 'ready']
const elapsedMinutes = computed(() => {
  if (!TIMED.includes(props.status) || props.order.scheduledFor) return null
  const created = props.order.createdAt ? new Date(props.order.createdAt).getTime() : NaN
  if (!Number.isFinite(created)) return null
  return Math.max(0, Math.floor((now.value.getTime() - created) / 60_000))
})
const elapsedLabel = computed(() => {
  const minutes = elapsedMinutes.value
  if (minutes === null) return ''
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  return hours >= 24 ? `${Math.floor(hours / 24)} d` : `${hours} h ${minutes % 60} min`
})
const elapsedTone = computed(() => {
  const minutes = elapsedMinutes.value ?? 0
  return minutes >= 30 ? 'late' : minutes >= 15 ? 'warn' : 'ok'
})
const isFresh = computed(() => (elapsedMinutes.value ?? 99) < 2 && ['pending', 'paid'].includes(props.status))

const scheduledLabel = computed(() =>
  props.order.scheduledFor
    ? new Date(props.order.scheduledFor).toLocaleString('es-EC', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '')

const auditEntries = computed(() => [...(props.order.audit || [])].slice(-4).reverse())
const auditLabels: Record<string, string> = { created: 'Pedido recibido', payment_confirmed: 'Pago confirmado', status_change: 'Estado actualizado', note_added: 'Nota agregada', user_assigned: 'Usuario asignado', branch_assigned: 'Sucursal asignada' }
function auditText(entry: NonNullable<OrderDTO['audit']>[number]) { return entry.details || (entry.toValue ? orderStatusLabels[entry.toValue as OrderStatus] || entry.toValue : auditLabels[entry.action] || 'Actualización') }
function auditTime(timestamp: string) { return new Date(timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) }
</script>

<template>
  <article
    class="order-card"
    :class="[`is-${status}`, { 'is-fresh': isFresh, 'is-unpaid': payment.tone === 'danger' }]"
    :data-order-id="order._id"
  >
    <button class="order-card__main" type="button" :aria-label="`Abrir ${order.orderNumber}`" @click="emit('open', order._id)">
      <span class="order-card__top">
        <span class="order-card__drag-handle" title="Arrastra a otra columna" aria-label="Arrastrar orden" @click.stop><i class="fa-solid fa-grip-vertical" /></span>
        <strong class="order-card__number">{{ order.orderNumber }}</strong>
        <span v-if="elapsedLabel" class="order-card__timer" :class="`is-${elapsedTone}`" :title="`Hace ${elapsedLabel}`">
          <i class="fa-regular fa-clock" aria-hidden="true" /> {{ elapsedLabel }}
        </span>
      </span>

      <span class="order-card__customer">{{ order.customerName || order.customerEmail || 'Cliente' }}</span>

      <span class="order-card__facts">
        <span class="order-card__mode" :class="isDelivery ? 'is-delivery' : 'is-pickup'">
          <i :class="['fa-solid', isDelivery ? 'fa-motorcycle' : 'fa-store']" aria-hidden="true" /> {{ isDelivery ? 'Delivery' : 'Retiro' }}
        </span>
        <span>{{ getOrderItemCount(order) }} {{ getOrderItemCount(order) === 1 ? 'producto' : 'productos' }}</span>
        <strong>{{ formatOrderCurrency(order.total) }}</strong>
      </span>

      <span class="order-card__pay" :class="`is-${payment.tone}`">
        <i :class="['fa-solid', payment.icon]" aria-hidden="true" /> {{ payment.label }}
        <i v-if="order.billing?.docNumber" class="fa-solid fa-file-invoice order-card__invoice" title="Pide factura" aria-label="Pide factura" />
      </span>

      <span v-if="order.branch?.name" class="order-card__branch"><i class="fa-solid fa-location-dot" aria-hidden="true" /> {{ order.branch.name }}</span>
    </button>

    <div v-if="order.scheduledFor" class="order-card__scheduled">
      <i class="fa-solid fa-calendar-day" aria-hidden="true" />
      <span><strong>Programado</strong> · {{ scheduledLabel }}</span>
    </div>

    <div v-if="isDelivery && hasPickerBooking" class="order-card__delivery" :class="{ 'is-live': picker?.driverName }">
      <span class="order-card__delivery-status"><i :class="['fa-solid', deliveryIcon]" aria-hidden="true" /> {{ deliveryStatus }}</span>
      <span v-if="picker?.driverName" class="order-card__driver">
        <span class="order-card__driver-avatar"><img v-if="picker.driverPhoto" :src="picker.driverPhoto" alt="" /><i v-else class="fa-solid fa-helmet-safety" aria-hidden="true" /></span>
        <span class="order-card__driver-name">{{ picker.driverName }}</span>
      </span>
      <span class="order-card__delivery-links">
        <a v-if="picker?.driverPhone" :href="`tel:${picker.driverPhone}`" aria-label="Llamar al motorizado"><i class="fa-solid fa-phone" /></a>
        <a v-if="picker?.smrURL" :href="picker.smrURL" target="_blank" rel="noopener noreferrer" aria-label="Seguir el delivery"><i class="fa-solid fa-location-crosshairs" /></a>
      </span>
    </div>

    <div class="order-card__footer">
      <button
        v-if="nextStatus && payment.tone !== 'danger'"
        type="button"
        class="order-card__advance"
        :class="{ 'is-finish': finishesPickup }"
        @click="emit('advance', order, nextStatus)"
      >
        <span>{{ advanceLabel }}</span>
        <i :class="['fa-solid', finishesPickup ? 'fa-hand-holding-heart' : 'fa-arrow-right']" aria-hidden="true" />
      </button>
      <p v-else-if="nextStatus && payment.tone === 'danger'" class="order-card__blocked">
        <i class="fa-solid fa-lock" aria-hidden="true" /> No preparar: falta el pago
      </p>

      <div class="order-card__tools">
        <button type="button" title="Agregar nota" aria-label="Agregar nota" @click="emit('note', order)"><i class="fa-solid fa-note-sticky" /></button>
        <button type="button" title="Imprimir ticket" aria-label="Imprimir ticket" @click="emit('print', order)"><i class="fa-solid fa-print" /></button>
        <details v-if="auditEntries.length" class="order-card__history">
          <summary title="Últimos movimientos" aria-label="Últimos movimientos"><i class="fa-solid fa-clock-rotate-left" /></summary>
          <ol>
            <li v-for="entry in auditEntries" :key="`${entry.action}-${entry.timestamp}`">
              <strong>{{ auditLabels[entry.action] || 'Actualización' }}</strong>
              <small>{{ auditText(entry) }} · {{ auditTime(entry.timestamp) }}</small>
            </li>
          </ol>
        </details>
        <!-- Cancelar va aparte y en rojo: la acción que no se deshace no se mezcla con nota o ticket. -->
        <button v-if="showCancel" type="button" class="is-danger" title="Cancelar orden" aria-label="Cancelar orden" @click.stop="emit('cancel', order)"><i class="fa-solid fa-ban" /></button>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.order-card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: 16px;
  box-shadow: var(--admin-shadow);
  color: var(--admin-text);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: box-shadow 0.22s var(--admin-ease), transform 0.22s var(--admin-ease), border-color 0.22s ease;

  // Filo de color del estado: se lee de reojo, sin leer el texto.
  &::before {
    background: var(--st-pending);
    content: '';
    inset: 0 auto 0 0;
    position: absolute;
    width: 4px;
  }

  &:hover { border-color: var(--admin-line-strong); box-shadow: var(--admin-shadow-lg); }

  @each $status in pending, paid, preparing, awaiting_pickup, ready, delivered, cancelled {
    &.is-#{$status}::before { background: var(--st-#{$status}); }
  }

  &.is-delivered, &.is-cancelled { opacity: 0.82; }
  &.is-unpaid { border-color: color-mix(in srgb, var(--admin-danger) 45%, transparent); }

  // Pedido recién llegado: un pulso suave alrededor durante los primeros minutos.
  &.is-fresh { animation: fresh-ring 1.8s var(--admin-ease) 3; }
}

@keyframes fresh-ring {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--admin-yellow) 80%, transparent), var(--admin-shadow); }
  100% { box-shadow: 0 0 0 10px transparent, var(--admin-shadow); }
}

.order-card__main {
  background: transparent;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.8rem 0.85rem 0.7rem 1rem;
  text-align: left;
  width: 100%;

  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: -2px; border-radius: 16px; }
}

.order-card__top { align-items: center; display: flex; gap: 0.45rem; }

.order-card__drag-handle {
  align-items: center;
  border-radius: 8px;
  color: var(--admin-subtle);
  cursor: grab;
  display: flex;
  height: 28px;
  justify-content: center;
  margin-left: -0.35rem;
  touch-action: none;
  width: 22px;

  &:hover { background: var(--admin-hover); color: var(--admin-text); }
}

.order-card__number {
  font-size: 1.12rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: -0.02em;
}

.order-card__timer {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  gap: 0.3rem;
  margin-left: auto;
  padding: 0.22rem 0.55rem;
  white-space: nowrap;

  &.is-ok { background: var(--admin-hover); color: var(--admin-muted); }
  &.is-warn { background: var(--admin-warning-soft); color: var(--admin-warning); }
  &.is-late { background: var(--admin-danger-soft); color: var(--admin-danger); }
}

.order-card__customer {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.order-card__facts {
  align-items: center;
  color: var(--admin-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.8rem;
  gap: 0.35rem 0.6rem;

  strong { color: var(--admin-text); font-size: 0.95rem; font-variant-numeric: tabular-nums; margin-left: auto; }
}

.order-card__mode {
  align-items: center;
  border-radius: 8px;
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 800;
  gap: 0.3rem;
  padding: 0.18rem 0.45rem;

  &.is-delivery { background: var(--admin-info-soft); color: var(--admin-info); }
  &.is-pickup { background: var(--admin-accent-soft); color: var(--admin-accent); }
}

.order-card__pay {
  align-items: center;
  align-self: flex-start;
  border-radius: 8px;
  display: inline-flex;
  font-size: 0.74rem;
  font-weight: 700;
  gap: 0.35rem;
  padding: 0.2rem 0.5rem;

  &.is-ok { background: var(--admin-success-soft); color: var(--admin-success); }
  &.is-cash { background: var(--admin-hover); color: var(--admin-muted); }
  &.is-danger { background: var(--admin-danger-soft); color: var(--admin-danger); font-weight: 800; }
}

.order-card__invoice { margin-left: 0.2rem; opacity: 0.75; }

.order-card__branch { color: var(--admin-subtle); font-size: 0.72rem; }

.order-card__scheduled,
.order-card__delivery {
  align-items: center;
  border-top: 1px solid var(--admin-line);
  display: flex;
  font-size: 0.78rem;
  gap: 0.5rem;
  padding: 0.55rem 0.85rem 0.55rem 1rem;
}

.order-card__scheduled {
  background: var(--admin-warning-soft);
  color: var(--admin-text);

  i { color: var(--admin-warning); }
  strong { color: var(--admin-warning); }
}

.order-card__delivery {
  background: var(--admin-surface-2);
  flex-wrap: wrap;

  &.is-live .order-card__delivery-status { color: var(--admin-success); }
}

.order-card__delivery-status { align-items: center; color: var(--admin-info); display: inline-flex; font-weight: 800; gap: 0.35rem; }

.order-card__driver { align-items: center; display: inline-flex; gap: 0.4rem; min-width: 0; }
.order-card__driver-name { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.order-card__driver-avatar {
  align-items: center;
  background: var(--admin-hover);
  border-radius: 50%;
  color: var(--admin-muted);
  display: flex;
  flex: 0 0 24px;
  font-size: 0.7rem;
  height: 24px;
  justify-content: center;
  overflow: hidden;

  img { height: 100%; object-fit: cover; width: 100%; }
}

.order-card__delivery-links {
  display: flex;
  gap: 0.35rem;
  margin-left: auto;

  a {
    align-items: center;
    background: var(--admin-surface);
    border: 1px solid var(--admin-line);
    border-radius: 10px;
    color: var(--admin-accent);
    display: flex;
    height: 34px;
    justify-content: center;
    width: 34px;

    &:hover { background: var(--admin-accent-soft); }
  }
}

.order-card__footer {
  align-items: center;
  border-top: 1px solid var(--admin-line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.6rem 0.65rem 0.65rem 0.85rem;
}

.order-card__advance {
  align-items: center;
  background: var(--admin-accent);
  border-radius: 12px;
  color: var(--admin-on-accent);
  display: flex;
  flex: 1 1 100%;
  font-size: 0.85rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: space-between;
  min-height: 44px;
  padding: 0.55rem 0.9rem;
  text-align: left;
  transition: filter 0.2s ease, transform 0.12s ease;

  &:hover { filter: brightness(1.08); }
  &:active { transform: scale(0.98); }
  &:focus-visible { outline: 2px solid var(--admin-yellow); outline-offset: 2px; }
  &.is-finish { background: var(--admin-yellow); color: var(--admin-on-yellow); }
}

.order-card__blocked {
  align-items: center;
  background: var(--admin-danger-soft);
  border-radius: 12px;
  color: var(--admin-danger);
  display: flex;
  flex: 1 1 100%;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 0.45rem;
  margin: 0;
  min-height: 44px;
  padding: 0.55rem 0.9rem;
}

.order-card__tools {
  align-items: center;
  display: flex;
  flex: 1 1 100%;
  gap: 0.35rem;

  > button, summary {
    align-items: center;
    background: transparent;
    border: 1px solid var(--admin-line);
    border-radius: 10px;
    color: var(--admin-muted);
    cursor: pointer;
    display: flex;
    height: 40px;
    justify-content: center;
    list-style: none;
    width: 40px;

    &:hover { background: var(--admin-hover); color: var(--admin-text); }
    &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
  }

  summary::-webkit-details-marker { display: none; }

  > .is-danger { margin-left: auto; }
  > .is-danger:hover { background: var(--admin-danger-soft); border-color: transparent; color: var(--admin-danger); }
}

.order-card__history {
  position: static;

  &[open] summary { background: var(--admin-accent-soft); color: var(--admin-accent); }

  ol {
    background: var(--admin-surface-2);
    border: 1px solid var(--admin-line);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
    list-style: none;
    margin: 0.5rem 0 0;
    padding: 0.65rem 0.75rem;
    position: absolute;
    left: 0.85rem;
    right: 0.65rem;
    bottom: 3.6rem;
    box-shadow: var(--admin-shadow-lg);
    z-index: 3;
  }

  li { display: flex; flex-direction: column; }
  strong { font-size: 0.76rem; }
  small { color: var(--admin-muted); font-size: 0.72rem; }
}

:global(.order-card--ghost) { opacity: 0.4; }
:global(.order-card--chosen) { box-shadow: var(--admin-shadow-lg); transform: rotate(1.5deg); }

@media (prefers-reduced-motion: reduce) {
  .order-card, .order-card__advance { transition: none; }
  .order-card.is-fresh { animation: none; box-shadow: 0 0 0 2px var(--admin-yellow), var(--admin-shadow); }
}
</style>
