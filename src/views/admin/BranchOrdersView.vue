<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import OrdersBoard from '@/components/admin/OrdersBoard.vue'
import OrderNoteModal from '@/components/admin/order-notes/OrderNoteModal.vue'
import CancelOrderModal from '@/components/admin/CancelOrderModal.vue'
import OrderSoundToggle from '@/components/admin/OrderSoundToggle.vue'
import OrderSoundArmBanner from '@/components/admin/OrderSoundArmBanner.vue'
import { printOrderTicket } from '@/utils/printOrderTicket'
import type { OrderDTO } from '@/services/OrderService'
import { orderStatuses, type OrderStatus, useOrdersBoard } from '@/composables/useOrdersBoard'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { loading, grouped, totals, load, move, addNote, findOrder, requestDriver } = useOrdersBoard()
const noteOpen = ref(false); const noteTarget = ref<OrderDTO | null>(null); const noteText = ref(''); const noteSaving = ref(false); const driverLoadingId = ref('')
let refreshTimer: ReturnType<typeof setInterval> | null = null
// Lo que el local tiene que atender ahora, en el orden en que se trabaja.
const toAttend = computed(() => grouped.value.pending.length + grouped.value.paid.length)
const unpaidCards = computed(() => grouped.value.pending.filter((order) => order.paymentMethod === 'card' && !order.payphone?.transactionId).length)
const todayRaw = new Intl.DateTimeFormat('es-EC', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
const todayLabel = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1)
// Se refresca aunque la pestaña esté de fondo: en el local el tablero suele quedar
// detrás del POS, y si dejamos de consultar no hay pedido nuevo que detectar ni,
// por lo tanto, aviso sonoro que dar.
function refresh() { if (!loading.value) void load(true) }
function openDetail(id: string) { router.push(`/admin/ordenes/${id}`) }
function openNote(order: OrderDTO) { noteTarget.value = order; noteText.value = ''; noteOpen.value = true }
function closeNote() { noteOpen.value = false; noteTarget.value = null; noteText.value = '' }
async function saveNote() { if (!noteTarget.value || !noteText.value.trim()) return; noteSaving.value = true; try { await addNote(noteTarget.value, noteText.value.trim()); closeNote() } finally { noteSaving.value = false } }
// Cancelar exige confirmación con hold de 2 s + motivo, y es exclusivo de administración
// general: un admin de sucursal no puede cancelar (el backend lo valida igual).
const cancelTarget = ref<OrderDTO | null>(null)
const userStore = useUserStore()
const { warning: warnToast } = useToast()
const canCancel = computed(() => userStore.accountType === 'admin' || userStore.allBranches)
function requestCancel(order: OrderDTO) { if (!canCancel.value) { warnToast('Solo administración general puede cancelar pedidos. Pide la cancelación a administración.'); return } cancelTarget.value = order }
async function confirmCancel(reason: string) { const target = cancelTarget.value; cancelTarget.value = null; if (target) await move(target, 'cancelled', reason) }
async function changeStatus(order: OrderDTO, status: OrderStatus) { if (status === 'cancelled' && order.status !== 'cancelled') { requestCancel(order); return } await move(order, status) }
async function drop(orderId: string, status: OrderStatus) { const order = findOrder(orderId); if (!order || order.status === status) return; if (status === 'cancelled') { requestCancel(order); return } await move(order, status) }
async function requestDriverFor(order: OrderDTO) { driverLoadingId.value = order._id; await requestDriver(order); driverLoadingId.value = '' }
onMounted(() => { void load(); window.addEventListener('admin:branch-change', refresh); document.addEventListener('visibilitychange', refresh); refreshTimer = setInterval(refresh, 10_000) })
onUnmounted(() => { window.removeEventListener('admin:branch-change', refresh); document.removeEventListener('visibilitychange', refresh); if (refreshTimer) clearInterval(refreshTimer) })
</script>
<template>
  <AdminLayout>
    <main class="operation">
      <header class="operation__head">
        <div class="operation__title">
          <p>{{ todayLabel }}</p>
          <h1>Pedidos de tu local</h1>
        </div>
        <OrderSoundToggle />
      </header>

      <section class="operation__pulse" aria-label="Resumen de ahora">
        <article class="is-attend" :class="{ 'is-hot': toAttend > 0 }">
          <strong>{{ toAttend }}</strong>
          <span>Por atender</span>
        </article>
        <article class="is-kitchen">
          <strong>{{ grouped.preparing.length }}</strong>
          <span>En cocina</span>
        </article>
        <article class="is-ready">
          <strong>{{ grouped.awaiting_pickup.length + grouped.ready.length }}</strong>
          <span>Listos o saliendo</span>
        </article>
        <article class="is-done">
          <strong>{{ totals.completed }}</strong>
          <span>Entregados</span>
        </article>
      </section>

      <p v-if="unpaidCards" class="operation__alert" role="status">
        <i class="fa-solid fa-triangle-exclamation" aria-hidden="true" />
        {{ unpaidCards === 1 ? '1 pedido con tarjeta todavía no está pagado' : `${unpaidCards} pedidos con tarjeta todavía no están pagados` }}: no los prepares hasta que se confirme el pago.
      </p>

      <OrderSoundArmBanner />

      <div v-if="loading" class="operation__loading"><i class="fa-solid fa-spinner fa-spin" aria-hidden="true" /> Cargando pedidos…</div>
      <OrdersBoard
        v-else
        :statuses="orderStatuses"
        :grouped="grouped"
        :driver-loading-id="driverLoadingId"
        :can-cancel="canCancel"
        @open="openDetail"
        @note="openNote"
        @advance="changeStatus"
        @drop="drop"
        @driver="requestDriverFor"
        @print="printOrderTicket"
        @cancel="requestCancel"
      />

      <OrderNoteModal :open="noteOpen" :order="noteTarget" :text="noteText" :saving="noteSaving" @update:text="noteText = $event" @close="closeNote" @submit="saveNote" />
      <CancelOrderModal :order="cancelTarget" @close="cancelTarget = null" @confirm="confirmCancel" />
    </main>
  </AdminLayout>
</template>

<style scoped lang="scss">
.operation { display: flex; flex-direction: column; gap: 0.9rem; padding: 0.25rem 0 1.5rem; }

.operation__head { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: space-between; }

.operation__title {
  p { color: var(--admin-muted); font-size: 0.78rem; font-weight: 700; margin: 0; }
  h1 { font-size: clamp(1.5rem, 5vw, 2.1rem); font-weight: 800; letter-spacing: -0.035em; line-height: 1.05; margin: 0.15rem 0 0; }
}

.operation__pulse {
  display: flex;
  gap: 0.6rem;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }

  article {
    background: var(--admin-surface);
    border: 1px solid var(--admin-line);
    border-radius: 16px;
    box-shadow: var(--admin-shadow);
    display: flex;
    flex: 1 0 128px;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.8rem 0.95rem;
    position: relative;
  }

  strong { font-size: 1.9rem; font-variant-numeric: tabular-nums; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
  span { color: var(--admin-muted); font-size: 0.76rem; font-weight: 700; }

  .is-attend strong { color: var(--st-pending); }
  .is-kitchen strong { color: var(--st-preparing); }
  .is-ready strong { color: var(--st-awaiting_pickup); }
  .is-done strong { color: var(--st-delivered); }

  // Hay pedidos esperando: la tarjeta se ve "encendida".
  .is-attend.is-hot {
    background: var(--st-pending-soft);
    border-color: color-mix(in srgb, var(--st-pending) 40%, transparent);

    &::after {
      animation: attend-dot 1.4s ease-in-out infinite;
      background: var(--st-pending);
      border-radius: 50%;
      content: '';
      height: 9px;
      position: absolute;
      right: 0.85rem;
      top: 0.85rem;
      width: 9px;
    }
  }
}

@keyframes attend-dot { 50% { opacity: 0.25; transform: scale(0.7); } }

.operation__alert {
  align-items: center;
  background: var(--admin-danger-soft);
  border: 1px solid color-mix(in srgb, var(--admin-danger) 35%, transparent);
  border-radius: 14px;
  color: var(--admin-danger);
  display: flex;
  font-size: 0.84rem;
  font-weight: 700;
  gap: 0.6rem;
  margin: 0;
  padding: 0.75rem 0.95rem;
}

.operation__loading { align-items: center; color: var(--admin-muted); display: flex; gap: 0.6rem; justify-content: center; min-height: 260px; }
.operation__loading i { color: var(--admin-accent); font-size: 1.4rem; }

/* En el celular la fila se desliza de borde a borde. */
@media (max-width: 640px) {
  .operation__pulse { margin: 0 -0.75rem; padding: 0 0.75rem; }
}

@media (prefers-reduced-motion: reduce) {
  .operation__pulse .is-attend.is-hot::after { animation: none; }
}
</style>
