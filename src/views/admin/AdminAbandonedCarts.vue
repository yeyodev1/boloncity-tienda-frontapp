<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CartTrackingService, { type AbandonedCartRow, type CartMetrics } from '@/services/CartTrackingService'

/** Tablero del embudo de carritos abandonados: las cinco métricas del negocio, en orden. */
const metrics = ref<CartMetrics | null>(null)
const carts = ref<AbandonedCartRow[]>([])
const cargando = ref(true)
const error = ref('')
const filtro = ref('')
const enviando = ref('')

const dinero = (centavos: number) => `$${(centavos / 100).toFixed(2)}`

const canalListo = computed(() => metrics.value && metrics.value.canal !== 'none')

const etiquetaEstado: Record<string, string> = {
  pending: 'Pendiente',
  notified: 'Mensaje enviado',
  recovered: 'Recuperado',
  expired: 'Vencido',
  unreachable: 'Sin datos de contacto',
}

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

async function probarMensaje(row: AbandonedCartRow) {
  enviando.value = row.id
  try {
    const { data } = await CartTrackingService.sendTestMessage(row.id)
    if (!data.sent) error.value = `No se pudo enviar: ${data.error || 'error desconocido'}`
    await cargar()
  } catch {
    error.value = 'No se pudo enviar el mensaje.'
  } finally {
    enviando.value = ''
  }
}

onMounted(cargar)
</script>

<template>
  <main class="carts">
    <header class="carts__head">
      <div>
        <p class="carts__eyebrow">Recuperación</p>
        <h1>Carritos abandonados</h1>
      </div>
      <select v-model="filtro" @change="cargar">
        <option value="">Todos</option>
        <option value="pending">Pendientes</option>
        <option value="notified">Con mensaje enviado</option>
        <option value="recovered">Recuperados</option>
        <option value="unreachable">Sin datos de contacto</option>
        <option value="expired">Vencidos</option>
      </select>
    </header>

    <p v-if="error" class="carts__error">{{ error }}</p>

    <p v-if="metrics && !canalListo" class="carts__warn">
      ⚠️ No hay canal de WhatsApp configurado todavía: los recordatorios salen por correo a quien
      dejó su email. Los que solo dejaron teléfono esperan hasta que se carguen las credenciales del proveedor.
    </p>

    <section v-if="metrics" class="carts__stats">
      <article class="stat stat--abandoned">
        <span class="stat__value">{{ metrics.carritosAbandonados }}</span>
        <span class="stat__label">Carritos abandonados</span>
      </article>
      <article class="stat stat--leads">
        <span class="stat__value">{{ metrics.conDatosDeContacto }}</span>
        <span class="stat__label">Dejaron sus datos</span>
      </article>
      <article class="stat stat--sent">
        <span class="stat__value">{{ metrics.mensajesEnviados }}</span>
        <span class="stat__label">Mensajes enviados</span>
      </article>
      <article class="stat stat--back">
        <span class="stat__value">{{ metrics.volvieronDesdeElMensaje }}</span>
        <span class="stat__label">Volvieron desde el mensaje</span>
      </article>
      <article class="stat stat--won">
        <span class="stat__value">{{ metrics.ventasRecuperadas }}</span>
        <span class="stat__label">Ventas recuperadas</span>
      </article>
      <article class="stat stat--money">
        <span class="stat__value">{{ dinero(metrics.valorRecuperado) }}</span>
        <span class="stat__label">Valor recuperado</span>
      </article>
      <article class="stat stat--rate">
        <span class="stat__value">{{ metrics.tasaDeApertura }}%</span>
        <span class="stat__label">Abrieron el link</span>
      </article>
      <article class="stat stat--rate">
        <span class="stat__value">{{ metrics.tasaDeRecuperacion }}%</span>
        <span class="stat__label">Compraron tras el mensaje</span>
      </article>
      <article class="stat stat--lost">
        <span class="stat__value">{{ dinero(metrics.valorPerdido) }}</span>
        <span class="stat__label">En carritos sin cerrar</span>
      </article>
    </section>

    <p v-if="cargando">Cargando...</p>

    <table v-else-if="carts.length" class="carts__table">
      <thead>
        <tr>
          <th>Cliente</th><th>Contacto</th><th>Carrito</th><th>Estado</th><th>Última actividad</th><th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in carts" :key="row.id">
          <td>
            {{ row.customerName || '—' }}
            <small v-if="row.branch">{{ row.branch }}</small>
          </td>
          <td>
            <span v-if="row.customerPhone">{{ row.customerPhone }}</span>
            <small v-if="row.customerEmail">{{ row.customerEmail }}</small>
            <em v-if="!row.customerPhone && !row.customerEmail">sin datos</em>
          </td>
          <td>
            {{ row.items }} ítem(s) · <strong>{{ dinero(row.subtotal) }}</strong>
            <small v-if="row.recoveredOrderNumber">→ {{ row.recoveredOrderNumber }} ({{ dinero(row.recoveredTotal) }})</small>
          </td>
          <td>
            <span class="badge" :class="`badge--${row.status}`">{{ etiquetaEstado[row.status] || row.status }}</span>
            <small v-if="row.clickedAt">abrió el link</small>
            <small v-if="row.notifyError" class="carts__err">{{ row.notifyError }}</small>
          </td>
          <td>{{ new Date(row.lastActivityAt).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) }}</td>
          <td>
            <button v-if="row.customerPhone && row.status !== 'recovered'" :disabled="enviando === row.id" @click="probarMensaje(row)">
              {{ enviando === row.id ? 'Enviando...' : 'Enviar ahora' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else>Todavía no hay carritos registrados.</p>
  </main>
</template>

<style scoped lang="scss">
.carts { padding: 1.5rem; }
.carts__head { align-items: center; display: flex; justify-content: space-between; margin-bottom: 1.2rem; }
.carts__eyebrow { color: #8a8a8a; font-size: .75rem; font-weight: 800; letter-spacing: .14em; margin: 0; }
h1 { color: #235931; margin: .2rem 0 0; }
.carts__error { background: #fee; border-radius: 10px; color: #b42318; font-weight: 700; padding: .7rem 1rem; }
.carts__warn { background: #fff8e1; border-left: 4px solid #f5a623; border-radius: 10px; margin-bottom: 1rem; padding: .8rem 1rem; }
.carts__stats { display: grid; gap: .8rem; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); margin-bottom: 1.6rem; }
.stat { background: #fff; border-left: 4px solid #235931; border-radius: 14px; box-shadow: 0 6px 18px rgba(0, 0, 0, .06); display: flex; flex-direction: column; padding: 1rem; }
.stat__value { color: #235931; font-size: 1.7rem; font-weight: 800; }
.stat__label { color: #666; font-size: .82rem; }
.stat--abandoned { border-left-color: #f5a623; }
.stat--leads { border-left-color: #4a90d9; }
.stat--sent { border-left-color: #25d366; }
.stat--back { border-left-color: #9b51e0; }
.stat--won, .stat--money { border-left-color: #00a523; }
.stat--lost { border-left-color: #b42318; }
.carts__table { background: #fff; border-collapse: collapse; border-radius: 14px; overflow: hidden; width: 100%; }
th, td { border-bottom: 1px solid #eee; padding: .7rem .9rem; text-align: left; vertical-align: top; }
th { background: #f6f6f6; font-size: .8rem; text-transform: uppercase; }
td small { color: #888; display: block; font-size: .76rem; }
.carts__err { color: #b42318 !important; }
.badge { border-radius: 999px; font-size: .74rem; font-weight: 700; padding: .18rem .6rem; }
.badge--pending { background: #fff3cd; color: #8a6d00; }
.badge--notified { background: #d9f7e2; color: #0d7a35; }
.badge--recovered { background: #00a523; color: #fff; }
.badge--expired { background: #eee; color: #777; }
.badge--unreachable { background: #fde2e1; color: #b42318; }
button { background: #235931; border: 0; border-radius: 999px; color: #fff; cursor: pointer; font-weight: 700; padding: .4rem .9rem; }
button:disabled { opacity: .6; }
@media (max-width: 720px) { .carts__table { display: block; overflow-x: auto; } }
</style>
