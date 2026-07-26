<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import { useToast } from '@/composables/useToast'
import AdminOrderDeliveryPanel from '@/components/admin/AdminOrderDeliveryPanel.vue'
import { printOrderTicket } from '@/utils/printOrderTicket'

const route = useRoute()
const order = ref<OrderDTO | null>(null)
const loading = ref(true)
const startingSearch = ref(false)
const { success, error } = useToast()

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  preparing: 'En preparación',
  awaiting_pickup: 'Esperando recolección',
  ready: 'En entrega',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
}

const statusTones: Record<string, string> = {
  pending: 'tone--amber',
  paid: 'tone--blue',
  preparing: 'tone--green',
  awaiting_pickup: 'tone--violet',
  ready: 'tone--blue',
  delivered: 'tone--neutral',
  cancelled: 'tone--red',
}
const statusIcons: Record<string, string> = { pending:'fa-clock', paid:'fa-credit-card', preparing:'fa-kitchen-set', awaiting_pickup:'fa-motorcycle', ready:'fa-truck-fast', delivered:'fa-circle-check', cancelled:'fa-ban' }
const auditLabels: Record<string, string> = { created:'Pedido recibido', payment_confirmed:'Pago confirmado', status_change:'Estado actualizado', note_added:'Nota agregada', user_assigned:'Usuario asignado', branch_assigned:'Sucursal asignada' }

const itemCount = computed(() => order.value?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0)

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount / 100)
}

async function startDriverSearch() { if (!order.value) return; try { startingSearch.value = true; order.value = (await OrderService.startPickerSearch(order.value._id)).data.order; success('Búsqueda de conductor iniciada') } catch { error('No se pudo iniciar la búsqueda de conductor') } finally { startingSearch.value = false } }

onMounted(async () => {
  const response = await OrderService.getById(String(route.params.id))
  order.value = response.data
  loading.value = false
})
</script>

<template>
  <AdminLayout>
    <section class="admin-order-detail">
      <header class="admin-order-detail__hero panel" v-if="order">
        <div>
          <p class="admin-order-detail__eyebrow">Orden</p>
          <h1>{{ order.orderNumber }}</h1>
          <p>{{ order.customerName || order.customerEmail }}</p>
        </div>

        <div class="hero-actions"><div class="admin-order-detail__status" :class="statusTones[order.status]"><i :class="['fa-solid', statusIcons[order.status] || 'fa-circle-info']" /> <span>{{ statusLabels[order.status] || order.status }}</span></div><button type="button" class="print-ticket" @click="printOrderTicket(order)"><i class="fa-solid fa-print" /> IMPRIMIR TICKET</button></div>
      </header>

      <SkeletonLoader v-if="loading" type="card" :count="2" />

      <div v-else-if="order" class="admin-order-detail__grid">
        <article class="panel summary-card">
          <div class="summary-card__top">
            <div>
              <span>Cliente</span>
              <strong>{{ order.customerName || 'Sin nombre' }}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{{ order.customerEmail }}</strong>
            </div>
          </div>

          <div class="summary-card__grid">
            <div>
              <span>Total</span>
              <strong>{{ formatCurrency(order.total) }}</strong>
            </div>
            <div>
              <span>Items</span>
              <strong>{{ itemCount }}</strong>
            </div>
            <div>
              <span>Sucursal</span>
              <strong>{{ order.branch?.name || 'Sin sucursal' }}</strong>
            </div>
            <div>
              <span>Teléfono</span>
              <strong>{{ order.customerPhone || 'No registrado' }}</strong>
            </div>
          </div>
        </article>

        <AdminOrderDeliveryPanel :order="order" />

        <article v-if="order.scheduledFor" class="panel summary-card"><div class="section-head"><div><p class="section-head__eyebrow">Pedido programado</p><h2>{{ new Date(order.scheduledFor).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }) }}</h2></div><button v-if="order.picker?.searchState === 'on_hold' || order.picker?.searchState === 'failed'" type="button" :disabled="startingSearch" @click="startDriverSearch"><i class="fa-solid fa-motorcycle" /> {{ startingSearch ? 'Buscando...' : 'Buscar conductor' }}</button><span v-else>{{ order.picker?.searchState === 'started' ? 'Búsqueda iniciada' : 'En espera' }}</span></div><p v-if="order.picker?.searchError">{{ order.picker.searchError }}</p></article>

        <article class="panel items-card">
          <div class="section-head">
            <div>
              <p class="section-head__eyebrow">Contenido</p>
              <h2>Productos</h2>
            </div>
            <strong>{{ formatCurrency(order.subtotal) }}</strong>
          </div>

          <div class="item-list">
            <article v-for="item in order.items || []" :key="`${item.name}-${item.quantity}`" class="item-row">
            <div class="item-row__info">
              <img v-if="item.image" :src="item.image" :alt="item.name" />
              <i v-else class="fa-solid fa-utensils" />
              <div>
                <strong>{{ item.name }}</strong>
                <p>Cantidad: {{ item.quantity }}</p>
              </div>
            </div>
              <span>{{ formatCurrency(item.price * item.quantity) }}</span>
            </article>
          </div>
        </article>

        <article class="panel audit-card">
          <div class="section-head">
            <div>
              <p class="section-head__eyebrow">Trazabilidad</p>
              <h2>Auditoría</h2>
            </div>
          </div>

          <div v-if="order.audit?.length" class="audit">
            <div v-for="entry in order.audit || []" :key="`${entry.action}-${entry.timestamp}`" class="audit-item">
              <div class="audit-item__head">
                <strong>{{ auditLabels[entry.action] || 'Actualización' }}</strong>
                <small>{{ entry.performedByEmail || 'system' }}</small>
              </div>
              <p v-if="entry.fromValue || entry.toValue">{{ entry.fromValue || '—' }} → {{ entry.toValue || '—' }}</p>
              <p v-if="entry.details">{{ entry.details }}</p>
            </div>
          </div>
          <p v-else class="empty-state">Sin auditoría registrada.</p>
        </article>
      </div>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-order-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.admin-order-detail__hero {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
}

.admin-order-detail__eyebrow {
  color: $primary-dark;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.admin-order-detail__hero h1 {
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.95;
  margin-top: 0.35rem;
}

.admin-order-detail__hero p {
  color: var(--admin-muted);
  margin-top: 0.75rem;
}

.admin-order-detail__status {
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  padding: 0.75rem 1rem;
  text-transform: uppercase;
}

.hero-actions { align-items:stretch; display:flex; flex-wrap:wrap; gap:.6rem; }.hero-actions > * { flex:1 1 170px; }.admin-order-detail__status { align-items:center; display:flex; justify-content:center; gap:.4rem; }.print-ticket { align-items:center; background:linear-gradient(135deg,#efd537,#f7e36a); border:0; border-radius:12px; box-shadow:0 5px 0 #b89e12; color:#18211b; cursor:pointer; display:flex; font-size:.8rem; font-weight:900; gap:.5rem; justify-content:center; letter-spacing:.06em; min-height:48px; padding:.7rem 1rem; }.print-ticket:active { box-shadow:none; transform:translateY(5px); }

.admin-order-detail__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.summary-card,
.items-card,
.audit-card {
  flex: 1 1 420px;
}

.summary-card,
.items-card,
.audit-card {
  padding: 1rem;
}

.summary-card__top,
.summary-card__grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.summary-card__top {
  margin-bottom: 1rem;
}

.summary-card span,
.section-head__eyebrow {
  color: rgba($text-dark, 0.62);
  display: block;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.summary-card strong,
.section-head strong,
.item-row span {
  display: block;
  font-weight: 800;
}

.section-head {
  align-items: end;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.section-head h2 {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-row {
  align-items: start;
  background: $bg-light;
  border: 1px solid rgba($text-dark, 0.08);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.9rem 1rem;
}

.item-row p,
.audit-item p {
  color: rgba($text-dark, 0.66);
  line-height: 1.5;
}

.item-row__info { align-items:center; display:flex; gap:.7rem; }.item-row__info > img,.item-row__info > i { align-items:center; background:rgba(35,89,49,.1); border-radius:10px; color:#235931; display:flex; flex:0 0 42px; height:42px; justify-content:center; object-fit:cover; width:42px; }

.audit {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.audit-item {
  background: $bg-light;
  border: 1px solid rgba($text-dark, 0.08);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.9rem 1rem;
}

.audit-item__head {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
}

.audit-item__head small {
  color: rgba($text-dark, 0.58);
}

.empty-state {
  color: rgba($text-dark, 0.66);
}

.tone--amber {
  background: rgba($secondary, 0.2);
  color: $text-dark;
}

.tone--blue {
  background: rgba(27, 77, 126, 0.22);
  color: #cfe6ff;
}

.tone--green {
  background: rgba(35, 89, 49, 0.22);
  color: #d9f6df;
}

.tone--violet {
  background: rgba(90, 52, 139, 0.22);
  color: #e2d5ff;
}

.tone--neutral {
  background: rgba(20, 24, 20, 0.22);
  color: $text-dark;
}

.tone--red {
  background: rgba(126, 33, 33, 0.22);
  color: #ffcfcf;
}

@media (min-width: 769px) {
  .admin-order-detail__hero {
    align-items: flex-end;
    flex-direction: row;
  }

  .summary-card__top,
  .summary-card__grid {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .summary-card__top > *,
  .summary-card__grid > * {
    flex: 1 1 180px;
  }

  .item-row,
  .audit-item__head {
    align-items: center;
    flex-direction: row;
  }
}
</style>
