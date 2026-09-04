/**
 * Google Tag Manager.
 *
 * Se carga desde acá y no con el snippet inline en index.html por dos razones: el
 * id sale de una variable de entorno (igual que el pixel, así dev y prod no
 * comparten contenedor), y el `<noscript>` del snippet oficial no aporta nada en
 * esta tienda — sin JavaScript la SPA no renderiza ni una pantalla, así que el
 * iframe de respaldo mediría visitas a una página en blanco.
 *
 * Sin `VITE_GTM_ID` queda en no-op.
 *
 * OJO: el Meta Pixel ya se dispara desde `metaPixel.ts` con deduplicación contra
 * la Conversions API. Si algún día se configura el pixel TAMBIÉN dentro de GTM,
 * cada evento se contaría dos veces y sin `eventID` que los empareje. GTM acá es
 * para Google Analytics y demás etiquetas, no para republicar Meta.
 */

const GTM_ID = String(import.meta.env.VITE_GTM_ID || '').trim()

declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

let initialized = false

export function initGoogleTagManager() {
  if (initialized || !GTM_ID) return
  initialized = true

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`
  document.head.appendChild(script)
}

/**
 * Avisa a GTM que cambió la ruta. La tienda es una SPA: sin esto GTM solo vería
 * la primera carga y cualquier etiqueta basada en "vista de página" se perdería
 * todo el recorrido interno.
 */
export function pushGtmPageView(path: string, title: string) {
  if (!GTM_ID) return
  window.dataLayer?.push({ event: 'page_view', page_path: path, page_title: title })
}
