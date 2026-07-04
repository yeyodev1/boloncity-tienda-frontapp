import APIBase from './httpBase'
import type { CategoryDTO } from './CategoryService'

export interface ProductDTO {
  _id: string
  code: string
  name: string
  slug: string
  description?: string
  categories: CategoryDTO[]
  branches?: Array<{ _id: string; name: string }>
  branchPrices?: Array<{ branch: string; price: number }>
  price: number
  cost?: number
  hasIva: boolean
  ivaRate: number
  images: Array<{ url: string; publicId: string }>
  isAvailable: boolean
  isFeatured: boolean
  stock: number
  pointsValue: number
}

class ProductService extends APIBase {
  getAll(filters?: { category?: string; q?: string }) {
    const params = new URLSearchParams()
    if (filters?.category) params.set('category', filters.category)
    if (filters?.q) params.set('q', filters.q)
    const query = params.toString()
    return this.get<ProductDTO[]>(`products${query ? `?${query}` : ''}`)
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

  uploadImage(id: string, file: File) {
    const formData = new FormData()
    formData.append('image', file)
    return this.post<ProductDTO>(`products/${id}/images`, formData)
  }

  deleteImage(id: string, publicId: string) {
    return this.delete<ProductDTO>(`products/${id}/images/${encodeURIComponent(publicId)}`)
  }
}

export default new ProductService()
