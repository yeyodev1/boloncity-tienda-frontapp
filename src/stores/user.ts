import { defineStore } from 'pinia'

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 120

export interface UserState {
  id: string | null
  name: string | null
  email: string | null
  accountType: 'customer' | 'branch_admin' | 'admin' | null
  branches: string[]
  allBranches: boolean
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    id: null,
    name: null,
    email: null,
    accountType: null,
    branches: [],
    allBranches: false,
    isAuthenticated: false,
  }),

  actions: {
    hydrate() {
      const token = localStorage.getItem('access_token')
      const expiresAt = Number(localStorage.getItem('session_expires_at') || 0)
      const id = localStorage.getItem('user_id')
      const accountType = localStorage.getItem('user_account_type') as 'customer' | 'branch_admin' | 'admin' | null
      const branches = localStorage.getItem('user_branches')
      const allBranches = localStorage.getItem('user_all_branches')

      if (token && expiresAt && Date.now() > expiresAt) {
        this.clear()
        return
      }

      this.isAuthenticated = !!token
      this.id = id || null
      this.accountType = accountType
      this.branches = branches ? JSON.parse(branches) : []
      this.allBranches = allBranches === 'true'
    },

    setSessionToken(token: string) {
      try {
        localStorage.setItem('access_token', token)
        localStorage.setItem('session_expires_at', String(Date.now() + SESSION_DURATION_MS))
      } catch {}
      this.isAuthenticated = true
    },

    setUser(payload: { id?: string; name?: string; email?: string; accountType?: 'customer' | 'branch_admin' | 'admin'; branches?: string[]; allBranches?: boolean }) {
      if (payload.id !== undefined) {
        this.id = payload.id
        try {
          localStorage.setItem('user_id', payload.id)
        } catch {}
      }
      if (payload.name) this.name = payload.name
      if (payload.email) this.email = payload.email
      if (payload.accountType) {
        this.accountType = payload.accountType
        try {
          localStorage.setItem('user_account_type', payload.accountType)
        } catch {}
      }
      if (payload.branches) {
        this.branches = payload.branches
        try {
          localStorage.setItem('user_branches', JSON.stringify(payload.branches))
        } catch {}
      }
      if (payload.allBranches !== undefined) {
        this.allBranches = payload.allBranches
        try {
          localStorage.setItem('user_all_branches', String(payload.allBranches))
        } catch {}
      }
      this.isAuthenticated = true
    },

    clear() {
      this.id = null
      this.name = null
      this.email = null
      this.accountType = null
      this.branches = []
      this.allBranches = false
      this.isAuthenticated = false
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('session_expires_at')
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_account_type')
        localStorage.removeItem('user_branches')
        localStorage.removeItem('user_all_branches')
      } catch {}
    },
  },
})
