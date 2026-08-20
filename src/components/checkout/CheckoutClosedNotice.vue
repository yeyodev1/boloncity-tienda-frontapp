<script setup lang="ts">
defineProps<{
  info: { message: string; date?: string; opensAt?: string }
  /** true cuando el pedido ya quedó programado: se oculta el CTA y solo se confirma. */
  alreadyScheduled?: boolean
}>()

const emit = defineEmits<{
  (e: 'schedule'): void
}>()

function formatClosedDate(date: string) {
  const today = new Date(Date.now() - 5 * 3600_000).toISOString().slice(0, 10)
  if (date === today) return 'hoy'
  const parsed = new Date(`${date}T12:00:00Z`)
  const label = new Intl.DateTimeFormat('es-EC', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long' }).format(parsed)
  return `el ${label}`
}
</script>

<template>
  <aside class="checkout-closed" role="alert">
    <p class="checkout-closed__title"><i class="fa-solid fa-clock" /> {{ info.message }}</p>
    <p v-if="alreadyScheduled" class="checkout-closed__done">
      <i class="fa-solid fa-circle-check" /> Listo: tu pedido ya quedó programado. Solo confírmalo con el botón <b>«Programar pedido»</b>.
    </p>
    <template v-else>
      <p v-if="info.date && info.opensAt" class="checkout-closed__hint">
        Tu pedido no se perdió: puedes dejarlo programado y la cocina lo prepara apenas abra
        {{ formatClosedDate(info.date) }} a las {{ info.opensAt }}.
      </p>
      <button v-if="info.date" type="button" class="checkout-closed__cta" @click="emit('schedule')">
        <i class="fa-solid fa-calendar-check" /> Programar para la apertura
      </button>
    </template>
  </aside>
</template>

<style scoped lang="scss">
.checkout-closed {
  background: #fff8d6;
  border: 1px solid rgba(239, 213, 55, 0.75);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.9rem 1rem;
}

.checkout-closed__title {
  align-items: flex-start;
  color: #4b4100;
  display: flex;
  font-weight: 800;
  gap: 0.5rem;

  i {
    margin-top: 0.2rem;
  }
}

.checkout-closed__hint {
  color: #6a5d10;
  font-size: 0.9rem;
}

.checkout-closed__done {
  align-items: center;
  background: #e9f7ec;
  border: 1px solid rgba(0, 165, 35, 0.35);
  border-radius: 10px;
  color: #14682a;
  display: flex;
  font-size: 0.9rem;
  font-weight: 700;
  gap: 0.5rem;
  padding: 0.65rem 0.85rem;
}

.checkout-closed__cta {
  align-items: center;
  background: #235931;
  border: 0;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  display: flex;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 46px;
  padding: 0 1.2rem;
}
</style>
