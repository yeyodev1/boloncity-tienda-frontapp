import type { MetaCustomData } from './MetaPixelService'

/**
 * Pixel de TikTok del navegador.
 *
 * No tiene call sites propios: `trackMetaEvent` lo dispara con el mismo nombre y
 * el mismo `eventId`, y el backend manda el espejo por la Events API de TikTok.
 * Con el id compartido TikTok deduplica las dos copias, igual que Meta.
 *
 * Sin `VITE_TIKTOK_PIXEL_ID` todo esto queda en no-op (dev y previews).
 */

type Ttq = {
  page: () => void
  track: (event: string, properties?: Record<string, unknown>, options?: { event_id?: string }) => void
  load: (pixelId: string, options?: Record<string, unknown>) => void
  [key: string]: unknown
}

declare global {
  interface Window {
    ttq?: Ttq
    TiktokAnalyticsObject?: string
  }
}

const PIXEL_ID = String(import.meta.env.VITE_TIKTOK_PIXEL_ID || '').trim()
const TTCLID_KEY = 'tiktok_ttclid'

/** Los nombres de la tienda (los de Meta) traducidos a los de TikTok. PageView es `ttq.page()`. */
const TIKTOK_EVENTS: Record<string, string> = {
  ViewContent: 'ViewContent',
  AddToCart: 'AddToCart',
  InitiateCheckout: 'InitiateCheckout',
  Purchase: 'CompletePayment',
}

let initialized = false

export function isTikTokPixelEnabled(): boolean {
  return Boolean(PIXEL_ID)
}

/**
 * Snippet oficial de TikTok, transcrito casi tal cual (events.js espera
 * `methods`, `setAndDefer`, `instance` y `_i/_t/_o` con esta forma exacta).
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
function loadPixelScript() {
  if (window.ttq) return
  const w = window as any
  const t = 'ttq'
  w.TiktokAnalyticsObject = t
  const ttq: any = (w[t] = w[t] || [])
  ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent']
  ttq.setAndDefer = function (target: any, method: string) {
    target[method] = function (...args: unknown[]) {
      target.push([method, ...args])
    }
  }
  for (const method of ttq.methods) ttq.setAndDefer(ttq, method)
  ttq.instance = function (id: string) {
    const instance = ttq._i[id] || []
    for (const method of ttq.methods) ttq.setAndDefer(instance, method)
    return instance
  }
  ttq.load = function (id: string, options?: { partner?: string }) {
    const src = 'https://analytics.tiktok.com/i18n/pixel/events.js'
    ttq._i = ttq._i || {}
    ttq._i[id] = []
    ttq._i[id]._u = src
    ttq._t = ttq._t || {}
    ttq._t[id] = +new Date()
    ttq._o = ttq._o || {}
    ttq._o[id] = options || {}
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.async = true
    script.src = `${src}?sdkid=${id}&lib=${t}`
    document.head.appendChild(script)
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** El `ttclid` del anuncio solo viene en la URL de llegada: se guarda para el resto de la visita. */
function rememberTtclid() {
  const ttclid = new URLSearchParams(window.location.search).get('ttclid')
  if (!ttclid) return
  try {
    sessionStorage.setItem(TTCLID_KEY, ttclid)
  } catch {
    // Sin storage se pierde la atribución de las páginas siguientes, no la venta.
  }
}

export function initTikTokPixel() {
  if (initialized || !PIXEL_ID) return
  initialized = true

  rememberTtclid()
  loadPixelScript()
  window.ttq?.load(PIXEL_ID)
  // El page() de la carga inicial lo dispara el router en su primer afterEach.
}

/** Cookie `_ttp` y `ttclid`, para que el backend empareje su copia con esta sesión. */
export function tiktokIdentifiers(): { ttp?: string; ttclid?: string } {
  if (!PIXEL_ID) return {}
  const match = document.cookie.match(/(?:^|; )_ttp=([^;]*)/)
  let ttclid: string | undefined
  try {
    ttclid = new URLSearchParams(window.location.search).get('ttclid') || sessionStorage.getItem(TTCLID_KEY) || undefined
  } catch {
    ttclid = undefined
  }
  return { ttp: match ? decodeURIComponent(match[1]!) : undefined, ttclid }
}

export function trackTikTokEvent(eventName: string, eventId: string, customData: MetaCustomData = {}) {
  if (!PIXEL_ID || !window.ttq) return

  if (eventName === 'PageView') {
    window.ttq.page()
    return
  }

  const tiktokEvent = TIKTOK_EVENTS[eventName]
  if (!tiktokEvent) return

  const properties: Record<string, unknown> = {
    currency: customData.currency,
    value: customData.value,
    content_type: customData.content_type,
    contents: customData.contents?.length
      ? customData.contents.map((content) => ({ content_id: content.id, quantity: content.quantity, price: content.item_price, content_name: customData.content_name }))
      : customData.content_ids?.map((id) => ({ content_id: id, content_name: customData.content_name })),
  }
  if (customData.order_id) properties.order_id = customData.order_id

  window.ttq.track(tiktokEvent, properties, { event_id: eventId })
}
