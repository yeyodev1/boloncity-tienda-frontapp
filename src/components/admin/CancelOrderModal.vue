<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import type { OrderDTO } from '@/services/OrderService'

const props = defineProps<{ order: OrderDTO | null }>()
const emit = defineEmits<{ (e: 'confirm', reason: string): void; (e: 'close'): void }>()

// El motivo es obligatorio: queda en la auditoría y es la única forma de saber
// después quién canceló y por qué (el backend rechaza la cancelación sin motivo).
const reason = ref('')
const reasons = ['Cliente pidió cancelar', 'Producto sin stock', 'Error al tomar el pedido', 'Pedido duplicado', 'Sucursal no puede cumplir', 'Sin motorizado disponible']
const canConfirm = computed(() => reason.value.trim().length >= 3)
// Una cancelación NO reversa el cobro: el dinero se devuelve aparte desde el detalle.
const cardCharged = computed(() => Boolean(props.order?.paymentMethod === 'card' && props.order?.payphone?.transactionId))
// Con reserva de Picker viva, cancelar acá también la cancela allá. Decirlo antes
// es lo que evita la duda de «¿tengo que entrar al panel de Picker además?».
const hasPickerBooking = computed(() => Boolean(props.order?.picker?.bookingId))
watch(() => props.order?._id, () => { reason.value = '' })

// Cancelar es irreversible para el cliente (recibe correo): se confirma manteniendo
// presionado 2 s, no con un tap accidental.
const HOLD_MS = 2000
const progress = ref(0)
const holding = ref(false)
let frame = 0
let startedAt = 0

function tick(now: number) {
  progress.value = Math.min(1, (now - startedAt) / HOLD_MS)
  if (progress.value >= 1) {
    cancelAnimationFrame(frame)
    holding.value = false
    if ('vibrate' in navigator) navigator.vibrate?.(80)
    emit('confirm', reason.value.trim())
    reason.value = ''
    progress.value = 0
    return
  }
  frame = requestAnimationFrame(tick)
}

function startHold(event: PointerEvent) {
  if (!props.order || holding.value || !canConfirm.value) return
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  holding.value = true
  startedAt = performance.now()
  frame = requestAnimationFrame(tick)
}

function stopHold() {
  if (!holding.value && progress.value === 0) return
  holding.value = false
  cancelAnimationFrame(frame)
  progress.value = 0
}

onBeforeUnmount(() => cancelAnimationFrame(frame))
</script>

<template>
  <Teleport to="body">
    <Transition name="cancel-modal">
      <div v-if="order" class="cancel-overlay" @click.self="emit('close')">
        <div class="cancel-modal" role="alertdialog" aria-modal="true">
          <span class="cancel-modal__icon"><i class="fa-solid fa-triangle-exclamation" /></span>
          <h2>¿Cancelar la orden {{ order.orderNumber }}?</h2>
          <p>
            El pedido de <b>{{ order.customerName || order.customerEmail }}</b> pasará a
            <b>Cancelada</b> y el cliente recibirá el aviso por correo.
          </p>

          <p v-if="hasPickerBooking" class="cancel-modal__picker">
            <i class="fa-solid fa-motorcycle" />
            <span>También se <b>cancela el delivery en Picker</b>, así que el motorizado deja de
              buscarse y no llega al local. Si Picker no acepta, te avisamos acá mismo para que
              lo canceles desde su panel.</span>
          </p>

          <p v-if="cardCharged" class="cancel-modal__warning">
            <i class="fa-solid fa-credit-card" />
            <span>Este pedido está <b>pagado con tarjeta</b>. Cancelar <b>no anula el cobro</b>: para
              devolver el dinero entra al detalle de la orden y usa <b>Devolver pago</b>.</span>
          </p>

          <div class="cancel-modal__reason">
            <label for="cancel-reason">Motivo de la cancelación (obligatorio)</label>
            <div class="cancel-modal__chips">
              <button v-for="option in reasons" :key="option" type="button" :class="{ active: reason === option }" @click="reason = option">{{ option }}</button>
            </div>
            <textarea id="cancel-reason" v-model="reason" rows="2" placeholder="Ej.: el cliente pidió cancelar por teléfono" />
            <small>Queda registrado con tu usuario en la auditoría del pedido.</small>
          </div>

          <button
            type="button"
            class="cancel-modal__hold"
            :class="{ holding, disabled: !canConfirm }"
            :disabled="!canConfirm"
            @pointerdown.prevent="startHold"
            @pointerup="stopHold"
            @pointerleave="stopHold"
            @pointercancel="stopHold"
            @contextmenu.prevent
            @dragstart.prevent
          >
            <span class="cancel-modal__fill" :style="{ transform: `scaleX(${progress})` }" />
            <span class="cancel-modal__label">
              <i class="fa-solid fa-hand-point-down" />
              {{ !canConfirm ? 'Escribe el motivo para poder cancelar' : holding ? 'Sigue presionando…' : 'Mantén presionado 2 s para cancelar' }}
            </span>
          </button>

          <button type="button" class="cancel-modal__keep" @click="emit('close')">
            <i class="fa-solid fa-arrow-left" /> Conservar la orden
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.cancel-overlay {
  align-items: center;
  background: rgba(8, 17, 13, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 99998;
}

.cancel-modal {
  align-items: center;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  max-width: 400px;
  padding: 1.8rem 1.4rem 1.4rem;
  text-align: center;
  // El long-press no debe seleccionar ni copiar texto (menú de copiar en móvil).
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  width: 100%;
}

.cancel-modal__icon {
  align-items: center;
  background: rgba(165, 35, 35, 0.12);
  border-radius: 50%;
  color: #a52323;
  display: flex;
  font-size: 1.6rem;
  height: 64px;
  justify-content: center;
  width: 64px;
}

.cancel-modal h2 { font-size: 1.25rem; letter-spacing: -0.02em; }
.cancel-modal p { color: rgba(8, 17, 13, 0.68); font-size: 0.9rem; line-height: 1.5; }

.cancel-modal__hold {
  background: #a52323;
  border: 0;
  border-radius: 14px;
  color: #fff;
  cursor: pointer;
  min-height: 56px;
  overflow: hidden;
  padding: 0;
  position: relative;
  // Sin esto, en móvil el hold dispara scroll/zoom y suelta el botón.
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  width: 100%;
}

.cancel-modal__hold.holding { background: #8a1d1d; }
.cancel-modal__hold.disabled { background: rgba(8, 17, 13, 0.25); cursor: not-allowed; }

.cancel-modal__picker {
  align-items: flex-start;
  background: rgba(35, 89, 49, 0.07);
  border-radius: 12px;
  color: #1b3f26;
  display: flex;
  font-size: 0.84rem;
  gap: 0.5rem;
  line-height: 1.5;
  padding: 0.7rem 0.85rem;
  text-align: left;

  i { margin-top: 0.2rem; }
}

.cancel-modal__warning {
  align-items: flex-start;
  background: #fff8d6;
  border: 1px solid rgba(239, 213, 55, 0.7);
  border-radius: 12px;
  color: #6a4e05 !important;
  display: flex;
  font-size: 0.82rem;
  gap: 0.5rem;
  padding: 0.7rem 0.85rem;
  text-align: left;
}

.cancel-modal__reason {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  text-align: left;
  // El textarea sí debe poder seleccionarse aunque el modal bloquee la selección.
  user-select: text;
  -webkit-user-select: text;
  width: 100%;
}

.cancel-modal__reason label { color: rgba(8, 17, 13, 0.62); font-size: 0.72rem; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; }
.cancel-modal__reason small { color: rgba(8, 17, 13, 0.55); font-size: 0.72rem; }

.cancel-modal__chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.cancel-modal__chips button {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.14);
  border-radius: 999px;
  color: #18211b;
  cursor: pointer;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.35rem 0.6rem;
}
.cancel-modal__chips button.active { background: rgba(165, 35, 35, 0.1); border-color: #a52323; color: #a52323; }

.cancel-modal__reason textarea {
  background: #fbf8ef;
  border: 1px solid rgba(8, 17, 13, 0.14);
  border-radius: 12px;
  color: #18211b;
  font: inherit;
  font-size: 0.88rem;
  padding: 0.6rem 0.75rem;
  resize: vertical;
  width: 100%;
}

.cancel-modal__fill {
  background: rgba(0, 0, 0, 0.35);
  inset: 0;
  position: absolute;
  transform: scaleX(0);
  transform-origin: left center;
}

.cancel-modal__label {
  align-items: center;
  display: flex;
  font-size: 0.88rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 56px;
  padding: 0 1rem;
  position: relative;
}

.cancel-modal__keep {
  align-items: center;
  background: rgba(35, 89, 49, 0.08);
  border: 0;
  border-radius: 12px;
  color: #235931;
  cursor: pointer;
  display: flex;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 48px;
  padding: 0.7rem 1rem;
  width: 100%;
}

.cancel-modal-enter-active,
.cancel-modal-leave-active { transition: opacity 0.25s ease; }
.cancel-modal-enter-active .cancel-modal { transition: opacity 0.25s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.cancel-modal-leave-active .cancel-modal { transition: opacity 0.2s ease, transform 0.2s ease; }
.cancel-modal-enter-from,
.cancel-modal-leave-to { opacity: 0; }
.cancel-modal-enter-from .cancel-modal { opacity: 0; transform: translateY(24px) scale(0.95); }
.cancel-modal-leave-to .cancel-modal { opacity: 0; transform: translateY(10px) scale(0.97); }
</style>
