<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'

const props = defineProps<{ order: OrderDTO }>()
const pickerStatus = computed(() => props.order.picker?.statusText || props.order.picker?.currentStatus || 'Esperando actualización de Picker')
const statusIcon = computed(() => ({ WAY_TO_DELIVER: 'fa-truck-fast', ARRIVED_AT_DELIVERY: 'fa-location-dot', COMPLETED: 'fa-circle-check', ACCEPTED: 'fa-motorcycle', READY_FOR_PICKUP: 'fa-magnifying-glass', ON_HOLD: 'fa-clock' }[props.order.picker?.currentStatus || ''] || 'fa-motorcycle'))
</script>
<template>
  <article v-if="order.deliveryType === 'delivery'" class="delivery-panel panel">
    <header><div class="delivery-panel__icon"><i :class="['fa-solid', statusIcon]" /></div><div><p>Entrega con Picker</p><h2>{{ pickerStatus }}</h2></div><a v-if="order.picker?.smrURL" :href="order.picker.smrURL" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-location-crosshairs" /> Seguir entrega</a></header>
    <div v-if="order.picker?.driverName" class="driver"><span><img v-if="order.picker.driverPhoto" :src="order.picker.driverPhoto" alt="Motorizado" /><i v-else class="fa-solid fa-motorcycle" /></span><div><strong>{{ order.picker.driverName }}</strong><small>{{ order.picker.driverVehicle || 'Motorizado asignado' }}</small></div><a v-if="order.picker.driverPhone" :href="`tel:${order.picker.driverPhone}`"><i class="fa-solid fa-phone" /> Llamar motorizado</a></div>
    <div class="delivery-panel__details"><span><i class="fa-solid fa-location-dot" /> {{ order.deliveryAddress || 'Dirección por confirmar' }}</span><span v-if="order.deliveryDistance"><i class="fa-solid fa-road" /> {{ order.deliveryDistance }} km</span></div>
  </article>
</template>
<style scoped lang="scss">
.delivery-panel { padding:1rem; }.delivery-panel header,.driver,.delivery-panel__details { align-items:center; display:flex; gap:.7rem; }.delivery-panel header { flex-wrap:wrap; }.delivery-panel__icon,.driver > span { align-items:center; background:rgba(35,89,49,.1); border-radius:12px; color:#235931; display:flex; flex:0 0 42px; height:42px; justify-content:center; overflow:hidden; width:42px; }.driver > span { border-radius:50%; }.driver > span img { height:100%; object-fit:cover; width:100%; }.delivery-panel header > div:nth-child(2),.driver > div { display:flex; flex:1; flex-direction:column; min-width:0; }.delivery-panel p { color:#235931; font-size:.68rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }.delivery-panel h2 { font-size:1rem; margin-top:.15rem; }.delivery-panel header > a,.driver > a { background:#235931; border-radius:999px; color:#fff; font-size:.75rem; font-weight:800; padding:.55rem .7rem; text-decoration:none; }.driver { border-top:1px solid rgba(8,17,13,.08); margin-top:.9rem; padding-top:.9rem; }.driver small,.delivery-panel__details { color:var(--admin-muted); font-size:.76rem; }.delivery-panel__details { align-items:flex-start; flex-direction:column; margin-top:.85rem; }
</style>
