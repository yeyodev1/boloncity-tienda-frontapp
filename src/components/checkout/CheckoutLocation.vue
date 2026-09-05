<script setup lang="ts">
defineProps<{
  deliveryGoogleMapsUrl: string
  deliveryDistance: number
  deliveryCost: number
  mapsError: string
  locating: boolean
  resolving?: boolean
  locationDetected: boolean
  manualMapsLink: string
  branchName: string
  displayLat: number
  displayLng: number
}>()

const emit = defineEmits<{
  (e: 'openMap'): void
  (e: 'detectLocation'): void
  (e: 'useManualLink'): void
  (e: 'clearLocation'): void
  (e: 'update:manualMapsLink', v: string): void
}>()
</script>

<template>
  <div class="checkout-location">
    <span class="checkout-field__label"><i class="fa-solid fa-map-pin" /> Ubicación <em>*</em></span>

    <Transition name="location-fade" mode="out-in">
      <div v-if="!locationDetected && !deliveryGoogleMapsUrl" key="actions" class="checkout-location__actions">
        <!--
          El mapa va primero y el link de Maps queda como alternativa. Pegar un link
          falla de maneras que el cliente no puede diagnosticar —un lugar compartido
          desde la app lleva nombre y no pin, el chat lo rompe— y cada uno de esos
          casos terminaba en un mensaje al local.
        -->
        <button type="button" class="checkout-location__detect" @click="emit('openMap')">
          <i class="fa-solid fa-map-location-dot" />
          <span>Elegir en el mapa</span>
        </button>

        <button type="button" class="checkout-location__alt" :class="{ 'is-loading': locating }" :disabled="locating" @click="emit('detectLocation')">
          <i class="fa-solid fa-location-crosshairs" :class="{ 'fa-spin': locating }" />
          <span>{{ locating ? 'Detectando ubicación…' : 'Usar mi ubicación actual' }}</span>
        </button>

        <div class="checkout-location__divider"><span>o pega un link</span></div>

        <div class="checkout-location__manual">
          <input class="checkout-field__input" :value="manualMapsLink" @input="emit('update:manualMapsLink', ($event.target as HTMLInputElement).value)" placeholder="Pega el link de Google Maps de tu dirección" />
          <button type="button" class="checkout-location__apply" :disabled="!manualMapsLink || resolving" @click="emit('useManualLink')">
            <i :class="resolving ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-check'" />
          </button>
        </div>
        <p class="checkout-location__helper">
          {{ resolving ? 'Buscando la ubicación de tu enlace…' : 'Comparte el link de Google Maps del lugar exacto donde quieres recibir tu pedido.' }}
        </p>
      </div>

      <div v-else key="status" class="checkout-location__status">
        <div class="checkout-location__status-icon"><i class="fa-solid fa-circle-check" /></div>
        <div class="checkout-location__status-copy">
          <strong>Ubicación {{ locationDetected ? 'detectada' : 'agregada' }}</strong>
          <span>{{ displayLat.toFixed(4) }}, {{ displayLng.toFixed(4) }}</span>
          <a :href="deliveryGoogleMapsUrl" target="_blank" rel="noopener noreferrer" class="checkout-location__maps-link">
            <i class="fa-solid fa-map" /> Abrir en Google Maps
          </a>
        </div>
        <div class="checkout-location__status-actions">
          <button type="button" class="checkout-location__change" title="Ajustar en el mapa" @click="emit('openMap')">
            <i class="fa-solid fa-map-location-dot" />
          </button>
          <button type="button" class="checkout-location__change" title="Borrar ubicación" @click="emit('clearLocation')">
            <i class="fa-solid fa-xmark" />
          </button>
        </div>
      </div>
    </Transition>

    <small v-if="mapsError" class="checkout-field__maps-error"><i class="fa-solid fa-circle-exclamation" /> {{ mapsError }}</small>

    <!--
      El costo del envío deja de ser un texto gris al pie y pasa a ser una fila con
      su precio a la derecha, con la distancia y la sucursal que lo justifican. Un
      número que se puede leer de un vistazo es un número que no genera un reclamo.
    -->
    <div v-else-if="deliveryDistance > 0 && deliveryCost > 0" class="checkout-location__fee">
      <i class="fa-solid fa-motorcycle" />
      <div class="checkout-location__fee-copy">
        <strong>Envío a tu dirección</strong>
        <span>{{ deliveryDistance }} km desde {{ branchName || 'la sucursal más cercana' }}</span>
      </div>
      <strong class="checkout-location__fee-price">${{ deliveryCost.toFixed(2) }}</strong>
    </div>

    <small v-else-if="deliveryDistance > 0" class="checkout-location__distance">
      <i class="fa-solid fa-road" /> A {{ deliveryDistance }} km de la sucursal{{ branchName ? ' — ' + branchName : '' }}
    </small>
    <small v-else-if="deliveryGoogleMapsUrl" class="checkout-location__distance checkout-location__distance--pending">
      <i class="fa-solid fa-spinner fa-spin" /> Calculando distancia…
    </small>
    <small v-else class="checkout-location__hint">
      <i class="fa-solid fa-circle-info" /> Comparte el link de Google Maps del lugar donde quieres recibir tu pedido.
    </small>
  </div>
</template>

<style scoped lang="scss">
.checkout-location__alt {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(35, 89, 49, 0.22);
  border-radius: 999px;
  color: #235931;
  display: flex;
  font-weight: 700;
  gap: 0.6rem;
  justify-content: center;
  min-height: 46px;
  padding: 0.7rem 1.2rem;
  transition: background-color 0.2s ease;
}

.checkout-location__alt:hover:not(:disabled) { background: rgba(35, 89, 49, 0.07); }
.checkout-location__alt:disabled { opacity: 0.7; }

.checkout-location__status-actions { display: flex; gap: 0.35rem; }

.checkout-location__fee {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(35, 89, 49, 0.18);
  border-radius: 14px;
  display: flex;
  gap: 0.75rem;
  padding: 0.75rem 0.9rem;

  > i {
    color: #235931;
    font-size: 1.05rem;
  }
}

.checkout-location__fee-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;

  strong {
    font-size: 0.9rem;
    font-weight: 800;
    letter-spacing: -0.01em;
  }

  span {
    color: rgba(8, 17, 13, 0.55);
    font-size: 0.78rem;
    line-height: 1.4;
  }
}

.checkout-location__fee-price {
  color: #235931;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

.checkout-location {
  background: rgba(35, 89, 49, 0.03);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.15rem;
}

.checkout-location .checkout-field__label { margin-bottom: 0; }
.checkout-location__actions { display: flex; flex-direction: column; gap: 0.75rem; }

.checkout-location__detect {
  align-items: center;
  background: #235931;
  border-radius: 999px;
  color: #fff;
  display: flex;
  font-weight: 800;
  gap: 0.6rem;
  justify-content: center;
  min-height: 50px;
  padding: 0.85rem 1.2rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.checkout-location__detect:hover:not(:disabled) { background: #00a523; transform: translateY(-2px); }
.checkout-location__detect:disabled { opacity: 0.7; }
.checkout-location__detect.is-loading { background: #1a4a28; pointer-events: none; }

.checkout-location__helper {
  color: rgba(8, 17, 13, 0.5);
  font-size: 0.78rem;
  line-height: 1.5;
  text-align: center;
}

.location-fade-enter-active,
.location-fade-leave-active { transition: all 0.35s cubic-bezier(0.65, 0, 0.35, 1); }
.location-fade-enter-from,
.location-fade-leave-to { opacity: 0; transform: translateY(8px); }

.checkout-location__divider { align-items: center; display: flex; gap: 0.75rem; }
.checkout-location__divider::before,
.checkout-location__divider::after { border-top: 1px solid rgba(8, 17, 13, 0.1); content: ''; flex: 1 1 0; }
.checkout-location__divider span { color: rgba(8, 17, 13, 0.4); font-size: 0.78rem; font-weight: 700; text-transform: uppercase; }

.checkout-location__manual { display: flex; gap: 0.5rem; }

.checkout-location__manual input {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.1);
  border-radius: 999px;
  flex: 1 1 0;
  min-height: 44px;
  padding: 0 1rem;
}

.checkout-location__manual input:focus { border-color: rgba(35, 89, 49, 0.35); outline: none; }

.checkout-location__apply {
  align-items: center;
  background: #235931;
  border-radius: 50%;
  color: #fff;
  display: flex;
  flex: 0 0 44px;
  height: 44px;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.checkout-location__apply:disabled { opacity: 0.4; }
.checkout-location__apply:hover:not(:disabled) { background: #00a523; }

.checkout-location__status {
  align-items: center;
  background: rgba(35, 89, 49, 0.06);
  border: 1px solid rgba(35, 89, 49, 0.12);
  border-radius: 16px;
  display: flex;
  gap: 0.7rem;
  padding: 0.8rem 0.9rem;
}

.checkout-location__status-icon { align-items: center; color: #00a523; display: flex; font-size: 1.3rem; }
.checkout-location__status-copy { flex: 1 1 0; }
.checkout-location__status-copy strong { display: block; font-size: 0.88rem; }
.checkout-location__status-copy span { color: rgba(8, 17, 13, 0.5); font-size: 0.75rem; margin-top: 0.1rem; }

.checkout-location__change {
  align-items: center;
  background: rgba(26, 26, 26, 0.06);
  border-radius: 50%;
  color: rgba(8, 17, 13, 0.5);
  display: flex;
  flex: 0 0 38px;
  height: 38px;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.checkout-location__change:hover { background: rgba(35, 89, 49, 0.1); color: #235931; }

.checkout-location__maps-link {
  align-items: center;
  color: #235931;
  display: inline-flex;
  font-size: 0.78rem;
  font-weight: 700;
  gap: 0.35rem;
  margin-top: 0.35rem;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.2s ease;
}

.checkout-location__maps-link:hover { color: #00a523; }

.checkout-location__distance { align-items: center; color: #235931; display: flex; font-size: 0.78rem; font-weight: 700; gap: 0.35rem; }
.checkout-location__hint { align-items: center; color: rgba(8, 17, 13, 0.48); display: flex; font-size: 0.75rem; gap: 0.35rem; line-height: 1.5; }
.checkout-location__distance--pending { color: #888; }
.checkout-field__maps-error { align-items: center; color: #a02828; display: flex; font-size: 0.75rem; gap: 0.35rem; line-height: 1.5; }
.checkout-field__maps-error i { font-size: 0.7rem; }
.checkout-field__label { align-items: center; color: rgba(8, 17, 13, 0.62); display: flex; font-size: 0.78rem; font-weight: 900; gap: 0.45rem; letter-spacing: 0.12em; text-transform: uppercase; }
.checkout-field__label i { color: #235931; font-size: 0.72rem; opacity: 0.8; }
.checkout-field__label em { color: #a02828; font-style: normal; }
.checkout-field__input { background: transparent; border: 0; border-radius: 0; box-shadow: none; color: #08110d; min-height: 34px; padding: 0; }
.checkout-field__input:focus { box-shadow: none; }
</style>
