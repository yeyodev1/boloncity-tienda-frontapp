<script setup lang="ts">
import type { OrderDTO } from '@/services/OrderService'
import { STATUS_ICONS, STATUS_LABELS } from './constants'

defineProps<{ order: OrderDTO; statusFlash: boolean }>()

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <section class="detail-hero">
    <div class="detail-hero__copy">
      <p class="detail-hero__eyebrow">{{ order.orderNumber }}</p>
      <h1>${{ (order.total / 100).toFixed(2) }}</h1>
      <div class="detail-hero__meta">
        <span class="detail-hero__date">{{ formatDate(order.createdAt || '') }}</span>
        <span class="detail-hero__type" :class="order.deliveryType">
          {{ order.deliveryType === 'delivery' ? 'Delivery' : 'Recoger' }}
        </span>
      </div>
    </div>
    <span class="detail-hero__status" :class="[order.status, { flash: statusFlash }]">
      <i :class="['fa-solid', STATUS_ICONS[order.status] || 'fa-circle-info']" />
      {{ STATUS_LABELS[order.status] || order.status }}
    </span>
  </section>
</template>

<style scoped lang="scss">
.detail-hero { background: radial-gradient(circle at 92% 8%, rgba(239, 213, 55, 0.2), transparent 24%), linear-gradient(135deg, #235931, #102719 72%); border-radius: 24px; box-shadow: 0 22px 50px rgba(35, 89, 49, 0.18); color: #fff; display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; overflow: hidden; padding: clamp(1.25rem, 4vw, 2rem); position: relative; }
.detail-hero::before { background: rgba(239, 213, 55, 0.08); border-radius: 50%; content: ''; height: 200px; pointer-events: none; position: absolute; right: -10%; top: -40%; width: 200px; }
.detail-hero__copy { display: flex; flex-direction: column; gap: 0.35rem; position: relative; z-index: 1; }
.detail-hero__eyebrow { color: #efd537; font-size: 0.78rem; font-weight: 900; letter-spacing: 0.12em; text-transform: uppercase; }
.detail-hero h1 { font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
.detail-hero__meta { align-items: center; display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.15rem; }
.detail-hero__date { color: rgba(255, 255, 255, 0.6); font-size: 0.82rem; }
.detail-hero__type { background: rgba(255, 255, 255, 0.1); border-radius: 999px; color: rgba(255, 255, 255, 0.8); font-size: 0.68rem; font-weight: 800; padding: 0.2rem 0.5rem; text-transform: capitalize; }
.detail-hero__type.pickup { background: rgba(239, 213, 55, 0.15); color: #efd537; }
.detail-hero__status { background: rgba(255, 255, 255, 0.12); border-radius: 999px; color: #fff; flex: 0 0 auto; font-size: 0.78rem; font-weight: 800; padding: 0.45rem 0.85rem; position: relative; text-transform: capitalize; transition: all 0.3s ease; white-space: nowrap; z-index: 1; }
.detail-hero__status i { margin-right: 0.3rem; }
.detail-hero__status.flash { background: #efd537; color: #102719; transform: scale(1.05); }
.detail-hero__status.cancelled { background: rgba(160, 40, 40, 0.25); color: #ffcfcf; }
.detail-hero__status.delivered { background: rgba(0, 165, 35, 0.2); color: #b8f0c5; }
@media (min-width: 600px) { .detail-hero { align-items: center; } }
</style>
