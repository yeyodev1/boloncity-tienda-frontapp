<script setup lang="ts">
import { computed, ref } from 'vue'
import BaseDatePicker from '@/components/global/BaseDatePicker.vue'

const props = defineProps<{ activation: string; deactivation: string }>()
const emit = defineEmits<{ 'update:activation': [value: string]; 'update:deactivation': [value: string] }>()

// Programar es opcional: colapsado por defecto. Se abre si ya hay fechas o si el usuario lo activa.
const enabled = ref(Boolean(props.activation || props.deactivation))

const today = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
const todayValue = `${today.find((part) => part.type === 'year')?.value}-${today.find((part) => part.type === 'month')?.value}-${today.find((part) => part.type === 'day')?.value}`
const message = computed(() => {
  if (props.activation && props.activation < todayValue) return 'La activación debe ser hoy o una fecha futura.'
  if (props.deactivation && props.deactivation < todayValue) return 'La finalización debe ser hoy o una fecha futura.'
  if (props.activation && props.deactivation && props.deactivation < props.activation) return 'La finalización debe ser posterior a la activación.'
  return ''
})
function formatDate(value: string) { return value ? new Date(`${value}T12:00:00`).toLocaleDateString('es-EC', { day: '2-digit', month: 'long', year: 'numeric' }) : '' }

function toggle() {
  enabled.value = !enabled.value
  if (!enabled.value) { emit('update:activation', ''); emit('update:deactivation', '') }
}
</script>

<template>
  <section class="schedule" :class="{ 'schedule--invalid': message, 'schedule--on': enabled }">
    <button type="button" class="schedule__toggle" :aria-pressed="enabled" @click="toggle">
      <span class="schedule__toggle-info">
        <i class="fa-solid fa-calendar-days" />
        <span><strong>Programar visibilidad</strong><small>Opcional — muestra u oculta el producto en fechas específicas</small></span>
      </span>
      <span class="schedule__switch" :class="{ active: enabled }"><b /></span>
    </button>

    <div v-if="enabled" class="schedule__body">
      <div class="schedule__dates">
        <BaseDatePicker inline :model-value="activation" :min-date="todayValue" label="Activar desde" @update:model-value="emit('update:activation', $event)" />
        <BaseDatePicker inline :model-value="deactivation" :min-date="todayValue" label="Finalizar el" @update:model-value="emit('update:deactivation', $event)" />
      </div>
      <div v-if="activation || deactivation" class="schedule__summary">
        <span v-if="activation"><i class="fa-solid fa-eye" /> Visible desde {{ formatDate(activation) }}</span>
        <span v-if="deactivation"><i class="fa-solid fa-eye-slash" /> Se ocultará el {{ formatDate(deactivation) }}</span>
      </div>
      <small v-if="message" class="schedule__msg-bad">{{ message }}</small>
      <small v-else>Si defines una fecha final, el producto dejará de mostrarse al cliente ese día.</small>
    </div>
  </section>
</template>

<style scoped lang="scss">
.schedule { background:#f8fbf8; border:1px solid rgba(35,89,49,.14); border-radius:16px; overflow:hidden; }
.schedule--on { background:#fff; }
.schedule--invalid { border-color:rgba(165,35,35,.45); }

.schedule__toggle { align-items:center; background:transparent; border:0; cursor:pointer; display:flex; gap:.75rem; justify-content:space-between; padding:.9rem 1rem; text-align:left; width:100%; }
.schedule__toggle-info { align-items:center; display:flex; gap:.7rem; }
.schedule__toggle-info > i { color:#235931; font-size:1.05rem; }
.schedule__toggle-info span { display:flex; flex-direction:column; }
.schedule__toggle-info strong { color:#152019; font-size:.92rem; }
.schedule__toggle-info small { color:rgba(8,17,13,.55); font-size:.72rem; }

.schedule__switch { background:rgba(8,17,13,.16); border-radius:999px; flex:0 0 44px; height:26px; padding:3px; transition:background-color .2s; }
.schedule__switch b { background:#fff; border-radius:50%; display:block; height:20px; transition:transform .2s; width:20px; }
.schedule__switch.active { background:#235931; }
.schedule__switch.active b { transform:translateX(18px); }

.schedule__body { border-top:1px solid rgba(8,17,13,.08); display:flex; flex-direction:column; gap:.75rem; padding:.9rem 1rem 1rem; }
.schedule__dates { display:flex; flex-direction:column; gap:.9rem; }
.schedule__summary { display:flex; flex-direction:column; gap:.35rem; }
.schedule__summary span { color:#235931; font-size:.75rem; font-weight:800; }
.schedule__summary i { width:16px; }
.schedule__body small { color:rgba(8,17,13,.58); font-size:.72rem; line-height:1.35; }
.schedule__msg-bad { color:#a52323 !important; font-weight:700; }
@media (min-width: 620px) { .schedule__dates { flex-direction:row; } .schedule__dates > * { flex:1 1 0; } }
</style>
