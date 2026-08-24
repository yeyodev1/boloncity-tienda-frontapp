<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import { useCartStore } from '@/stores/cart'
import { useConfirm } from '@/composables/useConfirm'
import { useSettingsStore } from '@/stores/settings'

const cart = useCartStore()
const { confirm } = useConfirm()
cart.hydrate()

const loadedImages = ref(new Set<string>())
const hasItems = computed(() => cart.items.length > 0)
const itemLabel = computed(() => `${cart.count} ${cart.count === 1 ? 'producto' : 'productos'}`)
// Promo global: descuenta el subtotal de productos, nunca el envío.
const settings = useSettingsStore()
const promo = computed(() => settings.promo)
const promoDiscount = computed(() => settings.promoDiscountOn(cart.subtotal))
const cartTotal = computed(() => Math.max(0, cart.subtotal - promoDiscount.value))

function markImageLoaded(productId: string) {
  loadedImages.value = new Set(loadedImages.value).add(productId)
}

function isImageLoaded(productId: string) {
  return loadedImages.value.has(productId)
}

async function confirmRemove(itemName: string, productId: string) {
  const ok = await confirm({
    title: 'Quitar producto',
    message: `¿Estás seguro de que deseas quitar "${itemName}" de tu carrito?`,
    confirmText: 'Sí, quitar',
    type: 'danger',
  })
  if (!ok) return
  cart.removeItem(productId)
}
</script>

<template>
  <div class="cart-page">
    <StoreHeader />

    <main class="cart-page__main">
      <section class="cart-hero">
        <div class="cart-hero__copy">
          <p class="cart-hero__eyebrow"><i class="fa-solid fa-bag-shopping" /> Tu pedido</p>
          <h1 v-if="hasItems">Todo listo para <span>disfrutar.</span></h1>
          <h1 v-else>Tu próximo <span>antojo.</span></h1>
          <p>{{ hasItems ? 'Revisa cantidades y continúa cuando tu selección esté perfecta.' : 'Elige tus favoritos del menú y arma un pedido a tu medida.' }}</p>
        </div>

        <div class="cart-hero__actions">
          <div class="cart-hero__status">
            <span>{{ hasItems ? itemLabel : 'Sin productos' }}</span>
            <strong>${{ cart.subtotal.toFixed(2) }}</strong>
          </div>
          <RouterLink to="/catalogo"><i class="fa-solid fa-arrow-left" /> Seguir comprando</RouterLink>
        </div>
      </section>

      <section v-if="!hasItems" class="cart-empty">
        <div class="cart-empty__visual">
          <span><i class="fa-solid fa-basket-shopping" /></span>
          <i class="fa-solid fa-seedling cart-empty__accent" />
        </div>
        <p class="cart-empty__eyebrow">Tu próxima favorita está cerca</p>
        <h2>Tu carrito espera algo delicioso</h2>
        <p class="cart-empty__copy">Explora el menú, elige tu antojo y vuelve aquí para completar el pedido.</p>
        <RouterLink class="cart-empty__cta" to="/catalogo">
          Explorar el menú <i class="fa-solid fa-arrow-right" />
        </RouterLink>

        <div class="cart-empty__perks">
          <article>
            <i class="fa-solid fa-utensils" />
            <div><strong>Hecho al momento</strong><span>Sabores recién preparados</span></div>
          </article>
          <article>
            <i class="fa-solid fa-location-dot" />
            <div><strong>Tu sucursal ideal</strong><span>Selecciona la más conveniente</span></div>
          </article>
          <article>
            <i class="fa-solid fa-shield-heart" />
            <div><strong>Compra segura</strong><span>Proceso claro y protegido</span></div>
          </article>
        </div>
      </section>

      <section v-else class="cart-layout">
        <div class="cart-items">
          <header class="cart-items__header">
            <div>
              <p>Detalle de la orden</p>
              <h2>Tu selección</h2>
            </div>
            <span><i class="fa-solid fa-check" /> {{ itemLabel }}</span>
          </header>

          <TransitionGroup name="cart-list" tag="div" class="cart-list">
            <article v-for="item in cart.items" :key="item.productId" class="cart-item">
              <div class="cart-item__media">
                <div v-if="item.image && !isImageLoaded(item.productId)" class="cart-item__image-skeleton" />
                <img
                  v-if="item.image"
                  :class="{ 'is-loaded': isImageLoaded(item.productId) }"
                  :src="item.image"
                  :alt="item.name"
                  loading="lazy"
                  @load="markImageLoaded(item.productId)"
                />
                <span v-else><i class="fa-solid fa-utensils" /></span>
              </div>

              <div class="cart-item__copy">
                <p class="cart-item__eyebrow">Producto seleccionado</p>
                <RouterLink :to="`/producto/${item.slug}`">{{ item.name }}</RouterLink>
                <p>${{ item.price.toFixed(2) }} <span>por unidad</span></p>
              </div>

              <div class="cart-item__quantity">
                <small>Cantidad</small>
                <div class="cart-item__stepper">
                  <button type="button" :aria-label="`Restar ${item.name}`" @click="cart.decrement(item.productId)">
                    <i class="fa-solid fa-minus" />
                  </button>
                  <strong>{{ item.quantity }}</strong>
                  <button type="button" :aria-label="`Agregar ${item.name}`" @click="cart.increment(item.productId)">
                    <i class="fa-solid fa-plus" />
                  </button>
                </div>
              </div>

              <div class="cart-item__total">
                <small>Total</small>
                <strong>${{ (item.price * item.quantity).toFixed(2) }}</strong>
                <button type="button" :aria-label="`Quitar ${item.name}`" @click="confirmRemove(item.name, item.productId)">
                  <i class="fa-solid fa-trash-can" /> Quitar
                </button>
              </div>
            </article>
          </TransitionGroup>
        </div>

        <aside class="cart-summary">
          <header>
            <span><i class="fa-solid fa-receipt" /></span>
            <div><p>Resumen</p><h2>Tu orden</h2></div>
          </header>

          <div class="cart-summary__lines">
            <div><span>Productos</span><strong>{{ itemLabel }}</strong></div>
            <div><span>Subtotal</span><strong>${{ cart.subtotal.toFixed(2) }}</strong></div>
            <div v-if="promoDiscount > 0" class="cart-summary__promo">
              <span><i class="fa-solid fa-tag" /> {{ promo.label || `Promo ${promo.percent}%` }}</span>
              <strong>-${{ promoDiscount.toFixed(2) }}</strong>
            </div>
          </div>

          <div class="cart-summary__delivery">
            <i class="fa-solid fa-motorcycle" />
            <div><strong>Entrega por confirmar</strong><span>La calcularemos con tu dirección.</span></div>
          </div>

          <div class="cart-summary__total">
            <span>Total provisional</span>
            <strong>${{ cartTotal.toFixed(2) }}</strong>
          </div>

          <RouterLink class="cart-summary__cta" to="/checkout">
            Continuar al pago <i class="fa-solid fa-arrow-right" />
          </RouterLink>

          <p class="cart-summary__secure"><i class="fa-solid fa-lock" /> Compra protegida y datos seguros</p>
        </aside>
      </section>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.cart-page {
  background:
    radial-gradient(circle at 8% 0%, rgba(239, 213, 55, 0.2), transparent 32%),
    linear-gradient(180deg, #f8f6ec 0%, #f2f4ed 52%, #fff 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.cart-page__main {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  gap: clamp(2rem, 5vw, 4rem);
  margin: 0 auto;
  max-width: 1400px;
  padding: clamp(1.5rem, 4vw, 3rem) 1rem clamp(3.5rem, 7vw, 6rem);
  width: 100%;
}

.cart-hero {
  align-items: flex-start;
  background:
    radial-gradient(circle at 92% 8%, rgba(239, 213, 55, 0.2), transparent 24%),
    linear-gradient(135deg, #235931, #102719 72%);
  border-radius: 28px;
  box-shadow: 0 26px 60px rgba(35, 89, 49, 0.2);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
  padding: clamp(1.4rem, 5vw, 3rem);
  position: relative;
}

.cart-hero__copy {
  max-width: 46rem;
  position: relative;
  z-index: 1;
}

.cart-hero__eyebrow,
.cart-empty__eyebrow,
.cart-items__header p,
.cart-item__eyebrow,
.cart-summary header p {
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.cart-hero__eyebrow {
  color: #efd537;
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
}

.cart-hero h1 {
  font-size: clamp(2.5rem, 7vw, 5.5rem);
  font-weight: 900;
  letter-spacing: -0.065em;
  line-height: 0.88;
  text-transform: uppercase;
}

.cart-hero h1 span {
  color: transparent;
  display: block;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.82);
}

.cart-hero__copy > p:last-child {
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  line-height: 1.6;
  margin-top: 1rem;
}

.cart-hero__actions {
  align-items: stretch;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  width: 100%;
  z-index: 1;
}

.cart-hero__status {
  align-items: flex-start;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  padding: 0.8rem 1rem;
}

.cart-hero__status span {
  color: rgba(255, 255, 255, 0.68);
  font-size: 0.78rem;
}

.cart-hero__status strong {
  color: #efd537;
  font-size: 1.2rem;
  margin-top: 0.15rem;
}

.cart-hero__actions > a,
.cart-empty__cta,
.cart-summary__cta {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font-weight: 900;
  gap: 0.6rem;
  justify-content: center;
  min-height: 52px;
  padding: 0.85rem 1.2rem;
}

.cart-hero__actions > a {
  background: #efd537;
  color: #102719;
}

.cart-empty {
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 30px;
  box-shadow: 0 24px 60px rgba(28, 22, 12, 0.08);
  display: flex;
  flex-direction: column;
  padding: clamp(2.5rem, 8vw, 5rem) clamp(1.2rem, 5vw, 3rem);
  text-align: center;
}

.cart-empty__visual {
  height: 104px;
  margin-bottom: 1.5rem;
  position: relative;
  width: 112px;
}

.cart-empty__visual span {
  align-items: center;
  background: linear-gradient(145deg, #235931, #102719);
  border-radius: 30px;
  box-shadow: 0 18px 36px rgba(35, 89, 49, 0.2);
  color: #efd537;
  display: flex;
  font-size: 2.2rem;
  height: 96px;
  justify-content: center;
  transform: rotate(-5deg);
  width: 96px;
}

.cart-empty__accent {
  align-items: center;
  background: #efd537;
  border: 5px solid #fff;
  border-radius: 50%;
  bottom: 0;
  color: #235931;
  display: flex;
  height: 44px;
  justify-content: center;
  position: absolute;
  right: 0;
  width: 44px;
}

.cart-empty__eyebrow {
  color: #00a523;
}

.cart-empty h2 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  letter-spacing: -0.05em;
  line-height: 1;
  margin-top: 0.5rem;
  max-width: 42rem;
}

.cart-empty__copy {
  color: rgba(26, 26, 26, 0.62);
  line-height: 1.65;
  margin-top: 0.85rem;
  max-width: 34rem;
}

.cart-empty__cta {
  background: #235931;
  color: #fff;
  margin-top: 1.5rem;
}

.cart-empty__perks {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: clamp(2rem, 6vw, 3.5rem);
  max-width: 860px;
  width: 100%;
}

.cart-empty__perks article {
  align-items: center;
  background: #f7f7f1;
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 20px;
  display: flex;
  gap: 0.9rem;
  padding: 1rem;
  text-align: left;
}

.cart-empty__perks article > i {
  align-items: center;
  background: rgba(35, 89, 49, 0.08);
  border-radius: 14px;
  color: #235931;
  display: flex;
  flex: 0 0 44px;
  height: 44px;
  justify-content: center;
}

.cart-empty__perks strong,
.cart-empty__perks span {
  display: block;
}

.cart-empty__perks span {
  color: rgba(26, 26, 26, 0.56);
  font-size: 0.82rem;
  margin-top: 0.2rem;
}

.cart-layout {
  align-items: stretch;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cart-items,
.cart-summary {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 28px;
  box-shadow: 0 24px 60px rgba(28, 22, 12, 0.08);
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
  padding: clamp(1rem, 3vw, 1.5rem);
}

.cart-items__header {
  align-items: flex-start;
  border-bottom: 1px solid rgba(26, 26, 26, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding: 0.25rem 0.25rem 1.25rem;
}

.cart-items__header p,
.cart-summary header p {
  color: #00a523;
}

.cart-items__header h2,
.cart-summary header h2 {
  font-size: 1.65rem;
  letter-spacing: -0.04em;
  margin-top: 0.2rem;
}

.cart-items__header > span {
  background: rgba(35, 89, 49, 0.08);
  border-radius: 999px;
  color: #235931;
  font-size: 0.82rem;
  font-weight: 800;
  padding: 0.55rem 0.8rem;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.cart-item {
  align-items: stretch;
  background: #fff;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 0.8rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.cart-item:hover {
  border-color: rgba(35, 89, 49, 0.2);
  box-shadow: 0 14px 28px rgba(35, 89, 49, 0.08);
}

.cart-item__media {
  background: linear-gradient(145deg, #eef1e6, #dfe8d9);
  border-radius: 17px;
  flex: 0 0 92px;
  height: 92px;
  overflow: hidden;
  position: relative;
}

.cart-item__media img {
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease, transform 0.4s ease;
  width: 100%;
}

.cart-item__media img.is-loaded {
  opacity: 1;
}

.cart-item:hover .cart-item__media img.is-loaded {
  transform: scale(1.04);
}

.cart-item__media > span {
  align-items: center;
  color: #235931;
  display: flex;
  font-size: 1.5rem;
  height: 100%;
  justify-content: center;
}

.cart-item__image-skeleton {
  animation: cart-shimmer 1.2s ease infinite;
  background: linear-gradient(100deg, #dfe8df 25%, #f5f0d8 45%, #dfe8df 65%);
  background-size: 300% 100%;
  inset: 0;
  position: absolute;
}

.cart-item__copy {
  flex: 1 1 calc(100% - 108px);
  min-width: 0;
}

.cart-item__eyebrow {
  color: #00a523;
  font-size: 0.65rem;
}

.cart-item__copy > a {
  display: block;
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1.15;
  margin-top: 0.35rem;
  overflow-wrap: anywhere;
}

.cart-item__copy > p:last-child {
  color: #235931;
  font-weight: 800;
  margin-top: 0.55rem;
}

.cart-item__copy > p:last-child span {
  color: rgba(26, 26, 26, 0.5);
  font-size: 0.75rem;
  font-weight: 600;
}

.cart-item__quantity,
.cart-item__total {
  display: flex;
  flex: 1 1 130px;
  flex-direction: column;
  gap: 0.45rem;
}

.cart-item__quantity small,
.cart-item__total small {
  color: rgba(26, 26, 26, 0.48);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.cart-item__stepper {
  align-items: center;
  align-self: flex-start;
  background: #f2f5ef;
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 999px;
  display: flex;
  gap: 0.7rem;
  padding: 0.3rem;
}

.cart-item__stepper button {
  align-items: center;
  background: #fff;
  border-radius: 50%;
  color: #235931;
  display: flex;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.cart-item__stepper button:hover {
  background: #235931;
  color: #fff;
}

.cart-item__stepper strong {
  min-width: 1.2rem;
  text-align: center;
}

.cart-item__total {
  align-items: flex-end;
}

.cart-item__total > strong {
  font-size: 1.15rem;
}

.cart-item__total button {
  align-items: center;
  background: transparent;
  color: #a02828;
  display: flex;
  font-size: 0.78rem;
  font-weight: 800;
  gap: 0.35rem;
  padding: 0.2rem 0;
}

.cart-summary {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem;
}

.cart-summary header {
  align-items: center;
  display: flex;
  gap: 0.85rem;
}

.cart-summary header > span {
  align-items: center;
  background: #235931;
  border-radius: 16px;
  color: #efd537;
  display: flex;
  flex: 0 0 48px;
  height: 48px;
  justify-content: center;
}

.cart-summary__lines {
  border-bottom: 1px solid rgba(26, 26, 26, 0.08);
  border-top: 1px solid rgba(26, 26, 26, 0.08);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 0;
}

.cart-summary__lines > div,
.cart-summary__promo span { color: #a52323; }
.cart-summary__promo strong { color: #a52323; }

.cart-summary__total {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.cart-summary__lines span,
.cart-summary__total span {
  color: rgba(26, 26, 26, 0.6);
}

.cart-summary__delivery {
  align-items: center;
  background: #f7f3dc;
  border: 1px solid rgba(239, 213, 55, 0.34);
  border-radius: 18px;
  display: flex;
  gap: 0.75rem;
  padding: 0.9rem;
}

.cart-summary__delivery > i {
  color: #235931;
  font-size: 1.2rem;
}

.cart-summary__delivery strong,
.cart-summary__delivery span {
  display: block;
}

.cart-summary__delivery span {
  color: rgba(26, 26, 26, 0.55);
  font-size: 0.78rem;
  margin-top: 0.2rem;
}

.cart-summary__total strong {
  color: #235931;
  font-size: 1.7rem;
}

.cart-summary__cta {
  background: #235931;
  color: #fff;
  width: 100%;
}

.cart-summary__secure {
  color: rgba(26, 26, 26, 0.5);
  font-size: 0.76rem;
  text-align: center;
}

.cart-summary__secure i {
  color: #00a523;
  margin-right: 0.3rem;
}

.cart-list-enter-active,
.cart-list-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.cart-list-enter-from,
.cart-list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes cart-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

@media (min-width: 641px) {
  .cart-page__main {
    padding: clamp(2rem, 4vw, 3.5rem) 1.25rem clamp(4rem, 7vw, 7rem);
  }

  .cart-empty__perks {
    flex-direction: row;
  }

  .cart-empty__perks article {
    flex: 1 1 0;
  }

  .cart-items__header {
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
  }

  .cart-item {
    align-items: center;
    flex-wrap: nowrap;
  }

  .cart-item__copy {
    flex: 1 1 0;
  }

  .cart-item__quantity,
  .cart-item__total {
    flex: 0 0 auto;
  }
}

@media (min-width: 901px) {
  .cart-hero {
    align-items: flex-end;
    flex-direction: row;
    justify-content: space-between;
  }

  .cart-hero__actions {
    align-items: flex-end;
    flex: 0 0 240px;
    width: auto;
  }

  .cart-hero__status,
  .cart-hero__actions > a {
    width: 100%;
  }
}

@media (min-width: 1025px) {
  .cart-layout {
    align-items: flex-start;
    flex-direction: row;
  }

  .cart-items {
    flex: 1 1 0;
  }

  .cart-summary {
    flex: 0 0 350px;
    position: sticky;
    top: 6rem;
  }
}
</style>
