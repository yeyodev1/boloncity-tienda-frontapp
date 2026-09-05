<script setup lang="ts">
/**
 * Dónde se entrega el pedido.
 *
 * Antes había tres caminos compitiendo: mapa, ubicación del navegador y pegar un
 * link de Google Maps. El link se fue: fallaba de maneras que el cliente no podía
 * diagnosticar —un lugar compartido desde la app lleva nombre y no pin, y el chat
 * por el que pasa lo rompe— y cada una de esas veces terminaba en un mensaje al
 * local. El mapa hace lo mismo sin ninguna de esas trampas.
 */
defineProps<{
  deliveryGoogleMapsUrl: string
  deliveryDistance: number
  deliveryCost: number
  mapsError: string
  locating: boolean
  locationDetected: boolean
  branchName: string
  displayLat: number
  displayLng: number
}>()

const emit = defineEmits<{
  (e: 'openMap'): void
  (e: 'detectLocation'): void
  (e: 'clearLocation'): void
}>()
</script>

<template>
  <div class="loc">
    <Transition name="loc-fade" mode="out-in">
      <!-- Sin ubicación: una acción principal y una alternativa, nada más. -->
      <div v-if="!locationDetected && !deliveryGoogleMapsUrl" key="empty" class="loc__choices">
        <button type="button" class="loc__primary" @click="emit('openMap')">
          <i class="fa-solid fa-map-location-dot" />
          <span>
            <strong>Marcar en el mapa</strong>
            <small>Mueve el pin hasta tu puerta</small>
          </span>
          <i class="fa-solid fa-chevron-right loc__chevron" />
        </button>

        <button type="button" class="loc__secondary" :disabled="locating" @click="emit('detectLocation')">
          <i class="fa-solid fa-location-crosshairs" :class="{ 'fa-spin': locating }" />
          {{ locating ? 'Detectando…' : 'Usar mi ubicación actual' }}
        </button>
      </div>

      <!-- Con ubicación: qué se eligió, cuánto sale, y cómo cambiarlo. -->
      <div v-else key="set" class="loc__set">
        <div class="loc__set-head">
          <i class="fa-solid fa-circle-check" />
          <div class="loc__set-copy">
            <strong>Ubicación {{ locationDetected ? 'detectada' : 'lista' }}</strong>
            <span>{{ displayLat.toFixed(4) }}, {{ displayLng.toFixed(4) }}</span>
          </div>
          <button type="button" class="loc__edit" @click="emit('openMap')">
            <i class="fa-solid fa-pen" /> Ajustar
          </button>
          <button type="button" class="loc__edit loc__edit--clear" title="Quitar ubicación" @click="emit('clearLocation')">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>

        <div v-if="deliveryDistance > 0 && deliveryCost > 0" class="loc__fee">
          <i class="fa-solid fa-motorcycle" />
          <div class="loc__fee-copy">
            <strong>Envío a tu dirección</strong>
            <span>{{ deliveryDistance }} km desde {{ branchName || 'la sucursal más cercana' }}</span>
          </div>
          <strong class="loc__fee-price">${{ deliveryCost.toFixed(2) }}</strong>
        </div>

        <p v-else-if="!mapsError" class="loc__pending">
          <i class="fa-solid fa-spinner fa-spin" /> Calculando el envío…
        </p>
      </div>
    </Transition>

    <p v-if="mapsError" class="loc__error"><i class="fa-solid fa-circle-exclamation" /> {{ mapsError }}</p>
  </div>
</template>

<style scoped lang="scss">
.loc { display: flex; flex-direction: column; gap: 0.6rem; }

.loc-fade-enter-active,
.loc-fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.loc-fade-enter-from,
.loc-fade-leave-to { opacity: 0; transform: translateY(6px); }

.loc__choices { display: flex; flex-direction: column; gap: 0.5rem; }

.loc__primary {
  align-items: center;
  background: #235931;
  border-radius: 18px;
  color: #fff;
  display: flex;
  gap: 0.8rem;
  min-height: 62px;
  padding: 0.85rem 1.1rem;
  text-align: left;
  transition: background-color 0.2s ease, transform 0.2s ease;

  > i:first-child { font-size: 1.25rem; }

  span {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  strong { font-size: 0.98rem; font-weight: 800; letter-spacing: -0.01em; }
  small { font-size: 0.78rem; opacity: 0.8; }

  &:hover { background: #00a523; transform: translateY(-2px); }
}

.loc__chevron { font-size: 0.85rem; opacity: 0.7; }

.loc__secondary {
  align-items: center;
  background: transparent;
  border: 1px solid rgba(8, 17, 13, 0.14);
  border-radius: 999px;
  color: rgba(8, 17, 13, 0.72);
  display: flex;
  font-size: 0.88rem;
  font-weight: 700;
  gap: 0.5rem;
  justify-content: center;
  min-height: 46px;
  padding: 0.6rem 1.1rem;
  transition: background-color 0.2s ease, border-color 0.2s ease;

  &:hover:not(:disabled) { background: rgba(35, 89, 49, 0.06); border-color: rgba(35, 89, 49, 0.3); }
  &:disabled { opacity: 0.6; }
}

.loc__set { display: flex; flex-direction: column; gap: 0.55rem; }

.loc__set-head {
  align-items: center;
  background: rgba(0, 165, 35, 0.07);
  border-radius: 16px;
  display: flex;
  gap: 0.6rem;
  padding: 0.75rem 0.85rem;

  > i:first-child { color: #00a523; font-size: 1.05rem; }
}

.loc__set-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;

  strong { font-size: 0.9rem; font-weight: 800; }
  span { color: rgba(8, 17, 13, 0.5); font-size: 0.76rem; }
}

.loc__edit {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.12);
  border-radius: 999px;
  color: #235931;
  display: inline-flex;
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 700;
  gap: 0.35rem;
  padding: 0.42rem 0.75rem;

  &:hover { background: rgba(35, 89, 49, 0.08); }
  &--clear { color: #a52323; padding: 0.42rem 0.6rem; }
}

.loc__fee {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(35, 89, 49, 0.16);
  border-radius: 16px;
  display: flex;
  gap: 0.7rem;
  padding: 0.75rem 0.9rem;

  > i { color: #235931; font-size: 1.05rem; }
}

.loc__fee-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;

  strong { font-size: 0.88rem; font-weight: 800; }
  span { color: rgba(8, 17, 13, 0.52); font-size: 0.76rem; line-height: 1.35; }
}

.loc__fee-price {
  color: #235931;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

.loc__pending {
  align-items: center;
  color: rgba(8, 17, 13, 0.5);
  display: flex;
  font-size: 0.8rem;
  gap: 0.4rem;
}

.loc__error {
  align-items: flex-start;
  color: #a02828;
  display: flex;
  font-size: 0.8rem;
  gap: 0.4rem;
  line-height: 1.45;

  i { margin-top: 0.15rem; }
}
</style>
