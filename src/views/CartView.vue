<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import { useCartStore } from '@/stores/cart'

const cart = useCartStore()
cart.hydrate()

const hasItems = computed(() => cart.items.length > 0)
</script>

<template>
  <div class="cart-page">
    <StoreHeader />

    <main class="cart-page__main">
      <section class="cart-hero panel">
        <div>
          <p class="cart-hero__eyebrow">Carrito</p>
          <h1>Tu selección</h1>
        </div>
        <RouterLink to="/catalogo">Seguir comprando</RouterLink>
      </section>

      <section class="cart-layout">
        <div class="panel cart-items">
          <div v-if="!hasItems" class="cart-empty">
            <p class="cart-empty__mark">○</p>
            <h2>Tu carrito está vacío</h2>
            <p class="muted">Agrega productos desde el catálogo para continuar.</p>
            <RouterLink class="btn-primary" to="/catalogo">Ver catálogo</RouterLink>
          </div>

          <article v-for="item in cart.items" :key="item.productId" class="cart-item">
            <button class="cart-item__thumb" type="button">
              <img :src="item.image || ''" :alt="item.name" />
            </button>

            <div class="cart-item__copy">
              <p class="cart-item__name">{{ item.name }}</p>
              <p class="cart-item__price">${{ item.price.toFixed(2) }}</p>
            </div>

            <div class="cart-item__controls">
              <button class="cart-item__qty-btn" type="button" @click="cart.decrement(item.productId)">−</button>
              <span>{{ item.quantity }}</span>
              <button class="cart-item__qty-btn" type="button" @click="cart.increment(item.productId)">+</button>
            </div>

            <div class="cart-item__total">
              <strong>${{ (item.price * item.quantity).toFixed(2) }}</strong>
              <button class="cart-item__remove" type="button" @click="cart.removeItem(item.productId)">Quitar</button>
            </div>
          </article>
        </div>

        <aside v-if="hasItems" class="panel cart-summary">
          <p class="cart-summary__eyebrow">Resumen</p>
          <div class="cart-summary__row">
            <span>Subtotal</span>
            <strong>${{ cart.subtotal.toFixed(2) }}</strong>
          </div>
          <div class="cart-summary__row muted">
            <span>Envío</span>
            <strong>Por confirmar</strong>
          </div>
          <RouterLink class="btn-primary cart-summary__cta" to="/checkout">Ir a pagar</RouterLink>
        </aside>
      </section>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.cart-page {
  background:
    radial-gradient(circle at 10% 0%, rgba(239, 213, 55, 0.16), transparent 34%),
    linear-gradient(180deg, #f8f6ec 0%, #f4f4f0 48%, #fff 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.cart-page__main {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  gap: clamp(1rem, 3vw, 1.5rem);
  margin: 0 auto;
  max-width: 1400px;
  padding: clamp(1.25rem, 4vw, 2.5rem) 1rem 0;
  width: 100%;
}

.cart-hero,
.cart-layout {
  margin: 0;
}

.cart-hero {
  align-items: flex-start;
  background:
    linear-gradient(135deg, rgba(35, 89, 49, 0.96), rgba(12, 34, 18, 0.94)),
    radial-gradient(circle at 90% 15%, rgba(239, 213, 55, 0.25), transparent 28%);
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 28px;
  box-shadow: 0 22px 54px rgba(26, 26, 26, 0.08);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: clamp(1.15rem, 4vw, 2rem);
}

.cart-hero__eyebrow,
.cart-summary__eyebrow {
  @include eyebrow;
  color: #00a523;
  margin-bottom: 0.5rem;
}

.cart-hero__eyebrow {
  color: #efd537;
}

.cart-hero h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.95;
  text-transform: uppercase;
}

.cart-hero a {
  @include pill-button(rgba(255, 255, 255, 0.12), #fff);
  border-color: rgba(255, 255, 255, 0.14);
  font-weight: 700;
}

.cart-layout {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.cart-items,
.cart-summary {
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 28px;
  box-shadow: 0 22px 54px rgba(26, 26, 26, 0.08);
  padding: clamp(1rem, 3vw, 1.35rem);
}

.cart-items {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.cart-empty {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 2.5rem 1rem;
  text-align: center;
}

.cart-empty__mark {
  color: rgba(35, 89, 49, 0.2);
  font-size: 3rem;
}

.cart-item {
  align-items: flex-start;
  background: #fff;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.85rem;
}

.cart-item__thumb {
  border: 0;
  border-radius: 16px;
  height: 80px;
  overflow: hidden;
  padding: 0;
  width: 80px;

  img {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
}

.cart-item__copy {
  flex: 1 1 calc(100% - 96px);
  min-width: 0;
}

.cart-item__name {
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
  overflow-wrap: anywhere;
}

.cart-item__price {
  color: rgba(26, 26, 26, 0.65);
  margin-top: 0.35rem;
}

.cart-item__controls {
  align-items: center;
  background: rgba(35, 89, 49, 0.06);
  border-radius: 999px;
  display: inline-flex;
  gap: 0.75rem;
  justify-content: center;
  padding: 0.35rem 0.65rem;
}

.cart-item__qty-btn {
  align-items: center;
  background: rgba(255, 255, 255, 0.78);
  border: 0;
  border-radius: 999px;
  display: inline-flex;
  height: 34px;
  justify-content: center;
  width: 34px;
}

.cart-item__total {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cart-item__remove {
  background: transparent;
  color: rgba(160, 40, 40, 0.82);
  font-weight: 700;
}

.cart-summary {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-summary__row {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.cart-summary__cta {
  width: 100%;
}

@media (min-width: 980px) {
  .cart-layout {
    align-items: start;
    flex-direction: row;
  }

  .cart-items {
    flex: 1 1 0;
  }

  .cart-summary {
    flex: 0 0 320px;
  }

  .cart-summary {
    position: sticky;
    top: 7rem;
  }
}

@media (min-width: 761px) {
  .cart-hero {
    align-items: flex-end;
    flex-direction: row;
  }

  .cart-item {
    align-items: center;
    flex-wrap: nowrap;
  }

  .cart-item__copy {
    flex: 1 1 0;
  }

  .cart-item__total {
    align-items: flex-end;
  }
}
</style>
