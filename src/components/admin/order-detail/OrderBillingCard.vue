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
  <article class="od-card">
    <div class="card-head">
      <span class="card-head__icon card-head__icon--yellow" aria-hidden="true"><i class="fa-solid fa-file-invoice" /></span>
      <div>
        <p class="card-head__eyebrow">Facturación</p>
        <h2>{{ hasBilling ? 'Pidió factura' : 'Consumidor final' }}</h2>
      </div>
    </div>

    <dl v-if="hasBilling" class="od-facts">
      <div><dt>{{ (order.billing?.docType || 'Documento').toUpperCase() }}</dt><dd>{{ order.billing?.docNumber || '—' }}</dd></div>
      <div><dt>Nombre / razón social</dt><dd>{{ order.billing?.name || '—' }}</dd></div>
      <div><dt>Correo</dt><dd>{{ order.billing?.email || order.customerEmail }}</dd></div>
      <div v-if="order.billing?.address"><dt>Dirección</dt><dd>{{ order.billing.address }}</dd></div>
    </dl>
    <p v-else class="od-note od-note--muted"><i class="fa-solid fa-circle-info" aria-hidden="true" /> No pidió factura con datos.</p>
  </article>
</template>

<style scoped lang="scss">
@use './order-detail-cards' as *;
</style>
