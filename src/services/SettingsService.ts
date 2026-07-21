import APIBase from './httpBase'

export interface SettingsDTO {
  _id: string
  deliveryPricePerKm: number
}

class SettingsService extends APIBase {
  fetch() {
    return this.get<SettingsDTO>('settings')
  }

  update(deliveryPricePerKm: number) {
    return this.put<SettingsDTO>('settings', { deliveryPricePerKm })
  }
}

export default new SettingsService()
