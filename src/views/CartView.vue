<script setup lang="ts">
import { useCartTracking } from '@/composables/useCartTracking'
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import { useCartStore } from '@/stores/cart'
import { useConfirm } from '@/composables/useConfirm'
import { useSettingsStore } from '@/stores/settings'
import { displayProductName } from '@/utils/productName'

const cart = useCartStore()
const { confirm } = useConfirm()
cart.hydrate()

const brokenImages = ref(new Set<string>())
const hasItems = computed(() => cart.items.length > 0)
const itemLabel = computed(() => `${cart.count} ${cart.count === 1 ? 'producto' : 'productos'}`)
// Promo global: descuenta el subtotal de productos, nunca el envío.
const settings = useSettingsStore()
const promo = computed(() => settings.promo)
const promoDiscount = computed(() => settings.promoDiscountOn(cart.subtotal))
const cartTotal = computed(() => Math.max(0, cart.subtotal - promoDiscount.value))
const money = (value: number) => `$${value.toFixed(2)}`

function hasImage(item: { productId: string; image?: string }) {
  return Boolean(item.image) && !brokenImages.value.has(item.productId)
}

function markBroken(productId: string) {
  brokenImages.value = new Set(brokenImages.value).add(productId)
}

async function confirmRemove(itemName: string, productId: string) {
  const ok = await confirm({
    title: 'Quitar producto',
    message: `Quitamos "${displayProductName(itemName)}" de tu pedido?`,
    confirmText: 'Sí, quitar',
    type: 'danger',
  })
  if (!ok) return
  cart.removeItem(productId)
}

/** Con 1 unidad, restar es quitar: se pide confirmación en vez de borrar de golpe. */
function decrease(item: { productId: string; name: string; quantity: number }) {
  if (item.quantity <= 1) return confirmRemove(item.name, item.productId)
  cart.decrement(item.productId)
}

// Registra el carrito vivo para poder recuperarlo si el cliente se va sin comprar.
useCartTracking('cart')
</script>

<template>
  <div class="cart-page" :class="{ 'has-checkout-bar': hasItems }">
    <StoreHeader />

    <main class="cart-page__main">
      <header class="cart-head">
        <div>
          <p class="cart-head__eyebrow"><i class="fa-solid fa-bag-shopping" aria-hidden="true" /> Tu pedido</p>
          <h1>{{ hasItems ? 'Así va tu pedido' : 'Tu carrito está vacío' }}</h1>
          <p v-if="hasItems" class="cart-head__meta">{{ itemLabel }} · revisa cantidades y sigue al pago</p>
        </div>
        <RouterLink v-if="hasItems" class="cart-head__back" to="/catalogo">
          <i class="fa-solid fa-plus" aria-hidden="true" /> Agregar más
        </RouterLink>
      </header>

      <!-- Vacío -->
      <section v-if="!hasItems" class="cart-empty">
        <div class="cart-empty__plate" aria-hidden="true">
          <span><i class="fa-solid fa-utensils" /></span>
        </div>
        <h2>Todavía no hay nada aquí</h2>
        <p>Bolones, tigrillos y desayunos hechos al momento. Elige tus favoritos y vuelve para completar tu pedido.</p>
        <RouterLink class="cart-empty__cta" to="/catalogo">
          Ver el menú <i class="fa-solid fa-arrow-right" aria-hidden="true" />
        </RouterLink>
        <ul class="cart-empty__perks">
          <li><i class="fa-solid fa-fire-burner" aria-hidden="true" /> Hecho al momento</li>
          <li><i class="fa-solid fa-motorcycle" aria-hidden="true" /> Delivery o retiro en local</li>
          <li><i class="fa-solid fa-lock" aria-hidden="true" /> Pago seguro</li>
        </ul>
      </section>

      <!-- Con productos -->
      <section v-else class="cart-layout">
        <div class="cart-items">
          <TransitionGroup name="cart-list" tag="ul" class="cart-list">
            <li v-for="item in cart.items" :key="item.productId" class="cart-item">
              <RouterLink class="cart-item__media" :to="`/producto/${item.slug}`" :aria-label="`Ver ${displayProductName(item.name)}`">
                <img v-if="hasImage(item)" :src="item.image" :alt="displayProductName(item.name)" loading="lazy" @error="markBroken(item.productId)" />
                <span v-else class="cart-item__fallback" aria-hidden="true"><i class="fa-solid fa-utensils" /></span>
              </RouterLink>

              <div class="cart-item__body">
                <div class="cart-item__top">
                  <RouterLink class="cart-item__name" :to="`/producto/${item.slug}`">{{ displayProductName(item.name) }}</RouterLink>
                  <strong class="cart-item__line">{{ money(item.price * item.quantity) }}</strong>
                </div>
                <p class="cart-item__unit">{{ money(item.price) }} c/u</p>

                <div class="cart-item__controls">
                  <div class="cart-stepper" role="group" :aria-label="`Cantidad de ${displayProductName(item.name)}`">
                    <button
                      type="button"
                      :class="{ 'is-remove': item.quantity <= 1 }"
                      :aria-label="item.quantity <= 1 ? `Quitar ${displayProductName(item.name)}` : `Restar ${displayProductName(item.name)}`"
                      @click="decrease(item)"
                    >
                      <i :class="item.quantity <= 1 ? 'fa-solid fa-trash-can' : 'fa-solid fa-minus'" aria-hidden="true" />
                    </button>
                    <strong aria-live="polite">{{ item.quantity }}</strong>
                    <button type="button" :aria-label="`Sumar ${displayProductName(item.name)}`" @click="cart.increment(item.productId)">
                      <i class="fa-solid fa-plus" aria-hidden="true" />
                    </button>
                  </div>
                  <button v-if="item.quantity > 1" type="button" class="cart-item__remove" @click="confirmRemove(item.name, item.productId)">
                    Quitar
                  </button>
                </div>
              </div>
            </li>
          </TransitionGroup>

          <RouterLink class="cart-more" to="/catalogo">
            <span class="cart-more__icon" aria-hidden="true"><i class="fa-solid fa-mug-hot" /></span>
            <span>
              <strong>Te falta algo?</strong>
              <small>Un cafecito o un jugo acompañan perfecto</small>
            </span>
            <i class="fa-solid fa-chevron-right" aria-hidden="true" />
          </RouterLink>
        </div>

        <aside class="cart-summary" aria-label="Resumen del pedido">
          <h2>Resumen</h2>
          <dl class="cart-summary__lines">
            <div><dt>Productos ({{ cart.count }})</dt><dd>{{ money(cart.subtotal) }}</dd></div>
            <div v-if="promoDiscount > 0" class="is-promo">
              <dt><i class="fa-solid fa-tag" aria-hidden="true" /> {{ promo.label || `Promo ${promo.percent}%` }}</dt>
              <dd>-{{ money(promoDiscount) }}</dd>
            </div>
            <div class="is-muted"><dt><i class="fa-solid fa-motorcycle" aria-hidden="true" /> Envío</dt><dd>Se calcula con tu dirección</dd></div>
          </dl>

          <div class="cart-summary__total">
            <span>Total</span>
            <strong class="price-tag">{{ money(cartTotal) }}</strong>
          </div>

          <RouterLink class="cart-summary__cta" to="/checkout">
            Continuar al pago <i class="fa-solid fa-arrow-right" aria-hidden="true" />
          </RouterLink>

          <ul class="cart-summary__trust">
            <li><i class="fa-solid fa-lock" aria-hidden="true" /> Pago seguro con tarjeta o efectivo</li>
            <li><i class="fa-solid fa-store" aria-hidden="true" /> Delivery o retiro en tu local</li>
          </ul>
        </aside>
      </section>
    </main>

    <!-- Celular: el total y el botón de pago siempre a mano. -->
    <Transition name="checkout-bar">
      <div v-if="hasItems" class="checkout-bar">
        <div>
          <small>{{ itemLabel }}</small>
          <strong>{{ money(cartTotal) }}</strong>
        </div>
        <RouterLink to="/checkout">Continuar al pago <i class="fa-solid fa-arrow-right" aria-hidden="true" /></RouterLink>
      </div>
    </Transition>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.cart-page {
  --surface: #f7f5ec;
  --ink: #102719;
  --green: #235931;
  --yellow: #efd537;
  --muted: rgba(16, 39, 25, 0.58);
  --line: rgba(16, 39, 25, 0.08);

  background: var(--surface);
  color: var(--ink);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: clip;
}

.cart-page__main {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  gap: 1.25rem;
  margin: 0 auto;
  max-width: 1120px;
  padding: 5.5rem 1rem 3rem;
  width: 100%;
}

.has-checkout-bar .cart-page__main { padding-bottom: 7.5rem; }

/* ─── Encabezado ─── */
.cart-head {
  align-items: flex-end;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.cart-head__eyebrow {
  align-items: center;
  color: var(--green);
  display: flex;
  font-size: 0.7rem;
  font-weight: 800;
  gap: 0.4rem;
  letter-spacing: 0.16em;
  margin: 0 0 0.35rem;
  text-transform: uppercase;
}

.cart-head h1 {
  font-size: clamp(1.75rem, 6vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 1;
  margin: 0;
}

.cart-head__meta {
  color: var(--muted);
  font-size: 0.88rem;
  margin: 0.45rem 0 0;
}

.cart-head__back {
  align-items: center;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--green);
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.82rem;
  font-weight: 800;
  gap: 0.4rem;
  padding: 0.6rem 0.9rem;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover { background: var(--green); color: #fff; }
}

/* ─── Lista ─── */
.cart-layout {
  display: grid;
  gap: 1.25rem;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 0;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.cart-item {
  background: #fff;
  border: 1px solid rgba(16, 39, 25, 0.06);
  border-radius: 20px;
  box-shadow: 0 1px 2px rgba(16, 39, 25, 0.04), 0 10px 24px -16px rgba(16, 39, 25, 0.2);
  display: flex;
  gap: 0.85rem;
  padding: 0.7rem;
}

.cart-item__media {
  background: linear-gradient(145deg, #eef1e6, #e4ead9);
  border-radius: 14px;
  flex: 0 0 88px;
  height: 88px;
  overflow: hidden;

  img {
    display: block;
    height: 100%;
    object-fit: cover;
    transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
    width: 100%;
  }

  &:hover img { transform: scale(1.05); }
}

.cart-item__fallback {
  align-items: center;
  color: var(--green);
  display: flex;
  font-size: 1.4rem;
  height: 100%;
  justify-content: center;
  opacity: 0.6;
}

.cart-item__body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}

.cart-item__top {
  align-items: flex-start;
  display: flex;
  gap: 0.6rem;
  justify-content: space-between;
}

.cart-item__name {
  color: var(--ink);
  display: -webkit-box;
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: -0.015em;
  line-height: 1.2;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;

  &:hover { color: var(--green); }
}

.cart-item__line {
  font-size: 1rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.cart-item__unit {
  color: var(--muted);
  font-size: 0.78rem;
  margin: 0.2rem 0 0;
}

.cart-item__controls {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.5rem;
}

.cart-stepper {
  align-items: center;
  background: #f2f4ec;
  border-radius: 999px;
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.2rem;

  button {
    align-items: center;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 2px rgba(16, 39, 25, 0.1);
    color: var(--green);
    display: flex;
    font-size: 0.78rem;
    height: 34px;
    justify-content: center;
    transition: background 0.18s ease, color 0.18s ease, transform 0.12s ease;
    width: 34px;

    &:hover { background: var(--green); color: #fff; }
    &:active { transform: scale(0.92); }
    &.is-remove { color: #a02828; }
    &.is-remove:hover { background: #a02828; color: #fff; }
  }

  strong {
    font-variant-numeric: tabular-nums;
    min-width: 1.6rem;
    text-align: center;
  }
}

.cart-item__remove {
  background: none;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.3rem 0;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover { color: #a02828; }
}

/* "Te falta algo?" */
.cart-more {
  align-items: center;
  background: #fff8d6;
  border: 1px dashed rgba(16, 39, 25, 0.18);
  border-radius: 20px;
  color: var(--ink);
  display: flex;
  gap: 0.8rem;
  padding: 0.85rem 1rem;
  transition: background 0.2s ease;

  &:hover { background: #fff3b8; }

  > span:nth-child(2) { display: flex; flex: 1; flex-direction: column; }
  strong { font-size: 0.92rem; }
  small { color: var(--muted); font-size: 0.78rem; margin-top: 0.1rem; }
  > i { color: var(--green); font-size: 0.8rem; }
}

.cart-more__icon {
  align-items: center;
  background: var(--yellow);
  border-radius: 12px;
  color: var(--ink);
  display: flex;
  flex: 0 0 40px;
  height: 40px;
  justify-content: center;
  transform: rotate(-4deg);
}

/* ─── Resumen ─── */
.cart-summary {
  background: #fff;
  border: 1px solid rgba(16, 39, 25, 0.06);
  border-radius: 22px;
  box-shadow: 0 1px 2px rgba(16, 39, 25, 0.04), 0 18px 40px -22px rgba(16, 39, 25, 0.3);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;

  h2 {
    font-size: 1.15rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    margin: 0;
  }
}

.cart-summary__lines {
  border-bottom: 1px solid var(--line);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 0;
  padding-bottom: 1rem;

  div { display: flex; gap: 1rem; justify-content: space-between; }
  dt { color: var(--muted); font-size: 0.88rem; }
  dd { font-size: 0.9rem; font-variant-numeric: tabular-nums; font-weight: 700; margin: 0; text-align: right; }
  .is-promo dt, .is-promo dd { color: #a02828; }
  .is-muted dd { color: var(--muted); font-size: 0.8rem; font-weight: 600; }
  i { margin-right: 0.25rem; }
}

.cart-summary__total {
  align-items: center;
  display: flex;
  justify-content: space-between;

  > span { font-weight: 800; }
}

/* La misma etiqueta de precio del catálogo. */
.price-tag {
  background: var(--yellow);
  border-radius: 10px;
  box-shadow: 0 6px 14px -4px rgba(16, 39, 25, 0.35);
  color: var(--ink);
  font-size: 1.45rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  letter-spacing: -0.02em;
  padding: 0.3rem 0.7rem;
  transform: rotate(-2deg);
}

.cart-summary__cta,
.cart-empty__cta {
  align-items: center;
  background: var(--green);
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  font-weight: 800;
  gap: 0.55rem;
  justify-content: center;
  min-height: 52px;
  padding: 0.85rem 1.3rem;
  transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;

  &:hover { background: #1b4826; box-shadow: 0 12px 24px -12px rgba(35, 89, 49, 0.6); }
  &:active { transform: scale(0.98); }
}

.cart-summary__trust {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  list-style: none;
  margin: 0;
  padding: 0;

  li { color: var(--muted); font-size: 0.78rem; }
  i { color: var(--green); margin-right: 0.4rem; width: 1rem; }
}

/* ─── Barra fija (celular) ─── */
.checkout-bar {
  align-items: center;
  background: rgba(255, 255, 255, 0.96);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--line);
  bottom: 0;
  box-shadow: 0 -10px 30px -18px rgba(16, 39, 25, 0.4);
  display: flex;
  gap: 0.9rem;
  justify-content: space-between;
  left: 0;
  padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
  position: fixed;
  right: 0;
  z-index: 40;

  > div { display: flex; flex-direction: column; }
  small { color: var(--muted); font-size: 0.72rem; }
  strong { font-size: 1.2rem; font-variant-numeric: tabular-nums; font-weight: 800; }

  a {
    align-items: center;
    background: var(--green);
    border-radius: 999px;
    color: #fff;
    display: inline-flex;
    flex: 1;
    font-size: 0.92rem;
    font-weight: 800;
    gap: 0.5rem;
    justify-content: center;
    max-width: 260px;
    min-height: 50px;
  }
}

/* ─── Vacío ─── */
.cart-empty {
  align-items: center;
  background: #fff;
  border: 1px dashed rgba(16, 39, 25, 0.16);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  padding: 2.5rem 1.25rem;
  text-align: center;

  h2 { font-size: clamp(1.35rem, 5vw, 1.8rem); font-weight: 800; letter-spacing: -0.03em; margin: 1.1rem 0 0; }
  > p { color: var(--muted); line-height: 1.55; margin: 0.6rem 0 0; max-width: 34ch; }
}

.cart-empty__plate {
  align-items: center;
  background: radial-gradient(circle, #fff 0 52%, #eef1e6 53% 100%);
  border-radius: 50%;
  box-shadow: inset 0 0 0 8px #f4f6ef;
  display: flex;
  height: 104px;
  justify-content: center;
  width: 104px;

  span { color: var(--green); font-size: 1.8rem; }
}

.cart-empty__cta { margin-top: 1.4rem; }

.cart-empty__perks {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  list-style: none;
  margin: 1.6rem 0 0;
  padding: 0;

  li {
    background: #f4f6ef;
    border-radius: 999px;
    color: var(--ink);
    font-size: 0.78rem;
    font-weight: 700;
    padding: 0.45rem 0.8rem;
  }

  i { color: var(--green); margin-right: 0.3rem; }
}

/* ─── Movimiento ─── */
.cart-list-enter-active,
.cart-list-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.cart-list-enter-from,
.cart-list-leave-to { opacity: 0; transform: translateX(-12px); }
.cart-list-move { transition: transform 0.25s ease; }

.checkout-bar-enter-active,
.checkout-bar-leave-active { transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); }
.checkout-bar-enter-from,
.checkout-bar-leave-to { transform: translateY(100%); }

@media (prefers-reduced-motion: reduce) {
  .cart-list-enter-active,
  .cart-list-leave-active,
  .cart-list-move,
  .checkout-bar-enter-active,
  .checkout-bar-leave-active { transition: none; }
  .cart-item__media img { transition: none; }
  .cart-item__media:hover img { transform: none; }
}

/* ─── Escritorio ─── */
@media (min-width: 900px) {
  .cart-page__main { gap: 1.75rem; padding: 6.5rem 1.5rem 5rem; }
  .has-checkout-bar .cart-page__main { padding-bottom: 5rem; }
  .checkout-bar { display: none; }

  .cart-layout {
    align-items: start;
    grid-template-columns: minmax(0, 1fr) 340px;
  }

  .cart-item { padding: 0.85rem; }
  .cart-item__media { flex-basis: 104px; height: 104px; }
  .cart-item__name { font-size: 1.05rem; }

  .cart-summary {
    position: sticky;
    top: 6rem;
  }
}
</style>
