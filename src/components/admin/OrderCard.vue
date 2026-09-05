<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'
import {
  formatOrderCurrency,
  getNextOrderStatus,
  getOrderItemCount,
  getOrderStatusLabel,
  orderStatusIcons,
  orderStatusLabels,
  type OrderStatus,
} from '@/composables/useOrdersBoard'

const props = defineProps<{
  order: OrderDTO
  status: OrderStatus
  driverLoading?: boolean
  /** Solo administración general cancela; el backend lo vuelve a validar. */
  canCancel?: boolean
}>()

const emit = defineEmits<{
  (event: 'open', orderId: string): void
  (event: 'advance', order: OrderDTO, status: OrderStatus): void
  (event: 'note', order: OrderDTO): void
  (event: 'driver', order: OrderDTO): void
  (event: 'print', order: OrderDTO): void
  (event: 'cancel', order: OrderDTO): void
}>()

const isDelivery = computed(() => props.order.deliveryType === 'delivery')
// Los delivery normalmente avanzan solos con el webhook de Picker, pero el cajero
// puede moverlos manualmente (queda auditado) si Picker no reporta.
// Un retiro en local salta «En reparto»: de «Listas para retiro» pasa directo a entregado.
const nextStatus = computed(() => getNextOrderStatus(props.status, props.order.deliveryType))
const statusLabel = computed(() => getOrderStatusLabel(props.status, props.order.deliveryType))
const nextStatusLabel = computed(() => nextStatus.value ? getOrderStatusLabel(nextStatus.value, props.order.deliveryType) : '')
// El texto del botón que cierra un retiro: «Entregado al cliente», no «mover a Retiradas».
const advanceLabel = computed(() =>
  props.order.deliveryType === 'pickup' && nextStatus.value === 'delivered'
    ? 'Entregado al cliente'
    : `Mover a ${nextStatusLabel.value}`)
const picker = computed(() => props.order.picker)
// Un pedido ya cancelado o ya entregado no se cancela: el botón no tiene por qué
// estar ahí ofreciendo algo que el backend va a rechazar.
const showCancel = computed(() =>
  props.canCancel && !['cancelled', 'delivered'].includes(props.order.status))
// El bloque de delivery solo se muestra cuando ya existe una reserva de Picker real.
// Los programados no la tienen hasta pasar a "Listas para recolección".
const hasPickerBooking = computed(() => Boolean(picker.value?.bookingId))
const deliveryStatus = computed(() => ({
  READY_FOR_PICKUP: 'Picker está buscando motorizado',
  ACCEPTED: 'Motorizado asignado',
  ARRIVED_AT_PICKUP: 'El motorizado llegó al local',
  WAY_TO_DELIVER: 'Tu delivery ya va en camino',
  ARRIVED_AT_DELIVERY: 'El motorizado llegó a destino',
  COMPLETED: 'Delivery entregado',
}[picker.value?.currentStatus || ''] || picker.value?.statusText || 'Preparando información de delivery'))
const deliveryIcon = computed(() => ({ WAY_TO_DELIVER: 'fa-truck-fast', ARRIVED_AT_DELIVERY: 'fa-location-dot', COMPLETED: 'fa-circle-check', ACCEPTED: 'fa-motorcycle', READY_FOR_PICKUP: 'fa-magnifying-glass' }[picker.value?.currentStatus || ''] || 'fa-motorcycle'))
const auditEntries = computed(() => [...(props.order.audit || [])].slice(-3).reverse())
// Estado de pago, claro para el cajero:
//  - Efectivo: se cobra al entregar (normal que esté "pendiente").
//  - Tarjeta pagada: PayPhone confirmó (hay transactionId).
//  - Tarjeta SIN pagar: no completó el pago — NO preparar hasta validar.
const payment = computed(() => {
  if (props.order.paymentMethod === 'cash') {
    return { tone: 'cash', icon: 'fa-money-bill-wave', label: 'Efectivo · cobrar al entregar' }
  }
  if (props.order.payphone?.transactionId) {
    return { tone: 'ok', icon: 'fa-circle-check', label: 'Pagado con tarjeta' }
  }
  return { tone: 'danger', icon: 'fa-triangle-exclamation', label: 'Tarjeta · pago NO confirmado' }
})
const auditLabels: Record<string, string> = { created: 'Pedido recibido', payment_confirmed: 'Pago confirmado', status_change: 'Estado actualizado', note_added: 'Nota agregada', user_assigned: 'Usuario asignado', branch_assigned: 'Sucursal asignada' }
function auditText(entry: NonNullable<OrderDTO['audit']>[number]) { return entry.details || (entry.toValue ? orderStatusLabels[entry.toValue as OrderStatus] || entry.toValue : auditLabels[entry.action] || 'Actualización') }
function auditTime(timestamp: string) { return new Date(timestamp).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) }
</script>

<template>
  <article class="order-card" :data-order-id="order._id">
    <button class="order-card__main" type="button" @click="emit('open', order._id)">
      <div class="order-card__top">
        <span class="order-card__drag-handle" title="Arrastra esta orden a otra columna" aria-label="Arrastrar orden"><i class="fa-solid fa-grip-vertical" /></span>
        <strong>{{ order.orderNumber }}</strong>
        <span class="status-pill"><i :class="['fa-solid', orderStatusIcons[status]]" /> {{ statusLabel }}</span>
      </div>

      <p class="order-card__customer">{{ order.customerName || order.customerEmail }}</p>

      <div class="order-card__meta">
        <span>{{ formatOrderCurrency(order.total) }}</span>
        <span>{{ getOrderItemCount(order) }} items</span>
        <span>{{ order.branch?.name || 'Sin sucursal' }}</span>
        <span v-if="isDelivery">Envío {{ formatOrderCurrency(order.deliveryCost || 0) }}</span>
        <span v-if="order.billing?.docNumber" class="order-card__billing"><i class="fa-solid fa-file-invoice" /> Factura</span>
      </div>

      <div class="order-card__payment" :class="payment.tone">
        <i :class="['fa-solid', payment.icon]" /><span>{{ payment.label }}</span>
      </div>
    </button>

    <div v-if="order.scheduledFor" class="order-card__scheduled">
      <i class="fa-solid fa-calendar-clock" />
      <span>
        <strong>PROGRAMADO</strong>
        para {{ new Date(order.scheduledFor).toLocaleString('es-EC', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
        <small>El motorizado se pide al mover el pedido a «Listas para recolección».</small>
      </span>
    </div>

    <section v-if="isDelivery && hasPickerBooking" class="order-card__delivery" :class="{ 'order-card__delivery--live': picker?.driverName }">
      <div class="order-card__delivery-head"><span><i class="fa-solid fa-motorcycle" /> Delivery Picker</span><strong><i :class="['fa-solid', deliveryIcon]" /> {{ deliveryStatus }}</strong></div>
      <div v-if="picker?.driverName" class="order-card__driver"><span class="order-card__driver-avatar"><img v-if="picker.driverPhoto" :src="picker.driverPhoto" alt="Motorizado" /><i v-else class="fa-solid fa-helmet-safety" /></span><div><strong>{{ picker.driverName }}</strong><small>{{ picker.driverVehicle || 'Motorizado asignado' }}</small></div><a v-if="picker.driverPhone" :href="`tel:${picker.driverPhone}`"><i class="fa-solid fa-phone" /> Llamar delivery</a></div>
      <div class="order-card__delivery-meta"><span v-if="picker?.deliveryFee"><i class="fa-solid fa-receipt" /> {{ formatOrderCurrency(Math.round(picker.deliveryFee * 100)) }}</span><span v-if="order.deliveryDistance"><i class="fa-solid fa-road" /> {{ order.deliveryDistance }} km</span><a v-if="picker?.smrURL" :href="picker.smrURL" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-location-crosshairs" /> Seguir</a></div>
      <small v-if="order.scheduledFor"><i class="fa-solid fa-calendar-clock" /> Programado: {{ new Date(order.scheduledFor).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) }}</small>
    </section>

    <section v-if="auditEntries.length" class="order-card__audit">
      <p><i class="fa-solid fa-clock-rotate-left" /> Últimos movimientos</p>
      <div v-for="entry in auditEntries" :key="`${entry.action}-${entry.timestamp}`"><span /><strong>{{ auditLabels[entry.action] || 'Actualización' }}</strong><small>{{ auditText(entry) }} · {{ auditTime(entry.timestamp) }}</small></div>
    </section>

    <div class="order-card__actions">
      <button type="button" class="ghost" @click="emit('open', order._id)"><i class="fa-solid fa-arrow-up-right-from-square" /> Detalle</button>
      <button type="button" class="ghost" @click="emit('note', order)"><i class="fa-solid fa-note-sticky" /> Nota</button>
      <button type="button" class="ghost" @click="emit('print', order)"><i class="fa-solid fa-print" /> Ticket</button>
      <button v-if="nextStatus && payment.tone !== 'danger'" type="button" :class="{ 'order-card__finish': order.deliveryType === 'pickup' && nextStatus === 'delivered' }" @click="emit('advance', order, nextStatus)">
        <i :class="['fa-solid', order.deliveryType === 'pickup' && nextStatus === 'delivered' ? 'fa-hand-holding-heart' : 'fa-arrow-right']" /> {{ advanceLabel }}
      </button>
      <span v-else-if="nextStatus && payment.tone === 'danger'" class="order-card__blocked">
        <i class="fa-solid fa-lock" /> No se puede preparar: sin pago
      </span>

      <!--
        Cancelar tenía que hacerse arrastrando la tarjeta hasta la columna
        «Canceladas», que no es algo que se adivine. Ahora es un botón con nombre.
        Va aparte y en rojo abajo del todo: la acción que no se deshace no comparte
        fila con «Nota» ni «Ticket».
      -->
      <button v-if="showCancel" type="button" class="order-card__cancel" @click.stop="emit('cancel', order)">
        <i class="fa-solid fa-ban" /> Cancelar orden
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
.order-card {
  background: #fbf8ef;
  border: 1px solid rgba(8, 17, 13, 0.08);
  border-radius: 20px;
  color: #18211b;
  overflow: hidden;
  transition: box-shadow .22s ease, transform .22s ease;
}

.order-card__scheduled {
  align-items: flex-start;
  background: #fff3d1;
  border-top: 1px solid rgba(180, 140, 10, 0.25);
  color: #6a4e05;
  display: flex;
  font-size: 0.82rem;
  gap: 0.55rem;
  padding: 0.7rem 1rem;

  i { color: #b8860b; margin-top: 0.15rem; }
  strong { color: #7a5a00; letter-spacing: 0.03em; }
  small { color: #8a6d1e; display: block; margin-top: 0.15rem; }
}

.order-card__main {
  background: transparent;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  text-align: left;
  width: 100%;
}

.order-card__top {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.order-card__top strong {
  flex: 1 1 auto;
  min-width: 0;
}

.order-card__drag-handle {
  color: rgba(24, 33, 27, 0.42);
  cursor: grab;
  font-weight: 900;
  align-items: center;
  border-radius: 8px;
  display: inline-flex;
  height: 32px;
  justify-content: center;
  line-height: 1;
}

.order-card__top strong {
  font-size: 1.02rem;
  font-weight: 800;
}

.status-pill {
  background: rgba(35, 89, 49, 0.1);
  border: 1px solid rgba(35, 89, 49, 0.16);
  border-radius: 999px;
  color: #235931;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 0.32rem 0.6rem;
  text-transform: uppercase;
}

.status-pill i { margin-right:.2rem; }

.order-card__customer {
  color: #18211b;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.order-card__meta {
  color: rgba(24, 33, 27, 0.66);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.82rem;
}

.order-card__meta span {
  background: rgba(35, 89, 49, 0.07);
  border-radius: 999px;
  padding: 0.35rem 0.6rem;
}

.order-card__meta .order-card__billing {
  background: rgba(239, 213, 55, 0.28);
  color: #6a4e05;
  font-weight: 800;
}

.order-card__payment {
  align-items: center;
  border-radius: 14px;
  display: flex;
  font-size: 0.82rem;
  font-weight: 700;
  gap: 0.5rem;
  padding: 0.75rem;
}

.order-card__payment.ok {
  background: rgba(35, 89, 49, 0.12);
  color: #235931;
}

.order-card__payment.cash {
  background: rgba(239, 213, 55, 0.22);
  color: #6a4e05;
}

.order-card__payment.danger {
  background: rgba(160, 40, 40, 0.12);
  color: #a02828;
}

.order-card__blocked {
  align-items: center;
  color: #a02828;
  display: flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 0.4rem;
  justify-content: center;
  padding: 0.5rem;
}

.order-card__actions {
  background: #f7f7f1;
  border-top: 1px solid rgba(8, 17, 13, 0.08);
  display: flex;
  flex-flow: row wrap;
  gap: 0.6rem;
  padding: 0.75rem;
}

.order-card__actions button {
  align-items: center;
  border: 0;
  border-radius: 12px;
  box-sizing: border-box;
  cursor: pointer;
  display: inline-flex;
  font-weight: 800;
  font-size: 0.82rem;
  justify-content: center;
  line-height: 1;
  white-space: nowrap;
  flex: 0 1 auto;
  height: 44px;
  min-height: 44px;
  padding: 0.65rem 0.85rem;
}

.order-card__actions button i { font-size: 0.85rem; margin-right: 0.1rem; }

.order-card__actions button:not(.ghost) {
  background: #235931;
  color: $white;
}

.order-card__actions button:not(.ghost):not(.driver-action) { flex: 1 1 100%; }

.order-card__actions .ghost {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.12);
  color: #18211b;
  flex: 1 1 0;
}

.order-card__delivery { background: rgba(35,89,49,.06); border-bottom: 1px solid rgba(35,89,49,.1); border-top: 1px solid rgba(35,89,49,.1); display: flex; flex-direction: column; gap: .65rem; padding: .8rem 1rem; }
.order-card__delivery--live { background: linear-gradient(135deg, rgba(35,89,49,.13), rgba(239,213,55,.13)); }.order-card__delivery-head { display:flex; flex-direction:column; gap:.18rem; }.order-card__delivery-head span { color:#235931; font-size:.66rem; font-weight:900; letter-spacing:.09em; text-transform:uppercase; }.order-card__delivery-head strong { font-size:.82rem; }.order-card__driver { align-items:center; display:flex; gap:.55rem; }.order-card__driver-avatar { align-items:center; background:#235931; border-radius:50%; color:#fff; display:flex; flex:0 0 34px; height:34px; justify-content:center; overflow:hidden; width:34px; }.order-card__driver-avatar img { height:100%; object-fit:cover; width:100%; }.order-card__driver > div { display:flex; flex:1; flex-direction:column; min-width:0; }.order-card__driver strong { font-size:.8rem; }.order-card__driver small,.order-card__delivery > small { color:rgba(24,33,27,.62); font-size:.7rem; }.order-card__driver a { align-items:center; background:#235931; border-radius:50%; color:#fff; display:flex; flex:0 0 34px; height:34px; justify-content:center; text-decoration:none; width:34px; }.order-card__delivery-meta { align-items:center; display:flex; flex-wrap:wrap; gap:.4rem; }.order-card__delivery-meta span,.order-card__delivery-meta a { background:#fff; border-radius:999px; color:#235931; font-size:.69rem; font-weight:800; padding:.3rem .45rem; text-decoration:none; }.order-card__delivery > small { line-height:1.35; }
.order-card__actions .driver-action { background:#efd537; color:#18211b; flex:1 1 100%; }
.order-card__actions .order-card__finish { background:#00a523; }

.order-card__actions .order-card__cancel {
  background: transparent;
  border: 1px solid rgba(165, 35, 35, 0.35);
  color: #a52323;
  flex: 1 1 100%;
  font-weight: 800;
}

.order-card__actions .order-card__cancel:hover {
  background: #a52323;
  border-color: #a52323;
  color: #fff;
}
.order-card__drag-handle:hover { background:rgba(35,89,49,.1); color:#235931; }.order-card__drag-handle:active { cursor:grabbing; }
.order-card__audit { background:#fff; border-top:1px solid rgba(8,17,13,.08); display:flex; flex-direction:column; gap:.45rem; padding:.75rem 1rem; }.order-card__audit > p { color:#235931; font-size:.66rem; font-weight:900; letter-spacing:.08em; margin:0; text-transform:uppercase; }.order-card__audit > div { align-items:baseline; display:flex; flex-wrap:wrap; gap:.35rem; padding-left:.7rem; position:relative; }.order-card__audit > div > span { background:#235931; border-radius:50%; height:5px; left:0; position:absolute; top:.35rem; width:5px; }.order-card__audit strong { font-size:.72rem; }.order-card__audit small { color:rgba(24,33,27,.58); flex:1 1 100%; font-size:.68rem; line-height:1.35; }

</style>
