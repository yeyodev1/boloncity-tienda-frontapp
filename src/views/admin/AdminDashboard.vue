<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import { AdminDateRangeFilter, AdminHourlyChart, AdminRevenueChart } from '@/components/admin'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import ProductService, { type ProductDTO } from '@/services/ProductService'
import CategoryService, { type CategoryDTO } from '@/services/CategoryService'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import UserService, { type UserDTO } from '@/services/UserService'
import { orderStatusLabels, orderStatusTones } from '@/composables/useOrdersBoard'
import { useRouter } from 'vue-router'

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

const pendingOrders = computed(() => orders.value.filter((o) => o.status === 'pending').length)
const preparingOrders = computed(() => orders.value.filter((o) => o.status === 'preparing').length)
const deliveredOrders = computed(() => orders.value.filter((o) => o.status === 'delivered').length)

const totalRevenue = computed(() => {
  return orders.value
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (o.total || 0), 0)
})
const deliveryCharged = computed(() => orders.value.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + (o.deliveryCost || 0), 0))
const pickerDeliveryCost = computed(() => orders.value.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + Math.round((o.picker?.deliveryFee || 0) * 100), 0))
const deliveryDifference = computed(() => deliveryCharged.value - pickerDeliveryCost.value)
const pointsGranted = computed(() => orders.value.reduce((sum, o) => sum + (o.pointsEarned || 0), 0))

const totalProducts = computed(() => products.value.length)
const activeProducts = computed(() => products.value.filter((p) => p.isAvailable).length)
const totalCategories = computed(() => categories.value.length)
const activeBranches = computed(() => branches.value.filter((b) => b.isActive).length)
const totalUsers = computed(() => users.value.length)

const recentOrders = computed(() => {
  return [...orders.value]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 10)
})

const statusGroups = computed(() => {
  const groups: Record<string, OrderDTO[]> = {}
  for (const order of orders.value) {
    const status = order.status
    if (!groups[status]) groups[status] = []
    groups[status].push(order)
  }
  return groups
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

function goStore() {
  window.open('/', '_blank')
}

function goCatalog() {
  window.open('/catalogo', '_blank')
}

function applyDateRange() {
  if (startDate.value > endDate.value) [startDate.value, endDate.value] = [endDate.value, startDate.value]
  void load()
}
</script>

<template>
  <AdminLayout>
    <section class="dashboard">
      <header class="dashboard-hero panel">
        <div>
          <p class="eyebrow">Panel interno · Boloncity</p>
          <h1>Dashboard</h1>
          <p>Resumen general de operaci&oacute;n, ventas y movimiento.</p>
        </div>
        <div class="hero-actions">
          <button class="hero-btn hero-btn--store" type="button" @click="goStore">
            <i class="fa-solid fa-store" />
            Ver tienda
          </button>
          <button class="hero-btn hero-btn--catalog" type="button" @click="goCatalog">
            <i class="fa-solid fa-eye" />
            Ver cat&aacute;logo
          </button>
        </div>
      </header>

      <SkeletonLoader v-if="loading" type="card" :count="4" />

      <template v-else>
        <AdminDateRangeFilter v-model:start-date="startDate" v-model:end-date="endDate" :loading="loading" @apply="applyDateRange" />
        <section class="stats-grid">
          <article class="panel stat-card stat-card--orders">
            <i class="stat-card__icon fa-solid fa-receipt" />
            <span class="stat-card__value">{{ orders.length }}</span>
            <span class="stat-card__label">Ordenes totales</span>
          </article>
          <article class="panel stat-card stat-card--delivered">
            <i class="stat-card__icon fa-solid fa-circle-check" />
            <span class="stat-card__value">{{ deliveredOrders }}</span>
            <span class="stat-card__label">Entregadas</span>
          </article>
          <article class="panel stat-card stat-card--pending">
            <i class="stat-card__icon fa-solid fa-clock" />
            <span class="stat-card__value">{{ pendingOrders }}</span>
            <span class="stat-card__label">Pendientes</span>
          </article>
          <article class="panel stat-card stat-card--preparing">
            <i class="stat-card__icon fa-solid fa-fire" />
            <span class="stat-card__value">{{ preparingOrders }}</span>
            <span class="stat-card__label">En preparaci&oacute;n</span>
          </article>
          <article class="panel stat-card stat-card--products">
            <i class="stat-card__icon fa-solid fa-box" />
            <span class="stat-card__value">{{ totalProducts }}</span>
            <span class="stat-card__label">Productos</span>
          </article>
          <article class="panel stat-card stat-card--available">
            <i class="stat-card__icon fa-solid fa-check" />
            <span class="stat-card__value">{{ activeProducts }}</span>
            <span class="stat-card__label">Disponibles</span>
          </article>
          <article class="panel stat-card stat-card--categories">
            <i class="stat-card__icon fa-solid fa-layer-group" />
            <span class="stat-card__value">{{ totalCategories }}</span>
            <span class="stat-card__label">Categor&iacute;as</span>
          </article>
          <article class="panel stat-card stat-card--branches">
            <i class="stat-card__icon fa-solid fa-location-dot" />
            <span class="stat-card__value">{{ activeBranches }}</span>
            <span class="stat-card__label">Sucursales activas</span>
          </article>
          <article class="panel stat-card stat-card--users">
            <i class="stat-card__icon fa-solid fa-users" />
            <span class="stat-card__value">{{ totalUsers }}</span>
            <span class="stat-card__label">Usuarios</span>
          </article>
          <article class="panel stat-card stat-card--revenue">
            <i class="stat-card__icon fa-solid fa-dollar-sign" />
            <span class="stat-card__value">${{ (totalRevenue / 100).toLocaleString('es-EC') }}</span>
            <span class="stat-card__label">Ingresos</span>
          </article>
          <article class="panel stat-card stat-card--delivery">
            <i class="stat-card__icon fa-solid fa-truck-fast" />
            <span class="stat-card__value">${{ (deliveryCharged / 100).toLocaleString('es-EC') }}</span>
            <span class="stat-card__label">Delivery cobrado</span>
          </article>
          <article class="panel stat-card stat-card--picker">
            <i class="stat-card__icon fa-solid fa-scale-balanced" />
            <span class="stat-card__value">${{ (deliveryDifference / 100).toLocaleString('es-EC') }}</span>
            <span class="stat-card__label">Diferencia delivery</span>
          </article>
          <article class="panel stat-card stat-card--points">
            <i class="stat-card__icon fa-solid fa-star" />
            <span class="stat-card__value">{{ pointsGranted }}</span>
            <span class="stat-card__label">Puntos entregados</span>
          </article>
        </section>

        <AdminHourlyChart :orders="orders" />
        <AdminRevenueChart :orders="orders" />

        <section class="dashboard-main">
          <div class="panel dashboard-recent">
            <div class="section-head">
              <h2>&Uacute;ltimas ordenes</h2>
              <button type="button" @click="router.push('/admin/ordenes')">Ver todas</button>
            </div>

            <div v-if="!recentOrders.length" class="dashboard-empty">
              <p>No hay ordenes registradas a&uacute;n.</p>
            </div>

            <table v-else class="dashboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order._id">
                  <td class="dashboard-table__number">#{{ order.orderNumber }}</td>
                  <td>{{ order.customerEmail }}</td>
                  <td>${{ (order.total / 100).toLocaleString('es-EC') }}</td>
                  <td>
                    <span class="dashboard-table__status" :class="orderStatusTones[order.status as keyof typeof orderStatusTones] || ''">
                      {{ orderStatusLabels[order.status as keyof typeof orderStatusLabels] || order.status }}
                    </span>
                  </td>
                  <td>
                    <button type="button" class="dashboard-table__action" @click="router.push(`/admin/ordenes/${order._id}`)">Ver</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <aside class="panel dashboard-statuses">
            <div class="section-head">
              <h2>Resumen por estado</h2>
            </div>
            <div v-for="(group, status) in statusGroups" :key="status" class="status-row">
              <span class="status-row__label" :class="orderStatusTones[status as keyof typeof orderStatusTones] || ''">
                {{ orderStatusLabels[status as keyof typeof orderStatusLabels] || status }}
              </span>
              <span class="status-row__count">{{ group.length }}</span>
            </div>
          </aside>
        </section>
      </template>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
.dashboard {
  color: $text-dark;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(0.75rem, 2vw, 1.5rem);
}

.dashboard-hero {
  align-items: flex-start;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  padding: 1.25rem;
}

.dashboard-hero h1 {
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  letter-spacing: -0.04em;
  margin-top: 0.35rem;
}

.dashboard-hero p {
  color: rgba($text-dark, 0.68);
  margin-top: 0.45rem;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.hero-btn {
  align-items: center;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  gap: 0.6rem;
  min-height: 48px;
  padding: 0.75rem 1.2rem;
  font-weight: 700;
  transition: transform 0.2s, box-shadow 0.2s;
}

.hero-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.hero-btn--store {
  background: $primary-dark;
  color: $white;
}

.hero-btn--catalog {
  background: rgba($primary-dark, 0.1);
  color: $primary-dark;
}

.stats-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.stats-grid > * {
  flex: 1 1 160px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.1rem;
  position: relative;
  overflow: hidden;
}

.stat-card__icon {
  font-size: 1.6rem;
  opacity: 0.2;
  position: absolute;
  right: 0.8rem;
  top: 0.8rem;
}

.stat-card__value {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  position: relative;
}

.stat-card__label {
  color: rgba($text-dark, 0.6);
  font-size: 0.82rem;
  font-weight: 600;
  position: relative;
}

.stat-card--orders { border-left: 4px solid #6366f1; .stat-card__icon { color: #6366f1; } }
.stat-card--delivered { border-left: 4px solid #10b981; .stat-card__icon { color: #10b981; } }
.stat-card--pending { border-left: 4px solid #f59e0b; .stat-card__icon { color: #f59e0b; } }
.stat-card--preparing { border-left: 4px solid #f97316; .stat-card__icon { color: #f97316; } }
.stat-card--products { border-left: 4px solid #8b5cf6; .stat-card__icon { color: #8b5cf6; } }
.stat-card--available { border-left: 4px solid #22c55e; .stat-card__icon { color: #22c55e; } }
.stat-card--categories { border-left: 4px solid #ec4899; .stat-card__icon { color: #ec4899; } }
.stat-card--branches { border-left: 4px solid #3b82f6; .stat-card__icon { color: #3b82f6; } }
.stat-card--users { border-left: 4px solid #14b8a6; .stat-card__icon { color: #14b8a6; } }
.stat-card--revenue { border-left: 4px solid $primary-dark; .stat-card__icon { color: $primary-dark; } }
.stat-card--delivery { border-left: 4px solid $alert-info; .stat-card__icon { color: $alert-info; } }
.stat-card--picker { border-left: 4px solid $secondary; .stat-card__icon { color: darken($secondary, 25%); } }
.stat-card--points { border-left: 4px solid #b79200; .stat-card__icon { color: #b79200; } }


.dashboard-main {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard-recent {
  flex: 1 1 auto;
  min-width: 0;
  padding: 1.25rem;
}

.dashboard-statuses {
  flex: 0 0 auto;
  padding: 1.25rem;
}

.section-head {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-head h2 {
  font-size: 1.1rem;
  letter-spacing: -0.02em;
}

.section-head button {
  background: rgba($primary-dark, 0.1);
  border: 0;
  border-radius: 999px;
  color: $primary-dark;
  cursor: pointer;
  min-height: 40px;
  padding: 0.6rem 1rem;
  transition: background 0.2s;
}

.section-head button:hover {
  background: rgba($primary-dark, 0.2);
}

.dashboard-empty {
  color: rgba($text-dark, 0.5);
  padding: 2rem 0;
  text-align: center;
}

.dashboard-table {
  border-collapse: collapse;
  width: 100%;
}

.dashboard-table thead {
  display: none;
}

.dashboard-table tr {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.75rem 0;
}

.dashboard-table th {
  color: rgba($text-dark, 0.55);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 0.5rem 0.5rem 0.5rem 0;
  text-align: left;
  text-transform: uppercase;
}

.dashboard-table td {
  border: 0;
  padding: 0;
}

.dashboard-table__number {
  font-weight: 700;
}

.dashboard-table__status {
  border-radius: 999px;
  display: inline-block;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
}

.dashboard-table__action {
  background: transparent;
  border: 1px solid rgba($text-dark, 0.12);
  border-radius: 999px;
  color: $text-dark;
  cursor: pointer;
  min-height: 36px;
  padding: 0.4rem 0.8rem;
}

::v-deep(.tone--amber) { background: rgba($alert-warning, 0.12); color: darken($alert-warning, 15%); }
::v-deep(.tone--blue) { background: rgba($alert-info, 0.12); color: darken($alert-info, 15%); }
::v-deep(.tone--green) { background: rgba($alert-success, 0.12); color: darken($alert-success, 15%); }
::v-deep(.tone--violet) { background: rgba($text-dark, 0.08); color: $text-dark; }
::v-deep(.tone--neutral) { background: rgba($text-dark, 0.06); color: rgba($text-dark, 0.7); }
::v-deep(.tone--red) { background: rgba($alert-error, 0.12); color: darken($alert-error, 15%); }

.status-row {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-top: 1px solid rgba($text-dark, 0.06);
}

.status-row:first-child {
  border-top: 0;
}

.status-row__count {
  font-weight: 800;
  font-size: 1.1rem;
}

@media (min-width: 961px) {
  .dashboard-main {
    flex-direction: row;
  }

  .dashboard-statuses {
    flex-basis: 260px;
  }
}

@media (min-width: 641px) {
  .dashboard-hero {
    flex-direction: row;
  }

  .dashboard-table thead {
    display: table-header-group;
  }

  .dashboard-table tr {
    display: table-row;
    padding: 0;
  }

  .dashboard-table td {
    border-top: 1px solid rgba($text-dark, 0.06);
    padding: 0.75rem 0.5rem 0.75rem 0;
  }
}
</style>
