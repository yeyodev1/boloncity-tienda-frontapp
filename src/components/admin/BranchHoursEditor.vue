<script setup lang="ts">
import BaseSelect from '@/components/global/BaseSelect.vue'
type OpeningHours = { day: string; opensAt: string; closesAt: string; isOpen: boolean }

const props = defineProps<{ modelValue: OpeningHours[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: OpeningHours[]] }>()
const labels: Record<string, string> = { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' }
const timeOptions = Array.from({ length: 48 }, (_, index) => { const hours = String(Math.floor(index / 2)).padStart(2, '0'); const minutes = index % 2 ? '30' : '00'; return { value: `${hours}:${minutes}`, label: new Date(`2000-01-01T${hours}:${minutes}:00`).toLocaleTimeString('es-EC', { hour: 'numeric', minute: '2-digit' }) } })
function update(index: number, key: keyof OpeningHours, value: string | boolean) { const next = [...props.modelValue]; next[index] = { ...next[index], [key]: value } as OpeningHours; emit('update:modelValue', next) }
</script>

<template>
  <section class="hours"><header><i class="fa-solid fa-clock" /><div><strong>Horario de atención</strong><small>Los pedidos solo se aceptan dentro de estos horarios.</small></div></header><article v-for="(day, index) in modelValue" :key="day.day"><button type="button" class="day-toggle" :class="{ active: day.isOpen }" :aria-pressed="day.isOpen" @click="update(index, 'isOpen', !day.isOpen)"><span>{{ labels[day.day] }}</span><i class="fa-solid fa-power-off" /></button><div v-if="day.isOpen" class="times"><BaseSelect :model-value="day.opensAt" :options="timeOptions" bare @update:model-value="update(index, 'opensAt', $event as string)" /><b>a</b><BaseSelect :model-value="day.closesAt" :options="timeOptions" bare @update:model-value="update(index, 'closesAt', $event as string)" /></div><small v-else>Cerrada</small></article></section>
</template>

<style scoped lang="scss">
.hours { background:#f8fbf8; border:1px solid rgba(35,89,49,.14); border-radius:16px; display:flex; flex-direction:column; gap:.45rem; padding:.85rem; }.hours header { align-items:center; display:flex; gap:.6rem; margin-bottom:.2rem; }.hours header > i { color:#235931; }.hours header div { display:flex; flex-direction:column; }.hours strong { color:#235931; font-size:.82rem; }.hours small { color:rgba(8,17,13,.56); font-size:.7rem; }.hours article { align-items:center; border-top:1px solid rgba(8,17,13,.07); display:flex; flex-wrap:wrap; gap:.55rem; justify-content:space-between; padding:.55rem 0; }.day-toggle { align-items:center; background:transparent; border:0; color:#152019; display:flex; font:inherit; font-size:.78rem; font-weight:800; gap:.45rem; padding:0; }.day-toggle i { color:rgba(8,17,13,.3); }.day-toggle.active i { color:#00a523; }.times { align-items:center; display:flex; flex:1 1 230px; gap:.35rem; justify-content:flex-end; }.times :deep(.base-select) { flex:1 1 100px; }.times :deep(.base-select__trigger) { min-height:36px; padding:.45rem .55rem; }.hours b { color:rgba(8,17,13,.45); font-size:.7rem; }
</style>
