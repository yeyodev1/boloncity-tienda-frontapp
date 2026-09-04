import MetaPixelService, { type MetaCustomData } from './MetaPixelService'

/**
 * Meta Pixel del navegador.
 *
 * Cada evento se dispara dos veces: aquí con `fbq(...)` y en el backend con la
 * Conversions API. Las dos llevan el mismo `eventID`, así que Meta las reconoce
 * como el mismo hecho y cuenta una sola (deduplicación). La copia del servidor es
 * la que sobrevive cuando un bloqueador mata el pixel o el cliente cierra la
 * pestaña al volver de PayPhone.
 *
 * Sin `VITE_META_PIXEL_ID` todo esto queda en no-op: la tienda funciona igual,
 * simplemente no mide.
 */

type FbqArgs = [string, string, Record<string, unknown>?, { eventID?: string }?]

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[] }
    _fbq?: unknown
  }
}

const PIXEL_ID = String(import.meta.env.VITE_META_PIXEL_ID || '').trim()

export type MetaEventName = 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase'

let initialized = false

export function isMetaPixelEnabled(): boolean {
  return Boolean(PIXEL_ID)
}

/** Id único por evento. `crypto.randomUUID` no existe en contextos no seguros. */
function newEventId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
  return `${prefix}-${random}`
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]!) : undefined
}

/**
 * `_fbc` identifica el clic en el anuncio que trajo al visitante. La cookie solo
 * existe si el pixel ya cargó; cuando el cliente acaba de llegar con `?fbclid=`
 * se arma a mano con el formato que Meta espera: `fb.1.<timestamp>.<fbclid>`.
 * Sin esto se pierde la atribución justo en la primera visita, que es la que
 * más importa.
 */
function resolveFbc(): string | undefined {
  const cookie = readCookie('_fbc')
  if (cookie) return cookie

  const fbclid = new URLSearchParams(window.location.search).get('fbclid')
  return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined
}

/** Snippet oficial de Meta, en TypeScript y sin el `<script>` inline. */
function loadPixelScript() {
  if (window.fbq) return

  const fbq: Window['fbq'] = function (...args: unknown[]) {
    if (fbq!.callMethod) fbq!.callMethod(...args)
    else fbq!.queue!.push(args)
  } as NonNullable<Window['fbq']>

  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(script)
}

export function initMetaPixel() {
  if (initialized || !PIXEL_ID) return
  initialized = true

  loadPixelScript()
  window.fbq?.('init', PIXEL_ID)
  // El PageView de la carga inicial lo dispara el router en su primer afterEach,
  // así que aquí no se manda: se contaría doble.
}

export interface TrackOptions {
  /** Fuerza el id (Purchase lo fija en `purchase-<orderNumber>` para deduplicar). */
  eventId?: string
  customData?: MetaCustomData
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
}

/**
 * Dispara un evento en el navegador y manda su espejo al backend con el mismo id.
 * No espera al backend: la UI nunca se queda esperando por medición.
 */
export function trackMetaEvent(eventName: MetaEventName, options: TrackOptions = {}) {
  if (!PIXEL_ID) return

  const eventId = options.eventId || newEventId(eventName.toLowerCase())
  const customData = options.customData || {}

  const args: FbqArgs = ['track', eventName, customData as Record<string, unknown>, { eventID: eventId }]
  window.fbq?.(...args)

  void MetaPixelService.track({
    eventName,
    eventId,
    eventSourceUrl: window.location.href,
    customData,
    email: options.email,
    phone: options.phone,
    firstName: options.firstName,
    lastName: options.lastName,
    externalId: options.email,
    fbp: readCookie('_fbp'),
    fbc: resolveFbc(),
  })
}

/** Lo mínimo que necesita un Purchase; encaja con OrderDTO sin acoplarse a él. */
export interface MetaPurchaseOrder {
  orderNumber: string
  /** En centavos, como los guarda el backend. */
  total: number
  deliveryCost?: number
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  items?: Array<{ name: string; quantity: number; price: number }>
}

/**
 * Purchase con id determinístico: `purchase-<orderNumber>`.
 *
 * El backend usa exactamente el mismo id al reportar la venta por Conversions API.
 * Ese id compartido es lo único que evita que una venta se cuente dos veces, así
 * que vive aquí y no en cada vista — dos call sites, una sola fórmula.
 *
 * El valor va en dólares y sin el envío: el envío es costo de llevarlo, no venta,
 * y meterlo infla el ROAS del anuncio.
 */
export function trackMetaPurchase(order: MetaPurchaseOrder) {
  const nameParts = String(order.customerName || '').trim().split(/\s+/)

  trackMetaEvent('Purchase', {
    eventId: `purchase-${order.orderNumber}`,
    email: order.customerEmail,
    phone: order.customerPhone,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(' '),
    customData: {
      currency: 'USD',
      value: Math.max(0, order.total - (order.deliveryCost || 0)) / 100,
      content_type: 'product',
      order_id: order.orderNumber,
      num_items: (order.items || []).reduce((sum, item) => sum + item.quantity, 0),
    },
  })
}
