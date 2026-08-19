<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import { useToast } from '@/composables/useToast'
import AdminOrderDeliveryPanel from '@/components/admin/AdminOrderDeliveryPanel.vue'
import AdminOrderRefundPanel from '@/components/admin/AdminOrderRefundPanel.vue'
import OrderDetailHero from '@/components/admin/order-detail/OrderDetailHero.vue'
import OrderItemsCard from '@/components/admin/order-detail/OrderItemsCard.vue'
import OrderBillingCard from '@/components/admin/order-detail/OrderBillingCard.vue'
import OrderAuditCard from '@/components/admin/order-detail/OrderAuditCard.vue'
import { printOrderTicket } from '@/utils/printOrderTicket'

const route = useRoute()
const order = ref<OrderDTO | null>(null)
const loading = ref(true)
const startingSearch = ref(false)
const retryingPicker = ref(false)
const { success, error } = useToast()

const canRetryPicker = computed(() => Boolean(order.value && order.value.deliveryType === 'delivery' && !order.value.picker?.bookingId && order.value.status !== 'pending' && order.value.status !== 'cancelled'))

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

const scheduledLabel = computed(() =>
  order.value?.scheduledFor
    ? new Date(order.value.scheduledFor).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' })
    : ''
)

async function startDriverSearch() {
  if (!order.value) return
  try {
    startingSearch.value = true
    order.value = (await OrderService.startPickerSearch(order.value._id)).data.order
    success('Búsqueda de conductor iniciada')
  } catch {
    error('No se pudo iniciar la búsqueda de conductor')
  } finally {
    startingSearch.value = false
  }
}

async function retryPicker() {
  if (!order.value) return
  try {
    retryingPicker.value = true
    order.value = (await OrderService.retryPicker(order.value._id)).data.order
    success('Delivery solicitado a Picker.')
  } catch (requestError: any) {
    error(requestError?.message || 'No se pudo solicitar el delivery.')
  } finally {
    retryingPicker.value = false
  }
}

onMounted(async () => {
  const response = await OrderService.getById(String(route.params.id))
  order.value = response.data
  loading.value = false
})
</script>

<template>
  <AdminLayout>
    <section class="order-detail">
      <SkeletonLoader v-if="loading" type="card" :count="2" />

      <template v-else-if="order">
        <OrderDetailHero
          :order="order"
          :can-retry="canRetryPicker"
          :retrying="retryingPicker"
          @retry="retryPicker"
          @print="printOrderTicket(order)"
        />

        <div class="order-detail__tiles">
          <div class="tile tile--green"><span><i class="fa-solid fa-sack-dollar" /> Total cobrado</span><strong>{{ formatCurrency(order.total) }}</strong></div>
          <div class="tile" :class="order.deliveryType === 'delivery' ? 'tile--blue' : 'tile--yellow'">
            <span><i :class="order.deliveryType === 'delivery' ? 'fa-solid fa-motorcycle' : 'fa-solid fa-bag-shopping'" /> Tipo</span>
            <strong>{{ order.deliveryType === 'delivery' ? 'Delivery' : 'Retiro en sucursal' }}</strong>
          </div>
          <div class="tile"><span><i class="fa-solid fa-store" /> Sucursal</span><strong>{{ order.branch?.name || 'Sin sucursal' }}</strong></div>
          <div class="tile"><span><i class="fa-solid fa-phone" /> Teléfono</span><strong>{{ order.customerPhone || 'No registrado' }}</strong></div>
          <div class="tile tile--wide"><span><i class="fa-solid fa-envelope" /> Email</span><strong>{{ order.customerEmail }}</strong></div>
          <div v-if="order.deliveryType === 'delivery' && order.deliveryAddress" class="tile tile--wide tile--blue">
            <span><i class="fa-solid fa-location-dot" /> Dirección de entrega</span><strong>{{ order.deliveryAddress }}</strong>
          </div>
          <div v-if="order.scheduledFor" class="tile tile--wide tile--yellow">
            <span><i class="fa-solid fa-calendar-check" /> Programado para</span>
            <strong>{{ scheduledLabel }}</strong>
            <button
              v-if="order.picker?.searchState === 'on_hold' || order.picker?.searchState === 'failed'"
              type="button" class="tile__cta" :disabled="startingSearch" @click="startDriverSearch"
            >
              <i class="fa-solid fa-motorcycle" /> {{ startingSearch ? 'Buscando…' : 'Buscar conductor' }}
            </button>
            <small v-else-if="order.deliveryType === 'delivery'">{{ order.picker?.searchState === 'started' ? 'Búsqueda de motorizado iniciada' : 'El motorizado se pide al pasar a «Por recoger»' }}</small>
            <small v-if="order.picker?.searchError" class="tile__error"><i class="fa-solid fa-circle-exclamation" /> {{ order.picker.searchError }}</small>
          </div>
        </div>

        <div class="order-detail__grid">
          <AdminOrderRefundPanel :order="order" @refunded="order = $event" />
          <AdminOrderDeliveryPanel :order="order" />
          <OrderItemsCard :order="order" />
          <OrderBillingCard :order="order" />
          <OrderAuditCard :order="order" />
        </div>
      </template>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
.order-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.order-detail__tiles { display: flex; flex-wrap: wrap; gap: 0.6rem; }

.tile {
  background: #fff;
  border: 1px solid rgba($text-dark, 0.08);
  border-radius: 16px;
  display: flex;
  flex: 1 1 45%;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
  padding: 0.85rem 1rem;
}

.tile span { align-items: center; color: rgba($text-dark, 0.55); display: flex; font-size: 0.68rem; font-weight: 900; gap: 0.4rem; letter-spacing: 0.1em; text-transform: uppercase; }
.tile span i { font-size: 0.78rem; }
.tile strong { font-size: 1.02rem; font-weight: 800; overflow-wrap: anywhere; }
.tile small { color: rgba($text-dark, 0.6); font-size: 0.8rem; }
.tile--wide { flex: 1 1 100%; }

.tile--green { background: rgba(35, 89, 49, 0.08); border-color: rgba(35, 89, 49, 0.22); }
.tile--green span,
.tile--green strong { color: #235931; }
.tile--green strong { font-size: 1.35rem; }

.tile--yellow { background: #fffbe8; border-color: rgba(239, 213, 55, 0.55); }
.tile--yellow span { color: #6a4e05; }

.tile--blue { background: rgba(0, 102, 204, 0.06); border-color: rgba(0, 102, 204, 0.2); }
.tile--blue span { color: #0066cc; }

.tile__cta {
  align-items: center;
  align-self: flex-start;
  background: #235931;
  border: 0;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  display: flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 0.5rem;
  margin-top: 0.35rem;
  min-height: 42px;
  padding: 0.55rem 1.1rem;
}

.tile__cta:disabled { cursor: wait; opacity: 0.65; }
.tile__error { align-items: center; color: #a52323 !important; display: flex; font-weight: 700; gap: 0.4rem; }

.order-detail__grid { display: flex; flex-wrap: wrap; gap: 1rem; }
.order-detail__grid > :deep(*) { flex: 1 1 420px; min-width: 0; }

@media (min-width: 1100px) {
  .tile { flex: 1 1 180px; }
  .tile--wide { flex: 1 1 32%; }
}
</style>
