<script setup lang="ts">
import { computed } from 'vue'
import type { OrderDTO } from '@/services/OrderService'

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
  <article class="panel items-card">
    <div class="card-head">
      <span class="card-head__icon card-head__icon--green"><i class="fa-solid fa-basket-shopping" /></span>
      <div>
        <p class="card-head__eyebrow">Contenido</p>
        <h2>Productos</h2>
      </div>
      <span class="card-head__pill">{{ itemCount }} item{{ itemCount === 1 ? '' : 's' }}</span>
    </div>

    <div class="item-list">
      <article v-for="item in order.items || []" :key="`${item.name}-${item.quantity}`" class="item-row">
        <div class="item-row__info">
          <img v-if="item.image" :src="item.image" :alt="item.name" />
          <i v-else class="fa-solid fa-utensils" />
          <div>
            <strong>{{ item.name }}</strong>
            <p>Cantidad: {{ item.quantity }}</p>
          </div>
        </div>
        <span>{{ formatDollars(item.price * item.quantity) }}</span>
      </article>
    </div>

    <div class="cost-breakdown">
      <div><span>Subtotal</span><strong>{{ formatCurrency(order.subtotal) }}</strong></div>
      <div v-if="order.tax"><span>IVA incluido</span><strong>{{ formatCurrency(order.tax) }}</strong></div>
      <div v-if="order.deliveryType === 'delivery'">
        <span>Envío cobrado al cliente{{ order.deliveryDistance ? ` · ${order.deliveryDistance.toFixed(1)} km` : '' }}</span>
        <strong>{{ formatCurrency(order.deliveryCost || 0) }}</strong>
      </div>
      <div v-if="order.picker?.deliveryFee" class="cost-breakdown__picker">
        <span><i class="fa-solid fa-motorcycle" /> Tarifa Picker (costo real del delivery)</span>
        <strong>{{ formatDollars(order.picker.deliveryFee) }}</strong>
      </div>
      <div v-if="order.discount"><span>Descuento por puntos ({{ order.pointsRedeemed }} pts)</span><strong>-{{ formatCurrency(order.discount) }}</strong></div>
      <div class="cost-breakdown__total"><span>Total cobrado</span><strong>{{ formatCurrency(order.total) }}</strong></div>
    </div>
  </article>
</template>

<style scoped lang="scss">
@use './order-detail-cards' as *;

.items-card { flex: 1 1 420px; padding: 1.1rem; }

.item-list { display: flex; flex-direction: column; gap: 0.6rem; }

.item-row {
  align-items: center;
  background: $bg-light;
  border: 1px solid rgba($text-dark, 0.08);
  border-radius: 14px;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.8rem 0.95rem;
}

.item-row > span { font-weight: 800; white-space: nowrap; }
.item-row p { color: rgba($text-dark, 0.6); font-size: 0.82rem; }

.item-row__info { align-items: center; display: flex; gap: 0.7rem; min-width: 0; }
.item-row__info strong { display: block; font-weight: 800; }
.item-row__info > img,
.item-row__info > i {
  align-items: center;
  background: rgba(35, 89, 49, 0.1);
  border-radius: 10px;
  color: #235931;
  display: flex;
  flex: 0 0 42px;
  height: 42px;
  justify-content: center;
  object-fit: cover;
  width: 42px;
}

.cost-breakdown {
  border-top: 1px solid rgba($text-dark, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  margin-top: 1rem;
  padding-top: 0.9rem;
}

.cost-breakdown > div { align-items: center; display: flex; font-size: 0.88rem; gap: 0.75rem; justify-content: space-between; }
.cost-breakdown span { color: rgba($text-dark, 0.62); }
.cost-breakdown strong { font-weight: 800; }
.cost-breakdown__picker { background: rgba(35, 89, 49, 0.06); border-radius: 10px; padding: 0.45rem 0.65rem; }
.cost-breakdown__picker span { color: #235931; font-weight: 700; }
.cost-breakdown__picker i { margin-right: 0.3rem; }
.cost-breakdown__total { border-top: 1px dashed rgba($text-dark, 0.15); font-size: 1rem; margin-top: 0.3rem; padding-top: 0.6rem; }
.cost-breakdown__total span { color: $text-dark; font-weight: 800; }
.cost-breakdown__total strong { color: #235931; font-size: 1.2rem; }
</style>
