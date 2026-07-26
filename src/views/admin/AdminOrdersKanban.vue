<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import OrderColumn from '@/components/admin/OrderColumn.vue'
import { AdminDateRangeFilter } from '@/components/admin'
import { AdminOrdersLineChart } from '@/components/admin'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import OrderNoteModal from '@/components/admin/order-notes/OrderNoteModal.vue'
import type { OrderDTO } from '@/services/OrderService'
import { printOrderTicket } from '@/utils/printOrderTicket'
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
  if (!hasActiveFilters.value) return 'Órdenes de hoy'
  return `${visibleOrders.value.length} de ${orders.value.length} órdenes`
})
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

function refreshBoard() {
  if (document.visibilityState === 'visible' && !loading.value) void load(true)
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

async function handleDrop(orderId: string, status: OrderStatus) {
  const order = findOrder(orderId)
  if (!order || order.status === status) return

  await move(order, status)
}

async function handleAdvance(order: OrderDTO, status: OrderStatus) {
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
      <header class="admin-orders__hero panel">
        <div>
          <p class="admin-orders__eyebrow">Operación</p>
          <h1>Órdenes</h1>
          <p>Busca, mueve y documenta pedidos desde un tablero limpio y compacto.</p>
        </div>

        <div class="admin-orders__hero-actions">
          <button type="button" class="hero-button" @click="reloadBoard">Actualizar</button>
          <button type="button" class="hero-button hero-button--ghost" @click="resetFilters">Limpiar filtros</button>
        </div>
      </header>

      <section class="admin-orders__stats">
        <article class="panel stat-card">
          <span>Total</span>
          <strong>{{ totals.count }}</strong>
        </article>
        <article class="panel stat-card">
          <span>Pendientes</span>
          <strong>{{ totals.pending }}</strong>
        </article>
        <article class="panel stat-card">
          <span>En proceso</span>
          <strong>{{ totals.active }}</strong>
        </article>
        <article class="panel stat-card">
          <span>Entregadas</span>
          <strong>{{ totals.completed }}</strong>
        </article>
      </section>

      <AdminDateRangeFilter :start-date="startDate" :end-date="endDate" :active-preset="activeDatePreset" eyebrow="Filtro de órdenes" title="Selecciona el período" :loading="loading" @update:start-date="startDate = $event; activeDatePreset = ''" @update:end-date="endDate = $event; activeDatePreset = ''" @preset="activeDatePreset = $event" @apply="applyDateRange" />

      <AdminOrdersLineChart :orders="orders" :period="periodFilter" />

      <section class="panel admin-orders__toolbar">
        <div class="period-filter">
          <span><i class="fa-solid fa-calendar-day" /> Periodo</span>
          <button type="button" :class="{ active: periodFilter === 'today' }" @click="setPeriodFilter('today')">Hoy</button>
          <button type="button" :class="{ active: periodFilter === 'all' }" @click="setPeriodFilter('all')">Historial</button>
        </div>
        <div class="toolbar-search">
          <div class="toolbar-search__head">
            <span>Buscar pedido</span>
            <strong>{{ resultSummary }}</strong>
          </div>
          <div class="toolbar-search__input">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input v-model.trim="searchQuery" type="search" placeholder="Ej: BOL-123, Diego, correo, bolón, Centro" autocomplete="off" />
            <button v-if="searchQuery" type="button" aria-label="Limpiar búsqueda" @click="clearSearch">×</button>
          </div>
          <small>{{ searchFeedback }}</small>
          <div v-if="searchLoading" class="search-skeleton" aria-label="Buscando">
            <span />
            <span />
          </div>
        </div>

        <div class="status-filter" aria-label="Filtrar por estado">
          <button type="button" :class="{ active: statusFilter === 'all' }" @click="setStatusFilter('all')">Todos</button>
          <button
            v-for="status in orderStatuses"
            :key="status"
            type="button"
            :class="{ active: statusFilter === status }"
            @click="setStatusFilter(status)"
          >
            <i :class="['fa-solid', orderStatusIcons[status]]" /> {{ orderStatusLabels[status] }}
          </button>
        </div>

        <button v-if="hasActiveFilters" class="toolbar-clear" type="button" @click="resetFilters">Limpiar</button>
      </section>

      <SkeletonLoader v-if="loading || searchLoading" type="kanban" :count="5" />

      <div v-else-if="visibleOrders.length" class="board">
        <OrderColumn
          v-for="status in visibleColumnStatuses"
          :key="status"
          :status="status"
           :orders="grouped[status]"
           :driver-loading-id="driverLoadingId"
          @open="openDetail"
          @note="openNoteModal"
          @advance="handleAdvance"
           @drop="handleDrop"
           @driver="handleDriver"
           @print="printOrderTicket"
        />
      </div>

      <div v-else class="empty-results panel">
        <strong>No encontramos órdenes</strong>
        <p>Prueba con otro número, cliente, correo, producto o limpia los filtros.</p>
        <button type="button" @click="resetFilters">Limpiar búsqueda</button>
      </div>
    </section>

    <OrderNoteModal :open="noteModalOpen" :order="noteTarget" :text="noteText" :saving="noteSaving" @update:text="noteText = $event" @close="closeNoteModal" @submit="submitNote" />
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-orders {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 100%;
  overflow: hidden;
  padding: clamp(0.75rem, 2vw, 1.5rem);
  width: 100%;
  color: #18211b;
}

.admin-orders__hero,
.admin-orders__toolbar,
.admin-orders__stats {
  margin-bottom: 0;
}

.admin-orders__hero {
  align-items: end;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
}

.admin-orders__eyebrow {
  color: #efd537;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.admin-orders__hero h1 {
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.95;
  margin-top: 0.35rem;
}

.admin-orders__hero p {
  color: rgba(24, 33, 27, 0.62);
  margin-top: 0.75rem;
  max-width: 42rem;
}

.admin-orders__hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero-button,
.toolbar-clear,
.note-modal__actions button {
  align-items: center;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  font-weight: 800;
  min-height: 46px;
  padding: 0.85rem 1.1rem;
}

.hero-button,
.toolbar-clear,
.note-modal__actions button:not(.secondary) {
  background: $primary-dark;
  color: $white;
}

.hero-button--ghost,
.note-modal__actions .secondary {
  background: rgba($secondary, 0.16) !important;
  color: $text-dark !important;
}

.admin-orders__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  width: 100%;
}

.stat-card {
  flex: 1 1 180px;
  padding: 1rem;
}

.stat-card span {
  color: rgba($text-dark, 0.58);
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stat-card strong {
  display: block;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  margin-top: 0.35rem;
}

.admin-orders__toolbar {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.9rem;
}

.period-filter { align-items: center; display: flex; flex: 1 1 100%; flex-wrap: wrap; gap: 0.45rem; }
.period-filter > span { color: rgba($text-dark, 0.58); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.08em; margin-right: 0.2rem; text-transform: uppercase; }
.period-filter > span i { color: $primary-dark; }
.period-filter button { background: rgba($primary-dark, 0.07); border: 1px solid rgba($primary-dark, 0.12); border-radius: 999px; color: $primary-dark; font-size: 0.78rem; font-weight: 800; min-height: 36px; padding: 0.4rem 0.8rem; }
.period-filter button.active { background: $primary-dark; border-color: $primary-dark; color: $white; }

.toolbar-search {
  background: linear-gradient(135deg, rgba($white, 0.98), rgba($secondary, 0.1));
  border: 1px solid rgba($secondary, 0.32);
  border-radius: 20px;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  flex: 1 1 340px;
  gap: 0.55rem;
  padding: 0.9rem;
  min-width: 0;
}

.search-skeleton {
  display: flex;
  gap: 0.45rem;
}

.search-skeleton span {
  animation: searchPulse 0.9s ease-in-out infinite alternate;
  background: linear-gradient(90deg, rgba($primary-dark, 0.08), rgba($primary-dark, 0.18), rgba($primary-dark, 0.08));
  border-radius: 999px;
  display: block;
  height: 8px;
}

.search-skeleton span:first-child {
  width: 34%;
}

.search-skeleton span:last-child {
  width: 18%;
}

.toolbar-search__head {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
}

.toolbar-search__head span {
  color: $primary-dark;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.toolbar-search__head strong {
  color: rgba($text-dark, 0.58);
  font-size: 0.78rem;
  font-weight: 800;
}

.toolbar-search__input {
  align-items: center;
  background: $white;
  border: 1px solid rgba($text-dark, 0.14);
  border-radius: 16px;
  display: flex;
  gap: 0.65rem;
  min-height: 52px;
  padding: 0 0.85rem;
}

.toolbar-search__input i {
  color: $primary-dark;
}

.toolbar-search__input input {
  background: transparent;
  border: 0;
  color: $text-dark;
  flex: 1;
  font-size: 1rem;
  font-weight: 650;
  min-height: 50px;
  outline: 0;
  padding: 0;
  min-width: 0;
}

.toolbar-search__input button {
  align-items: center;
  background: rgba($text-dark, 0.08);
  border: 0;
  border-radius: 50%;
  color: $text-dark;
  cursor: pointer;
  display: inline-flex;
  font-size: 1.35rem;
  height: 34px;
  justify-content: center;
  line-height: 1;
  width: 34px;
}

.toolbar-search__input:focus-within {
  border-color: rgba($primary-dark, 0.42);
  box-shadow: 0 0 0 4px rgba($primary-dark, 0.1);
}

.toolbar-search__input input::placeholder {
  color: rgba($text-dark, 0.38);
  font-weight: 500;
}

.toolbar-search__input input::-webkit-search-cancel-button {
  display: none;
}

.toolbar-search small {
  color: rgba($text-dark, 0.66);
  font-size: 0.84rem;
  line-height: 1.35;
  width: 100%;
}

.status-filter {
  align-items: center;
  display: flex;
  flex: 0 1 auto;
  flex-wrap: wrap;
  gap: 0.45rem;
  max-width: 100%;
}

.status-filter button {
  background: $white;
  border: 1px solid rgba($text-dark, 0.1);
  border-radius: 999px;
  color: rgba($text-dark, 0.72);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 900;
  min-height: 40px;
  padding: 0.65rem 0.82rem;
}

.status-filter button.active {
  background: $primary-dark;
  border-color: $primary-dark;
  color: $white;
}

.toolbar-clear {
  background: rgba($secondary, 0.16);
  color: $text-dark;
  flex: 0 0 auto;
}

.board {
  box-sizing: border-box;
  display: flex;
  gap: 1rem;
  align-items: start;
  max-width: 100%;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.1rem 0 0.4rem;
  scroll-snap-type: x mandatory;
  width: 100%;
}

.board :deep(.column) {
  flex: 0 0 min(340px, calc(100vw - 3rem));
  scroll-snap-align: start;
}

.empty-results {
  align-items: start;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1.25rem;
}

.empty-results strong {
  font-size: 1.15rem;
}

.empty-results p {
  color: rgba($text-dark, 0.62);
}

.empty-results button {
  background: $primary-dark;
  border: 0;
  border-radius: 999px;
  color: $white;
  cursor: pointer;
  font-weight: 800;
  min-height: 44px;
  padding: 0.75rem 1rem;
}

.note-modal {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.note-modal__summary {
  color: #18211b;
  padding: 1rem;
}

.note-modal__summary span,
.note-modal__field span,
.note-modal__history p {
  display: block;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.note-modal__summary strong {
  display: block;
  font-size: 1.2rem;
  margin-top: 0.35rem;
}

.note-modal__summary small {
  color: rgba(24, 33, 27, 0.62);
  display: block;
  margin-top: 0.5rem;
}

.note-modal__field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.note-modal__field span,
.note-modal__history p {
  color: #235931;
}

.note-modal__field textarea {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.12);
  border-radius: 18px;
  color: #08110d;
  min-height: 140px;
  padding: 1rem;
  resize: vertical;
}

.note-modal__history {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.note-modal__history article {
  background: rgba(8, 17, 13, 0.05);
  border: 1px solid rgba(8, 17, 13, 0.08);
  border-radius: 16px;
  color: #08110d;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.8rem 0.9rem;
}

.note-modal__history small,
.note-modal__history span {
  color: rgba(8, 17, 13, 0.68);
}

.note-modal__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

.note-modal__actions .secondary {
  background: rgba(26, 26, 26, 0.08) !important;
  color: #08110d !important;
}

@keyframes searchPulse {
  from {
    opacity: 0.45;
  }
  to {
    opacity: 1;
  }
}

@media (min-width: 769px) {
  .admin-orders__hero {
    align-items: flex-end;
    flex-direction: row;
  }
  .admin-orders__toolbar {
    align-items: center;
    flex-direction: row;
  }
}

.status-filter {
  width: 100%;
}

.status-filter button {
  flex: 1 1 auto;
}

@media (min-width: 769px) {
  .board {
    scroll-snap-type: x proximity;
  }
}

@media (min-width: 641px) {
  .admin-orders {
    padding: 1rem;
  }

  .admin-orders__hero,
  .admin-orders__toolbar {
    padding: 1.25rem;
  }

  .stat-card,
  .toolbar-search,
  .toolbar-clear {
    width: auto;
  }
}
</style>
