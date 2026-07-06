<script setup lang="ts">
import { VueDraggable } from 'vue-draggable-plus'
import OrderCard from '@/components/admin/OrderCard.vue'
import type { OrderDTO } from '@/services/OrderService'
import {
  orderStatusDescriptions,
  orderStatusLabels,
  orderStatusTones,
  type OrderStatus,
} from '@/composables/useOrdersBoard'

const props = defineProps<{
  status: OrderStatus
  orders: OrderDTO[]
}>()

const emit = defineEmits<{
  (event: 'open', orderId: string): void
  (event: 'advance', order: OrderDTO, status: OrderStatus): void
  (event: 'note', order: OrderDTO): void
  (event: 'drop', orderId: string, status: OrderStatus): void
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
  <section class="column panel" :class="orderStatusTones[status]">
    <header class="column__header">
      <div>
        <p>{{ orderStatusLabels[status] }}</p>
        <small>{{ orderStatusDescriptions[status] }}</small>
      </div>
      <strong>{{ orders.length }}</strong>
    </header>

    <VueDraggable
      class="column__body"
      :model-value="orders"
      :group="{ name: 'orders' }"
      :animation="180"
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
        @open="emit('open', $event)"
        @advance="emitAdvance"
        @note="emit('note', $event)"
      />
    </VueDraggable>
  </section>
</template>

<style scoped lang="scss">
.column {
  background: #fff;
  border-color: rgba(8, 17, 13, 0.08);
  color: #18211b;
  min-height: 460px;
  padding: 1rem;
}

.column__header {
  align-items: start;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.column__header p {
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.column__header small {
  color: rgba(24, 33, 27, 0.56);
  display: block;
  line-height: 1.4;
  margin-top: 0.25rem;
}

.column__header strong {
  color: #235931;
  font-size: 1.2rem;
}

.column__body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 220px;
}

.tone--amber {
  background: linear-gradient(180deg, rgba(239, 213, 55, 0.18), #fff 44%);
}

.tone--blue {
  background: linear-gradient(180deg, rgba(27, 77, 126, 0.12), #fff 44%);
}

.tone--green {
  background: linear-gradient(180deg, rgba(35, 89, 49, 0.12), #fff 44%);
}

.tone--violet {
  background: linear-gradient(180deg, rgba(90, 52, 139, 0.12), #fff 44%);
}

.tone--neutral {
  background: linear-gradient(180deg, rgba(24, 33, 27, 0.08), #fff 44%);
}

.tone--red {
  background: linear-gradient(180deg, rgba(126, 33, 33, 0.12), #fff 44%);
}

:deep(.order-card--ghost) {
  opacity: 0.45;
}

:deep(.order-card--chosen) {
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.32);
}

.column {
  scroll-snap-align: start;
}
</style>
