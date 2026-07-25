import { computed, ref } from 'vue'
import OrderService, { type OrderDTO } from '@/services/OrderService'
import { useToast } from '@/composables/useToast'

export const orderStatuses = ['pending', 'paid', 'preparing', 'ready', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Pendientes',
  paid: 'Pagadas',
  preparing: 'En preparación',
  ready: 'Listas',
  delivered: 'Entregadas',
  cancelled: 'Canceladas',
}

export const orderStatusDescriptions: Record<OrderStatus, string> = {
  pending: 'Validar pago',
  paid: 'Por preparar',
  preparing: 'En cocina',
  ready: 'Para entregar',
  delivered: 'Cerradas',
  cancelled: 'Canceladas',
}

export const orderStatusShortLabels: Record<OrderStatus, string> = {
  pending: 'Pend.',
  paid: 'Pag.',
  preparing: 'Prep.',
  ready: 'Listas',
  delivered: 'Ent.',
  cancelled: 'Canc.',
}

export const orderStatusTones: Record<OrderStatus, string> = {
  pending: 'tone--amber',
  paid: 'tone--blue',
  preparing: 'tone--green',
  ready: 'tone--violet',
  delivered: 'tone--neutral',
  cancelled: 'tone--red',
}

export function formatOrderCurrency(amount: number) {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(amount / 100)
}

export function getOrderItemCount(order: OrderDTO) {
  return order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0
}

export function getNextOrderStatus(status: OrderStatus) {
  const index = orderStatuses.indexOf(status)
  return orderStatuses[index + 1] || null
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
  const { success, error } = useToast()

  async function load() {
    loading.value = true
    try {
      const response = await OrderService.getAll(periodFilter.value === 'range'
        ? { from: startDate.value, to: endDate.value, limit: 200 }
        : { period: periodFilter.value, limit: 100 })
      orders.value = response.data
    } finally {
      loading.value = false
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
      acc[status] = visibleOrders.value.filter((order) => order.status === status)
      return acc
    }, {} as Record<OrderStatus, OrderDTO[]>),
  )

  const totals = computed(() => {
    const count = orders.value.length
    const pending = orders.value.filter((order) => order.status === 'pending').length
    const active = orders.value.filter((order) => ['paid', 'preparing', 'ready'].includes(order.status)).length
    const completed = orders.value.filter((order) => order.status === 'delivered').length

    return { count, pending, active, completed }
  })

  async function move(order: OrderDTO, status: OrderStatus, note?: string) {
    try {
      await OrderService.updateStatus(order._id, status, note)
      success('Estado actualizado')
      await load()
    } catch {
      error('No se pudo actualizar el pedido')
    }
  }

  async function addNote(order: OrderDTO, note: string) {
    try {
      await OrderService.addNote(order._id, note)
      success('Nota guardada')
      await load()
    } catch {
      error('No se pudo guardar la nota')
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
    resetFilters,
    applyDateRange,
    findOrder,
  }
}
