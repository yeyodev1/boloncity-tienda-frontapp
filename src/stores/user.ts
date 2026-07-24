import { defineStore } from 'pinia'

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 120

export interface UserState {
  id: string | null
  name: string | null
  email: string | null
  photo: string | null
  phone: string | null
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
    photo: null,
    phone: null,
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
      const name = localStorage.getItem('user_name')
      const email = localStorage.getItem('user_email')
      const photo = localStorage.getItem('user_photo')
      const phone = localStorage.getItem('user_phone')

      if (token && expiresAt && Date.now() > expiresAt) {
        this.clear()
        return
      }

      this.isAuthenticated = !!token
      this.id = id || null
      this.name = name || null
      this.email = email || null
      this.photo = photo || null
      this.phone = phone || null
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

    setUser(payload: { id?: string; name?: string; email?: string; photo?: string; phone?: string; accountType?: 'customer' | 'branch_admin' | 'admin'; branches?: string[]; allBranches?: boolean }) {
      if (payload.id !== undefined) {
        this.id = payload.id
        try {
          localStorage.setItem('user_id', payload.id)
        } catch {}
      }
      if (payload.name !== undefined) {
        this.name = payload.name
        try { localStorage.setItem('user_name', payload.name) } catch {}
      }
      if (payload.email !== undefined) {
        this.email = payload.email
        try { localStorage.setItem('user_email', payload.email) } catch {}
      }
      if (payload.photo !== undefined) {
        this.photo = payload.photo
        try { localStorage.setItem('user_photo', payload.photo) } catch {}
      }
      if (payload.phone !== undefined) {
        this.phone = payload.phone
        try { localStorage.setItem('user_phone', payload.phone) } catch {}
      }
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
      this.photo = null
      this.phone = null
      this.accountType = null
      this.branches = []
      this.allBranches = false
      this.isAuthenticated = false
      try {
        localStorage.removeItem('access_token')
        localStorage.removeItem('session_expires_at')
        localStorage.removeItem('user_id')
        localStorage.removeItem('user_name')
        localStorage.removeItem('user_email')
        localStorage.removeItem('user_photo')
        localStorage.removeItem('user_phone')
        localStorage.removeItem('user_account_type')
        localStorage.removeItem('user_branches')
        localStorage.removeItem('user_all_branches')
      } catch {}
    },
  },
})
