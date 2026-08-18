import APIBase from './httpBase'
import type { CategoryDTO } from './CategoryService'

export interface ProductDTO {
  _id: string
  code?: string
  name: string
  slug: string
  description?: string
  categories: CategoryDTO[]
  branches?: Array<{ _id: string; name: string }>
  unavailableBranches?: Array<{ _id: string; name: string }>
  branchPrices?: Array<{ branch: string; price: number }>
  price: number
  cost?: number
  hasIva: boolean
  ivaRate: number
  images: Array<{ url: string; publicId: string }>
  isAvailable: boolean
  isFeatured: boolean
  stock: number
  sellWithoutStock?: boolean
  pointsValue?: number | null
  isBestSeller?: boolean
}

export interface PaginatedProductsDTO {
  data: ProductDTO[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

class ProductService extends APIBase {
  getAll(filters?: { category?: string; q?: string; available?: boolean; admin?: boolean }) {
    const params = new URLSearchParams()
    if (filters?.category) params.set('category', filters.category)
    if (filters?.q) params.set('q', filters.q)
    if (filters?.available) params.set('available', 'true')
    if (filters?.admin) params.set('admin', 'true')
    const query = params.toString()
    return this.get<ProductDTO[]>(`products${query ? `?${query}` : ''}`)
  }

  getPaginated(filters: { page: number; limit: number; category?: string; q?: string; available?: boolean }) {
    const params = new URLSearchParams({
      paginate: 'true',
      page: String(filters.page),
      limit: String(filters.limit),
    })
    if (filters.category) params.set('category', filters.category)
    if (filters.q) params.set('q', filters.q)
    if (filters.available) params.set('available', 'true')
    return this.get<PaginatedProductsDTO>(`products?${params.toString()}`)
  }

  getBySlug(slug: string) {
    return this.get<ProductDTO>(`products/${slug}`)
  }

  create(payload: FormData | Record<string, unknown>) {
    return this.post<ProductDTO>('products', payload)
  }

  update(id: string, payload: FormData | Record<string, unknown>) {
    return this.put<ProductDTO>(`products/${id}`, payload)
  }

  remove(id: string) {
    return this.delete<{ message: string }>(`products/${id}`)
  }

  uploadImage(id: string, file: File, replace = false) {
    const formData = new FormData()
    formData.append('image', file)
    return this.post<ProductDTO>(`products/${id}/images${replace ? '?replace=true' : ''}`, formData)
  }

  deleteImage(id: string, publicId: string) {
    return this.delete<ProductDTO>(`products/${id}/images/${encodeURIComponent(publicId)}`)
  }

  /** Disponibilidad por sucursal (vendedor ve su local; admin cualquiera con branchId). */
  getBranchAvailability(params: { branchId?: string; search?: string } = {}) {
    const qs = new URLSearchParams()
    if (params.branchId) qs.set('branchId', params.branchId)
    if (params.search) qs.set('search', params.search)
    const query = qs.toString()
    return this.get<BranchAvailabilityResponse>(`products/availability${query ? `?${query}` : ''}`)
  }

  /** Activa/desactiva un producto para una sucursal. */
  toggleBranchAvailability(id: string, available: boolean, branchId?: string) {
    return this.patch<{ _id: string; name: string; branchId: string; available: boolean }>(
      `products/${id}/availability`,
      { available, ...(branchId ? { branchId } : {}) },
    )
  }
}

export interface BranchAvailabilityItem {
  _id: string
  name: string
  price: number
  image: string
  category: string
  available: boolean
  globallyOff: boolean
}

export interface BranchAvailabilityResponse {
  branchId: string
  products: BranchAvailabilityItem[]
  summary: { total: number; available: number; unavailable: number }
}

export default new ProductService()
