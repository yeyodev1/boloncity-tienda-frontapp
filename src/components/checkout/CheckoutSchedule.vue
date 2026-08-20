<script setup lang="ts">
interface ScheduleDay {
  date: string
  weekdayLabel: string
  dayNumber: string
  isToday: boolean
  isOpen: boolean
  slots: string[]
}

const props = defineProps<{
  enabled: boolean
  days: ScheduleDay[]
  slots: string[]
  selectedDate: string
  selectedTime: string
  branchName?: string
}>()

const emit = defineEmits<{
  (e: 'update:enabled', v: boolean): void
  (e: 'select-day', v: string): void
  (e: 'update:selectedTime', v: string): void
}>()

/** Un día sin turnos ya cerró o la sucursal no atiende: no debe ser elegible. */
function dayDisabled(day: ScheduleDay) { return day.slots.length === 0 }

function dayHint(day: ScheduleDay) {
  if (!day.isOpen) return 'Cerrado'
  if (day.slots.length) return `${day.slots.length} turnos`
  return 'Sin turnos'
}

function formatSlot(slot: string) {
  const parts = slot.split(':')
  const hour = Number(parts[0])
  const suffix = hour >= 12 ? 'pm' : 'am'
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${parts[1] || '00'} ${suffix}`
}

function selectedSummary() {
  const day = props.days.find((item) => item.date === props.selectedDate)
  if (!day || !props.selectedTime) return ''
  // weekdayLabel puede ser "Hoy", "Mañana" o un día corto ("vie"): cada caso se lee distinto.
  const cuando = day.isToday
    ? 'hoy'
    : day.weekdayLabel === 'Mañana'
      ? `mañana ${day.dayNumber}`
      : `el ${day.weekdayLabel} ${day.dayNumber}`
  return `${cuando} a las ${formatSlot(props.selectedTime)}`
}

// El panel se pliega/despliega animando su altura real (sin esto el layout salta seco).
function expandEnter(element: Element) {
  const el = element as HTMLElement
  el.style.height = '0'
  void el.offsetHeight
  el.style.height = `${el.scrollHeight}px`
}
function expandAfterEnter(element: Element) {
  (element as HTMLElement).style.height = ''
}
function expandLeave(element: Element) {
  const el = element as HTMLElement
  el.style.height = `${el.scrollHeight}px`
  void el.offsetHeight
  el.style.height = '0'
}
</script>

<template>
  <section class="schedule" :class="{ 'schedule--active': enabled }">
    <div class="schedule__toggle">
      <div class="schedule__toggle-copy">
        <strong><i class="fa-regular fa-clock" /> ¿Cuándo lo quieres?</strong>
        <small>{{ enabled ? 'Elige el día y la hora de entrega.' : 'Lo preparamos apenas confirmes el pago.' }}</small>
      </div>
      <div class="schedule__switch" role="group" aria-label="Cuándo entregar el pedido">
        <button type="button" :class="{ active: !enabled }" :aria-pressed="!enabled" @click="emit('update:enabled', false)">Lo antes posible</button>
        <button type="button" :class="{ active: enabled }" :aria-pressed="enabled" @click="emit('update:enabled', true)">Programar</button>
      </div>
    </div>

    <Transition name="schedule-reveal" @enter="expandEnter" @after-enter="expandAfterEnter" @leave="expandLeave">
      <div v-if="enabled" class="schedule__picker">
        <p class="schedule__card-note"><i class="fa-solid fa-credit-card" /> Los pedidos programados se pagan con tarjeta: así tu reserva queda confirmada.</p>
        <p v-if="!days.some((day) => day.slots.length)" class="schedule__empty">
          <i class="fa-solid fa-circle-exclamation" />
          No hay turnos disponibles esta semana{{ branchName ? ` en ${branchName}` : '' }}.
        </p>

        <template v-else>
          <div class="schedule__block">
            <span class="schedule__label">Día</span>
            <div class="schedule__days" role="group" aria-label="Día de entrega">
              <button
                v-for="day in days"
                :key="day.date"
                type="button"
                class="schedule__day"
                :class="{ active: day.date === selectedDate, disabled: dayDisabled(day) }"
                :disabled="dayDisabled(day)"
                :aria-pressed="day.date === selectedDate"
                :aria-label="`${day.weekdayLabel} ${day.dayNumber}, ${dayHint(day)}`"
                @click="emit('select-day', day.date)"
              >
                <em>{{ day.weekdayLabel }}</em>
                <b>{{ day.dayNumber }}</b>
                <i>{{ dayHint(day) }}</i>
              </button>
            </div>
          </div>

          <div class="schedule__block">
            <span class="schedule__label">Hora de entrega</span>
            <div class="schedule__slots" role="group" aria-label="Hora de entrega">
              <button
                v-for="slot in slots"
                :key="slot"
                type="button"
                class="schedule__slot"
                :class="{ active: slot === selectedTime }"
                :aria-pressed="slot === selectedTime"
                @click="emit('update:selectedTime', slot)"
              >
                {{ formatSlot(slot) }}
              </button>
            </div>
          </div>

          <p v-if="selectedTime" class="schedule__summary">
            <i class="fa-solid fa-circle-check" /> Tu pedido llega {{ selectedSummary() }}.
          </p>
        </template>
      </div>
    </Transition>
  </section>
</template>

<style scoped lang="scss">
.schedule {
  background: rgba(35, 89, 49, 0.04);
  border: 1px solid rgba(35, 89, 49, 0.14);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.95rem;
  transition: background-color 0.25s ease, border-color 0.25s ease;
}

.schedule--active {
  background: rgba(35, 89, 49, 0.07);
  border-color: rgba(35, 89, 49, 0.28);
}

.schedule__toggle {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.schedule__toggle-copy {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.schedule__toggle-copy strong { color: #152019; font-size: 0.95rem; }
.schedule__toggle-copy strong i { color: #235931; margin-right: 0.35rem; }
.schedule__toggle-copy small { color: rgba(8, 17, 13, 0.58); font-size: 0.78rem; }

.schedule__switch {
  background: rgba(255, 255, 255, 0.85);
  border-radius: 999px;
  display: flex;
  gap: 0.25rem;
  padding: 0.28rem;
}

.schedule__switch button {
  border-radius: 999px;
  color: rgba(8, 17, 13, 0.6);
  flex: 1 1 0;
  font-size: 0.82rem;
  font-weight: 800;
  min-height: 42px;
  padding: 0.5rem 0.8rem;
  transition: background-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
}

.schedule__switch button.active {
  background: #235931;
  box-shadow: 0 8px 18px rgba(35, 89, 49, 0.18);
  color: #fff;
}

.schedule__picker {
  background: #fff;
  border: 1px solid rgba(35, 89, 49, 0.14);
  border-radius: 16px;
  box-shadow: 0 14px 30px rgba(35, 89, 49, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 0.95rem;
}

.schedule__block {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.schedule__label {
  color: #235931;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

// En móvil los 7 días se recorren de lado; en pantallas grandes entran completos.
.schedule__days { display: flex; gap: 0.45rem; overflow-x: auto; padding-bottom: 0.2rem; scrollbar-width: none; }
.schedule__days::-webkit-scrollbar { display: none; }

.schedule__day { align-items: center; background: #f8faf8; border: 1px solid rgba(8, 17, 13, 0.1); border-radius: 14px; display: flex; flex: 0 0 auto; flex-direction: column; gap: 0.1rem; min-width: 68px; padding: 0.55rem 0.5rem; transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease; }
.schedule__day:not(.disabled):not(.active):hover { border-color: rgba(35, 89, 49, 0.35); transform: translateY(-2px); }

.schedule__day em { color: rgba(8, 17, 13, 0.55); font-size: 0.68rem; font-style: normal; font-weight: 800; text-transform: capitalize; }
.schedule__day b { color: #152019; font-size: 1.05rem; font-weight: 900; }
.schedule__day i { color: rgba(8, 17, 13, 0.45); font-size: 0.62rem; font-style: normal; }

.schedule__day.active {
  background: #235931;
  border-color: #235931;
  box-shadow: 0 10px 22px rgba(35, 89, 49, 0.2);
}

.schedule__day.active em,
.schedule__day.active b,
.schedule__day.active i { color: #fff; }
.schedule__day.active i { color: rgba(255, 255, 255, 0.75); }

.schedule__day.disabled { background: rgba(8, 17, 13, 0.04); opacity: 0.5; }

.schedule__slots { display: flex; flex-wrap: wrap; gap: 0.4rem; }

.schedule__slot { background: #f8faf8; border: 1px solid rgba(8, 17, 13, 0.1); border-radius: 999px; color: #152019; font-size: 0.8rem; font-weight: 800; min-height: 40px; padding: 0.45rem 0.85rem; transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease; }
.schedule__slot:not(.active):hover { border-color: rgba(35, 89, 49, 0.35); transform: translateY(-1px); }
.schedule__slot.active { background: #efd537; border-color: #efd537; box-shadow: 0 8px 18px rgba(239, 213, 55, 0.35); color: #152019; }

.schedule__summary { align-items: center; align-self: flex-start; background: #e9f7ec; border: 1px solid rgba(0, 165, 35, 0.3); border-radius: 999px; color: #14682a; display: flex; font-size: 0.78rem; font-weight: 800; gap: 0.45rem; padding: 0.5rem 0.9rem; }
.schedule__summary i { color: #00a523; }

.schedule__card-note { align-items: center; background: rgba(35, 89, 49, 0.06); border-radius: 10px; color: #235931; display: flex; font-size: 0.8rem; font-weight: 700; gap: 0.45rem; padding: 0.55rem 0.75rem; }

.schedule__empty { align-items: flex-start; background: #fff8d6; border: 1px solid rgba(239, 213, 55, 0.6); border-radius: 12px; color: #6a5d10; display: flex; font-size: 0.82rem; font-weight: 700; gap: 0.5rem; line-height: 1.4; padding: 0.65rem 0.85rem; }
.schedule__empty i { color: #a98b00; margin-top: 0.15rem; }

.schedule-reveal-enter-active,
.schedule-reveal-leave-active { overflow: hidden; transition: height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.schedule-reveal-enter-from,
.schedule-reveal-leave-to { opacity: 0; transform: translateY(-8px); }

@media (min-width: 768px) {
  .schedule { padding: 1.1rem; }

  .schedule__toggle {
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
  }

  .schedule__switch { flex: 0 0 auto; min-width: 280px; }
  .schedule__days { flex-wrap: wrap; overflow-x: visible; }
  .schedule__day { flex: 1 1 78px; }
}
</style>
