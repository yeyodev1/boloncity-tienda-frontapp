<script setup lang="ts">
import type { ProductDTO } from '@/services/ProductService'
defineProps<{ products: ProductDTO[]; currentPage: number; totalPages: number; activeBranchName: string; categoriesById: Map<string, { name: string }>; branchesById: Map<string, { name: string }>; isAvailableAtBranch: (product: ProductDTO) => boolean; isImageLoaded: (id: string) => boolean }>()
const emit = defineEmits<{ edit: [product: ProductDTO]; remove: [product: ProductDTO]; imageLoaded: [id: string]; reset: []; page: [page: number] }>()
</script>

<template>
  <Transition name="catalog-fade" mode="out-in">
    <div v-if="products.length" :key="`${currentPage}-${products.length}`" class="product-list">
      <article v-for="product in products" :key="product._id" class="product-card panel">
        <div class="product-card__media">
          <div v-if="product.images[0]?.url && !isImageLoaded(product._id)" class="image-skeleton" />
          <img v-if="product.images[0]?.url" :class="{ loaded: isImageLoaded(product._id) }" :src="product.images[0].url" :alt="product.name" loading="lazy" @load="emit('imageLoaded', product._id)" />
          <div v-else class="fallback">{{ product.name.slice(0, 1) }}</div>
          <div class="badges"><span v-if="product.isBestSeller" class="highlight">Best seller</span><span v-else-if="product.isFeatured" class="highlight">Destacado</span><span :class="isAvailableAtBranch(product) ? 'good' : 'muted'">{{ isAvailableAtBranch(product) ? 'Disponible' : 'No disponible' }}</span></div>
        </div>
        <div class="product-card__body">
          <div class="head"><div><p>{{ product.code }}</p><h2>{{ product.name }}</h2></div><strong>${{ product.price.toFixed(2) }}</strong></div>
          <p class="description">{{ product.description || 'Sin descripción' }}</p>
          <p v-if="activeBranchName && !isAvailableAtBranch(product)" class="branch-notice"><i class="fa-solid fa-circle-exclamation" /> No disponible en {{ activeBranchName }}. Edita el producto para cambiarlo.</p>
          <div class="tags"><span v-for="category in product.categories" :key="category._id">{{ categoriesById.get(category._id)?.name || category.name }}</span><span v-if="!(product.branches || []).length">Global</span><span v-for="branch in product.branches || []" :key="branch._id">{{ branchesById.get(branch._id)?.name || branch.name }}</span></div>
          <div class="meta"><div><small>Precio final</small><strong>${{ product.price.toFixed(2) }}</strong></div><div><small>Stock</small><strong>{{ product.sellWithoutStock ?? product.stock < 0 ? 'Sin límite' : product.stock }}</strong></div><div><small>Rewards</small><strong>{{ product.pointsValue ? `+${product.pointsValue} pts` : 'No entrega' }}</strong></div></div>
          <div class="actions"><button type="button" @click="emit('edit', product)"><i class="fa-solid fa-pen" /> Editar</button><button class="danger" type="button" :aria-label="`Eliminar ${product.name}`" @click="emit('remove', product)"><i class="fa-solid fa-trash" /></button></div>
        </div>
      </article>
    </div>
    <div v-else class="empty panel"><i class="fa-solid fa-magnifying-glass" /><h2>No encontramos productos</h2><p>Prueba otra búsqueda o limpia los filtros.</p><button type="button" @click="emit('reset')">Limpiar filtros</button></div>
  </Transition>
  <nav v-if="totalPages > 1" class="pagination" aria-label="Paginación de productos"><button type="button" :disabled="currentPage === 1" @click="emit('page', currentPage - 1)"><i class="fa-solid fa-arrow-left" /> Anterior</button><span>Página <strong>{{ currentPage }}</strong> de {{ totalPages }}</span><button type="button" :disabled="currentPage === totalPages" @click="emit('page', currentPage + 1)">Siguiente <i class="fa-solid fa-arrow-right" /></button></nav>
</template>

<style scoped lang="scss">
.product-list { display: flex; flex-wrap: wrap; gap: 1.1rem; } .product-list > * { flex: 1 1 300px; }
.product-card { background: #fffdf7; border: 1px solid rgba(239,213,55,.2); border-radius: 24px; color: #08110d; overflow: hidden; } .product-card__media { background: linear-gradient(135deg,#235931,#08110d); border-radius: 22px; margin: .75rem; overflow: hidden; position: relative; } img, .fallback { aspect-ratio: 4 / 3; display: block; object-fit: cover; width: 100%; } img { opacity: 0; transition: opacity .35s; } img.loaded { opacity: 1; } .fallback { align-items: center; color: #fff; display: flex; font-size: 4rem; font-weight: 900; justify-content: center; } .image-skeleton { animation: shimmer 1.2s ease infinite; aspect-ratio: 4 / 3; background: linear-gradient(100deg,#dfe8df 25%,#f5f0d8 45%,#dfe8df 65%); background-size: 300% 100%; inset: 0; position: absolute; }
.badges { display: flex; gap: .5rem; left: 1rem; position: absolute; top: 1rem; } .badges span { border-radius: 999px; font-size: .72rem; font-weight: 800; padding: .45rem .7rem; text-transform: uppercase; } .highlight { background: #efd537; } .good { background: #235931; color: #fff; } .muted { background: rgba(26,26,26,.7); color: #fff; }
.product-card__body { display: flex; flex-direction: column; gap: 1rem; padding: .35rem 1.1rem 1.1rem; } .head { display: flex; gap: 1rem; justify-content: space-between; } .head p { color: #235931; font-size: .78rem; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; } h2 { font-size: 1.25rem; font-weight: 800; margin-top: .35rem; } .head > strong { background: #08110d; border-radius: 999px; color: #efd537; height: fit-content; padding: .55rem .75rem; white-space: nowrap; } .description { color: rgba(8,17,13,.68); min-height: 3rem; } .branch-notice { background: rgba(239,213,55,.18); border-radius: 12px; color: #735b00; font-size: .76rem; font-weight: 700; padding: .65rem .75rem; } .tags { display: flex; flex-wrap: wrap; gap: .5rem; } .tags span { background: rgba(35,89,49,.08); border-radius: 999px; color: #235931; font-size: .76rem; padding: .4rem .65rem; }
.meta { display: flex; flex-direction: column; gap: .65rem; } .meta div { background: rgba(255,255,255,.7); border: 1px solid rgba(8,17,13,.08); border-radius: 18px; padding: .7rem .8rem; } small { color: rgba(8,17,13,.52); display: block; font-size: .68rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; } .meta strong { display: block; margin-top: .25rem; } .actions { display: flex; gap: .65rem; } button { align-items: center; background: #235931; border: 0; border-radius: 14px; color: #fff; display: inline-flex; flex: 1; font-weight: 800; gap: .5rem; justify-content: center; min-height: 44px; } .actions .danger { background: #872323; flex: 0 0 46px; }
.empty { align-items: center; display: flex; flex-direction: column; padding: 3rem 1.25rem; text-align: center; } .empty > i { align-items: center; background: rgba(35,89,49,.08); border-radius: 50%; color: #235931; display: flex; height: 56px; justify-content: center; margin-bottom: 1rem; width: 56px; } .empty p { color: rgba(8,17,13,.6); margin: .45rem 0 1rem; } .empty button, .pagination button { border-radius: 999px; padding: .7rem 1rem; }
.pagination { align-items: center; background: rgba(255,255,255,.82); border-radius: 20px; display: flex; flex-direction: column; gap: .8rem; justify-content: space-between; padding: .85rem; } .pagination button { width: 100%; } .pagination button:disabled { background: rgba(8,17,13,.08); color: rgba(8,17,13,.38); } .catalog-fade-enter-active,.catalog-fade-leave-active { transition: opacity .2s, transform .2s; } .catalog-fade-enter-from,.catalog-fade-leave-to { opacity: 0; transform: translateY(8px); } @keyframes shimmer { to { background-position: 0 0; } } @media (min-width: 641px) { .meta { flex-direction: row; flex-wrap: wrap; } .meta > * { flex: 1 1 120px; } } @media (min-width: 769px) { .pagination { flex-direction: row; } .pagination button { width: auto; } }
</style>
