<script setup lang="ts">
import BaseDatePicker from '@/components/global/BaseDatePicker.vue'

const props = withDefaults(defineProps<{ startDate: string; endDate: string; loading?: boolean; eyebrow?: string; title?: string; activePreset?: string }>(), { eyebrow: 'Período de consulta', title: 'Ventas y operación', activePreset: '' })
const emit = defineEmits<{ 'update:startDate': [value: string]; 'update:endDate': [value: string]; apply: []; preset: [value: string] }>()
const presets = [{ key: 'month', label: 'Mes actual' }, { key: '30-days', label: '30 días' }, { key: 'previous-month', label: 'Mes anterior' }, { key: 'today', label: 'Hoy' }, { key: 'yesterday', label: 'Ayer' }]

function ecuadorDateValue(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
  const value = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return `${value('year')}-${value('month')}-${value('day')}`
}
function selectPreset(key: string) {
  const today = new Date(`${ecuadorDateValue(new Date())}T12:00:00-05:00`)
  let start = new Date(today)
  let end = new Date(today)
  if (key === 'month') start = new Date(today.getFullYear(), today.getMonth(), 1, 12)
  if (key === '30-days') start.setDate(start.getDate() - 29)
  if (key === 'previous-month') { start = new Date(today.getFullYear(), today.getMonth() - 1, 1, 12); end = new Date(today.getFullYear(), today.getMonth(), 0, 12) }
  if (key === 'yesterday') { start.setDate(start.getDate() - 1); end = new Date(start) }
  emit('update:startDate', ecuadorDateValue(start))
  emit('update:endDate', ecuadorDateValue(end))
  emit('preset', key)
  emit('apply')
}
</script>

<template>
  <section class="date-range panel">
    <div class="date-range__copy"><span><i class="fa-solid fa-filter" /> {{ eyebrow }}</span><strong>{{ title }}</strong></div>
    <div class="date-range__presets" aria-label="Períodos rápidos"><button v-for="preset in presets" :key="preset.key" type="button" :class="{ active: activePreset === preset.key }" @click="selectPreset(preset.key)">{{ preset.label }}</button></div>
    <div class="date-range__controls">
      <BaseDatePicker :model-value="startDate" label="Desde" @update:model-value="emit('update:startDate', $event)" />
      <BaseDatePicker :model-value="endDate" label="Hasta" panel-align="end" @update:model-value="emit('update:endDate', $event)" />
      <button type="button" :disabled="loading" @click="emit('apply')"><i class="fa-solid fa-magnifying-glass" /> {{ loading ? 'Actualizando' : 'Aplicar' }}</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.date-range { display:flex; flex-direction:column; gap:.8rem; padding:1rem; position:relative; z-index:20; }.date-range__copy { display:flex; flex-direction:column; gap:.18rem; }.date-range__copy span { color:var(--admin-muted); font-size:.66rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }.date-range__copy span i { color:var(--admin-accent); }.date-range__copy strong { font-size:1rem; }.date-range__presets { display:flex; flex-wrap:wrap; gap:.35rem; }.date-range__presets button { background:var(--admin-hover); border:1px solid var(--admin-line); border-radius:999px; color:var(--admin-text); font-size:.68rem; font-weight:800; min-height:32px; padding:.3rem .65rem; }.date-range__presets button.active { background:var(--admin-accent); border-color:var(--admin-accent); color:#fff; }.date-range__controls { align-items:flex-end; display:flex; flex-wrap:wrap; gap:.6rem; }.date-range__controls > button { align-items:center; background:var(--admin-accent); border:0; border-radius:12px; color:#fff; display:flex; font-size:.78rem; font-weight:800; gap:.45rem; justify-content:center; min-height:40px; padding:.45rem .85rem; transition:background .2s ease,transform .2s ease; }.date-range__controls > button:hover { background:#174622; transform:translateY(-1px); }.date-range__controls > button:disabled { opacity:.65; } @media (min-width:641px) { .date-range { align-items:flex-end; flex-direction:row; flex-wrap:wrap; justify-content:space-between; }.date-range__presets { margin-left:auto; }.date-range__controls { flex-basis:100%; flex-wrap:nowrap; } }
</style>
