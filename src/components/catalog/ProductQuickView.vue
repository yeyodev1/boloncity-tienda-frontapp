<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { ProductDTO } from '@/services/ProductService'
import { useCartStore } from '@/stores/cart'
import { useSettingsStore } from '@/stores/settings'
import { trackMetaEvent } from '@/services/metaPixel'
import { displayDescription, displayProductName, isCustomerCategory } from '@/utils/productName'

const props = defineProps<{ product: ProductDTO | null }>()
const emit = defineEmits<{ (event: 'close'): void }>()
const cart = useCartStore()
const quantity = ref(1)
const imageLoaded = ref(false)
// Imagen rota o borrada: se muestra el plato de respaldo en vez de un hueco.
const imageFailed = ref(false)
const imageUrl = computed(() => (imageFailed.value ? '' : props.product?.images[0]?.url || ''))
const name = computed(() => displayProductName(props.product?.name || ''))
const description = computed(() => displayDescription(props.product?.description) || 'Preparado al momento, con el sabor de siempre de Boloncity.')
const added = ref(false)
const adding = ref(false)
const addedQuantity = ref(0)
const addedTotal = ref(0)
// Solo las categorías del cliente: "Cocina" o "Caja" son grupos internos del POS.
const categories = computed(() => props.product?.categories?.filter(isCustomerCategory).map((category) => displayProductName(category.name)) || [])
const total = computed(() => (props.product?.price || 0) * quantity.value)
// Promo global: el carrito guarda el precio de catálogo y el descuento se resta del
// subtotal (igual que en el backend); aquí solo se muestra el precio ya rebajado.
const settings = useSettingsStore()
const promo = computed(() => settings.promo)
const promoUnitPrice = computed(() => settings.promoPrice(props.product?.price || 0))
const promoTotal = computed(() => Math.round(total.value * (100 - (promo.value.active ? promo.value.percent : 0))) / 100)

function close() {
  emit('close')
}

async function addToCart() {
  if (!props.product || adding.value) return
  adding.value = true
  await new Promise((resolve) => setTimeout(resolve, 360))
  cart.addItem({
    productId: props.product._id,
    slug: props.product.slug,
    name: props.product.name,
    price: props.product.price,
    quantity: quantity.value,
    image: props.product.images[0]?.url,
  })
  trackMetaEvent('AddToCart', {
    customData: {
      currency: 'USD',
      value: props.product.price * quantity.value,
      content_type: 'product',
      content_ids: [props.product._id],
      content_name: props.product.name,
      num_items: quantity.value,
      contents: [{ id: props.product._id, quantity: quantity.value, item_price: props.product.price }],
    },
  })
  addedQuantity.value = quantity.value
  addedTotal.value = total.value
  added.value = true
  adding.value = false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.product) close()
}

watch(
  () => props.product,
  (product) => {
    // Abrir la vista rápida es ver el producto: cuenta igual que entrar a su ficha.
    if (product) {
      trackMetaEvent('ViewContent', {
        customData: {
          currency: 'USD',
          value: product.price,
          content_type: 'product',
          content_ids: [product._id],
          content_name: product.name,
          content_category: product.categories?.[0]?.name,
        },
      })
    }
    quantity.value = 1
    imageLoaded.value = false
    imageFailed.value = false
    added.value = false
    adding.value = false
    addedQuantity.value = 0
    addedTotal.value = 0
    document.body.style.overflow = product ? 'hidden' : ''
  },
)

window.addEventListener('keydown', onKeydown)
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="quick-view">
      <div v-if="product" class="quick-view" @click.self="close">
        <article class="quick-view__panel" role="dialog" aria-modal="true" :aria-label="name">
          <button class="quick-view__close" type="button" aria-label="Cerrar" @click="close"><i class="fa-solid fa-xmark" /></button>

          <div class="quick-view__media">
            <div v-if="imageUrl && !imageLoaded" class="quick-view__skeleton" />
            <img v-if="imageUrl" :class="{ 'is-loaded': imageLoaded }" :src="imageUrl" :alt="name" @load="imageLoaded = true" @error="imageFailed = true" />
            <span v-else class="quick-view__fallback" aria-hidden="true"><i class="fa-solid fa-utensils" /></span>
          </div>

          <Transition name="quick-content" mode="out-in">
          <div v-if="!added" key="details" class="quick-view__content">
            <div class="quick-view__heading">
              <div><p v-if="categories.length">{{ categories[categories.length - 1] }}</p><h2>{{ name }}</h2></div>
              <span v-if="promo.active" class="quick-view__prices">
                <small>${{ product.price.toFixed(2) }}</small>
                <strong>${{ promoUnitPrice.toFixed(2) }}</strong>
                <em>{{ promo.label || `-${promo.percent}%` }}</em>
              </span>
              <strong v-else>${{ product.price.toFixed(2) }}</strong>
            </div>

            <p class="quick-view__description">{{ description }}</p>

            <div class="quick-view__facts">
              <span><i class="fa-solid fa-circle-check" /> Disponible</span>
              <span><i class="fa-solid fa-bowl-food" /> Preparado al momento</span>
            </div>

            <div class="quick-view__quantity">
              <div><strong>Cantidad</strong><span>Elige cuántos deseas</span></div>
              <div class="quick-view__stepper">
                <button type="button" aria-label="Restar" :disabled="quantity === 1" @click="quantity--"><i class="fa-solid fa-minus" /></button>
                <strong>{{ quantity }}</strong>
                <button type="button" aria-label="Agregar" @click="quantity++"><i class="fa-solid fa-plus" /></button>
              </div>
            </div>

            <footer>
              <RouterLink :to="`/producto/${product.slug}`" @click="close"><i class="fa-solid fa-arrow-up-right-from-square" /> Ver ficha completa</RouterLink>
              <button type="button" :disabled="adding" @click="addToCart">
                <template v-if="adding"><i class="fa-solid fa-spinner fa-spin" /> Agregando al carrito...</template>
                <template v-else><i class="fa-solid fa-cart-plus" /> Agregar · ${{ promoTotal.toFixed(2) }}</template>
              </button>
            </footer>
          </div>

          <div v-else key="success" class="quick-view__success">
            <span class="quick-view__success-icon"><i class="fa-solid fa-check" /></span>
            <p class="quick-view__success-eyebrow">Agregado a tu pedido</p>
            <h2>Buena elección!</h2>
            <p>Tu {{ name.toLowerCase() }} ya está en el carrito. Puedes seguir explorando y sumar más sabores.</p>

            <div class="quick-view__success-summary">
              <div><span>Cantidad</span><strong>{{ addedQuantity }}</strong></div>
              <div><span>Agregado</span><strong>${{ addedTotal.toFixed(2) }}</strong></div>
            </div>

            <div class="quick-view__success-actions">
              <button type="button" @click="close"><i class="fa-solid fa-plus" /> Seguir agregando productos</button>
              <RouterLink to="/carrito" @click="close"><i class="fa-solid fa-bag-shopping" /> Ver carrito ({{ cart.count }})</RouterLink>
            </div>
          </div>
          </Transition>
        </article>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.quick-view__prices { align-items: baseline; display: flex; flex-wrap: wrap; gap: 0.35rem; justify-content: flex-end; }
.quick-view__prices small { color: rgba(26, 26, 26, 0.45); font-size: 0.9rem; text-decoration: line-through; }
.quick-view__prices strong { color: #a52323; }
.quick-view__prices em { background: #a52323; border-radius: 999px; color: #fff; font-size: 0.62rem; font-style: normal; font-weight: 900; padding: 0.25rem 0.5rem; text-transform: uppercase; }

.quick-view {
  align-items: flex-end;
  background: rgba(8, 17, 13, 0.72);
  backdrop-filter: blur(10px);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 0;
  position: fixed;
  z-index: 99998;
}

.quick-view__panel {
  background: #fff;
  border-radius: 26px 26px 0 0;
  box-shadow: 0 -24px 70px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  max-height: 94dvh;
  max-width: 920px;
  overflow-y: auto;
  position: relative;
  width: 100%;
}

.quick-view__close {
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border-radius: 50%;
  color: #102719;
  display: flex;
  height: 44px;
  justify-content: center;
  position: absolute;
  right: 1rem;
  top: 1rem;
  width: 44px;
  z-index: 2;
}

.quick-view__media {
  aspect-ratio: 4 / 3;
  background: #e8eee4;
  flex: 0 0 auto;
  overflow: hidden;
  position: relative;
}

.quick-view__media img {
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
  width: 100%;
}

.quick-view__media img.is-loaded { opacity: 1; }

.quick-view__fallback {
  align-items: center;
  background:
    radial-gradient(circle at 50% 50%, #fff 0 26%, transparent 27%),
    radial-gradient(circle at 50% 50%, rgba(35, 89, 49, 0.08) 0 36%, transparent 37%),
    linear-gradient(145deg, #e3ebdc, #f4ecbf);
  color: rgba(35, 89, 49, 0.55);
  display: flex;
  font-size: 2.4rem;
  height: 100%;
  justify-content: center;
}

.quick-view__skeleton {
  animation: modal-shimmer 1.2s ease infinite;
  background: linear-gradient(100deg, #dfe8df 25%, #f5f0d8 45%, #dfe8df 65%);
  background-size: 300% 100%;
  inset: 0;
  position: absolute;
}

.quick-view__content {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: 1.25rem;
}

.quick-view__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.quick-view__heading {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.quick-view__heading p {
  color: #00a523;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.quick-view__heading h2 {
  color: #102719;
  font-size: clamp(1.6rem, 5vw, 2.4rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 0.98;
  margin-top: 0.3rem;
  overflow-wrap: anywhere;
}

/* Misma etiqueta de precio que en la tarjeta del catálogo. */
.quick-view__heading > strong {
  background: #efd537;
  border-radius: 10px 10px 10px 3px;
  box-shadow: 0 6px 14px -6px rgba(16, 39, 25, 0.4);
  color: #102719;
  font-size: 1.3rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  padding: 0.3rem 0.65rem;
  transform: rotate(-3deg);
  white-space: nowrap;
}

.quick-view__description {
  color: rgba(26, 26, 26, 0.64);
  line-height: 1.6;
}

.quick-view__facts span {
  color: rgba(26, 26, 26, 0.65);
  font-size: 0.78rem;
  font-weight: 700;
}

.quick-view__facts i { color: #00a523; margin-right: 0.25rem; }

.quick-view__quantity {
  align-items: center;
  background: #f6f7f1;
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 18px;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.85rem;
}

.quick-view__quantity > div:first-child strong,
.quick-view__quantity > div:first-child span { display: block; }
.quick-view__quantity > div:first-child span { color: rgba(26, 26, 26, 0.5); font-size: 0.75rem; margin-top: 0.15rem; }

.quick-view__stepper {
  align-items: center;
  display: flex;
  gap: 0.7rem;
}

.quick-view__stepper button {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(35, 89, 49, 0.12);
  border-radius: 50%;
  color: #235931;
  display: flex;
  height: 38px;
  justify-content: center;
  width: 38px;
}

.quick-view__stepper button:disabled { opacity: 0.4; }

.quick-view__content footer {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.quick-view__content footer a,
.quick-view__content footer button {
  align-items: center;
  border-radius: 14px;
  display: flex;
  font-weight: 900;
  gap: 0.5rem;
  justify-content: center;
  min-height: 50px;
  padding: 0.8rem 1rem;
}

.quick-view__content footer a { background: rgba(35, 89, 49, 0.08); color: #235931; }
.quick-view__content footer button { background: #235931; color: #fff; cursor: pointer; transition: background-color 0.2s ease; }
.quick-view__content footer button:hover:not(:disabled) { background: #00a523; }
.quick-view__content footer button:disabled { cursor: wait; opacity: 0.82; }

.quick-content-enter-active,
.quick-content-leave-active {
  transform-origin: center;
  transition: opacity 0.3s ease, transform 0.42s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease;
}

.quick-content-enter-from {
  filter: blur(5px);
  opacity: 0;
  transform: translateY(18px) scale(0.94);
}

.quick-content-leave-to {
  filter: blur(3px);
  opacity: 0;
  transform: translateY(-12px) scale(0.97);
}

.quick-view__success {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  justify-content: center;
  padding: 2rem 1.25rem;
  text-align: center;
}

.quick-content-enter-active.quick-view__success > * {
  animation: quick-success-item 0.42s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.quick-content-enter-active.quick-view__success > *:nth-child(2) { animation-delay: 0.05s; }
.quick-content-enter-active.quick-view__success > *:nth-child(3) { animation-delay: 0.1s; }
.quick-content-enter-active.quick-view__success > *:nth-child(4) { animation-delay: 0.15s; }
.quick-content-enter-active.quick-view__success > *:nth-child(5) { animation-delay: 0.2s; }
.quick-content-enter-active.quick-view__success > *:nth-child(6) { animation-delay: 0.25s; }

.quick-view__success-icon {
  align-items: center;
  background: #efd537;
  border: 8px solid #fff8d4;
  border-radius: 50%;
  color: #102719;
  display: flex;
  font-size: 1.4rem;
  height: 78px;
  justify-content: center;
  width: 78px;
}

.quick-view__success-eyebrow {
  color: #8a7610;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  margin-top: 0.35rem;
  text-transform: uppercase;
}

.quick-view__success h2 {
  color: #102719;
  font-size: clamp(2rem, 6vw, 3rem);
  letter-spacing: -0.055em;
  line-height: 1;
}

.quick-view__success > p:not(.quick-view__success-eyebrow) {
  color: rgba(26, 26, 26, 0.62);
  line-height: 1.6;
  max-width: 28rem;
}

.quick-view__success-summary {
  display: flex;
  gap: 0.7rem;
  margin-top: 0.5rem;
  width: 100%;
}

.quick-view__success-summary > div {
  background: #f8f6ec;
  border: 1px solid rgba(138, 118, 16, 0.12);
  border-radius: 16px;
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.85rem;
}

.quick-view__success-summary span {
  color: rgba(26, 26, 26, 0.5);
  font-size: 0.72rem;
}

.quick-view__success-summary strong {
  color: #102719;
  font-size: 1.1rem;
}

.quick-view__success-actions {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  margin-top: 0.5rem;
  width: 100%;
}

.quick-view__success-actions button,
.quick-view__success-actions a {
  align-items: center;
  border-radius: 14px;
  display: flex;
  font-weight: 900;
  gap: 0.5rem;
  justify-content: center;
  min-height: 52px;
  padding: 0.8rem 1rem;
}

.quick-view__success-actions button {
  background: #efd537;
  color: #102719;
}

.quick-view__success-actions a {
  background: #f0f2ed;
  color: #235931;
}

.quick-view-enter-active,
.quick-view-leave-active { transition: opacity 0.22s ease; }
.quick-view-enter-active .quick-view__panel,
.quick-view-leave-active .quick-view__panel { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.quick-view-enter-from,
.quick-view-leave-to { opacity: 0; }
.quick-view-enter-from .quick-view__panel,
.quick-view-leave-to .quick-view__panel { transform: translateY(40px); }

@media (prefers-reduced-motion: reduce) {
  .quick-view-enter-active .quick-view__panel,
  .quick-view-leave-active .quick-view__panel,
  .quick-content-enter-active,
  .quick-content-leave-active { transition: opacity 0.15s ease; }
  .quick-view-enter-from .quick-view__panel,
  .quick-view-leave-to .quick-view__panel,
  .quick-content-enter-from,
  .quick-content-leave-to { filter: none; transform: none; }
  .quick-content-enter-active.quick-view__success > * { animation: none; }
  .quick-view__skeleton { animation: none; }
  .quick-view__heading > strong { transform: none; }
}

@keyframes modal-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

@keyframes quick-success-item {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (min-width: 761px) {
  .quick-view { align-items: center; padding: 1.5rem; }
  .quick-view__panel { border-radius: 28px; flex-direction: row; max-height: min(760px, calc(100vh - 3rem)); overflow: hidden; }
  .quick-view__media { align-self: stretch; aspect-ratio: auto; flex: 1.05 1 0; min-height: 560px; }
  .quick-view__content { flex: 0.95 1 0; justify-content: center; overflow-y: auto; padding: 2rem; }
  .quick-view__success { flex: 0.95 1 0; padding: 2.5rem; }
  .quick-view__content footer { flex-direction: row; }
  .quick-view__content footer a { flex: 0 1 auto; }
  .quick-view__content footer button { flex: 1 1 auto; }
}
</style>
