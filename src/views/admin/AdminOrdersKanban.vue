<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import OrdersBoard from '@/components/admin/OrdersBoard.vue'
import { AdminDateRangeFilter } from '@/components/admin'
import { AdminOrdersLineChart } from '@/components/admin'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import OrderNoteModal from '@/components/admin/order-notes/OrderNoteModal.vue'
import CancelOrderModal from '@/components/admin/CancelOrderModal.vue'
import OrderSoundToggle from '@/components/admin/OrderSoundToggle.vue'
import OrderSoundArmBanner from '@/components/admin/OrderSoundArmBanner.vue'
import type { OrderDTO } from '@/services/OrderService'
import { printOrderTicket } from '@/utils/printOrderTicket'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'
import {
  orderStatusIcons,
  orderStatuses,
  orderStatusLabels,
  type OrderStatus,
  useOrdersBoard,
} from '@/composables/useOrdersBoard'

const router = useRouter()
const {
  loading,
  searchQuery,
  statusFilter,
   periodFilter,
   startDate,
   endDate,
   activeDatePreset,
  visibleOrders,
  orders,
  grouped,
  totals,
  load,
  move,
   addNote,
    requestDriver,
   resetFilters,
   applyDateRange,
  findOrder,
} = useOrdersBoard()

const noteModalOpen = ref(false)
const noteText = ref('')
const noteTarget = ref<OrderDTO | null>(null)
const noteSaving = ref(false)
const searchLoading = ref(false)
const driverLoadingId = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null
let refreshTimer: ReturnType<typeof setInterval> | null = null

const hasActiveFilters = computed(() => Boolean(searchQuery.value.trim()) || statusFilter.value !== 'all')
const visibleColumnStatuses = computed(() => {
  if (!hasActiveFilters.value) return orderStatuses
  return orderStatuses.filter((status) => grouped.value[status].length > 0)
})
const resultSummary = computed(() => {
  if (!hasActiveFilters.value) return periodFilter.value === 'today' ? 'Órdenes de hoy' : 'Historial de órdenes'
  return `${visibleOrders.value.length} de ${orders.value.length} órdenes`
})
const toAttend = computed(() => grouped.value.pending.length + grouped.value.paid.length)
const searchFeedback = computed(() => {
  const term = searchQuery.value.trim()
  if (!term) return 'Busca por número de orden, cliente, correo, teléfono, producto o sucursal.'
  if (visibleOrders.value.length === 1) return `1 resultado para "${term}"`
  return `${visibleOrders.value.length} resultados para "${term}"`
})

function openDetail(orderId: string) {
  router.push(`/admin/ordenes/${orderId}`)
}

function setStatusFilter(status: OrderStatus | 'all') {
  statusFilter.value = status
}

async function setPeriodFilter(period: 'today' | 'all') {
  periodFilter.value = period
  await load()
}

function clearSearch() {
  searchQuery.value = ''
}

// Se refresca aunque la pestaña esté de fondo: si dejamos de consultar no hay pedido
// nuevo que detectar ni, por lo tanto, aviso sonoro que dar.
function refreshBoard() {
  if (!loading.value) void load(true)
}

function reloadBoard() {
  void load()
}

watch(searchQuery, () => {
  searchLoading.value = true
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchLoading.value = false
  }, 260)
})

function openNoteModal(order: OrderDTO) {
  noteTarget.value = order
  noteText.value = ''
  noteModalOpen.value = true
}

function closeNoteModal() {
  noteModalOpen.value = false
  noteText.value = ''
  noteTarget.value = null
}

async function submitNote() {
  if (!noteTarget.value || !noteText.value.trim()) return
  noteSaving.value = true
  try {
    await addNote(noteTarget.value, noteText.value.trim())
    closeNoteModal()
  } finally {
    noteSaving.value = false
  }
}

// Cancelar exige confirmación con hold de 2 s + motivo: el drop/click solo abre el modal.
// Además es exclusivo de administración general (el backend lo vuelve a validar).
const cancelTarget = ref<OrderDTO | null>(null)
const userStore = useUserStore()
const { warning: warnToast } = useToast()
const canCancel = computed(() => userStore.accountType === 'admin' || userStore.allBranches)

async function confirmCancel(reason: string) {
  const target = cancelTarget.value
  cancelTarget.value = null
  if (target) await move(target, 'cancelled', reason)
}

function requestCancel(order: OrderDTO) {
  if (!canCancel.value) {
    warnToast('Solo administración general puede cancelar pedidos. Pide la cancelación a administración.')
    return
  }
  cancelTarget.value = order
}

async function handleDrop(orderId: string, status: OrderStatus) {
  const order = findOrder(orderId)
  if (!order || order.status === status) return
  if (status === 'cancelled') { requestCancel(order); return }
  await move(order, status)
}

async function handleAdvance(order: OrderDTO, status: OrderStatus) {
  if (status === 'cancelled' && order.status !== 'cancelled') { requestCancel(order); return }
  await move(order, status)
}

async function handleDriver(order: OrderDTO) {
  driverLoadingId.value = order._id
  await requestDriver(order)
  driverLoadingId.value = ''
}

onMounted(() => {
  void load()
  window.addEventListener('admin:branch-change', reloadBoard)
  document.addEventListener('visibilitychange', refreshBoard)
  refreshTimer = setInterval(refreshBoard, 10_000)
})

onUnmounted(() => {
  window.removeEventListener('admin:branch-change', reloadBoard)
  document.removeEventListener('visibilitychange', refreshBoard)
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <AdminLayout>
    <section class="admin-orders">
      <header class="admin-orders__head">
        <div>
          <p>{{ resultSummary }}</p>
          <h1>Órdenes</h1>
        </div>
        <div class="admin-orders__actions">
          <OrderSoundToggle />
          <button type="button" class="icon-button" title="Actualizar" aria-label="Actualizar órdenes" :disabled="loading" @click="reloadBoard">
            <i class="fa-solid fa-rotate" :class="{ 'fa-spin': loading }" aria-hidden="true" />
          </button>
        </div>
      </header>

      <section class="admin-orders__pulse" aria-label="Resumen">
        <article class="is-attend" :class="{ 'is-hot': toAttend > 0 }"><strong>{{ toAttend }}</strong><span>Por atender</span></article>
        <article class="is-active"><strong>{{ totals.active }}</strong><span>En proceso</span></article>
        <article class="is-done"><strong>{{ totals.completed }}</strong><span>Entregadas</span></article>
        <article class="is-total"><strong>{{ totals.count }}</strong><span>Total</span></article>
      </section>

      <OrderSoundArmBanner />

      <section class="admin-orders__toolbar">
        <label class="search">
          <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <span class="sr-only">Buscar pedido</span>
          <input v-model.trim="searchQuery" type="search" placeholder="Buscar por número, cliente, teléfono, producto…" autocomplete="off" />
          <button v-if="searchQuery" type="button" aria-label="Limpiar búsqueda" @click="clearSearch"><i class="fa-solid fa-xmark" /></button>
        </label>

        <div class="segmented" role="group" aria-label="Periodo">
          <button type="button" :class="{ active: periodFilter === 'today' }" @click="setPeriodFilter('today')">Hoy</button>
          <button type="button" :class="{ active: periodFilter === 'all' }" @click="setPeriodFilter('all')">Historial</button>
        </div>

        <div class="chips" role="group" aria-label="Filtrar por estado">
          <button type="button" :class="{ active: statusFilter === 'all' }" @click="setStatusFilter('all')">Todos</button>
          <button
            v-for="status in orderStatuses"
            :key="status"
            type="button"
            :class="[`is-${status}`, { active: statusFilter === status }]"
            @click="setStatusFilter(status)"
          >
            <i :class="['fa-solid', orderStatusIcons[status]]" aria-hidden="true" /> {{ orderStatusLabels[status] }}
          </button>
        </div>

        <p v-if="searchQuery" class="search-feedback">{{ searchFeedback }} <button v-if="hasActiveFilters" type="button" @click="resetFilters">Limpiar filtros</button></p>
      </section>

      <details class="admin-orders__more">
        <summary><i class="fa-solid fa-calendar-days" aria-hidden="true" /> Rango de fechas y gráfico <i class="fa-solid fa-chevron-down admin-orders__chev" aria-hidden="true" /></summary>
        <div class="admin-orders__more-body">
          <AdminDateRangeFilter :start-date="startDate" :end-date="endDate" :active-preset="activeDatePreset" eyebrow="Filtro de órdenes" title="Selecciona el período" :loading="loading" @update:start-date="startDate = $event; activeDatePreset = ''" @update:end-date="endDate = $event; activeDatePreset = ''" @preset="activeDatePreset = $event" @apply="applyDateRange" />
          <AdminOrdersLineChart :orders="orders" :period="periodFilter" />
        </div>
      </details>

      <SkeletonLoader v-if="loading || searchLoading" type="kanban" :count="5" />

      <OrdersBoard
        v-else-if="visibleOrders.length"
        :statuses="visibleColumnStatuses"
        :grouped="grouped"
        :driver-loading-id="driverLoadingId"
        :can-cancel="canCancel"
        @open="openDetail"
        @note="openNoteModal"
        @advance="handleAdvance"
        @drop="handleDrop"
        @driver="handleDriver"
        @print="printOrderTicket"
        @cancel="requestCancel"
      />

      <div v-else class="empty-results">
        <span aria-hidden="true"><i class="fa-solid fa-clipboard-list" /></span>
        <strong>No hay órdenes que coincidan</strong>
        <p>Prueba con otro número, cliente o producto, o mira el historial.</p>
        <button type="button" @click="resetFilters">Limpiar filtros</button>
      </div>
    </section>

    <OrderNoteModal :open="noteModalOpen" :order="noteTarget" :text="noteText" :saving="noteSaving" @update:text="noteText = $event" @close="closeNoteModal" @submit="submitNote" />
    <CancelOrderModal :order="cancelTarget" @close="cancelTarget = null" @confirm="confirmCancel" />
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-orders { display: flex; flex-direction: column; gap: 0.9rem; padding: 0.25rem 0 1.5rem; }

.admin-orders__head {
  align-items: flex-end;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;

  p { color: var(--admin-muted); font-size: 0.78rem; font-weight: 700; margin: 0; }
  h1 { font-size: clamp(1.5rem, 5vw, 2.1rem); font-weight: 800; letter-spacing: -0.035em; line-height: 1.05; margin: 0.15rem 0 0; }
}

.admin-orders__actions { align-items: center; display: flex; gap: 0.5rem; }

.icon-button {
  align-items: center;
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: 12px;
  color: var(--admin-text);
  display: flex;
  height: 44px;
  justify-content: center;
  width: 44px;

  &:hover { background: var(--admin-hover); }
  &:disabled { opacity: 0.6; }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
}

.admin-orders__pulse {
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
    flex: 1 0 120px;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.75rem 0.9rem;
    position: relative;
  }

  strong { font-size: 1.75rem; font-variant-numeric: tabular-nums; font-weight: 800; letter-spacing: -0.04em; line-height: 1; }
  span { color: var(--admin-muted); font-size: 0.74rem; font-weight: 700; }

  .is-attend strong { color: var(--st-pending); }
  .is-active strong { color: var(--st-preparing); }
  .is-done strong { color: var(--st-delivered); }

  .is-attend.is-hot {
    background: var(--st-pending-soft);
    border-color: color-mix(in srgb, var(--st-pending) 40%, transparent);
  }
}

.admin-orders__toolbar {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius);
  box-shadow: var(--admin-shadow);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding: 0.7rem;
}

.search {
  align-items: center;
  background: var(--admin-input-bg);
  border: 1px solid var(--admin-line-strong);
  border-radius: 12px;
  display: flex;
  flex: 1 1 320px;
  gap: 0.5rem;
  min-height: 46px;
  padding: 0 0.4rem 0 0.85rem;

  &:focus-within { border-color: var(--admin-accent); box-shadow: 0 0 0 3px var(--admin-accent-soft); }

  > i { color: var(--admin-muted); }

  input {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
    color: var(--admin-text) !important;
    flex: 1 1 auto;
    min-height: 44px !important;
    min-width: 0;
    outline: none;
    padding: 0 !important;
  }

  button {
    align-items: center;
    background: var(--admin-hover);
    border-radius: 8px;
    color: var(--admin-muted);
    display: flex;
    height: 32px;
    justify-content: center;
    width: 32px;
  }
}

.segmented {
  background: var(--admin-hover);
  border-radius: 12px;
  display: flex;
  gap: 0.2rem;
  padding: 0.2rem;

  button {
    background: transparent;
    border-radius: 10px;
    color: var(--admin-muted);
    font-size: 0.84rem;
    font-weight: 800;
    min-height: 42px;
    padding: 0 1rem;

    &.active { background: var(--admin-surface); box-shadow: var(--admin-shadow); color: var(--admin-text); }
    &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
  }
}

.chips {
  display: flex;
  flex: 1 1 100%;
  gap: 0.35rem;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }

  button {
    align-items: center;
    background: transparent;
    border: 1px solid var(--admin-line);
    border-radius: 999px;
    color: var(--admin-muted);
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 0.76rem;
    font-weight: 700;
    gap: 0.35rem;
    min-height: 36px;
    padding: 0 0.75rem;

    &:hover { background: var(--admin-hover); color: var(--admin-text); }
    &.active { background: var(--admin-text); border-color: transparent; color: var(--admin-surface); }

    @each $status in pending, paid, preparing, awaiting_pickup, ready, delivered, cancelled {
      &.is-#{$status} i { color: var(--st-#{$status}); }
      &.is-#{$status}.active { background: var(--st-#{$status}); }
      &.is-#{$status}.active i { color: inherit; }
    }
  }
}

.search-feedback {
  color: var(--admin-muted);
  flex: 1 1 100%;
  font-size: 0.78rem;
  margin: 0;

  button { background: none; color: var(--admin-accent); font-weight: 800; margin-left: 0.4rem; text-decoration: underline; }
}

.admin-orders__more {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius);

  summary {
    align-items: center;
    color: var(--admin-muted);
    cursor: pointer;
    display: flex;
    font-size: 0.84rem;
    font-weight: 800;
    gap: 0.5rem;
    list-style: none;
    min-height: 48px;
    padding: 0 1rem;

    &::-webkit-details-marker { display: none; }
    &:hover { color: var(--admin-text); }
  }

  &[open] .admin-orders__chev { transform: rotate(180deg); }
}

.admin-orders__chev { margin-left: auto; transition: transform 0.25s var(--admin-ease); }
.admin-orders__more-body { display: flex; flex-direction: column; gap: 0.75rem; padding: 0 0.75rem 0.75rem; }

.empty-results {
  align-items: center;
  background: var(--admin-surface);
  border: 1px dashed var(--admin-line-strong);
  border-radius: var(--admin-radius);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 2.5rem 1rem;
  text-align: center;

  > span {
    align-items: center;
    background: var(--admin-accent-soft);
    border-radius: 50%;
    color: var(--admin-accent);
    display: flex;
    height: 52px;
    justify-content: center;
    margin-bottom: 0.4rem;
    width: 52px;
  }

  p { color: var(--admin-muted); font-size: 0.86rem; margin: 0; }

  button {
    background: var(--admin-accent);
    border-radius: 12px;
    color: var(--admin-on-accent);
    font-weight: 800;
    margin-top: 0.6rem;
    min-height: 44px;
    padding: 0 1.1rem;
  }
}

.sr-only { clip: rect(0 0 0 0); height: 1px; margin: -1px; overflow: hidden; position: absolute; width: 1px; }

/* Celular/tablet: el tablero ya trae pestañas por estado; los chips repetirían lo mismo. */
@media (max-width: 1099px) {
  .chips { display: none; }
}

/* En el celular la fila se desliza de borde a borde. */
@media (max-width: 640px) {
  .admin-orders__pulse { margin: 0 -0.75rem; padding: 0 0.75rem; }
}

@media (prefers-reduced-motion: reduce) {
  .admin-orders__chev { transition: none; }
}
</style>
