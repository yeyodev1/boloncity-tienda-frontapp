<script setup lang="ts">
import { computed } from 'vue'
import BaseDatePicker from '@/components/global/BaseDatePicker.vue'

const props = defineProps<{ activation: string; deactivation: string }>()
const emit = defineEmits<{ 'update:activation': [value: string]; 'update:deactivation': [value: string] }>()

const today = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
const todayValue = `${today.find((part) => part.type === 'year')?.value}-${today.find((part) => part.type === 'month')?.value}-${today.find((part) => part.type === 'day')?.value}`
const message = computed(() => {
  if (props.activation && props.activation < todayValue) return 'La activación debe ser hoy o una fecha futura.'
  if (props.deactivation && props.deactivation < todayValue) return 'La finalización debe ser hoy o una fecha futura.'
  if (props.activation && props.deactivation && props.deactivation < props.activation) return 'La finalización debe ser posterior a la activación.'
  return ''
})
function formatDate(value: string) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }) : '' }
</script>

<template>
  <section class="schedule" :class="{ 'schedule--invalid': message }">
    <div><span><i class="fa-solid fa-calendar-days" /> Programar visibilidad</span><p>Las fechas se aplican en horario de Ecuador.</p></div>
    <div class="schedule__dates"><BaseDatePicker :model-value="activation" :min-date="todayValue" label="Activar desde" @update:model-value="emit('update:activation', $event)" /><BaseDatePicker :model-value="deactivation" :min-date="todayValue" label="Finalizar el" panel-align="end" @update:model-value="emit('update:deactivation', $event)" /></div>
    <div v-if="activation || deactivation" class="schedule__summary"><span v-if="activation"><i class="fa-solid fa-eye" /> Visible desde {{ formatDate(activation) }}</span><span v-if="deactivation"><i class="fa-solid fa-eye-slash" /> Se ocultará el {{ formatDate(deactivation) }}</span></div>
    <small v-if="message">{{ message }}</small>
    <small v-else>Si defines una fecha final, el producto dejará de mostrarse al cliente ese día.</small>
  </section>
</template>

<style scoped lang="scss">
.schedule { background:#f8fbf8; border:1px solid rgba(35,89,49,.14); border-radius:14px; display:flex; flex-direction:column; gap:.75rem; padding:.85rem; }.schedule > div:first-child span { color:#235931; font-size:.76rem; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }.schedule > div:first-child p,.schedule > small { color:rgba(8,17,13,.58); font-size:.72rem; line-height:1.35; margin-top:.2rem; }.schedule__dates { display:flex; flex-wrap:wrap; gap:.65rem; }.schedule__dates > * { flex:1 1 155px; }.schedule__summary { display:flex; flex-direction:column; gap:.35rem; }.schedule__summary span { color:#235931; font-size:.72rem; font-weight:800; }.schedule__summary i { width:16px; }.schedule--invalid { border-color:rgba(165,35,35,.45); }.schedule--invalid > small { color:#a52323; font-weight:700; }
</style>
