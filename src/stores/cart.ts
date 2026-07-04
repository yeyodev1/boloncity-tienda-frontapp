import { defineStore } from 'pinia'

export interface CartItem {
  productId: string
  slug: string
  name: string
  price: number
  quantity: number
  image?: string
}

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [] as CartItem[],
  }),

  getters: {
    count: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
    subtotal: (state) => state.items.reduce((total, item) => total + item.price * item.quantity, 0),
  },

  actions: {
    hydrate() {
      try {
        const raw = localStorage.getItem('cart_items')
        this.items = raw ? JSON.parse(raw) : []
      } catch {
        this.items = []
      }
    },
    persist() {
      localStorage.setItem('cart_items', JSON.stringify(this.items))
    },
    addItem(item: CartItem) {
      const existing = this.items.find((current) => current.productId === item.productId)
      if (existing) {
        existing.quantity += item.quantity
      } else {
        this.items.push(item)
      }
      this.persist()
    },
    updateQuantity(productId: string, quantity: number) {
      const item = this.items.find((current) => current.productId === productId)
      if (!item) return

      if (quantity <= 0) {
        this.removeItem(productId)
        return
      }

      item.quantity = quantity
      this.persist()
    },
    increment(productId: string) {
      const item = this.items.find((current) => current.productId === productId)
      if (!item) return
      item.quantity += 1
      this.persist()
    },
    decrement(productId: string) {
      const item = this.items.find((current) => current.productId === productId)
      if (!item) return
      this.updateQuantity(productId, item.quantity - 1)
    },
    removeItem(productId: string) {
      this.items = this.items.filter((item) => item.productId !== productId)
      this.persist()
    },
    clear() {
      this.items = []
      this.persist()
    },
  },
})
