<script setup lang="ts">
import { computed, ref } from 'vue'
import StoreHeader from '@/components/store/StoreHeader.vue'
import StoreFooter from '@/components/store/StoreFooter.vue'
import CatalogHero from '@/components/catalog/CatalogHero.vue'
import CategoryTabs from '@/components/catalog/CategoryTabs.vue'
import ProductCard from '@/components/catalog/ProductCard.vue'
import ProductGridSkeleton from '@/components/catalog/ProductGridSkeleton.vue'
import CatalogEmptyState from '@/components/catalog/CatalogEmptyState.vue'
import CatalogPagination from '@/components/catalog/CatalogPagination.vue'
import ProductQuickView from '@/components/catalog/ProductQuickView.vue'
import type { ProductDTO } from '@/services/ProductService'
import { useCatalog } from '@/composables/useCatalog'
import { useSettingsStore } from '@/stores/settings'
import { displayProductName } from '@/utils/productName'

const PAGE_SIZE = 12

// Promo global: el encabezado la anuncia una sola vez, arriba de todo.
const settings = useSettingsStore()
const promo = computed(() => settings.promo)

const {
  products,
  visibleCategories,
  selectedCategory,
  selectedCategoryLabel,
  searchTerm,
  loading,
  currentPage,
  pageCount,
  totalProducts,
  paginationStart,
  paginationEnd,
  goToPage,
  resetFilters,
} = useCatalog(PAGE_SIZE)

const selectedProduct = ref<ProductDTO | null>(null)

const resultsTitle = computed(() => (searchTerm.value.trim() ? `Resultados para “${searchTerm.value.trim()}”` : displayProductName(selectedCategoryLabel.value)))
const resultsCount = computed(() => (totalProducts.value === 1 ? '1 opción' : `${totalProducts.value} opciones`))
</script>

<template>
  <div class="catalog-page">
    <StoreHeader />

    <main class="catalog-page__main">
      <CatalogHero v-model:search="searchTerm" :promo="promo" />

      <div class="catalog-filters">
        <CategoryTabs v-model="selectedCategory" :categories="visibleCategories" />
      </div>

      <section class="catalog-results catalog-results-anchor" aria-live="polite">
        <header class="catalog-results__head">
          <h2>{{ resultsTitle }}</h2>
          <span v-if="!loading">{{ resultsCount }}</span>
        </header>

        <ProductGridSkeleton v-if="loading" :count="PAGE_SIZE" />

        <template v-else-if="products.length">
          <div class="catalog-grid">
            <ProductCard v-for="product in products" :key="product._id" :product="product" @open="selectedProduct = product" />
          </div>

          <CatalogPagination
            :page="currentPage"
            :page-count="pageCount"
            :start="paginationStart"
            :end="paginationEnd"
            :total="totalProducts"
            @go="goToPage"
          />
        </template>

        <CatalogEmptyState v-else :search="searchTerm.trim()" @reset="resetFilters" />
      </section>
    </main>

    <ProductQuickView :product="selectedProduct" @close="selectedProduct = null" />

    <StoreFooter />
  </div>
</template>

<style scoped lang="scss">
.catalog-page {
  --catalog-surface: #f7f5ec;

  background: var(--catalog-surface);
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  overflow-x: clip;
}

.catalog-page__main {
  display: flex;
  flex: 1 0 auto;
  flex-direction: column;
  gap: 1rem;
  margin: 0 auto;
  max-width: 1320px;
  padding: 5.25rem 1rem 4rem;
  width: 100%;
}

/* Las categorías quedan pegadas bajo el encabezado mientras se recorre el menú. */
.catalog-filters {
  background: var(--catalog-surface);
  margin: 0 -1rem;
  padding: 0.35rem 1rem;
  position: sticky;
  top: 4.4rem;
  z-index: 20;
}

.catalog-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  scroll-margin-top: 8.5rem;
}

.catalog-results__head {
  align-items: baseline;
  display: flex;
  gap: 0.6rem;
  justify-content: space-between;

  h2 {
    color: #102719;
    font-size: clamp(1.25rem, 4.5vw, 1.8rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  span {
    color: rgba(16, 39, 25, 0.55);
    flex: 0 0 auto;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
}

.catalog-grid {
  display: grid;
  gap: 0.7rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (min-width: 641px) {
  .catalog-page__main { gap: 1.25rem; padding: 6rem 1.25rem 5rem; }
  .catalog-filters { margin: 0 -1.25rem; padding: 0.5rem 1.25rem; top: 4.6rem; }
  .catalog-grid { gap: 1.1rem; }
}

@media (min-width: 901px) {
  .catalog-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (min-width: 1200px) {
  .catalog-grid { gap: 1.35rem; grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
</style>
