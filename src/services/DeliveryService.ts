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
}

export default new DeliveryService()
