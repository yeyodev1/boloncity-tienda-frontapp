import APIBase from './httpBase'
import type { BranchDTO } from './BranchService'

export interface PreCheckoutResponse {
  branch: BranchDTO
  distance: number
  deliveryFee: number
  /**
   * Minutos que tarda un motorizado en llegar AL LOCAL, según Picker. NO es el
   * tiempo total hasta la puerta: falta la cocina y el viaje de vuelta. Nunca
   * mostrarlo como «tu pedido llega en X min».
   */
  driverEtaMinutes?: number
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
