<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

defineProps<{
  deliveryType: 'delivery' | 'pickup'
  deliveryCost: number
  deliveryDistance: number
  total: number
  /** Promo global vigente: descuento sobre productos, nunca sobre el envío. */
  promoLabel?: string
  promoDiscount?: number
  /** IVA vigente en porcentaje; los precios del catálogo ya lo incluyen. */
  ivaRate?: number
  pricesIncludeIva?: boolean
}>()

const cart = useCartStore()
</script>

<template>
  <aside class="checkout-summary panel">
    <header class="checkout-summary__header">
      <span class="checkout-summary__icon"><i class="fa-solid fa-receipt" /></span>
      <div><p class="checkout-summary__eyebrow">Resumen</p><h2>Tu orden</h2></div>
    </header>

    <div class="checkout-summary__type">
      <i :class="deliveryType === 'delivery' ? 'fa-solid fa-motorcycle' : 'fa-solid fa-store'" />
      <span>{{ deliveryType === 'delivery' ? 'Delivery a domicilio' : 'Recoger en sucursal' }}</span>
    </div>

    <div class="checkout-summary__items">
      <article v-for="item in cart.items" :key="item.productId" class="checkout-summary__item">
        <div class="checkout-summary__media">
          <img v-if="item.image" :src="item.image" :alt="item.name" loading="lazy" />
          <span v-else><i class="fa-solid fa-utensils" /></span>
        </div>
        <div class="checkout-summary__copy">
          <strong>{{ item.name }}</strong>
          <span class="checkout-summary__qty">x{{ item.quantity }}</span>
        </div>
        <strong class="checkout-summary__price">${{ (item.price * item.quantity).toFixed(2) }}</strong>
      </article>
    </div>

    <div class="checkout-summary__lines">
      <div class="checkout-summary__line">
        <span><i class="fa-solid fa-bag-shopping" /> Subtotal</span>
        <strong>${{ cart.subtotal.toFixed(2) }}</strong>
      </div>
      <div v-if="promoDiscount" class="checkout-summary__line checkout-summary__line--promo">
        <span><i class="fa-solid fa-tag" /> {{ promoLabel || 'Promoción' }}</span>
        <strong>-${{ promoDiscount.toFixed(2) }}</strong>
      </div>
    </div>

    <div v-if="deliveryCost > 0 && deliveryType === 'delivery'" class="checkout-summary__delivery">
      <i class="fa-solid fa-motorcycle" />
      <div class="checkout-summary__delivery-copy">
        <strong>Envío</strong>
        <span>{{ deliveryDistance }} km</span>
      </div>
      <strong class="checkout-summary__delivery-price">${{ deliveryCost.toFixed(2) }}</strong>
    </div>

    <div class="checkout-summary__total">
      <span>Total</span>
      <strong>${{ total.toFixed(2) }}</strong>
    </div>

    <p v-if="pricesIncludeIva !== false" class="checkout-summary__iva">
      <i class="fa-solid fa-receipt" /> Precios con IVA {{ ivaRate ?? 15 }}% incluido
    </p>

    <RouterLink class="checkout-summary__link" to="/carrito">
      <i class="fa-solid fa-arrow-left" /> Volver al carrito
    </RouterLink>

    <p class="checkout-summary__secure"><i class="fa-solid fa-lock" /> Compra protegida y datos seguros</p>
  </aside>
</template>

<style scoped lang="scss">
.checkout-summary__line--promo span,
.checkout-summary__line--promo strong { color: #a52323; }

.checkout-summary {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(28, 22, 12, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: clamp(1rem, 3vw, 1.5rem);
}

.checkout-summary__header { align-items: center; display: flex; gap: 0.85rem; padding-bottom: 0.5rem; }

.checkout-summary__icon {
  align-items: center;
  background: #235931;
  border-radius: 16px;
  color: #efd537;
  display: flex;
  flex: 0 0 48px;
  height: 48px;
  justify-content: center;
}

.checkout-summary__eyebrow { color: #00a523; font-size: 0.7rem; margin-bottom: 0.15rem; }
.checkout-summary__header h2 { font-size: 1.25rem; letter-spacing: -0.03em; }

.checkout-summary__type {
  align-items: center;
  background: rgba(35, 89, 49, 0.04);
  border-radius: 12px;
  color: #235931;
  display: flex;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 0.5rem;
  padding: 0.65rem 0.8rem;
}

.checkout-summary__items { display: flex; flex-direction: column; gap: 0.25rem; }

.checkout-summary__item {
  align-items: center;
  border-bottom: 1px solid rgba(26, 26, 26, 0.06);
  display: flex;
  gap: 0.75rem;
  padding: 0.6rem 0;
}

.checkout-summary__item:first-child { padding-top: 0; }
.checkout-summary__item:last-child { border-bottom: 0; padding-bottom: 0; }

.checkout-summary__media {
  background: linear-gradient(145deg, #eef1e6, #dfe8d9);
  border-radius: 12px;
  flex: 0 0 52px;
  height: 52px;
  overflow: hidden;
}

.checkout-summary__media img { height: 100%; object-fit: cover; width: 100%; }
.checkout-summary__media > span { align-items: center; color: #235931; display: flex; font-size: 1.1rem; height: 100%; justify-content: center; }
.checkout-summary__copy { flex: 1 1 0; min-width: 0; }
.checkout-summary__copy strong { display: block; font-size: 0.9rem; font-weight: 800; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.checkout-summary__qty { color: rgba(26, 26, 26, 0.5); font-size: 0.75rem; font-weight: 600; margin-top: 0.15rem; }
.checkout-summary__price { color: #235931; flex: 0 0 auto; font-size: 0.9rem; }

.checkout-summary__lines {
  border-bottom: 1px solid rgba(26, 26, 26, 0.08);
  border-top: 1px solid rgba(26, 26, 26, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  padding: 0.85rem 0;
}

.checkout-summary__line { align-items: center; display: flex; justify-content: space-between; }
.checkout-summary__line span { align-items: center; color: rgba(26, 26, 26, 0.6); display: flex; gap: 0.4rem; font-size: 0.9rem; }
.checkout-summary__line span i { color: #235931; font-size: 0.8rem; opacity: 0.7; }
.checkout-summary__line strong { font-size: 0.95rem; }

.checkout-summary__delivery {
  align-items: center;
  background: #f7f3dc;
  border: 1px solid rgba(239, 213, 55, 0.34);
  border-radius: 18px;
  display: flex;
  gap: 0.75rem;
  padding: 0.85rem 0.9rem;
}

.checkout-summary__delivery > i { color: #235931; font-size: 1.1rem; flex: 0 0 auto; }
.checkout-summary__delivery-copy { flex: 1 1 0; }
.checkout-summary__delivery-copy strong { display: block; font-size: 0.9rem; }
.checkout-summary__delivery-copy span { color: rgba(26, 26, 26, 0.55); font-size: 0.75rem; margin-top: 0.15rem; }
.checkout-summary__delivery-price { color: #235931; font-size: 0.95rem; }

.checkout-summary__iva { align-items: center; color: rgba(26, 26, 26, 0.5); display: flex; font-size: 0.74rem; font-weight: 700; gap: 0.35rem; margin-top: 0.4rem; }
.checkout-summary__iva i { color: #235931; }
.checkout-summary__total { align-items: center; display: flex; justify-content: space-between; }
.checkout-summary__total span { color: rgba(26, 26, 26, 0.6); font-size: 1rem; font-weight: 700; }
.checkout-summary__total strong { color: #235931; font-size: 1.6rem; }

.checkout-summary__link {
  align-items: center;
  background: rgba(26, 26, 26, 0.06);
  border-radius: 999px;
  color: var(--text);
  display: flex;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 50px;
  transition: background-color 0.2s ease;
  width: 100%;
}

.checkout-summary__link:hover { background: rgba(35, 89, 49, 0.08); }

.checkout-summary__secure { color: rgba(26, 26, 26, 0.5); font-size: 0.76rem; text-align: center; }
.checkout-summary__secure i { color: #00a523; margin-right: 0.3rem; }

@media (min-width: 980px) {
  .checkout-summary { flex: 0 0 360px; position: sticky; top: 6rem; }
}
</style>
