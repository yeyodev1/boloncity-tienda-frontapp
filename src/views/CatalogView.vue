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
const searchTerm = ref('')
const loading = ref(true)
const currentPage = ref(1)
const pageSize = 10

const visibleCategories = computed(() => categories.value.filter((category) => category.productsCount || !category.parentCategory))
const selectedCategoryLabel = computed(() => categories.value.find((category) => category.slug === selectedCategory.value)?.name || 'Todas')
const filteredProducts = computed(() => {
  const query = searchTerm.value.trim().toLowerCase()
  if (!query) return products.value

  return products.value.filter((product) => {
    const categoryNames = product.categories?.map((category) => category.name).join(' ') || ''
    return [product.name, product.code, product.description, categoryNames].some((value) => value?.toLowerCase().includes(query))
  })
})

const featuredProducts = computed(() => filteredProducts.value.filter((product) => product.isFeatured).slice(0, 4))
const pageCount = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / pageSize)))
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredProducts.value.slice(start, start + pageSize)
})
const paginationStart = computed(() => (filteredProducts.value.length ? (currentPage.value - 1) * pageSize + 1 : 0))
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize, filteredProducts.value.length))

function goToPage(page: number) {
  currentPage.value = Math.min(Math.max(page, 1), pageCount.value)
}

async function loadData() {
  loading.value = true
  const [productsResponse, categoriesResponse] = await Promise.all([
    ProductService.getAll({ available: true, ...(selectedCategory.value ? { category: selectedCategory.value } : {}) }),
    CategoryService.getAll(),
  ])

  products.value = productsResponse.data
  categories.value = categoriesResponse.data
  loading.value = false
}

watch(selectedCategory, () => {
  currentPage.value = 1
  loadData()
})

watch(searchTerm, () => {
  currentPage.value = 1
})

watch(pageCount, () => {
  if (currentPage.value > pageCount.value) currentPage.value = pageCount.value
})

onMounted(loadData)
</script>

<template>
  <div class="catalog-page">
    <StoreHeader />

    <main class="catalog-page__main">
      <section class="catalog-hero">
        <div class="catalog-hero__copy">
          <p class="catalog-hero__eyebrow">Catálogo</p>
          <h1>
            El menú
            <span>Boloncity</span>
          </h1>
          <p>
            Bolones, tigrillos, combos, bebidas y extras organizados para elegir rápido sin perderte entre opciones.
          </p>
        </div>

        <div class="catalog-hero__meta">
          <span>{{ filteredProducts.length }} visibles</span>
          <span>{{ products.length }} productos</span>
          <span>{{ visibleCategories.length }} categorías</span>
        </div>
      </section>

      <section class="catalog-panel">
        <div class="catalog-tools">
          <div>
            <p class="catalog-tools__eyebrow">Explora por antojo</p>
            <h2>{{ selectedCategoryLabel }}</h2>
          </div>

          <label class="catalog-search">
            <span>Buscar</span>
            <input v-model="searchTerm" type="search" placeholder="Bolón, café, combo..." />
          </label>
        </div>

        <CategoryTabs v-model="selectedCategory" :categories="visibleCategories" />

        <div v-if="featuredProducts.length" class="featured-strip" aria-label="Productos destacados">
          <article v-for="product in featuredProducts" :key="product._id" class="featured-pill">
            <span>{{ product.categories?.[1]?.name || product.categories?.[0]?.name || 'Favorito' }}</span>
            <strong>{{ product.name }}</strong>
            <small>${{ product.price.toFixed(2) }}</small>
          </article>
        </div>

        <SkeletonLoader v-if="loading" type="card" :count="6" />

        <template v-else-if="filteredProducts.length">
          <div class="catalog-results">
            <ProductCard v-for="product in paginatedProducts" :key="product._id" :product="product" />
          </div>

          <nav class="catalog-pagination" aria-label="Paginación del catálogo">
            <p>
              Mostrando {{ paginationStart }}-{{ paginationEnd }} de {{ filteredProducts.length }} productos
            </p>

            <div class="catalog-pagination__controls">
              <button type="button" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">
                Anterior
              </button>
              <button
                v-for="page in pageCount"
                :key="page"
                type="button"
                :class="{ active: page === currentPage }"
                :aria-current="page === currentPage ? 'page' : undefined"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
              <button type="button" :disabled="currentPage === pageCount" @click="goToPage(currentPage + 1)">
                Siguiente
              </button>
            </div>
          </nav>
        </template>

        <div v-else class="catalog-empty">
          <p class="catalog-empty__eyebrow">Sin resultados</p>
          <h2>No encontramos ese producto</h2>
          <p>Prueba con otra palabra o vuelve a ver todas las categorías.</p>
          <button type="button" @click="searchTerm = ''; selectedCategory = ''">Limpiar búsqueda</button>
        </div>
      </section>
    </main>

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.catalog-page {
  background:
    radial-gradient(circle at 8% 0%, rgba(239, 213, 55, 0.18), transparent 34%),
    linear-gradient(180deg, #f8f6ec 0%, #f4f4f0 42%, #ffffff 100%);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: hidden;
}

.catalog-page__main {
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  gap: clamp(1rem, 3vw, 1.5rem);
  margin: 0 auto;
  max-width: 1480px;
  padding: clamp(1.25rem, 4vw, 2.5rem) 1rem 0;
  width: 100%;
}

.catalog-hero,
.catalog-panel {
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 28px;
  box-shadow: 0 22px 54px rgba(26, 26, 26, 0.08);
  margin: 0;
  padding: clamp(1.15rem, 4vw, 2rem);
}

.catalog-hero {
  align-items: flex-start;
  background:
    linear-gradient(135deg, rgba(35, 89, 49, 0.96), rgba(12, 34, 18, 0.94)),
    radial-gradient(circle at 90% 15%, rgba(239, 213, 55, 0.25), transparent 28%);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
  position: relative;
}

.catalog-hero::after {
  background: rgba(239, 213, 55, 0.16);
  border-radius: 999px;
  content: '';
  height: 220px;
  position: absolute;
  right: -90px;
  top: -90px;
  width: 220px;
}

.catalog-hero__copy,
.catalog-hero__meta {
  min-width: 0;
  position: relative;
  z-index: 1;
}

.catalog-hero__eyebrow {
  @include eyebrow;
  color: #efd537;
  margin-bottom: 0.5rem;
}

h1 {
  font-size: clamp(2.8rem, 6vw, 5rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.9;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

h1 span {
  color: transparent;
  -webkit-text-stroke: 1.5px rgba(255, 255, 255, 0.86);
}

.catalog-hero p {
  color: rgba(255, 255, 255, 0.78);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.65;
  margin-top: 1rem;
  max-width: 36rem;
}

.catalog-hero__meta {
  align-self: flex-start;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.catalog-hero__meta span {
  @include pill-button(rgba(255, 255, 255, 0.12), #fff);
  border-color: rgba(255, 255, 255, 0.14);
  min-height: 42px;
  padding: 0.7rem 1rem;
  white-space: nowrap;
}

.catalog-panel {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
}

.catalog-tools {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.25rem;
  min-width: 0;
}

.catalog-tools__eyebrow,
.catalog-empty__eyebrow {
  @include eyebrow;
  color: #00a523;
  margin-bottom: 0.35rem;
}

.catalog-tools h2,
.catalog-empty h2 {
  font-size: clamp(1.7rem, 3vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1;
  text-transform: uppercase;
  overflow-wrap: anywhere;
}

.catalog-search {
  background: #fff;
  border: 1px solid rgba(26, 26, 26, 0.08);
  border-radius: 20px;
  box-shadow: 0 14px 34px rgba(26, 26, 26, 0.05);
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 0.9rem 1rem;
  width: 100%;
}

.catalog-search input {
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  min-height: 34px;
  padding: 0;
}

.catalog-search input:focus {
  box-shadow: none;
}

.catalog-search span {
  color: rgba(26, 26, 26, 0.58);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.featured-strip {
  display: flex;
  gap: 0.85rem;
  margin: 0 0 1.25rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scrollbar-width: thin;
}

.featured-pill {
  background: linear-gradient(135deg, #235931, #102719);
  border-radius: 20px;
  color: #fff;
  display: flex;
  flex: 0 0 min(260px, 82vw);
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  padding: 1rem;
}

.featured-pill span {
  color: #efd537;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.featured-pill strong {
  line-height: 1.1;
  overflow-wrap: anywhere;
}

.featured-pill small {
  color: rgba(255, 255, 255, 0.72);
  font-weight: 800;
}

.catalog-results {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: stretch;
}

.catalog-results > * {
  flex: 0 1 100%;
  min-width: 0;
}

.catalog-empty {
  align-items: center;
  background: rgba(35, 89, 49, 0.04);
  border: 1px dashed rgba(35, 89, 49, 0.22);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 2rem 1rem;
  text-align: center;
}

.catalog-empty button {
  @include pill-button(#235931, #fff);
}

.catalog-pagination {
  align-items: center;
  border-top: 1px solid rgba(26, 26, 26, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
}

.catalog-pagination p {
  color: rgba(26, 26, 26, 0.62);
  font-weight: 800;
  text-align: center;
}

.catalog-pagination__controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.catalog-pagination__controls button {
  @include pill-button(#fff, #235931);
  border-color: rgba(35, 89, 49, 0.14);
  min-height: 42px;
  min-width: 42px;
  padding: 0.7rem 0.95rem;
}

.catalog-pagination__controls button.active {
  background: #235931;
  color: #fff;
}

.catalog-pagination__controls button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media (min-width: 641px) {
  .catalog-page__main {
    padding: 0 1.25rem;
  }

  .catalog-results {
    gap: 1.1rem;
  }

  .catalog-results > * {
    flex-basis: calc((100% - 1.1rem) / 2);
  }
}

@media (min-width: 901px) {
  .catalog-hero {
    align-items: flex-end;
    flex-direction: row;
  }

  .catalog-hero > *:first-child {
    flex: 1.5 1 0;
  }

  .catalog-hero > *:last-child {
    flex: 0.7 1 220px;
  }

  .catalog-hero__meta {
    align-self: flex-end;
    align-items: flex-end;
  }

  .catalog-tools {
    align-items: flex-end;
    flex-direction: row;
    justify-content: space-between;
  }

  .catalog-search {
    max-width: 360px;
  }

  .catalog-pagination {
    align-items: center;
    flex-direction: row;
  }

  .catalog-pagination p {
    text-align: left;
  }
}

@media (min-width: 1100px) {
  .catalog-results > * {
    flex-basis: calc((100% - 2.2rem) / 3);
  }
}

@media (min-width: 1380px) {
  .catalog-results > * {
    flex-basis: calc((100% - 3.3rem) / 4);
  }
}
</style>
