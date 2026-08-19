<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'

const props = defineProps<{ order: OrderDTO }>()

const hasBilling = computed(() => {
  const billing = props.order.billing
  return Boolean(billing && (billing.docNumber || billing.name || billing.address))
})
</script>

<template>
  <article class="panel billing-card">
    <div class="card-head">
      <span class="card-head__icon card-head__icon--yellow"><i class="fa-solid fa-file-invoice" /></span>
      <div>
        <p class="card-head__eyebrow">Facturación</p>
        <h2>{{ hasBilling ? 'Datos de factura' : 'Consumidor final' }}</h2>
      </div>
      <span v-if="hasBilling" class="card-head__pill card-head__pill--yellow"><i class="fa-solid fa-file-invoice" /> Pidió factura</span>
    </div>

    <div v-if="hasBilling" class="billing-fields">
      <div><span>Documento</span><strong>{{ (order.billing?.docType || 'documento').toUpperCase() }} · {{ order.billing?.docNumber || '—' }}</strong></div>
      <div><span>Nombre / Razón social</span><strong>{{ order.billing?.name || '—' }}</strong></div>
      <div><span>Email para la factura</span><strong>{{ order.billing?.email || order.customerEmail }}</strong></div>
      <div><span>Dirección</span><strong>{{ order.billing?.address || '—' }}</strong></div>
    </div>
    <p v-else class="billing-empty">El cliente no pidió factura con datos: se factura como consumidor final.</p>
  </article>
</template>

<style scoped lang="scss">
@use './order-detail-cards' as *;

.billing-card {
  background: #fffdf3;
  border: 1px solid rgba(239, 213, 55, 0.45);
  flex: 1 1 420px;
  padding: 1.1rem;
}

.billing-fields { display: flex; flex-direction: column; gap: 0.75rem; }
.billing-fields > div { display: flex; flex-direction: column; gap: 0.15rem; }
.billing-fields span { color: rgba($text-dark, 0.55); font-size: 0.7rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; }
.billing-fields strong { font-size: 0.95rem; font-weight: 800; overflow-wrap: anywhere; }

.billing-empty { color: rgba($text-dark, 0.66); font-size: 0.9rem; }

@media (min-width: 768px) {
  .billing-fields { flex-direction: row; flex-wrap: wrap; }
  .billing-fields > div { flex: 1 1 40%; }
}
</style>
