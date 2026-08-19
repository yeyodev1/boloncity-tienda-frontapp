<script setup lang="ts">
import { computed, ref } from 'vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ order: OrderDTO }>()
const emit = defineEmits<{ (e: 'refunded', order: OrderDTO): void }>()

const { success, error } = useToast()
const confirming = ref(false)
const reason = ref('')
const submitting = ref(false)

/** PayPhone solo acepta el reverso el mismo día del pago y hasta las 20:00 EC. */
const REFUND_CUTOFF_HOUR = 20

const refund = computed(() => props.order.payphone?.refund)
const isCard = computed(() => props.order.paymentMethod === 'card')
const isPaid = computed(() => Boolean(props.order.payphone?.confirmedAt))

// Estado de pago claro e inequívoco para el cajero.
const payState = computed(() => {
  if (refund.value?.status === 'refunded') return { key: 'refunded', icon: 'fa-rotate-left', label: 'Reversado' }
  if (refund.value?.status === 'processing') return { key: 'processing', icon: 'fa-spinner fa-spin', label: 'Reverso en curso' }
  if (refund.value?.status === 'failed') return { key: 'failed', icon: 'fa-triangle-exclamation', label: 'Reverso fallido' }
  if (!isCard.value) return { key: 'cash', icon: 'fa-money-bill-wave', label: 'Efectivo · cobra al entregar' }
  if (isPaid.value) return { key: 'paid', icon: 'fa-circle-check', label: 'Pagado con tarjeta' }
  return { key: 'unpaid', icon: 'fa-triangle-exclamation', label: 'SIN PAGO — no preparar' }
})

const windowState = computed(() => {
  if (!isCard.value) return { open: false, reason: 'Este pedido no se pagó con tarjeta.' }
  if (!isPaid.value) return { open: false, reason: 'El pedido no tiene un pago confirmado en PayPhone.' }

  const parts = (value: string | Date) =>
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Guayaquil',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    })
      .formatToParts(new Date(value))
      .reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {})

  const paid = parts(props.order.payphone!.confirmedAt!)
  const now = parts(new Date())

  if (`${paid.year}-${paid.month}-${paid.day}` !== `${now.year}-${now.month}-${now.day}`) {
    return { open: false, reason: 'El pago no es de hoy. La devolución se gestiona desde PayPhone Business.' }
  }
  if (Number(now.hour) >= REFUND_CUTOFF_HOUR) {
    return { open: false, reason: `Ya pasaron las ${REFUND_CUTOFF_HOUR}:00. La devolución se gestiona desde PayPhone Business.` }
  }
  return { open: true, reason: '' }
})

const canRefund = computed(
  () => windowState.value.open && refund.value?.status !== 'refunded' && refund.value?.status !== 'processing'
)

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount / 100)
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString('es-EC', { dateStyle: 'medium', timeStyle: 'short' }) : ''
}

function cancel() {
  confirming.value = false
  reason.value = ''
}

async function submit() {
  if (!reason.value.trim()) { error('Escribe el motivo de la devolución.'); return }
  try {
    submitting.value = true
    const response = await OrderService.refund(props.order._id, reason.value.trim())
    emit('refunded', response.data.order)
    success('PayPhone aprobó el reverso. El pedido quedó cancelado.')
    cancel()
  } catch (requestError: any) {
    error(requestError?.message || 'PayPhone rechazó el reverso.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <article class="panel refund-card">
    <div class="card-head">
      <span class="card-head__icon card-head__icon--green"><i class="fa-solid" :class="isCard ? 'fa-credit-card' : 'fa-money-bill-wave'" /></span>
      <div>
        <p class="card-head__eyebrow">Pago</p>
        <h2>{{ isCard ? 'Tarjeta vía PayPhone' : 'Efectivo' }}</h2>
      </div>
      <span class="refund-badge" :class="`refund-badge--${payState.key}`">
        <i class="fa-solid" :class="payState.icon" />
        {{ payState.label }}
      </span>
    </div>

    <p v-if="payState.key === 'unpaid'" class="pay-warning">
      <i class="fa-solid fa-triangle-exclamation" />
      <span><strong>Este pedido NO está pagado.</strong> El cliente no completó el pago con tarjeta. No lo prepares ni lo entregues hasta que el pago se confirme.</span>
    </p>
    <p v-else-if="payState.key === 'cash'" class="pay-info">
      <i class="fa-solid fa-money-bill-wave" />
      <span>Se paga en <strong>efectivo al entregar</strong>. El motorizado cobra ${{ (order.total / 100).toFixed(2) }}.</span>
    </p>

    <div class="refund-facts">
      <div><span>Monto</span><strong>{{ formatCurrency(order.total) }}</strong></div>
      <div v-if="order.payphone?.cardBrand || order.payphone?.lastDigits">
        <span>Tarjeta</span>
        <strong>{{ order.payphone?.cardBrand || 'Tarjeta' }} ••{{ order.payphone?.lastDigits || '' }}</strong>
      </div>
      <div v-if="order.payphone?.transactionId"><span>Transacción</span><strong>{{ order.payphone.transactionId }}</strong></div>
      <div v-if="order.payphone?.confirmedAt"><span>Cobrado</span><strong>{{ formatDate(order.payphone.confirmedAt) }}</strong></div>
    </div>

    <p v-if="refund?.status === 'refunded'" class="refund-note refund-note--ok">
      <i class="fa-solid fa-circle-check" />
      Devuelto {{ formatDate(refund.refundedAt) }} por {{ refund.requestedByEmail || 'un administrador' }}<template v-if="refund.reason">: {{ refund.reason }}</template>
    </p>

    <p v-else-if="refund?.status === 'failed'" class="refund-note refund-note--bad">
      <i class="fa-solid fa-triangle-exclamation" />
      PayPhone rechazó el reverso: {{ refund.errorMessage || 'sin detalle' }}<template v-if="refund.errorCode"> (código {{ refund.errorCode }})</template>
    </p>

    <template v-if="isCard && isPaid && refund?.status !== 'refunded'">
      <p v-if="!windowState.open" class="refund-note refund-note--muted">
        <i class="fa-solid fa-clock" /> {{ windowState.reason }}
      </p>

      <div v-else-if="!confirming" class="refund-actions">
        <p class="refund-hint">El reverso es siempre por el total: PayPhone no admite devoluciones parciales.</p>
        <button type="button" class="refund-trigger" :disabled="!canRefund" @click="confirming = true">
          <i class="fa-solid fa-rotate-left" /> DEVOLVER {{ formatCurrency(order.total) }}
        </button>
      </div>

      <div v-else class="refund-confirm">
        <p class="refund-confirm__warning">
          <i class="fa-solid fa-triangle-exclamation" />
          Vas a devolver <strong>{{ formatCurrency(order.total) }}</strong> a la tarjeta del cliente y el pedido
          <strong>{{ order.orderNumber }}</strong> quedará cancelado. Esta acción no se puede deshacer.
        </p>
        <label class="refund-reason">
          <span>Motivo de la devolución</span>
          <input v-model="reason" placeholder="Ej: producto agotado, cliente canceló" :disabled="submitting" />
        </label>
        <div class="refund-confirm__actions">
          <button type="button" class="ghost" :disabled="submitting" @click="cancel">Cancelar</button>
          <button type="button" class="danger" :disabled="submitting || !reason.trim()" @click="submit">
            <i class="fa-solid fa-rotate-left" /> {{ submitting ? 'REVERSANDO...' : 'CONFIRMAR DEVOLUCIÓN' }}
          </button>
        </div>
      </div>
    </template>
  </article>
</template>

<style scoped lang="scss">
@use './order-detail/order-detail-cards' as *;

.refund-card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.1rem;
}

.refund-card .card-head { margin-bottom: 0; }

.refund-badge {
  align-items: center;
  border-radius: 999px;
  display: flex;
  flex: 0 0 auto;
  font-size: 0.7rem;
  font-weight: 900;
  gap: 0.35rem;
  letter-spacing: 0.04em;
  margin-left: auto;
  padding: 0.45rem 0.85rem;
  text-transform: uppercase;
}

.pay-warning {
  align-items: flex-start;
  background: rgba(165, 35, 35, 0.1);
  border: 1px solid rgba(165, 35, 35, 0.3);
  border-radius: 12px;
  color: #a02828;
  display: flex;
  font-size: 0.9rem;
  gap: 0.6rem;
  margin: 0 0 0.9rem;
  padding: 0.85rem 1rem;
}
.pay-warning i { margin-top: 0.15rem; }

.pay-info {
  align-items: center;
  background: rgba(239, 213, 55, 0.18);
  border-radius: 12px;
  color: #6a4e05;
  display: flex;
  font-size: 0.9rem;
  gap: 0.6rem;
  margin: 0 0 0.9rem;
  padding: 0.85rem 1rem;
}

.refund-badge--paid { background: rgba(0, 165, 35, 0.14); color: #14682a; }
.refund-badge--cash { background: rgba(239, 213, 55, 0.24); color: #6a4e05; }
.refund-badge--unpaid { background: rgba(165, 35, 35, 0.14); color: #a02828; }
.refund-badge--processing { background: rgba(239, 213, 55, 0.24); color: #7a6a06; }
.refund-badge--refunded { background: rgba(8, 17, 13, 0.08); color: rgba(8, 17, 13, 0.6); }
.refund-badge--failed { background: rgba(165, 35, 35, 0.12); color: #a52323; }

.refund-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.refund-facts > div {
  background: $bg-light;
  border: 1px solid rgba($text-dark, 0.07);
  border-radius: 12px;
  display: flex;
  flex: 1 1 44%;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  padding: 0.7rem 0.85rem;
}

.refund-facts span { color: rgba(8, 17, 13, 0.55); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }
.refund-facts strong { color: #152019; font-size: 0.92rem; }

.refund-note {
  align-items: flex-start;
  border-radius: 12px;
  display: flex;
  font-size: 0.8rem;
  gap: 0.45rem;
  line-height: 1.45;
  padding: 0.6rem 0.7rem;
}

.refund-note--ok { background: rgba(35, 89, 49, 0.08); color: #235931; }
.refund-note--bad { background: rgba(165, 35, 35, 0.1); color: #a52323; }
.refund-note--muted { background: rgba(8, 17, 13, 0.05); color: rgba(8, 17, 13, 0.6); }

.refund-actions {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.refund-hint { color: rgba(8, 17, 13, 0.55); font-size: 0.75rem; line-height: 1.4; }

.refund-trigger {
  align-items: center;
  border: 1px solid rgba(165, 35, 35, 0.35);
  border-radius: 12px;
  color: #a52323;
  display: flex;
  font-size: 0.76rem;
  font-weight: 900;
  gap: 0.45rem;
  justify-content: center;
  letter-spacing: 0.05em;
  min-height: 46px;
  padding: 0.7rem 1rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.refund-trigger:hover:not(:disabled) { background: rgba(165, 35, 35, 0.08); }
.refund-trigger:disabled { opacity: 0.5; }

.refund-confirm {
  background: rgba(165, 35, 35, 0.06);
  border: 1px solid rgba(165, 35, 35, 0.24);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.85rem;
}

.refund-confirm__warning {
  align-items: flex-start;
  color: #a52323;
  display: flex;
  font-size: 0.8rem;
  gap: 0.45rem;
  line-height: 1.45;
}

.refund-reason {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.refund-reason span { color: #a52323; font-size: 0.68rem; font-weight: 900; letter-spacing: 0.06em; text-transform: uppercase; }

.refund-reason input {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.14);
  border-radius: 10px;
  color: #152019;
  min-height: 44px;
  padding: 0.55rem 0.7rem;
  width: 100%;
}

.refund-confirm__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.refund-confirm__actions button {
  border-radius: 12px;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.05em;
  min-height: 46px;
  padding: 0.7rem 1rem;
}

.refund-confirm__actions .ghost { background: #fff; border: 1px solid rgba(8, 17, 13, 0.14); color: rgba(8, 17, 13, 0.65); }
.refund-confirm__actions .danger { background: #a52323; color: #fff; }
.refund-confirm__actions .danger:disabled { opacity: 0.55; }

@media (min-width: 640px) {
  .refund-confirm__actions { flex-direction: row; justify-content: flex-end; }
  .refund-confirm__actions button { flex: 0 0 auto; min-width: 160px; }
}
</style>
