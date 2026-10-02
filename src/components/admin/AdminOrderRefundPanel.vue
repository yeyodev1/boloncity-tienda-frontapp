<script setup lang="ts">
import { computed, ref } from 'vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import { useToast } from '@/composables/useToast'
import { useUserStore } from '@/stores/user'

const props = defineProps<{ order: OrderDTO }>()
const emit = defineEmits<{ (e: 'refunded', order: OrderDTO): void }>()

const { success, error } = useToast()
// Devolver el dinero es privilegio de administración general, igual que cancelar.
const userStore = useUserStore()
const canOperateRefund = computed(() => userStore.accountType === 'admin' || userStore.allBranches)
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
  () => canOperateRefund.value && windowState.value.open && refund.value?.status !== 'refunded' && refund.value?.status !== 'processing'
)

// Cancelar un pedido NO reversa el cobro: si sigue cobrado hay que devolverlo a mano.
const cancelledButCharged = computed(
  () => props.order.status === 'cancelled' && isCard.value && isPaid.value && refund.value?.status !== 'refunded'
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
  <article class="od-card refund-card">
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

    <dl class="od-facts">
      <div><dt>Monto</dt><dd>{{ formatCurrency(order.total) }}</dd></div>
      <div v-if="order.payphone?.cardBrand || order.payphone?.lastDigits">
        <dt>Tarjeta</dt>
        <dd>{{ order.payphone?.cardBrand || 'Tarjeta' }} ••{{ order.payphone?.lastDigits || '' }}</dd>
      </div>
      <div v-if="order.payphone?.transactionId"><dt>Transacción PayPhone</dt><dd>{{ order.payphone.transactionId }}</dd></div>
      <div v-if="order.payphone?.confirmedAt"><dt>Cobrado</dt><dd>{{ formatDate(order.payphone.confirmedAt) }}</dd></div>
      <div v-if="order.payphone?.mode === 'test'"><dt>Modo</dt><dd>Pruebas (no cobra de verdad)</dd></div>
    </dl>

    <p v-if="refund?.status === 'refunded'" class="refund-note refund-note--ok">
      <i class="fa-solid fa-circle-check" />
      Devuelto {{ formatDate(refund.refundedAt) }} por {{ refund.requestedByEmail || 'un administrador' }}<template v-if="refund.reason">: {{ refund.reason }}</template>
    </p>

    <p v-else-if="refund?.status === 'failed'" class="refund-note refund-note--bad">
      <i class="fa-solid fa-triangle-exclamation" />
      PayPhone rechazó el reverso: {{ refund.errorMessage || 'sin detalle' }}<template v-if="refund.errorCode"> (código {{ refund.errorCode }})</template>
    </p>

    <p v-if="cancelledButCharged" class="pay-warning">
      <i class="fa-solid fa-triangle-exclamation" />
      <span><strong>Pedido cancelado con el cobro vigente.</strong> Cancelar no anula el pago con tarjeta:
        para devolver el dinero usa el botón de devolución de esta tarjeta.</span>
    </p>

    <template v-if="isCard && isPaid && refund?.status !== 'refunded'">
      <p v-if="!canOperateRefund" class="refund-note refund-note--muted">
        <i class="fa-solid fa-lock" /> Solo administración general puede devolver el pago de un pedido.
      </p>
      <p v-else-if="!windowState.open" class="refund-note refund-note--muted">
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

.refund-badge {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.7rem;
  font-weight: 800;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  white-space: nowrap;
}

.refund-badge--paid { background: var(--admin-success-soft); color: var(--admin-success); }
.refund-badge--cash { background: var(--admin-warning-soft); color: var(--admin-warning); }
.refund-badge--unpaid,
.refund-badge--failed { background: var(--admin-danger-soft); color: var(--admin-danger); }
.refund-badge--processing { background: var(--admin-warning-soft); color: var(--admin-warning); }
.refund-badge--refunded { background: var(--admin-hover); color: var(--admin-muted); }

.pay-warning,
.pay-info {
  align-items: flex-start;
  border-radius: 12px;
  display: flex;
  font-size: 0.84rem;
  gap: 0.55rem;
  line-height: 1.45;
  margin: 0;
  padding: 0.75rem 0.85rem;

  i { margin-top: 0.18rem; }
}

.pay-warning { background: var(--admin-danger-soft); border: 1px solid color-mix(in srgb, var(--admin-danger) 35%, transparent); color: var(--admin-danger); }
.pay-info { background: var(--admin-warning-soft); color: var(--admin-text); i { color: var(--admin-warning); } }

.refund-note {
  align-items: flex-start;
  border-radius: 12px;
  display: flex;
  font-size: 0.8rem;
  gap: 0.45rem;
  line-height: 1.45;
  margin: 0;
  padding: 0.6rem 0.75rem;
}

.refund-note--ok { background: var(--admin-success-soft); color: var(--admin-success); }
.refund-note--bad { background: var(--admin-danger-soft); color: var(--admin-danger); }
.refund-note--muted { background: var(--admin-hover); color: var(--admin-muted); }

.refund-actions { display: flex; flex-direction: column; gap: 0.5rem; }
.refund-hint { color: var(--admin-muted); font-size: 0.74rem; line-height: 1.4; margin: 0; }

.refund-trigger {
  align-items: center;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--admin-danger) 40%, transparent);
  border-radius: 12px;
  color: var(--admin-danger);
  display: flex;
  font-size: 0.78rem;
  font-weight: 800;
  gap: 0.45rem;
  justify-content: center;
  min-height: 44px;
  padding: 0.6rem 1rem;
  transition: background 0.2s ease;

  &:hover:not(:disabled) { background: var(--admin-danger-soft); }
  &:disabled { opacity: 0.5; }
}

.refund-confirm {
  background: var(--admin-danger-soft);
  border: 1px solid color-mix(in srgb, var(--admin-danger) 30%, transparent);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.85rem;
}

.refund-confirm__warning { align-items: flex-start; color: var(--admin-danger); display: flex; font-size: 0.8rem; gap: 0.45rem; line-height: 1.45; margin: 0; }

.refund-reason {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  span { color: var(--admin-danger); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; }

  input {
    background: var(--admin-input-bg);
    border: 1px solid var(--admin-line-strong);
    border-radius: 10px;
    color: var(--admin-text);
    min-height: 44px;
    padding: 0.55rem 0.7rem;
    width: 100%;
  }
}

.refund-confirm__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  button { border-radius: 12px; font-size: 0.78rem; font-weight: 800; min-height: 44px; padding: 0.6rem 1rem; }
  .ghost { background: var(--admin-surface); border: 1px solid var(--admin-line-strong); color: var(--admin-text); }
  .danger { background: var(--admin-danger); color: var(--admin-on-accent); }
  .danger:disabled { opacity: 0.55; }
}

@media (min-width: 640px) {
  .refund-confirm__actions { flex-direction: row; justify-content: flex-end; }
  .refund-confirm__actions button { flex: 0 0 auto; min-width: 160px; }
}
</style>
