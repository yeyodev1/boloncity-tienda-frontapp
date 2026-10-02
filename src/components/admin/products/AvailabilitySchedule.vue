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
.schedule { background: var(--admin-surface-2); border: 1px solid var(--admin-line); border-radius: 14px; overflow: hidden; transition: background-color 0.2s ease, border-color 0.2s ease; }
.schedule--on { background: var(--admin-surface); }
.schedule--invalid { border-color: var(--admin-danger); }

.schedule__toggle { align-items: center; background: transparent; border: 0; color: var(--admin-text); cursor: pointer; display: flex; gap: 0.75rem; justify-content: space-between; min-height: 64px; padding: 0.7rem 0.85rem; text-align: left; width: 100%; }
.schedule__toggle:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: -2px; }
.schedule__toggle-info { align-items: center; display: flex; gap: 0.75rem; }
.schedule__toggle-info > i { color: var(--admin-accent); width: 18px; }
.schedule__toggle-info span { display: flex; flex-direction: column; }
.schedule__toggle-info strong { font-size: 0.86rem; }
.schedule__toggle-info small { color: var(--admin-muted); font-size: 0.74rem; }

.schedule__switch { background: var(--admin-line-strong); border-radius: 999px; flex: 0 0 44px; height: 26px; padding: 3px; transition: background-color 0.25s ease; }
.schedule__switch b { background: var(--admin-surface); border-radius: 50%; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25); display: block; height: 20px; transition: transform 0.25s var(--admin-ease, ease); width: 20px; }
.schedule__switch.active { background: var(--admin-accent); }
.schedule__switch.active b { transform: translateX(18px); }

.schedule__body { border-top: 1px solid var(--admin-line); display: flex; flex-direction: column; gap: 0.75rem; padding: 0.85rem; }
.schedule__dates { display: flex; flex-direction: column; gap: 0.85rem; }
.schedule__summary { display: flex; flex-direction: column; gap: 0.3rem; }
.schedule__summary span { color: var(--admin-accent); font-size: 0.76rem; font-weight: 800; }
.schedule__summary i { width: 16px; }
.schedule__body small { color: var(--admin-muted); font-size: 0.74rem; line-height: 1.4; }
.schedule__msg-bad { color: var(--admin-danger) !important; font-weight: 700; }

@media (min-width: 620px) { .schedule__dates { flex-direction: row; } .schedule__dates > * { flex: 1 1 0; } }
@media (prefers-reduced-motion: reduce) { .schedule__switch, .schedule__switch b { transition: none; } }
</style>
