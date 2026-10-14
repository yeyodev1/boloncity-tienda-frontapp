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
  /** Opciones que el cliente elige al agregar (ej. Masa). `choicesText` = "Pintón, Verde". */
  options: Array<{ name: string; required: boolean; choicesText: string }>
  imageFile: File | null
  imagePreview: string
  existingImagePublicId: string
}

export interface ProductEditorOptions {
  categories: CategoryDTO[]
  branches: BranchDTO[]
}
