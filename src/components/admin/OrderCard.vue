<script setup lang="ts">
import type { OrderDTO } from '@/services/OrderService'
import {
  formatOrderCurrency,
  getNextOrderStatus,
  getOrderItemCount,
  orderStatusShortLabels,
  type OrderStatus,
} from '@/composables/useOrdersBoard'

const props = defineProps<{
  order: OrderDTO
  status: OrderStatus
}>()

const emit = defineEmits<{
  (event: 'open', orderId: string): void
  (event: 'advance', order: OrderDTO, status: OrderStatus): void
  (event: 'note', order: OrderDTO): void
}>()

const nextStatus = getNextOrderStatus(props.status)
</script>

<template>
  <article class="order-card" :data-order-id="order._id">
    <button class="order-card__main" type="button" @click="emit('open', order._id)">
      <div class="order-card__top">
        <span class="order-card__drag-handle" title="Arrastrar orden">⋮⋮</span>
        <strong>{{ order.orderNumber }}</strong>
        <span class="status-pill">{{ orderStatusShortLabels[status] }}</span>
      </div>

      <p class="order-card__customer">{{ order.customerName || order.customerEmail }}</p>

      <div class="order-card__meta">
        <span>{{ formatOrderCurrency(order.total) }}</span>
        <span>{{ getOrderItemCount(order) }} items</span>
        <span>{{ order.branch?.name || 'Sin sucursal' }}</span>
      </div>

      <div class="order-card__payment" :class="order.payphone?.transactionId ? 'ok' : 'muted'">
        <span>{{ order.payphone?.transactionId ? `Pago ${order.payphone.transactionId}` : 'Pago pendiente' }}</span>
      </div>
    </button>

    <div class="order-card__actions">
      <button type="button" class="ghost" @click="emit('open', order._id)">Ver detalle</button>
      <button type="button" class="ghost" @click="emit('note', order)">Nota</button>
      <button v-if="nextStatus" type="button" @click="emit('advance', order, nextStatus)">
        {{ `Mover: ${orderStatusShortLabels[nextStatus]}` }}
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
.order-card {
  background: #fbf8ef;
  border: 1px solid rgba(8, 17, 13, 0.08);
  border-radius: 20px;
  color: #18211b;
  overflow: hidden;
}

.order-card__main {
  background: transparent;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  text-align: left;
  width: 100%;
}

.order-card__top {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.order-card__top strong {
  flex: 1 1 auto;
  min-width: 0;
}

.order-card__drag-handle {
  color: rgba(24, 33, 27, 0.42);
  cursor: grab;
  font-weight: 900;
  letter-spacing: -0.25em;
  line-height: 1;
}

.order-card__top strong {
  font-size: 1.02rem;
  font-weight: 800;
}

.status-pill {
  background: rgba(35, 89, 49, 0.1);
  border: 1px solid rgba(35, 89, 49, 0.16);
  border-radius: 999px;
  color: #235931;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.32rem 0.6rem;
  text-transform: uppercase;
}

.order-card__customer {
  color: #18211b;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.order-card__meta {
  color: rgba(24, 33, 27, 0.66);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.82rem;
}

.order-card__meta span {
  background: rgba(35, 89, 49, 0.07);
  border-radius: 999px;
  padding: 0.35rem 0.6rem;
}

.order-card__payment {
  border-radius: 14px;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.75rem;
}

.order-card__payment.ok {
  background: rgba(35, 89, 49, 0.12);
  color: #235931;
}

.order-card__payment.muted {
  background: rgba(8, 17, 13, 0.05);
  color: rgba(24, 33, 27, 0.66);
}

.order-card__actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0 1rem 1rem;
}

.order-card__actions button {
  align-items: center;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  font-weight: 800;
  justify-content: center;
  min-height: 46px;
  padding: 0.85rem 1.1rem;
}

.order-card__actions button:not(.ghost) {
  background: #235931;
  color: $white;
}

.order-card__actions .ghost {
  background: #fff;
  color: #18211b;
}

@media (min-width: 769px) {
  .order-card__actions {
    flex-direction: row;
  }

  .order-card__actions button {
    flex: 1 1 0;
  }
}
</style>
