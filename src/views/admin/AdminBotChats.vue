<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import BotAdminService, { type BotConversationDetail, type BotConversationRow, type BotMetrics } from '@/services/BotAdminService'
import { describeDecision, describeStep } from '@/utils/botDecisions'
import { relativeTime } from '@/components/admin/order-detail/orderStory'

/**
 * Chats del bot de WhatsApp: cada conversación como la vivió el cliente y, debajo de cada respuesta, qué decidió
 * el bot. Arriba, cuánto se habló y cuánto vendió WhatsApp. Solo lectura; se actualiza sola.
 */
const ranges = [
  { key: 'today', label: 'Hoy', days: 0 },
  { key: '7d', label: '7 días', days: 7 },
  { key: '30d', label: '30 días', days: 30 },
] as const
type RangeKey = (typeof ranges)[number]['key']

const range = ref<RangeKey>('7d')
const search = ref('')
const metrics = ref<BotMetrics | null>(null)
const rows = ref<BotConversationRow[]>([])
const detail = ref<BotConversationDetail | null>(null)
const selectedPhone = ref('')
const loadingList = ref(true)
const loadingDetail = ref(false)
const error = ref('')
const thread = ref<HTMLElement | null>(null)
let timer: number | undefined
let searchTimer: number | undefined

const ecDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(date)
const window_ = computed(() => {
  const now = new Date()
  const days = ranges.find((item) => item.key === range.value)?.days ?? 7
  return { from: ecDate(new Date(now.getTime() - days * 86_400_000)), to: ecDate(now) }
})

const STATUS: Record<string, string> = { pending: 'Pendiente', paid: 'Pagada', preparing: 'En cocina', awaiting_pickup: 'Lista', ready: 'En camino', delivered: 'Entregada', cancelled: 'Cancelada' }
const statusLabel = (status: string) => STATUS[status] || status
const money = (value: number) => `$${(value || 0).toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const time = (value: string) =>
  new Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
const dayLabel = (value: string) =>
  new Intl.DateTimeFormat('es-EC', { timeZone: 'America/Guayaquil', weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(value))
const prettyPhone = (phone: string) => (phone.startsWith('lid:') ? 'Número oculto' : phone.replace(/^\+593(\d{2})(\d{3})(\d{4})$/, '0$1 $2 $3'))
const whatsappLink = (phone: string) => (phone.startsWith('lid:') ? '' : `https://wa.me/${phone.replace(/\D/g, '')}`)
const initial = (row: { name: string; phone: string }) => (row.name || row.phone.replace(/\D/g, '').slice(-2) || '?').slice(0, 2).toUpperCase()

/** Texto de WhatsApp a HTML seguro: se escapa todo y luego *negrita* y los links. */
function waHtml(text: string) {
  const escaped = String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
  return escaped
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
}

const kpis = computed(() => {
  const m = metrics.value
  if (!m) return []
  return [
    { label: 'Conversaciones', value: String(m.conversations), hint: `${m.messages} mensajes` },
    { label: 'Pedidos por WhatsApp', value: String(m.whatsappOrders), hint: `${m.whatsappPaidOrders} pagados · ${m.whatsappShare}% del total`, tone: 'good' },
    { label: 'Ventas por WhatsApp', value: money(m.whatsappRevenue), hint: 'Solo pedidos pagados', tone: 'good' },
    { label: 'Conversión', value: `${m.conversion}%`, hint: 'Escribieron y compraron' },
    { label: 'Pasaron a asesor', value: String(m.humanHandoffs), hint: `${m.optOuts} pidieron no escribir`, tone: m.humanHandoffs ? 'warn' : undefined },
    { label: 'No entendió', value: String(m.notUnderstood), hint: `${m.offTopic} fuera de tema`, tone: m.notUnderstood ? 'warn' : undefined },
    { label: 'Responde en', value: `${(m.avgResponseMs / 1000).toFixed(1)} s`, hint: `${m.aiVoiceShare}% redactado con IA` },
    { label: 'Errores', value: String(m.errors), hint: m.errors ? 'Revisar' : 'Todo bien', tone: m.errors ? 'bad' : 'good' },
  ] as Array<{ label: string; value: string; hint: string; tone?: 'good' | 'warn' | 'bad' }>
})

/** Mensajes agrupados por día, para separar el chat con "martes 2 de octubre". */
const groupedTurns = computed(() => {
  const groups: Array<{ day: string; turns: BotConversationDetail['turns'] }> = []
  for (const turn of detail.value?.turns || []) {
    const day = dayLabel(turn.at)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.turns.push(turn)
    else groups.push({ day, turns: [turn] })
  }
  return groups
})

const orderIdByNumber = computed(() => new Map((detail.value?.orders || []).map((order) => [order.orderNumber, order.id])))
const cartLine = computed(() => (detail.value?.state?.cart || []).map((item) => `${item.quantity} x ${item.name}`).join(' · '))

async function loadList(silent = false) {
  if (!silent) loadingList.value = true
  try {
    const { from, to } = window_.value
    const [metricsResponse, listResponse] = await Promise.all([
      BotAdminService.metrics(from, to),
      BotAdminService.conversations(from, to, search.value.trim()),
    ])
    metrics.value = metricsResponse.data
    rows.value = listResponse.data
    error.value = ''
  } catch {
    if (!silent) error.value = 'No pudimos cargar los chats. Intenta de nuevo en un momento.'
  } finally {
    loadingList.value = false
  }
}

async function loadDetail(phone: string, silent = false) {
  if (!phone) return
  if (!silent) loadingDetail.value = true
  try {
    const previous = detail.value?.turns.length || 0
    const response = await BotAdminService.conversation(phone)
    if (selectedPhone.value !== phone) return
    detail.value = response.data
    if (!silent || response.data.turns.length !== previous) {
      await nextTick()
      thread.value?.scrollTo({ top: thread.value.scrollHeight, behavior: silent ? 'smooth' : 'auto' })
    }
  } catch {
    if (!silent) detail.value = null
  } finally {
    loadingDetail.value = false
  }
}

function openConversation(phone: string) {
  selectedPhone.value = phone
  detail.value = null
  void loadDetail(phone)
}

function closeConversation() {
  selectedPhone.value = ''
  detail.value = null
}

watch(range, () => void loadList())
watch(search, () => {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => void loadList(), 350)
})

onMounted(() => {
  void loadList()
  // Se actualiza sola: los chats nuevos aparecen sin recargar.
  timer = window.setInterval(() => {
    void loadList(true)
    if (selectedPhone.value) void loadDetail(selectedPhone.value, true)
  }, 20_000)
})
onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.clearTimeout(searchTimer)
})
</script>

<template>
  <AdminLayout>
    <div class="bot-page admin-page" :class="{ 'has-selection': selectedPhone }">
      <header class="bot-head">
        <div class="bot-head__copy">
          <p class="bot-head__eyebrow"><i class="fa-brands fa-whatsapp" aria-hidden="true" /> WhatsApp</p>
          <h1>Chats del bot</h1>
          <p class="bot-head__lead">Cada conversación tal cual, con lo que decidió el bot en cada respuesta.</p>
        </div>
        <div class="bot-range" role="group" aria-label="Rango de fechas">
          <button v-for="item in ranges" :key="item.key" type="button" :class="{ active: range === item.key }" :aria-pressed="range === item.key" @click="range = item.key">
            {{ item.label }}
          </button>
        </div>
      </header>

      <ul v-if="kpis.length" class="bot-kpis">
        <li v-for="kpi in kpis" :key="kpi.label" :data-tone="kpi.tone">
          <span class="bot-kpis__label">{{ kpi.label }}</span>
          <strong>{{ kpi.value }}</strong>
          <small>{{ kpi.hint }}</small>
        </li>
      </ul>

      <p v-if="error" class="bot-error" role="alert"><i class="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {{ error }}</p>

      <section class="bot-panes" :class="{ 'has-selection': selectedPhone }">
        <!-- Lista -->
        <aside class="bot-list panel" aria-label="Conversaciones">
          <label class="bot-search">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input v-model="search" type="search" inputmode="tel" placeholder="Buscar por teléfono" aria-label="Buscar por teléfono" autocomplete="off" />
          </label>

          <div v-if="loadingList && !rows.length" class="bot-list__skeleton" aria-hidden="true">
            <span v-for="n in 6" :key="n" />
          </div>
          <p v-else-if="!rows.length" class="bot-empty">
            <i class="fa-regular fa-comments" aria-hidden="true" />
            Todavía no hay chats en este rango.
          </p>
          <ul v-else class="bot-list__rows">
            <li v-for="row in rows" :key="row.phone">
              <button type="button" class="bot-row" :class="{ active: row.phone === selectedPhone }" @click="openConversation(row.phone)">
                <span class="bot-avatar" aria-hidden="true">{{ initial(row) }}</span>
                <span class="bot-row__body">
                  <span class="bot-row__top">
                    <strong>{{ row.name || prettyPhone(row.phone) }}</strong>
                    <time :datetime="row.lastAt">{{ relativeTime(row.lastAt) }}</time>
                  </span>
                  <span class="bot-row__preview">{{ row.lastMessage || '[sin texto]' }}</span>
                  <span class="bot-row__tags">
                    <span v-if="row.lastOrder" class="bot-tag" data-tone="good"><i class="fa-solid fa-receipt" aria-hidden="true" /> {{ row.lastOrder.orderNumber }}</span>
                    <span v-else class="bot-tag">{{ describeStep(row.lastStep) }}</span>
                    <span v-if="row.human" class="bot-tag" data-tone="warn"><i class="fa-solid fa-headset" aria-hidden="true" /> Asesor</span>
                    <span v-if="row.optedOut" class="bot-tag" data-tone="warn">No escribir</span>
                    <span v-if="row.errors" class="bot-tag" data-tone="bad">{{ row.errors }} error{{ row.errors === 1 ? '' : 'es' }}</span>
                  </span>
                </span>
              </button>
            </li>
          </ul>
        </aside>

        <!-- Chat -->
        <section class="bot-chat panel" aria-live="polite">
          <div v-if="!selectedPhone" class="bot-chat__placeholder">
            <span class="bot-chat__placeholder-icon" aria-hidden="true"><i class="fa-regular fa-comments" /></span>
            <strong>Elige una conversación</strong>
            <p>Vas a ver cada mensaje del cliente, lo que respondió el bot y por qué.</p>
          </div>

          <template v-else>
            <header class="bot-chat__head">
              <button type="button" class="bot-chat__back" aria-label="Volver a la lista" @click="closeConversation"><i class="fa-solid fa-arrow-left" /></button>
              <span class="bot-avatar" aria-hidden="true">{{ initial({ name: detail?.name || '', phone: selectedPhone }) }}</span>
              <div class="bot-chat__who">
                <strong>{{ detail?.name || prettyPhone(selectedPhone) }}</strong>
                <small>{{ prettyPhone(selectedPhone) }}<template v-if="detail?.state"> · {{ describeStep(detail.state.stage) }}</template></small>
              </div>
              <a v-if="whatsappLink(selectedPhone)" class="bot-chat__wa" :href="whatsappLink(selectedPhone)" target="_blank" rel="noopener">
                <i class="fa-brands fa-whatsapp" aria-hidden="true" /><span>Escribirle</span>
              </a>
            </header>

            <div v-if="detail && (cartLine || detail.orders.length)" class="bot-chat__context">
              <span v-if="cartLine"><i class="fa-solid fa-basket-shopping" aria-hidden="true" /> {{ cartLine }}</span>
              <span v-if="detail.state?.scheduledLabel"><i class="fa-regular fa-calendar" aria-hidden="true" /> {{ detail.state.scheduledLabel }}</span>
              <RouterLink v-for="order in detail.orders.slice(0, 4)" :key="order.id" :to="`/admin/ordenes/${order.id}`" class="bot-order">
                {{ order.orderNumber }} · {{ money(order.total) }}
                <span class="status-pill" :data-status="order.status">{{ statusLabel(order.status) }}</span>
              </RouterLink>
            </div>

            <div ref="thread" class="bot-thread">
              <p v-if="loadingDetail && !detail" class="bot-empty">Cargando chat…</p>
              <p v-else-if="detail && !detail.turns.length" class="bot-empty">No hay mensajes en los últimos 30 días.</p>
              <template v-for="group in groupedTurns" :key="group.day">
                <p class="bot-day"><span>{{ group.day }}</span></p>
                <div v-for="turn in group.turns" :key="turn.id" class="bot-turn">
                  <div class="bubble bubble--customer">
                    <p v-if="turn.message" v-html="waHtml(turn.message)" />
                    <p v-else class="bubble__media"><i class="fa-solid fa-paperclip" aria-hidden="true" /> {{ turn.media || 'Ubicación o archivo' }}</p>
                    <time :datetime="turn.at">{{ time(turn.at) }}</time>
                  </div>
                  <div v-if="turn.reply || turn.error" class="bubble bubble--bot">
                    <p v-if="turn.reply" v-html="waHtml(turn.reply)" />
                    <p v-if="turn.error" class="bubble__error"><i class="fa-solid fa-bug" aria-hidden="true" /> {{ turn.error }}</p>
                    <footer class="bubble__meta">
                      <span class="decision" :data-tone="describeDecision(turn.decision).tone" :title="turn.decision">
                        {{ describeDecision(turn.decision).label }}
                      </span>
                      <span>{{ describeStep(turn.step) }}</span>
                      <span>{{ (turn.ms / 1000).toFixed(1) }} s</span>
                      <span>{{ turn.aiVoice ? 'Redactado con IA' : 'Plantilla' }}</span>
                      <RouterLink v-if="turn.orderNumber && orderIdByNumber.get(turn.orderNumber)" :to="`/admin/ordenes/${orderIdByNumber.get(turn.orderNumber)}`">
                        Ver {{ turn.orderNumber }} <i class="fa-solid fa-arrow-right" aria-hidden="true" />
                      </RouterLink>
                    </footer>
                  </div>
                </div>
              </template>
            </div>
          </template>
        </section>
      </section>
    </div>
  </AdminLayout>
</template>

<style scoped lang="scss">
html .bot-page { display: flex; flex-direction: column; gap: 1rem; padding: 0.25rem 0 1rem; }

/* Encabezado */
html .bot-head { align-items: flex-end; display: flex; flex-wrap: wrap; gap: 1rem; justify-content: space-between; }
html .bot-head__eyebrow { align-items: center; color: var(--admin-accent); display: flex; font-size: 0.7rem; font-weight: 800; gap: 0.4rem; letter-spacing: 0.16em; margin: 0 0 0.3rem; text-transform: uppercase; }
html .bot-head h1 { font-size: clamp(1.7rem, 4vw, 2.3rem); font-weight: 800; letter-spacing: -0.04em; line-height: 1; margin: 0; }
html .bot-head__lead { color: var(--admin-muted); font-size: 0.88rem; margin: 0.45rem 0 0; }

html .bot-range { background: var(--admin-surface-2); border: 1px solid var(--admin-line); border-radius: 999px; display: inline-flex; gap: 0.2rem; padding: 0.25rem; }
html .bot-range button { background: transparent; border-radius: 999px; color: var(--admin-muted); font-size: 0.8rem; font-weight: 800; min-height: 38px; padding: 0.4rem 0.95rem; transition: background 0.2s ease, color 0.2s ease; }
html .bot-range button.active { background: var(--admin-accent); color: var(--admin-on-accent); }

/* Números */
html .bot-kpis { display: flex; flex-wrap: wrap; gap: 0.6rem; list-style: none; margin: 0; padding: 0; }
html .bot-kpis li {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: 16px;
  box-shadow: var(--admin-shadow);
  display: flex;
  flex: 1 1 112px;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
  padding: 0.75rem 0.85rem;
}
html .bot-kpis__label { color: var(--admin-muted); font-size: 0.72rem; font-weight: 700; }
html .bot-kpis strong { font-size: 1.35rem; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
html .bot-kpis small { color: var(--admin-subtle); font-size: 0.7rem; }
html .bot-kpis li[data-tone='good'] strong { color: var(--admin-success); }
html .bot-kpis li[data-tone='warn'] strong { color: var(--admin-warning); }
html .bot-kpis li[data-tone='bad'] strong { color: var(--admin-danger); }

html .bot-error { align-items: center; background: var(--admin-danger-soft); border-radius: 12px; color: var(--admin-danger); display: flex; font-size: 0.85rem; font-weight: 700; gap: 0.5rem; margin: 0; padding: 0.7rem 0.9rem; }

/* Dos paneles */
html .bot-panes { display: flex; gap: 0.75rem; min-height: 0; }
html .bot-list { display: flex; flex: 1 1 100%; flex-direction: column; gap: 0.6rem; min-width: 0; padding: 0.75rem; }
html .bot-chat { display: none; flex: 1 1 100%; flex-direction: column; min-width: 0; overflow: hidden; }
html .bot-panes.has-selection .bot-list { display: none; }
html .bot-panes.has-selection .bot-chat { display: flex; }

html .bot-search { align-items: center; background: var(--admin-input-bg); border: 1px solid var(--admin-line-strong); border-radius: 14px; display: flex; gap: 0.5rem; padding: 0 0.85rem; }
html .bot-search i { color: var(--admin-muted); font-size: 0.85rem; }
html .bot-search input { background: transparent !important; border: 0 !important; box-shadow: none !important; flex: 1; min-height: 44px; padding: 0 !important; }

html .bot-list__rows { display: flex; flex-direction: column; gap: 0.2rem; list-style: none; margin: 0; overflow-y: auto; padding: 0; }
html .bot-row { align-items: flex-start; background: transparent; border-radius: 14px; color: var(--admin-text); display: flex; gap: 0.7rem; padding: 0.65rem; text-align: left; transition: background 0.18s ease; width: 100%; }
html .bot-row:hover { background: var(--admin-hover); }
html .bot-row.active { background: var(--admin-accent-soft); }
html .bot-row:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
html .bot-row__body { display: flex; flex: 1; flex-direction: column; gap: 0.2rem; min-width: 0; }
html .bot-row__top { align-items: baseline; display: flex; gap: 0.5rem; justify-content: space-between; }
html .bot-row__top strong { font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
html .bot-row__top time { color: var(--admin-subtle); flex: 0 0 auto; font-size: 0.7rem; }
html .bot-row__preview { color: var(--admin-muted); font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
html .bot-row__tags { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.15rem; }

html .bot-tag { align-items: center; background: var(--admin-hover); border-radius: 999px; color: var(--admin-muted); display: inline-flex; font-size: 0.66rem; font-weight: 800; gap: 0.3rem; padding: 0.18rem 0.5rem; }
html .bot-tag[data-tone='good'] { background: var(--admin-success-soft); color: var(--admin-success); }
html .bot-tag[data-tone='warn'] { background: var(--admin-warning-soft); color: var(--admin-warning); }
html .bot-tag[data-tone='bad'] { background: var(--admin-danger-soft); color: var(--admin-danger); }

html .bot-avatar { align-items: center; background: var(--admin-accent-soft); border-radius: 50%; color: var(--admin-accent); display: flex; flex: 0 0 40px; font-size: 0.78rem; font-weight: 800; height: 40px; justify-content: center; }

html .bot-list__skeleton { display: flex; flex-direction: column; gap: 0.5rem; }
html .bot-list__skeleton span { animation: bot-pulse 1.4s ease-in-out infinite; background: var(--admin-hover); border-radius: 14px; height: 64px; }

html .bot-empty { align-items: center; color: var(--admin-muted); display: flex; flex-direction: column; font-size: 0.85rem; gap: 0.5rem; margin: 0; padding: 2rem 1rem; text-align: center; }
html .bot-empty i { font-size: 1.4rem; opacity: 0.6; }

/* Chat */
html .bot-chat__placeholder { align-items: center; color: var(--admin-muted); display: flex; flex: 1; flex-direction: column; gap: 0.5rem; justify-content: center; padding: 3rem 1.5rem; text-align: center; }
html .bot-chat__placeholder strong { color: var(--admin-text); font-size: 1.05rem; }
html .bot-chat__placeholder p { font-size: 0.85rem; margin: 0; max-width: 32ch; }
html .bot-chat__placeholder-icon { align-items: center; background: var(--admin-accent-soft); border-radius: 50%; color: var(--admin-accent); display: flex; font-size: 1.5rem; height: 64px; justify-content: center; width: 64px; }

html .bot-chat__head { align-items: center; border-bottom: 1px solid var(--admin-line); display: flex; gap: 0.65rem; padding: 0.7rem 0.85rem; }
html .bot-chat__back { align-items: center; background: var(--admin-hover); border-radius: 10px; color: var(--admin-text); display: flex; flex: 0 0 38px; height: 38px; justify-content: center; }
html .bot-chat__who { display: flex; flex: 1; flex-direction: column; min-width: 0; }
html .bot-chat__who strong { font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
html .bot-chat__who small { color: var(--admin-muted); font-size: 0.74rem; }
html .bot-chat__wa { align-items: center; background: #1fa855; border-radius: 999px; color: #fff; display: inline-flex; font-size: 0.78rem; font-weight: 800; gap: 0.4rem; min-height: 38px; padding: 0.4rem 0.85rem; }

html .bot-chat__context { align-items: center; background: var(--admin-surface-2); border-bottom: 1px solid var(--admin-line); display: flex; flex-wrap: wrap; font-size: 0.76rem; gap: 0.4rem 0.9rem; padding: 0.55rem 0.85rem; }
html .bot-chat__context > span { align-items: center; color: var(--admin-muted); display: inline-flex; gap: 0.35rem; }
html .bot-order { align-items: center; background: var(--admin-surface); border: 1px solid var(--admin-line); border-radius: 999px; color: var(--admin-text); display: inline-flex; font-weight: 800; gap: 0.45rem; padding: 0.2rem 0.3rem 0.2rem 0.65rem; }
html .bot-order:hover { border-color: var(--admin-accent); }

html .bot-thread {
  background:
    radial-gradient(circle at 20% 10%, var(--admin-accent-soft), transparent 40%),
    var(--admin-bg);
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.6rem;
  max-height: calc(100vh - 13rem);
  min-height: 420px;
  overflow-y: auto;
  padding: 1rem 0.85rem 1.4rem;
}

html .bot-day { display: flex; justify-content: center; margin: 0.4rem 0; }
html .bot-day span { background: var(--admin-surface); border: 1px solid var(--admin-line); border-radius: 999px; color: var(--admin-muted); font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.75rem; text-transform: capitalize; }

html .bot-turn { display: flex; flex-direction: column; gap: 0.35rem; }

html .bubble { border-radius: 16px; box-shadow: var(--admin-shadow); display: flex; flex-direction: column; gap: 0.35rem; max-width: min(78%, 560px); padding: 0.6rem 0.8rem 0.45rem; }
html .bubble p { font-size: 0.86rem; line-height: 1.45; margin: 0; overflow-wrap: anywhere; white-space: pre-wrap; }
html .bubble :deep(a) { color: var(--admin-info); text-decoration: underline; }
html .bubble time { align-self: flex-end; color: var(--admin-subtle); font-size: 0.66rem; }
html .bubble--customer { align-self: flex-start; background: var(--admin-surface); border-top-left-radius: 4px; }
html .bubble--bot { align-self: flex-end; background: color-mix(in srgb, var(--admin-accent) 14%, var(--admin-surface)); border-top-right-radius: 4px; }
html .bubble__media { color: var(--admin-muted); font-style: italic; }
html .bubble__error { background: var(--admin-danger-soft); border-radius: 10px; color: var(--admin-danger); font-size: 0.78rem !important; padding: 0.4rem 0.55rem; }

html .bubble__meta { align-items: center; border-top: 1px dashed var(--admin-line-strong); display: flex; flex-wrap: wrap; font-size: 0.68rem; gap: 0.3rem 0.6rem; padding-top: 0.4rem; }
html .bubble__meta > span { color: var(--admin-subtle); }
html .bubble__meta a { color: var(--admin-accent); font-weight: 800; }
html .decision { background: var(--admin-info-soft); border-radius: 999px; color: var(--admin-info) !important; font-weight: 800; padding: 0.15rem 0.55rem; }
html .decision[data-tone='good'] { background: var(--admin-success-soft); color: var(--admin-success) !important; }
html .decision[data-tone='warn'] { background: var(--admin-warning-soft); color: var(--admin-warning) !important; }
html .decision[data-tone='bad'] { background: var(--admin-danger-soft); color: var(--admin-danger) !important; }

@keyframes bot-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  html .bot-list__skeleton span { animation: none; }
}

/* Celular: con un chat abierto, el chat va primero (los números se ven al volver a la lista). */
@media (max-width: 1024px) {
  html .bot-page.has-selection .bot-kpis,
  html .bot-page.has-selection .bot-head__lead { display: none; }
  html .bot-thread { max-height: calc(100vh - 15rem); min-height: 320px; }
}

/* Escritorio: lista y chat lado a lado. */
@media (min-width: 1025px) {
  html .bot-list { display: flex !important; flex: 0 0 340px; max-height: calc(100vh - 7rem); position: sticky; top: 5rem; }
  html .bot-chat { display: flex !important; flex: 1 1 auto; }
  html .bot-chat__back { display: none; }
}
</style>
