import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductService, { type ProductDTO } from '@/services/ProductService'
import CategoryService, { type CategoryDTO } from '@/services/CategoryService'
import { isCustomerCategory } from '@/utils/productName'

/**
 * Estado del catálogo: categoría (vive en la URL), búsqueda con espera, página y productos.
 * La vista solo compone; aquí está todo lo que habla con la API.
 */
export function useCatalog(pageSize = 12) {
  const route = useRoute()
  const router = useRouter()

  const products = ref<ProductDTO[]>([])
  const categories = ref<CategoryDTO[]>([])
  // La categoría vive en la URL (/catalogo/tigrillos-clasicos) para que una campaña
  // pueda linkear directo a ella y el cliente no tenga que buscarla en el menú.
  const selectedCategory = ref(String(route.params.categorySlug || ''))
  const searchTerm = ref('')
  const loading = ref(true)
  const currentPage = ref(1)
  const totalProducts = ref(0)
  const pageCount = ref(1)
  let searchTimer: ReturnType<typeof setTimeout> | undefined
  let latestRequest = 0

  const visibleCategories = computed(() =>
    categories.value.filter((category) => (category.productsCount || !category.parentCategory) && isCustomerCategory(category)),
  )
  const selectedCategoryLabel = computed(
    () => categories.value.find((category) => category.slug === selectedCategory.value)?.name || 'Todo el menú',
  )
  const paginationStart = computed(() => (totalProducts.value ? (currentPage.value - 1) * pageSize + 1 : 0))
  const paginationEnd = computed(() => Math.min(currentPage.value * pageSize, totalProducts.value))

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

  async function goToPage(page: number) {
    const nextPage = Math.min(Math.max(page, 1), pageCount.value)
    if (nextPage === currentPage.value || loading.value) return
    currentPage.value = nextPage
    document.querySelector('.catalog-results-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    await loadProducts()
  }

  function resetFilters() {
    searchTerm.value = ''
    selectedCategory.value = ''
  }

  /** Cambiar de categoría cambia la URL: así el link se puede copiar y compartir. */
  function syncCategoryToUrl(slug: string) {
    const target = slug ? { name: 'CatalogCategory', params: { categorySlug: slug } } : { name: 'Catalog' }
    // `replace` y no `push`: pasear por las pestañas no debe llenar el historial de
    // pasos que el botón "atrás" tenga que deshacer uno por uno.
    if (route.params.categorySlug !== slug) router.replace(target)
  }

  watch(selectedCategory, (slug) => {
    currentPage.value = 1
    syncCategoryToUrl(slug)
    loadProducts()
  })

  // El otro sentido: atrás/adelante del navegador, o un link pegado estando ya en el
  // catálogo, tienen que mover la pestaña seleccionada.
  watch(
    () => route.params.categorySlug,
    (slug) => {
      const next = String(slug || '')
      if (next !== selectedCategory.value) selectedCategory.value = next
    },
  )

  // El título es lo que se ve al compartir el link por WhatsApp, que es por donde
  // llega la mayoría de estas campañas.
  watch(
    [selectedCategory, categories],
    () => {
      const name = categories.value.find((category) => category.slug === selectedCategory.value)?.name
      document.title = name ? `${name} | Boloncity` : 'Catálogo | Boloncity'
    },
    { immediate: true },
  )

  watch(searchTerm, () => {
    latestRequest += 1
    currentPage.value = 1
    loading.value = true
    products.value = []
    clearTimeout(searchTimer)
    searchTimer = setTimeout(loadProducts, 350)
  })

  onMounted(async () => {
    const [categoriesResponse] = await Promise.all([CategoryService.getAll(), loadProducts()])
    categories.value = categoriesResponse.data
  })
  onBeforeUnmount(() => clearTimeout(searchTimer))

  return {
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
  }
}
