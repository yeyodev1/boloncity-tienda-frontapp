import { ref } from 'vue'

/**
 * Sonidos del tablero de pedidos. Antes eran los cues de Cuelume: suaves por diseño y con un limitador a -8 dB,
 * así que en una cocina con ruido no se escuchaban. Ahora es una ALARMA propia con Web Audio: tonos agudos y
 * cortantes (cuadrada + diente de sierra), casi a tope, con un compresor solo para no saturar el parlante.
 *
 * El navegador bloquea el audio hasta la primera interacción con la página y esa licencia se pierde en cada
 * recarga: mientras no la haya, el tablero muestra un aviso para tocarlo y dejar el sonido armado.
 */
const MUTE_KEY = 'admin_orders_sound_muted'
const VOLUME_KEY = 'admin_orders_sound_volume'

function readNumber(key: string, fallback: number) {
  try {
    const value = Number(localStorage.getItem(key))
    return Number.isFinite(value) && localStorage.getItem(key) !== null ? value : fallback
  } catch {
    return fallback
  }
}

const muted = ref(localStorage.getItem(MUTE_KEY) === '1')
/** 0.2 a 1. Por defecto al máximo: el aviso tiene que oírse sobre la plancha y la campana. */
const volume = ref(Math.min(1, Math.max(0.2, readNumber(VOLUME_KEY, 1))))
const armed = ref(navigator.userActivation?.hasBeenActive === true)

if (!armed.value && typeof document !== 'undefined') {
  const markArmed = () => {
    armed.value = true
    void context()?.resume()
  }
  for (const event of ['pointerdown', 'keydown', 'touchstart'] as const) {
    document.addEventListener(event, markArmed, { once: true, capture: true })
  }
}

let sharedContext: AudioContext | null = null
let sharedOutput: GainNode | null = null

function context() {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!sharedContext) {
    sharedContext = new Ctor()
    // Compresor suave: sube lo bajo y evita que el parlante sature cuando suenan varios avisos seguidos.
    const compressor = sharedContext.createDynamicsCompressor()
    compressor.threshold.value = -6
    compressor.knee.value = 4
    compressor.ratio.value = 6
    compressor.attack.value = 0.002
    compressor.release.value = 0.1
    sharedOutput = sharedContext.createGain()
    sharedOutput.connect(compressor).connect(sharedContext.destination)
  }
  if (sharedContext.state === 'suspended') void sharedContext.resume()
  return sharedContext
}

type Note = [frequency: number, durationMs: number, gapMs?: number]

/** Un tono fuerte: cuadrada + sierra levemente desafinadas (suena "más gordo" y atraviesa el ruido). */
function beep(ctx: AudioContext, frequency: number, start: number, duration: number, level: number) {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.linearRampToValueAtTime(level, start + 0.006)
  gain.gain.setValueAtTime(level, start + duration - 0.03)
  gain.gain.linearRampToValueAtTime(0.0001, start + duration)
  gain.connect(sharedOutput!)
  for (const [type, detune, share] of [['square', 0, 0.55], ['sawtooth', 7, 0.45]] as const) {
    const oscillator = ctx.createOscillator()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, start)
    oscillator.detune.value = detune
    const mix = ctx.createGain()
    mix.gain.value = share
    oscillator.connect(mix).connect(gain)
    oscillator.start(start)
    oscillator.stop(start + duration + 0.02)
  }
}

/** Toca una secuencia de notas. Devuelve cuánto dura, para encadenar repeticiones. */
function playPattern(notes: Note[], level = 1) {
  if (muted.value) return 0
  const ctx = context()
  if (!ctx || !sharedOutput) return 0
  sharedOutput.gain.value = volume.value
  let cursor = ctx.currentTime + 0.02
  for (const [frequency, durationMs, gapMs = 60] of notes) {
    beep(ctx, frequency, cursor, durationMs / 1000, 0.9 * level)
    cursor += (durationMs + gapMs) / 1000
  }
  return cursor - ctx.currentTime
}

// Patrones: cada evento suena distinto, para saber qué pasó sin mirar la pantalla.
const NEW_ORDER: Note[] = [[1318, 170, 50], [1046, 170, 50], [1318, 170, 50], [1568, 320, 0]]
const STATUS: Note[] = [[1174, 150, 50], [1568, 220, 0]]
const CANCELLED: Note[] = [[660, 220, 60], [440, 380, 0]]
const PICKER: Note[] = [[1046, 120, 40], [1318, 160, 0]]
const CONFIRM: Note[] = [[988, 120, 40], [1318, 200, 0]]

/** Cuántas veces se repite el aviso de pedido nuevo, y la pausa entre repeticiones. */
const NEW_ORDER_REPEATS = 3
const NEW_ORDER_PAUSE_MS = 450

function setMuted(value: boolean) {
  muted.value = value
  localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  // Al reactivar suena una confirmación: así el cajero sabe que el audio volvió.
  if (!value) playPattern(CONFIRM)
}

function setVolume(value: number) {
  volume.value = Math.min(1, Math.max(0.2, value))
  try {
    localStorage.setItem(VOLUME_KEY, String(volume.value))
  } catch {
    /* sin almacenamiento: vale para esta sesión */
  }
}

/** Pedido nuevo: la alarma completa, repetida, porque en una cocina con ruido un solo toque se pierde. */
function playNewOrder() {
  const seconds = playPattern(NEW_ORDER)
  if (!seconds) return
  for (let repeat = 1; repeat < NEW_ORDER_REPEATS; repeat++) {
    setTimeout(() => playPattern(NEW_ORDER), repeat * (seconds * 1000 + NEW_ORDER_PAUSE_MS))
  }
}

/** Deja el sonido listo. Se llama DESDE el clic del usuario: ese gesto levanta el bloqueo del navegador. */
function armSound() {
  armed.value = true
  void context()?.resume()
  playPattern(CONFIRM)
}

/** Cambio de estado de una orden (manual o por la actualización automática). */
function playStatus(status: string) {
  playPattern(status === 'cancelled' ? CANCELLED : STATUS)
}

/** Actualización del delivery de Picker (motorizado asignado, en camino, etc.). */
function playPickerUpdate() {
  playPattern(PICKER, 0.9)
}

/** Botón "Probar": la misma alarma de un pedido nuevo, una vez. */
function playTest() {
  void context()?.resume()
  playPattern(NEW_ORDER)
}

export function useOrderSounds() {
  return { muted, armed, volume, setMuted, setVolume, armSound, playNewOrder, playStatus, playPickerUpdate, playTest }
}
