<script setup lang="ts">
import type { OrderDTO } from '@/services/OrderService'

defineProps<{ order: OrderDTO }>()

function formatDate(iso: string) { return new Date(iso).toLocaleString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
</script>

<template>
  <div class="info-grid">
    <section class="info-card"><span><i class="fa-solid fa-receipt" /> Costos</span><div><p>Subtotal <strong>${{ (order.subtotal / 100).toFixed(2) }}</strong></p><p v-if="order.promo?.amount" class="promo">{{ order.promo.label || `Promo ${order.promo.percent}%` }} <strong>-${{ (order.promo.amount / 100).toFixed(2) }}</strong></p><p v-if="order.deliveryType === 'delivery'">Envío <strong>${{ ((order.deliveryCost || 0) / 100).toFixed(2) }}</strong></p><p class="total">Total <strong>${{ (order.total / 100).toFixed(2) }}</strong></p></div></section>

    <section v-if="order.items?.length" class="info-card"><span><i class="fa-solid fa-utensils" /> Productos</span><div class="products"><p v-for="item in order.items" :key="item.name"><i class="fa-solid fa-utensils" /><b>{{ item.name }}</b><small>x{{ item.quantity }}</small><strong>${{ (item.price * item.quantity).toFixed(2) }}</strong></p></div></section>

    <section class="info-card"><span><i class="fa-solid fa-truck" /> {{ order.deliveryType === 'delivery' ? 'Delivery' : 'Recoger en sucursal' }}</span><div v-if="order.deliveryType === 'delivery'"><p>Dirección <strong>{{ order.deliveryAddress || '—' }}</strong></p><p v-if="order.deliveryDistance">Distancia <strong>{{ order.deliveryDistance.toFixed(1) }} km</strong></p><a v-if="order.deliveryGoogleMapsUrl" :href="order.deliveryGoogleMapsUrl" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-map" /> Ver en Google Maps</a><a v-if="order.picker?.smrURL" :href="order.picker.smrURL" target="_blank" rel="noopener noreferrer" class="track"><i class="fa-solid fa-location-crosshairs" /> Seguir en vivo</a></div><div v-else><p>Pedido para recoger en sucursal.</p></div></section>

    <section v-if="order.picker" class="info-card highlight"><span><i class="fa-solid fa-location-dot" /> Delivery Picker</span><div><p>Booking <strong class="mono">{{ order.picker.bookingId }}</strong></p><p v-if="order.picker.bookingNumericId">Booking # <strong>{{ order.picker.bookingNumericId }}</strong></p><p v-if="order.picker.statusText">Estado <strong>{{ order.picker.statusText }}</strong></p><p v-if="order.picker.createdAt">Creado <strong>{{ formatDate(order.picker.createdAt) }}</strong></p></div></section>

    <section v-if="order.notes" class="info-card wide"><span><i class="fa-solid fa-pen" /> Notas del pedido</span><div><p>{{ order.notes }}</p></div></section>
    <section v-if="order.branch" class="info-card"><span><i class="fa-solid fa-store" /> Sucursal</span><div><p><strong>{{ (order.branch as any).name || order.branch }}</strong></p></div></section>
    <section class="info-card"><span><i class="fa-solid fa-user" /> Cliente</span><div><p>Nombre <strong>{{ order.customerName || '—' }}</strong></p><p>Email <strong>{{ order.customerEmail }}</strong></p><p v-if="order.customerPhone">Teléfono <strong>{{ order.customerPhone }}</strong></p></div></section>
  </div>
</template>

<style scoped lang="scss">
.info-grid { display:flex; flex-wrap:wrap; gap:.75rem; }.info-card { background:rgba(255,255,255,.85); border:1px solid rgba(35,89,49,.08); border-radius:18px; display:flex; flex:1 1 100%; flex-direction:column; min-width:0; overflow:hidden; }.info-card > span { align-items:center; border-bottom:1px solid rgba(35,89,49,.06); color:rgba(8,17,13,.5); display:flex; font-size:.7rem; font-weight:800; gap:.35rem; letter-spacing:.08em; padding:.75rem 1rem; text-transform:uppercase; }.info-card > span i { color:#235931; }.info-card > div { display:flex; flex-direction:column; gap:.45rem; padding:.85rem 1rem; }.info-card p { align-items:center; color:rgba(8,17,13,.6); display:flex; font-size:.85rem; gap:.6rem; justify-content:space-between; margin:0; }.info-card p strong { color:#08110d; font-size:.88rem; text-align:right; }.info-card p.promo,.info-card p.promo strong { color:#a52323; }.info-card p.total { border-top:1px solid rgba(35,89,49,.1); color:rgba(8,17,13,.8); font-weight:700; padding-top:.45rem; }.info-card p.total strong { color:#235931; font-size:1rem; }.info-card a { color:#235931; font-size:.82rem; font-weight:700; text-decoration:underline; }.info-card a.track { background:#235931; border-radius:12px; color:#fff; padding:.65rem .8rem; text-align:center; text-decoration:none; }.highlight { background:rgba(35,89,49,.04); border-color:rgba(35,89,49,.18); }.mono { font-family:monospace; font-size:.75rem !important; word-break:break-all; }.products p { border-bottom:1px solid rgba(8,17,13,.05); padding:.25rem 0; }.products p:last-child { border:0; }.products p i { color:#235931; }.products p b { color:#08110d; flex:1 1 0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.products p small { color:rgba(8,17,13,.45); }.products p strong { color:#235931; flex:0 0 auto; }@media (min-width:600px) { .info-card { flex:1 1 calc(50% - .75rem); min-width:16rem; }.info-card.wide { flex-basis:100%; } }
</style>
