import { computed, ref } from 'vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import { useToast } from '@/composables/useToast'
import { useOrderSounds } from '@/composables/useOrderSounds'

export const orderStatuses = ['pending', 'paid', 'preparing', 'awaiting_pickup', 'ready', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Pendientes',
  paid: 'Por preparar',
  preparing: 'En preparación',
  awaiting_pickup: 'Listas para recolección',
  ready: 'En reparto',
  delivered: 'Finalizadas',
  cancelled: 'Canceladas',
}

export const orderStatusDescriptions: Record<OrderStatus, string> = {
  pending: 'Validar pago',
  paid: 'Iniciar cocina',
  preparing: 'En cocina',
  awaiting_pickup: 'Esperando motorizado o retiro',
  ready: 'El pedido ya salió del local',
  delivered: 'Entregadas o retiradas por el cliente',
  cancelled: 'Canceladas',
}

export const orderStatusShortLabels: Record<OrderStatus, string> = {
  pending: 'Pend.',
  paid: 'Preparar',
  preparing: 'Prep.',
  awaiting_pickup: 'Recolección',
  ready: 'Reparto',
  delivered: 'Finalizada',
  cancelled: 'Canc.',
}

export const orderStatusIcons: Record<OrderStatus, string> = {
  pending: 'fa-clock',
  paid: 'fa-credit-card',
  preparing: 'fa-kitchen-set',
  awaiting_pickup: 'fa-motorcycle',
  ready: 'fa-truck-fast',
  delivered: 'fa-circle-check',
  cancelled: 'fa-ban',
}

export const orderStatusTones: Record<OrderStatus, string> = {
  pending: 'tone--amber',
  paid: 'tone--blue',
  preparing: 'tone--green',
  awaiting_pickup: 'tone--violet',
  ready: 'tone--blue',
  delivered: 'tone--neutral',
  cancelled: 'tone--red',
}

export function formatOrderCurrency(amount: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount / 100)
}

export function getOrderItemCount(order: OrderDTO) {
  return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
}

/**
 * Flujo real de cada tipo de pedido. El retiro en local NO pasa por «En reparto»:
 * cuando el cliente se lleva el pedido, el cajero lo cierra en «Entregado».
 */
const deliveryFlow: OrderStatus[] = ['pending', 'paid', 'preparing', 'awaiting_pickup', 'ready', 'delivered']
const pickupFlow: OrderStatus[] = ['pending', 'paid', 'preparing', 'awaiting_pickup', 'delivered']

export function getOrderFlow(deliveryType?: string) {
  return deliveryType === 'pickup' ? pickupFlow : deliveryFlow
}

/** Siguiente paso del flujo. Nunca propone «Cancelada»: eso va por el modal de cancelación. */
export function getNextOrderStatus(status: OrderStatus, deliveryType?: string) {
  const flow = getOrderFlow(deliveryType)
  const index = flow.indexOf(status)
  if (index === -1) return null
  return flow[index + 1] || null
}

/** Etiquetas que cambian según el tipo: un retiro no espera motorizado ni sale a reparto. */
export function getOrderStatusLabel(status: OrderStatus, deliveryType?: string) {
  if (deliveryType === 'pickup') {
    if (status === 'awaiting_pickup') return 'Listas para retiro'
    if (status === 'delivered') return 'Retiradas'
  }
  return orderStatusLabels[status]
}

export function isOrderStatus(status: string): status is OrderStatus {
  return orderStatuses.includes(status as OrderStatus)
}

export function getOrderNotes(order: OrderDTO) {
  return (order.audit || []).filter((entry) => entry.action === 'note_added' || entry.details)
}

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function useOrdersBoard() {
  const orders = ref<OrderDTO[]>([])
  const loading = ref(true)
  const searchQuery = ref('')
  const statusFilter = ref<OrderStatus | 'all'>('all')
  const today = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Guayaquil', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const todayValue = `${today.find((part) => part.type === 'year')?.value}-${today.find((part) => part.type === 'month')?.value}-${today.find((part) => part.type === 'day')?.value}`
  const monthStart = `${today.find((part) => part.type === 'year')?.value}-${today.find((part) => part.type === 'month')?.value}-01`
  const periodFilter = ref<'today' | 'all' | 'range'>('range')
  const startDate = ref(monthStart)
  const endDate = ref(todayValue)
  const activeDatePreset = ref('month')
  const { success, error, info, warning } = useToast()
  const { playNewOrder, playStatus, playPickerUpdate } = useOrderSounds()

  async function load(silent = false) {
    if (!silent) loading.value = true
    try {
      const response = await OrderService.getAll(periodFilter.value === 'range'
        ? { from: startDate.value, to: endDate.value, limit: 200 }
        : { period: periodFilter.value, limit: 100 })
      const previousOrders = new Map(orders.value.map((order) => [order._id, order]))
      orders.value = response.data
      if (silent) {
        response.data.forEach((order) => {
          const previous = previousOrders.get(order._id)
          if (!previous) {
            // Orden que no estaba en el tablero: el sonido clave para la cocina.
            info(`¡Pedido nuevo! ${order.orderNumber} · ${order.branch?.name || 'Sin sucursal'}`)
            playNewOrder()
            return
          }
          if (previous.picker?.currentStatus !== order.picker?.currentStatus && order.picker?.currentStatus) {
            info(`${order.orderNumber}: ${order.picker.statusText || 'Picker actualizó la entrega'}`)
            playPickerUpdate()
          } else if (previous.status !== order.status) {
            info(`${order.orderNumber}: ${orderStatusLabels[order.status as OrderStatus] || 'Estado actualizado'}`)
            playStatus(order.status)
          }
        })
      }
    } finally {
      if (!silent) loading.value = false
    }
  }

  const visibleOrders = computed(() => {
    const term = normalizeSearch(searchQuery.value.trim())
    return orders.value.filter((order) => {
      const matchesStatus = statusFilter.value === 'all' || order.status === statusFilter.value
      const searchable = [
        order.orderNumber,
        order.customerName || '',
        order.customerEmail,
        order.customerPhone || '',
        order.branch?.name || '',
        orderStatusLabels[order.status as OrderStatus] || order.status,
        ...(order.items?.map((item) => item.name) || []),
      ].join(' ')
      const matchesSearch =
        !term || normalizeSearch(searchable).includes(term)

      return matchesStatus && matchesSearch
    })
  })

  const grouped = computed(() =>
    orderStatuses.reduce((acc, status) => {
      acc[status] = visibleOrders.value
        .filter((order) => order.status === status)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime())
      return acc
    }, {} as Record<OrderStatus, OrderDTO[]>),
  )

  const totals = computed(() => {
    const count = orders.value.length
    const pending = orders.value.filter((order) => order.status === 'pending').length
    const active = orders.value.filter((order) => ['paid', 'preparing', 'awaiting_pickup', 'ready'].includes(order.status)).length
    const completed = orders.value.filter((order) => order.status === 'delivered').length

    return { count, pending, active, completed }
  })

  async function move(order: OrderDTO, status: OrderStatus, note?: string) {
    const previousOrders = [...orders.value]
    orders.value = orders.value.map((item) => item._id === order._id ? { ...item, status, updatedAt: new Date().toISOString() } : item)
    try {
      const response = await OrderService.updateStatus(order._id, status, note)
      // Cancelar el pedido cancela también el delivery. Si Picker no aceptó, el
      // cajero tiene que enterarse ahora: un "Estado actualizado" a secas termina
      // con el motorizado en la puerta del local.
      const pickerWarning = response.data?.pickerCancelWarning
      if (pickerWarning) warning(pickerWarning)
      else success('Estado actualizado')
      playStatus(status)
      await load(true)
    } catch (err) {
      orders.value = previousOrders
      // Muestra el mensaje real del backend (p. ej. pedido no pagado) en vez del genérico.
      const message = (err as { data?: { message?: string }; message?: string })?.data?.message
        || (err as { message?: string })?.message
        || 'No se pudo actualizar el pedido'
      error(message)
    }
  }

  async function addNote(order: OrderDTO, note: string) {
    try {
      await OrderService.addNote(order._id, note)
      success('Nota guardada')
      await load(true)
    } catch {
      error('No se pudo guardar la nota')
    }
  }

  async function requestDriver(order: OrderDTO) {
    try {
      await OrderService.startPickerSearch(order._id)
      success('Picker está buscando un motorizado')
      await load()
    } catch {
      error('No se pudo iniciar la búsqueda de motorizado')
    }
  }

  function resetFilters() {
    searchQuery.value = ''
    statusFilter.value = 'all'
    periodFilter.value = 'today'
    startDate.value = todayValue
    endDate.value = todayValue
    activeDatePreset.value = 'today'
    void load()
  }

  function applyDateRange() {
    if (startDate.value > endDate.value) [startDate.value, endDate.value] = [endDate.value, startDate.value]
    periodFilter.value = 'range'
    void load()
  }

  function findOrder(orderId: string) {
    return orders.value.find((order) => order._id === orderId) || null
  }

  return {
    orders,
    loading,
    searchQuery,
    statusFilter,
    periodFilter,
    startDate,
    endDate,
    activeDatePreset,
    visibleOrders,
    grouped,
    totals,
    load,
    move,
    addNote,
    requestDriver,
    resetFilters,
    applyDateRange,
    findOrder,
  }
}
