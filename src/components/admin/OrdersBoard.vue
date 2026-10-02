<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import OrderColumn from '@/components/admin/OrderColumn.vue'
import type { OrderDTO } from '@/services/OrderService'
import { orderStatusIcons, orderStatusShortLabels, type OrderStatus } from '@/composables/useOrdersBoard'

/**
 * Tablero de órdenes compartido por "Órdenes" (administración) y "Mi operación" (sucursal).
 * Escritorio: todas las columnas lado a lado. Celular/tablet: pestañas por estado y una columna
 * a la vez (arrastrar entre columnas no sirve con el dedo; el botón "Pasar a…" sí).
 */
const props = defineProps<{
  statuses: readonly OrderStatus[]
  grouped: Record<OrderStatus, OrderDTO[]>
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

// En el celular se abre en la primera etapa que tiene trabajo pendiente.
const ACTION_ORDER: OrderStatus[] = ['pending', 'paid', 'preparing', 'awaiting_pickup', 'ready']
const firstWithWork = (): OrderStatus => ACTION_ORDER.find((status) => props.statuses.includes(status) && props.grouped[status]?.length) || props.statuses[0] || 'pending'
const current = ref<OrderStatus>(firstWithWork())
const touched = ref(false)

watch(
  () => props.statuses.map((status) => props.grouped[status]?.length || 0).join(','),
  () => {
    if (!props.statuses.includes(current.value) || (!touched.value && !props.grouped[current.value]?.length)) current.value = firstWithWork()
  },
)

function select(status: OrderStatus) {
  current.value = status
  touched.value = true
}

const tabs = computed(() => props.statuses.map((status) => ({ status, count: props.grouped[status]?.length || 0 })))
</script>

<template>
  <div class="orders-board">
    <nav class="orders-board__tabs" aria-label="Etapas del pedido">
      <button
        v-for="tab in tabs"
        :key="tab.status"
        type="button"
        :class="[`is-${tab.status}`, { active: current === tab.status, 'has-work': tab.count > 0 }]"
        :aria-pressed="current === tab.status"
        @click="select(tab.status)"
      >
        <i :class="['fa-solid', orderStatusIcons[tab.status]]" aria-hidden="true" />
        <span>{{ orderStatusShortLabels[tab.status] }}</span>
        <b>{{ tab.count }}</b>
      </button>
    </nav>

    <div class="orders-board__columns">
      <OrderColumn
        v-for="status in statuses"
        :key="status"
        :class="{ 'is-current': current === status }"
        :status="status"
        :orders="grouped[status]"
        :driver-loading-id="driverLoadingId"
        :can-cancel="canCancel"
        @open="emit('open', $event)"
        @note="emit('note', $event)"
        @advance="(order, next) => emit('advance', order, next)"
        @drop="(orderId, next) => emit('drop', orderId, next)"
        @driver="emit('driver', $event)"
        @print="emit('print', $event)"
        @cancel="emit('cancel', $event)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.orders-board { display: flex; flex-direction: column; gap: 0.75rem; min-width: 0; }

.orders-board__tabs {
  background: var(--admin-bg);
  display: flex;
  gap: 0.4rem;
  margin: 0 -0.25rem;
  overflow-x: auto;
  padding: 0.25rem;
  position: sticky;
  scrollbar-width: none;
  top: 4.6rem;
  z-index: 5;

  &::-webkit-scrollbar { display: none; }

  button {
    align-items: center;
    background: var(--admin-surface);
    border: 1px solid var(--admin-line);
    border-radius: 999px;
    color: var(--admin-muted);
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 0.8rem;
    font-weight: 700;
    gap: 0.4rem;
    min-height: 44px;
    padding: 0.4rem 0.5rem 0.4rem 0.8rem;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;

    b {
      background: var(--admin-hover);
      border-radius: 999px;
      color: var(--admin-subtle);
      font-size: 0.74rem;
      font-variant-numeric: tabular-nums;
      min-width: 1.6rem;
      padding: 0.12rem 0.45rem;
      text-align: center;
    }

    @each $status in pending, paid, preparing, awaiting_pickup, ready, delivered, cancelled {
      &.is-#{$status}.has-work b { background: var(--st-#{$status}-soft); color: var(--st-#{$status}); }
      &.is-#{$status}.active { background: var(--st-#{$status}); border-color: transparent; color: var(--admin-surface); }
      &.is-#{$status}.active b { background: color-mix(in srgb, var(--admin-surface) 25%, transparent); color: var(--admin-surface); }
    }

    &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
  }
}

.orders-board__columns { align-items: stretch; display: flex; gap: 0.75rem; min-width: 0; }
.orders-board__columns > :deep(.column) { flex: 1 1 100%; }
.orders-board__columns > :deep(.column:not(.is-current)) { display: none; }

@media (min-width: 1100px) {
  .orders-board__tabs { display: none; }
  .orders-board__columns { overflow-x: auto; padding-bottom: 0.5rem; scroll-snap-type: x proximity; }
  .orders-board__columns > :deep(.column),
  .orders-board__columns > :deep(.column:not(.is-current)) { display: flex; flex: 1 0 270px; max-width: 360px; scroll-snap-align: start; }
}
</style>
