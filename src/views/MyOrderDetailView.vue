<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import { useToast } from '@/composables/useToast'

function centsToDollars(cents: number): number {
  return cents / 100
}

const route = useRoute()
const router = useRouter()
const { success: toastSuccess, error: toastError } = useToast()
const order = ref<OrderDTO | null>(null)
const loading = ref(true)
const retrying = ref(false)
const statusFlash = ref(false)
let streamAbort: AbortController | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

const PICKER_STEPS = [
  { key: 'ON_HOLD', label: 'Preparando', icon: 'fa-kitchen-set' },
  { key: 'READY_FOR_PICKUP', label: 'Buscando delivery', icon: 'fa-magnifying-glass' },
  { key: 'ACCEPTED', label: 'Delivery asignado', icon: 'fa-motorcycle' },
  { key: 'ARRIVED_AT_PICKUP', label: 'En el local', icon: 'fa-store' },
  { key: 'WAY_TO_DELIVER', label: 'En camino', icon: 'fa-truck-fast' },
  { key: 'ARRIVED_AT_DELIVERY', label: 'Llegó', icon: 'fa-location-dot' },
  { key: 'COMPLETED', label: 'Entregado', icon: 'fa-circle-check' },
]

const FAILURE_STATUSES = [
  'PROVIDER_NOT_FOUND',
  'CANCELLED_BY_BUSINESS',
  'CANCELLED_BY_ADMIN',
  'CANCELLED_BY_DELIVERY_PROVIDER',
  'NOT_DELIVERED',
  'RETURNING',
  'RETURNED',
]

const FAILURE_LABELS: Record<string, string> = {
  PROVIDER_NOT_FOUND: 'Sin delivery disponible',
  CANCELLED_BY_BUSINESS: 'Cancelado',
  CANCELLED_BY_ADMIN: 'Cancelado',
  CANCELLED_BY_DELIVERY_PROVIDER: 'Cancelado',
  NOT_DELIVERED: 'No se pudo entregar',
  RETURNING: 'Devolviendo',
  RETURNED: 'Devuelto',
}

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const pickerStatus = computed(() => order.value?.picker?.currentStatus || '')
const isDelivery = computed(() => order.value?.deliveryType === 'delivery')
const isCompleted = computed(() => order.value?.status === 'delivered')
const isFailure = computed(() => FAILURE_STATUSES.includes(pickerStatus.value))

const currentStepIndex = computed(() => {
  if (!isDelivery.value) return -1
  if (isFailure.value) return -2
  return PICKER_STEPS.findIndex((s) => s.key === pickerStatus.value)
})

const hasPickerBooking = computed(() => !!order.value?.picker?.bookingId)
const showRetryButton = computed(() => {
  const o = order.value
  if (!o || !isDelivery.value) return false
  if (hasPickerBooking.value) return false
  if (o.status === 'cancelled' || o.status === 'pending') return false
  return o.audit?.some(
    (a) => a.action === 'note_added' && a.details?.toLowerCase().includes('picker booking fall')
  ) ?? false
})

const sortedAudit = computed(() => {
  if (!order.value?.audit?.length) return []
  return [...order.value.audit].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
})

const actionLabels: Record<string, string> = {
  created: 'Pedido creado',
  status_change: 'Cambio de estado',
  payment_confirmed: 'Pago confirmado',
  user_assigned: 'Usuario asignado',
  note_added: 'Nota agregada',
  branch_assigned: 'Sucursal asignada',
}

const pickerFailureReason = computed(() => {
  const o = order.value
  if (!o || !isDelivery.value) return ''
  if (!isFailure.value && !FAILURE_STATUSES.includes(pickerStatus.value)) return ''
  const entry = [...(o.audit || [])]
    .reverse()
    .find((a) => a.details?.toLowerCase().includes('picker booking fall') || a.details?.toLowerCase().includes('intento de delivery fall'))
  return entry?.details || ''
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-EC', {
    hour: '2-digit', minute: '2-digit',
  })
}

async function fetchOrder() {
  try {
    const id = route.params.id as string
    const res = await OrderService.getMineById(id)
    const newOrder = res.data

    if (order.value && newOrder.picker?.currentStatus !== order.value.picker?.currentStatus) {
      statusFlash.value = true
      setTimeout(() => { statusFlash.value = false }, 2000)
    }

    order.value = newOrder
  } catch {
    if (!order.value) {
      toastError('No pudimos cargar el detalle de la orden.')
    }
  } finally {
    loading.value = false
  }
}

async function retryPicker() {
  if (!order.value) return
  retrying.value = true
  try {
    const res = await OrderService.retryPicker(order.value._id)
    order.value = res.data.order
    toastSuccess('Delivery asignado con éxito.')
  } catch (err: any) {
    const msg = err?.response?.data?.message || 'No pudimos crear el delivery. Intenta de nuevo.'
    toastError(msg)
  } finally {
    retrying.value = false
  }
}

function applyOrderUpdate(newOrder: OrderDTO) {
  if (order.value && newOrder.picker?.currentStatus !== order.value.picker?.currentStatus) {
    statusFlash.value = true
    setTimeout(() => { statusFlash.value = false }, 2000)
  }
  order.value = newOrder
}

function startRealtime() {
  stopRealtime()
  const id = route.params.id as string
  streamAbort = OrderService.subscribeToMine(id, applyOrderUpdate, () => {
    reconnectTimer = setTimeout(startRealtime, 3000)
  })
}

function stopRealtime() {
  streamAbort?.abort()
  streamAbort = null
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

onMounted(async () => {
  await fetchOrder()
  startRealtime()
})

onUnmounted(() => {
  stopRealtime()
})
</script>

<template>
  <div class="detail-page">
    <StoreHeader />

    <main class="detail-page__main">
      <button class="detail-back" @click="router.push('/mis-ordenes')">
        <i class="fa-solid fa-arrow-left" /> Mis pedidos
      </button>

      <SkeletonLoader v-if="loading" type="card" :count="3" />

      <template v-else-if="order">
        <section class="detail-hero">
          <div class="detail-hero__copy">
            <p class="detail-hero__eyebrow">{{ order.orderNumber }}</p>
            <h1>${{ centsToDollars(order.total).toFixed(2) }}</h1>
            <div class="detail-hero__meta">
              <span class="detail-hero__date">{{ formatDate(order.createdAt || '') }}</span>
              <span class="detail-hero__type" :class="order.deliveryType">
                {{ order.deliveryType === 'delivery' ? 'Delivery' : 'Recoger' }}
              </span>
            </div>
          </div>
          <span
            class="detail-hero__status"
            :class="[order.status, { flash: statusFlash }]"
          >
            {{ statusLabels[order.status] || order.status }}
          </span>
        </section>

        <div v-if="isDelivery && hasPickerBooking" class="detail-track">
          <div class="detail-track__inner">
            <div
              v-for="(step, index) in PICKER_STEPS"
              :key="step.key"
              class="detail-ts-row"
              :class="{
                active: currentStepIndex >= index || (isCompleted && index === PICKER_STEPS.length - 1),
                current: currentStepIndex === index && !isCompleted,
                failure: isFailure && index === currentStepIndex,
              }"
            >
              <div class="detail-ts-dot">
                <i v-if="currentStepIndex > index || (isCompleted && index === PICKER_STEPS.length - 1)" class="fa-solid fa-check" />
                <i v-else-if="currentStepIndex === index && !isCompleted" :class="['fa-solid', step.icon]" />
                <i v-else-if="isFailure && index === currentStepIndex" class="fa-solid fa-circle-exclamation" />
                <i v-else class="fa-solid fa-circle" style="font-size: 8px; opacity: 0.4;" />
              </div>
              <div class="detail-ts-copy">
                <strong>{{ step.label }}</strong>
                <span v-if="currentStepIndex === index" class="detail-ts-time">
                  {{ order.updatedAt ? formatTime(order.updatedAt) : '' }}
                </span>
              </div>
            </div>
            <div v-if="isFailure" class="detail-ts-row failure active">
              <div class="detail-ts-dot">
                <i class="fa-solid fa-triangle-exclamation" />
              </div>
              <div class="detail-ts-copy">
                <strong>{{ FAILURE_LABELS[pickerStatus] || pickerStatus }}</strong>
                <span v-if="pickerFailureReason" class="detail-ts-reason">{{ pickerFailureReason }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="isDelivery && !hasPickerBooking && order.status !== 'pending' && !loading" class="detail-track">
          <div class="detail-track__inner" style="text-align: center; padding: 1.5rem;">
            <p v-if="showRetryButton" style="margin: 0 0 0.75rem; font-size: 0.9rem; color: rgba(8, 17, 13, 0.6);">
              <i class="fa-solid fa-triangle-exclamation" style="color: #efd537;" /> No pudimos asignar un delivery automáticamente.
            </p>
            <p v-else style="margin: 0; font-size: 0.9rem; color: rgba(8, 17, 13, 0.6);">
              <i class="fa-solid fa-spinner fa-spin" /> Solicitando delivery...
            </p>
            <button
              v-if="showRetryButton"
              class="detail-action detail-action--retry"
              :disabled="retrying"
              @click="retryPicker"
            >
              <i class="fa-solid fa-truck-fast" />
              {{ retrying ? 'Solicitando...' : 'Solicitar delivery ahora' }}
            </button>
          </div>
        </div>

        <div v-if="order.picker?.driverName && isDelivery" class="detail-driver">
          <div class="detail-driver__avatar">
            <img v-if="order.picker.driverPhoto" :src="order.picker.driverPhoto" alt="Conductor" />
            <i v-else class="fa-solid fa-user" />
          </div>
          <div class="detail-driver__copy">
            <strong>{{ order.picker.driverName }}</strong>
            <span v-if="order.picker.driverVehicle">{{ order.picker.driverVehicle }}</span>
            <a
              v-if="order.picker.driverPhone"
              :href="'tel:' + order.picker.driverPhone"
              class="detail-driver__call"
            >
              <i class="fa-solid fa-phone" /> {{ order.picker.driverPhone }}
            </a>
          </div>
          <a
            v-if="order.picker.smrURL"
            :href="order.picker.smrURL"
            target="_blank"
            rel="noopener noreferrer"
            class="detail-driver__track"
          >
            <i class="fa-solid fa-location-crosshairs" />
          </a>
        </div>

        <div v-if="order.picker?.validationCode && isDelivery && pickerStatus === 'ARRIVED_AT_DELIVERY'" class="detail-code">
          <div class="detail-code__inner">
            <span class="detail-code__label">Código de entrega</span>
            <strong class="detail-code__value">{{ order.picker.validationCode }}</strong>
            <p class="detail-code__desc">Comparte este código con el motorizado para completar la entrega.</p>
          </div>
        </div>

        <div v-if="order.picker?.proofOfDelivery && isCompleted" class="detail-code">
          <div class="detail-code__inner">
            <span class="detail-code__label">Comprobante de entrega</span>
            <a :href="order.picker.proofOfDelivery" target="_blank" rel="noopener noreferrer" class="detail-map-link">
              <i class="fa-solid fa-camera" /> Ver foto de entrega
            </a>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-section">
            <span class="detail-section__title"><i class="fa-solid fa-receipt" /> Costos</span>
            <div class="detail-section__body">
              <div class="detail-row">
                <span>Subtotal</span>
                <strong>${{ centsToDollars(order.subtotal).toFixed(2) }}</strong>
              </div>
              <div v-if="order.deliveryType === 'delivery'" class="detail-row">
                <span>Envío</span>
                <strong>${{ centsToDollars(order.deliveryCost ?? 0).toFixed(2) }}</strong>
              </div>
              <div class="detail-row detail-row--total">
                <span>Total</span>
                <strong>${{ centsToDollars(order.total).toFixed(2) }}</strong>
              </div>
            </div>
          </div>

          <div v-if="order.items?.length" class="detail-section">
            <span class="detail-section__title"><i class="fa-solid fa-utensils" /> Productos</span>
            <div class="detail-section__body">
              <div v-for="item in order.items" :key="item.name" class="detail-product">
                <div class="detail-product__media">
                  <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
                  <i v-else class="fa-solid fa-utensils" />
                </div>
                <div class="detail-product__copy">
                  <strong>{{ item.name }}</strong>
                  <span>x{{ item.quantity }}</span>
                </div>
                <span class="detail-product__price">${{ (item.price * item.quantity).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <span class="detail-section__title">
              <i class="fa-solid fa-truck" /> {{ order.deliveryType === 'delivery' ? 'Delivery' : 'Recoger en sucursal' }}
            </span>
            <div class="detail-section__body">
              <div v-if="order.deliveryType === 'pickup'" class="detail-pickup-msg">
                <i class="fa-solid fa-store" /> Pedido para recoger en sucursal.
              </div>
              <template v-else>
                <div class="detail-row">
                  <span>Dirección</span>
                  <strong>{{ order.deliveryAddress || '—' }}</strong>
                </div>
                <div v-if="order.deliveryDistance" class="detail-row">
                  <span>Distancia</span>
                  <strong>{{ order.deliveryDistance.toFixed(1) }} km</strong>
                </div>
                <div v-if="order.deliveryGoogleMapsUrl" class="detail-map-wrap">
                  <a :href="order.deliveryGoogleMapsUrl" target="_blank" rel="noopener noreferrer" class="detail-map-link">
                    <i class="fa-solid fa-map" /> Ver en Google Maps
                  </a>
                </div>
                <a
                  v-if="order.picker?.smrURL"
                  :href="order.picker.smrURL"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="detail-action detail-action--track"
                >
                  <i class="fa-solid fa-location-crosshairs" /> Seguir en vivo
                </a>
              </template>
            </div>
          </div>

          <div v-if="order.picker" class="detail-section detail-section--highlight">
            <span class="detail-section__title"><i class="fa-solid fa-location-dot" /> Delivery Picker</span>
            <div class="detail-section__body">
              <div class="detail-row">
                <span>Booking ID</span>
                <strong class="detail-mono">{{ order.picker.bookingId }}</strong>
              </div>
              <div v-if="order.picker.bookingNumericId" class="detail-row">
                <span>Booking #</span>
                <strong>{{ order.picker.bookingNumericId }}</strong>
              </div>
              <div v-if="order.picker.currentStatus" class="detail-row">
                <span>Estado interno</span>
                <strong>{{ order.picker.currentStatus }}</strong>
              </div>
              <div v-if="order.picker.statusText" class="detail-row">
                <span>Estado</span>
                <strong>{{ order.picker.statusText }}</strong>
              </div>
              <div v-if="order.picker.createdAt" class="detail-row">
                <span>Creado</span>
                <strong>{{ formatDate(order.picker.createdAt) }}</strong>
              </div>
              <div v-if="order.picker.smrURL" class="detail-map-wrap">
                <a :href="order.picker.smrURL" target="_blank" rel="noopener noreferrer" class="detail-map-link">
                  <i class="fa-solid fa-location-crosshairs" /> Ver tracking
                </a>
              </div>
              <div v-if="order.picker.bookingDetailUrl" class="detail-map-wrap">
                <a :href="order.picker.bookingDetailUrl" target="_blank" rel="noopener noreferrer" class="detail-map-link">
                  <i class="fa-solid fa-external-link" /> Detalle del delivery
                </a>
              </div>
            </div>
          </div>

          <div v-if="sortedAudit.length" class="detail-section detail-section--full">
            <span class="detail-section__title"><i class="fa-solid fa-list-timeline" /> Auditoría</span>
            <div class="detail-section__body">
              <div v-for="entry in sortedAudit" :key="entry.timestamp" class="detail-audit-row">
                <span class="detail-audit-dot" />
                <div class="detail-audit-copy">
                  <strong>{{ actionLabels[entry.action] || entry.action }}</strong>
                  <span v-if="entry.details" class="detail-audit-details">{{ entry.details }}</span>
                  <div class="detail-audit-meta">
                    <span v-if="entry.performedByEmail" class="detail-audit-who">{{ entry.performedByEmail }}</span>
                    <span class="detail-audit-when">{{ formatDate(entry.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="order.notes" class="detail-section detail-section--full">
            <span class="detail-section__title"><i class="fa-solid fa-pen" /> Notas del pedido</span>
            <div class="detail-section__body">
              <p class="detail-notes">{{ order.notes }}</p>
            </div>
          </div>

          <div v-if="order.branch" class="detail-section">
            <span class="detail-section__title"><i class="fa-solid fa-store" /> Sucursal</span>
            <div class="detail-section__body">
              <div class="detail-row">
                <strong>{{ (order.branch as any).name || order.branch }}</strong>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <span class="detail-section__title"><i class="fa-solid fa-user" /> Cliente</span>
            <div class="detail-section__body">
              <div class="detail-row">
                <span>Nombre</span>
                <strong>{{ order.customerName || '—' }}</strong>
              </div>
              <div class="detail-row">
                <span>Email</span>
                <strong>{{ order.customerEmail }}</strong>
              </div>
              <div v-if="order.customerPhone" class="detail-row">
                <span>Teléfono</span>
                <strong>{{ order.customerPhone }}</strong>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="detail-error">
        <i class="fa-solid fa-circle-exclamation" /> Orden no encontrada.
      </div>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.detail-page {
  background:
    radial-gradient(circle at 10% 0%, rgba(239, 213, 55, 0.16), transparent 34%),
    linear-gradient(180deg, #f8f6ec 0%, #f4f4f0 48%, #fff 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.detail-page__main {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  gap: clamp(0.75rem, 2vw, 1rem);
  margin: 0 auto;
  max-width: 900px;
  padding: calc(60px + clamp(1rem, 3vw, 1.5rem)) 1rem clamp(3rem, 7vw, 6rem);
  width: 100%;
}

.detail-back {
  align-items: center;
  align-self: flex-start;
  background: rgba(35, 89, 49, 0.06);
  border-radius: 999px;
  color: #235931;
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 0.4rem;
  padding: 0.5rem 0.85rem;
  transition: background-color 0.2s ease;
}

.detail-back:hover { background: rgba(35, 89, 49, 0.12); }

.detail-hero {
  background:
    radial-gradient(circle at 92% 8%, rgba(239, 213, 55, 0.2), transparent 24%),
    linear-gradient(135deg, #235931, #102719 72%);
  border-radius: 24px;
  box-shadow: 0 22px 50px rgba(35, 89, 49, 0.18);
  color: #fff;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: clamp(1.25rem, 4vw, 2rem);
  position: relative;
  overflow: hidden;
}

.detail-hero::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -10%;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  background: rgba(239, 213, 55, 0.08);
  pointer-events: none;
}

.detail-hero__copy { display: flex; flex-direction: column; gap: 0.35rem; position: relative; z-index: 1; }

.detail-hero__eyebrow {
  color: #efd537;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.detail-hero h1 {
  font-size: clamp(2rem, 5vw, 3.2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
}

.detail-hero__meta {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.15rem;
}

.detail-hero__date {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.82rem;
}

.detail-hero__type {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  text-transform: capitalize;
}

.detail-hero__type.pickup { background: rgba(239, 213, 55, 0.15); color: #efd537; }

.detail-hero__status {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 999px;
  color: #fff;
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.45rem 0.85rem;
  text-transform: capitalize;
  white-space: nowrap;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.detail-hero__status.flash {
  background: #efd537;
  color: #102719;
  transform: scale(1.05);
}

.detail-hero__status.cancelled { background: rgba(160, 40, 40, 0.25); color: #ffcfcf; }
.detail-hero__status.delivered { background: rgba(0, 165, 35, 0.2); color: #b8f0c5; }

.detail-track {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 18px;
  overflow: hidden;
}

.detail-track__inner {
  padding: clamp(0.75rem, 2vw, 1.25rem) clamp(1rem, 3vw, 1.5rem);
}

.detail-ts-row {
  align-items: center;
  display: flex;
  gap: 0.85rem;
  padding: 0.4rem 0;
  position: relative;
  opacity: 0.35;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.detail-ts-row.active {
  opacity: 1;
}

.detail-ts-row.current .detail-ts-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}

.detail-ts-row.failure .detail-ts-dot {
  background: #a02828;
  border-color: #a02828;
}

.detail-ts-row.failure.active {
  opacity: 1;
}

.detail-ts-row:not(:last-child)::before {
  background: rgba(26, 26, 26, 0.06);
  content: '';
  height: calc(100% + 0.4rem);
  left: 18px;
  position: absolute;
  top: 32px;
  width: 2px;
  transition: background 0.3s ease;
}

.detail-ts-row.active:not(:last-child)::before {
  background: #235931;
}

.detail-ts-dot {
  align-items: center;
  background: rgba(26, 26, 26, 0.08);
  border: 2px solid transparent;
  border-radius: 50%;
  color: rgba(26, 26, 26, 0.2);
  display: flex;
  flex: 0 0 38px;
  font-size: 0.9rem;
  height: 38px;
  justify-content: center;
  position: relative;
  transition: all 0.35s ease;
  width: 38px;
  z-index: 1;
}

.detail-ts-row.active .detail-ts-dot {
  background: #235931;
  border-color: #235931;
  color: #fff;
  box-shadow: 0 0 0 5px rgba(35, 89, 49, 0.1);
}

.detail-ts-row.failure.active .detail-ts-dot {
  background: #a02828;
  border-color: #a02828;
  box-shadow: 0 0 0 5px rgba(160, 40, 40, 0.1);
}

.detail-ts-copy {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
}

.detail-ts-copy strong {
  font-size: 0.9rem;
  font-weight: 700;
}

.detail-ts-row:not(.active) .detail-ts-copy strong {
  font-weight: 500;
}

.detail-ts-row.active .detail-ts-copy strong {
  color: #235931;
}

.detail-ts-time {
  color: rgba(8, 17, 13, 0.4);
  font-size: 0.72rem;
}

.detail-ts-reason {
  color: rgba(160, 40, 40, 0.7);
  font-size: 0.78rem;
  line-height: 1.4;
  margin-top: 0.15rem;
}

@keyframes pulse-dot {
  0%, 100% { box-shadow: 0 0 0 5px rgba(35, 89, 49, 0.1); }
  50% { box-shadow: 0 0 0 12px rgba(35, 89, 49, 0.04), 0 0 0 5px rgba(35, 89, 49, 0.15); }
}

.detail-driver {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(35, 89, 49, 0.1);
  border-radius: 18px;
  display: flex;
  gap: 0.85rem;
  padding: clamp(0.7rem, 2vw, 1rem);
  transition: all 0.3s ease;
  animation: slideUp 0.4s ease;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.detail-driver__avatar {
  align-items: center;
  background: linear-gradient(135deg, #235931, #00a523);
  border-radius: 50%;
  color: #fff;
  display: flex;
  flex: 0 0 52px;
  font-size: 1.2rem;
  height: 52px;
  justify-content: center;
  overflow: hidden;
}

.detail-driver__avatar img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.detail-driver__copy {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.detail-driver__copy strong { font-size: 0.95rem; }

.detail-driver__copy span { color: rgba(8, 17, 13, 0.5); font-size: 0.8rem; }

.detail-driver__call {
  align-items: center;
  color: #235931;
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 700;
  gap: 0.3rem;
  margin-top: 0.2rem;
  text-decoration: none;
}

.detail-driver__track {
  align-items: center;
  background: #235931;
  border-radius: 50%;
  color: #fff;
  display: flex;
  flex: 0 0 44px;
  font-size: 1.1rem;
  height: 44px;
  justify-content: center;
  text-decoration: none;
  transition: all 0.2s ease;
}

.detail-driver__track:hover { background: #00a523; transform: scale(1.05); }

.detail-code {
  animation: slideUp 0.4s ease 0.1s both;
}

.detail-code__inner {
  background: linear-gradient(135deg, #efd537, #f5e06b);
  border-radius: 18px;
  color: #102719;
  padding: clamp(1rem, 3vw, 1.5rem);
  text-align: center;
}

.detail-code__label {
  display: block;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: 0.25rem;
}

.detail-code__value {
  display: block;
  font-size: clamp(2rem, 6vw, 3.5rem);
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1.1;
  margin-bottom: 0.25rem;
}

.detail-code__desc {
  font-size: 0.78rem;
  margin: 0;
  opacity: 0.7;
}

.detail-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.detail-section {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  flex: 1 1 calc(50% - 0.75rem);
  min-width: 16rem;
  overflow: hidden;
}

.detail-section--full { flex: 1 1 100%; }

.detail-section--highlight {
  border-color: rgba(35, 89, 49, 0.18);
  background: rgba(35, 89, 49, 0.04);
}

.detail-section__title {
  align-items: center;
  border-bottom: 1px solid rgba(35, 89, 49, 0.06);
  color: rgba(8, 17, 13, 0.5);
  display: flex;
  font-size: 0.7rem;
  font-weight: 800;
  gap: 0.35rem;
  letter-spacing: 0.08em;
  padding: 0.75rem 1rem;
  text-transform: uppercase;
}

.detail-section__title i { color: #235931; font-size: 0.72rem; }

.detail-section__body {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.85rem 1rem;
}

.detail-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.detail-row span { color: rgba(8, 17, 13, 0.6); font-size: 0.85rem; }
.detail-row strong { font-size: 0.88rem; text-align: right; }

.detail-row--total {
  border-top: 1px solid rgba(35, 89, 49, 0.1);
  padding-top: 0.4rem;
}

.detail-row--total span { color: rgba(8, 17, 13, 0.8); font-weight: 700; }
.detail-row--total strong { color: #235931; font-size: 1rem; }

.detail-mono {
  font-family: monospace;
  font-size: 0.78rem;
  word-break: break-all;
}

.detail-product {
  align-items: center;
  display: flex;
  gap: 0.6rem;
  padding: 0.3rem 0;
}

.detail-product:not(:last-child) { border-bottom: 1px solid rgba(26, 26, 26, 0.04); }

.detail-product__media {
  background: linear-gradient(145deg, #eef1e6, #dfe8d9);
  border-radius: 10px;
  flex: 0 0 40px;
  height: 40px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail-product__media img { height: 100%; object-fit: cover; width: 100%; }
.detail-product__media i { color: #235931; font-size: 0.85rem; }

.detail-product__copy {
  align-items: center;
  display: flex;
  flex: 1 1 0;
  gap: 0.4rem;
  min-width: 0;
}

.detail-product__copy strong {
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-product__copy span { color: rgba(8, 17, 13, 0.45); font-size: 0.78rem; }
.detail-product__price { color: #235931; font-weight: 700; font-size: 0.85rem; flex: 0 0 auto; }

.detail-pickup-msg {
  align-items: center;
  color: rgba(8, 17, 13, 0.6);
  display: flex;
  font-size: 0.85rem;
  gap: 0.4rem;
  line-height: 1.5;
}

.detail-pickup-msg i { color: #235931; }

.detail-map-wrap { margin-top: 0.1rem; }

.detail-map-link {
  color: #235931;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.detail-action {
  align-items: center;
  border-radius: 12px;
  display: flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 0.4rem;
  justify-content: center;
  margin-top: 0.35rem;
  min-height: 44px;
  padding: 0.6rem 0.8rem;
  transition: all 0.2s ease;
  width: 100%;
}

.detail-action--track {
  background: #235931;
  color: #fff;
}

.detail-action--track:hover { background: #00a523; transform: translateY(-1px); }

.detail-action--retry {
  background: #efd537;
  color: #102719;
}

.detail-action--retry:hover:not(:disabled) { background: #f5e06b; transform: translateY(-1px); }
.detail-action--retry:disabled { opacity: 0.6; cursor: not-allowed; }

.detail-audit-row {
  display: flex;
  gap: 0.7rem;
  padding: 0.45rem 0;
  position: relative;
}

.detail-audit-row:not(:last-child)::before {
  background: rgba(35, 89, 49, 0.1);
  content: '';
  height: calc(100% + 0.45rem);
  left: 6px;
  position: absolute;
  top: 18px;
  width: 2px;
}

.detail-audit-dot {
  background: #235931;
  border-radius: 50%;
  flex: 0 0 14px;
  height: 14px;
  margin-top: 3px;
  width: 14px;
}

.detail-audit-copy { display: flex; flex-direction: column; gap: 0.1rem; flex: 1 1 0; }
.detail-audit-copy strong { font-size: 0.85rem; }

.detail-audit-details { color: rgba(8, 17, 13, 0.55); font-size: 0.8rem; line-height: 1.45; }

.detail-audit-meta {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.detail-audit-who { color: rgba(8, 17, 13, 0.45); font-size: 0.74rem; }
.detail-audit-when { color: rgba(8, 17, 13, 0.38); font-size: 0.72rem; }

.detail-notes {
  color: rgba(8, 17, 13, 0.7);
  font-size: 0.88rem;
  line-height: 1.5;
}

.detail-error {
  align-items: center;
  background: rgba(160, 40, 40, 0.06);
  border: 1px solid rgba(160, 40, 40, 0.12);
  border-radius: 14px;
  color: #a02828;
  display: flex;
  font-size: 0.9rem;
  font-weight: 600;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
}

@media (min-width: 600px) {
  .detail-hero { align-items: center; }
  .detail-section { flex: 1 1 calc(50% - 0.75rem); }
  .detail-section--full { flex: 1 1 100%; }
}

@media (min-width: 900px) {
  .detail-page__main { padding-left: 1.5rem; padding-right: 1.5rem; }
}
</style>
