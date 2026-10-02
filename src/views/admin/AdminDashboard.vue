<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import { AdminDateRangeFilter, AdminHourlyChart, AdminRevenueChart } from '@/components/admin'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import ProductService, { type ProductDTO } from '@/services/ProductService'
import CategoryService, { type CategoryDTO } from '@/services/CategoryService'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import UserService, { type UserDTO } from '@/services/UserService'
import { relativeTime, statusLabel } from '@/components/admin/order-detail/orderStory'

const router = useRouter()
const loading = ref(true)
const orders = ref<OrderDTO[]>([])
const products = ref<ProductDTO[]>([])
const categories = ref<CategoryDTO[]>([])
const branches = ref<BranchDTO[]>([])
const users = ref<UserDTO[]>([])
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date())
const startDate = ref(today)
const endDate = ref(today)
const activePreset = ref('today')

const money = (cents: number) => `$${(cents / 100).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const validOrders = computed(() => orders.value.filter((o) => o.status !== 'cancelled'))
const totalRevenue = computed(() => validOrders.value.reduce((sum, o) => sum + (o.total || 0), 0))
const averageTicket = computed(() => (validOrders.value.length ? totalRevenue.value / validOrders.value.length : 0))
const deliveredOrders = computed(() => orders.value.filter((o) => o.status === 'delivered').length)
const cancelledOrders = computed(() => orders.value.filter((o) => o.status === 'cancelled').length)
/** Lo que el equipo todavía tiene que mover: sin entregar ni cancelar. */
const inProgress = computed(() => orders.value.filter((o) => ['paid', 'preparing', 'awaiting_pickup', 'ready'].includes(o.status)).length)
const unpaidCards = computed(() => orders.value.filter((o) => o.status === 'pending' && o.paymentMethod === 'card').length)
const whatsappShare = computed(() => {
  const total = orders.value.length
  if (!total) return 0
  return Math.round((orders.value.filter((o) => o.source === 'whatsapp').length / total) * 100)
})

const deliveryCharged = computed(() => validOrders.value.reduce((sum, o) => sum + (o.deliveryCost || 0), 0))
// Solo los pedidos en los que Picker nos dijo cuánto nos cobra. El resto no entra ni arriba ni
// abajo: mezclarlos daba una "diferencia" igual al total cobrado, como si el motorizado fuera gratis.
const ordersConCostoPicker = computed(() => validOrders.value.filter((o) => (o.picker?.deliveryFee || 0) > 0))
const pickerDeliveryCost = computed(() => ordersConCostoPicker.value.reduce((sum, o) => sum + Math.round((o.picker?.deliveryFee || 0) * 100), 0))
const deliveryChargedConPicker = computed(() => ordersConCostoPicker.value.reduce((sum, o) => sum + (o.deliveryCost || 0), 0))
const deliveryDifference = computed(() => deliveryChargedConPicker.value - pickerDeliveryCost.value)
const haySaldoDelivery = computed(() => ordersConCostoPicker.value.length > 0)
const pointsGranted = computed(() => orders.value.reduce((sum, o) => sum + (o.pointsEarned || 0), 0))

const activeProducts = computed(() => products.value.filter((p) => p.isAvailable).length)
const activeBranches = computed(() => branches.value.filter((b) => b.isActive).length)

const recentOrders = computed(() =>
  [...orders.value]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 8),
)

/** Reparto por estado, en el orden del ciclo del pedido (para la barra apilada). */
const STATUS_ORDER = ['pending', 'paid', 'preparing', 'awaiting_pickup', 'ready', 'delivered', 'cancelled']
const statusBreakdown = computed(() => {
  const total = orders.value.length || 1
  return STATUS_ORDER.map((status) => {
    const count = orders.value.filter((o) => o.status === status).length
    return { status, count, percent: (count / total) * 100 }
  }).filter((item) => item.count > 0)
})

const rangeLabel = computed(() => {
  const fmt = (value: string) => new Date(`${value}T12:00:00-05:00`).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', timeZone: 'America/Guayaquil' })
  if (startDate.value === endDate.value) return startDate.value === today ? 'Hoy' : fmt(startDate.value)
  return `${fmt(startDate.value)} – ${fmt(endDate.value)}`
})

async function load() {
  loading.value = true
  try {
    const ordersResponse = await OrderService.getAll({ from: startDate.value, to: endDate.value, limit: 200 })
    orders.value = ordersResponse.data
  } catch {
    orders.value = []
  } finally {
    loading.value = false
  }

  const results = await Promise.allSettled([
    ProductService.getAll(),
    CategoryService.getAll(),
    BranchService.getAll(),
    UserService.getAll(),
  ])
  const [productsRes, categoriesRes, branchesRes, usersRes] = results
  if (productsRes.status === 'fulfilled') products.value = productsRes.value.data
  if (categoriesRes.status === 'fulfilled') categories.value = categoriesRes.value.data
  if (branchesRes.status === 'fulfilled') branches.value = branchesRes.value.data
  if (usersRes.status === 'fulfilled') users.value = usersRes.value.data
}

onMounted(() => {
  void load()
  window.addEventListener('admin:branch-change', load)
})

onUnmounted(() => window.removeEventListener('admin:branch-change', load))

function applyDateRange() {
  if (startDate.value > endDate.value) [startDate.value, endDate.value] = [endDate.value, startDate.value]
  void load()
}
</script>

<template>
  <AdminLayout>
    <section class="dash">
      <header class="dash__head">
        <div>
          <p class="dash__eyebrow">Resumen · {{ rangeLabel }}</p>
          <h1>Cómo va el negocio</h1>
        </div>
      </header>

      <AdminDateRangeFilter
        v-model:start-date="startDate"
        v-model:end-date="endDate"
        :loading="loading"
        :active-preset="activePreset"
        @preset="activePreset = $event"
        @apply="applyDateRange"
      />

      <SkeletonLoader v-if="loading" type="card" :count="3" />

      <template v-else>
        <!-- Lo que importa, en 4 números. -->
        <section class="kpis" aria-label="Indicadores principales">
          <article class="kpi kpi--hero">
            <span class="kpi__label"><i class="fa-solid fa-sack-dollar" aria-hidden="true" /> Ventas</span>
            <strong class="kpi__value">{{ money(totalRevenue) }}</strong>
            <span class="kpi__hint">Sin contar cancelados</span>
          </article>
          <article class="kpi">
            <span class="kpi__label"><i class="fa-solid fa-receipt" aria-hidden="true" /> Pedidos</span>
            <strong class="kpi__value">{{ orders.length }}</strong>
            <span class="kpi__hint">{{ deliveredOrders }} entregados<template v-if="cancelledOrders"> · {{ cancelledOrders }} cancelados</template></span>
          </article>
          <article class="kpi">
            <span class="kpi__label"><i class="fa-solid fa-ticket" aria-hidden="true" /> Ticket promedio</span>
            <strong class="kpi__value">{{ money(averageTicket) }}</strong>
            <span class="kpi__hint">{{ whatsappShare }}% llegó por WhatsApp</span>
          </article>
          <button type="button" class="kpi kpi--action" :class="{ 'kpi--alert': inProgress > 0 }" @click="router.push('/admin/ordenes')">
            <span class="kpi__label"><i class="fa-solid fa-fire-burner" aria-hidden="true" /> En curso ahora</span>
            <strong class="kpi__value">{{ inProgress }}</strong>
            <span class="kpi__hint">{{ unpaidCards ? `${unpaidCards} con tarjeta sin pagar · ` : '' }}Ver tablero <i class="fa-solid fa-arrow-right" aria-hidden="true" /></span>
          </button>
        </section>

        <div class="dash__charts">
          <AdminHourlyChart :orders="orders" />
          <AdminRevenueChart :orders="orders" />
        </div>

        <div class="dash__bottom">
          <section class="card recent">
            <header class="card__head">
              <h2>Últimos pedidos</h2>
              <button type="button" class="card__link" @click="router.push('/admin/ordenes')">Ver todos <i class="fa-solid fa-arrow-right" aria-hidden="true" /></button>
            </header>
            <p v-if="!recentOrders.length" class="card__empty"><i class="fa-solid fa-mug-hot" aria-hidden="true" /> Todavía no hay pedidos en este período.</p>
            <ul v-else class="recent__list">
              <li v-for="order in recentOrders" :key="order._id">
                <button type="button" class="recent__row" @click="router.push(`/admin/ordenes/${order._id}`)">
                  <span class="recent__who">
                    <strong>{{ order.customerName || order.customerEmail }}</strong>
                    <small>{{ order.orderNumber }} · {{ order.branch?.name || 'Sin sucursal' }} · {{ relativeTime(order.createdAt) }}</small>
                  </span>
                  <span class="status-pill" :data-status="order.status">{{ statusLabel(order.status) }}</span>
                  <span class="recent__total">{{ money(order.total) }}</span>
                </button>
              </li>
            </ul>
          </section>

          <aside class="dash__side">
            <section class="card">
              <header class="card__head"><h2>Por estado</h2></header>
              <p v-if="!statusBreakdown.length" class="card__empty">Sin pedidos.</p>
              <template v-else>
                <div class="stack" role="img" :aria-label="statusBreakdown.map((s) => `${statusLabel(s.status)}: ${s.count}`).join(', ')">
                  <span v-for="item in statusBreakdown" :key="item.status" :style="{ flexGrow: item.percent, background: `var(--st-${item.status})` }" />
                </div>
                <ul class="legend">
                  <li v-for="item in statusBreakdown" :key="item.status">
                    <i :style="{ background: `var(--st-${item.status})` }" aria-hidden="true" />
                    <span>{{ statusLabel(item.status) }}</span>
                    <b>{{ item.count }}</b>
                  </li>
                </ul>
              </template>
            </section>

            <section class="card">
              <header class="card__head"><h2>Delivery</h2></header>
              <dl class="facts">
                <div><dt>Cobrado a clientes</dt><dd>{{ money(deliveryCharged) }}</dd></div>
                <div v-if="haySaldoDelivery"><dt>Pagado a Picker</dt><dd>{{ money(pickerDeliveryCost) }}</dd></div>
                <div v-if="haySaldoDelivery" :class="deliveryDifference >= 0 ? 'is-good' : 'is-bad'"><dt>Diferencia</dt><dd>{{ money(deliveryDifference) }}</dd></div>
                <div v-else class="is-muted"><dt>Picker</dt><dd>Sin costos reportados</dd></div>
                <div><dt>Puntos entregados</dt><dd>{{ pointsGranted.toLocaleString('es-EC') }}</dd></div>
              </dl>
            </section>
          </aside>
        </div>

        <p class="dash__catalog">
          <i class="fa-solid fa-store" aria-hidden="true" />
          {{ activeProducts }} de {{ products.length }} productos disponibles · {{ categories.length }} categorías · {{ activeBranches }} sucursales activas · {{ users.length }} usuarios
        </p>
      </template>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
.dash {
  color: var(--admin-text);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin: 0 auto;
  max-width: 1240px;
  width: 100%;
}

.dash__head h1 { font-size: clamp(1.5rem, 4vw, 2.1rem); font-weight: 800; letter-spacing: -0.04em; margin: 0.15rem 0 0; }

.dash__eyebrow {
  color: var(--admin-accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  margin: 0;
  text-transform: uppercase;
}

// ─── KPIs ───
.kpis { display: flex; flex-wrap: wrap; gap: 0.75rem; }

.kpi {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius, 18px);
  box-shadow: var(--admin-shadow);
  color: var(--admin-text);
  display: flex;
  flex: 1 1 calc(50% - 0.75rem);
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
  padding: 0.95rem 1rem;
  text-align: left;
}

.kpi__label {
  align-items: center;
  color: var(--admin-muted);
  display: flex;
  font-size: 0.74rem;
  font-weight: 700;
  gap: 0.4rem;

  i { color: var(--admin-accent); }
}

.kpi__value { font-size: clamp(1.4rem, 5vw, 1.9rem); font-variant-numeric: tabular-nums; font-weight: 800; letter-spacing: -0.035em; line-height: 1.05; }
.kpi__hint { color: var(--admin-muted); font-size: 0.74rem; i { font-size: 0.65rem; margin-left: 0.15rem; } }

.kpi--hero {
  background: linear-gradient(150deg, #2b6b3b, #173e22);
  border-color: transparent;
  color: #fff;

  .kpi__label, .kpi__hint { color: rgba(255, 255, 255, 0.75); }
  .kpi__label i { color: var(--admin-yellow); }
  .kpi__value { color: var(--admin-yellow); }
}

.kpi--action {
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s var(--admin-ease);

  &:hover { border-color: var(--admin-line-strong); transform: translateY(-2px); }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
}

.kpi--alert {
  background: var(--admin-warning-soft);
  border-color: color-mix(in srgb, var(--admin-warning) 35%, transparent);

  .kpi__label i, .kpi__value { color: var(--admin-warning); }
}

// ─── Gráficos ───
.dash__charts { display: flex; flex-direction: column; gap: 0.75rem; }
.dash__charts > * { flex: 1 1 0; min-width: 0; }

// ─── Abajo ───
.dash__bottom { display: flex; flex-direction: column; gap: 0.75rem; }
.dash__side { display: flex; flex-direction: column; gap: 0.75rem; }

.card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius, 18px);
  box-shadow: var(--admin-shadow);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  min-width: 0;
  padding: 1rem 1.1rem;
}

.card__head {
  align-items: center;
  display: flex;
  justify-content: space-between;

  h2 { font-size: 0.98rem; font-weight: 800; letter-spacing: -0.02em; margin: 0; }
}

.card__link {
  align-items: center;
  background: transparent;
  border-radius: 999px;
  color: var(--admin-accent);
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 800;
  gap: 0.35rem;
  padding: 0.35rem 0.5rem;

  &:hover { background: var(--admin-accent-soft); }
  i { font-size: 0.65rem; }
}

.card__empty { align-items: center; color: var(--admin-muted); display: flex; font-size: 0.86rem; gap: 0.5rem; margin: 0; padding: 1rem 0; }

.recent { flex: 1 1 auto; }
.recent__list { display: flex; flex-direction: column; list-style: none; margin: 0 -0.5rem; padding: 0; }

.recent__row {
  align-items: center;
  background: transparent;
  border-radius: 12px;
  color: var(--admin-text);
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
  padding: 0.65rem 0.5rem;
  text-align: left;
  transition: background 0.2s ease;
  width: 100%;

  &:hover { background: var(--admin-hover); }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: -2px; }
}

.recent__list li + li .recent__row { border-top: 1px solid var(--admin-line); border-radius: 0; }

.recent__who {
  display: flex;
  flex: 1 1 100%;
  flex-direction: column;
  min-width: 0;

  strong { font-size: 0.88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  small { color: var(--admin-muted); font-size: 0.74rem; }
}

.recent__total { font-size: 0.9rem; font-variant-numeric: tabular-nums; font-weight: 800; margin-left: auto; min-width: 4.5rem; text-align: right; }

// Barra apilada por estado.
.stack {
  border-radius: 999px;
  display: flex;
  gap: 2px;
  height: 12px;
  overflow: hidden;

  span { flex-basis: 0; min-width: 4px; }
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  list-style: none;
  margin: 0;
  padding: 0;

  li { align-items: center; display: flex; font-size: 0.82rem; gap: 0.5rem; }
  i { border-radius: 3px; flex: 0 0 10px; height: 10px; }
  span { color: var(--admin-muted); flex: 1 1 auto; }
  b { font-variant-numeric: tabular-nums; }
}

.facts {
  display: flex;
  flex-direction: column;
  margin: 0;

  > div { align-items: baseline; border-top: 1px solid var(--admin-line); display: flex; gap: 1rem; justify-content: space-between; padding: 0.5rem 0; }
  > div:first-child { border-top: 0; padding-top: 0; }
  dt { color: var(--admin-muted); font-size: 0.8rem; }
  dd { font-size: 0.86rem; font-variant-numeric: tabular-nums; font-weight: 800; margin: 0; }
  .is-good dd { color: var(--admin-success); }
  .is-bad dd { color: var(--admin-danger); }
  .is-muted dd { color: var(--admin-muted); font-weight: 600; }
}

.dash__catalog {
  align-items: center;
  color: var(--admin-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.78rem;
  gap: 0.45rem;
  margin: 0;
  padding: 0 0.25rem 0.5rem;

  i { color: var(--admin-subtle); }
}

@media (min-width: 640px) {
  .recent__who { flex: 1 1 200px; }
}

@media (min-width: 1000px) {
  .kpi { flex: 1 1 0; }
  .dash__charts { flex-direction: row; }
  .dash__bottom { align-items: flex-start; flex-direction: row; }
  .dash__side { flex: 0 0 340px; }
}

@media (prefers-reduced-motion: reduce) {
  .kpi--action { transition: none; &:hover { transform: none; } }
}
</style>
