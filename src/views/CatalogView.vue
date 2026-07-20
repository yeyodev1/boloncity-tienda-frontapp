<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
const totalProducts = ref(0)
const pageCount = ref(1)
let searchTimer: ReturnType<typeof setTimeout> | undefined
let latestRequest = 0

const visibleCategories = computed(() => categories.value.filter((category) => category.productsCount || !category.parentCategory))
const selectedCategoryLabel = computed(() => categories.value.find((category) => category.slug === selectedCategory.value)?.name || 'Todas')
const featuredProducts = computed(() => products.value.filter((product) => product.isFeatured).slice(0, 4))
const paginationStart = computed(() => (totalProducts.value ? (currentPage.value - 1) * pageSize + 1 : 0))
const paginationEnd = computed(() => Math.min(currentPage.value * pageSize, totalProducts.value))

async function goToPage(page: number) {
  const nextPage = Math.min(Math.max(page, 1), pageCount.value)
  if (nextPage === currentPage.value || loading.value) return
  currentPage.value = nextPage
  document.querySelector('.catalog-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  await loadProducts()
}

async function loadProducts() {
  const requestId = ++latestRequest
  loading.value = true
  products.value = []

  try {
    const response = await ProductService.getPaginated({
      page: currentPage.value,
      limit: pageSize,
      available: true,
      category: selectedCategory.value || undefined,
      q: searchTerm.value.trim() || undefined,
    })
    if (requestId !== latestRequest) return

    const payload = response.data as typeof response.data | ProductDTO[]
    if (Array.isArray(payload)) {
      totalProducts.value = payload.length
      pageCount.value = Math.max(1, Math.ceil(payload.length / pageSize))
      const start = (currentPage.value - 1) * pageSize
      products.value = payload.slice(start, start + pageSize)
    } else {
      products.value = payload.data
      currentPage.value = payload.pagination.page
      pageCount.value = payload.pagination.totalPages
      totalProducts.value = payload.pagination.total
    }
  } catch {
    if (requestId !== latestRequest) return
    products.value = []
    currentPage.value = 1
    pageCount.value = 1
    totalProducts.value = 0
  } finally {
    if (requestId === latestRequest) loading.value = false
  }
}

async function loadData() {
  const [categoriesResponse] = await Promise.all([CategoryService.getAll(), loadProducts()])
  categories.value = categoriesResponse.data
}

watch(selectedCategory, () => {
  currentPage.value = 1
  loadProducts()
})

watch(searchTerm, () => {
  latestRequest += 1
  currentPage.value = 1
  loading.value = true
  products.value = []
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadProducts, 350)
})

onMounted(loadData)
onBeforeUnmount(() => clearTimeout(searchTimer))
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
          <span>{{ totalProducts }} visibles</span>
          <span>Página {{ currentPage }} de {{ pageCount }}</span>
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

        <div v-if="!loading && featuredProducts.length" class="featured-strip" aria-label="Productos destacados">
          <article v-for="product in featuredProducts" :key="product._id" class="featured-pill">
            <span>{{ product.categories?.[1]?.name || product.categories?.[0]?.name || 'Favorito' }}</span>
            <strong>{{ product.name }}</strong>
            <small>${{ product.price.toFixed(2) }}</small>
          </article>
        </div>

        <SkeletonLoader v-if="loading" type="product" :count="pageSize" />

        <template v-else-if="products.length">
          <div class="catalog-results">
            <ProductCard v-for="product in products" :key="product._id" :product="product" />
          </div>

          <nav class="catalog-pagination" aria-label="Paginación del catálogo">
            <p>
              Mostrando {{ paginationStart }}-{{ paginationEnd }} de {{ totalProducts }} productos
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
  gap: clamp(2rem, 5vw, 4rem);
  margin: 0 auto;
  max-width: 1480px;
  padding: clamp(1.5rem, 4vw, 3rem) 1rem clamp(3rem, 7vw, 6rem);
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
  display: flex;
  flex-direction: column;
  gap: clamp(1.75rem, 4vw, 3rem);
}

.catalog-tools {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  margin: 0;
  overflow-x: auto;
  padding: 0.15rem 0 0.5rem;
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
  gap: 1.25rem;
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
  margin-top: 0.25rem;
  padding-top: clamp(1.5rem, 3vw, 2.25rem);
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
    padding: clamp(2rem, 4vw, 3.5rem) 1.25rem clamp(4rem, 7vw, 7rem);
  }

  .catalog-results {
    gap: 1.5rem;
  }

  .catalog-results > * {
    flex-basis: calc((100% - 1.5rem) / 2);
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
    flex-basis: calc((100% - 3rem) / 3);
  }
}

@media (min-width: 1380px) {
  .catalog-results > * {
    flex-basis: calc((100% - 4.5rem) / 4);
  }
}
</style>
