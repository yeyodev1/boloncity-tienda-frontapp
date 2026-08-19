import APIBase from './httpBase'
import type { BranchDTO } from './BranchService'

export interface PreCheckoutResponse {
  branch: BranchDTO
  distance: number
  deliveryFee: number
}

class DeliveryService extends APIBase {
  preCheckout(lat: number, lng: number) {
    return this.post<PreCheckoutResponse>('delivery/pre-checkout', { lat, lng })
  }

  /** Resuelve links de Google Maps (incluidos los cortos maps.app.goo.gl) a coordenadas. */
  resolveMaps(url: string, address?: string) {
    return this.post<{ lat: number; lng: number }>('delivery/resolve-maps', { url, address })
  }
}

export default new DeliveryService()
