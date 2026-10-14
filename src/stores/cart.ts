import { defineStore } from 'pinia'

/** Lo que el cliente eligió en las opciones del producto (ej. Masa: Verde). */
export interface CartItemOption {
  name: string
  value: string
}

export interface CartItem {
  /**
   * Identifica el renglón: producto + opciones. Un combo con masa pintón y el
   * mismo combo con masa verde son dos renglones distintos.
   */
  key: string
  productId: string
  slug: string
  name: string
  price: number
  quantity: number
  image?: string
  options?: CartItemOption[]
}

export function cartLineKey(productId: string, options: CartItemOption[] = []) {
  return [productId, ...options.map((option) => `${option.name}=${option.value}`)].join('|')
}

/** "Masa: Verde · Salsa: Queso" para mostrar debajo del nombre. */
export function describeOptions(options: CartItemOption[] = []) {
  return options.map((option) => `${option.name}: ${option.value}`).join(' · ')
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
        const items = raw ? (JSON.parse(raw) as CartItem[]) : []
        // Carritos guardados antes de que existieran las opciones no traen `key`.
        this.items = items.map((item) => ({ ...item, key: item.key || cartLineKey(item.productId, item.options) }))
      } catch {
        this.items = []
      }
    },
    persist() {
      localStorage.setItem('cart_items', JSON.stringify(this.items))
    },
    addItem(item: Omit<CartItem, 'key'>) {
      const key = cartLineKey(item.productId, item.options)
      const existing = this.items.find((current) => current.key === key)
      if (existing) {
        existing.quantity += item.quantity
      } else {
        this.items.push({ ...item, key })
      }
      this.persist()
    },
    updateQuantity(key: string, quantity: number) {
      const item = this.items.find((current) => current.key === key)
      if (!item) return

      if (quantity <= 0) {
        this.removeItem(key)
        return
      }

      item.quantity = quantity
      this.persist()
    },
    increment(key: string) {
      const item = this.items.find((current) => current.key === key)
      if (!item) return
      item.quantity += 1
      this.persist()
    },
    decrement(key: string) {
      const item = this.items.find((current) => current.key === key)
      if (!item) return
      this.updateQuantity(key, item.quantity - 1)
    },
    removeItem(key: string) {
      this.items = this.items.filter((item) => item.key !== key)
      this.persist()
    },
    clear() {
      this.items = []
      this.persist()
    },
  },
})
