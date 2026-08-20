import { ref } from 'vue'
import { play, setEnabled, type SoundName } from 'cuelume'

/**
 * Sonidos del tablero de pedidos (Cuelume). La preferencia de silencio se guarda
 * en localStorage porque Cuelume no persiste nada por sí solo.
 * Nota: el navegador bloquea el audio hasta la primera interacción del usuario.
 */
const MUTE_KEY = 'admin_orders_sound_muted'

const muted = ref(localStorage.getItem(MUTE_KEY) === '1')
setEnabled(!muted.value)

// Cada evento del tablero tiene su cue del catálogo de Cuelume.
const statusSounds: Record<string, SoundName> = {
  paid: 'sparkle',
  preparing: 'pulse',
  awaiting_pickup: 'pulse',
  ready: 'ready',
  delivered: 'success',
  cancelled: 'error',
}

function setMuted(value: boolean) {
  muted.value = value
  localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  setEnabled(!value)
  // Al reactivar suena una confirmación: así el cajero sabe que el audio volvió.
  if (!value) play('chime')
}

/** Pedido nuevo en el tablero: el cue más llamativo del catálogo. */
function playNewOrder() {
  play('arrival')
}

/** Cambio de estado de una orden (manual o remoto). */
function playStatus(status: string) {
  play(statusSounds[status] || 'pulse')
}

/** Actualización del delivery de Picker (motorizado asignado, en camino, etc.). */
function playPickerUpdate() {
  play('tick', { volume: 0.7 })
}

export function useOrderSounds() {
  return { muted, setMuted, playNewOrder, playStatus, playPickerUpdate }
}
