<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import BaseSelect from '@/components/global/BaseSelect.vue'
import ModalShell from '@/components/global/ModalShell.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import ProductService, { type ProductDTO } from '@/services/ProductService'
import CategoryService, { type CategoryDTO } from '@/services/CategoryService'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'

const products = ref<ProductDTO[]>([])
const categories = ref<CategoryDTO[]>([])
const branches = ref<BranchDTO[]>([])
const loading = ref(true)
const saving = ref(false)
const editorOpen = ref(false)
const editingId = ref('')
const searchQuery = ref('')
const selectedCategoryFilter = ref('')
const code = ref('')
const name = ref('')
const description = ref('')
const price = ref(0)
const cost = ref(0)
const categoriesSelected = ref<string[]>([])
const branchesSelected = ref<string[]>([])
const hasIva = ref(false)
const ivaRate = ref(15)
const isAvailable = ref(true)
const isFeatured = ref(false)
const stock = ref(-1)
const pointsValue = ref(0)
const scheduledActivation = ref('')
const scheduledDeactivation = ref('')
const sortOrder = ref(0)
const imageFile = ref<File | null>(null)
const imagePreview = ref('')
const existingImagePublicId = ref('')
const loadedImages = ref(new Set<string>())
const currentPage = ref(1)
const pageSize = 12
const { confirm } = useConfirm()
const { success, error } = useToast()

const categoriesById = computed(() => new Map(categories.value.map((category) => [category._id, category])))
const branchesById = computed(() => new Map(branches.value.map((branch) => [branch._id, branch])))
const categoryOptions = computed(() => categories.value.map((c) => ({ value: c._id, label: c.name })))
const branchOptions = computed(() => branches.value.map((b) => ({ value: b._id, label: b.name })))

const featuredCount = computed(() => products.value.filter((product) => product.isFeatured).length)
const availableCount = computed(() => products.value.filter((product) => product.isAvailable).length)
const totalCategories = computed(() => categories.value.length)

const filteredProducts = computed(() => {
  let result = products.value

  if (selectedCategoryFilter.value) {
    result = result.filter((product) => product.categories.some((category) => category._id === selectedCategoryFilter.value))
  }

  if (searchQuery.value.trim()) {
    const term = searchQuery.value.trim().toLowerCase()
    result = result.filter((product) => {
      return [product.code, product.name, product.description || '']
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }

  return result
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / pageSize)))
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredProducts.value.slice(start, start + pageSize)
})
const resultRange = computed(() => {
  if (!filteredProducts.value.length) return '0 productos'
  const start = (currentPage.value - 1) * pageSize + 1
  const end = Math.min(currentPage.value * pageSize, filteredProducts.value.length)
  return `${start}-${end} de ${filteredProducts.value.length}`
})

async function load() {
  loading.value = true
  try {
    const [productsResponse, categoriesResponse, branchesResponse] = await Promise.all([
      ProductService.getAll(),
      CategoryService.getAll(),
      BranchService.getAll(),
    ])
    products.value = productsResponse.data
    categories.value = categoriesResponse.data
    branches.value = branchesResponse.data
  } catch {
    error('No se pudo cargar el catálogo')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = ''
  code.value = ''
  name.value = ''
  description.value = ''
  price.value = 0
  cost.value = 0
  categoriesSelected.value = []
  branchesSelected.value = []
  hasIva.value = false
  ivaRate.value = 15
  isAvailable.value = true
  isFeatured.value = false
  stock.value = -1
  pointsValue.value = 0
  scheduledActivation.value = ''
  scheduledDeactivation.value = ''
  sortOrder.value = 0
  imageFile.value = null
  imagePreview.value = ''
  existingImagePublicId.value = ''
}

function openCreateModal() {
  resetForm()
  editorOpen.value = true
}

function fillForm(product: ProductDTO) {
  editingId.value = product._id
  code.value = product.code
  name.value = product.name
  description.value = product.description || ''
  price.value = product.price
  cost.value = product.cost || 0
  categoriesSelected.value = product.categories.map((category) => category._id)
  branchesSelected.value = product.branches?.map((branch) => branch._id) || []
  hasIva.value = product.hasIva
  ivaRate.value = product.ivaRate
  isAvailable.value = product.isAvailable
  isFeatured.value = product.isFeatured
  stock.value = product.stock
  pointsValue.value = product.pointsValue
  sortOrder.value = 0
  imageFile.value = null
  imagePreview.value = product.images[0]?.url || ''
  existingImagePublicId.value = product.images[0]?.publicId || ''
  editorOpen.value = true
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0] || null
  imageFile.value = file
  if (file) {
    imagePreview.value = URL.createObjectURL(file)
  }
}

function clearImageSelection() {
  imageFile.value = null
  imagePreview.value = ''
}

function markImageLoaded(id: string) {
  loadedImages.value = new Set(loadedImages.value).add(id)
}

function isImageLoaded(id: string) {
  return loadedImages.value.has(id)
}

function resetFilters() {
  searchQuery.value = ''
  selectedCategoryFilter.value = ''
}

function closeEditor() {
  editorOpen.value = false
  setTimeout(() => {
    resetForm()
  }, 150)
}

async function submit() {
  try {
    saving.value = true
    const payload = {
      code: code.value,
      name: name.value,
      description: description.value,
      price: Number(price.value),
      cost: Number(cost.value),
      categories: categoriesSelected.value,
      branches: branchesSelected.value,
      hasIva: hasIva.value,
      ivaRate: Number(ivaRate.value),
      isAvailable: isAvailable.value,
      isFeatured: isFeatured.value,
      stock: Number(stock.value),
      pointsValue: Number(pointsValue.value),
      scheduledActivation: scheduledActivation.value || null,
      scheduledDeactivation: scheduledDeactivation.value || null,
      sortOrder: Number(sortOrder.value),
      branchPrices: JSON.stringify([]),
    }

    const response = editingId.value ? await ProductService.update(editingId.value, payload) : await ProductService.create(payload)
    const product = response.data

    if (imageFile.value && product._id) {
      await ProductService.uploadImage(product._id, imageFile.value, Boolean(editingId.value))
    } else if (editingId.value && existingImagePublicId.value && !imagePreview.value) {
      await ProductService.deleteImage(product._id, existingImagePublicId.value)
    }

    success(editingId.value ? 'Producto actualizado' : 'Producto creado')
    closeEditor()
    await load()
  } catch {
    error('No se pudo guardar el producto')
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  const ok = await confirm({ title: 'Eliminar producto', message: 'Se eliminaran sus imagenes de Cloudinary. Continuar?', type: 'danger' })
  if (!ok) return
  await ProductService.remove(id)
  success('Producto eliminado')
  await load()
}

onMounted(load)

watch([searchQuery, selectedCategoryFilter], () => {
  currentPage.value = 1
})

watch(totalPages, (pages) => {
  if (currentPage.value > pages) currentPage.value = pages
})
</script>

<template>
  <AdminLayout>
    <section class="admin-products">
      <header class="admin-products__hero panel">
        <div>
          <p class="admin-products__eyebrow"><span /> Centro de catálogo</p>
          <h1>Tu menú, bajo control.</h1>
          <p>Edita disponibilidad, precios e imágenes sin perderte entre formularios.</p>
        </div>

        <div class="admin-products__hero-actions">
          <span class="admin-products__sync"><i class="fa-solid fa-cloud" /> {{ loading ? 'Sincronizando...' : `${products.length} sincronizados` }}</span>
          <button class="admin-products__cta" type="button" @click="openCreateModal"><i class="fa-solid fa-plus" /> Nuevo producto</button>
        </div>
      </header>

      <SkeletonLoader v-if="loading" type="card" :count="4" />
      <section v-else class="admin-products__stats reveal-content">
        <article class="panel stat-card">
          <span><i class="fa-solid fa-box-open" /> Productos</span>
          <strong>{{ products.length }}</strong><small>Catálogo total</small>
        </article>
        <article class="panel stat-card">
          <span><i class="fa-solid fa-circle-check" /> Disponibles</span>
          <strong>{{ availableCount }}</strong><small>Visibles en tienda</small>
        </article>
        <article class="panel stat-card">
          <span><i class="fa-solid fa-star" /> Destacados</span>
          <strong>{{ featuredCount }}</strong><small>En primera línea</small>
        </article>
        <article class="panel stat-card">
          <span><i class="fa-solid fa-layer-group" /> Categorías</span>
          <strong>{{ totalCategories }}</strong><small>Grupos activos</small>
        </article>
      </section>

      <section class="panel admin-products__toolbar">
        <label class="toolbar-field">
          <span>Buscar producto</span>
          <div class="toolbar-field__input"><i class="fa-solid fa-magnifying-glass" /><input v-model="searchQuery" placeholder="Código, nombre o descripción" /></div>
        </label>

        <label class="toolbar-field">
          <span>Categoria</span>
          <BaseSelect v-model="selectedCategoryFilter" :options="categoryOptions" placeholder="Todas" />
        </label>

        <div class="toolbar-results"><strong>{{ loading ? 'Cargando...' : resultRange }}</strong><span>mostrados</span></div>
        <button class="toolbar-clear" type="button" @click="resetFilters"><i class="fa-solid fa-rotate-left" /> Limpiar</button>
      </section>

      <SkeletonLoader v-if="loading" type="product" :count="6" />

      <Transition name="catalog-fade" mode="out-in">
      <div v-if="!loading && paginatedProducts.length" :key="`${currentPage}-${selectedCategoryFilter}-${searchQuery}`" class="product-grid">
        <article v-for="product in paginatedProducts" :key="product._id" class="panel product-card">
          <div class="product-card__media">
            <div v-if="product.images[0]?.url && !isImageLoaded(product._id)" class="product-card__image-skeleton" />
            <img v-if="product.images[0]?.url" :class="{ 'is-loaded': isImageLoaded(product._id) }" :src="product.images[0].url" :alt="product.name" loading="lazy" @load="markImageLoaded(product._id)" />
            <div v-else class="product-card__fallback">
              <span>{{ product.name.slice(0, 1) }}</span>
            </div>
            <div class="product-card__badges">
              <span v-if="product.isFeatured" class="badge badge--highlight">Destacado</span>
              <span class="badge" :class="product.isAvailable ? 'badge--good' : 'badge--muted'">
                {{ product.isAvailable ? 'Disponible' : 'Oculto' }}
              </span>
            </div>
          </div>

          <div class="product-card__body">
            <div class="product-card__head">
              <div>
                <p class="product-card__code">{{ product.code }}</p>
                <h2>{{ product.name }}</h2>
              </div>
              <strong class="product-card__price">${{ product.price.toFixed(2) }}</strong>
            </div>

            <p class="product-card__description">{{ product.description || 'Sin descripción' }}</p>

            <div class="product-card__tags">
              <span v-for="category in product.categories" :key="category._id">{{ categoriesById.get(category._id)?.name || category.name }}</span>
              <span v-if="(product.branches || []).length === 0">Global</span>
              <span v-for="branch in (product.branches || [])" :key="branch._id">{{ branchesById.get(branch._id)?.name || branch.name }}</span>
            </div>

            <div class="product-card__meta">
              <div>
                <small>Stock</small>
                <strong>{{ product.stock >= 0 ? product.stock : '∞' }}</strong>
              </div>
              <div>
                <small>IVA</small>
                <strong>{{ product.hasIva ? `${product.ivaRate}%` : 'No' }}</strong>
              </div>
              <div>
                <small>Puntos</small>
                <strong>{{ product.pointsValue }}</strong>
              </div>
            </div>

            <div class="product-card__foot">
              <button type="button" @click="fillForm(product)"><i class="fa-solid fa-pen" /> Editar</button>
              <button class="danger" type="button" :aria-label="`Eliminar ${product.name}`" @click="remove(product._id)"><i class="fa-solid fa-trash" /></button>
            </div>
          </div>
        </article>
      </div>
      <div v-else-if="!loading" class="panel empty-products">
        <i class="fa-solid fa-magnifying-glass" />
        <h2>No encontramos productos</h2>
        <p>Prueba otra búsqueda o limpia los filtros.</p>
        <button type="button" @click="resetFilters">Limpiar filtros</button>
      </div>
      </Transition>

      <nav v-if="!loading && totalPages > 1" class="catalog-pagination" aria-label="Paginación de productos">
        <button type="button" :disabled="currentPage === 1" @click="currentPage--"><i class="fa-solid fa-arrow-left" /> Anterior</button>
        <span>Página <strong>{{ currentPage }}</strong> de {{ totalPages }}</span>
        <button type="button" :disabled="currentPage === totalPages" @click="currentPage++">Siguiente <i class="fa-solid fa-arrow-right" /></button>
      </nav>
    </section>

    <ModalShell
      :open="editorOpen"
      :title="editingId ? 'Editar producto' : 'Nuevo producto'"
      subtitle="Carga datos, imágenes y disponibilidad desde una interfaz móvil y scrollable."
      size="lg"
      @close="closeEditor"
    >
      <div class="editor-shell">
        <div class="editor-shell__preview panel">
          <div class="preview-image">
            <img v-if="imagePreview" :src="imagePreview" :alt="name || 'Vista previa'" />
            <div v-else class="preview-placeholder">
              <span>Imagen del producto</span>
            </div>
          </div>

          <label class="uploader__dropzone">
            <input class="uploader__input" type="file" accept="image/*" @change="onFileChange" />
            <span class="uploader__label">{{ imageFile ? 'Cambiar imagen' : 'Subir imagen' }}</span>
          </label>

          <button v-if="imagePreview" type="button" class="image-clear" @click="clearImageSelection">Quitar imagen</button>
        </div>

        <form id="product-editor-form" class="editor-shell__form panel" @submit.prevent="submit">
          <div class="editor-grid">
            <div class="editor-section full">
              <span>Información básica</span>
              <p>Datos visibles para el cliente y operación interna.</p>
            </div>

            <label>
              <span>Código</span>
              <input v-model="code" placeholder="Código" />
            </label>

            <label>
              <span>Nombre</span>
              <input v-model="name" placeholder="Nombre" />
            </label>

            <label class="full">
              <span>Descripción</span>
              <textarea v-model="description" placeholder="Descripción"></textarea>
            </label>

            <label>
              <span>Precio</span>
              <input v-model.number="price" type="number" step="0.01" placeholder="Precio" />
            </label>

            <label>
              <span>Costo</span>
              <input v-model.number="cost" type="number" step="0.01" placeholder="Costo" />
            </label>

            <label>
              <span>Puntos</span>
              <input v-model.number="pointsValue" type="number" placeholder="Puntos" />
            </label>

            <label>
              <span>Stock</span>
              <input v-model.number="stock" type="number" placeholder="Stock" />
            </label>

            <label>
              <span>Orden</span>
              <input v-model.number="sortOrder" type="number" placeholder="Orden" />
            </label>

            <div class="editor-section full">
              <span>Disponibilidad</span>
              <p>Controla IVA, estado público, destacados y fechas.</p>
            </div>

            <label>
              <span>Activación</span>
              <input v-model="scheduledActivation" type="datetime-local" />
            </label>

            <label>
              <span>Desactivación</span>
              <input v-model="scheduledDeactivation" type="datetime-local" />
            </label>

            <label class="field-toggle">
              <input v-model="hasIva" type="checkbox" />
              <span>Tiene IVA</span>
            </label>

            <label v-if="hasIva">
              <span>IVA %</span>
              <input v-model.number="ivaRate" type="number" placeholder="IVA %" />
            </label>

            <label class="field-toggle">
              <input v-model="isAvailable" type="checkbox" />
              <span>Disponible</span>
            </label>

            <label class="field-toggle">
              <input v-model="isFeatured" type="checkbox" />
              <span>Destacado</span>
            </label>

            <div class="editor-section full">
              <span>Organización</span>
              <p>Define categorías y sucursales donde aplica.</p>
            </div>

            <label class="full">
              <span>Categorías</span>
              <BaseSelect v-model="categoriesSelected" :options="categoryOptions" multiple />
            </label>

            <label class="full">
              <span>Sucursales</span>
              <BaseSelect v-model="branchesSelected" :options="branchOptions" multiple />
            </label>
          </div>
          <div class="editor-actions">
            <button type="button" class="secondary" @click="closeEditor">Cancelar</button>
            <button type="button" class="secondary" @click="resetForm">Limpiar</button>
            <button type="submit" :disabled="saving">
              {{ saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-products {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: clamp(0.75rem, 2vw, 1.5rem);
}

.admin-products__hero,
.admin-products__toolbar,
.admin-products__stats {
  margin-bottom: 0;
}

.admin-products__hero {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  overflow: hidden;
  padding: clamp(1.25rem, 3vw, 2rem);
  position: relative;
  background: linear-gradient(145deg, #123822 0%, #235931 58%, #2f7041 100%);
  border: 0;
  color: $white;
  box-shadow: 0 24px 60px rgba(35, 89, 49, 0.22);
}

.admin-products__hero::after {
  background: radial-gradient(circle, rgba(239, 213, 55, 0.18), transparent 64%);
  content: '';
  height: 220px;
  position: absolute;
  right: -80px;
  top: -90px;
  width: 220px;
}

.admin-products__eyebrow {
  align-items: center;
  color: rgba(255, 255, 255, 0.72);
  display: flex;
  gap: 0.55rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.admin-products__eyebrow span {
  background: #efd537;
  border-radius: 50%;
  box-shadow: 0 0 0 5px rgba(239, 213, 55, 0.14);
  height: 8px;
  width: 8px;
}

.admin-products__hero h1 {
  font-size: clamp(2rem, 4vw, 3.4rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 0.95;
  margin-top: 0.35rem;
}

.admin-products__hero p {
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.75rem;
  max-width: 42rem;
}

.admin-products__hero-actions {
  align-items: stretch;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  width: 100%;
  z-index: 1;
}

.admin-products__sync {
  align-items: center;
  color: rgba(255, 255, 255, 0.72);
  display: inline-flex;
  font-size: 0.82rem;
  gap: 0.45rem;
}

.admin-products__cta,
.toolbar-clear {
  align-items: center;
  background: linear-gradient(135deg, #efd537, #f8e98a);
  border: 0;
  border-radius: 999px;
  color: #08110d;
  display: inline-flex;
  font-weight: 800;
  min-height: 48px;
  padding: 0.85rem 1.2rem;
  position: relative;
  z-index: 1;
  justify-content: center;
  gap: 0.5rem;
}

.admin-products__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
}

.admin-products__stats > * {
  flex: 1 1 180px;
}

.stat-card {
  background: $white;
  border-radius: 20px;
  padding: 1.15rem;
  position: relative;
  box-shadow: 0 12px 30px rgba(28, 22, 12, 0.06);
}

.stat-card span {
  color: rgba($text-dark, 0.58);
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stat-card span i {
  color: #235931;
  margin-right: 0.35rem;
}

.stat-card strong {
  display: block;
  font-size: clamp(1.6rem, 4vw, 2.4rem);
  font-weight: 800;
  margin-top: 0.35rem;
}

.stat-card small {
  color: rgba($text-dark, 0.48);
  display: block;
  font-size: 0.78rem;
  margin-top: 0.2rem;
}

.admin-products__toolbar {
  align-items: stretch;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.15rem;
  box-shadow: 0 12px 30px rgba(28, 22, 12, 0.05);
}

.toolbar-field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.toolbar-field span {
  color: rgba($text-dark, 0.68);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.toolbar-field input,
.toolbar-field select {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(8, 17, 13, 0.12);
  border-radius: 16px;
  color: #08110d;
  min-height: 50px;
  padding: 0.95rem 1rem;
}

.toolbar-field__input {
  align-items: center;
  display: flex;
  position: relative;
}

.toolbar-field__input i {
  color: rgba(8, 17, 13, 0.42);
  left: 1rem;
  position: absolute;
  z-index: 1;
}

.toolbar-field__input input {
  padding-left: 2.75rem;
}

.toolbar-results {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 48px;
}

.toolbar-results strong,
.toolbar-results span {
  letter-spacing: 0;
  text-transform: none;
}

.toolbar-results span {
  color: rgba(8, 17, 13, 0.48);
  font-size: 0.75rem;
}

.toolbar-clear {
  background: rgba($secondary, 0.16);
  color: $text-dark;
}

.product-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.1rem;
}

.product-grid > * {
  flex: 1 1 300px;
}

.product-card {
  background: #fffdf7;
  color: #08110d;
  overflow: hidden;
  border: 1px solid rgba(239, 213, 55, 0.2);
  border-radius: 24px;
  box-shadow: 0 16px 36px rgba(28, 22, 12, 0.08);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease,
    border-color 180ms ease;
}

.product-card:hover {
  border-color: rgba(239, 213, 55, 0.5);
  box-shadow: 0 24px 48px rgba(35, 89, 49, 0.14);
  transform: translateY(-4px);
}

.product-card__media {
  background: linear-gradient(135deg, #235931, #08110d);
  margin: 0.75rem;
  border-radius: 22px;
  overflow: hidden;
  position: relative;
}

.product-card__media img {
  aspect-ratio: 4 / 3;
  display: block;
  opacity: 0;
  object-fit: cover;
  transition: opacity 0.35s ease, transform 0.5s ease;
  width: 100%;
}

.product-card__media img.is-loaded {
  opacity: 1;
}

.product-card:hover .product-card__media img.is-loaded {
  transform: scale(1.025);
}

.product-card__image-skeleton {
  animation: image-shimmer 1.2s ease infinite;
  aspect-ratio: 4 / 3;
  background: linear-gradient(100deg, #dfe8df 25%, #f5f0d8 45%, #dfe8df 65%);
  background-size: 300% 100%;
  inset: 0;
  position: absolute;
}

.product-card__media::after {
  background: linear-gradient(180deg, transparent 20%, rgba(8, 17, 13, 0.72) 100%);
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;
}

.product-card__fallback {
  align-items: center;
  aspect-ratio: 4 / 3;
  color: rgba(255, 255, 255, 0.92);
  display: flex;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 900;
  justify-content: center;
  letter-spacing: -0.08em;
  width: 100%;
}

.product-card__badges {
  display: flex;
  gap: 0.5rem;
  left: 1rem;
  position: absolute;
  top: 1rem;
  z-index: 1;
}

.badge {
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.45rem 0.7rem;
  text-transform: uppercase;
}

.badge--highlight {
  background: rgba(239, 213, 55, 0.96);
  color: #08110d;
}

.badge--good {
  background: rgba(35, 89, 49, 0.92);
  color: $white;
}

.badge--muted {
  background: rgba(26, 26, 26, 0.7);
  color: $white;
}

.product-card__body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.35rem 1.1rem 1.1rem;
}

.product-card__head {
  align-items: start;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.product-card__code {
  color: #235931;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.product-card h2 {
  color: #08110d;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.15;
  margin-top: 0.35rem;
}

.product-card__price {
  background: #08110d;
  border-radius: 999px;
  color: #efd537;
  font-size: 1rem;
  padding: 0.55rem 0.75rem;
  white-space: nowrap;
}

.product-card__description {
  color: rgba(8, 17, 13, 0.68);
  line-height: 1.6;
  min-height: 3rem;
}

.product-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.product-card__tags span {
  background: rgba(35, 89, 49, 0.08);
  border: 1px solid rgba(35, 89, 49, 0.12);
  border-radius: 999px;
  color: #235931;
  font-size: 0.76rem;
  padding: 0.4rem 0.65rem;
}

.product-card__meta {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.product-card__meta div {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(8, 17, 13, 0.08);
  border-radius: 18px;
  padding: 0.7rem 0.8rem;
}

.product-card__meta small {
  color: rgba(8, 17, 13, 0.52);
  display: block;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.product-card__meta strong {
  display: block;
  font-size: 0.98rem;
  font-weight: 800;
  margin-top: 0.25rem;
}

.product-card__foot {
  display: flex;
  gap: 0.65rem;
}

.product-card__foot button {
  flex: 1;
  min-height: 44px;
  border-radius: 14px;
  border: 0;
  background: #235931;
  color: $white;
  font-weight: 800;
}

.product-card__foot .danger {
  background: rgba(135, 35, 35, 0.92);
  flex: 0 0 46px;
  justify-content: center;
}

.empty-products {
  align-items: center;
  display: flex;
  flex-direction: column;
  padding: 3rem 1.25rem;
  text-align: center;
}

.empty-products > i {
  align-items: center;
  background: rgba(35, 89, 49, 0.08);
  border-radius: 50%;
  color: #235931;
  display: flex;
  font-size: 1.3rem;
  height: 56px;
  justify-content: center;
  margin-bottom: 1rem;
  width: 56px;
}

.empty-products p {
  color: rgba(8, 17, 13, 0.6);
  margin: 0.45rem 0 1rem;
}

.empty-products button,
.catalog-pagination button {
  align-items: center;
  background: #235931;
  border-radius: 999px;
  color: $white;
  display: inline-flex;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 44px;
  padding: 0.7rem 1rem;
}

.catalog-pagination {
  align-items: center;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(8, 17, 13, 0.08);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  justify-content: space-between;
  padding: 0.85rem;
}

.catalog-pagination button {
  width: 100%;
}

.catalog-pagination button:disabled {
  background: rgba(8, 17, 13, 0.08);
  color: rgba(8, 17, 13, 0.38);
}

.catalog-pagination span {
  color: rgba(8, 17, 13, 0.62);
  font-size: 0.86rem;
}

.catalog-fade-enter-active,
.catalog-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.catalog-fade-enter-from,
.catalog-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.reveal-content {
  animation: reveal-content 0.35s ease both;
}

@keyframes image-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}

@keyframes reveal-content {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.editor-shell {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.editor-shell :deep(.modal-shell__panel) {
  width: min(100%, 920px);
}

.editor-shell__preview,
.editor-shell__form {
  border-color: rgba(8, 17, 13, 0.08);
  box-shadow: none;
  padding: 1rem;
}

.editor-shell__preview {
  background: linear-gradient(180deg, #fff8df, #f6f0de);
  color: #08110d;
}

.editor-shell__form {
  background: #fffaf0;
}

.preview-image {
  aspect-ratio: 1 / 1;
  border-radius: 22px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(35, 89, 49, 0.16), rgba(8, 17, 13, 0.08));
}

.preview-image img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.preview-placeholder {
  align-items: center;
  color: rgba(8, 17, 13, 0.58);
  display: flex;
  height: 100%;
  justify-content: center;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.editor-grid {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.editor-section {
  background: rgba(35, 89, 49, 0.06);
  border: 1px solid rgba(35, 89, 49, 0.1);
  border-radius: 18px;
  padding: 0.85rem 1rem;
}

.editor-section span {
  color: #235931;
  display: block;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.editor-section p {
  color: rgba(8, 17, 13, 0.62);
  margin-top: 0.25rem;
}

.editor-grid label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.editor-grid label span,
.field-toggle span,
.uploader__label {
  color: #235931;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.editor-grid input,
.editor-grid textarea,
.editor-grid select,
.uploader__dropzone {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.12);
  border-radius: 16px;
  color: #08110d;
}

.editor-grid input,
.editor-grid textarea,
.editor-grid select {
  min-height: 52px;
  padding: 1rem 1.05rem;
}

.editor-grid textarea {
  min-height: 130px;
  resize: vertical;
}

.full { flex-basis: 100%; }

.field-toggle {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.12);
  border-radius: 16px;
  display: flex;
  gap: 0.6rem;
  min-height: 52px;
  padding: 0.95rem 1rem;
}

.field-toggle input {
  min-height: 18px;
  width: 18px;
}

.multi-list {
  min-height: 150px;
}

.uploader__dropzone {
  align-items: center;
  cursor: pointer;
  display: flex;
  justify-content: center;
  margin-top: 0.8rem;
  min-height: 52px;
  padding: 0.75rem 1rem;
  position: relative;
  border-radius: 14px;
  background: rgba(35, 89, 49, 0.06);
  border: 1px dashed rgba(35, 89, 49, 0.2);
  transition: background 0.2s, border-color 0.2s;
}

.uploader__dropzone:hover {
  background: rgba(35, 89, 49, 0.1);
  border-color: rgba(35, 89, 49, 0.35);
}

.uploader__input {
  inset: 0;
  opacity: 0;
  position: absolute;
}

.image-clear {
  background: rgba(8, 17, 13, 0.08);
  border: 0;
  border-radius: 999px;
  color: #08110d;
  font-weight: 800;
  margin-top: 0.75rem;
  min-height: 42px;
  padding: 0.75rem 1rem;
  width: 100%;
}

.editor-shell__form :deep(footer) {
  padding: 0;
}

.editor-actions {
  align-items: center;
  border-top: 1px solid rgba(8, 17, 13, 0.08);
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
}

.editor-actions button {
  border: 0;
  border-radius: 999px;
  font-weight: 800;
  min-height: 46px;
  padding: 0.8rem 1rem;
}

.editor-actions .secondary {
  background: rgba(26, 26, 26, 0.06);
  color: #08110d;
}

.editor-actions button[type='submit'] {
  background: #235931;
  color: $white;
}

:deep(.modal-shell__body) {
  background: #efe8d8;
}

:deep(.modal-shell__footer) {
  align-items: center;
  background: #f4f4f0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: flex-end;
}

:deep(.modal-shell__footer button) {
  border: 0;
  border-radius: 999px;
  font-weight: 800;
  min-height: 44px;
  padding: 0.8rem 1rem;
}

:deep(.modal-shell__footer button.secondary) {
  background: rgba(26, 26, 26, 0.06) !important;
  color: #08110d !important;
}

:deep(.modal-shell__footer button[type='submit']) {
  background: #235931;
  color: $white;
}

@media (min-width: 980px) {
  .editor-shell {
    align-items: start;
    flex-direction: row;
  }

  .editor-shell__preview {
    flex: 0 0 min(360px, 38%);
  }

  .editor-shell__form {
    flex: 1 1 0;
  }
}

@media (min-width: 769px) {
  .admin-products__toolbar {
    align-items: flex-end;
    flex-direction: row;
  }

  .toolbar-field:first-child {
    flex: 1.5 1 0;
  }

  .toolbar-field:nth-child(2) {
    flex: 1 1 0;
  }

  .toolbar-clear {
    flex: 0 0 auto;
  }

  .toolbar-results {
    flex: 0 0 auto;
  }

  .admin-products__hero {
    align-items: flex-end;
    flex-direction: row;
  }

  .admin-products__hero-actions {
    align-items: flex-end;
    flex: 0 0 auto;
    width: auto;
  }

  .catalog-pagination {
    flex-direction: row;
  }

  .catalog-pagination button {
    width: auto;
  }

  .product-card__foot {
    flex-direction: row;
  }

  .editor-grid {
    flex-flow: row wrap;
  }

  .editor-grid label,
  .editor-section,
  .field-toggle,
  .uploader {
    flex: 1 1 260px;
  }

  .editor-grid .full,
  .editor-grid textarea.full {
    flex-basis: 100%;
  }
}

@media (min-width: 641px) {
  .product-card__meta {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .product-card__meta > * {
    flex: 1 1 120px;
  }

  .admin-products__hero,
  .admin-products__toolbar {
    padding: 1.15rem;
  }
}
</style>
