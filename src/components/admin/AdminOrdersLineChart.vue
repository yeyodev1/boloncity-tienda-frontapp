<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Chart, registerables, type ChartConfiguration } from 'chart.js'
import type { OrderDTO } from '@/services/OrderService'

Chart.register(...registerables)

const props = defineProps<{ orders: OrderDTO[]; period: 'today' | 'all' | 'range' }>()
const canvas = ref<HTMLCanvasElement | null>(null)
let chart: Chart<'line'> | null = null
const timeZone = 'America/Guayaquil'

function dayKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const value = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

const data = computed(() => {
  const isToday = props.period === 'today'
  const buckets = isToday
    ? Array.from({ length: 15 }, (_, index) => ({ key: String(index + 8), label: `${index + 8}:00`, count: 0 }))
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

function render() {
  if (!canvas.value) return
  chart?.destroy()
  const context = canvas.value.getContext('2d')
  if (!context) return
  const gradient = context.createLinearGradient(0, 0, 0, 230)
  gradient.addColorStop(0, 'rgba(0, 165, 35, 0.22)')
  gradient.addColorStop(1, 'rgba(0, 165, 35, 0)')
  const config: ChartConfiguration<'line'> = {
    type: 'line',
    data: {
      labels: data.value.map((item) => item.label),
      datasets: [{
        data: data.value.map((item) => item.count),
        borderColor: '#00a523',
        backgroundColor: gradient,
        borderWidth: 3,
        fill: true,
        tension: 0.42,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#235931',
        pointBorderWidth: 2.5,
        pointHoverBackgroundColor: '#efd537',
        pointHoverBorderColor: '#235931',
        pointHoverRadius: 6,
        pointRadius: 3.5,
      }],
    },
    options: {
      animation: { duration: 550, easing: 'easeOutQuart' },
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#18211b',
          bodyFont: { family: 'Switzer, sans-serif', weight: 700 },
          callbacks: { label: (item) => `${item.parsed.y} ${item.parsed.y === 1 ? 'orden' : 'órdenes'}` },
          displayColors: false,
          padding: 10,
        },
      },
      scales: {
        x: { border: { display: false }, grid: { display: false }, ticks: { color: '#748078', font: { family: 'Switzer, sans-serif', size: 10, weight: 700 }, maxRotation: 0 } },
        y: { beginAtZero: true, border: { display: false }, grid: { color: 'rgba(8, 17, 13, 0.08)' }, ticks: { color: '#748078', font: { family: 'Switzer, sans-serif', size: 10, weight: 700 }, precision: 0, stepSize: 1 } },
      },
    },
  }
  chart = new Chart(canvas.value, config)
}

onMounted(render)
onBeforeUnmount(() => chart?.destroy())
watch([() => props.orders, () => props.period], render, { deep: true })
</script>

<template>
  <section class="orders-line panel">
    <div class="orders-line__head"><div><span><i class="fa-solid fa-chart-line" /> Flujo de pedidos</span><h2>{{ period === 'today' ? 'Órdenes por hora' : 'Órdenes por día' }}</h2></div><small>{{ period === 'today' ? 'Hoy · Guayaquil' : period === 'range' ? 'Período seleccionado' : 'Últimos 7 días' }}</small></div>
    <div class="orders-line__canvas"><canvas ref="canvas" aria-label="Tendencia de órdenes" role="img" /></div>
  </section>
</template>

<style scoped lang="scss">
.orders-line { padding:1rem; }.orders-line__head { align-items:flex-start; display:flex; justify-content:space-between; margin-bottom:.8rem; }.orders-line__head span { color:var(--admin-muted); font-size:.68rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }.orders-line__head span i { color:#00a523; }.orders-line__head h2 { font-size:1.08rem; letter-spacing:-.03em; margin-top:.2rem; }.orders-line__head small { color:var(--admin-muted); font-size:.68rem; text-align:right; }.orders-line__canvas { height:220px; position:relative; width:100%; }
</style>
