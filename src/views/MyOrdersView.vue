<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import { useToast } from '@/composables/useToast'

function centsToDollars(cents: number): number {
  return cents / 100
}

const router = useRouter()
const orders = ref<OrderDTO[]>([])
const { success: toastSuccess, error: toastError } = useToast()
const loading = ref(true)
const retrying = ref<string | null>(null)
const expandedId = ref<string | null>(null)
const errorMessage = ref('')
const activeFilter = ref('all')

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  preparing: 'Preparando',
  awaiting_pickup: 'Esperando recolección',
  ready: 'En entrega',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const filterOptions = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'paid', label: 'Pagados' },
  { key: 'preparing', label: 'Preparando' },
  { key: 'awaiting_pickup', label: 'Esperando recolección' },
  { key: 'ready', label: 'En entrega' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'cancelled', label: 'Cancelados' },
]

const filteredOrders = computed(() => {
  if (activeFilter.value === 'all') return orders.value
  return orders.value.filter((o) => o.status === activeFilter.value)
})

const actionLabels: Record<string, string> = {
  created: 'Pedido creado',
  status_change: 'Cambio de estado',
  payment_confirmed: 'Pago confirmado',
  user_assigned: 'Usuario asignado',
  note_added: 'Nota agregada',
  branch_assigned: 'Sucursal asignada',
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('es-EC', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateShort(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' })
}

function hasPickerFailed(order: OrderDTO): boolean {
  if (order.deliveryType !== 'delivery') return false
  if (order.picker?.bookingId) return false
  if (order.status === 'cancelled') return false
  if (order.status === 'pending') return false
  const failedAudit = order.audit?.find(
    (a) => a.action === 'note_added' && a.details?.toLowerCase().includes('picker booking fall')
  )
  return !!failedAudit
}

function timelineEntries(order: OrderDTO) {
  const steps = ['pending', 'paid', 'preparing', 'awaiting_pickup', 'ready', 'delivered']
  const idx = steps.indexOf(order.status)
  return steps.map((key, i) => ({
    key,
    label: statusLabels[key],
    active: idx >= i && order.status !== 'cancelled',
  }))
}

function sortedAudit(order: OrderDTO) {
  if (!order.audit?.length) return []
  return [...order.audit].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

async function retryPicker(orderId: string) {
  retrying.value = orderId
  try {
    const res = await OrderService.retryPicker(orderId)
    const updated = res.data.order
    const idx = orders.value.findIndex((o) => o._id === orderId)
    if (idx !== -1) orders.value[idx] = updated
    toastSuccess('Delivery asignado con éxito. Revisa el seguimiento.')
  } catch (err: any) {
    const msg = err?.response?.data?.message || 'No pudimos crear el delivery. Intenta de nuevo más tarde.'
    toastError(msg)
  } finally {
    retrying.value = null
  }
}

onMounted(async () => {
  try {
    const res = await OrderService.getMine()
    orders.value = res.data
  } catch {
    errorMessage.value = 'No pudimos cargar tus pedidos. Intenta de nuevo.'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="morders-page">
    <StoreHeader />

    <main class="morders-page__main">
      <section class="morders-hero">
        <div class="morders-hero__copy">
          <p class="morders-hero__eyebrow"><i class="fa-solid fa-box" /> Mis pedidos</p>
          <h1>Tus <span>pedidos.</span></h1>
          <p>Todos tus pedidos realizados en Boloncity, con su estado y seguimiento.</p>
        </div>
        <button class="morders-hero__cta" @click="router.push('/catalogo')">
          <i class="fa-solid fa-plus" /> Nuevo pedido
        </button>
      </section>

      <section class="morders-shell">
        <Transition name="fade-slide" mode="out-in">
          <SkeletonLoader v-if="loading" key="loading" type="list" :count="4" />

          <div v-else-if="errorMessage" key="error" class="morders-error">
            <i class="fa-solid fa-circle-exclamation" /> {{ errorMessage }}
          </div>

          <div v-else-if="!orders.length" key="empty" class="morders-empty">
            <i class="fa-solid fa-box-open" />
            <p>Aún no has realizado pedidos</p>
            <span>Cuando hagas tu primera compra, aquí podrás ver el estado y seguimiento.</span>
            <button class="btn-primary" @click="router.push('/catalogo')">
              <i class="fa-solid fa-utensils" /> Ver menú
            </button>
          </div>

          <div v-else key="list" class="morders-list">
            <div class="morders-filter">
              <button
                v-for="opt in filterOptions"
                :key="opt.key"
                class="morders-filter__pill"
                :class="{ active: activeFilter === opt.key }"
                @click="activeFilter = opt.key"
              >
                {{ opt.label }}
              </button>
            </div>

            <TransitionGroup name="card-pop" tag="div" class="morders-cards">
              <router-link
                v-for="order in filteredOrders"
                :key="order._id"
                :to="'/mis-ordenes/' + order._id"
                class="morders-card"
                :class="[order.status, { expanded: expandedId === order._id }]"
              >
                <button class="morders-card__head" @click.stop="toggleExpand(order._id)">
                  <span class="morders-card__accent"></span>
                  <div class="morders-card__head-body">
                    <div class="morders-card__head-top">
                      <strong class="morders-card__number">{{ order.orderNumber }}</strong>
                      <span class="morders-card__date">{{ formatDateShort(order.createdAt || '') }}</span>
                    </div>
                    <div class="morders-card__head-mid">
                      <span v-if="order.branch" class="morders-card__branch">
                        <i class="fa-solid fa-store" /> {{ (order.branch as any).name || order.branch }}
                      </span>
                      <span v-if="order.items?.length" class="morders-card__items-count">
                        {{ order.items.length }} {{ order.items.length === 1 ? 'producto' : 'productos' }}
                      </span>
                      <span class="morders-card__delivery-badge" :class="order.deliveryType">
                        {{ order.deliveryType === 'delivery' ? 'Delivery' : 'Recoger' }}
                      </span>
                    </div>
                    <div class="morders-card__head-bottom">
                      <span class="morders-card__total">${{ centsToDollars(order.total).toFixed(2) }}</span>
                      <span class="morders-card__status" :class="order.status">
                        {{ statusLabels[order.status] || order.status }}
                      </span>
                    </div>
                  </div>
                  <div class="morders-card__chevron-wrap">
                    <i class="fa-solid fa-chevron-down morders-card__chevron" />
                  </div>
                </button>

                <div class="morders-card__body" :class="{ open: expandedId === order._id }">
                  <div class="morders-card__body-inner">
                      <div class="morders-card__section">
                        <span class="morders-card__section-title"><i class="fa-solid fa-receipt" /> Costos</span>
                        <div class="morders-card__row">
                          <span>Subtotal</span>
                          <strong>${{ centsToDollars(order.subtotal).toFixed(2) }}</strong>
                        </div>
                        <div v-if="order.deliveryType === 'delivery'" class="morders-card__row">
                          <span>Envío</span>
                          <strong>${{ centsToDollars(order.deliveryCost ?? 0).toFixed(2) }}</strong>
                        </div>
                        <div class="morders-card__row morders-card__row--total">
                          <span>Total</span>
                          <strong>${{ centsToDollars(order.total).toFixed(2) }}</strong>
                        </div>
                      </div>

                      <div v-if="order.items?.length" class="morders-card__section">
                        <span class="morders-card__section-title"><i class="fa-solid fa-utensils" /> Productos</span>
                        <div v-for="item in order.items" :key="item.name" class="morders-card__product">
                          <div class="morders-card__product-media">
                            <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
                            <i v-else class="fa-solid fa-utensils" />
                          </div>
                          <div class="morders-card__product-copy">
                            <strong>{{ item.name }}</strong>
                            <span>x{{ item.quantity }}</span>
                          </div>
                          <span class="morders-card__product-price">${{ (item.price * item.quantity).toFixed(2) }}</span>
                        </div>
                      </div>

                      <div class="morders-card__section">
                        <span class="morders-card__section-title"><i class="fa-solid fa-clock" /> Estado</span>
                        <div class="morders-card__timeline">
                          <div
                            v-for="step in timelineEntries(order)"
                            :key="step.key"
                            class="morders-card__tl-row"
                            :class="{ active: step.active }"
                          >
                            <span class="morders-card__tl-dot" :class="{ done: step.active }"></span>
                            <span class="morders-card__tl-label">{{ step.label }}</span>
                          </div>
                        </div>
                        <div v-if="order.status === 'cancelled'" class="morders-card__cancelled">
                          <i class="fa-solid fa-ban" /> Pedido cancelado
                        </div>
                      </div>

                      <div class="morders-card__section">
                        <span class="morders-card__section-title">
                          <i class="fa-solid fa-truck" /> {{ order.deliveryType === 'delivery' ? 'Delivery' : 'Recoger en sucursal' }}
                        </span>
                        <div v-if="order.deliveryType === 'pickup'" class="morders-card__pickup-msg">
                          <i class="fa-solid fa-store" /> Pedido para recoger en sucursal. Espera la notificación de que está listo.
                        </div>
                        <template v-else>
                          <div class="morders-card__row">
                            <span>Dirección</span>
                            <strong>{{ order.deliveryAddress || '—' }}</strong>
                          </div>
                          <div v-if="order.deliveryGoogleMapsUrl" class="morders-card__map-wrap">
                            <a :href="order.deliveryGoogleMapsUrl" target="_blank" rel="noopener noreferrer" class="morders-card__map-link">
                              <i class="fa-solid fa-map" /> Ver en Google Maps
                            </a>
                          </div>
                          <a
                            v-if="order.picker?.smrURL"
                            :href="order.picker.smrURL"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="morders-card__action-btn morders-card__action-btn--track"
                          >
                            <i class="fa-solid fa-location-crosshairs" /> Seguir delivery en vivo
                          </a>
                          <button
                            v-else-if="hasPickerFailed(order)"
                            class="morders-card__action-btn morders-card__action-btn--retry"
                            :disabled="retrying === order._id"
                            @click.stop="retryPicker(order._id)"
                          >
                            <i class="fa-solid fa-truck-fast" />
                            {{ retrying === order._id ? 'Solicitando...' : 'Solicitar delivery' }}
                          </button>
                        </template>
                      </div>

                      <div v-if="sortedAudit(order).length" class="morders-card__section">
                        <span class="morders-card__section-title">
                          <i class="fa-solid fa-list-timeline" /> Auditoría
                        </span>
                        <div v-for="entry in sortedAudit(order)" :key="entry.timestamp" class="morders-card__audit-row">
                          <span class="morders-card__audit-dot"></span>
                          <div class="morders-card__audit-copy">
                            <strong>{{ actionLabels[entry.action] || entry.action }}</strong>
                            <span v-if="entry.details" class="morders-card__audit-details">{{ entry.details }}</span>
                            <span class="morders-card__audit-when">{{ formatDate(entry.timestamp) }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
              </router-link>
            </TransitionGroup>

            <p v-if="!filteredOrders.length && orders.length" class="morders-no-results">
              <i class="fa-solid fa-filter" /> No hay pedidos con este estado.
            </p>
          </div>
        </Transition>
      </section>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.morders-page {
  background:
    radial-gradient(circle at 10% 0%, rgba(239, 213, 55, 0.16), transparent 34%),
    linear-gradient(180deg, #f8f6ec 0%, #f4f4f0 48%, #fff 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.morders-page__main {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  gap: clamp(1rem, 3vw, 1.5rem);
  margin: 0 auto;
  max-width: 1180px;
  padding: calc(60px + clamp(1.25rem, 4vw, 2.5rem)) 1rem clamp(2.5rem, 6vw, 5rem);
  width: 100%;
}

.morders-hero {
  background:
    radial-gradient(circle at 92% 8%, rgba(239, 213, 55, 0.2), transparent 24%),
    linear-gradient(135deg, #235931, #102719 72%);
  border-radius: 28px;
  box-shadow: 0 26px 60px rgba(35, 89, 49, 0.2);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: clamp(1.4rem, 5vw, 3rem);
  position: relative;
}

.morders-hero__copy { position: relative; z-index: 1; }

.morders-hero__eyebrow {
  color: #efd537;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
}

.morders-hero h1 {
  font-size: clamp(2.5rem, 7vw, 5.5rem);
  font-weight: 900;
  letter-spacing: -0.065em;
  line-height: 0.88;
  text-transform: uppercase;
}

.morders-hero h1 span {
  color: transparent;
  display: block;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.82);
}

.morders-hero__copy > p:last-child {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  line-height: 1.6;
  margin-top: 1rem;
}

.morders-hero__cta {
  align-items: center;
  background: #efd537;
  border-radius: 999px;
  color: #102719;
  display: inline-flex;
  font-size: 0.88rem;
  font-weight: 800;
  gap: 0.45rem;
  padding: 0.7rem 1.1rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
  align-self: flex-start;
}

.morders-hero__cta:hover { background: #f5e06b; transform: translateY(-1px); }

.morders-shell {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 28px;
  box-shadow: 0 22px 54px rgba(26, 26, 26, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(1.15rem, 4vw, 1.75rem);
}

.morders-error {
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

.morders-empty {
  align-items: center;
  background: rgba(35, 89, 49, 0.04);
  border: 1px dashed rgba(35, 89, 49, 0.2);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 2rem 1rem;
  text-align: center;
}

.morders-empty i { color: #235931; font-size: 1.6rem; opacity: 0.6; }
.morders-empty p { color: rgba(8, 17, 13, 0.7); font-weight: 600; font-size: 1.05rem; }

.morders-empty span {
  color: rgba(8, 17, 13, 0.45);
  font-size: 0.85rem;
  line-height: 1.5;
  max-width: 26rem;
}

.morders-filter {
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: none;
  flex-wrap: wrap;
}

.morders-filter::-webkit-scrollbar { display: none; }

.morders-filter__pill {
  background: rgba(35, 89, 49, 0.05);
  border: 1px solid rgba(35, 89, 49, 0.1);
  border-radius: 999px;
  color: rgba(8, 17, 13, 0.6);
  font-size: 0.78rem;
  font-weight: 700;
  min-height: 34px;
  padding: 0.35rem 0.85rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.morders-filter__pill:hover { background: rgba(35, 89, 49, 0.08); }

.morders-filter__pill.active {
  background: #235931;
  border-color: #235931;
  color: #fff;
}

.morders-cards { display: flex; flex-direction: column; gap: 0.75rem; }

.morders-card {
  background: #fff;
  border: 1px solid rgba(35, 89, 49, 0.1);
  border-radius: 18px;
  cursor: pointer;
  display: block;
  overflow: hidden;
  text-decoration: none;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
}

.morders-card:hover { border-color: rgba(35, 89, 49, 0.18); }

.morders-card.expanded {
  border-color: rgba(35, 89, 49, 0.22);
  box-shadow: 0 8px 28px rgba(35, 89, 49, 0.08);
}

.morders-card__head {
  display: flex;
  text-align: left;
  width: 100%;
  transition: background-color 0.2s ease;
  position: relative;
}

.morders-card__head:hover { background: rgba(35, 89, 49, 0.02); }

.morders-card__accent {
  flex: 0 0 4px;
  min-height: 100%;
  background: rgba(35, 89, 49, 0.2);
}

.morders-card.pending .morders-card__accent { background: #efd537; }
.morders-card.paid .morders-card__accent { background: #235931; }
.morders-card.preparing .morders-card__accent { background: #00a523; }
.morders-card.ready .morders-card__accent { background: #0066cc; }
.morders-card.delivered .morders-card__accent { background: #00a523; }
.morders-card.cancelled .morders-card__accent { background: #a02828; }

.morders-card__head-body {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  gap: 0.4rem;
  padding: 1rem 0.85rem 1rem 1rem;
  min-width: 0;
}

.morders-card__head-top {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.morders-card__number {
  font-size: 0.95rem;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.morders-card__date {
  color: rgba(8, 17, 13, 0.4);
  font-size: 0.75rem;
  flex: 0 0 auto;
}

.morders-card__head-mid {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.morders-card__branch {
  align-items: center;
  color: rgba(8, 17, 13, 0.55);
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 600;
  gap: 0.3rem;
}

.morders-card__branch i { color: #235931; font-size: 0.72rem; }

.morders-card__items-count {
  color: rgba(8, 17, 13, 0.4);
  font-size: 0.75rem;
}

.morders-card__delivery-badge {
  background: rgba(35, 89, 49, 0.06);
  border-radius: 999px;
  color: #235931;
  font-size: 0.68rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
  text-transform: capitalize;
}

.morders-card__delivery-badge.pickup {
  background: rgba(239, 213, 55, 0.15);
  color: #8a7a1e;
}

.morders-card__head-bottom {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}

.morders-card__total {
  color: #235931;
  font-size: 1.05rem;
  font-weight: 800;
}

.morders-card__status {
  background: rgba(35, 89, 49, 0.08);
  border-radius: 999px;
  color: #235931;
  font-size: 0.7rem;
  font-weight: 800;
  min-height: 28px;
  padding: 0.3rem 0.65rem;
  text-transform: capitalize;
}

.morders-card__status.cancelled { background: rgba(160, 40, 40, 0.08); color: #a02828; }
.morders-card__status.delivered { background: rgba(0, 165, 35, 0.1); color: #00a523; }

.morders-card__chevron-wrap {
  align-items: center;
  display: flex;
  padding: 0 1rem 0 0.5rem;
}

.morders-card__chevron {
  color: rgba(8, 17, 13, 0.2);
  font-size: 0.8rem;
  transition: transform 0.3s cubic-bezier(0.65, 0, 0.35, 1);
}

.morders-card.expanded .morders-card__chevron { transform: rotate(180deg); }

.morders-card__body {
  border-top: 1px solid rgba(35, 89, 49, 0.06);
  background: rgba(35, 89, 49, 0.015);
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  transition: max-height 0.45s cubic-bezier(0.65, 0, 0.35, 1),
              opacity 0.3s ease,
              padding 0.3s ease;
  padding: 0;
}

.morders-card__body.open {
  max-height: 3000px;
  opacity: 1;
  padding: 0;
}

.morders-card__body-inner {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1rem;
}

.morders-card__section {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(35, 89, 49, 0.06);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem;
}

.morders-card__section-title {
  align-items: center;
  color: rgba(8, 17, 13, 0.5);
  display: flex;
  font-size: 0.68rem;
  font-weight: 800;
  gap: 0.35rem;
  letter-spacing: 0.08em;
  margin-bottom: 0.1rem;
  text-transform: uppercase;
}

.morders-card__section-title i { color: #235931; font-size: 0.7rem; }

.morders-card__row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.morders-card__row span { color: rgba(8, 17, 13, 0.6); font-size: 0.85rem; }
.morders-card__row strong { font-size: 0.88rem; text-align: right; }

.morders-card__row--total {
  border-top: 1px solid rgba(35, 89, 49, 0.1);
  padding-top: 0.4rem;
}

.morders-card__row--total span { color: rgba(8, 17, 13, 0.8); font-weight: 700; }
.morders-card__row--total strong { color: #235931; font-size: 1rem; }

.morders-card__product {
  align-items: center;
  display: flex;
  gap: 0.6rem;
  padding: 0.3rem 0;
}

.morders-card__product:not(:last-child) { border-bottom: 1px solid rgba(26, 26, 26, 0.04); }

.morders-card__product-media {
  background: linear-gradient(145deg, #eef1e6, #dfe8d9);
  border-radius: 10px;
  flex: 0 0 38px;
  height: 38px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.morders-card__product-media img { height: 100%; object-fit: cover; width: 100%; }
.morders-card__product-media i { color: #235931; font-size: 0.85rem; }

.morders-card__product-copy {
  align-items: center;
  display: flex;
  flex: 1 1 0;
  gap: 0.4rem;
  min-width: 0;
}

.morders-card__product-copy strong {
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.morders-card__product-copy span { color: rgba(8, 17, 13, 0.45); font-size: 0.78rem; flex: 0 0 auto; }
.morders-card__product-price { color: #235931; font-weight: 700; font-size: 0.85rem; flex: 0 0 auto; }

.morders-card__timeline { display: flex; flex-direction: column; gap: 0.3rem; }

.morders-card__tl-row {
  align-items: center;
  color: rgba(26, 26, 26, 0.5);
  display: flex;
  gap: 0.75rem;
  position: relative;
}

.morders-card__tl-row::before {
  background: rgba(26, 26, 26, 0.06);
  content: '';
  height: calc(100% + 0.3rem);
  left: 9px;
  position: absolute;
  top: 15px;
  width: 2px;
}

.morders-card__tl-row:last-child::before { display: none; }
.morders-card__tl-row.active { color: var(--text); }

.morders-card__tl-dot {
  background: rgba(26, 26, 26, 0.15);
  border-radius: 50%;
  height: 18px;
  position: relative;
  width: 18px;
  z-index: 1;
  flex: 0 0 18px;
  transition: all 0.3s ease;
}

.morders-card__tl-dot.done {
  background: #235931;
  box-shadow: 0 0 0 5px rgba(35, 89, 49, 0.1);
}

.morders-card__tl-label { font-weight: 600; font-size: 0.85rem; }

.morders-card__cancelled {
  align-items: center;
  background: rgba(160, 40, 40, 0.05);
  border: 1px solid rgba(160, 40, 40, 0.1);
  border-radius: 10px;
  color: #a02828;
  display: flex;
  font-size: 0.82rem;
  font-weight: 700;
  gap: 0.4rem;
  justify-content: center;
  padding: 0.55rem 0.8rem;
  margin-top: 0.25rem;
}

.morders-card__pickup-msg {
  align-items: center;
  color: rgba(8, 17, 13, 0.6);
  display: flex;
  font-size: 0.85rem;
  gap: 0.4rem;
  line-height: 1.5;
}

.morders-card__pickup-msg i { color: #235931; }

.morders-card__map-wrap { margin-top: 0.1rem; }

.morders-card__map-link {
  color: #235931;
  font-size: 0.82rem;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.morders-card__action-btn {
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

.morders-card__action-btn--track {
  background: #235931;
  color: #fff;
}

.morders-card__action-btn--track:hover { background: #00a523; transform: translateY(-1px); }

.morders-card__action-btn--retry {
  background: #efd537;
  color: #102719;
}

.morders-card__action-btn--retry:hover:not(:disabled) { background: #f5e06b; transform: translateY(-1px); }
.morders-card__action-btn--retry:disabled { opacity: 0.6; cursor: not-allowed; }

.morders-card__audit-row {
  display: flex;
  gap: 0.7rem;
  padding: 0.35rem 0;
  position: relative;
}

.morders-card__audit-row:not(:last-child)::before {
  background: rgba(35, 89, 49, 0.1);
  content: '';
  height: calc(100% + 0.35rem);
  left: 6px;
  position: absolute;
  top: 17px;
  width: 2px;
}

.morders-card__audit-dot {
  background: #235931;
  border-radius: 50%;
  flex: 0 0 14px;
  height: 14px;
  margin-top: 2px;
  width: 14px;
}

.morders-card__audit-copy { display: flex; flex-direction: column; gap: 0.1rem; flex: 1 1 0; }
.morders-card__audit-copy strong { font-size: 0.82rem; }

.morders-card__audit-details { color: rgba(8, 17, 13, 0.55); font-size: 0.78rem; line-height: 1.4; }
.morders-card__audit-when { color: rgba(8, 17, 13, 0.4); font-size: 0.7rem; }

.morders-no-results {
  align-items: center;
  color: rgba(8, 17, 13, 0.45);
  display: flex;
  font-size: 0.85rem;
  gap: 0.4rem;
  justify-content: center;
  padding: 1rem;
}

.card-pop-enter-active,
.card-pop-leave-active { transition: all 0.35s cubic-bezier(0.65, 0, 0.35, 1); }
.card-pop-enter-from { opacity: 0; transform: scale(0.97) translateY(8px); }
.card-pop-leave-to { opacity: 0; transform: scale(0.97) translateY(-8px); }

.fade-slide-enter-active,
.fade-slide-leave-active { transition: all 0.3s cubic-bezier(0.65, 0, 0.35, 1); }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-6px); }

@media (min-width: 600px) {
  .morders-card__body-inner {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .morders-card__section { flex: 1 1 calc(50% - 0.75rem); min-width: 14rem; }
  .morders-card__section:last-child { flex: 1 1 100%; }
}

@media (min-width: 761px) {
  .morders-hero { align-items: flex-end; flex-direction: row; justify-content: space-between; }
  .morders-hero__cta { flex: 0 0 auto; }
  .morders-filter { flex-wrap: nowrap; }
}

@media (min-width: 1180px) {
  .morders-hero, .morders-shell { padding: 2.75rem; }
}
</style>
