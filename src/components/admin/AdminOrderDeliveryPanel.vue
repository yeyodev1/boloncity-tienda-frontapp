<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'
import { absoluteTime } from './order-detail/orderStory'

/**
 * Entrega del pedido: retiro o delivery, sucursal, dirección, lo programado y el estado de Picker con el motorizado.
 * El botón "Buscar conductor" lo ejecuta la vista (emite `start-search`).
 */
const props = defineProps<{ order: OrderDTO; startingSearch?: boolean }>()
const emit = defineEmits<{ 'start-search': [] }>()

const isDelivery = computed(() => props.order.deliveryType === 'delivery')
const pickerStatus = computed(() => props.order.picker?.statusText || props.order.picker?.currentStatus || '')
const statusIcon = computed(() => ({ WAY_TO_DELIVER: 'fa-truck-fast', ARRIVED_AT_DELIVERY: 'fa-location-dot', COMPLETED: 'fa-circle-check', ACCEPTED: 'fa-motorcycle', READY_FOR_PICKUP: 'fa-magnifying-glass', ON_HOLD: 'fa-clock' }[props.order.picker?.currentStatus || ''] || 'fa-motorcycle'))
const mapsUrl = computed(() => props.order.deliveryGoogleMapsUrl || (props.order.deliveryAddress ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.order.deliveryAddress)}` : ''))
const canSearch = computed(() => props.order.picker?.searchState === 'on_hold' || props.order.picker?.searchState === 'failed')
</script>

<template>
  <article class="od-card delivery">
    <div class="card-head">
      <span class="card-head__icon card-head__icon--blue" aria-hidden="true"><i :class="['fa-solid', isDelivery ? 'fa-motorcycle' : 'fa-bag-shopping']" /></span>
      <div>
        <p class="card-head__eyebrow">Entrega</p>
        <h2>{{ isDelivery ? 'Delivery a domicilio' : 'Retiro en el local' }}</h2>
      </div>
      <span class="card-head__pill"><i class="fa-solid fa-store" aria-hidden="true" /> {{ order.branch?.name || 'Sin sucursal' }}</span>
    </div>

    <div v-if="order.scheduledFor" class="delivery__scheduled">
      <i class="fa-solid fa-calendar-check" aria-hidden="true" />
      <div>
        <strong>Programado para {{ absoluteTime(order.scheduledFor) }}</strong>
        <small v-if="isDelivery && !canSearch">{{ order.picker?.searchState === 'started' ? 'Ya se está buscando motorizado' : 'El motorizado se pide al pasar a «Por recoger»' }}</small>
      </div>
      <button v-if="canSearch" type="button" :disabled="startingSearch" @click="emit('start-search')">
        <i class="fa-solid fa-motorcycle" aria-hidden="true" /> {{ startingSearch ? 'Buscando…' : 'Buscar conductor' }}
      </button>
    </div>
    <p v-if="order.picker?.searchError" class="od-note od-note--danger"><i class="fa-solid fa-circle-exclamation" aria-hidden="true" /> {{ order.picker.searchError }}</p>

    <a v-if="isDelivery" class="delivery__address" :href="mapsUrl || undefined" target="_blank" rel="noopener">
      <i class="fa-solid fa-location-dot" aria-hidden="true" />
      <span>
        <strong>{{ order.deliveryAddress || 'Dirección por confirmar' }}</strong>
        <small>{{ order.deliveryDistance ? `${Number(order.deliveryDistance).toFixed(1)} km del local · ` : '' }}{{ mapsUrl ? 'Ver en el mapa' : '' }}</small>
      </span>
      <i v-if="mapsUrl" class="fa-solid fa-arrow-up-right-from-square delivery__go" aria-hidden="true" />
    </a>

    <template v-if="isDelivery">
      <div class="delivery__picker">
        <span class="delivery__picker-icon" aria-hidden="true"><i :class="['fa-solid', statusIcon]" /></span>
        <div>
          <small>Picker</small>
          <strong>{{ pickerStatus || (order.picker?.bookingId ? 'Esperando actualización' : 'Todavía sin motorizado') }}</strong>
        </div>
        <a v-if="order.picker?.smrURL" :href="order.picker.smrURL" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-location-crosshairs" aria-hidden="true" /> Seguir</a>
      </div>

      <div v-if="order.picker?.driverName" class="delivery__driver">
        <span class="delivery__driver-photo">
          <img v-if="order.picker.driverPhoto" :src="order.picker.driverPhoto" alt="" />
          <i v-else class="fa-solid fa-motorcycle" aria-hidden="true" />
        </span>
        <div>
          <strong>{{ order.picker.driverName }}</strong>
          <small>{{ order.picker.driverVehicle || 'Motorizado asignado' }}</small>
        </div>
        <a v-if="order.picker.driverPhone" :href="`tel:${order.picker.driverPhone}`" aria-label="Llamar al motorizado"><i class="fa-solid fa-phone" aria-hidden="true" /> Llamar</a>
      </div>
    </template>
  </article>
</template>

<style scoped lang="scss">
@use './order-detail/order-detail-cards' as *;

.delivery__scheduled {
  align-items: center;
  background: var(--admin-warning-soft);
  border-radius: 12px;
  color: var(--admin-text);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  padding: 0.7rem 0.8rem;

  > i { color: var(--admin-warning); }
  > div { display: flex; flex: 1 1 160px; flex-direction: column; min-width: 0; }
  strong { font-size: 0.86rem; }
  small { color: var(--admin-muted); font-size: 0.74rem; }

  button {
    align-items: center;
    background: var(--admin-accent);
    border-radius: 999px;
    color: var(--admin-on-accent);
    display: inline-flex;
    font-size: 0.78rem;
    font-weight: 800;
    gap: 0.4rem;
    min-height: 38px;
    padding: 0.4rem 0.9rem;

    &:disabled { cursor: wait; opacity: 0.6; }
  }
}

.delivery__address {
  align-items: center;
  border: 1px solid var(--admin-line);
  border-radius: 12px;
  color: var(--admin-text);
  display: flex;
  gap: 0.65rem;
  padding: 0.7rem 0.8rem;
  text-decoration: none;
  transition: background 0.2s ease;

  &[href]:hover { background: var(--admin-hover); }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
  > i:first-child { color: var(--admin-danger); }
  > span { display: flex; flex: 1 1 auto; flex-direction: column; min-width: 0; }
  strong { font-size: 0.86rem; line-height: 1.35; overflow-wrap: anywhere; }
  small { color: var(--admin-muted); font-size: 0.74rem; }
}

.delivery__go { color: var(--admin-subtle); font-size: 0.72rem; }

.delivery__picker,
.delivery__driver {
  align-items: center;
  display: flex;
  gap: 0.65rem;

  > div { display: flex; flex: 1 1 auto; flex-direction: column; min-width: 0; }
  small { color: var(--admin-muted); font-size: 0.72rem; }
  strong { font-size: 0.88rem; }

  > a {
    align-items: center;
    background: var(--admin-accent);
    border-radius: 999px;
    color: var(--admin-on-accent);
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 0.76rem;
    font-weight: 800;
    gap: 0.35rem;
    padding: 0.45rem 0.8rem;
    text-decoration: none;
  }
}

.delivery__picker-icon,
.delivery__driver-photo {
  align-items: center;
  background: var(--admin-info-soft);
  border-radius: 12px;
  color: var(--admin-info);
  display: flex;
  flex: 0 0 38px;
  height: 38px;
  justify-content: center;
  overflow: hidden;
}

.delivery__driver { border-top: 1px solid var(--admin-line); padding-top: 0.8rem; }
.delivery__driver-photo { border-radius: 50%; img { height: 100%; object-fit: cover; width: 100%; } }
</style>
