<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import UserService, { type CustomerDTO, type CustomerPointsDTO } from '@/services/UserService'
import { useToast } from '@/composables/useToast'

const { error } = useToast()
const customers = ref<CustomerDTO[]>([])
const summary = ref<{ count: number; totalPoints: number }>({ count: 0, totalPoints: 0 })
const loading = ref(true)
const search = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const detail = ref<CustomerPointsDTO | null>(null)
const detailOpen = ref(false)
const detailLoading = ref(false)

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
  detailOpen.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = (await UserService.getCustomerPoints(customer._id)).data
  } catch {
    error('No se pudo cargar el historial')
    detailOpen.value = false
  } finally {
    detailLoading.value = false
  }
}

function closeDetail() {
  detailOpen.value = false
  detail.value = null
}

function fmtDate(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(load)
</script>

<template>
  <AdminLayout>
    <main class="customers">
      <section class="hero panel">
        <div>
          <p>Programa de fidelidad</p>
          <h1>Clientes y puntos</h1>
          <span>Mira quiénes acumulan puntos y cuántos tiene cada cliente.</span>
        </div>
      </section>

      <section class="stats">
        <article class="panel"><span>Clientes con cuenta</span><strong>{{ summary.count }}</strong></article>
        <article class="panel"><span>Puntos acumulados (total)</span><strong>{{ summary.totalPoints.toLocaleString('es-EC') }}</strong></article>
      </section>

      <div class="search">
        <i class="fa-solid fa-magnifying-glass" />
        <input v-model="search" type="search" placeholder="Buscar por nombre, correo o teléfono" @input="onSearch" />
      </div>

      <section class="panel list">
        <div v-if="loading" class="empty">Cargando clientes…</div>
        <div v-else-if="!customers.length" class="empty"><i class="fa-solid fa-user-group" /> Aún no hay clientes con cuenta.</div>
        <table v-else>
          <thead>
            <tr><th>Cliente</th><th>Contacto</th><th class="num">Puntos</th><th class="num">Movs.</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="c in customers" :key="c._id">
              <td><strong>{{ c.name || 'Sin nombre' }}</strong></td>
              <td class="contact"><span>{{ c.email }}</span><small v-if="c.phone">{{ c.phone }}</small></td>
              <td class="num"><span class="points">{{ c.points.toLocaleString('es-EC') }}</span></td>
              <td class="num">{{ c.movements }}</td>
              <td class="num"><button type="button" class="link" @click="openDetail(c)">Ver historial</button></td>
            </tr>
          </tbody>
        </table>
      </section>
    </main>

    <transition name="modal-fade">
      <div v-if="detailOpen" class="modal-backdrop" @click.self="closeDetail">
        <div class="modal">
          <header>
            <div>
              <h2>{{ detail?.name || 'Cliente' }}</h2>
              <p>{{ detail?.email }}<template v-if="detail?.phone"> · {{ detail?.phone }}</template></p>
            </div>
            <button type="button" class="close" @click="closeDetail"><i class="fa-solid fa-xmark" /></button>
          </header>
          <div class="balance"><span>Puntos disponibles</span><strong>{{ (detail?.points || 0).toLocaleString('es-EC') }}</strong></div>
          <div v-if="detailLoading" class="empty">Cargando historial…</div>
          <ul v-else-if="detail?.history?.length" class="history">
            <li v-for="(h, i) in detail.history" :key="i">
              <span class="amount" :class="h.amount >= 0 ? 'pos' : 'neg'">{{ h.amount >= 0 ? '+' : '' }}{{ h.amount }}</span>
              <span class="reason">{{ h.reason || 'Movimiento' }}</span>
              <small>{{ fmtDate(h.date) }}</small>
            </li>
          </ul>
          <div v-else class="empty">Sin movimientos de puntos todavía.</div>
        </div>
      </div>
    </transition>
  </AdminLayout>
</template>

<style scoped lang="scss">
.customers { display: flex; flex-direction: column; gap: 1rem; padding: clamp(.75rem, 2vw, 1.5rem); }
.panel { background: #fff; border: 1px solid var(--admin-line, rgba(8,17,13,.08)); border-radius: 18px; }
.hero { align-items: flex-start; background: linear-gradient(135deg, #173e22, #235931); color: #fff; padding: 1.25rem; }
.hero p { color: #efd537; font-size: .7rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
.hero h1 { font-size: clamp(1.6rem, 4vw, 2.3rem); margin: .35rem 0; }
.hero span { color: rgba(255,255,255,.78); }

.stats { display: flex; flex-wrap: wrap; gap: .65rem; }
.stats article { display: flex; flex: 1 1 180px; flex-direction: column; gap: .25rem; padding: .9rem 1rem; }
.stats span { color: var(--admin-muted, #667); font-size: .68rem; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
.stats strong { color: #235931; font-size: 1.6rem; }

.search { align-items: center; background: #fff; border: 1px solid var(--admin-line, rgba(8,17,13,.08)); border-radius: 14px; display: flex; gap: .6rem; padding: .2rem .9rem; }
.search i { color: #9aa894; }
.search input { background: transparent; border: 0; flex: 1; font-size: .95rem; min-height: 46px; outline: none; }

.list { overflow: hidden; }
.list .empty { align-items: center; color: var(--admin-muted, #667); display: flex; flex-direction: column; gap: .5rem; justify-content: center; padding: 3rem 1rem; }
table { border-collapse: collapse; width: 100%; }
th { color: var(--admin-muted, #667); font-size: .66rem; font-weight: 800; letter-spacing: .06em; padding: .85rem 1rem; text-align: left; text-transform: uppercase; }
td { border-top: 1px solid var(--admin-line, rgba(8,17,13,.06)); font-size: .9rem; padding: .85rem 1rem; vertical-align: middle; }
.num { text-align: right; }
.contact { display: flex; flex-direction: column; }
.contact small { color: var(--admin-muted, #889); }
.points { background: rgba(0,165,35,.12); border-radius: 999px; color: #14682a; font-weight: 800; padding: .25rem .7rem; }
.link { background: none; border: 0; color: #235931; cursor: pointer; font-weight: 700; }

.modal-backdrop { align-items: center; background: rgba(8,17,13,.5); display: flex; inset: 0; justify-content: center; padding: 1rem; position: fixed; z-index: 3000; }
.modal { background: #fff; border-radius: 18px; max-height: 85vh; max-width: 460px; overflow-y: auto; padding: 1.25rem; width: 100%; }
.modal header { align-items: flex-start; display: flex; justify-content: space-between; }
.modal h2 { font-size: 1.2rem; margin: 0; }
.modal header p { color: var(--admin-muted, #667); font-size: .82rem; margin: .2rem 0 0; }
.close { background: rgba(8,17,13,.06); border: 0; border-radius: 999px; cursor: pointer; height: 34px; width: 34px; }
.balance { align-items: center; background: rgba(0,165,35,.1); border-radius: 14px; display: flex; justify-content: space-between; margin: 1rem 0; padding: .8rem 1rem; }
.balance span { color: #14682a; font-weight: 700; }
.balance strong { color: #14682a; font-size: 1.5rem; }
.history { display: flex; flex-direction: column; gap: .5rem; list-style: none; margin: 0; padding: 0; }
.history li { align-items: center; border: 1px solid var(--admin-line, rgba(8,17,13,.08)); border-radius: 12px; display: grid; gap: .1rem .8rem; grid-template-columns: auto 1fr; padding: .6rem .85rem; }
.history .amount { font-weight: 800; grid-row: span 2; }
.history .amount.pos { color: #14682a; }
.history .amount.neg { color: #a02828; }
.history .reason { font-size: .88rem; font-weight: 600; }
.history small { color: var(--admin-muted, #889); grid-column: 2; }
.empty { color: var(--admin-muted, #667); padding: 1.5rem 0; text-align: center; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity .2s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

@media (min-width: 700px) { .hero { align-items: center; } }
</style>
