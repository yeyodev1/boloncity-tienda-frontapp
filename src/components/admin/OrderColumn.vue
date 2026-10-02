<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import OrderCard from '@/components/admin/OrderCard.vue'
import type { OrderDTO } from '@/services/OrderService'
import {
  orderStatusDescriptions,
  orderStatusIcons,
  orderStatusLabels,
  type OrderStatus,
} from '@/composables/useOrdersBoard'

const props = defineProps<{
  status: OrderStatus
  orders: OrderDTO[]
  driverLoadingId?: string
  canCancel?: boolean
}>()

const emit = defineEmits<{
  (event: 'open', orderId: string): void
  (event: 'advance', order: OrderDTO, status: OrderStatus): void
  (event: 'note', order: OrderDTO): void
  (event: 'drop', orderId: string, status: OrderStatus): void
  (event: 'driver', order: OrderDTO): void
  (event: 'print', order: OrderDTO): void
  (event: 'cancel', order: OrderDTO): void
}>()

function onAdd(event: { item?: HTMLElement }) {
  const orderId = (event.item as HTMLElement | null)?.dataset.orderId
  if (orderId) {
    emit('drop', orderId, props.status)
  }
}

function emitAdvance(order: OrderDTO, status: OrderStatus) {
  emit('advance', order, status)
}

</script>

<template>
  <section class="column" :class="`is-${status}`" :aria-label="`${orderStatusLabels[status]}: ${orders.length}`">
    <header class="column__header">
      <span class="column__icon" aria-hidden="true"><i :class="['fa-solid', orderStatusIcons[status]]" /></span>
      <span class="column__title">
        <strong>{{ orderStatusLabels[status] }}</strong>
        <small>{{ orderStatusDescriptions[status] }}</small>
      </span>
      <Transition name="count" mode="out-in">
        <span :key="orders.length" class="column__count" :class="{ 'is-empty': !orders.length }">{{ orders.length }}</span>
      </Transition>
    </header>

    <VueDraggable
      class="column__body"
      :model-value="orders"
      :group="{ name: 'orders' }"
      :animation="180"
      :force-fallback="true"
      :fallback-on-body="true"
      :delay-on-touch-only="true"
      :touch-start-threshold="5"
      handle=".order-card__drag-handle"
      ghost-class="order-card--ghost"
      chosen-class="order-card--chosen"
      @add="onAdd"
    >
      <OrderCard
        v-for="order in orders"
        :key="order._id"
        :order="order"
        :status="status"
        :driver-loading="driverLoadingId === order._id"
        :can-cancel="canCancel"
        @open="emit('open', $event)"
        @advance="emitAdvance"
        @note="emit('note', $event)"
        @driver="emit('driver', $event)"
        @print="emit('print', $event)"
        @cancel="emit('cancel', $event)"
      />
    </VueDraggable>
    <p v-if="!orders.length" class="column__empty">Nada por aquí</p>
  </section>
</template>

<style scoped lang="scss">
.column {
  background: var(--admin-surface-2);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius);
  color: var(--admin-text);
  display: flex;
  flex-direction: column;
  min-height: 220px;
  position: relative;
  --tone: var(--st-pending);
  --tone-soft: var(--st-pending-soft);

  @each $status in pending, paid, preparing, awaiting_pickup, ready, delivered, cancelled {
    &.is-#{$status} { --tone: var(--st-#{$status}); --tone-soft: var(--st-#{$status}-soft); }
  }
}

.column__header {
  align-items: center;
  background: var(--admin-surface-2);
  border-bottom: 1px solid var(--admin-line);
  border-radius: var(--admin-radius) var(--admin-radius) 0 0;
  display: flex;
  gap: 0.6rem;
  padding: 0.8rem 0.85rem;
  position: sticky;
  top: 0;
  z-index: 2;

  // Banda superior con el color del estado.
  &::before {
    background: var(--tone);
    border-radius: var(--admin-radius) var(--admin-radius) 0 0;
    content: '';
    height: 3px;
    inset: 0 0 auto;
    position: absolute;
  }
}

.column__icon {
  align-items: center;
  background: var(--tone-soft);
  border-radius: 10px;
  color: var(--tone);
  display: flex;
  flex: 0 0 34px;
  font-size: 0.85rem;
  height: 34px;
  justify-content: center;
}

.column__title {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;

  strong { font-size: 0.92rem; letter-spacing: -0.01em; }
  small { color: var(--admin-muted); font-size: 0.72rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.column__count {
  background: var(--tone);
  border-radius: 999px;
  color: var(--admin-surface);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  min-width: 2rem;
  padding: 0.2rem 0.55rem;
  text-align: center;

  &.is-empty { background: var(--admin-hover); color: var(--admin-subtle); }
}

.column__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.65rem;
  min-height: 140px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 0.7rem;
  scrollbar-width: thin;
}

// Las tarjetas no se encogen para caber: la columna hace scroll.
.column__body > :deep(*) { flex-shrink: 0; }

.column__empty {
  color: var(--admin-subtle);
  font-size: 0.8rem;
  inset: 5rem 0 auto;
  margin: 0;
  pointer-events: none;
  position: absolute;
  text-align: center;
}

.count-enter-active, .count-leave-active { transition: transform 0.25s var(--admin-ease), opacity 0.2s ease; }
.count-enter-from { opacity: 0; transform: translateY(-6px) scale(0.8); }
.count-leave-to { opacity: 0; transform: translateY(6px) scale(0.8); }

/* Escritorio: cada columna con su propio scroll; en el celular scrollea la página. */
@media (min-width: 1100px) {
  .column { max-height: calc(100vh - 11rem); }
}

@media (prefers-reduced-motion: reduce) {
  .count-enter-active, .count-leave-active { transition: none; }
}
</style>
