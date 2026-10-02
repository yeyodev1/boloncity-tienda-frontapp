<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart, registerables, type ChartConfiguration } from 'chart.js'
import type { OrderDTO } from '@/services/OrderService'
import { useAdminTheme } from '@/composables/useAdminTheme'
import { chartTokens } from './adminChartTokens'

Chart.register(...registerables)

const props = defineProps<{ orders: OrderDTO[]; metric: 'orders' | 'revenue' }>()
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'line'> | null = null
const { theme } = useAdminTheme()
const isRevenue = computed(() => props.metric === 'revenue')
const title = computed(() => (isRevenue.value ? 'Ventas por hora' : 'Pedidos por hora'))

const data = computed(() => {
  const buckets = Array.from({ length: 15 }, (_, index) => ({ hour: index + 7, value: 0 }))
  for (const order of props.orders) {
    if (!order.createdAt || (isRevenue.value && order.status === 'cancelled')) continue
    const hour = Number(new Intl.DateTimeFormat('en-US', { hour: '2-digit', hour12: false, timeZone: 'America/Guayaquil' }).format(new Date(order.createdAt)))
    const bucket = buckets.find((item) => item.hour === hour)
    if (bucket) bucket.value += isRevenue.value ? (order.total || 0) / 100 : 1
  }
  return buckets
})

const total = computed(() => data.value.reduce((sum, item) => sum + item.value, 0))
const peak = computed(() => data.value.reduce((best, item) => (item.value > best.value ? item : best), { hour: 0, value: 0 }))
const money = (value: number) => `$${value.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function render() {
  if (!canvas.value) return
  chart?.destroy()
  const context = canvas.value.getContext('2d')
  if (!context) return
  const t = chartTokens()
  const line = isRevenue.value ? t.yellowStrong : t.accent
  const gradient = context.createLinearGradient(0, 0, 0, 200)
  gradient.addColorStop(0, t.alpha(line, 0.28))
  gradient.addColorStop(1, t.alpha(line, 0))
  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: data.value.map((item) => `${item.hour}h`),
      datasets: [{
        data: data.value.map((item) => item.value),
        borderColor: line,
        backgroundColor: gradient,
        borderWidth: 2.5,
        fill: true,
        tension: 0.38,
        cubicInterpolationMode: 'monotone',
        pointBackgroundColor: t.surface,
        pointBorderColor: line,
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
          displayColors: false,
          padding: 10,
          callbacks: { label: (item) => { const value = item.parsed.y ?? 0; return isRevenue.value ? money(value) : `${value} ${value === 1 ? 'pedido' : 'pedidos'}` } },
        },
      },
      scales: {
        x: { border: { display: false }, grid: { display: false }, ticks: { color: t.muted, font: { size: 10, weight: 700 }, maxRotation: 0, autoSkipPadding: 8 } },
        y: { beginAtZero: true, border: { display: false }, grid: { color: t.grid }, ticks: { color: t.muted, font: { size: 10, weight: 700 }, maxTicksLimit: 4, precision: isRevenue.value ? 0 : 0, callback: (value) => (isRevenue.value ? `$${value}` : value) } },
      },
    },
  }
  chart = new Chart(canvas.value, config)
}

onMounted(render)
onBeforeUnmount(() => chart?.destroy())
watch([() => props.orders, () => props.metric], render, { deep: true })
// Los colores salen del tema: al cambiar claro/oscuro se vuelve a dibujar con los nuevos.
watch(theme, () => nextTick(render))
</script>

<template>
  <section class="chart-card">
    <header class="chart-card__head">
      <div>
        <h2>{{ title }}</h2>
        <p v-if="total > 0">Hora pico: <b>{{ peak.hour }}:00</b> · {{ isRevenue ? money(peak.value) : `${peak.value} ${peak.value === 1 ? 'pedido' : 'pedidos'}` }}</p>
        <p v-else>Sin {{ isRevenue ? 'ventas' : 'pedidos' }} en este período</p>
      </div>
      <strong>{{ isRevenue ? money(total) : total }}</strong>
    </header>
    <div class="chart-card__canvas"><canvas ref="canvas" :aria-label="title" role="img" /></div>
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
  b { color: var(--admin-text); }
  strong { font-size: 1.15rem; font-variant-numeric: tabular-nums; font-weight: 800; white-space: nowrap; }
}

.chart-card__canvas { height: 200px; position: relative; width: 100%; }
</style>
