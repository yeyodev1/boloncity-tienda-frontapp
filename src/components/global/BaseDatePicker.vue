<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = withDefaults(defineProps<{ modelValue: string; label: string; panelAlign?: 'start' | 'end'; minDate?: string }>(), { panelAlign: 'start', minDate: '' })
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
const pickerId = `date-picker-${Math.random().toString(36).slice(2)}`
function toDate(value: string) {
  const date = value ? new Date(`${value}T12:00:00`) : new Date()
  return Number.isNaN(date.getTime()) ? new Date() : date
}
const cursor = ref(toDate(props.modelValue))
const weekdays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

const title = computed(() => cursor.value.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }))
const days = computed(() => {
  const start = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1)
  const offset = (start.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), index - offset + 1)
    const value = date.toISOString().slice(0, 10)
    return { date, value, current: date.getMonth() === cursor.value.getMonth(), disabled: Boolean(props.minDate && value < props.minDate) }
  })
})
const displayValue = computed(() => props.modelValue ? toDate(props.modelValue).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Seleccionar fecha')

function changeMonth(amount: number) { cursor.value = new Date(cursor.value.getFullYear(), cursor.value.getMonth() + amount, 1) }
function select(value: string) { if (props.minDate && value < props.minDate) return; emit('update:modelValue', value); open.value = false }
function toggle() {
  if (!open.value) window.dispatchEvent(new CustomEvent('base-date-picker:open', { detail: pickerId }))
  open.value = !open.value
}
function closeOutside(event: MouseEvent) { if (root.value && !root.value.contains(event.target as Node)) open.value = false }
function closeOther(event: Event) { if ((event as CustomEvent<string>).detail !== pickerId) open.value = false }
function onKeydown(event: KeyboardEvent) { if (event.key === 'Escape') open.value = false }

onMounted(() => {
  document.addEventListener('click', closeOutside)
  window.addEventListener('base-date-picker:open', closeOther)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', closeOutside)
  window.removeEventListener('base-date-picker:open', closeOther)
})
</script>

<template>
  <div ref="root" class="date-picker" :class="{ 'date-picker--open': open }" @keydown="onKeydown">
    <span>{{ label }}</span>
    <button type="button" class="date-picker__trigger" :aria-expanded="open" @click="toggle"><i class="fa-solid fa-calendar-days" /> {{ displayValue }}<i class="fa-solid fa-chevron-down" /></button>
    <Transition name="date-picker-drop"><div v-if="open" class="date-picker__panel" :class="`date-picker__panel--${panelAlign}`">
      <div class="date-picker__head"><button type="button" @click="changeMonth(-1)"><i class="fa-solid fa-chevron-left" /></button><strong>{{ title }}</strong><button type="button" @click="changeMonth(1)"><i class="fa-solid fa-chevron-right" /></button></div>
      <div class="date-picker__weekdays"><span v-for="day in weekdays" :key="day">{{ day }}</span></div>
      <div class="date-picker__days"><button v-for="day in days" :key="day.value" type="button" :disabled="day.disabled" :class="{ muted: !day.current, active: day.value === modelValue, disabled: day.disabled }" @click="select(day.value)">{{ day.date.getDate() }}</button></div>
    </div></Transition>
  </div>
</template>

<style scoped lang="scss">
.date-picker { display:flex; flex:1 1 150px; flex-direction:column; gap:.3rem; position:relative; }.date-picker--open { z-index:60; }.date-picker > span { color:var(--admin-muted); font-size:.64rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }.date-picker__trigger { align-items:center; background:var(--admin-surface); border:1px solid var(--admin-line); border-radius:12px; color:var(--admin-text); display:flex; font-size:.78rem; font-weight:700; gap:.45rem; min-height:40px; padding:.45rem .65rem; text-align:left; }.date-picker__trigger i:last-child { color:var(--admin-muted); font-size:.65rem; margin-left:auto; transition:transform .2s ease; }.date-picker--open .date-picker__trigger i:last-child { transform:rotate(180deg); }.date-picker__panel { background:#fff; border:1px solid rgba(8,17,13,.12); border-radius:16px; box-shadow:0 16px 35px rgba(0,0,0,.16); left:0; max-width:calc(100vw - 1.5rem); padding:.75rem; position:absolute; top:calc(100% + 6px); width:280px; z-index:60; }.date-picker__panel--end { left:auto; right:0; }.date-picker__head { align-items:center; display:flex; justify-content:space-between; margin-bottom:.6rem; }.date-picker__head button { background:rgba(35,89,49,.08); border-radius:8px; color:#235931; height:30px; width:30px; }.date-picker__head strong { font-size:.82rem; text-transform:capitalize; }.date-picker__weekdays,.date-picker__days { display:flex; flex-wrap:wrap; }.date-picker__weekdays span,.date-picker__days button { align-items:center; display:flex; flex:0 0 calc(100% / 7); font-size:.68rem; height:32px; justify-content:center; }.date-picker__weekdays span { color:rgba(8,17,13,.45); font-weight:800; }.date-picker__days button { background:transparent; border-radius:8px; color:#152019; }.date-picker__days button:hover { background:rgba(35,89,49,.1); }.date-picker__days button.muted { color:rgba(8,17,13,.28); }.date-picker__days button.active { background:#235931; color:#fff; font-weight:800; }.date-picker-drop-enter-active,.date-picker-drop-leave-active { transition:opacity .18s ease,transform .22s cubic-bezier(.16,1,.3,1); transform-origin:top left; }.date-picker-drop-enter-from,.date-picker-drop-leave-to { opacity:0; transform:translateY(-8px) scale(.97); }.date-picker__panel--end.date-picker-drop-enter-active,.date-picker__panel--end.date-picker-drop-leave-active { transform-origin:top right; }
.date-picker__days button.disabled,
.date-picker__days button.disabled:hover { background:transparent; color:rgba(8,17,13,.18); cursor:not-allowed; }
</style>
