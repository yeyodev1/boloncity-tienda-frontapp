<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
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
const loadError = ref(false)
const startingSearch = ref(false)
const retryingPicker = ref(false)
const { success, error } = useToast()

const canRetryPicker = computed(() => Boolean(order.value && order.value.deliveryType === 'delivery' && !order.value.picker?.bookingId && order.value.status !== 'pending' && order.value.status !== 'cancelled'))

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
  try {
    order.value = (await OrderService.getById(String(route.params.id))).data
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AdminLayout>
    <section class="od">
      <RouterLink to="/admin/ordenes" class="od__back"><i class="fa-solid fa-arrow-left" aria-hidden="true" /> Órdenes</RouterLink>

      <SkeletonLoader v-if="loading" type="card" :count="2" />

      <div v-else-if="loadError || !order" class="od__empty">
        <i class="fa-solid fa-receipt" aria-hidden="true" />
        <strong>No encontramos este pedido</strong>
        <span>Puede que sea de otra sucursal o que el enlace esté incompleto.</span>
      </div>

      <template v-else>
        <OrderDetailHero
          :order="order"
          :can-retry="canRetryPicker"
          :retrying="retryingPicker"
          @retry="retryPicker"
          @print="printOrderTicket(order)"
        />

        <div class="od__layout">
          <div class="od__story">
            <OrderAuditCard :order="order" />
          </div>
          <div class="od__side">
            <AdminOrderRefundPanel :order="order" @refunded="order = $event" />
            <AdminOrderDeliveryPanel :order="order" :starting-search="startingSearch" @start-search="startDriverSearch" />
            <OrderItemsCard :order="order" />
            <OrderBillingCard :order="order" />
            <p v-if="order.notes" class="od__notes"><i class="fa-solid fa-note-sticky" aria-hidden="true" /> <span><b>Nota del cliente:</b> {{ order.notes }}</span></p>
          </div>
        </div>
      </template>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
.od {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin: 0 auto;
  max-width: 1180px;
  width: 100%;
}

.od__back {
  align-items: center;
  align-self: flex-start;
  border-radius: 999px;
  color: var(--admin-muted);
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 0.45rem;
  padding: 0.35rem 0.6rem 0.35rem 0.2rem;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover { color: var(--admin-text); }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
}

.od__layout { display: flex; flex-direction: column; gap: 0.9rem; }
.od__story { display: flex; flex-direction: column; min-width: 0; }
// En el celular primero va lo accionable (pago, entrega, productos) y después la historia.
.od__side { display: flex; flex-direction: column; gap: 0.9rem; min-width: 0; order: -1; }

.od__notes {
  align-items: flex-start;
  background: var(--admin-warning-soft);
  border-radius: 14px;
  color: var(--admin-text);
  display: flex;
  font-size: 0.84rem;
  gap: 0.55rem;
  line-height: 1.45;
  margin: 0;
  padding: 0.8rem 0.9rem;

  i { color: var(--admin-warning); margin-top: 0.15rem; }
}

.od__empty {
  align-items: center;
  background: var(--admin-surface);
  border: 1px dashed var(--admin-line-strong);
  border-radius: 20px;
  color: var(--admin-muted);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 3rem 1rem;
  text-align: center;

  i { color: var(--admin-subtle); font-size: 1.6rem; }
  strong { color: var(--admin-text); }
}

@media (min-width: 1000px) {
  .od__layout { align-items: flex-start; flex-direction: row; }
  .od__story { flex: 1 1 0; }
  .od__side { flex: 0 0 400px; order: 0; }
}
</style>
