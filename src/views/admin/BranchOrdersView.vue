<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import BranchSelector from '@/components/admin/BranchSelector.vue'
import OrderColumn from '@/components/admin/OrderColumn.vue'
import OrderNoteModal from '@/components/admin/order-notes/OrderNoteModal.vue'
import CancelOrderModal from '@/components/admin/CancelOrderModal.vue'
import OrderSoundToggle from '@/components/admin/OrderSoundToggle.vue'
import { printOrderTicket } from '@/utils/printOrderTicket'
import type { OrderDTO } from '@/services/OrderService'
import { orderStatuses, type OrderStatus, useOrdersBoard } from '@/composables/useOrdersBoard'
import { useUserStore } from '@/stores/user'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const { loading, grouped, totals, load, move, addNote, findOrder, requestDriver } = useOrdersBoard()
const noteOpen = ref(false); const noteTarget = ref<OrderDTO | null>(null); const noteText = ref(''); const noteSaving = ref(false); const driverLoadingId = ref('')
let refreshTimer: ReturnType<typeof setInterval> | null = null
const operationCount = computed(() => totals.value.active + totals.value.pending)
function refresh() { if (document.visibilityState === 'visible' && !loading.value) void load(true) }
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
  <AdminLayout><main class="operation"><section class="operation__hero"><div><p><i class="fa-solid fa-store" /> Operación de sucursal</p><h1>Órdenes de tu sucursal</h1><span>Gestiona las etapas de cocina y entrega de las sucursales que tienes asignadas.</span></div><div class="operation__hero-side"><OrderSoundToggle /><BranchSelector /></div></section><section class="operation__stats"><article><i class="fa-solid fa-clipboard-list" /><span><small>Órdenes activas</small><strong>{{ operationCount }}</strong></span></article><article><i class="fa-solid fa-kitchen-set" /><span><small>En preparación</small><strong>{{ grouped.preparing.length }}</strong></span></article><article><i class="fa-solid fa-motorcycle" /><span><small>Para recolección</small><strong>{{ grouped.awaiting_pickup.length }}</strong></span></article></section><section class="operation__guide"><i class="fa-solid fa-circle-info" /><span><strong>Flujo de cocina:</strong> valida el pago, prepara, deja lista para recolección y Picker actualizará la entrega.</span></section><div v-if="loading" class="operation__loading"><i class="fa-solid fa-spinner fa-spin" /> Cargando órdenes</div><div v-else class="operation__board"><OrderColumn v-for="status in orderStatuses" :key="status" :status="status" :orders="grouped[status]" :driver-loading-id="driverLoadingId" :can-cancel="canCancel" @open="openDetail" @note="openNote" @advance="changeStatus" @drop="drop" @driver="requestDriverFor" @print="printOrderTicket" @cancel="requestCancel" /></div><OrderNoteModal :open="noteOpen" :order="noteTarget" :text="noteText" :saving="noteSaving" @update:text="noteText = $event" @close="closeNote" @submit="saveNote" /><CancelOrderModal :order="cancelTarget" @close="cancelTarget = null" @confirm="confirmCancel" /></main></AdminLayout>
</template>
<style scoped lang="scss">
.operation { display:flex; flex-direction:column; gap:1rem; padding:clamp(.75rem,2vw,1.5rem); }.operation__hero { align-items:flex-start; background:linear-gradient(135deg,#173e22,#235931); border-radius:20px; color:#fff; display:flex; flex-direction:column; gap:1rem; justify-content:space-between; padding:1.25rem; }.operation__hero p { color:#efd537; font-size:.7rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }.operation__hero h1 { font-size:clamp(1.65rem,4vw,2.4rem); margin:.35rem 0; }.operation__hero span { color:rgba(255,255,255,.75); max-width:38rem; }.operation__hero-side { align-items:stretch; display:flex; flex-direction:column; gap:.6rem; }.operation__hero-side :deep(.sound-toggle) { background:rgba(255,255,255,.14); border-color:rgba(255,255,255,.35); color:#fff; justify-content:center; }.operation__hero-side :deep(.sound-toggle.muted) { background:rgba(0,0,0,.25); border-color:rgba(255,255,255,.2); color:rgba(255,255,255,.6); }.operation__stats { display:flex; flex-wrap:wrap; gap:.65rem; }.operation__stats article { align-items:center; background:#fff; border:1px solid var(--admin-line); border-radius:16px; display:flex; flex:1 1 150px; gap:.6rem; padding:.8rem; }.operation__stats article > i { align-items:center; background:rgba(35,89,49,.1); border-radius:10px; color:#235931; display:flex; height:36px; justify-content:center; width:36px; }.operation__stats span { display:flex; flex-direction:column; }.operation__stats small { color:var(--admin-muted); font-size:.65rem; font-weight:900; letter-spacing:.06em; text-transform:uppercase; }.operation__stats strong { color:#235931; font-size:1.3rem; }.operation__guide { align-items:flex-start; background:#fff8d6; border:1px solid rgba(239,213,55,.6); border-radius:14px; color:#4b4100; display:flex; font-size:.8rem; gap:.6rem; padding:.8rem; }.operation__guide i { color:#a98b00; margin-top:.1rem; }.operation__loading { align-items:center; color:var(--admin-muted); display:flex; flex-direction:column; gap:.5rem; justify-content:center; min-height:280px; }.operation__loading i { color:#235931; font-size:1.7rem; }.operation__board { align-items:flex-start; display:flex; gap:1rem; overflow-x:auto; padding-bottom:.5rem; scroll-snap-type:x mandatory; }.operation__board :deep(.column) { flex:0 0 min(340px,calc(100vw - 3rem)); scroll-snap-align:start; } @media (min-width:700px) { .operation__hero { align-items:center; flex-direction:row; } }
</style>
