import type { CategoryDTO } from '@/services/CategoryService'
import type { BranchDTO } from '@/services/BranchService'

export interface ProductForm {
  code: string
  name: string
  description: string
  price: number
  cost: number
  categories: string[]
  branches: string[]
  unavailableBranches: string[]
  hasIva: boolean
  ivaRate: number
  isAvailable: boolean
  isFeatured: boolean
  stock: number
  sellWithoutStock: boolean
  pointsValue: number | null
  scheduledActivation: string
  scheduledDeactivation: string
  sortOrder: number
  isBestSeller: boolean
  imageFile: File | null
  imagePreview: string
  existingImagePublicId: string
}

export interface ProductEditorOptions {
  categories: CategoryDTO[]
  branches: BranchDTO[]
}
