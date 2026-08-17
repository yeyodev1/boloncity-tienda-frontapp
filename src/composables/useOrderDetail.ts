import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import { useToast } from '@/composables/useToast'

export function useOrderDetail() {
  const route = useRoute()
  const { success, error } = useToast()
  const order = ref<OrderDTO | null>(null)
  const loading = ref(true)
  const retrying = ref(false)
  const statusFlash = ref(false)
  let streamAbort: AbortController | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const showRetryButton = computed(() => {
    const value = order.value
    if (!value || value.deliveryType !== 'delivery' || value.picker?.bookingId) return false
    if (value.status === 'cancelled' || value.status === 'pending') return false
    return value.audit?.some((entry) => entry.action === 'note_added' && entry.details?.toLowerCase().includes('picker booking fall')) ?? false
  })

  function applyOrderUpdate(nextOrder: OrderDTO) {
    if (order.value?.picker?.currentStatus !== nextOrder.picker?.currentStatus) {
      statusFlash.value = true
      setTimeout(() => { statusFlash.value = false }, 2000)
    }
    order.value = nextOrder
  }

  async function fetchOrder() {
    try {
      const response = await OrderService.getMineById(route.params.id as string)
      applyOrderUpdate(response.data)
    } catch {
      if (!order.value) error('No pudimos cargar el detalle de la orden.')
    } finally {
      loading.value = false
    }
  }

  async function retryPicker() {
    if (!order.value) return
    retrying.value = true
    try {
      const response = await OrderService.retryPicker(order.value._id)
      order.value = response.data.order
      success('Delivery asignado con éxito.')
    } catch (requestError: any) {
      // httpBase lanza { status, message, data }; message ya trae el del backend.
      error(requestError?.data?.message || requestError?.message || 'No pudimos crear el delivery. Intenta de nuevo.')
    } finally {
      retrying.value = false
    }
  }

  function stopRealtime() {
    streamAbort?.abort()
    streamAbort = null
    if (reconnectTimer) clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  function startRealtime() {
    stopRealtime()
    streamAbort = OrderService.subscribeToMine(route.params.id as string, applyOrderUpdate, () => {
      reconnectTimer = setTimeout(startRealtime, 3000)
    })
  }

  onMounted(async () => {
    await fetchOrder()
    startRealtime()
  })
  onUnmounted(stopRealtime)

  return { order, loading, retrying, statusFlash, showRetryButton, retryPicker }
}
