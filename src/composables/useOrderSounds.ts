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

/**
 * El navegador no deja sonar nada hasta que alguien toca la página, y esa licencia
 * se pierde en cada recarga. Cuelume lo respeta al pie de la letra: su `play()` se
 * sale sin hacer nada mientras `navigator.userActivation.hasBeenActive` sea false.
 * Como el tablero del local se abre y se deja solo, el aviso de pedido nuevo no
 * sonaba jamás y en la sucursal lo vivían como "la app no tiene sonido".
 *
 * Por eso seguimos si hubo interacción en esta carga de la página: mientras no la
 * haya, el tablero muestra un aviso para tocarlo y dejar el sonido armado.
 */
const armed = ref(navigator.userActivation?.hasBeenActive === true)

if (!armed.value && typeof document !== 'undefined') {
  const markArmed = () => {
    armed.value = true
  }
  for (const event of ['pointerdown', 'keydown', 'touchstart'] as const) {
    document.addEventListener(event, markArmed, { once: true, capture: true })
  }
}

/** Cuántas veces se repite el aviso de pedido nuevo, y cada cuánto. */
const NEW_ORDER_REPEATS = 3
const NEW_ORDER_GAP_MS = 800

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

/**
 * Pedido nuevo en el tablero: el cue más llamativo del catálogo, repetido, porque
 * en una cocina con ruido un solo toque se pierde.
 */
function playNewOrder() {
  play('arrival')
  for (let repeat = 1; repeat < NEW_ORDER_REPEATS; repeat++) {
    setTimeout(() => play('arrival'), repeat * NEW_ORDER_GAP_MS)
  }
}

/**
 * Deja el sonido listo. Se llama DESDE el clic del usuario: ese gesto es el que
 * levanta el bloqueo del navegador, y el 'chime' confirma que se escucha.
 */
function armSound() {
  armed.value = true
  if (!muted.value) play('chime')
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
  return { muted, armed, setMuted, armSound, playNewOrder, playStatus, playPickerUpdate }
}
