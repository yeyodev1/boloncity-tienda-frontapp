<script setup lang="ts">
import type { OrderDTO } from '@/services/OrderService'

defineProps<{ order: OrderDTO }>()

const auditLabels: Record<string, string> = {
  created: 'Pedido recibido', payment_confirmed: 'Pago confirmado', status_change: 'Estado actualizado',
  note_added: 'Nota agregada', user_assigned: 'Usuario asignado', branch_assigned: 'Sucursal asignada',
  refund_requested: 'Devolución solicitada', refunded: 'Pago devuelto', refund_failed: 'Devolución rechazada',
}
</script>

<template>
  <article class="panel audit-card">
    <div class="card-head">
      <span class="card-head__icon"><i class="fa-solid fa-clock-rotate-left" /></span>
      <div>
        <p class="card-head__eyebrow">Trazabilidad</p>
        <h2>Auditoría</h2>
      </div>
    </div>

    <div v-if="order.audit?.length" class="audit">
      <div v-for="entry in order.audit || []" :key="`${entry.action}-${entry.timestamp}`" class="audit-item" :class="`audit-item--${entry.action}`">
        <div class="audit-item__head">
          <strong>{{ auditLabels[entry.action] || 'Actualización' }}</strong>
          <small>{{ entry.performedByEmail || 'system' }} · {{ new Date(entry.timestamp).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' }) }}</small>
        </div>
        <p v-if="entry.fromValue || entry.toValue">{{ entry.fromValue || '—' }} → {{ entry.toValue || '—' }}</p>
        <p v-if="entry.details">{{ entry.details }}</p>
      </div>
    </div>
    <p v-else class="audit-empty">Sin auditoría registrada.</p>
  </article>
</template>

<style scoped lang="scss">
@use './order-detail-cards' as *;

.audit-card { flex: 1 1 420px; padding: 1.1rem; }

.audit { display: flex; flex-direction: column; gap: 0.6rem; }

.audit-item {
  background: $bg-light;
  border: 1px solid rgba($text-dark, 0.08);
  border-left: 4px solid rgba($text-dark, 0.18);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.85rem 1rem;
}

.audit-item p { color: rgba($text-dark, 0.66); font-size: 0.86rem; line-height: 1.5; }

.audit-item__head { display: flex; flex-direction: column; gap: 0.15rem; }
.audit-item__head strong { font-weight: 800; }
.audit-item__head small { color: rgba($text-dark, 0.55); font-size: 0.76rem; }

.audit-item--created { border-left-color: #235931; }
.audit-item--payment_confirmed { border-left-color: #00a523; }
.audit-item--status_change { border-left-color: #0066cc; }
.audit-item--note_added { border-left-color: #efd537; }
.audit-item--refund_requested,
.audit-item--refund_failed { border-left-color: #a52323; }
.audit-item--refunded { border-left-color: #6a4e05; }

.audit-empty { color: rgba($text-dark, 0.66); font-size: 0.9rem; }
</style>
