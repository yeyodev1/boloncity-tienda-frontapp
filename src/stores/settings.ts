import { defineStore } from 'pinia'
import SettingsService, { type ActivePromoDTO } from '@/services/SettingsService'

interface SettingsState {
  ivaRate: number
  pricesIncludeIva: boolean
  pointsEnabled: boolean
  /** Promo global ya resuelta por el backend (vigencia incluida). */
  promo: ActivePromoDTO
  loaded: boolean
}

/**
 * Configuración pública de la tienda. Se pide una sola vez al arrancar la app para que
 * el catálogo, el carrito y el checkout muestren la misma promoción sin repetir llamadas.
 * El precio final siempre lo recalcula el backend: esto es solo lo que ve el cliente.
 */
export const useSettingsStore = defineStore('settings', {
  state: (): SettingsState => ({
    ivaRate: 15,
    pricesIncludeIva: true,
    pointsEnabled: true,
    promo: { active: false, percent: 0, label: '' },
    loaded: false,
  }),

  getters: {
    /** Descuento en dólares que la promo aplica sobre un monto de productos. */
    promoDiscountOn: (state) => (amount: number) =>
      state.promo.active ? Math.round(amount * state.promo.percent) / 100 : 0,
    /** Precio de un producto con la promo aplicada. */
    promoPrice: (state) => (price: number) =>
      state.promo.active ? Math.round(price * (100 - state.promo.percent)) / 100 : price,
  },

  actions: {
    async load(force = false) {
      if (this.loaded && !force) return
      try {
        const { data } = await SettingsService.fetch()
        this.ivaRate = data.ivaRate ?? 15
        this.pricesIncludeIva = data.pricesIncludeIva ?? true
        this.pointsEnabled = data.pointsEnabled ?? true
        this.promo = data.activePromo || { active: false, percent: 0, label: '' }
        this.loaded = true
      } catch {
        // Sin settings la tienda funciona igual: simplemente no hay promo visible.
      }
    },
  },
})
