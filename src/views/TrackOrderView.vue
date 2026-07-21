<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'

function centsToDollars(cents: number): number {
  return cents / 100
}

const route = useRoute()
const email = ref('')
const orderNumber = ref('')
const orders = ref<OrderDTO[]>([])
const selectedOrder = ref<OrderDTO | null>(null)
const loading = ref(false)
const searching = ref(false)
const errorMessage = ref('')
const fromUrl = ref(false)

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const timeline = [
  { key: 'pending', label: 'Pendiente' },
  { key: 'paid', label: 'Pagado' },
  { key: 'preparing', label: 'Preparando' },
  { key: 'ready', label: 'Listo' },
  { key: 'delivered', label: 'Entregado' },
]

const currentStepIndex = computed(() => {
  if (!selectedOrder.value) return -1
  if (selectedOrder.value.status === 'cancelled') return -2
  return timeline.findIndex((item) => item.key === selectedOrder.value?.status)
})

const auditTimeline = computed(() => {
  if (!selectedOrder.value?.audit?.length) return []
  const sorted = [...selectedOrder.value.audit].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  return sorted
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

async function search() {
  const emailVal = email.value.trim().toLowerCase()
  if (!emailVal) return

  loading.value = true
  errorMessage.value = ''
  orders.value = []
  selectedOrder.value = null
  searching.value = false
  fromUrl.value = false

  try {
    if (orderNumber.value.trim()) {
      const response = await OrderService.getByNumber(orderNumber.value.trim(), emailVal)
      selectedOrder.value = response.data
      searching.value = true
    } else {
      const response = await OrderService.getByEmail(emailVal)
      orders.value = response.data
      searching.value = true
    }
  } catch {
    errorMessage.value = 'No encontramos pedidos para este correo.'
    if (!orderNumber.value.trim()) {
      errorMessage.value = 'No encontramos pedidos para este correo. ¿Tienes el número de pedido? Te ayudará a encontrar tu orden más rápido.'
    }
  } finally {
    loading.value = false
  }
}

function selectOrder(order: OrderDTO) {
  selectedOrder.value = order
}

function backToOrders() {
  selectedOrder.value = null
  fromUrl.value = false
}

onMounted(() => {
  const qOrder = route.query.order as string
  const qEmail = route.query.email as string
  if (qOrder && qEmail) {
    orderNumber.value = qOrder
    email.value = qEmail
    fromUrl.value = true
    search()
  }
})
</script>

<template>
  <div class="track-page">
    <StoreHeader />

    <main class="track-page__main">
      <section v-if="!selectedOrder || !fromUrl" class="track-hero">
        <div class="track-hero__copy">
          <p class="track-hero__eyebrow"><i class="fa-solid fa-magnifying-glass" /> Seguimiento</p>
          <h1>Seguir <span>pedido.</span></h1>
          <p>Ingresa tu correo para ver tus pedidos. Si tienes el número de pedido, agrégalo para una búsqueda más exacta.</p>
        </div>
        <div class="track-hero__status">
          <span>¿Sin cuenta?</span>
          <strong>No necesitas registrarte</strong>
        </div>
      </section>

      <section class="track-shell">
        <form v-if="!selectedOrder || !fromUrl" class="track-form" @submit.prevent="search">
          <div class="track-form__field">
            <span class="track-form__label"><i class="fa-solid fa-envelope" /> Correo electrónico <em>*</em></span>
            <input v-model.trim="email" type="email" placeholder="tu@email.com" autocomplete="email" />
          </div>
          <div class="track-form__field">
            <span class="track-form__label"><i class="fa-solid fa-receipt" /> Número de pedido <em class="optional">opcional</em></span>
            <input v-model.trim="orderNumber" type="text" placeholder="Ej: ORD-00001" />
          </div>
          <button class="btn-primary track-form__submit" type="submit" :disabled="loading || !email">
            <template v-if="loading"><i class="fa-solid fa-circle-notch fa-spin" /> Buscando...</template>
            <template v-else><i class="fa-solid fa-magnifying-glass" /> Buscar</template>
          </button>
        </form>

        <Transition name="fade-slide">
          <p v-if="errorMessage" key="error" class="track-error"><i class="fa-solid fa-circle-exclamation" /> {{ errorMessage }}</p>
        </Transition>

        <Transition name="fade-slide" mode="out-in">
          <SkeletonLoader v-if="loading" key="loading" type="list" :count="3" />

          <div v-else-if="selectedOrder" key="detail" class="track-detail">
            <button v-if="fromUrl" class="track-detail__new-search" @click="backToOrders">
              <i class="fa-solid fa-magnifying-glass" /> Buscar otro pedido
            </button>

            <div class="track-detail__hero">
              <div class="track-detail__hero-copy">
                <p class="track-detail__eyebrow">Pedido {{ selectedOrder.orderNumber }}</p>
                <h2>${{ centsToDollars(selectedOrder.total).toFixed(2) }}</h2>
                <span class="track-detail__status" :class="selectedOrder.status">{{ statusLabels[selectedOrder.status] || selectedOrder.status }}</span>
              </div>
            </div>

            <div class="track-detail__cards">
              <div class="track-detail__card">
                <div class="track-detail__card-head"><i class="fa-solid fa-user" /> Cliente</div>
                <div class="track-detail__card-body">
                  <div class="track-detail__row">
                    <span>Nombre</span>
                    <strong>{{ selectedOrder.customerName || '—' }}</strong>
                  </div>
                  <div class="track-detail__row">
                    <span>Email</span>
                    <strong>{{ selectedOrder.customerEmail }}</strong>
                  </div>
                  <div v-if="selectedOrder.customerPhone" class="track-detail__row">
                    <span>Teléfono</span>
                    <strong>{{ selectedOrder.customerPhone }}</strong>
                  </div>
                </div>
              </div>

              <div v-if="selectedOrder.deliveryType === 'delivery'" class="track-detail__card">
                <div class="track-detail__card-head"><i class="fa-solid fa-truck" /> Delivery</div>
                <div class="track-detail__card-body">
                  <div class="track-detail__row">
                    <span>Dirección</span>
                    <strong>{{ selectedOrder.deliveryAddress || '—' }}</strong>
                  </div>
                  <div v-if="selectedOrder.deliveryDistance" class="track-detail__row">
                    <span>Distancia</span>
                    <strong>{{ selectedOrder.deliveryDistance }} km</strong>
                  </div>
                  <div v-if="selectedOrder.deliveryGoogleMapsUrl" class="track-detail__row track-detail__row--link">
                    <a :href="selectedOrder.deliveryGoogleMapsUrl" target="_blank" rel="noopener noreferrer">
                      <i class="fa-solid fa-map" /> Ver en Google Maps
                    </a>
                  </div>
                </div>
              </div>

              <div v-else class="track-detail__card">
                <div class="track-detail__card-head"><i class="fa-solid fa-store" /> Recoger en sucursal</div>
                <div class="track-detail__card-body">
                  <p class="track-detail__pickup-msg">Pedido para recoger en el local. Espera la notificación de que está listo.</p>
                </div>
              </div>
            </div>

            <div class="track-detail__cost-breakdown">
              <div class="track-detail__card-head"><i class="fa-solid fa-receipt" /> Costos</div>
              <div class="track-detail__card-body">
                <div class="track-detail__row">
                  <span>Subtotal</span>
                  <strong>${{ centsToDollars(selectedOrder.subtotal).toFixed(2) }}</strong>
                </div>
                <div v-if="selectedOrder.deliveryType === 'delivery'" class="track-detail__row">
                  <span>Envío <small v-if="selectedOrder.deliveryDistance">({{ selectedOrder.deliveryDistance }} km)</small></span>
                  <strong>${{ centsToDollars(selectedOrder.deliveryCost ?? 0).toFixed(2) }}</strong>
                </div>
                <div class="track-detail__row track-detail__row--total">
                  <span>Total</span>
                  <strong>${{ centsToDollars(selectedOrder.total).toFixed(2) }}</strong>
                </div>
              </div>
            </div>

            <div v-if="selectedOrder.items?.length" class="track-detail__card">
              <div class="track-detail__card-head"><i class="fa-solid fa-utensils" /> Productos</div>
              <div class="track-detail__card-body track-detail__card-body--items">
                <div v-for="item in selectedOrder.items" :key="item.name" class="track-detail__product">
                  <div class="track-detail__product-media">
                    <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
                    <span v-else><i class="fa-solid fa-utensils" /></span>
                  </div>
                  <div class="track-detail__product-copy">
                    <strong>{{ item.name }}</strong>
                    <span class="track-detail__product-qty">x{{ item.quantity }}</span>
                  </div>
                  <span class="track-detail__product-price">${{ (item.price * item.quantity).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <a v-if="selectedOrder.picker?.smrURL" :href="selectedOrder.picker.smrURL" target="_blank" rel="noopener noreferrer" class="track-detail__tracking">
              <i class="fa-solid fa-location-crosshairs" /> Seguir delivery en vivo
            </a>

            <div v-if="currentStepIndex >= 0" class="track-detail__card">
              <div class="track-detail__card-head"><i class="fa-solid fa-clock" /> Estado del pedido</div>
              <div class="track-detail__card-body">
                <div class="track-detail__timeline">
                  <div
                    v-for="(step, index) in timeline"
                    :key="step.key"
                    class="track-detail__tl-row"
                    :class="{ active: currentStepIndex >= index }"
                  >
                    <span class="track-detail__tl-dot" :class="{ done: currentStepIndex >= index }" />
                    <span class="track-detail__tl-label">{{ step.label }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedOrder.status === 'cancelled'" class="track-detail__cancelled">
              <i class="fa-solid fa-ban" /> Pedido cancelado
            </div>

            <div v-if="auditTimeline.length" class="track-detail__card">
              <div class="track-detail__card-head"><i class="fa-solid fa-list-timeline" /> Auditoría</div>
              <div class="track-detail__card-body">
                <div v-for="entry in auditTimeline" :key="entry.timestamp" class="track-detail__audit-row">
                  <div class="track-detail__audit-dot" />
                  <div class="track-detail__audit-copy">
                    <strong>{{ actionLabels[entry.action] || entry.action }}</strong>
                    <span v-if="entry.details" class="track-detail__audit-details">{{ entry.details }}</span>
                    <span v-if="entry.performedByEmail" class="track-detail__audit-who">{{ entry.performedByEmail }}</span>
                    <span class="track-detail__audit-when">{{ formatDate(entry.timestamp) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="selectedOrder.notes" class="track-detail__card">
              <div class="track-detail__card-head"><i class="fa-solid fa-pen" /> Notas del pedido</div>
              <div class="track-detail__card-body">
                <p class="track-detail__notes">{{ selectedOrder.notes }}</p>
              </div>
            </div>
          </div>

        </Transition>

        <Transition name="fade-slide" mode="out-in">
          <div v-if="orders.length && !selectedOrder" key="list" class="track-orders">
          <p class="track-orders__head"><i class="fa-solid fa-list" /> Tus pedidos</p>
          <div class="track-orders__list">
            <button
              v-for="o in orders"
              :key="o._id"
              class="track-orders__card"
              @click="selectOrder(o)"
            >
              <div class="track-orders__card-head">
                <strong>{{ o.orderNumber }}</strong>
                <span class="track-orders__status" :class="o.status">{{ statusLabels[o.status] || o.status }}</span>
              </div>
              <div class="track-orders__card-meta">
                <span>${{ centsToDollars(o.total).toFixed(2) }}</span>
                <span v-if="o.items?.length">{{ o.items.length }} producto{{ o.items.length !== 1 ? 's' : '' }}</span>
              </div>
            </button>
          </div>
        </div>

        </Transition>

        <Transition name="fade-slide">
          <div v-if="!searching && !loading && !selectedOrder && !orders.length && !fromUrl" key="empty" class="track-empty">
            <i class="fa-solid fa-box-open" />
            <p>Busca tus pedidos por correo electrónico</p>
            <span>Si compraste sin cuenta, solo ingresa el correo que usaste. El número de pedido también te llegó por email después de la compra.</span>
          </div>
        </Transition>
      </section>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.track-page {
  background:
    radial-gradient(circle at 10% 0%, rgba(239, 213, 55, 0.16), transparent 34%),
    linear-gradient(180deg, #f8f6ec 0%, #f4f4f0 48%, #fff 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.track-page__main {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  gap: clamp(1rem, 3vw, 1.5rem);
  margin: 0 auto;
  max-width: 1180px;
  padding: clamp(1.25rem, 4vw, 2.5rem) 1rem clamp(2.5rem, 6vw, 5rem);
  width: 100%;
}

.track-hero {
  background:
    radial-gradient(circle at 92% 8%, rgba(239, 213, 55, 0.2), transparent 24%),
    linear-gradient(135deg, #235931, #102719 72%);
  border-radius: 28px;
  box-shadow: 0 26px 60px rgba(35, 89, 49, 0.2);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
  padding: clamp(1.4rem, 5vw, 3rem);
  position: relative;
}

.track-hero__copy { position: relative; z-index: 1; }

.track-hero__eyebrow {
  color: #efd537;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
}

.track-hero h1 {
  font-size: clamp(2.5rem, 7vw, 5.5rem);
  font-weight: 900;
  letter-spacing: -0.065em;
  line-height: 0.88;
  text-transform: uppercase;
}

.track-hero h1 span {
  color: transparent;
  display: block;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.82);
}

.track-hero__copy > p:last-child {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  line-height: 1.6;
  margin-top: 1rem;
}

.track-hero__status {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  padding: 0.8rem 1rem;
}

.track-hero__status span { color: rgba(255, 255, 255, 0.68); font-size: 0.78rem; }
.track-hero__status strong { color: #efd537; font-size: 1rem; margin-top: 0.15rem; }

.track-shell {
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

.track-form { display: flex; flex-direction: column; gap: 1rem; }

.track-form__field { display: flex; flex-direction: column; gap: 0.35rem; }

.track-form__label {
  align-items: center;
  color: rgba(8, 17, 13, 0.62);
  display: flex;
  font-size: 0.76rem;
  font-weight: 800;
  gap: 0.4rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.track-form__label i { color: #235931; font-size: 0.72rem; }
.track-form__label em { color: #a02828; font-style: normal; }

.track-form__label em.optional { color: rgba(8, 17, 13, 0.35); font-weight: 600; font-size: 0.7rem; }

.track-form input {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.1);
  border-radius: 14px;
  min-height: 56px;
  padding: 0 1.2rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.track-form input:focus {
  border-color: rgba(35, 89, 49, 0.35);
  box-shadow: 0 0 0 3px rgba(35, 89, 49, 0.08);
  outline: none;
}

.track-form__submit {
  align-items: center;
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  min-height: 56px;
  font-size: 1.05rem;
}

.track-error {
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

.track-detail { display: flex; flex-direction: column; gap: 1rem; }

.track-detail__new-search {
  align-items: center;
  align-self: flex-start;
  background: rgba(35, 89, 49, 0.06);
  border-radius: 999px;
  color: #235931;
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 0.4rem;
  padding: 0.55rem 0.9rem;
  transition: background-color 0.2s ease;
}

.track-detail__new-search:hover { background: rgba(35, 89, 49, 0.12); }

.track-detail__hero {
  align-items: center;
  background: linear-gradient(135deg, #235931, #1a4a28);
  border-radius: 20px;
  color: #fff;
  display: flex;
  padding: 1.5rem;
}

.track-detail__hero-copy { display: flex; flex-direction: column; gap: 0.4rem; }

.track-detail__eyebrow {
  color: #efd537;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.track-detail__hero h2 {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.03em;
}

.track-detail__status {
  align-self: flex-start;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 999px;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.3rem 0.7rem;
  text-transform: capitalize;
}

.track-detail__cards { display: flex; flex-direction: column; gap: 0.75rem; }

.track-detail__card {
  background: rgba(35, 89, 49, 0.03);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
}

.track-detail__card-head {
  align-items: center;
  border-bottom: 1px solid rgba(35, 89, 49, 0.06);
  color: rgba(8, 17, 13, 0.5);
  display: flex;
  font-size: 0.75rem;
  font-weight: 800;
  gap: 0.4rem;
  letter-spacing: 0.1em;
  padding: 0.75rem 1rem;
  text-transform: uppercase;
}

.track-detail__card-head i { color: #235931; font-size: 0.8rem; }

.track-detail__card-body { display: flex; flex-direction: column; gap: 0.55rem; padding: 0.85rem 1rem; }

.track-detail__card-body--items { gap: 0.3rem; padding: 0.6rem 1rem; }

.track-detail__row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.track-detail__row span { color: rgba(8, 17, 13, 0.6); font-size: 0.85rem; }
.track-detail__row strong { font-size: 0.88rem; text-align: right; }
.track-detail__row small { color: rgba(8, 17, 13, 0.4); font-weight: 400; }

.track-detail__row--link { justify-content: flex-start; }

.track-detail__row--link a {
  color: #235931;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.track-detail__row--total {
  border-top: 1px solid rgba(35, 89, 49, 0.12);
  padding-top: 0.55rem;
}

.track-detail__row--total span { color: rgba(8, 17, 13, 0.8); font-weight: 700; font-size: 0.9rem; }
.track-detail__row--total strong { color: #235931; font-size: 1.1rem; }

.track-detail__cost-breakdown {
  background: rgba(35, 89, 49, 0.03);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
}

.track-detail__pickup-msg {
  color: rgba(8, 17, 13, 0.6);
  font-size: 0.88rem;
  line-height: 1.5;
}

.track-detail__product {
  align-items: center;
  display: flex;
  gap: 0.65rem;
  padding: 0.35rem 0;
}

.track-detail__product:not(:last-child) { border-bottom: 1px solid rgba(26, 26, 26, 0.04); }

.track-detail__product-media {
  background: linear-gradient(145deg, #eef1e6, #dfe8d9);
  border-radius: 10px;
  flex: 0 0 44px;
  height: 44px;
  overflow: hidden;
}

.track-detail__product-media img { height: 100%; object-fit: cover; width: 100%; }

.track-detail__product-media > span {
  align-items: center;
  color: #235931;
  display: flex;
  font-size: 0.95rem;
  height: 100%;
  justify-content: center;
}

.track-detail__product-copy {
  align-items: center;
  display: flex;
  flex: 1 1 0;
  gap: 0.5rem;
  min-width: 0;
}

.track-detail__product-copy strong {
  font-size: 0.88rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-detail__product-qty { color: rgba(8, 17, 13, 0.45); font-size: 0.78rem; flex: 0 0 auto; }
.track-detail__product-price { color: #235931; font-weight: 700; font-size: 0.88rem; flex: 0 0 auto; }

.track-detail__tracking {
  align-items: center;
  background: #235931;
  border-radius: 14px;
  color: #fff;
  display: flex;
  font-size: 0.9rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 50px;
  padding: 0.75rem 1rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.track-detail__tracking:hover { background: #00a523; transform: translateY(-1px); }

.track-detail__timeline { display: flex; flex-direction: column; gap: 0.5rem; }

.track-detail__tl-row {
  align-items: center;
  color: rgba(26, 26, 26, 0.52);
  display: flex;
  gap: 0.85rem;
  position: relative;
}

.track-detail__tl-row::before {
  background: rgba(26, 26, 26, 0.08);
  content: '';
  height: calc(100% + 0.5rem);
  left: 10px;
  position: absolute;
  top: 16px;
  width: 2px;
}

.track-detail__tl-row:last-child::before { display: none; }
.track-detail__tl-row.active { color: var(--text); }

.track-detail__tl-dot {
  background: rgba(26, 26, 26, 0.18);
  border-radius: 50%;
  box-shadow: 0 0 0 6px rgba(35, 89, 49, 0.04);
  height: 20px;
  position: relative;
  width: 20px;
  z-index: 1;
  flex: 0 0 20px;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.track-detail__tl-dot.done {
  background: #235931;
  box-shadow: 0 0 0 6px rgba(35, 89, 49, 0.12);
}

.track-detail__tl-label { font-weight: 600; font-size: 0.9rem; }

.track-detail__cancelled {
  align-items: center;
  background: rgba(160, 40, 40, 0.06);
  border: 1px solid rgba(160, 40, 40, 0.12);
  border-radius: 14px;
  color: #a02828;
  display: flex;
  font-size: 0.95rem;
  font-weight: 700;
  gap: 0.5rem;
  justify-content: center;
  padding: 0.85rem 1rem;
}

.track-detail__audit-row {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0;
  position: relative;
}

.track-detail__audit-row:not(:last-child)::before {
  background: rgba(35, 89, 49, 0.12);
  content: '';
  height: calc(100% + 0.5rem);
  left: 7px;
  position: absolute;
  top: 18px;
  width: 2px;
}

.track-detail__audit-dot {
  background: #235931;
  border-radius: 50%;
  flex: 0 0 16px;
  height: 16px;
  margin-top: 2px;
  width: 16px;
}

.track-detail__audit-copy { display: flex; flex-direction: column; gap: 0.15rem; flex: 1 1 0; }

.track-detail__audit-copy strong { font-size: 0.88rem; }

.track-detail__audit-details { color: rgba(8, 17, 13, 0.55); font-size: 0.82rem; line-height: 1.4; }

.track-detail__audit-who { color: rgba(8, 17, 13, 0.45); font-size: 0.75rem; }

.track-detail__audit-when { color: rgba(8, 17, 13, 0.4); font-size: 0.72rem; }

.track-detail__notes {
  color: rgba(8, 17, 13, 0.7);
  font-size: 0.88rem;
  line-height: 1.5;
}

.track-orders { display: flex; flex-direction: column; gap: 0.75rem; }

.track-orders__head {
  align-items: center;
  color: rgba(8, 17, 13, 0.5);
  display: flex;
  font-size: 0.75rem;
  font-weight: 800;
  gap: 0.4rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.track-orders__head i { color: #235931; }

.track-orders__list { display: flex; flex-direction: column; gap: 0.5rem; }

.track-orders__card {
  background: rgba(35, 89, 49, 0.02);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 1rem 1.1rem;
  text-align: left;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
  width: 100%;
}

.track-orders__card:hover {
  background: rgba(35, 89, 49, 0.04);
  border-color: rgba(35, 89, 49, 0.16);
  transform: translateY(-1px);
}

.track-orders__card-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.track-orders__card-head strong { font-size: 1.05rem; font-weight: 800; }

.track-orders__status {
  background: rgba(35, 89, 49, 0.08);
  border-radius: 999px;
  color: #235931;
  font-size: 0.75rem;
  font-weight: 800;
  min-height: 32px;
  padding: 0.35rem 0.7rem;
  text-transform: capitalize;
}

.track-orders__status.cancelled { background: rgba(160, 40, 40, 0.08); color: #a02828; }

.track-orders__card-meta {
  align-items: center;
  color: rgba(8, 17, 13, 0.5);
  display: flex;
  font-size: 0.82rem;
  gap: 0.75rem;
}

.track-empty {
  align-items: center;
  background: rgba(35, 89, 49, 0.04);
  border: 1px dashed rgba(35, 89, 49, 0.2);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  text-align: center;
}

.track-empty i { color: #235931; font-size: 1.6rem; opacity: 0.6; }
.track-empty p { color: rgba(8, 17, 13, 0.7); font-weight: 600; }

.track-empty span {
  color: rgba(8, 17, 13, 0.45);
  font-size: 0.85rem;
  line-height: 1.5;
  max-width: 26rem;
}

.fade-slide-enter-active,
.fade-slide-leave-active { transition: all 0.35s cubic-bezier(0.65, 0, 0.35, 1); }

.fade-slide-enter-from { opacity: 0; transform: translateY(12px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-8px); }

@media (min-width: 761px) {
  .track-hero { align-items: flex-end; flex-direction: row; }
  .track-hero__status { flex: 0 0 200px; min-width: 200px; }
  .track-form { flex-direction: row; align-items: end; gap: 0.85rem; }
  .track-form__field { flex: 1 1 0; }
  .track-form__submit { flex: 0 0 180px; }
}

@media (min-width: 1180px) {
  .track-hero, .track-shell { padding: 2.75rem; }
}
</style>