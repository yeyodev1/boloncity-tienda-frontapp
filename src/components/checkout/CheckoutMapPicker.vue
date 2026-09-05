<script setup lang="ts">
/**
 * Elegir el punto de entrega en un mapa, como lo hace cualquier app de delivery.
 *
 * Pegar un link de Google Maps funciona cuando funciona, pero falla de maneras que
 * el cliente no puede diagnosticar: un lugar compartido desde la app lleva un
 * nombre y no un pin, y el link se rompe al pasar por el chat que lo trajo. Cada
 * uno de esos casos terminaba en un mensaje al local.
 *
 * El pin va fijo al centro de la pantalla y el mapa se mueve por debajo. Es el
 * patrón de todas las apps de delivery y le gana a arrastrar un marcador en el
 * teléfono: el objetivo nunca sale del medio, así que no queda tapado por el dedo
 * ni fuera de la vista.
 *
 * El costo se pregunta al backend, no se estima acá: Boloncity tiene varias
 * sucursales y es el servidor el que decide cuál cubre ese punto y a qué precio.
 * Mostrar una cuenta propia sería enseñar un número y cobrar otro.
 */
import { ref, shallowRef, computed, watch, onBeforeUnmount, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import DeliveryService from '@/services/DeliveryService'

const props = defineProps<{
  open: boolean
  /** Dónde abrir el mapa cuando el cliente ya tiene un punto resuelto. */
  initial?: { lat: number; lng: number } | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'confirm', coords: { lat: number; lng: number }): void
}>()

/** Guayaquil. Solo el encuadre inicial cuando no hay nada mejor. */
const FALLBACK = { lat: -2.1709, lng: -79.9224 }

const mapEl = ref<HTMLElement | null>(null)
const map = shallowRef<L.Map | null>(null)
const centre = ref<{ lat: number; lng: number }>({ ...FALLBACK })
const address = ref('')
const isLocating = ref(false)
const isNaming = ref(false)
const locateError = ref('')
/** Mientras el mapa se desliza, el pin se levanta y el precio se congela. */
const isMoving = ref(false)

/** Respuesta del servidor para el pin actual: sucursal, distancia y envío. */
const quote = ref<{ branchName: string; distance: number; fee: number; eta: number | null } | null>(null)
const outOfRange = ref('')
const isQuoting = ref(false)

const canConfirm = computed(() => Boolean(quote.value) && !isQuoting.value && !isMoving.value)

let quoteTimer: ReturnType<typeof setTimeout> | undefined
let quoteSeq = 0

/**
 * Cotiza el pin contra el backend.
 *
 * Con rebote y guardia de secuencia: el mapa se asienta muchas veces mientras
 * alguien busca su casa, y una respuesta lenta de un punto viejo no puede pisar
 * a una rápida de un punto nuevo.
 */
function quoteCentre() {
  clearTimeout(quoteTimer)
  const seq = ++quoteSeq
  isQuoting.value = true
  quoteTimer = setTimeout(async () => {
    const { lat, lng } = centre.value
    try {
      const res = await DeliveryService.preCheckout(lat, lng)
      if (seq !== quoteSeq) return
      quote.value = {
        branchName: res.data.branch?.name || '',
        distance: res.data.distance,
        fee: res.data.deliveryFee,
        eta: res.data.driverEtaMinutes ?? null,
      }
      outOfRange.value = ''
    } catch (err) {
      if (seq !== quoteSeq) return
      quote.value = null
      const data = (err as { data?: { code?: string; message?: string } })?.data
      outOfRange.value =
        data?.code === 'DELIVERY_OUT_OF_COVERAGE'
          ? data.message || 'No llegamos hasta acá.'
          : 'No pudimos calcular el envío para este punto.'
    } finally {
      if (seq === quoteSeq) isQuoting.value = false
    }
  }, 550)
}

let nameTimer: ReturnType<typeof setTimeout> | undefined
let nameSeq = 0

/**
 * Le pone nombre al punto bajo el pin.
 *
 * Unas coordenadas no le prueban nada a un cliente: "-2.1348, -79.9020" no es
 * algo que alguien pueda contrastar con el lugar donde vive. El nombre de la
 * calle sí, y es la diferencia entre confirmar y adivinar. Best-effort: ni el
 * precio ni el botón de confirmar dependen de que aparezca.
 */
function nameCentre() {
  clearTimeout(nameTimer)
  const seq = ++nameSeq
  isNaming.value = true
  nameTimer = setTimeout(async () => {
    try {
      const { lat, lng } = centre.value
      const url =
        'https://nominatim.openstreetmap.org/reverse?format=jsonv2' +
        `&lat=${lat}&lon=${lng}&zoom=18&accept-language=es`
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (!res.ok) throw new Error('reverse failed')
      const data = (await res.json()) as { address?: Record<string, string>; display_name?: string }
      if (seq !== nameSeq) return
      const a = data.address ?? {}
      const street = [a.road, a.house_number].filter(Boolean).join(' ')
      const area = a.neighbourhood ?? a.suburb ?? a.city_district ?? a.town ?? a.city
      address.value = [street, area].filter(Boolean).join(', ') || (data.display_name ?? '')
    } catch {
      if (seq === nameSeq) address.value = ''
    } finally {
      if (seq === nameSeq) isNaming.value = false
    }
  }, 450)
}

async function mount() {
  await nextTick()
  if (!mapEl.value || map.value) return

  const start = props.initial ?? FALLBACK
  centre.value = { ...start }

  const m = L.map(mapEl.value, {
    center: [start.lat, start.lng],
    zoom: props.initial ? 17 : 13,
    zoomControl: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap',
  }).addTo(m)

  L.control.zoom({ position: 'bottomright' }).addTo(m)

  m.on('movestart', () => {
    isMoving.value = true
    // La respuesta anterior es de otro punto.
    quote.value = null
    outOfRange.value = ''
  })
  m.on('move', () => {
    const c = m.getCenter()
    centre.value = { lat: c.lat, lng: c.lng }
  })
  m.on('moveend', () => {
    isMoving.value = false
    nameCentre()
    quoteCentre()
  })

  map.value = m
  // Leaflet mide el contenedor al crearse; dentro de un modal recién mostrado esa
  // medida es la de una caja de altura cero.
  setTimeout(() => m.invalidateSize(), 60)
  nameCentre()
  quoteCentre()
}

function destroy() {
  clearTimeout(nameTimer)
  clearTimeout(quoteTimer)
  nameSeq++
  quoteSeq++
  quote.value = null
  outOfRange.value = ''
  isQuoting.value = false
  map.value?.remove()
  map.value = null
  address.value = ''
  locateError.value = ''
}

/** Saltar a la posición del dispositivo: el camino más corto a un pin correcto. */
function locateMe() {
  if (!navigator.geolocation) {
    locateError.value = 'Tu navegador no permite compartir ubicación.'
    return
  }
  isLocating.value = true
  locateError.value = ''
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      isLocating.value = false
      map.value?.flyTo([pos.coords.latitude, pos.coords.longitude], 17, { duration: 0.8 })
    },
    () => {
      isLocating.value = false
      // Negarse es una decisión, no una falla: el mapa sigue funcionando a mano.
      locateError.value = 'No pudimos acceder a tu ubicación. Mueve el mapa para marcarla.'
    },
    { enableHighAccuracy: true, timeout: 8000 },
  )
}

watch(() => props.open, (open) => { if (open) void mount(); else destroy() }, { immediate: true })
onBeforeUnmount(destroy)
</script>

<template>
  <!--
    Teleport a <body>: `position: fixed` deja de estar fijo al viewport si algún
    ancestro tiene transform o filter — se ancla a ese ancestro. Dentro del
    checkout, que además scrollea, el panel terminaba en cualquier lado.
  -->
  <Teleport to="body">
    <Transition name="mp-fade" appear>
      <div v-if="open" class="mp" role="dialog" aria-modal="true" aria-label="Elegir ubicación de entrega" @click.self="emit('close')">
       <div class="mp__card">
        <header class="mp__head">
          <button class="mp__back" type="button" aria-label="Cerrar" @click="emit('close')">
            <i class="fa-solid fa-arrow-left" />
          </button>
          <div class="mp__titles">
            <strong>¿Dónde te lo dejamos?</strong>
            <span>Mueve el mapa para poner el pin en tu puerta</span>
          </div>
        </header>

        <div class="mp__mapwrap">
          <div ref="mapEl" class="mp__map" />

          <!-- Fijo al centro: se mueve el mapa, no el pin. -->
          <div class="mp__pin" :class="{ 'mp__pin--lifted': isMoving }" aria-hidden="true">
            <i class="fa-solid fa-location-dot" />
            <span class="mp__pin-shadow" />
          </div>

          <button class="mp__locate" type="button" :disabled="isLocating" @click="locateMe">
            <i :class="isLocating ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-crosshairs'" />
            <span>{{ isLocating ? 'Buscando…' : 'Usar mi ubicación' }}</span>
          </button>
        </div>

        <footer class="mp__foot">
          <p v-if="locateError" class="mp__err"><i class="fa-solid fa-circle-info" /> {{ locateError }}</p>

          <div class="mp__where">
            <i class="fa-solid fa-location-dot" />
            <div class="mp__where-body">
              <strong v-if="address">{{ address }}</strong>
              <strong v-else-if="isNaming">Buscando la dirección…</strong>
              <strong v-else>Punto seleccionado</strong>
              <span v-if="quote">
                {{ quote.distance }} km desde {{ quote.branchName || 'la sucursal más cercana' }}<template v-if="quote.eta"> · motorizado al local en ~{{ quote.eta }} min</template>
              </span>
              <span v-else>Mueve el mapa hasta tu puerta</span>
            </div>
          </div>

          <div
            class="mp__fee"
            :class="isQuoting || isMoving ? 'mp__fee--pending' : outOfRange ? 'mp__fee--warn' : 'mp__fee--ok'"
          >
            <template v-if="isQuoting || isMoving">
              <i class="fa-solid fa-spinner fa-spin" /> <span>Calculando tu envío…</span>
            </template>
            <template v-else-if="outOfRange">
              <i class="fa-solid fa-triangle-exclamation" /> <span>{{ outOfRange }}</span>
            </template>
            <template v-else-if="quote">
              <i class="fa-solid fa-motorcycle" /> <span>Envío <strong>${{ quote.fee.toFixed(2) }}</strong></span>
            </template>
          </div>

          <button class="mp__confirm" type="button" :disabled="!canConfirm" @click="emit('confirm', { ...centre })">
            <i class="fa-solid fa-check" />
            {{ outOfRange ? 'Elige otro punto' : 'Confirmar esta ubicación' }}
          </button>
        </footer>
       </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.mp {
  align-items: center;
  // El fondo oscuro deja ver el checkout detrás: el mapa es un paso dentro del
  // pedido, no otra pantalla. A pantalla completa se sentía como haberse ido.
  background: rgba(8, 17, 13, 0.55);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: clamp(0.75rem, 4vh, 2.5rem) 1rem;
  position: fixed;
  // Por encima de la cinta de entorno (9999), que quedaba justo sobre el botón de
  // confirmar. Los demás modales de la app ya viven por encima de ella.
  z-index: 10000;
}

.mp__card {
  background: #fff;
  border-radius: 26px;
  box-shadow: 0 30px 80px rgba(8, 17, 13, 0.4);
  display: flex;
  flex-direction: column;
  max-height: 100%;
  max-width: 540px;
  overflow: hidden;
  width: 100%;
}

// En el teléfono la tarjeta ocupa todo: recortar un mapa en una pantalla chica
// deja una ventanita por la que no se puede buscar nada.
@media (max-width: 560px) {
  .mp { padding: 0; }
  .mp__card { border-radius: 0; max-height: none; max-width: none; height: 100%; }
}

.mp__head {
  align-items: center;
  background: #235931;
  color: #fff;
  display: flex;
  flex-shrink: 0;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
}

.mp__back {
  background: rgba(255, 255, 255, 0.14);
  border-radius: 999px;
  color: #fff;
  display: grid;
  height: 2.25rem;
  place-items: center;
  width: 2.25rem;

  &:hover { background: rgba(255, 255, 255, 0.26); }
}

.mp__titles {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;

  strong { font-size: 1rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2; }
  span { font-size: 0.76rem; line-height: 1.3; opacity: 0.85; }
}

// El mapa cede alto antes que el pie: con un mínimo alto empujaba «Confirmar esta
// ubicación» fuera de la pantalla en ventanas bajas. Un mapa algo más chico se
// sigue pudiendo mover; un botón que no está no se puede tocar.
.mp__mapwrap { flex: 1 1 auto; min-height: 190px; position: relative; }
.mp__map { inset: 0; position: absolute; }

.mp__pin {
  left: 50%;
  pointer-events: none;
  position: absolute;
  text-align: center;
  top: 50%;
  transform: translate(-50%, -100%);
  transition: transform 0.18s ease;
  z-index: 500;

  > i { color: #a52323; filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.35)); font-size: 2.4rem; }

  // Levantarlo mientras el mapa se desliza se lee como "todavía no está puesto".
  &--lifted { transform: translate(-50%, -115%); }
}

.mp__pin-shadow {
  background: rgba(0, 0, 0, 0.32);
  border-radius: 50%;
  display: block;
  height: 0.25rem;
  margin: -0.15rem auto 0;
  width: 0.5rem;
}

.mp__locate {
  align-items: center;
  background: #fff;
  border: 1.5px solid rgba(35, 89, 49, 0.18);
  border-radius: 999px;
  bottom: 1rem;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.16);
  color: #235931;
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 700;
  gap: 0.45rem;
  left: 1rem;
  padding: 0.6rem 0.95rem;
  position: absolute;
  z-index: 500;

  &:disabled { opacity: 0.65; }
}

.mp__foot {
  background: #fff;
  border-top: 1px solid rgba(8, 17, 13, 0.1);
  box-shadow: 0 -4px 18px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 0.7rem;
  padding: 0.9rem 1rem calc(1rem + env(safe-area-inset-bottom));
}

.mp__err {
  align-items: flex-start;
  color: #92400e;
  display: flex;
  font-size: 0.76rem;
  gap: 0.4rem;
  line-height: 1.4;
}

.mp__where {
  align-items: flex-start;
  display: flex;
  gap: 0.55rem;

  > i { color: #a52323; margin-top: 0.15rem; }
}

.mp__where-body {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;

  strong { font-size: 0.95rem; font-weight: 800; letter-spacing: -0.01em; }
  span { color: rgba(8, 17, 13, 0.55); font-size: 0.8rem; }
}

.mp__fee {
  align-items: center;
  border-radius: 12px;
  display: flex;
  font-size: 0.88rem;
  gap: 0.5rem;
  line-height: 1.45;
  padding: 0.7rem 0.85rem;

  strong { font-weight: 800; }

  &--ok { background: rgba(0, 165, 35, 0.1); color: #12692a; }
  &--pending { background: rgba(8, 17, 13, 0.05); color: rgba(8, 17, 13, 0.6); }
  &--warn { background: #fdeceb; color: #7c1a1a; }
}

.mp__confirm {
  align-items: center;
  background: #235931;
  border-radius: 999px;
  color: #fff;
  display: flex;
  font-size: 0.95rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 52px;
  padding: 0.85rem 1.2rem;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) { background: #00a523; }
  &:disabled { background: rgba(8, 17, 13, 0.25); }
}

.mp-fade-enter-active,
.mp-fade-leave-active { transition: opacity 0.22s ease; }
.mp-fade-enter-from,
.mp-fade-leave-to { opacity: 0; }

.mp-fade-enter-active .mp__card,
.mp-fade-leave-active .mp__card { transition: transform 0.28s cubic-bezier(0.34, 1.3, 0.64, 1); }
.mp-fade-enter-from .mp__card,
.mp-fade-leave-to .mp__card { transform: translateY(18px) scale(0.98); }
</style>
