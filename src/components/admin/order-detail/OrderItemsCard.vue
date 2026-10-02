<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'
import { displayProductName } from '@/utils/productName'

const props = defineProps<{ order: OrderDTO }>()

const itemCount = computed(() => props.order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0)

function formatCurrency(cents: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

// items[].price y picker.deliveryFee vienen en dólares (no en centavos como subtotal/total).
function formatDollars(amount: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount)
}
</script>

<template>
  <article class="od-card items">
    <div class="card-head">
      <span class="card-head__icon card-head__icon--green" aria-hidden="true"><i class="fa-solid fa-basket-shopping" /></span>
      <div>
        <p class="card-head__eyebrow">Qué pidió</p>
        <h2>Productos</h2>
      </div>
      <span class="card-head__pill">{{ itemCount }} {{ itemCount === 1 ? 'unidad' : 'unidades' }}</span>
    </div>

    <ul class="items__list">
      <li v-for="(item, index) in order.items || []" :key="`${item.name}-${index}`" class="items__row">
        <span class="items__qty">{{ item.quantity }}×</span>
        <img v-if="item.image" :src="item.image" :alt="displayProductName(item.name)" loading="lazy" />
        <span v-else class="items__ph" aria-hidden="true"><i class="fa-solid fa-utensils" /></span>
        <strong class="items__name">{{ displayProductName(item.name) }}</strong>
        <span class="items__price">{{ formatDollars(item.price * item.quantity) }}</span>
      </li>
    </ul>

    <dl class="od-facts items__totals">
      <div><dt>Subtotal</dt><dd>{{ formatCurrency(order.subtotal) }}</dd></div>
      <div v-if="order.tax"><dt>IVA incluido</dt><dd>{{ formatCurrency(order.tax) }}</dd></div>
      <div v-if="order.deliveryType === 'delivery'">
        <dt>Envío al cliente{{ order.deliveryDistance ? ` · ${order.deliveryDistance.toFixed(1)} km` : '' }}</dt>
        <dd>{{ formatCurrency(order.deliveryCost || 0) }}</dd>
      </div>
      <div v-if="order.picker?.deliveryFee" class="items__picker">
        <dt><i class="fa-solid fa-motorcycle" aria-hidden="true" /> Lo que cobra Picker</dt>
        <dd>{{ formatDollars(order.picker.deliveryFee) }}</dd>
      </div>
      <div v-if="order.promo?.amount" class="items__minus"><dt>{{ order.promo.label || `Promo ${order.promo.percent}%` }}</dt><dd>-{{ formatCurrency(order.promo.amount) }}</dd></div>
      <div v-if="order.discount" class="items__minus"><dt>Puntos canjeados ({{ order.pointsRedeemed }} pts)</dt><dd>-{{ formatCurrency(order.discount) }}</dd></div>
    </dl>

    <div class="items__total">
      <span>Total</span>
      <strong>{{ formatCurrency(order.total) }}</strong>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use './order-detail-cards' as *;

.items__list { display: flex; flex-direction: column; gap: 0.5rem; list-style: none; margin: 0; padding: 0; }

.items__row {
  align-items: center;
  display: flex;
  gap: 0.65rem;

  img, .items__ph {
    background: var(--admin-surface-2);
    border-radius: 10px;
    flex: 0 0 40px;
    height: 40px;
    object-fit: cover;
    width: 40px;
  }
}

.items__ph { align-items: center; color: var(--admin-subtle); display: flex; justify-content: center; }

.items__qty {
  color: var(--admin-accent);
  flex: 0 0 2rem;
  font-size: 0.9rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.items__name { flex: 1 1 auto; font-size: 0.88rem; line-height: 1.3; min-width: 0; }
.items__price { font-size: 0.88rem; font-variant-numeric: tabular-nums; font-weight: 700; white-space: nowrap; }

.items__totals { border-top: 1px dashed var(--admin-line-strong); padding-top: 0.75rem; }
.items__picker dt, .items__picker dd { color: var(--admin-info); }
.items__minus dd { color: var(--admin-danger); }

.items__total {
  align-items: center;
  background: var(--admin-accent-soft);
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
  padding: 0.65rem 0.85rem;

  span { font-weight: 800; }
  strong { color: var(--admin-accent); font-size: 1.25rem; font-variant-numeric: tabular-nums; }
}
</style>
