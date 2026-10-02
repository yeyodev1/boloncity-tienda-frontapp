<script setup lang="ts">
import type { ProductDTO } from '@/services/ProductService'
import { displayProductName, isCustomerCategory } from '@/utils/productName'

defineProps<{
  products: ProductDTO[]
  loading?: boolean
  currentPage: number
  totalPages: number
  activeBranchName: string
  categoriesById: Map<string, { name: string }>
  branchesById: Map<string, { name: string }>
  isAvailableAtBranch: (product: ProductDTO) => boolean
  isImageLoaded: (id: string) => boolean
}>()
const emit = defineEmits<{ edit: [product: ProductDTO]; remove: [product: ProductDTO]; imageLoaded: [id: string]; reset: []; page: [page: number] }>()

/** Solo las categorías que ve el cliente ("Bolones clásicos"), nunca los grupos internos del POS. */
function visibleCategories(product: ProductDTO, byId: Map<string, { name: string }>) {
  return (product.categories || [])
    .map((category) => ({ id: category._id, name: byId.get(category._id)?.name || category.name }))
    .filter((category) => category.name && isCustomerCategory(category))
}

function scope(product: ProductDTO, byId: Map<string, { name: string }>) {
  const only = product.branches || []
  if (only.length) return `Solo en ${only.map((branch) => byId.get(branch._id)?.name || branch.name).join(', ')}`
  const except = product.unavailableBranches || []
  if (except.length) return `Todas, menos ${except.length} ${except.length === 1 ? 'local' : 'locales'}`
  return 'Todos los locales'
}
</script>

<template>
  <section class="products cui-panel" aria-live="polite">
    <ul v-if="loading" class="products__list" aria-hidden="true">
      <li v-for="n in 6" :key="n" class="row row--skeleton">
        <span class="sk sk--thumb" /><span class="sk-lines"><span class="sk sk--title" /><span class="sk sk--text" /></span><span class="sk sk--price" />
      </li>
    </ul>

    <Transition v-else name="list-fade" mode="out-in">
      <ul v-if="products.length" :key="`${currentPage}-${products.length}`" class="products__list">
        <li v-for="product in products" :key="product._id" class="row" :class="{ 'is-off': !isAvailableAtBranch(product) }">
          <button type="button" class="row__thumb" :aria-label="`Editar ${displayProductName(product.name)}`" @click="emit('edit', product)">
            <span v-if="product.images[0]?.url && !isImageLoaded(product._id)" class="sk sk--fill" />
            <img v-if="product.images[0]?.url" :class="{ loaded: isImageLoaded(product._id) }" :src="product.images[0].url" :alt="displayProductName(product.name)" loading="lazy" @load="emit('imageLoaded', product._id)" />
            <i v-else class="fa-solid fa-utensils" aria-hidden="true" />
          </button>

          <div class="row__main">
            <div class="row__title">
              <button type="button" class="row__name" @click="emit('edit', product)">{{ displayProductName(product.name) }}</button>
              <span v-if="product.isBestSeller" class="cui-chip cui-chip--yellow"><i class="fa-solid fa-fire" /> Best seller</span>
              <span v-else-if="product.isFeatured" class="cui-chip cui-chip--yellow"><i class="fa-solid fa-star" /> Destacado</span>
            </div>
            <p class="row__meta">
              <span v-if="product.code" class="row__code">{{ product.code }}</span>
              <span v-for="category in visibleCategories(product, categoriesById).slice(0, 2)" :key="category.id">{{ displayProductName(category.name) }}</span>
              <span class="row__scope"><i class="fa-solid fa-store" aria-hidden="true" /> {{ scope(product, branchesById) }}</span>
            </p>
            <p v-if="activeBranchName && !isAvailableAtBranch(product) && product.isAvailable" class="row__notice">
              <i class="fa-solid fa-circle-exclamation" aria-hidden="true" /> No se vende en {{ activeBranchName }}
            </p>
          </div>

          <div class="row__side">
            <span class="cui-price">${{ product.price.toFixed(2) }}</span>
            <div class="row__chips">
              <span class="cui-chip" :class="product.isAvailable ? 'cui-chip--good' : 'cui-chip--warn'">{{ product.isAvailable ? 'Visible' : 'Oculto' }}</span>
              <span v-if="product.pointsValue" class="cui-chip cui-chip--accent">+{{ product.pointsValue }} pts</span>
              <span v-if="!(product.sellWithoutStock ?? product.stock < 0)" class="cui-chip" :class="{ 'cui-chip--bad': product.stock <= 0 }">{{ product.stock }} en stock</span>
            </div>
          </div>

          <div class="row__actions">
            <button type="button" class="cui-btn cui-btn--ghost row__edit" :aria-label="`Editar ${displayProductName(product.name)}`" @click="emit('edit', product)"><i class="fa-solid fa-pen" /><span>Editar</span></button>
            <button type="button" class="cui-icon-btn is-danger" :aria-label="`Eliminar ${displayProductName(product.name)}`" title="Eliminar" @click="emit('remove', product)"><i class="fa-solid fa-trash" /></button>
          </div>
        </li>
      </ul>

      <div v-else class="cui-empty">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
        <strong>No hay productos con estos filtros</strong>
        <p>Prueba con otra palabra o limpia los filtros para ver todo el catálogo.</p>
        <button type="button" class="cui-btn cui-btn--ghost" @click="emit('reset')">Limpiar filtros</button>
      </div>
    </Transition>

    <nav v-if="!loading && totalPages > 1" class="pager" aria-label="Paginación de productos">
      <button type="button" class="cui-btn cui-btn--ghost" :disabled="currentPage === 1" @click="emit('page', currentPage - 1)"><i class="fa-solid fa-arrow-left" /> Anterior</button>
      <span>Página <strong>{{ currentPage }}</strong> de {{ totalPages }}</span>
      <button type="button" class="cui-btn cui-btn--ghost" :disabled="currentPage === totalPages" @click="emit('page', currentPage + 1)">Siguiente <i class="fa-solid fa-arrow-right" /></button>
    </nav>
  </section>
</template>

<style scoped lang="scss">
.products { overflow: hidden; }
.products__list { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }

.row {
  align-items: center;
  border-top: 1px solid var(--admin-line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 0.85rem;
  padding: 0.85rem 0.9rem;
  transition: background-color 0.2s ease;

  &:first-child { border-top: 0; }
  &:hover { background: var(--admin-hover); }
}

.row__thumb {
  background: var(--admin-surface-2);
  border: 0;
  border-radius: 14px;
  color: var(--admin-subtle);
  cursor: pointer;
  flex: 0 0 60px;
  height: 60px;
  overflow: hidden;
  padding: 0;
  position: relative;

  img { display: block; height: 100%; object-fit: cover; opacity: 0; transition: opacity 0.3s ease, transform 0.35s var(--admin-ease); width: 100%; }
  img.loaded { opacity: 1; }
  &:hover img { transform: scale(1.06); }
  > i { font-size: 1.1rem; }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
}

.row.is-off .row__thumb img { filter: grayscale(0.85); opacity: 0.6; }

.row__main { display: flex; flex: 1 1 calc(100% - 76px); flex-direction: column; gap: 0.25rem; min-width: 0; }

.row__title { align-items: center; display: flex; flex-wrap: wrap; gap: 0.4rem; }

.row__name {
  background: transparent;
  border: 0;
  color: var(--admin-text);
  cursor: pointer;
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  line-height: 1.2;
  padding: 0;
  text-align: left;

  &:hover { color: var(--admin-accent); }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
}

.row__meta {
  color: var(--admin-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.76rem;
  gap: 0.2rem 0.6rem;
  margin: 0;

  > span + span::before { color: var(--admin-subtle); content: '·'; margin-right: 0.6rem; }
}

.row__code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.72rem; }
.row__scope i { font-size: 0.68rem; margin-right: 0.15rem; }

.row__notice { align-items: center; color: var(--admin-warning); display: flex; font-size: 0.74rem; font-weight: 700; gap: 0.35rem; margin: 0; }

.row__side {
  align-items: center;
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding-left: 76px;
}

.row__chips { display: flex; flex-wrap: wrap; gap: 0.3rem; }

.row__actions { display: flex; flex: 0 0 auto; gap: 0.4rem; margin-left: auto; }

/* En celular el lápiz va solo, para que precio, estado y acciones quepan en una línea. */
.row__edit { border-radius: 12px; height: 38px; min-height: 38px; padding: 0; width: 38px; }
.row__edit span { display: none; }

.pager {
  align-items: center;
  border-top: 1px solid var(--admin-line);
  color: var(--admin-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 0.82rem;
  gap: 0.6rem;
  justify-content: space-between;
  padding: 0.75rem 0.9rem;

  strong { color: var(--admin-text); }
}

/* Carga */
.row--skeleton { pointer-events: none; }
.sk { animation: sk 1.2s ease-in-out infinite; background: var(--admin-hover); border-radius: 8px; display: block; }
.sk--thumb { border-radius: 14px; flex: 0 0 60px; height: 60px; }
.sk--fill { inset: 0; position: absolute; }
.sk-lines { display: flex; flex: 1 1 auto; flex-direction: column; gap: 0.45rem; }
.sk--title { height: 14px; width: 45%; }
.sk--text { height: 10px; width: 70%; }
.sk--price { height: 24px; width: 64px; }

@keyframes sk { 50% { opacity: 0.45; } }

.list-fade-enter-active, .list-fade-leave-active { transition: opacity 0.18s ease, transform 0.2s ease; }
.list-fade-enter-from, .list-fade-leave-to { opacity: 0; transform: translateY(6px); }

@media (min-width: 900px) {
  .row { flex-wrap: nowrap; padding: 0.75rem 1rem; }
  .row__main { flex: 1 1 auto; }
  .row__side { flex: 0 0 auto; flex-direction: column; align-items: flex-end; padding-left: 0; }
  .row__chips { justify-content: flex-end; }
  .row__actions { margin-left: 0.5rem; }
  .row__edit { border-radius: 999px; height: auto; min-height: 40px; padding: 0.55rem 1rem; width: auto; }
  .row__edit span { display: inline; }
}

@media (prefers-reduced-motion: reduce) {
  .sk { animation: none; }
  .row__thumb img, .list-fade-enter-active, .list-fade-leave-active { transition: none; }
  .row__thumb:hover img { transform: none; }
}
</style>
