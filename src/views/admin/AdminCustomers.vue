<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import UserService, { type CustomerDTO, type CustomerPointsDTO } from '@/services/UserService'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import { useToast } from '@/composables/useToast'
import { absoluteTime, relativeTime, statusLabel } from '@/components/admin/order-detail/orderStory'
import { displayProductName } from '@/utils/productName'

const router = useRouter()
const { error } = useToast()
const customers = ref<CustomerDTO[]>([])
const summary = ref<{ count: number; totalPoints: number }>({ count: 0, totalPoints: 0 })
const loading = ref(true)
const search = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const selected = ref<CustomerDTO | null>(null)
const detail = ref<CustomerPointsDTO | null>(null)
const detailLoading = ref(false)
const orders = ref<OrderDTO[]>([])
const ordersLoading = ref(false)

async function load() {
  loading.value = true
  try {
    const res = await UserService.getCustomers(search.value.trim())
    customers.value = res.data.customers
    summary.value = res.data.summary
  } catch {
    error('No se pudieron cargar los clientes')
  } finally {
    loading.value = false
  }
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 350)
}

async function openDetail(customer: CustomerDTO) {
  selected.value = customer
  detail.value = null
  orders.value = []
  detailLoading.value = true
  ordersLoading.value = true
  // Puntos y pedidos se piden a la vez: el panel se va llenando con lo que llegue primero.
  UserService.getCustomerPoints(customer._id)
    .then((res) => { detail.value = res.data })
    .catch(() => error('No se pudo cargar el historial de puntos'))
    .finally(() => { detailLoading.value = false })
  OrderService.getByEmail(customer.email)
    .then((res) => { orders.value = res.data })
    .catch(() => { orders.value = [] }) // 404 = el cliente todavía no tiene pedidos
    .finally(() => { ordersLoading.value = false })
}

function closeDetail() {
  selected.value = null
}

const money = (cents: number) => `$${(cents / 100).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/** La historia del cliente en 3 datos: cuánto gastó, cuándo fue su último pedido y qué pide más. */
const story = computed(() => {
  const valid = orders.value.filter((order) => order.status !== 'cancelled')
  // Solo lo que de verdad se cobró: un pedido "pendiente" todavía no se pagó.
  const paid = valid.filter((order) => order.status !== 'pending')
  const spent = paid.reduce((sum, order) => sum + (order.total || 0), 0)
  const counts = new Map<string, number>()
  for (const order of valid) for (const item of order.items || []) counts.set(item.name, (counts.get(item.name) || 0) + item.quantity)
  const favorite = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return {
    spent,
    cancelled: orders.value.length - valid.length,
    unpaid: valid.length - paid.length,
    last: orders.value[0]?.createdAt,
    favorite: favorite ? displayProductName(favorite[0]) : '',
  }
})

const phoneLink = computed(() => {
  const digits = (selected.value?.phone || '').replace(/\D/g, '')
  return digits.length >= 9 ? `https://wa.me/${digits}` : ''
})

const initials = (name?: string, email?: string) => (name || email || '?').trim().slice(0, 1).toUpperCase()

function closeOnEscape(event: KeyboardEvent) { if (event.key === 'Escape') closeDetail() }
watch(selected, (value) => { document.body.style.overflow = value ? 'hidden' : '' })
onMounted(() => { void load(); document.addEventListener('keydown', closeOnEscape) })
onBeforeUnmount(() => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = '' })
</script>

<template>
  <AdminLayout>
    <section class="cus">
      <header class="cus__head">
        <div>
          <p class="cus__eyebrow">Clientes</p>
          <h1>Quién compra</h1>
        </div>
        <div class="cus__stats">
          <span><b>{{ summary.count.toLocaleString('es-EC') }}</b> con cuenta</span>
          <span><b>{{ summary.totalPoints.toLocaleString('es-EC') }}</b> puntos acumulados</span>
        </div>
      </header>

      <label class="cus__search">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <span class="visually-hidden">Buscar cliente</span>
        <input v-model="search" type="search" placeholder="Buscar por nombre, correo o teléfono" autocomplete="off" @input="onSearch" />
      </label>

      <section class="cus__list" aria-live="polite">
        <div v-if="loading" class="cus__skeleton" aria-hidden="true">
          <span v-for="n in 6" :key="n" />
        </div>
        <p v-else-if="!customers.length" class="cus__empty">
          <i class="fa-solid fa-user-group" aria-hidden="true" />
          {{ search ? 'Nadie coincide con esa búsqueda.' : 'Aún no hay clientes con cuenta.' }}
        </p>
        <ul v-else>
          <li v-for="c in customers" :key="c._id">
            <button type="button" class="row" :class="{ active: selected?._id === c._id }" @click="openDetail(c)">
              <span class="row__avatar" aria-hidden="true">{{ initials(c.name, c.email) }}</span>
              <span class="row__who">
                <strong>{{ c.name || 'Sin nombre' }}</strong>
                <small>{{ c.email }}<template v-if="c.phone"> · {{ c.phone }}</template></small>
              </span>
              <span class="row__meta">
                <span class="row__points"><i class="fa-solid fa-star" aria-hidden="true" /> {{ c.points.toLocaleString('es-EC') }}</span>
                <small v-if="c.lastMovement?.date">{{ relativeTime(c.lastMovement.date) }}</small>
              </span>
              <i class="fa-solid fa-chevron-right row__go" aria-hidden="true" />
            </button>
          </li>
        </ul>
      </section>
    </section>

    <Teleport to="body">
      <Transition name="drawer">
        <div v-if="selected" class="drawer" role="dialog" aria-modal="true" :aria-label="`Historia de ${selected.name || selected.email}`" @click.self="closeDetail">
          <aside class="drawer__panel">
            <header class="drawer__head">
              <span class="drawer__avatar" aria-hidden="true">{{ initials(selected.name, selected.email) }}</span>
              <div>
                <h2>{{ selected.name || 'Cliente' }}</h2>
                <p>{{ selected.email }}<template v-if="selected.phone"> · {{ selected.phone }}</template></p>
              </div>
              <button type="button" class="drawer__close" aria-label="Cerrar" @click="closeDetail"><i class="fa-solid fa-xmark" /></button>
            </header>

            <div class="drawer__contact">
              <a v-if="phoneLink" :href="phoneLink" target="_blank" rel="noopener" class="chip chip--wa"><i class="fa-brands fa-whatsapp" aria-hidden="true" /> WhatsApp</a>
              <a v-if="selected.phone" :href="`tel:${selected.phone}`" class="chip"><i class="fa-solid fa-phone" aria-hidden="true" /> Llamar</a>
              <a :href="`mailto:${selected.email}`" class="chip"><i class="fa-solid fa-envelope" aria-hidden="true" /> Correo</a>
            </div>

            <!-- Resumen de la historia -->
            <div class="drawer__summary">
              <div><span>Gastó</span><strong>{{ ordersLoading ? '…' : money(story.spent) }}</strong></div>
              <div><span>Último pedido</span><strong>{{ ordersLoading ? '…' : story.last ? relativeTime(story.last) : 'Nunca' }}</strong></div>
              <div><span>Puntos</span><strong>{{ detailLoading ? '…' : (detail?.points ?? selected.points).toLocaleString('es-EC') }}</strong></div>
            </div>
            <p v-if="story.favorite" class="drawer__fav"><i class="fa-solid fa-heart" aria-hidden="true" /> Lo que más pide: <b>{{ story.favorite }}</b></p>

            <section class="drawer__section">
              <h3>Sus pedidos <small v-if="orders.length">(últimos {{ orders.length }})</small></h3>
              <div v-if="ordersLoading" class="cus__skeleton cus__skeleton--sm" aria-hidden="true"><span v-for="n in 3" :key="n" /></div>
              <p v-else-if="!orders.length" class="cus__empty cus__empty--sm">Todavía no ha hecho pedidos con este correo.</p>
              <ul v-else class="orders">
                <li v-for="order in orders" :key="order._id">
                  <button type="button" class="order" @click="router.push(`/admin/ordenes/${order._id}`)">
                    <span class="order__top">
                      <strong>{{ order.orderNumber }}</strong>
                      <span class="status-pill" :data-status="order.status">{{ statusLabel(order.status) }}</span>
                    </span>
                    <span class="order__items">{{ (order.items || []).map((item) => `${item.quantity}× ${displayProductName(item.name)}`).join(', ') || 'Sin productos' }}</span>
                    <span class="order__foot">
                      <small>{{ absoluteTime(order.createdAt) }} · {{ order.deliveryType === 'pickup' ? 'Retiro' : 'Delivery' }} · {{ order.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta' }}</small>
                      <b>{{ money(order.total) }}</b>
                    </span>
                  </button>
                </li>
              </ul>
              <p v-if="story.cancelled || story.unpaid" class="drawer__note">
                <i class="fa-solid fa-circle-info" aria-hidden="true" />
                No cuentan en lo gastado:
                <template v-if="story.unpaid">{{ story.unpaid }} sin pagar</template><template v-if="story.unpaid && story.cancelled"> y </template><template v-if="story.cancelled">{{ story.cancelled }} {{ story.cancelled === 1 ? 'cancelado' : 'cancelados' }}</template>.
              </p>
            </section>

            <section class="drawer__section">
              <h3>Movimientos de puntos</h3>
              <div v-if="detailLoading" class="cus__skeleton cus__skeleton--sm" aria-hidden="true"><span v-for="n in 2" :key="n" /></div>
              <p v-else-if="!detail?.history?.length" class="cus__empty cus__empty--sm">Sin movimientos de puntos todavía.</p>
              <ul v-else class="points">
                <li v-for="(h, i) in detail.history" :key="i">
                  <b :class="h.amount >= 0 ? 'pos' : 'neg'">{{ h.amount >= 0 ? '+' : '' }}{{ h.amount }}</b>
                  <span>{{ h.reason || 'Movimiento' }}</span>
                  <small>{{ absoluteTime(h.date) }}</small>
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </AdminLayout>
</template>

<style scoped lang="scss">
.cus { color: var(--admin-text); display: flex; flex-direction: column; gap: 0.9rem; margin: 0 auto; max-width: 1000px; width: 100%; }

.cus__head {
  align-items: flex-end;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;

  h1 { font-size: clamp(1.5rem, 4vw, 2.1rem); font-weight: 800; letter-spacing: -0.04em; margin: 0.15rem 0 0; }
}

.cus__eyebrow { color: var(--admin-accent); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; margin: 0; text-transform: uppercase; }

.cus__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;

  span { background: var(--admin-surface); border: 1px solid var(--admin-line); border-radius: 999px; color: var(--admin-muted); font-size: 0.78rem; padding: 0.35rem 0.75rem; }
  b { color: var(--admin-text); font-variant-numeric: tabular-nums; }
}

.visually-hidden { border: 0; clip: rect(0 0 0 0); height: 1px; margin: -1px; overflow: hidden; padding: 0; position: absolute; white-space: nowrap; width: 1px; }

.cus__search {
  align-items: center;
  background: var(--admin-surface);
  border: 1px solid var(--admin-line-strong);
  border-radius: 14px;
  display: flex;
  gap: 0.6rem;
  padding: 0 0.9rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within { border-color: var(--admin-accent); box-shadow: 0 0 0 3px var(--admin-accent-soft); }
  i { color: var(--admin-subtle); }

  input {
    background: transparent;
    border: 0;
    color: var(--admin-text);
    flex: 1 1 auto;
    font-size: 0.95rem;
    min-height: 48px;
    outline: none;
    padding: 0;

    &::placeholder { color: var(--admin-subtle); }
  }
}

.cus__list {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius, 18px);
  box-shadow: var(--admin-shadow);
  overflow: hidden;

  ul { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0.3rem; }
  li + li { border-top: 1px solid var(--admin-line); }
}

.row {
  align-items: center;
  background: transparent;
  border-radius: 12px;
  color: var(--admin-text);
  display: flex;
  gap: 0.75rem;
  padding: 0.7rem 0.6rem;
  text-align: left;
  transition: background 0.2s ease;
  width: 100%;

  &:hover, &.active { background: var(--admin-hover); }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: -2px; }
}

.row__avatar,
.drawer__avatar {
  align-items: center;
  background: var(--admin-accent-soft);
  border-radius: 50%;
  color: var(--admin-accent);
  display: flex;
  flex: 0 0 38px;
  font-weight: 800;
  height: 38px;
  justify-content: center;
}

.row__who {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;

  strong { font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  small { color: var(--admin-muted); font-size: 0.76rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.row__meta {
  align-items: flex-end;
  display: flex;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 0.15rem;

  small { color: var(--admin-subtle); font-size: 0.7rem; }
}

.row__points {
  align-items: center;
  background: var(--admin-warning-soft);
  border-radius: 999px;
  color: var(--admin-warning);
  display: inline-flex;
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  gap: 0.3rem;
  padding: 0.2rem 0.6rem;
}

.row__go { color: var(--admin-subtle); font-size: 0.7rem; }

.cus__empty {
  align-items: center;
  color: var(--admin-muted);
  display: flex;
  flex-direction: column;
  font-size: 0.88rem;
  gap: 0.5rem;
  margin: 0;
  padding: 2.5rem 1rem;
  text-align: center;

  i { color: var(--admin-subtle); font-size: 1.4rem; }
}

.cus__empty--sm { padding: 0.75rem 0; }

.cus__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem;

  span {
    animation: shimmer 1.2s ease-in-out infinite;
    background: var(--admin-hover);
    border-radius: 12px;
    height: 52px;
  }
}

.cus__skeleton--sm { padding: 0; span { height: 64px; } }

@keyframes shimmer { 50% { opacity: 0.45; } }

// ─── Panel lateral del cliente ───
.drawer {
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  inset: 0;
  justify-content: flex-end;
  position: fixed;
  z-index: 3000;
}

.drawer__panel {
  background: var(--admin-bg);
  box-shadow: var(--admin-shadow-lg);
  color: var(--admin-text);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  height: 100%;
  overflow-y: auto;
  padding: 1.1rem;
  width: min(100%, 460px);
}

.drawer__head {
  align-items: center;
  display: flex;
  gap: 0.75rem;

  > div { display: flex; flex: 1 1 auto; flex-direction: column; min-width: 0; }
  h2 { font-size: 1.15rem; font-weight: 800; letter-spacing: -0.02em; margin: 0; }
  p { color: var(--admin-muted); font-size: 0.8rem; margin: 0.15rem 0 0; overflow-wrap: anywhere; }
}

.drawer__avatar { flex-basis: 46px; font-size: 1.1rem; height: 46px; }

.drawer__close {
  align-items: center;
  background: var(--admin-hover);
  border-radius: 12px;
  color: var(--admin-text);
  display: flex;
  flex: 0 0 38px;
  height: 38px;
  justify-content: center;
}

.drawer__contact { display: flex; flex-wrap: wrap; gap: 0.4rem; }

.chip {
  align-items: center;
  background: var(--admin-surface);
  border: 1px solid var(--admin-line-strong);
  border-radius: 999px;
  color: var(--admin-text);
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 800;
  gap: 0.4rem;
  min-height: 36px;
  padding: 0.35rem 0.8rem;
  text-decoration: none;

  &:hover { background: var(--admin-hover); }
}

.chip--wa { background: var(--admin-success-soft); border-color: transparent; color: var(--admin-success); }

.drawer__summary {
  display: flex;
  gap: 0.5rem;

  > div {
    background: var(--admin-surface);
    border: 1px solid var(--admin-line);
    border-radius: 14px;
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    padding: 0.65rem 0.75rem;
  }

  span { color: var(--admin-muted); font-size: 0.7rem; font-weight: 700; }
  strong { font-size: 1rem; font-variant-numeric: tabular-nums; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
}

.drawer__fav {
  align-items: center;
  background: var(--admin-danger-soft);
  border-radius: 12px;
  color: var(--admin-text);
  display: flex;
  font-size: 0.84rem;
  gap: 0.5rem;
  margin: 0;
  padding: 0.6rem 0.8rem;

  i { color: var(--admin-danger); }
}

.drawer__section {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;

  h3 { font-size: 0.92rem; font-weight: 800; margin: 0.3rem 0 0; small { color: var(--admin-muted); font-weight: 600; } }
}

.drawer__note { color: var(--admin-muted); font-size: 0.76rem; margin: 0; i { margin-right: 0.3rem; } }

.orders { display: flex; flex-direction: column; gap: 0.5rem; list-style: none; margin: 0; padding: 0; }

.order {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: 14px;
  color: var(--admin-text);
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.7rem 0.8rem;
  text-align: left;
  transition: border-color 0.2s ease, transform 0.2s var(--admin-ease);
  width: 100%;

  &:hover { border-color: var(--admin-line-strong); transform: translateY(-1px); }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
}

.order__top { align-items: center; display: flex; gap: 0.5rem; justify-content: space-between; strong { font-size: 0.9rem; font-variant-numeric: tabular-nums; } }
.order__items { color: var(--admin-text); font-size: 0.82rem; line-height: 1.4; }
.order__foot { align-items: baseline; display: flex; gap: 0.5rem; justify-content: space-between; small { color: var(--admin-muted); font-size: 0.72rem; } b { font-variant-numeric: tabular-nums; } }

.points {
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;

  li { align-items: baseline; border-top: 1px solid var(--admin-line); display: flex; flex-wrap: wrap; gap: 0.15rem 0.7rem; padding: 0.55rem 0; }
  li:first-child { border-top: 0; }
  b { flex: 0 0 3.2rem; font-variant-numeric: tabular-nums; }
  .pos { color: var(--admin-success); }
  .neg { color: var(--admin-danger); }
  span { flex: 1 1 auto; font-size: 0.84rem; min-width: 0; }
  small { color: var(--admin-subtle); flex-basis: 100%; font-size: 0.72rem; padding-left: 3.9rem; }
}

.drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s ease; }
.drawer-enter-active .drawer__panel, .drawer-leave-active .drawer__panel { transition: transform 0.32s var(--admin-ease); }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-from .drawer__panel, .drawer-leave-to .drawer__panel { transform: translateX(100%); }

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active, .drawer-leave-active, .drawer-enter-active .drawer__panel, .drawer-leave-active .drawer__panel { transition: none; }
  .cus__skeleton span { animation: none; }
  .order { transition: none; &:hover { transform: none; } }
}
</style>
