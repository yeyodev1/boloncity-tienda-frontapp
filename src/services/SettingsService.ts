import APIBase from './httpBase'

export interface SettingsDTO {
  _id: string
  deliveryPricePerKm: number
  /** IVA vigente en porcentaje (15 = 15%). */
  ivaRate: number
  /** Los precios del catálogo ya incluyen IVA. */
  pricesIncludeIva: boolean
  /** Programa de puntos activo. */
  pointsEnabled: boolean
  /** Cada cuántos dólares de compra se entregan puntos. */
  pointsEarnDollars: number
  /** Cuántos puntos entrega cada bloque de pointsEarnDollars. */
  pointsEarnAmount: number
  /** Cuántos puntos equivalen a $1 al canjear (100 = "100 puntos = $1"). */
  pointsRedeemPerDollar: number
}

export interface PointsBalanceDTO {
  enabled: boolean
  points: number
  discountCents: number
  redeemPerDollar: number
}

class SettingsService extends APIBase {
  fetch() {
    return this.get<SettingsDTO>('settings')
  }

  /** Saldo de puntos por correo (público, para canjear desde el checkout). */
  pointsBalance(email: string) {
    return this.get<PointsBalanceDTO>(`settings/points-balance?email=${encodeURIComponent(email)}`)
  }

  update(payload: Partial<Pick<SettingsDTO, 'deliveryPricePerKm' | 'ivaRate' | 'pricesIncludeIva' | 'pointsEnabled' | 'pointsEarnDollars' | 'pointsEarnAmount' | 'pointsRedeemPerDollar'>>) {
    return this.put<SettingsDTO>('settings', payload)
  }

  /** Reescribe el IVA de todo el catálogo de una pasada. */
  applyIvaToCatalog(payload: { ivaRate?: number; hasIva?: boolean } = {}) {
    return this.post<{ message: string; modified: number; settings: SettingsDTO }>('settings/iva/apply', payload)
  }
}

export default new SettingsService()
