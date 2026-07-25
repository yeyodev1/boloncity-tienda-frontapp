<script setup lang="ts">
import { useRouter } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import { OrderAuditTrail, OrderDeliveryTracker, OrderDetailHero, OrderInfoGrid } from '@/components/orders/detail'
import { useOrderDetail } from '@/composables/useOrderDetail'

const router = useRouter()
const { order, loading, retrying, statusFlash, showRetryButton, retryPicker } = useOrderDetail()
</script>

<template>
  <div class="detail-page">
    <StoreHeader />
    <main class="detail-page__main">
      <button class="detail-back" @click="router.push('/mis-ordenes')"><i class="fa-solid fa-arrow-left" /> Mis pedidos</button>
      <SkeletonLoader v-if="loading" type="card" :count="3" />
      <template v-else-if="order">
        <OrderDetailHero :order="order" :status-flash="statusFlash" />
        <OrderDeliveryTracker
          v-if="order.deliveryType === 'delivery'"
          :order="order"
          :status-flash="statusFlash"
          :retrying="retrying"
          :show-retry-button="showRetryButton"
          @retry="retryPicker"
        />
        <OrderInfoGrid :order="order" />
        <OrderAuditTrail :order="order" />
      </template>
      <div v-else class="detail-error"><i class="fa-solid fa-circle-exclamation" /> Orden no encontrada.</div>
    </main>
    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.detail-page { background: radial-gradient(circle at 10% 0%, rgba(239, 213, 55, 0.16), transparent 34%), linear-gradient(180deg, #f8f6ec 0%, #f4f4f0 48%, #fff 100%); display: flex; flex-direction: column; min-height: 100vh; overflow-x: hidden; }
.detail-page__main { display: flex; flex: 1 0 auto; flex-direction: column; gap: clamp(0.75rem, 2vw, 1rem); margin: 0 auto; max-width: 900px; padding: calc(60px + clamp(1rem, 3vw, 1.5rem)) 1rem clamp(3rem, 7vw, 6rem); width: 100%; }
.detail-back { align-items: center; align-self: flex-start; background: rgba(35, 89, 49, 0.06); border-radius: 999px; color: #235931; display: inline-flex; font-size: 0.82rem; font-weight: 800; gap: 0.4rem; padding: 0.5rem 0.85rem; transition: background-color 0.2s ease; }
.detail-back:hover { background: rgba(35, 89, 49, 0.12); }
.detail-error { align-items: center; background: rgba(160, 40, 40, 0.06); border: 1px solid rgba(160, 40, 40, 0.12); border-radius: 14px; color: #a02828; display: flex; font-size: 0.9rem; font-weight: 600; gap: 0.5rem; padding: 0.85rem 1rem; }
@media (min-width: 900px) { .detail-page__main { padding-left: 1.5rem; padding-right: 1.5rem; } }
</style>
