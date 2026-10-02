<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart, registerables, type ChartConfiguration } from 'chart.js'
import type { OrderDTO } from '@/services/OrderService'
import { useAdminTheme } from '@/composables/useAdminTheme'
import { chartTokens } from './adminChartTokens'

Chart.register(...registerables)

const props = defineProps<{ orders: OrderDTO[]; period: 'today' | 'all' | 'range' }>()
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'line'> | null = null
const { theme } = useAdminTheme()
const timeZone = 'America/Guayaquil'

function dayKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const value = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

const data = computed(() => {
  const isToday = props.period === 'today'
  const buckets = isToday
    ? Array.from({ length: 15 }, (_, index) => ({ key: String(index + 7).padStart(2, '0'), label: `${index + 7}h`, count: 0 }))
    : Array.from({ length: 7 }, (_, index) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - index))
        return { key: dayKey(date), label: date.toLocaleDateString('es-EC', { timeZone, day: '2-digit', month: 'short' }), count: 0 }
      })

  for (const order of props.orders) {
    if (!order.createdAt) continue
    const date = new Date(order.createdAt)
    const key = isToday
      ? new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hour12: false }).format(date)
      : dayKey(date)
    const bucket = buckets.find((item) => item.key === key)
    if (bucket) bucket.count += 1
  }
  return buckets
})

const total = computed(() => data.value.reduce((sum, item) => sum + item.count, 0))

function render() {
  if (!canvas.value) return
  chart?.destroy()
  const context = canvas.value.getContext('2d')
  if (!context) return
  const t = chartTokens()
  const gradient = context.createLinearGradient(0, 0, 0, 200)
  gradient.addColorStop(0, t.alpha(t.accent, 0.26))
  gradient.addColorStop(1, t.alpha(t.accent, 0))
  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: data.value.map((item) => item.label),
      datasets: [{
        data: data.value.map((item) => item.count),
        borderColor: t.accent,
        backgroundColor: gradient,
        borderWidth: 2.5,
        fill: true,
        tension: 0.38,
        cubicInterpolationMode: 'monotone',
        pointBackgroundColor: t.surface,
        pointBorderColor: t.accent,
        pointBorderWidth: 2,
        pointHoverRadius: 6,
        pointRadius: (ctx) => ((ctx.raw as number) > 0 ? 3 : 0),
      }],
    },
    options: {
      animation: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? false : { duration: 500, easing: 'easeOutQuart' },
      // Los puntos solo crecen hacia arriba: animar la X los dejaba amontonados a la izquierda si se cortaba la animación.
      animations: { x: { duration: 0 } },
      interaction: { intersect: false, mode: 'index' },
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: t.text,
          bodyColor: t.surface,
          titleColor: t.surface,
          callbacks: { label: (item) => `${item.parsed.y} ${item.parsed.y === 1 ? 'pedido' : 'pedidos'}` },
          displayColors: false,
          padding: 10,
        },
      },
      scales: {
        x: { border: { display: false }, grid: { display: false }, ticks: { color: t.muted, font: { size: 10, weight: 700 }, maxRotation: 0, autoSkipPadding: 8 } },
        y: { beginAtZero: true, border: { display: false }, grid: { color: t.grid }, ticks: { color: t.muted, font: { size: 10, weight: 700 }, maxTicksLimit: 4, precision: 0 } },
      },
    },
  }
  chart = new Chart(canvas.value, config)
}

onMounted(render)
onBeforeUnmount(() => chart?.destroy())
watch([() => props.orders, () => props.period], render, { deep: true })
watch(theme, () => nextTick(render))
</script>

<template>
  <section class="chart-card">
    <header class="chart-card__head">
      <div>
        <h2>{{ period === 'today' ? 'Pedidos por hora' : 'Pedidos por día' }}</h2>
        <p>{{ period === 'today' ? 'Hoy · hora de Guayaquil' : period === 'range' ? 'Período seleccionado' : 'Últimos 7 días' }}</p>
      </div>
      <strong>{{ total }}</strong>
    </header>
    <div class="chart-card__canvas"><canvas ref="canvas" aria-label="Tendencia de pedidos" role="img" /></div>
  </section>
</template>

<style scoped lang="scss">
.chart-card {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius, 18px);
  box-shadow: var(--admin-shadow);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
  padding: 1rem 1.1rem;
}

.chart-card__head {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;

  h2 { font-size: 0.98rem; font-weight: 800; letter-spacing: -0.02em; margin: 0; }
  p { color: var(--admin-muted); font-size: 0.76rem; margin: 0.2rem 0 0; }
  strong { font-size: 1.15rem; font-variant-numeric: tabular-nums; font-weight: 800; }
}

.chart-card__canvas { height: 200px; position: relative; width: 100%; }
</style>
