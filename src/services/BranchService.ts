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

  nearest(lat: number, lng: number) {
    return this.post<{ branch: BranchDTO; distance: number }>('branches/nearest', { lat, lng })
  }
}

export default new BranchService()
