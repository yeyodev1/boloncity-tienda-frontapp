<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import ProductCard from '@/components/catalog/ProductCard.vue'
import CategoryTabs from '@/components/catalog/CategoryTabs.vue'
import ProductService, { type ProductDTO } from '@/services/ProductService'
import CategoryService, { type CategoryDTO } from '@/services/CategoryService'

const products = ref<ProductDTO[]>([])
const categories = ref<CategoryDTO[]>([])
const selectedCategory = ref('')
const loading = ref(true)

const filteredProducts = computed(() => products.value)

async function loadData() {
  loading.value = true
  const [productsResponse, categoriesResponse] = await Promise.all([
    ProductService.getAll(selectedCategory.value ? { category: selectedCategory.value } : undefined),
    CategoryService.getAll(),
  ])

  products.value = productsResponse.data
  categories.value = categoriesResponse.data
  loading.value = false
}

watch(selectedCategory, () => {
  loadData()
})

onMounted(loadData)
</script>

<template>
  <div class="catalog-page">
    <StoreHeader />

    <main class="catalog-page__main">
      <section class="catalog-hero panel">
        <div class="catalog-hero__copy">
          <p class="catalog-hero__eyebrow">Catálogo</p>
          <h1>
            La tienda
            <span>metropolitana</span>
          </h1>
          <p>
            Un catálogo sobrio, fluido y visualmente cuidadoso para descubrir cada producto sin ruido.
          </p>
        </div>

        <div class="catalog-hero__meta">
          <span>{{ products.length }} productos</span>
          <span>{{ categories.length }} categorías</span>
        </div>
      </section>

      <section class="catalog-panel panel">
        <CategoryTabs v-model="selectedCategory" :categories="categories" />

        <SkeletonLoader v-if="loading" type="card" :count="6" />

        <div v-else class="catalog-grid">
          <ProductCard v-for="product in filteredProducts" :key="product._id" :product="product" />
        </div>
      </section>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.catalog-page {
  display: grid;
  min-height: 100vh;
}

.catalog-page__main {
  display: grid;
  gap: 1.25rem;
  margin: 0 auto;
  max-width: 1400px;
  width: 100%;
}

.catalog-hero,
.catalog-panel {
  margin: 0 1.25rem;
  padding: 1.5rem;
}

.catalog-hero {
  align-items: end;
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.5fr) minmax(220px, 0.7fr);
}

.catalog-hero__eyebrow {
  @include eyebrow;
  color: #00a523;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: clamp(2.8rem, 6vw, 5rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.9;
  text-transform: uppercase;
}

h1 span {
  color: transparent;
  -webkit-text-stroke: 2px #235931;
}

.catalog-hero p {
  @include body-text;
  margin-top: 1rem;
  max-width: 36rem;
}

.catalog-hero__meta {
  align-self: end;
  display: grid;
  gap: 0.6rem;
  justify-self: end;
}

.catalog-hero__meta span {
  @include pill-button(rgba(35, 89, 49, 0.08), #235931);
  min-height: 42px;
  padding: 0.7rem 1rem;
}

.catalog-grid {
  display: grid;
  gap: 1.25rem;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
}

@media (max-width: 900px) {
  .catalog-hero {
    grid-template-columns: 1fr;
  }

  .catalog-hero__meta {
    justify-self: start;
  }
}

@media (max-width: 640px) {
  .catalog-hero,
  .catalog-panel {
    margin-left: 1rem;
    margin-right: 1rem;
    padding: 1.25rem;
  }
}
</style>
