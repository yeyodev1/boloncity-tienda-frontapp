<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import ProductCard from '@/components/catalog/ProductCard.vue'
import ProductQuickView from '@/components/catalog/ProductQuickView.vue'
import ProductService, { type PaginatedProductsDTO, type ProductDTO } from '@/services/ProductService'
import CategoryService, { type CategoryDTO } from '@/services/CategoryService'
import { useCartStore } from '@/stores/cart'
import { useSettingsStore } from '@/stores/settings'
import { trackMetaEvent } from '@/services/metaPixel'

const route = useRoute()
const cart = useCartStore()
const product = ref<ProductDTO | null>(null)
const companions = ref<ProductDTO[]>([])
const drinks = ref<ProductDTO[]>([])
const loading = ref(true)
const recommendationsLoading = ref(true)
const imageLoaded = ref(false)
const quantity = ref(1)
const adding = ref(false)
const addedModalOpen = ref(false)
const selectedProduct = ref<ProductDTO | null>(null)
const slug = computed(() => String(route.params.slug || ''))
const total = computed(() => (product.value?.price || 0) * quantity.value)
// Promo global: se muestra el precio ya rebajado; el carrito guarda el de catálogo y
// el descuento se resta del subtotal (igual que en el backend).
const settings = useSettingsStore()
const promo = computed(() => settings.promo)
const promoUnitPrice = computed(() => settings.promoPrice(product.value?.price || 0))
const promoTotal = computed(() => Math.round(total.value * (100 - (promo.value.active ? promo.value.percent : 0))) / 100)
const categoryNames = computed(() => product.value?.categories?.map((category) => category.name).filter(Boolean) || [])
const isDrink = computed(() => categoryNames.value.some((name) => /bebida|cafe|café|jugo/i.test(name)))
const companionTitle = computed(() => (isDrink.value ? 'Algo rico para comer' : 'Acompaña tu elección'))
const companionCopy = computed(() => (isDrink.value ? 'Platos que hacen una gran pareja con tu bebida.' : 'Extras y opciones que completan tu plato.'))

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

function shuffle<T>(items: T[]) {
  const copy = [...items]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1))
    const current = copy[index]!
    copy[index] = copy[target]!
    copy[target] = current
  }
  return copy
}

function pickCategory(categories: CategoryDTO[], names: string[]) {
  const normalizedNames = names.map(normalize)
  const candidates = categories.filter((category) => normalizedNames.includes(normalize(category.name)))
  return shuffle(candidates)[0]
}

function unwrapProducts(payload: PaginatedProductsDTO | ProductDTO[]) {
  return Array.isArray(payload) ? payload : payload.data
}

async function productsFromCategory(category: CategoryDTO | undefined, limit = 10) {
  if (!category) return []
  const response = await ProductService.getPaginated({ page: 1, limit, category: category.slug, available: true })
  return unwrapProducts(response.data as PaginatedProductsDTO | ProductDTO[])
}

async function loadRecommendations(categories: CategoryDTO[]) {
  if (!product.value) return
  recommendationsLoading.value = true

  try {
    const foodCategoryNames = ['BOLONES CLASICOS', 'TIPICOS', 'ESPECIALES', 'TOSTADAS']
    const companionCategoryNames = ['EXTRAS', 'TOSTADAS', 'TIPICOS STOCKEABLES']
    const foodCategory = pickCategory(categories, foodCategoryNames)
    const companionCategory = isDrink.value ? foodCategory : pickCategory(categories, companionCategoryNames)
    const drinkCategory = pickCategory(categories, ['BEBIDAS'])

    const [companionProducts, drinkProducts] = await Promise.all([
      productsFromCategory(companionCategory, 20),
      isDrink.value ? Promise.resolve([]) : productsFromCategory(drinkCategory, 20),
    ])

    const withoutCurrent = (items: ProductDTO[]) => items.filter((item) => item._id !== product.value?._id && item.price > 0)
    const customerFacingCompanions = withoutCurrent(companionProducts).filter((item) => !/envase|cubierto|servilleta|salsa de cebolla|porción de aj[ií]/i.test(item.name))
    const realDrinks = withoutCurrent(drinkProducts).filter((item) => !/syrup|taza.*leche|leche.*taza|topping|jalea|crema.*kg|mermelada|manjar.*kilo|cono helado/i.test(item.name))
    companions.value = shuffle(customerFacingCompanions).slice(0, 4)
    drinks.value = shuffle(realDrinks).slice(0, 4)
  } finally {
    recommendationsLoading.value = false
  }
}

async function loadProduct() {
  loading.value = true
  recommendationsLoading.value = true
  product.value = null
  companions.value = []
  drinks.value = []
  quantity.value = 1
  adding.value = false
  addedModalOpen.value = false
  imageLoaded.value = false

  try {
    const [productResponse, categoriesResponse] = await Promise.all([
      ProductService.getBySlug(slug.value),
      CategoryService.getAll(),
    ])
    product.value = productResponse.data
    trackMetaEvent('ViewContent', {
      customData: {
        currency: 'USD',
        value: product.value.price,
        content_type: 'product',
        content_ids: [product.value._id],
        content_name: product.value.name,
        content_category: product.value.categories?.[0]?.name,
      },
    })
    await loadRecommendations(categoriesResponse.data)
  } finally {
    loading.value = false
  }
}

async function addToCart() {
  if (!product.value || adding.value) return
  adding.value = true
  await new Promise((resolve) => setTimeout(resolve, 320))
  cart.addItem({
    productId: product.value._id,
    slug: product.value.slug,
    name: product.value.name,
    price: product.value.price,
    quantity: quantity.value,
    image: product.value.images[0]?.url,
  })
  // Se reporta el precio de catálogo, igual que lo guarda el carrito: la promo se
  // descuenta del subtotal más adelante y recién ahí cambia el valor real.
  trackMetaEvent('AddToCart', {
    customData: {
      currency: 'USD',
      value: product.value.price * quantity.value,
      content_type: 'product',
      content_ids: [product.value._id],
      content_name: product.value.name,
      num_items: quantity.value,
      contents: [{ id: product.value._id, quantity: quantity.value, item_price: product.value.price }],
    },
  })
  adding.value = false
  await nextTick()
  addedModalOpen.value = true
}

async function showRecommendations() {
  addedModalOpen.value = false
  await nextTick()
  document.querySelector('.recommendations')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(slug, loadProduct, { immediate: true })
watch(addedModalOpen, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})
onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <div class="product-page">
    <StoreHeader />

    <main class="product-page__main">
      <section v-if="loading" class="product-loading">
        <SkeletonLoader type="product" :count="2" />
      </section>

      <template v-else-if="product">
        <nav class="product-breadcrumb" aria-label="Navegación">
          <RouterLink to="/catalogo"><i class="fa-solid fa-arrow-left" /> Volver al menú</RouterLink>
          <span>{{ categoryNames.at(-1) || 'Boloncity' }}</span>
        </nav>

        <article class="product-detail">
          <div class="product-detail__media">
            <div v-if="product.images[0]?.url && !imageLoaded" class="product-detail__image-skeleton" />
            <img v-if="product.images[0]?.url" :class="{ 'is-loaded': imageLoaded }" :src="product.images[0].url" :alt="product.name" @load="imageLoaded = true" />
            <span v-else><i class="fa-solid fa-utensils" /></span>
            <div class="product-detail__media-badge"><i class="fa-solid fa-fire-burner" /> Preparado al momento</div>
          </div>

          <div class="product-detail__copy">
            <div class="product-detail__categories">
              <span v-for="category in categoryNames" :key="category">{{ category }}</span>
            </div>

            <p class="product-detail__eyebrow">Producto {{ product.code }}</p>
            <h1>{{ product.name }}</h1>
            <p class="product-detail__text">{{ product.description || 'Una opción preparada con el sabor auténtico de Boloncity.' }}</p>

            <div class="product-detail__benefits">
              <span><i class="fa-solid fa-circle-check" /> Disponible ahora</span>
              <span><i class="fa-solid fa-kitchen-set" /> Preparación fresca</span>
            </div>

            <div class="product-detail__order">
              <div class="product-detail__price">
                <span>Precio</span>
                <template v-if="promo.active">
                  <strong>${{ promoUnitPrice.toFixed(2) }}</strong>
                  <em class="product-detail__price-old">${{ product.price.toFixed(2) }}</em>
                  <em class="product-detail__price-tag">{{ promo.label || `-${promo.percent}%` }}</em>
                </template>
                <strong v-else>${{ product.price.toFixed(2) }}</strong>
              </div>

              <div class="product-detail__quantity">
                <span>Cantidad</span>
                <div>
                  <button type="button" aria-label="Restar" :disabled="quantity === 1" @click="quantity--"><i class="fa-solid fa-minus" /></button>
                  <strong>{{ quantity }}</strong>
                  <button type="button" aria-label="Agregar" @click="quantity++"><i class="fa-solid fa-plus" /></button>
                </div>
              </div>

              <button class="product-detail__add" type="button" :disabled="adding" @click="addToCart">
                <template v-if="adding"><i class="fa-solid fa-spinner fa-spin" /> Agregando a tu pedido...</template>
                <template v-else><i class="fa-solid fa-cart-plus" /> Agregar al pedido · ${{ promoTotal.toFixed(2) }}</template>
              </button>
            </div>
          </div>
        </article>

        <section class="recommendations" aria-label="Recomendaciones para completar el pedido">
          <header class="recommendations__intro">
            <p><i class="fa-solid fa-wand-magic-sparkles" /> Completa tu pedido</p>
            <h2>Hazlo todavía mejor</h2>
            <span>Seleccionamos opciones que combinan con {{ product.name.toLowerCase() }}. Cambian en cada visita para que siempre encuentres algo nuevo.</span>
          </header>

          <SkeletonLoader v-if="recommendationsLoading" type="product" :count="4" />

          <template v-else>
            <section v-if="companions.length" class="recommendation-group">
              <header>
                <span><i :class="isDrink ? 'fa-solid fa-bowl-food' : 'fa-solid fa-utensils'" /></span>
                <div><p>Recomendado</p><h3>{{ companionTitle }}</h3><small>{{ companionCopy }}</small></div>
              </header>
              <div class="recommendation-list">
                <ProductCard v-for="item in companions" :key="item._id" :product="item" @open="selectedProduct = item" />
              </div>
            </section>

            <section v-if="drinks.length" class="recommendation-group recommendation-group--drinks">
              <header>
                <span><i class="fa-solid fa-mug-hot" /></span>
                <div><p>Para beber</p><h3>Una bebida para acompañar</h3><small>Opciones que equilibran y completan tu elección.</small></div>
              </header>
              <div class="recommendation-list">
                <ProductCard v-for="item in drinks" :key="item._id" :product="item" @open="selectedProduct = item" />
              </div>
            </section>
          </template>
        </section>
      </template>
    </main>

    <ProductQuickView :product="selectedProduct" @close="selectedProduct = null" />

    <Teleport to="body">
      <Transition name="added-modal">
        <div v-if="addedModalOpen && product" class="product-added-modal" @click.self="addedModalOpen = false">
          <article class="product-added-modal__panel" role="dialog" aria-modal="true" aria-label="Producto agregado">
            <button class="product-added-modal__close" type="button" aria-label="Cerrar" @click="addedModalOpen = false">
              <i class="fa-solid fa-xmark" />
            </button>

            <div class="product-added-modal__icon"><i class="fa-solid fa-check" /></div>
            <p class="product-added-modal__eyebrow">Agregado correctamente</p>
            <h2>¡Ya está en tu pedido!</h2>
            <p>Agregamos {{ quantity }} {{ quantity === 1 ? 'unidad' : 'unidades' }} de <strong>{{ product.name }}</strong>. Ahora puedes completar tu pedido con algo que combine.</p>

            <div class="product-added-modal__summary">
              <span>{{ quantity }} × ${{ (promo.active ? promoUnitPrice : product.price).toFixed(2) }}</span>
              <strong>${{ promoTotal.toFixed(2) }}</strong>
            </div>

            <div class="product-added-modal__actions">
              <button type="button" @click="showRecommendations"><i class="fa-solid fa-wand-magic-sparkles" /> Ver bebidas y acompañantes</button>
              <RouterLink to="/carrito"><i class="fa-solid fa-bag-shopping" /> Ver carrito ({{ cart.count }})</RouterLink>
              <button type="button" class="product-added-modal__continue" @click="addedModalOpen = false"><i class="fa-solid fa-arrow-left" /> Seguir viendo el producto</button>
            </div>
          </article>
        </div>
      </Transition>
    </Teleport>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.product-detail__price-old { color: rgba(8, 17, 13, 0.45); font-style: normal; text-decoration: line-through; }
.product-detail__price-tag { background: #a52323; border-radius: 999px; color: #fff; font-size: 0.65rem; font-style: normal; font-weight: 900; padding: 0.25rem 0.5rem; text-transform: uppercase; }

.product-page {
  background:
    radial-gradient(circle at 8% 0%, rgba(239, 213, 55, 0.2), transparent 30%),
    linear-gradient(180deg, #f8f6ec, #f2f4ed 55%, #fff);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.product-page__main {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  gap: clamp(1.25rem, 4vw, 2.5rem);
  margin: 0 auto;
  max-width: 1400px;
  padding: clamp(1.25rem, 4vw, 3rem) 1rem clamp(4rem, 8vw, 7rem);
  width: 100%;
}

.product-loading { padding: 1rem 0; }

.product-breadcrumb {
  align-items: center;
  color: rgba(26, 26, 26, 0.52);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.78rem;
  gap: 0.7rem;
  justify-content: space-between;
}

.product-breadcrumb a {
  align-items: center;
  color: #235931;
  display: inline-flex;
  font-weight: 800;
  gap: 0.45rem;
}

.product-detail {
  background: #fff;
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 30px;
  box-shadow: 0 26px 65px rgba(28, 22, 12, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.product-detail__media {
  aspect-ratio: 4 / 3;
  background: #e8eee4;
  overflow: hidden;
  position: relative;
}

.product-detail__media img {
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.35s ease, transform 0.7s ease;
  width: 100%;
}

.product-detail__media img.is-loaded { opacity: 1; }
.product-detail:hover .product-detail__media img.is-loaded { transform: scale(1.015); }

.product-detail__media > span {
  align-items: center;
  color: #235931;
  display: flex;
  font-size: 3rem;
  height: 100%;
  justify-content: center;
}

.product-detail__image-skeleton {
  animation: detail-shimmer 1.2s ease infinite;
  background: linear-gradient(100deg, #dfe8df 25%, #f5f0d8 45%, #dfe8df 65%);
  background-size: 300% 100%;
  inset: 0;
  position: absolute;
}

.product-detail__media-badge {
  align-items: center;
  background: rgba(16, 39, 25, 0.9);
  border-radius: 999px;
  bottom: 1rem;
  color: #efd537;
  display: inline-flex;
  font-size: 0.72rem;
  font-weight: 900;
  gap: 0.4rem;
  left: 1rem;
  padding: 0.6rem 0.8rem;
  position: absolute;
  text-transform: uppercase;
}

.product-detail__copy {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: center;
  padding: clamp(1.25rem, 5vw, 3rem);
}

.product-detail__categories,
.product-detail__benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.product-detail__categories span {
  background: rgba(35, 89, 49, 0.08);
  border-radius: 999px;
  color: #235931;
  font-size: 0.67rem;
  font-weight: 900;
  padding: 0.45rem 0.65rem;
  text-transform: uppercase;
}

.product-detail__eyebrow {
  color: #00a523;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.product-detail h1 {
  font-size: clamp(2.4rem, 6vw, 5rem);
  font-weight: 900;
  letter-spacing: -0.065em;
  line-height: 0.9;
  overflow-wrap: anywhere;
  text-transform: uppercase;
}

.product-detail__text {
  color: rgba(26, 26, 26, 0.62);
  line-height: 1.65;
  max-width: 38rem;
}

.product-detail__benefits span {
  color: rgba(26, 26, 26, 0.62);
  font-size: 0.78rem;
  font-weight: 700;
}

.product-detail__benefits i { color: #00a523; margin-right: 0.2rem; }

.product-detail__order {
  background: #f7f7f1;
  border: 1px solid rgba(35, 89, 49, 0.09);
  border-radius: 22px;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.5rem;
  padding: 1rem;
}

.product-detail__price,
.product-detail__quantity {
  display: flex;
  flex: 1 1 130px;
  flex-direction: column;
  gap: 0.3rem;
}

.product-detail__price > span,
.product-detail__quantity > span {
  color: rgba(26, 26, 26, 0.5);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.product-detail__price strong { color: #235931; font-size: 1.8rem; }

.product-detail__quantity > div {
  align-items: center;
  display: flex;
  gap: 0.75rem;
}

.product-detail__quantity button {
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

.product-detail__quantity button:disabled { opacity: 0.4; }

.product-detail__add {
  align-items: center;
  background: #efd537;
  border-radius: 14px;
  color: #102719;
  display: flex;
  flex: 1 1 100%;
  font-weight: 900;
  gap: 0.5rem;
  justify-content: center;
  min-height: 54px;
  padding: 0.8rem 1rem;
}

.product-detail__add:disabled {
  cursor: wait;
  opacity: 0.82;
}

.recommendations {
  display: flex;
  flex-direction: column;
  gap: clamp(2rem, 5vw, 4rem);
  scroll-margin-top: 5rem;
}

.recommendations__intro {
  max-width: 50rem;
}

.recommendations__intro > p,
.recommendation-group header p {
  color: #00a523;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.recommendations__intro > p i { margin-right: 0.35rem; }

.recommendations__intro h2 {
  font-size: clamp(2.2rem, 5vw, 4rem);
  letter-spacing: -0.055em;
  line-height: 0.95;
  margin-top: 0.5rem;
}

.recommendations__intro > span {
  color: rgba(26, 26, 26, 0.58);
  display: block;
  line-height: 1.6;
  margin-top: 0.8rem;
}

.recommendation-group {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.recommendation-group > header {
  align-items: center;
  display: flex;
  gap: 0.85rem;
}

.recommendation-group > header > span {
  align-items: center;
  background: #235931;
  border-radius: 16px;
  color: #efd537;
  display: flex;
  flex: 0 0 50px;
  height: 50px;
  justify-content: center;
}

.recommendation-group--drinks > header > span { background: #efd537; color: #102719; }

.recommendation-group header h3 {
  font-size: clamp(1.45rem, 3vw, 2rem);
  letter-spacing: -0.035em;
  margin-top: 0.15rem;
}

.recommendation-group header small { color: rgba(26, 26, 26, 0.52); display: block; margin-top: 0.2rem; }

.recommendation-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.recommendation-list > * {
  flex: 1 1 100%;
  min-width: 0;
}

@keyframes detail-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

@media (min-width: 641px) {
  .product-page__main { padding-inline: 1.25rem; }
  .recommendation-list > * { flex: 0 1 calc((100% - 1rem) / 2); }
}

@media (min-width: 901px) {
  .product-detail { align-items: stretch; flex-direction: row; }
  .product-detail__media { align-self: stretch; aspect-ratio: auto; flex: 1.08 1 0; min-height: 650px; }
  .product-detail__copy { flex: 0.92 1 0; }
  .recommendation-list > * { flex-basis: calc((100% - 3rem) / 4); }
}

.product-added-modal {
  align-items: center;
  background: rgba(8, 17, 13, 0.76);
  backdrop-filter: blur(12px);
  display: flex;
  inset: 0;
  justify-content: center;
  padding: 1rem;
  position: fixed;
  z-index: 99999;
}

.product-added-modal__panel {
  align-items: center;
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 30px 90px rgba(0, 0, 0, 0.34);
  display: flex;
  flex-direction: column;
  max-width: 560px;
  padding: clamp(1.5rem, 6vw, 2.5rem);
  position: relative;
  text-align: center;
  width: 100%;
}

.product-added-modal__close {
  align-items: center;
  background: #f0f2ed;
  border-radius: 50%;
  color: #102719;
  display: flex;
  height: 42px;
  justify-content: center;
  position: absolute;
  right: 1rem;
  top: 1rem;
  width: 42px;
}

.product-added-modal__icon {
  align-items: center;
  animation: modal-check-pop 0.55s 0.18s cubic-bezier(0.16, 1, 0.3, 1) both;
  background: #efd537;
  border: 9px solid #fff8d4;
  border-radius: 50%;
  color: #102719;
  display: flex;
  font-size: 1.5rem;
  height: 86px;
  justify-content: center;
  width: 86px;
}

.product-added-modal__eyebrow {
  color: #8a7610;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  margin-top: 1.1rem;
  text-transform: uppercase;
}

.product-added-modal h2 {
  color: #102719;
  font-size: clamp(2rem, 7vw, 3.2rem);
  letter-spacing: -0.06em;
  line-height: 1;
  margin-top: 0.45rem;
}

.product-added-modal__panel > p:not(.product-added-modal__eyebrow) {
  color: rgba(26, 26, 26, 0.62);
  line-height: 1.6;
  margin-top: 0.85rem;
  max-width: 28rem;
}

.product-added-modal__summary {
  align-items: center;
  background: #f8f6ec;
  border: 1px solid rgba(138, 118, 16, 0.14);
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  margin-top: 1.25rem;
  padding: 0.85rem 1rem;
  width: 100%;
}

.product-added-modal__summary span { color: rgba(26, 26, 26, 0.55); }
.product-added-modal__summary strong { color: #235931; font-size: 1.25rem; }

.product-added-modal__actions {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  margin-top: 1rem;
  width: 100%;
}

.product-added-modal__actions button,
.product-added-modal__actions a {
  align-items: center;
  border-radius: 14px;
  display: flex;
  font-weight: 900;
  gap: 0.5rem;
  justify-content: center;
  min-height: 52px;
  padding: 0.8rem 1rem;
}

.product-added-modal__actions > button:first-child { background: #efd537; color: #102719; }
.product-added-modal__actions a { background: #235931; color: #fff; }
.product-added-modal__actions .product-added-modal__continue { background: transparent; color: rgba(26, 26, 26, 0.62); }

.added-modal-enter-active,
.added-modal-leave-active { transition: opacity 0.3s ease, backdrop-filter 0.3s ease; }
.added-modal-enter-active .product-added-modal__panel,
.added-modal-leave-active .product-added-modal__panel { transition: opacity 0.28s ease, transform 0.42s cubic-bezier(0.16, 1, 0.3, 1); }
.added-modal-enter-from,
.added-modal-leave-to { opacity: 0; backdrop-filter: blur(0); }
.added-modal-enter-from .product-added-modal__panel { opacity: 0; transform: translateY(36px) scale(0.9); }
.added-modal-leave-to .product-added-modal__panel { opacity: 0; transform: translateY(18px) scale(0.96); }

@keyframes modal-check-pop {
  from { opacity: 0; transform: scale(0.35) rotate(-22deg); }
  to { opacity: 1; transform: scale(1) rotate(0); }
}
</style>
