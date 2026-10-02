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
  <section class="hours">
    <header class="hours__head">
      <i class="fa-regular fa-clock" aria-hidden="true" />
      <div><strong>Horario de atención</strong><small>Fuera de este horario no se aceptan pedidos para ya.</small></div>
    </header>
    <ul class="hours__days">
      <li v-for="(day, index) in modelValue" :key="day.day" class="day" :class="{ 'is-closed': !day.isOpen }">
        <button type="button" class="day__toggle" role="switch" :aria-checked="day.isOpen" :aria-label="`${labels[day.day]}: ${day.isOpen ? 'abierto' : 'cerrado'}`" @click="update(index, 'isOpen', !day.isOpen)">
          <span class="day__knob" aria-hidden="true" />
          <span>{{ labels[day.day] }}</span>
        </button>
        <div v-if="day.isOpen" class="day__times">
          <BaseSelect :model-value="day.opensAt" :options="timeOptions" bare @update:model-value="update(index, 'opensAt', $event as string)" />
          <b>a</b>
          <BaseSelect :model-value="day.closesAt" :options="timeOptions" bare @update:model-value="update(index, 'closesAt', $event as string)" />
        </div>
        <small v-else class="day__closed">Cerrado</small>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.hours {
  background: var(--admin-surface-2);
  border: 1px solid var(--admin-line);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.85rem;
}

.hours__head {
  align-items: center;
  display: flex;
  gap: 0.65rem;

  > i { color: var(--admin-accent); }
  div { display: flex; flex-direction: column; }
  strong { color: var(--admin-text); font-size: 0.86rem; }
  small { color: var(--admin-muted); font-size: 0.74rem; }
}

.hours__days { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }

.day {
  align-items: center;
  border-top: 1px solid var(--admin-line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
  min-height: 52px;
  padding: 0.45rem 0;
}

.day__toggle {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--admin-text);
  cursor: pointer;
  display: flex;
  font-size: 0.84rem;
  font-weight: 800;
  gap: 0.6rem;
  min-width: 120px;
  padding: 0.2rem 0;

  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; border-radius: 8px; }
}

.day__knob {
  background: var(--admin-accent);
  border-radius: 999px;
  flex: 0 0 36px;
  height: 22px;
  padding: 3px;
  transition: background-color 0.25s ease;

  &::after {
    background: var(--admin-surface);
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    content: '';
    display: block;
    height: 16px;
    transform: translateX(14px);
    transition: transform 0.25s var(--admin-ease, ease);
    width: 16px;
  }
}

.day.is-closed .day__knob { background: var(--admin-line-strong); }
.day.is-closed .day__knob::after { transform: translateX(0); }
.day.is-closed .day__toggle span:last-child { color: var(--admin-muted); }

.day__times { align-items: center; display: flex; flex: 1 1 220px; gap: 0.4rem; justify-content: flex-end; }
.day__times :deep(.base-select) { flex: 1 1 100px; }
.day__times :deep(.base-select__trigger) { min-height: 38px; padding: 0.4rem 0.6rem; }
.day__times b { color: var(--admin-subtle); font-size: 0.75rem; font-weight: 700; }
.day__closed { color: var(--admin-muted); font-size: 0.78rem; font-weight: 700; }

@media (prefers-reduced-motion: reduce) { .day__knob, .day__knob::after { transition: none; } }
</style>
