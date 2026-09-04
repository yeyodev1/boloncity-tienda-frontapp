import APIBase from './httpBase'

export interface MetaContent {
  id: string
  quantity?: number
  item_price?: number
}

export interface MetaCustomData {
  currency?: string
  value?: number
  content_type?: 'product' | 'product_group'
  content_ids?: string[]
  content_name?: string
  content_category?: string
  contents?: MetaContent[]
  num_items?: number
  order_id?: string
}

export interface MetaEventPayload {
  eventName: string
  eventId: string
  eventSourceUrl?: string
  customData?: MetaCustomData
  /** Sin hashear: lo hashea el backend antes de mandarlo a Meta. */
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  externalId?: string
  /** Cookies del pixel; Meta las usa para emparejar la sesión. */
  fbp?: string
  fbc?: string
}

class MetaPixelService extends APIBase {
  /** Espejo del evento en el servidor (Conversions API). Nunca lanza. */
  async track(payload: MetaEventPayload): Promise<void> {
    try {
      // Timeout corto: medir no puede trabar la navegación ni el checkout.
      await this.post('meta/events', payload, undefined, { timeout: 5000 })
    } catch {
      // El pixel del navegador ya disparó su copia; si esta falla, se pierde una
      // sola señal, no la venta.
    }
  }
}

export default new MetaPixelService()
