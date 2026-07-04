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
}

export interface OrderDTO {
  _id: string
  orderNumber: string
  status: string
  total: number
  subtotal: number
  tax: number
  customerEmail: string
  customerName?: string
  customerPhone?: string
  branch?: { _id: string; name: string }
  audit?: Array<{ action: string; performedByEmail?: string; fromValue?: string; toValue?: string; details?: string; timestamp: string }>
  items?: Array<{ name: string; quantity: number; price: number }>
  payphone?: { clientTransactionId?: string; transactionId?: number; statusCode?: number }
  createdAt?: string
  updatedAt?: string
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

  getById(id: string) {
    return this.get<OrderDTO>(`orders/by-id/${id}`)
  }

  getAll() {
    return this.get<OrderDTO[]>('orders')
  }

  updateStatus(id: string, status: string, note?: string) {
    return this.put<OrderDTO>(`orders/${id}/status`, { status, note })
  }

  addNote(id: string, note: string) {
    return this.post<OrderDTO>(`orders/${id}/notes`, { note })
  }
}

export default new OrderService()
