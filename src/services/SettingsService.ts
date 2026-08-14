import APIBase from './httpBase'

export interface SettingsDTO {
  _id: string
  deliveryPricePerKm: number
  /** IVA vigente en porcentaje (15 = 15%). */
  ivaRate: number
  /** Los precios del catálogo ya incluyen IVA. */
  pricesIncludeIva: boolean
}

class SettingsService extends APIBase {
  fetch() {
    return this.get<SettingsDTO>('settings')
  }

  update(payload: Partial<Pick<SettingsDTO, 'deliveryPricePerKm' | 'ivaRate' | 'pricesIncludeIva'>>) {
    return this.put<SettingsDTO>('settings', payload)
  }

  /** Reescribe el IVA de todo el catálogo de una pasada. */
  applyIvaToCatalog(payload: { ivaRate?: number; hasIva?: boolean } = {}) {
    return this.post<{ message: string; modified: number; settings: SettingsDTO }>('settings/iva/apply', payload)
  }
}

export default new SettingsService()
