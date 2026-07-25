<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart, registerables, type ChartConfiguration } from 'chart.js'
import type { OrderDTO } from '@/services/OrderService'

Chart.register(...registerables)

const props = defineProps<{ orders: OrderDTO[]; metric: 'orders' | 'revenue' }>()
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'line'> | null = null
const isRevenue = computed(() => props.metric === 'revenue')
const color = computed(() => isRevenue.value ? '#d2a800' : '#00a523')
const title = computed(() => isRevenue.value ? 'Dinero por hora' : 'Órdenes por hora')
const eyebrow = computed(() => isRevenue.value ? 'Ingresos' : 'Ritmo de operación')

const data = computed(() => {
  const buckets = Array.from({ length: 15 }, (_, index) => ({ hour: index + 8, value: 0 }))
  for (const order of props.orders) {
    if (!order.createdAt || (isRevenue.value && order.status === 'cancelled')) continue
    const hour = Number(new Intl.DateTimeFormat('en-US', { hour: '2-digit', hour12: false, timeZone: 'America/Guayaquil' }).format(new Date(order.createdAt)))
    const bucket = buckets.find((item) => item.hour === hour)
    if (bucket) bucket.value += isRevenue.value ? (order.total || 0) / 100 : 1
  }
  return buckets
})

function render() {
  if (!canvas.value) return
  chart?.destroy()
  const context = canvas.value.getContext('2d')
  if (!context) return
  const gradient = context.createLinearGradient(0, 0, 0, 230)
  gradient.addColorStop(0, isRevenue.value ? 'rgba(239, 213, 55, 0.28)' : 'rgba(0, 165, 35, 0.22)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: { labels: data.value.map((item) => `${item.hour}h`), datasets: [{ data: data.value.map((item) => item.value), borderColor: color.value, backgroundColor: gradient, borderWidth: 3, fill: true, tension: 0.42, pointBackgroundColor: '#fff', pointBorderColor: color.value, pointBorderWidth: 2.5, pointHoverBackgroundColor: '#efd537', pointHoverRadius: 6, pointRadius: 3.5 }] },
    options: {
      animation: { duration: 550, easing: 'easeOutQuart' }, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { backgroundColor: '#18211b', displayColors: false, padding: 10, callbacks: { label: (item) => { const value = item.parsed.y ?? 0; return isRevenue.value ? `$${value.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `${value} ${value === 1 ? 'orden' : 'órdenes'}` } } } },
      scales: { x: { border: { display: false }, grid: { display: false }, ticks: { color: '#748078', font: { family: 'Switzer, sans-serif', size: 10, weight: 700 }, maxRotation: 0 } }, y: { beginAtZero: true, border: { display: false }, grid: { color: 'rgba(8, 17, 13, 0.08)' }, ticks: { color: '#748078', font: { family: 'Switzer, sans-serif', size: 10, weight: 700 }, precision: isRevenue.value ? 2 : 0, callback: (value) => isRevenue.value ? `$${value}` : value } } },
    },
  }
  chart = new Chart(canvas.value, config)
}

onMounted(render)
onBeforeUnmount(() => chart?.destroy())
watch([() => props.orders, () => props.metric], render, { deep: true })
</script>

<template>
  <section class="metric-line panel"><div class="metric-line__head"><div><span><i class="fa-solid fa-chart-line" /> {{ eyebrow }}</span><h2>{{ title }}</h2></div><small>{{ isRevenue ? 'Sin órdenes canceladas' : 'Periodo seleccionado' }}</small></div><div class="metric-line__canvas"><canvas ref="canvas" :aria-label="title" role="img" /></div></section>
</template>

<style scoped lang="scss">
.metric-line { padding:1rem; }.metric-line__head { align-items:flex-start; display:flex; justify-content:space-between; margin-bottom:.8rem; }.metric-line__head span { color:var(--admin-muted); font-size:.68rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }.metric-line__head span i { color:var(--admin-accent); }.metric-line__head h2 { font-size:1.05rem; letter-spacing:-.03em; margin-top:.2rem; }.metric-line__head small { color:var(--admin-muted); font-size:.68rem; text-align:right; }.metric-line__canvas { height:220px; position:relative; width:100%; }
</style>
