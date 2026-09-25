import { onBeforeUnmount, watch, type Ref } from 'vue'
import { useCartStore } from '@/stores/cart'
import CartTrackingService from '@/services/CartTrackingService'

export type CartStage = 'cart' | 'checkout' | 'contact_ready'

interface Contacto {
  name?: Ref<string>
  email?: Ref<string>
  phone?: Ref<string>
  branchId?: Ref<string | undefined>
}

/**
 * Avisa al backend cómo va el carrito para poder recuperarlo si el cliente se va.
 *
 * Con retardo a propósito: el checkout cambia con cada tecla y mandar una petición por letra
 * sería ruido para el servidor y para las métricas. Se espera a que la persona deje de escribir.
 *
 * Nunca bloquea ni rompe la compra: si el rastreo falla, el error se traga. Vender siempre
 * importa más que medir.
 */
export function useCartTracking(stage: CartStage, contacto: Contacto = {}) {
  const cart = useCartStore()
  const RETARDO = 1200
  let timer: ReturnType<typeof setTimeout> | undefined

  function enviar() {
    if (!cart.items.length) return
    const tieneContacto = Boolean(contacto.email?.value?.trim() || contacto.phone?.value?.trim())
    CartTrackingService.track({
      items: cart.items.map((i) => ({
        product: i.productId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      subtotal: cart.subtotal,
      // Que haya dejado sus datos es un escalón distinto del embudo: son los leads recuperables.
      stage: stage === 'checkout' && tieneContacto ? 'contact_ready' : stage,
      customerName: contacto.name?.value || '',
      customerEmail: contacto.email?.value || '',
      customerPhone: contacto.phone?.value || '',
      branch: contacto.branchId?.value || null,
    }).catch(() => undefined)
  }

  function programar() {
    if (timer) clearTimeout(timer)
    timer = setTimeout(enviar, RETARDO)
  }

  watch(
    () => [
      cart.items.map((i) => `${i.productId}x${i.quantity}`).join(','),
      contacto.name?.value,
      contacto.email?.value,
      contacto.phone?.value,
      contacto.branchId?.value,
    ],
    programar,
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { enviarAhora: enviar }
}
