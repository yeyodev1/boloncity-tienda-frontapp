import APIBase from './httpBase'

export interface BranchDTO {
  _id: string
  name: string
  slug: string
  address?: string
  city?: string
  phone?: string
  email?: string
  googleMapsUrl?: string
  imageUrl?: string
  imagePublicId?: string
  coordinates?: { lat: number; lng: number } | null
  timezone?: string
  openingHours?: Array<{ day: string; opensAt: string; closesAt: string; isOpen: boolean }>
  /** Minutos de cocina que Picker espera antes de buscar motorizado. */
  cookTimeMinutes?: number
  /**
   * Las API keys nunca salen del backend; `hasDevKey`/`hasProdKey` dicen si la sucursal
   * ya está conectada en cada entorno de Picker.
   */
  pickerStore?: {
    storeId?: string
    createdAt?: string
    creationStatus?: string
    createdBy?: string
    hasDevKey?: boolean
    hasProdKey?: boolean
  }
  /** Entorno de Picker que está usando este backend (`development` | `production`). */
  pickerEnv?: string
  /** Tienda de PayPhone de la sucursal: define en qué local cae el cobro. */
  payphone?: { storeId?: string }
  availability?: {
    isOpenNow: boolean
    timezone: string
    nextOpening: { date: string; opensAt: string; closesAt: string; at: string } | null
  }
  isActive: boolean
}

class BranchService extends APIBase {
  getAll() {
    return this.get<BranchDTO[]>('branches')
  }

  getPublic() {
    return this.get<BranchDTO[]>('branches/public')
  }

  create(payload: Partial<BranchDTO>) {
    return this.post<BranchDTO>('branches', payload)
  }

  update(id: string, payload: Partial<BranchDTO>) {
    return this.put<BranchDTO>(`branches/${id}`, payload)
  }

  remove(id: string) {
    return this.delete<{ message: string }>(`branches/${id}`)
  }

  uploadImage(id: string, file: File) {
    const formData = new FormData()
    formData.append('image', file)
    return this.post<BranchDTO>(`branches/${id}/image`, formData)
  }

  provisionPickerStore(id: string) {
    return this.post<BranchDTO>(`branches/${id}/picker-store`, {})
  }

  /** Tiendas que ya existen en Picker, para vincular en vez de crear un duplicado. */
  pickerStores(environment: 'development' | 'production') {
    return this.get<{
      environment: string
      stores: Array<{ companyName: string; token: string; linkedTo: string | null }>
    }>(`branches/picker-stores?environment=${environment}`)
  }

  linkPickerStore(id: string, token: string, environment: 'development' | 'production') {
    return this.post<BranchDTO>(`branches/${id}/picker-link`, { token, environment })
  }

  nearest(lat: number, lng: number) {
    return this.post<{ branch: BranchDTO; distance: number }>('branches/nearest', { lat, lng })
  }
}

export default new BranchService()
