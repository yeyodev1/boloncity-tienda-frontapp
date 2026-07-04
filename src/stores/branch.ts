import { defineStore } from 'pinia'
import type { BranchDTO } from '@/services/BranchService'

export const useBranchStore = defineStore('branch', {
  state: () => ({
    branches: [] as BranchDTO[],
    selectedBranchId: null as string | null,
    loading: false,
  }),

  actions: {
    hydrate() {
      this.selectedBranchId = localStorage.getItem('selected_branch')
    },
    setSelectedBranch(id: string | null) {
      this.selectedBranchId = id
      if (id) localStorage.setItem('selected_branch', id)
      else localStorage.removeItem('selected_branch')
    },
    setBranches(branches: BranchDTO[]) {
      this.branches = branches
    },
  },
})
