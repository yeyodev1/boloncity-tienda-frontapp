<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import { useToast } from '@/composables/useToast'
import AdminOrderDeliveryPanel from '@/components/admin/AdminOrderDeliveryPanel.vue'
import AdminOrderRefundPanel from '@/components/admin/AdminOrderRefundPanel.vue'
import { printOrderTicket } from '@/utils/printOrderTicket'

const route = useRoute()
const order = ref<OrderDTO | null>(null)
const loading = ref(true)
const startingSearch = ref(false)
const retryingPicker = ref(false)
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
const auditLabels: Record<string, string> = { created:'Pedido recibido', payment_confirmed:'Pago confirmado', status_change:'Estado actualizado', note_added:'Nota agregada', user_assigned:'Usuario asignado', branch_assigned:'Sucursal asignada', refund_requested:'Devolución solicitada', refunded:'Pago devuelto', refund_failed:'Devolución rechazada' }

const itemCount = computed(() => order.value?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0)
const hasBilling = computed(() => {
  const billing = order.value?.billing
  return Boolean(billing && (billing.docNumber || billing.name || billing.address))
})
const canRetryPicker = computed(() => Boolean(order.value && order.value.deliveryType === 'delivery' && !order.value.picker?.bookingId && order.value.status !== 'pending' && order.value.status !== 'cancelled'))

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount / 100)
}

// items[].price viene en dolares (no en centavos como subtotal/total/deliveryCost).
function formatDollars(amount: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount)
}

async function startDriverSearch() { if (!order.value) return; try { startingSearch.value = true; order.value = (await OrderService.startPickerSearch(order.value._id)).data.order; success('Búsqueda de conductor iniciada') } catch { error('No se pudo iniciar la búsqueda de conductor') } finally { startingSearch.value = false } }

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
    <section class="admin-order-detail">
      <header class="admin-order-detail__hero panel" v-if="order">
        <div>
          <p class="admin-order-detail__eyebrow">Orden</p>
          <h1>{{ order.orderNumber }}</h1>
          <p>{{ order.customerName || order.customerEmail }}</p>
        </div>

        <div class="hero-actions"><div class="admin-order-detail__status" :class="statusTones[order.status]"><i :class="['fa-solid', statusIcons[order.status] || 'fa-circle-info']" /> <span>{{ statusLabels[order.status] || order.status }}</span></div><button v-if="canRetryPicker" type="button" class="delivery-retry" :disabled="retryingPicker" @click="retryPicker"><i class="fa-solid fa-truck-fast" /> {{ retryingPicker ? 'SOLICITANDO...' : 'REINTENTAR DELIVERY' }}</button><button type="button" class="print-ticket" @click="printOrderTicket(order)"><i class="fa-solid fa-print" /> IMPRIMIR TICKET</button></div>
      </header>

      <SkeletonLoader v-if="loading" type="card" :count="2" />

      <div v-else-if="order" class="admin-order-detail__grid">
        <article class="panel summary-card">
          <div class="section-head">
            <div class="section-head__title">
              <span class="head-icon head-icon--green"><i class="fa-solid fa-user" /></span>
              <div>
                <p class="section-head__eyebrow">Cliente</p>
                <h2>{{ order.customerName || 'Sin nombre' }}</h2>
              </div>
            </div>
          </div>

          <div class="tile-row">
            <div class="tile tile--green"><span><i class="fa-solid fa-sack-dollar" /> Total</span><strong>{{ formatCurrency(order.total) }}</strong></div>
            <div class="tile"><span><i class="fa-solid fa-utensils" /> Items</span><strong>{{ itemCount }}</strong></div>
            <div class="tile"><span><i class="fa-solid fa-store" /> Sucursal</span><strong>{{ order.branch?.name || 'Sin sucursal' }}</strong></div>
            <div class="tile"><span><i class="fa-solid fa-phone" /> Teléfono</span><strong>{{ order.customerPhone || 'No registrado' }}</strong></div>
            <div class="tile tile--wide"><span><i class="fa-solid fa-envelope" /> Email</span><strong>{{ order.customerEmail }}</strong></div>
            <div class="tile tile--wide" :class="order.deliveryType === 'delivery' ? 'tile--blue' : 'tile--yellow'">
              <span><i :class="order.deliveryType === 'delivery' ? 'fa-solid fa-motorcycle' : 'fa-solid fa-bag-shopping'" /> Tipo de pedido</span>
              <strong>{{ order.deliveryType === 'delivery' ? `Delivery${order.deliveryAddress ? ' · ' + order.deliveryAddress : ''}` : 'Retiro en sucursal' }}</strong>
            </div>
          </div>
        </article>

        <AdminOrderDeliveryPanel :order="order" />

        <AdminOrderRefundPanel :order="order" @refunded="order = $event" />

        <article v-if="order.scheduledFor" class="panel scheduled-card">
          <div class="section-head">
            <div class="section-head__title">
              <span class="head-icon head-icon--yellow"><i class="fa-solid fa-calendar-check" /></span>
              <div>
                <p class="section-head__eyebrow">Pedido programado</p>
                <h2>{{ new Date(order.scheduledFor).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }) }}</h2>
              </div>
            </div>
            <button v-if="order.picker?.searchState === 'on_hold' || order.picker?.searchState === 'failed'" type="button" class="scheduled-card__cta" :disabled="startingSearch" @click="startDriverSearch">
              <i class="fa-solid fa-motorcycle" /> {{ startingSearch ? 'Buscando...' : 'Buscar conductor' }}
            </button>
            <span v-else class="pill pill--yellow">{{ order.picker?.searchState === 'started' ? 'Búsqueda iniciada' : 'En espera' }}</span>
          </div>
          <p v-if="order.picker?.searchError" class="scheduled-card__error"><i class="fa-solid fa-circle-exclamation" /> {{ order.picker.searchError }}</p>
        </article>

        <article class="panel items-card">
          <div class="section-head">
            <div class="section-head__title">
              <span class="head-icon head-icon--green"><i class="fa-solid fa-basket-shopping" /></span>
              <div>
                <p class="section-head__eyebrow">Contenido</p>
                <h2>Productos</h2>
              </div>
            </div>
            <span class="pill pill--green">{{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}</span>
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
              <span>{{ formatDollars(item.price * item.quantity) }}</span>
            </article>
          </div>

          <div class="cost-breakdown">
            <div><span>Subtotal</span><strong>{{ formatCurrency(order.subtotal) }}</strong></div>
            <div v-if="order.tax"><span>IVA incluido</span><strong>{{ formatCurrency(order.tax) }}</strong></div>
            <div v-if="order.deliveryType === 'delivery'">
              <span>Envío cobrado al cliente{{ order.deliveryDistance ? ` · ${order.deliveryDistance.toFixed(1)} km` : '' }}</span>
              <strong>{{ formatCurrency(order.deliveryCost || 0) }}</strong>
            </div>
            <div v-if="order.picker?.deliveryFee" class="cost-breakdown__picker">
              <span><i class="fa-solid fa-motorcycle" /> Tarifa Picker (costo real del delivery)</span>
              <strong>{{ formatDollars(order.picker.deliveryFee) }}</strong>
            </div>
            <div v-if="order.discount"><span>Descuento por puntos ({{ order.pointsRedeemed }} pts)</span><strong>-{{ formatCurrency(order.discount) }}</strong></div>
            <div class="cost-breakdown__total"><span>Total cobrado</span><strong>{{ formatCurrency(order.total) }}</strong></div>
          </div>
        </article>

        <article class="panel billing-card">
          <div class="section-head">
            <div class="section-head__title">
              <span class="head-icon head-icon--yellow"><i class="fa-solid fa-file-invoice" /></span>
              <div>
                <p class="section-head__eyebrow">Facturación</p>
                <h2>{{ hasBilling ? 'Datos de factura' : 'Consumidor final' }}</h2>
              </div>
            </div>
            <span v-if="hasBilling" class="pill pill--yellow"><i class="fa-solid fa-file-invoice" /> Pidió factura</span>
          </div>
          <div v-if="hasBilling" class="billing-grid">
            <div><span>Documento</span><strong>{{ (order.billing?.docType || 'documento').toUpperCase() }} · {{ order.billing?.docNumber || '—' }}</strong></div>
            <div><span>Nombre / Razón social</span><strong>{{ order.billing?.name || '—' }}</strong></div>
            <div><span>Email para la factura</span><strong>{{ order.billing?.email || order.customerEmail }}</strong></div>
            <div><span>Dirección</span><strong>{{ order.billing?.address || '—' }}</strong></div>
          </div>
          <p v-else class="empty-state">El cliente no pidió factura con datos: se factura como consumidor final.</p>
        </article>

        <article class="panel audit-card">
          <div class="section-head">
            <div class="section-head__title">
              <span class="head-icon"><i class="fa-solid fa-clock-rotate-left" /></span>
              <div>
                <p class="section-head__eyebrow">Trazabilidad</p>
                <h2>Auditoría</h2>
              </div>
            </div>
          </div>

          <div v-if="order.audit?.length" class="audit">
            <div v-for="entry in order.audit || []" :key="`${entry.action}-${entry.timestamp}`" class="audit-item" :class="`audit-item--${entry.action}`">
              <div class="audit-item__head">
                <strong>{{ auditLabels[entry.action] || 'Actualización' }}</strong>
                <small>{{ entry.performedByEmail || 'system' }} · {{ new Date(entry.timestamp).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) }}</small>
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
.delivery-retry { align-items:center; background:#235931; border:0; border-radius:12px; color:#fff; cursor:pointer; display:flex; font-size:.8rem; font-weight:900; gap:.5rem; justify-content:center; letter-spacing:.06em; min-height:48px; padding:.7rem 1rem; }.delivery-retry:disabled { cursor:wait; opacity:.65; }

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

.section-head__eyebrow {
  color: rgba($text-dark, 0.62);
  display: block;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.section-head strong,
.item-row span {
  display: block;
  font-weight: 800;
}

.section-head__title { align-items: center; display: flex; gap: 0.7rem; min-width: 0; }

.head-icon {
  align-items: center;
  background: rgba($text-dark, 0.07);
  border-radius: 12px;
  color: rgba($text-dark, 0.7);
  display: flex;
  flex: 0 0 42px;
  font-size: 1rem;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.head-icon--green { background: rgba(35, 89, 49, 0.12); color: #235931; }
.head-icon--yellow { background: rgba(239, 213, 55, 0.3); color: #6a4e05; }

.pill {
  align-items: center;
  background: rgba($text-dark, 0.06);
  border-radius: 999px;
  color: rgba($text-dark, 0.75);
  display: flex;
  flex: 0 0 auto;
  font-size: 0.75rem;
  font-weight: 800;
  gap: 0.4rem;
  padding: 0.45rem 0.85rem;
  white-space: nowrap;
}

.pill--green { background: rgba(0, 165, 35, 0.12); color: #087c25; }
.pill--yellow { background: rgba(239, 213, 55, 0.28); color: #6a4e05; }

.tile-row { display: flex; flex-wrap: wrap; gap: 0.6rem; }

.tile {
  background: $bg-light;
  border: 1px solid rgba($text-dark, 0.07);
  border-radius: 14px;
  display: flex;
  flex: 1 1 45%;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
  padding: 0.75rem 0.9rem;
}

.tile span { align-items: center; color: rgba($text-dark, 0.55); display: flex; font-size: 0.68rem; font-weight: 900; gap: 0.4rem; letter-spacing: 0.1em; text-transform: uppercase; }
.tile span i { font-size: 0.75rem; }
.tile strong { font-size: 1rem; font-weight: 800; overflow-wrap: anywhere; }
.tile--wide { flex: 1 1 100%; }
.tile--green { background: rgba(35, 89, 49, 0.08); border-color: rgba(35, 89, 49, 0.2); }
.tile--green span,
.tile--green strong { color: #235931; }
.tile--green strong { font-size: 1.3rem; }
.tile--yellow { background: rgba(239, 213, 55, 0.16); border-color: rgba(239, 213, 55, 0.5); }
.tile--yellow span { color: #6a4e05; }
.tile--blue { background: rgba(0, 102, 204, 0.07); border-color: rgba(0, 102, 204, 0.2); }
.tile--blue span { color: #0066cc; }

.scheduled-card {
  background: #fffbe8;
  border: 1px solid rgba(239, 213, 55, 0.55);
  flex: 1 1 420px;
  padding: 1rem;
}

.scheduled-card .section-head { margin-bottom: 0; }
.scheduled-card__cta { align-items: center; background: #235931; border: 0; border-radius: 999px; color: #fff; cursor: pointer; display: flex; flex: 0 0 auto; font-weight: 800; gap: 0.5rem; justify-content: center; min-height: 44px; padding: 0.6rem 1.1rem; }
.scheduled-card__cta:disabled { cursor: wait; opacity: 0.65; }
.scheduled-card__error { align-items: center; color: #a52323; display: flex; font-size: 0.85rem; font-weight: 700; gap: 0.45rem; margin-top: 0.75rem; }

.section-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
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
  border-left: 4px solid rgba($text-dark, 0.18);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.9rem 1rem;
}

.audit-item--created { border-left-color: #235931; }
.audit-item--payment_confirmed { border-left-color: #00a523; }
.audit-item--status_change { border-left-color: #0066cc; }
.audit-item--note_added { border-left-color: #efd537; }
.audit-item--refund_requested,
.audit-item--refund_failed { border-left-color: #a52323; }
.audit-item--refunded { border-left-color: #6a4e05; }

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

.cost-breakdown {
  border-top: 1px solid rgba($text-dark, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 1rem;
  padding-top: 0.9rem;
}

.cost-breakdown > div { align-items: center; display: flex; font-size: 0.88rem; gap: 0.75rem; justify-content: space-between; }
.cost-breakdown span { color: rgba($text-dark, 0.62); }
.cost-breakdown__picker { background: rgba(35, 89, 49, 0.06); border-radius: 10px; padding: 0.45rem 0.65rem; }
.cost-breakdown__picker span { color: #235931; font-weight: 700; }
.cost-breakdown__picker i { margin-right: 0.3rem; }
.cost-breakdown__total { border-top: 1px dashed rgba($text-dark, 0.15); font-size: 1rem; margin-top: 0.3rem; padding-top: 0.6rem; }
.cost-breakdown__total span { color: $text-dark; font-weight: 800; }
.cost-breakdown__total strong { font-size: 1.15rem; }

.billing-card { background: #fffdf3; border: 1px solid rgba(239, 213, 55, 0.4); flex: 1 1 420px; padding: 1rem; }

.billing-grid { display: flex; flex-direction: column; gap: 0.75rem; }
.billing-grid > div { display: flex; flex-direction: column; gap: 0.15rem; }
.billing-grid span { color: rgba($text-dark, 0.55); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.billing-grid strong { font-size: 0.95rem; overflow-wrap: anywhere; }

@media (min-width: 768px) {
  .billing-grid { flex-direction: row; flex-wrap: wrap; }
  .billing-grid > div { flex: 1 1 40%; }
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
