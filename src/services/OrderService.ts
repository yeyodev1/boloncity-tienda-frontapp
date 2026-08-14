import APIBase from './httpBase'

export interface CreateOrderInput {
  items: Array<{ productId: string; quantity: number }>
  customerEmail: string
  customerName?: string
  customerPhone?: string
  notes?: string
  branchId?: string | null
  lat?: number
  lng?: number
  deliveryCost?: number
  deliveryType?: 'delivery' | 'pickup'
  paymentMethod?: 'card' | 'cash'
  deliveryAddress?: string
  deliveryGoogleMapsUrl?: string
  scheduledFor?: string
  billingDocType?: string
  billingName?: string
  billingDocNumber?: string
  billingEmail?: string
  billingAddress?: string
}

export interface OrderDTO {
  _id: string
  orderNumber: string
  status: string
  paymentMethod?: 'card' | 'cash'
  pointsEarned?: number
  pointsRedeemed?: number
  total: number
  subtotal: number
  tax: number
  deliveryType?: 'delivery' | 'pickup'
  deliveryCost?: number
  deliveryDistance?: number
  deliveryAddress?: string
  deliveryGoogleMapsUrl?: string
  customerEmail: string
  customerName?: string
  customerPhone?: string
  notes?: string
  branch?: { _id: string; name: string }
  audit?: Array<{ action: string; performedByEmail?: string; fromValue?: string; toValue?: string; details?: string; timestamp: string }>
  items?: Array<{ name: string; quantity: number; price: number; image?: string }>
  payphone?: {
    clientTransactionId?: string
    storeId?: string
    transactionId?: number
    statusCode?: number
    cardBrand?: string
    lastDigits?: string
    confirmedAt?: string
    refund?: {
      status: 'none' | 'processing' | 'refunded' | 'failed'
      amount?: number
      reason?: string
      requestedByEmail?: string
      requestedAt?: string
      refundedAt?: string
      errorCode?: number
      errorMessage?: string
    }
  }
  picker?: {
    smrURL?: string
    bookingNumericId?: number
    bookingId?: string
    statusText?: string
    bookingDetailUrl?: string
    createdAt?: string
    currentStatus?: string
    driverName?: string
    driverPhone?: string
    driverVehicle?: string
    driverPhoto?: string
    validationCode?: string
    proofOfDelivery?: string
    deliveryFee?: number
    searchState?: 'on_hold' | 'started' | 'failed'
    searchError?: string
  }
  createdAt?: string
  updatedAt?: string
  scheduledFor?: string
}

class OrderService extends APIBase {
  create(payload: CreateOrderInput) {
    return this.post<OrderDTO>('orders', payload)
  }

  confirm(id: number, clientTxId: string) {
    return this.post('orders/confirm', { id, clientTxId })
  }

  getByNumber(orderNumber: string, email?: string) {
    const query = email ? `?email=${encodeURIComponent(email)}` : ''
    return this.get<OrderDTO>(`orders/${orderNumber}${query}`)
  }

  getByEmail(email: string) {
    return this.get<OrderDTO[]>(`orders/by-email/${encodeURIComponent(email)}`)
  }

  getById(id: string) {
    return this.get<OrderDTO>(`orders/by-id/${id}`)
  }

  getAll(params: { period?: 'today' | 'all'; date?: string; from?: string; to?: string; status?: string; limit?: number } = {}) {
    const search = new URLSearchParams()
    if (params.period) search.set('period', params.period)
    if (params.date) search.set('date', params.date)
    if (params.from) search.set('from', params.from)
    if (params.to) search.set('to', params.to)
    if (params.status) search.set('status', params.status)
    if (params.limit) search.set('limit', String(params.limit))
    const query = search.toString()
    return this.get<OrderDTO[]>(`orders${query ? `?${query}` : ''}`)
  }

  updateStatus(id: string, status: string, note?: string) {
    return this.put<OrderDTO>(`orders/${id}/status`, { status, note })
  }

  /** Reverso en PayPhone: siempre por el total, la API no admite montos parciales. */
  refund(id: string, reason: string) {
    return this.post<{ message: string; order: OrderDTO }>(`orders/${id}/refund`, { reason })
  }

  addNote(id: string, note: string) {
    return this.post<OrderDTO>(`orders/${id}/notes`, { note })
  }

  getMine() {
    return this.get<OrderDTO[]>('orders/mine/list')
  }

  getMineById(id: string) {
    return this.get<OrderDTO>(`orders/mine/${id}`)
  }

  retryPicker(id: string) {
    return this.post<{ success: boolean; order: OrderDTO }>(`orders/${id}/retry-picker`, {})
  }

  retryPickerPublic(orderNumber: string, email: string) {
    return this.post<{ success: boolean; order: OrderDTO }>(`orders/${orderNumber}/retry-picker-public`, { email })
  }

  startPickerSearch(id: string) {
    return this.post<{ order: OrderDTO }>(`orders/${id}/start-picker-search`, {})
  }

  subscribeToMine(id: string, onOrder: (order: OrderDTO) => void, onError?: () => void) {
    const controller = new AbortController()

    void (async () => {
      const response = await fetch(this.buildUrl(`orders/mine/${id}/stream`), {
        headers: this.getHeaders(),
        signal: controller.signal,
      })
      if (!response.ok || !response.body) throw new Error('No se pudo conectar a las actualizaciones')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (!controller.signal.aborted) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        let boundary = buffer.indexOf('\n\n')
        while (boundary >= 0) {
          const event = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          const data = event.split('\n').find((line) => line.startsWith('data: '))
          if (data) onOrder(JSON.parse(data.slice(6)))
          boundary = buffer.indexOf('\n\n')
        }
      }

      if (!controller.signal.aborted) onError?.()
    })().catch(() => {
      if (!controller.signal.aborted) onError?.()
    })

    return controller
  }

  subscribeToPublic(orderNumber: string, email: string, onOrder: (order: OrderDTO) => void, onError?: () => void) {
    const controller = new AbortController()

    void (async () => {
      const endpoint = `orders/${encodeURIComponent(orderNumber)}/stream?email=${encodeURIComponent(email)}`
      const response = await fetch(this.buildUrl(endpoint), { signal: controller.signal })
      if (!response.ok || !response.body) throw new Error('No se pudo conectar a las actualizaciones')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (!controller.signal.aborted) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        let boundary = buffer.indexOf('\n\n')
        while (boundary >= 0) {
          const event = buffer.slice(0, boundary)
          buffer = buffer.slice(boundary + 2)
          const data = event.split('\n').find((line) => line.startsWith('data: '))
          if (data) onOrder(JSON.parse(data.slice(6)))
          boundary = buffer.indexOf('\n\n')
        }
      }
      if (!controller.signal.aborted) onError?.()
    })().catch(() => {
      if (!controller.signal.aborted) onError?.()
    })

    return controller
  }
}

export default new OrderService()
