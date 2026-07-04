import APIBase from './httpBase'

export interface CategoryDTO {
  _id: string
  name: string
  slug: string
  description?: string
  color?: string
  icon?: string
  parentCategory?: string | null
  isActive: boolean
  sortOrder: number
  productsCount?: number
}

class CategoryService extends APIBase {
  getAll() {
    return this.get<CategoryDTO[]>('categories')
  }

  getBySlug(slug: string) {
    return this.get<{ category: CategoryDTO; products: unknown[] }>(`categories/${slug}`)
  }

  create(payload: Partial<CategoryDTO>) {
    return this.post<CategoryDTO>('categories', payload)
  }

  update(id: string, payload: Partial<CategoryDTO>) {
    return this.put<CategoryDTO>(`categories/${id}`, payload)
  }

  remove(id: string) {
    return this.delete<{ message: string }>(`categories/${id}`)
  }

  reorder(ids: string[]) {
    return this.put<{ message: string }>('categories/reorder', { ids })
  }
}

export default new CategoryService()
