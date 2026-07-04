<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import ProductService, { type ProductDTO } from '@/services/ProductService'
import { useCartStore } from '@/stores/cart'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const product = ref<ProductDTO | null>(null)
const loading = ref(true)
const cart = useCartStore()
const { success } = useToast()
const slug = computed(() => String(route.params.slug || ''))

onMounted(async () => {
  try {
    const response = await ProductService.getBySlug(slug.value)
    product.value = response.data
  } finally {
    loading.value = false
  }
})

function addToCart() {
  if (!product.value) return
  cart.addItem({
    productId: product.value._id,
    slug: product.value.slug,
    name: product.value.name,
    price: product.value.price,
    quantity: 1,
    image: product.value.images[0]?.url,
  })
  success('Agregado al carrito')
}
</script>

<template>
  <div class="product-page">
    <StoreHeader />

    <main class="product-page__main">
      <section v-if="loading" class="product-skeleton panel">
        <SkeletonLoader type="card" :count="1" />
      </section>

      <article v-else-if="product" class="product-detail panel">
        <div class="product-detail__media">
          <img :src="product.images[0]?.url || ''" :alt="product.name" />
        </div>

        <div class="product-detail__copy">
          <p class="product-detail__eyebrow">{{ product.code }}</p>
          <h1>{{ product.name }}</h1>
          <p class="product-detail__price">${{ product.price.toFixed(2) }}</p>
          <p class="product-detail__text">{{ product.description || 'Producto disponible en catálogo.' }}</p>

          <div class="product-detail__actions">
            <button class="btn-primary" type="button" @click="addToCart">Agregar al carrito</button>
            <RouterLink class="btn-secondary" to="/catalogo">Volver al catálogo</RouterLink>
          </div>
        </div>
      </article>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.product-page {
  display: grid;
  min-height: 100vh;
}

.product-page__main {
  margin: 0 auto;
  max-width: 1400px;
  width: 100%;
}

.product-skeleton,
.product-detail {
  margin: 1.25rem;
  padding: 1.5rem;
}

.product-detail {
  display: grid;
  gap: 1.5rem;
}

.product-detail__media img {
  aspect-ratio: 1 / 1;
  border-radius: 20px;
  object-fit: cover;
  width: 100%;
}

.product-detail__copy {
  display: grid;
  gap: 1rem;
}

.product-detail__eyebrow {
  @include eyebrow;
  color: #00a523;
}

.product-detail h1 {
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.95;
  text-transform: uppercase;
}

.product-detail__price {
  color: #235931;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
  font-weight: 800;
}

.product-detail__text {
  @include body-text;
  max-width: 34rem;
}

.product-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.product-detail__actions a,
.product-detail__actions button {
  flex: 1 1 220px;
}

@media (min-width: 960px) {
  .product-detail {
    align-items: center;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  }
}
</style>
