<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import CartTrackingService, { type AbandonedCartRow, type CartMetrics } from '@/services/CartTrackingService'
import { relativeTime } from '@/components/admin/order-detail/orderStory'

/** Embudo de carritos abandonados: de cuántos se fueron a cuántos volvieron a comprar. */
const metrics = ref<CartMetrics | null>(null)
const carts = ref<AbandonedCartRow[]>([])
const cargando = ref(true)
const error = ref('')
const filtro = ref('')
const enviando = ref('')

const dinero = (centavos: number) => `$${(centavos / 100).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const filtros = [
  { value: '', label: 'Todos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'notified', label: 'Recordados' },
  { value: 'recovered', label: 'Recuperados' },
  { value: 'unreachable', label: 'Sin contacto' },
  { value: 'expired', label: 'Vencidos' },
]

const etiquetaEstado: Record<string, string> = {
  pending: 'Pendiente',
  notified: 'Recordatorio enviado',
  recovered: 'Recuperado',
  expired: 'Vencido',
  unreachable: 'Sin datos de contacto',
}

/** Los 5 pasos del embudo, cada uno con el % respecto al paso anterior. */
const embudo = computed(() => {
  const m = metrics.value
  if (!m) return []
  const pasos = [
    { label: 'Abandonaron', value: m.carritosAbandonados, icon: 'fa-cart-shopping' },
    { label: 'Dejaron sus datos', value: m.conDatosDeContacto, icon: 'fa-address-card' },
    { label: 'Recibieron recordatorio', value: m.mensajesEnviados, icon: 'fa-envelope' },
    { label: 'Volvieron', value: m.volvieronDesdeElMensaje, icon: 'fa-arrow-rotate-left' },
    { label: 'Compraron', value: m.ventasRecuperadas, icon: 'fa-bag-shopping' },
  ]
  const max = Math.max(1, pasos[0]?.value || 0)
  return pasos.map((paso, index) => {
    const previous = index > 0 ? pasos[index - 1]?.value || 0 : 0
    return {
      ...paso,
      width: Math.max(6, (paso.value / max) * 100),
      rate: previous ? Math.round((paso.value / previous) * 100) : null,
    }
  })
})

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const [m, c] = await Promise.all([
      CartTrackingService.metrics(),
      CartTrackingService.list(filtro.value || undefined, 100),
    ])
    metrics.value = m.data
    carts.value = c.data
  } catch {
    error.value = 'No pudimos cargar los carritos.'
  } finally {
    cargando.value = false
  }
}

function elegirFiltro(value: string) {
  filtro.value = value
  void cargar()
}

async function probarMensaje(row: AbandonedCartRow) {
  enviando.value = row.id
  try {
    const { data } = await CartTrackingService.sendTestMessage(row.id)
    if (!data.sent) error.value = `No se pudo enviar: ${data.error || 'error desconocido'}`
    await cargar()
  } catch {
    error.value = 'No se pudo enviar el recordatorio.'
  } finally {
    enviando.value = ''
  }
}

onMounted(cargar)
</script>

<template>
  <AdminLayout>
    <section class="carts">
      <header class="carts__head">
        <p class="carts__eyebrow">Recuperación</p>
        <h1>Carritos abandonados</h1>
        <p class="carts__lead">Clientes que armaron un pedido y no lo terminaron. El recordatorio sale por correo con el link a su carrito.</p>
      </header>

      <p v-if="error" class="carts__error" role="alert"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {{ error }}</p>

      <template v-if="metrics">
        <div class="money">
          <article class="money__card money__card--won">
            <span>Recuperado</span>
            <strong>{{ dinero(metrics.valorRecuperado) }}</strong>
            <small>{{ metrics.ventasRecuperadas }} {{ metrics.ventasRecuperadas === 1 ? 'venta' : 'ventas' }} · {{ metrics.tasaDeRecuperacion }}% compró tras el recordatorio</small>
          </article>
          <article class="money__card money__card--lost">
            <span>Todavía en carritos</span>
            <strong>{{ dinero(metrics.valorPerdido) }}</strong>
            <small>{{ metrics.tasaDeApertura }}% abrió el link</small>
          </article>
        </div>

        <section class="funnel" aria-label="Embudo de recuperación">
          <h2>El embudo</h2>
          <ol>
            <li v-for="paso in embudo" :key="paso.label">
              <span class="funnel__label"><i :class="['fa-solid', paso.icon]" aria-hidden="true" /> {{ paso.label }}</span>
              <span class="funnel__track"><span class="funnel__bar" :style="{ width: `${paso.width}%` }" /></span>
              <b>{{ paso.value }}</b>
              <small>{{ paso.rate !== null ? `${paso.rate}%` : '' }}</small>
            </li>
          </ol>
        </section>
      </template>

      <section class="list">
        <div class="list__filters" role="group" aria-label="Filtrar carritos">
          <button v-for="f in filtros" :key="f.value" type="button" :class="{ active: filtro === f.value }" :aria-pressed="filtro === f.value" @click="elegirFiltro(f.value)">{{ f.label }}</button>
        </div>

        <div v-if="cargando" class="list__skeleton" aria-hidden="true"><span v-for="n in 4" :key="n" /></div>
        <p v-else-if="!carts.length" class="list__empty"><i class="fa-solid fa-cart-shopping" aria-hidden="true" /> No hay carritos {{ filtro ? 'con ese estado' : 'registrados todavía' }}.</p>
        <ul v-else>
          <li v-for="row in carts" :key="row.id" class="cart">
            <div class="cart__who">
              <strong>{{ row.customerName || 'Sin nombre' }}</strong>
              <small>
                <template v-if="row.customerPhone">{{ row.customerPhone }}</template>
                <template v-if="row.customerPhone && row.customerEmail"> · </template>
                <template v-if="row.customerEmail">{{ row.customerEmail }}</template>
                <em v-if="!row.customerPhone && !row.customerEmail">sin datos de contacto</em>
              </small>
            </div>
            <div class="cart__what">
              <b>{{ dinero(row.subtotal) }}</b>
              <small>{{ row.items }} {{ row.items === 1 ? 'producto' : 'productos' }}<template v-if="row.branch"> · {{ row.branch }}</template></small>
            </div>
            <div class="cart__state">
              <span class="badge" :data-state="row.status">{{ etiquetaEstado[row.status] || row.status }}</span>
              <small v-if="row.recoveredOrderNumber" class="cart__won"><i class="fa-solid fa-check" aria-hidden="true" /> {{ row.recoveredOrderNumber }} · {{ dinero(row.recoveredTotal) }}</small>
              <small v-else-if="row.clickedAt">Abrió el link</small>
              <small v-else>{{ relativeTime(row.lastActivityAt) }}</small>
              <small v-if="row.notifyError" class="cart__err">{{ row.notifyError }}</small>
            </div>
            <button
              v-if="(row.customerPhone || row.customerEmail) && row.status !== 'recovered'"
              type="button"
              class="cart__send"
              :disabled="enviando === row.id"
              @click="probarMensaje(row)"
            >
              <i :class="enviando === row.id ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-paper-plane'" aria-hidden="true" /> {{ enviando === row.id ? 'Enviando' : 'Recordar' }}
            </button>
          </li>
        </ul>
      </section>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
.carts { color: var(--admin-text); display: flex; flex-direction: column; gap: 0.9rem; margin: 0 auto; max-width: 1080px; width: 100%; }

.carts__head h1 { font-size: clamp(1.5rem, 4vw, 2.1rem); font-weight: 800; letter-spacing: -0.04em; margin: 0.15rem 0 0; }
.carts__eyebrow { color: var(--admin-accent); font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; margin: 0; text-transform: uppercase; }
.carts__lead { color: var(--admin-muted); font-size: 0.88rem; line-height: 1.5; margin: 0.35rem 0 0; max-width: 60ch; }

.carts__error {
  align-items: center;
  background: var(--admin-danger-soft);
  border-radius: 12px;
  color: var(--admin-danger);
  display: flex;
  font-weight: 700;
  gap: 0.5rem;
  margin: 0;
  padding: 0.7rem 0.9rem;
}

.money { display: flex; flex-wrap: wrap; gap: 0.75rem; }

.money__card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius, 18px);
  box-shadow: var(--admin-shadow);
  display: flex;
  flex: 1 1 240px;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1rem 1.1rem;

  span { color: var(--admin-muted); font-size: 0.76rem; font-weight: 700; }
  strong { font-size: clamp(1.5rem, 5vw, 2rem); font-variant-numeric: tabular-nums; font-weight: 800; letter-spacing: -0.03em; }
  small { color: var(--admin-muted); font-size: 0.76rem; }
}

.money__card--won strong { color: var(--admin-success); }
.money__card--lost strong { color: var(--admin-warning); }

.funnel {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius, 18px);
  box-shadow: var(--admin-shadow);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem 1.1rem;

  h2 { font-size: 0.98rem; font-weight: 800; margin: 0; }
  ol { display: flex; flex-direction: column; gap: 0.55rem; list-style: none; margin: 0; padding: 0; }
  li { align-items: center; display: flex; flex-wrap: wrap; gap: 0.3rem 0.7rem; }
  b { flex: 0 0 2.5rem; font-variant-numeric: tabular-nums; text-align: right; }
  small { color: var(--admin-muted); flex: 0 0 2.6rem; font-size: 0.72rem; font-variant-numeric: tabular-nums; }
}

.funnel__label { color: var(--admin-muted); flex: 1 1 100%; font-size: 0.8rem; i { color: var(--admin-accent); margin-right: 0.3rem; width: 1rem; } }
.funnel__track { background: var(--admin-hover); border-radius: 999px; flex: 1 1 auto; height: 10px; overflow: hidden; }
.funnel__bar { background: linear-gradient(90deg, var(--admin-accent), color-mix(in srgb, var(--admin-accent) 60%, var(--admin-yellow))); border-radius: 999px; display: block; height: 100%; transition: width 0.6s var(--admin-ease); }

.list {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius, 18px);
  box-shadow: var(--admin-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  ul { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }
}

.list__filters {
  border-bottom: 1px solid var(--admin-line);
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  padding: 0.65rem;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }

  button {
    background: var(--admin-hover);
    border-radius: 999px;
    color: var(--admin-text);
    flex: 0 0 auto;
    font-size: 0.76rem;
    font-weight: 800;
    min-height: 34px;
    padding: 0.3rem 0.8rem;

    &.active { background: var(--admin-accent); color: var(--admin-on-accent); }
    &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
  }
}

.list__empty { align-items: center; color: var(--admin-muted); display: flex; flex-direction: column; gap: 0.5rem; margin: 0; padding: 2.5rem 1rem; text-align: center; i { color: var(--admin-subtle); font-size: 1.4rem; } }
.list__skeleton { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.75rem; span { animation: pulse 1.2s ease-in-out infinite; background: var(--admin-hover); border-radius: 12px; height: 56px; } }
@keyframes pulse { 50% { opacity: 0.45; } }

.cart {
  align-items: center;
  border-top: 1px solid var(--admin-line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  padding: 0.8rem 1rem;

  &:first-child { border-top: 0; }
  small { color: var(--admin-muted); font-size: 0.74rem; }
}

.cart__who { display: flex; flex: 1 1 220px; flex-direction: column; min-width: 0; strong { font-size: 0.9rem; } small { overflow-wrap: anywhere; } }
.cart__what { display: flex; flex: 0 0 120px; flex-direction: column; b { font-variant-numeric: tabular-nums; } }
.cart__state { align-items: flex-start; display: flex; flex: 1 1 170px; flex-direction: column; gap: 0.2rem; }
.cart__won { color: var(--admin-success) !important; font-weight: 700; }
.cart__err { color: var(--admin-danger) !important; }

.badge {
  background: var(--admin-hover);
  border-radius: 999px;
  color: var(--admin-muted);
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.6rem;

  &[data-state='pending'] { background: var(--admin-warning-soft); color: var(--admin-warning); }
  &[data-state='notified'] { background: var(--admin-info-soft); color: var(--admin-info); }
  &[data-state='recovered'] { background: var(--admin-success-soft); color: var(--admin-success); }
  &[data-state='unreachable'] { background: var(--admin-danger-soft); color: var(--admin-danger); }
}

.cart__send {
  align-items: center;
  background: var(--admin-accent);
  border-radius: 999px;
  color: var(--admin-on-accent);
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-weight: 800;
  gap: 0.4rem;
  margin-left: auto;
  min-height: 38px;
  padding: 0.4rem 0.9rem;

  &:disabled { cursor: wait; opacity: 0.6; }
}

@media (min-width: 700px) {
  .funnel li { flex-wrap: nowrap; }
  .funnel__label { flex: 0 0 210px; }
}

@media (prefers-reduced-motion: reduce) {
  .funnel__bar { transition: none; }
  .list__skeleton span { animation: none; }
}
</style>
