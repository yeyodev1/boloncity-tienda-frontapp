<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'
import { FAILURE_LABELS, FAILURE_STATUSES, PICKER_STEPS } from './constants'

const props = defineProps<{ order: OrderDTO; statusFlash: boolean; retrying: boolean; showRetryButton: boolean }>()
const emit = defineEmits<{ retry: [] }>()
const status = computed(() => props.order.picker?.currentStatus || '')
const hasBooking = computed(() => !!props.order.picker?.bookingId)
const isFailure = computed(() => FAILURE_STATUSES.includes(status.value))
const currentIndex = computed(() => isFailure.value ? -2 : PICKER_STEPS.findIndex((step) => step.key === status.value))
const currentStep = computed(() => PICKER_STEPS.find((step) => step.key === status.value))
const label = computed(() => props.order.picker?.statusText || currentStep.value?.label || 'Actualizando delivery')

function formatTime(iso: string) { return new Date(iso).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }) }
function statusTime(key: string) {
  const entry = [...(props.order.audit || [])].reverse().find((item) => item.toValue === key)
  return entry ? formatTime(entry.timestamp) : ''
}
</script>

<template>
  <template v-if="hasBooking">
    <section class="track-card">
      <div class="track-card__live" :class="{ flash: statusFlash }">
        <span class="track-card__live-icon"><i :class="['fa-solid', currentStep?.icon || 'fa-truck-fast']" /></span>
        <div><span><i class="fa-solid fa-circle" /> Delivery en vivo</span><strong>{{ label }}</strong></div>
        <small>Actualizado</small>
      </div>
      <div class="track-card__steps">
        <div v-for="(step, index) in PICKER_STEPS" :key="step.key" class="track-step" :class="{ active: currentIndex >= index, current: currentIndex === index }">
          <span><i v-if="currentIndex > index" class="fa-solid fa-check" /><i v-else :class="['fa-solid', step.icon]" /></span>
          <div><strong>{{ step.label }}</strong><small v-if="currentIndex === index">{{ statusTime(step.key) }}</small></div>
        </div>
        <div v-if="isFailure" class="track-step failure active"><span><i class="fa-solid fa-triangle-exclamation" /></span><div><strong>{{ FAILURE_LABELS[status] || status }}</strong></div></div>
      </div>
    </section>

    <section v-if="order.picker?.driverName" class="driver-card">
      <span class="driver-card__avatar"><img v-if="order.picker.driverPhoto" :src="order.picker.driverPhoto" alt="Motorizado" /><i v-else class="fa-solid fa-motorcycle" /></span>
      <div><strong>{{ order.picker.driverName }}</strong><span>{{ order.picker.driverVehicle || 'Tu motorizado' }}</span><a v-if="order.picker.driverPhone" :href="`tel:${order.picker.driverPhone}`"><i class="fa-solid fa-phone" /> {{ order.picker.driverPhone }}</a></div>
      <a v-if="order.picker.smrURL" :href="order.picker.smrURL" target="_blank" rel="noopener noreferrer"><i class="fa-solid fa-location-crosshairs" /></a>
    </section>

    <section v-if="order.picker?.validationCode && status === 'ARRIVED_AT_DELIVERY'" class="delivery-code"><span>Código de entrega</span><strong>{{ order.picker.validationCode }}</strong><p>Compártelo con el motorizado para completar la entrega.</p></section>
    <a v-if="order.picker?.proofOfDelivery" :href="order.picker.proofOfDelivery" target="_blank" rel="noopener noreferrer" class="proof-link"><i class="fa-solid fa-camera" /> Ver comprobante de entrega</a>
  </template>

  <section v-else-if="order.status !== 'pending'" class="track-card track-card--waiting">
    <p v-if="showRetryButton"><i class="fa-solid fa-triangle-exclamation" /> No pudimos asignar un delivery automáticamente.</p>
    <p v-else><i class="fa-solid fa-spinner fa-spin" /> Solicitando delivery...</p>
    <button v-if="showRetryButton" :disabled="retrying" @click="emit('retry')"><i class="fa-solid fa-truck-fast" /> {{ retrying ? 'Solicitando...' : 'Solicitar delivery ahora' }}</button>
  </section>
</template>

<style scoped lang="scss">
.track-card { background: rgba(255,255,255,.85); border: 1px solid rgba(35,89,49,.08); border-radius: 18px; overflow: hidden; }
.track-card__live { align-items: center; background: linear-gradient(120deg,#102719,#235931); color:#fff; display:flex; gap:.7rem; padding:.85rem 1rem; transition:.3s; }
.track-card__live.flash { box-shadow: inset 0 0 0 3px #efd537; transform:scale(1.01); }
.track-card__live-icon { align-items:center; background:#efd537; border-radius:12px; color:#102719; display:flex; flex:0 0 40px; height:40px; justify-content:center; }
.track-card__live > div { display:flex; flex:1 1 0; flex-direction:column; gap:.1rem; min-width:0; }
.track-card__live > div span { color:rgba(255,255,255,.65); font-size:.65rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }
.track-card__live > div span i { color:#efd537; font-size:.42rem; }
.track-card__live strong { font-size:.9rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.track-card__live > small { color:#efd537; font-size:.68rem; font-weight:800; }
.track-card__steps { padding:1rem 1.25rem; }
.track-step { align-items:center; color:rgba(8,17,13,.35); display:flex; gap:.85rem; min-height:48px; position:relative; }
.track-step:not(:last-child)::before { background:rgba(8,17,13,.08); content:''; height:16px; left:18px; position:absolute; top:39px; width:2px; }
.track-step.active { color:#235931; }
.track-step.active:not(:last-child)::before { background:#235931; }
.track-step > span { align-items:center; background:rgba(8,17,13,.08); border-radius:50%; display:flex; flex:0 0 38px; height:38px; justify-content:center; position:relative; width:38px; z-index:1; }
.track-step.active > span { background:#235931; color:#fff; }.track-step.current > span { animation:pulse 2s infinite; }.track-step.failure > span { background:#a02828; }
.track-step div { display:flex; flex-direction:column; }.track-step div strong { font-size:.9rem; }.track-step div small { color:rgba(8,17,13,.4); font-size:.72rem; }
.driver-card { align-items:center; background:#fff; border:1px solid rgba(35,89,49,.1); border-radius:18px; display:flex; gap:.85rem; padding:1rem; }
.driver-card__avatar { align-items:center; background:#235931; border-radius:50%; color:#fff; display:flex; flex:0 0 52px; height:52px; justify-content:center; overflow:hidden; }.driver-card__avatar img { height:100%; object-fit:cover; width:100%; }
.driver-card > div { display:flex; flex:1 1 0; flex-direction:column; gap:.1rem; }.driver-card > div strong { font-size:.95rem; }.driver-card > div span { color:rgba(8,17,13,.5); font-size:.8rem; }.driver-card > div a { color:#235931; font-size:.82rem; font-weight:700; text-decoration:none; }
.driver-card > a { align-items:center; background:#235931; border-radius:50%; color:#fff; display:flex; flex:0 0 44px; height:44px; justify-content:center; text-decoration:none; }
.delivery-code { background:linear-gradient(135deg,#efd537,#f5e06b); border-radius:18px; color:#102719; padding:1rem; text-align:center; }.delivery-code span { display:block; font-size:.7rem; font-weight:800; letter-spacing:.1em; text-transform:uppercase; }.delivery-code strong { display:block; font-size:2rem; letter-spacing:.08em; }.delivery-code p { font-size:.78rem; margin:0; }
.track-card--waiting { padding:1.25rem; text-align:center; }.track-card--waiting p { color:rgba(8,17,13,.6); margin:0; }.track-card--waiting button { background:#efd537; border-radius:12px; color:#102719; font-weight:800; margin-top:.8rem; min-height:44px; padding:.6rem 1rem; }
.proof-link { background:rgba(35,89,49,.06); border-radius:12px; color:#235931; display:block; font-size:.82rem; font-weight:800; padding:.75rem; text-align:center; text-decoration:none; }
@keyframes pulse { 0%,100% { box-shadow:0 0 0 5px rgba(35,89,49,.1); } 50% { box-shadow:0 0 0 12px rgba(35,89,49,.04); } }
</style>
