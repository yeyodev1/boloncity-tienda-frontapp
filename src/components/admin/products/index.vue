<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import ProductService, { type ProductDTO } from '@/services/ProductService'
import CategoryService, { type CategoryDTO } from '@/services/CategoryService'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useBranchStore } from '@/stores/branch'
import ProductEditor from './ProductEditor.vue'
import ProductsHero from './ProductsHero.vue'
import ProductsList from './ProductsList.vue'
import ProductsToolbar from './ProductsToolbar.vue'
import type { ProductForm } from './types'

const products = ref<ProductDTO[]>([])
const categories = ref<CategoryDTO[]>([])
const branches = ref<BranchDTO[]>([])
const loading = ref(true)
const saving = ref(false)
const editorOpen = ref(false)
const editingId = ref('')
const initialFormState = ref('')
const searchQuery = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const loadedImages = ref(new Set<string>())
const { confirm } = useConfirm()
const { success, error } = useToast()
const branchStore = useBranchStore()
const form = reactive<ProductForm>({ code: '', name: '', description: '', price: 0, cost: 0, categories: [], branches: [], unavailableBranches: [], hasIva: false, ivaRate: 0, isAvailable: true, isFeatured: false, stock: 0, sellWithoutStock: true, pointsValue: null, scheduledActivation: '', scheduledDeactivation: '', sortOrder: 0, isBestSeller: false, imageFile: null, imagePreview: '', existingImagePublicId: '' })
const categoriesById = computed(() => new Map(categories.value.map((item) => [item._id, item])))
const branchesById = computed(() => new Map(branches.value.map((item) => [item._id, item])))
const categoryOptions = computed(() => categories.value.map(({ _id, name }) => ({ value: _id, label: name })))
const activeBranchName = computed(() => branchesById.value.get(branchStore.selectedBranchId || '')?.name || '')
const featuredCount = computed(() => products.value.filter((product) => product.isFeatured).length)
const availableCount = computed(() => products.value.filter((product) => product.isAvailable).length)
const filteredProducts = computed(() => {
  const cat = selectedCategory.value
  // Si el seleccionado es una categoría padre, también incluir sus subcategorías.
  const childIds = cat ? categories.value.filter((c) => String((c as { parentCategory?: unknown }).parentCategory ?? '') === String(cat)).map((c) => c._id) : []
  const q = searchQuery.value.trim().toLowerCase()
  return products.value.filter((product) => {
    const catIds = (product.categories || []).map((c) => (typeof c === 'string' ? c : c?._id)).filter(Boolean)
    const matchesCat = !cat || catIds.includes(cat) || catIds.some((id) => childIds.includes(id))
    const matchesSearch = !q || [product.code, product.name, product.description || ''].join(' ').toLowerCase().includes(q)
    return matchesCat && matchesSearch
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / 12)))
const paginatedProducts = computed(() => filteredProducts.value.slice((currentPage.value - 1) * 12, currentPage.value * 12))
const resultRange = computed(() => !filteredProducts.value.length ? '0 productos' : `${(currentPage.value - 1) * 12 + 1}-${Math.min(currentPage.value * 12, filteredProducts.value.length)} de ${filteredProducts.value.length}`)

function resetForm() { Object.assign(form, { code: '', name: '', description: '', price: 0, cost: 0, categories: [], branches: [], unavailableBranches: [], hasIva: false, ivaRate: 0, isAvailable: true, isFeatured: false, stock: 0, sellWithoutStock: true, pointsValue: null, scheduledActivation: '', scheduledDeactivation: '', sortOrder: 0, isBestSeller: false, imageFile: null, imagePreview: '', existingImagePublicId: '' }); editingId.value = ''; initialFormState.value = '' }
function snapshot() { const { imageFile, ...data } = form; return JSON.stringify({ ...data, imageFile: imageFile?.name || '' }) }
function openCreate() { resetForm(); editorOpen.value = true }
function edit(product: ProductDTO) { Object.assign(form, { code: product.code || '', name: product.name, description: product.description || '', price: product.price, cost: product.cost || 0, categories: product.categories.map((item) => item._id), branches: product.branches?.map((item) => item._id) || [], unavailableBranches: product.unavailableBranches?.map((item) => item._id) || [], hasIva: false, ivaRate: 0, isAvailable: product.isAvailable, isFeatured: product.isFeatured, stock: Math.max(0, product.stock), sellWithoutStock: product.sellWithoutStock ?? product.stock < 0, pointsValue: product.pointsValue ?? null, scheduledActivation: '', scheduledDeactivation: '', sortOrder: 0, isBestSeller: product.isBestSeller || false, imageFile: null, imagePreview: product.images[0]?.url || '', existingImagePublicId: product.images[0]?.publicId || '' }); editingId.value = product._id; initialFormState.value = snapshot(); editorOpen.value = true }
function closeEditor() { editorOpen.value = false; setTimeout(resetForm, 150) }
function resetFilters() { searchQuery.value = ''; selectedCategory.value = '' }
function markImageLoaded(id: string) { loadedImages.value = new Set(loadedImages.value).add(id) }
function isImageLoaded(id: string) { return loadedImages.value.has(id) }
function isAvailableAtBranch(product: ProductDTO) { const branchId = branchStore.selectedBranchId; return product.isAvailable && (!branchId || ((product.branches || []).length ? product.branches!.some((item) => item._id === branchId) : !(product.unavailableBranches || []).some((item) => item._id === branchId))) }
function ecuadorToday() { const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()); const value = (type: string) => parts.find((part) => part.type === type)?.value || ''; return `${value('year')}-${value('month')}-${value('day')}` }
async function load() { loading.value = true; try { const [productResponse, categoryResponse, branchResponse] = await Promise.all([ProductService.getAll({ admin: true }), CategoryService.getAll(), BranchService.getAll()]); products.value = productResponse.data; categories.value = categoryResponse.data; branches.value = branchResponse.data } catch { error('No se pudo cargar el catálogo') } finally { loading.value = false } }
async function submit() { const today = ecuadorToday(); if ((form.scheduledActivation && form.scheduledActivation < today) || (form.scheduledDeactivation && form.scheduledDeactivation < today) || (form.scheduledActivation && form.scheduledDeactivation && form.scheduledDeactivation < form.scheduledActivation)) { error('Revisa las fechas de visibilidad del producto'); return } if (editingId.value) { if (initialFormState.value === snapshot()) { error('No hay cambios para guardar'); return } const ok = await confirm({ title: 'Guardar cambios', message: `Se actualizará ${form.name || 'este producto'}. ¿Deseas guardar los cambios?`, confirmText: 'Guardar cambios', type: 'warning', icon: 'fa-solid fa-floppy-disk' }); if (!ok) return } try { saving.value = true; const payload = { ...form, price: Number(form.price), cost: Number(form.cost), ivaRate: Number(form.ivaRate), stock: Number(form.stock), pointsValue: form.pointsValue === null ? null : Number(form.pointsValue), sortOrder: Number(form.sortOrder), scheduledActivation: form.scheduledActivation || null, scheduledDeactivation: form.scheduledDeactivation || null, branchPrices: JSON.stringify([]) }; const response = editingId.value ? await ProductService.update(editingId.value, payload) : await ProductService.create(payload); if (form.imageFile) await ProductService.uploadImage(response.data._id, form.imageFile, Boolean(editingId.value)); else if (editingId.value && form.existingImagePublicId && !form.imagePreview) await ProductService.deleteImage(response.data._id, form.existingImagePublicId); success(editingId.value ? 'Producto actualizado' : 'Producto creado'); closeEditor(); await load() } catch { error('No se pudo guardar el producto') } finally { saving.value = false } }
async function remove(product: ProductDTO) { if (!await confirm({ title: '¿Eliminar este producto?', message: `Vas a eliminar “${product.name}” del catálogo${product.images.length ? ' y sus imágenes' : ''}. Esta acción no se puede deshacer.`, confirmText: 'Sí, eliminar producto', cancelText: 'Conservar producto', type: 'danger', imageUrl: product.images[0]?.url || '' })) return; await ProductService.remove(product._id); success('Producto eliminado'); await load() }
onMounted(load)
watch([searchQuery, selectedCategory], () => { currentPage.value = 1 })
watch(totalPages, (pages) => { if (currentPage.value > pages) currentPage.value = pages })
</script>

<template>
  <AdminLayout><main class="admin-products"><ProductsHero :loading="loading" :product-count="products.length" @create="openCreate" /><SkeletonLoader v-if="loading" type="card" :count="4" /><section v-else class="stats"><article class="panel"><span>Productos</span><strong>{{ products.length }}</strong><small>Catálogo total</small></article><article class="panel"><span>Disponibles</span><strong>{{ availableCount }}</strong><small>Visibles en tienda</small></article><article class="panel"><span>Destacados</span><strong>{{ featuredCount }}</strong><small>En primera línea</small></article><article class="panel"><span>Categorías</span><strong>{{ categories.length }}</strong><small>Grupos activos</small></article></section><ProductsToolbar v-model:search-query="searchQuery" v-model:selected-category="selectedCategory" :category-options="categoryOptions" :loading="loading" :result-range="resultRange" @reset="resetFilters" /><SkeletonLoader v-if="loading" type="product" :count="6" /><ProductsList v-else :products="paginatedProducts" :current-page="currentPage" :total-pages="totalPages" :active-branch-name="activeBranchName" :categories-by-id="categoriesById" :branches-by-id="branchesById" :is-available-at-branch="isAvailableAtBranch" :is-image-loaded="isImageLoaded" @edit="edit" @remove="remove" @image-loaded="markImageLoaded" @reset="resetFilters" @page="currentPage = $event" /></main><ProductEditor :open="editorOpen" :saving="saving" :editing="Boolean(editingId)" :form="form" :options="{ categories, branches }" @close="closeEditor" @submit="submit" /></AdminLayout>
</template>

<style scoped lang="scss">
.admin-products { display: flex; flex-direction: column; gap: 1.15rem; padding: clamp(.75rem,2vw,1.5rem); }.stats { display: flex; flex-wrap: wrap; gap: .85rem; }.stats > * { background: $white; flex: 1 1 180px; padding: 1.15rem; }.stats span,.stats small { color: rgba($text-dark,.58); display: block; font-size: .82rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }.stats strong { display: block; font-size: clamp(1.6rem,4vw,2.4rem); margin-top: .35rem; }.stats small { font-size: .78rem; font-weight: 400; margin-top: .2rem; text-transform: none; }
</style>
