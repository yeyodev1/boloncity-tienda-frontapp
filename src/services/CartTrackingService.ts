import APIBase from './httpBase'

export interface CartMetrics {
  carritosAbandonados: number
  conDatosDeContacto: number
  mensajesEnviados: number
  volvieronDesdeElMensaje: number
  ventasRecuperadas: number
  /** Centavos. */
  valorRecuperado: number
  /** Centavos. */
  valorPerdido: number
  tasaDeApertura: number
  tasaDeRecuperacion: number
  canal: 'builderbot' | 'meta' | 'none'
}

export interface AbandonedCartRow {
  id: string
  customerName: string
  customerPhone: string
  customerEmail: string
  items: number
  subtotal: number
  stage: string
  status: string
  lastActivityAt: string
  notifiedAt: string | null
  notifyError: string
  clickedAt: string | null
  recoveredOrderNumber: string
  recoveredTotal: number
  recoveredFromLink: boolean
  link: string
  branch: string
}

export interface RecoveredCart {
  token: string
  status: string
  customerName: string
  customerEmail: string
  customerPhone: string
  subtotal: number
  items: { product: string | null; name: string; price: number; quantity: number; image?: string }[]
  yaComprado: boolean
}

/**
 * Identifica el carrito de ESTE navegador aunque el cliente todavía no escriba su correo.
 * Sin un id estable, cada visita crearía un carrito abandonado nuevo y las métricas mentirían.
 */
export function cartSessionId(): string {
  const CLAVE = 'cart_session_id'
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado) return guardado
    const nuevo = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem(CLAVE, nuevo)
    return nuevo
  } catch {
    // Modo incógnito o almacenamiento bloqueado: se sigue rastreando la visita, sin memoria.
    return `tmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}

class CartTrackingService extends APIBase {
  track(payload: Record<string, unknown>) {
    return this.post<{ tracked: boolean; token?: string }>('carts/track', { ...payload, sessionId: cartSessionId() })
  }

  recover(token: string) {
    return this.get<RecoveredCart>(`carts/recover/${token}`)
  }

  metrics(desde?: string, hasta?: string) {
    const q = new URLSearchParams()
    if (desde) q.set('desde', desde)
    if (hasta) q.set('hasta', hasta)
    const query = q.toString()
    return this.get<CartMetrics>(`carts/metrics${query ? `?${query}` : ''}`)
  }

  list(status?: string, limit = 50) {
    const q = new URLSearchParams({ limit: String(limit) })
    if (status) q.set('status', status)
    return this.get<AbandonedCartRow[]>(`carts?${q.toString()}`)
  }

  sendTestMessage(id: string) {
    return this.post<{ sent: boolean; channel: string; error?: string }>(`carts/${id}/test-message`, {})
  }
}

export default new CartTrackingService()
