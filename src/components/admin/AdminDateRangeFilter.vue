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
  <section class="date-range">
    <div class="date-range__presets" role="group" aria-label="Períodos rápidos">
      <button v-for="preset in presets" :key="preset.key" type="button" :class="{ active: activePreset === preset.key }" :aria-pressed="activePreset === preset.key" @click="selectPreset(preset.key)">{{ preset.label }}</button>
    </div>
    <div class="date-range__controls">
      <BaseDatePicker :model-value="startDate" label="Desde" @update:model-value="emit('update:startDate', $event)" />
      <BaseDatePicker :model-value="endDate" label="Hasta" panel-align="end" @update:model-value="emit('update:endDate', $event)" />
      <button type="button" :disabled="loading" @click="emit('apply')"><i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-arrow-right'" aria-hidden="true" /> {{ loading ? 'Actualizando' : 'Ver' }}</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.date-range {
  align-items: stretch;
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: var(--admin-radius, 18px);
  box-shadow: var(--admin-shadow);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem;
  position: relative;
  z-index: 20;
}

.date-range__presets {
  display: flex;
  gap: 0.35rem;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }

  button {
    background: var(--admin-hover);
    border: 1px solid transparent;
    border-radius: 999px;
    color: var(--admin-text);
    flex: 0 0 auto;
    font-size: 0.76rem;
    font-weight: 800;
    min-height: 34px;
    padding: 0.3rem 0.8rem;
    transition: background 0.2s ease, color 0.2s ease;

    &:hover { background: var(--admin-accent-soft); }
    &.active { background: var(--admin-accent); color: var(--admin-on-accent); }
    &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
  }
}

.date-range__controls {
  align-items: flex-end;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  > :deep(*) { flex: 1 1 130px; min-width: 0; }

  > button {
    align-items: center;
    background: var(--admin-accent);
    border-radius: 12px;
    color: var(--admin-on-accent);
    display: flex;
    flex: 0 0 auto;
    font-size: 0.8rem;
    font-weight: 800;
    gap: 0.45rem;
    justify-content: center;
    min-height: 42px;
    padding: 0.45rem 1rem;
    transition: filter 0.2s ease;

    &:hover:not(:disabled) { filter: brightness(1.08); }
    &:disabled { opacity: 0.65; }
  }
}

@media (min-width: 900px) {
  .date-range { align-items: center; flex-direction: row; justify-content: space-between; }
  .date-range__controls { flex-wrap: nowrap; }
  .date-range__controls > :deep(*) { flex: 0 0 170px; }
}
</style>
