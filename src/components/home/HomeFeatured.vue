<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ProductCard from '@/components/catalog/ProductCard.vue'
import ProductQuickView from '@/components/catalog/ProductQuickView.vue'
import ProductService, { type ProductDTO } from '@/services/ProductService'

/** Lo más pedido: los destacados del menú, con precio y el mismo "Agregar" del catálogo. */
const products = ref<ProductDTO[]>([])
const loading = ref(true)
const selected = ref<ProductDTO | null>(null)

onMounted(async () => {
  try {
    const response = await ProductService.getPaginated({ page: 1, limit: 24, available: true })
    const payload = response.data as unknown as { data?: ProductDTO[] } | ProductDTO[]
    const list = Array.isArray(payload) ? payload : payload.data || []
    // Primero los destacados con foto; si faltan, se completa con el resto del menú.
    const withPhoto = list.filter((product) => product.images?.[0]?.url)
    const featured = withPhoto.filter((product) => product.isFeatured)
    products.value = [...featured, ...withPhoto.filter((product) => !product.isFeatured)].slice(0, 8)
  } catch {
    products.value = []
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="featured" aria-labelledby="featured-title">
    <header class="featured__head">
      <div>
        <p class="eyebrow">Lo más pedido</p>
        <h2 id="featured-title">Los favoritos de la casa</h2>
      </div>
      <RouterLink class="featured__all" to="/catalogo">Ver todo el menú <i class="fa-solid fa-arrow-right" aria-hidden="true" /></RouterLink>
    </header>

    <div v-if="loading" class="featured__rail" aria-hidden="true">
      <span v-for="n in 4" :key="n" class="featured__skeleton" />
    </div>
    <div v-else-if="products.length" class="featured__rail">
      <div v-for="product in products" :key="product._id" class="featured__item">
        <ProductCard :product="product" @open="selected = product" />
      </div>
    </div>
    <RouterLink v-else class="featured__fallback" to="/catalogo">Ver el menú completo <i class="fa-solid fa-arrow-right" aria-hidden="true" /></RouterLink>

    <ProductQuickView :product="selected" @close="selected = null" />
  </section>
</template>

<style scoped lang="scss">
.featured { display: flex; flex-direction: column; gap: 1.1rem; }

.featured__head {
  align-items: flex-end;
  display: flex;
  gap: 1rem;
  justify-content: space-between;

  h2 { color: #102719; font-size: clamp(1.7rem, 5vw, 2.6rem); font-weight: 800; letter-spacing: -0.045em; line-height: 1; margin: 0; }
}

.eyebrow { color: #00a523; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.16em; margin: 0 0 0.45rem; text-transform: uppercase; }

.featured__all {
  align-items: center;
  color: #235931;
  display: none;
  flex: 0 0 auto;
  font-size: 0.9rem;
  font-weight: 800;
  gap: 0.45rem;

  &:hover { text-decoration: underline; text-underline-offset: 4px; }
}

/* Celular: carrusel horizontal con imán; escritorio: 4 por fila. */
.featured__rail {
  display: flex;
  gap: 0.85rem;
  margin: 0 -1rem;
  overflow-x: auto;
  padding: 0.25rem 1rem 1rem;
  scroll-padding: 1rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
}

.featured__item { display: flex; flex: 0 0 68%; scroll-snap-align: start; }
.featured__item > :deep(*) { width: 100%; }

.featured__skeleton { animation: pulse 1.4s ease-in-out infinite; background: #e8ebe2; border-radius: 22px; flex: 0 0 68%; height: 300px; }

.featured__fallback { align-self: flex-start; color: #235931; font-weight: 800; }

@keyframes pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }

@media (prefers-reduced-motion: reduce) { .featured__skeleton { animation: none; } }

@media (min-width: 640px) {
  .featured__item, .featured__skeleton { flex-basis: 42%; }
}

@media (min-width: 1024px) {
  .featured__all { display: inline-flex; }
  .featured__rail { flex-wrap: wrap; margin: 0; overflow: visible; padding: 0; }
  .featured__item, .featured__skeleton { flex: 1 1 calc(25% - 0.85rem); max-width: calc(25% - 0.64rem); }
}
</style>
