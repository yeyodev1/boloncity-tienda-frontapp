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
  display: grid;
  min-height: 100vh;
}

.cart-page__main {
  display: grid;
  gap: 1.25rem;
  margin: 0 auto;
  max-width: 1400px;
  width: 100%;
}

.cart-hero,
.cart-layout {
  margin: 0 1.25rem;
}

.cart-hero {
  align-items: end;
  display: flex;
  justify-content: space-between;
  padding: 1.5rem;
}

.cart-hero__eyebrow,
.cart-summary__eyebrow {
  @include eyebrow;
  color: #00a523;
  margin-bottom: 0.5rem;
}

.cart-hero h1 {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.95;
  text-transform: uppercase;
}

.cart-hero a {
  color: #235931;
  font-weight: 700;
}

.cart-layout {
  display: grid;
  gap: 1.25rem;
}

.cart-items,
.cart-summary {
  padding: 1.25rem;
}

.cart-items {
  display: grid;
  gap: 0.9rem;
}

.cart-empty {
  display: grid;
  gap: 0.75rem;
  justify-items: center;
  padding: 2.5rem 1rem;
  text-align: center;
}

.cart-empty__mark {
  color: rgba(35, 89, 49, 0.2);
  font-size: 3rem;
}

.cart-item {
  align-items: center;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 18px;
  display: grid;
  gap: 1rem;
  grid-template-columns: 80px minmax(0, 1fr) auto auto;
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
  min-width: 0;
}

.cart-item__name {
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
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
  display: grid;
  gap: 0.4rem;
  justify-items: end;
}

.cart-item__remove {
  background: transparent;
  color: rgba(160, 40, 40, 0.82);
  font-weight: 700;
}

.cart-summary {
  display: grid;
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
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
  }

  .cart-summary {
    position: sticky;
    top: 6rem;
  }
}

@media (max-width: 760px) {
  .cart-hero {
    align-items: start;
    flex-direction: column;
  }

  .cart-item {
    grid-template-columns: 80px minmax(0, 1fr);
  }

  .cart-item__controls,
  .cart-item__total {
    grid-column: 2 / -1;
    justify-self: start;
  }
}
</style>
