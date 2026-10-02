import APIBase from './httpBase'

export interface BotMetrics {
  conversations: number
  messages: number
  avgResponseMs: number
  aiVoiceShare: number
  errors: number
  humanHandoffs: number
  optOuts: number
  offTopic: number
  notUnderstood: number
  whatsappOrders: number
  whatsappPaidOrders: number
  /** Dólares. */
  whatsappRevenue: number
  webOrders: number
  whatsappShare: number
  conversion: number
}

export interface BotConversationRow {
  phone: string
  name: string
  firstAt: string
  lastAt: string
  messages: number
  lastMessage: string
  lastReply: string
  lastDecision: string
  lastStep: string
  orders: string[]
  lastOrder: { orderNumber: string; status: string } | null
  human: boolean
  errors: number
  optedOut: boolean
}

export interface BotTurn {
  id: string
  at: string
  endpoint: string
  message: string
  reply: string
  decision: string
  step: string
  route: string
  orderNumber: string
  aiVoice: boolean
  media: string
  ms: number
  error: string
}

export interface BotConversationDetail {
  phone: string
  name: string
  state: {
    stage: string
    cart: Array<{ name: string; quantity: number }>
    deliveryType?: string
    paymentMethod?: string
    branchName?: string
    scheduledLabel?: string
    lastOrderNumber?: string
    optedOut: boolean
  } | null
  turns: BotTurn[]
  orders: Array<{
    id: string
    orderNumber: string
    status: string
    total: number
    createdAt: string
    source: string
    paymentMethod: string
    deliveryType: string
    scheduledFor: string | null
  }>
}

class BotAdminService extends APIBase {
  private range(from?: string, to?: string, extra: Record<string, string> = {}) {
    const q = new URLSearchParams(extra)
    if (from) q.set('from', from)
    if (to) q.set('to', to)
    const query = q.toString()
    return query ? `?${query}` : ''
  }

  metrics(from?: string, to?: string) {
    return this.get<BotMetrics>(`bot-admin/metrics${this.range(from, to)}`)
  }

  conversations(from?: string, to?: string, search = '') {
    return this.get<BotConversationRow[]>(`bot-admin/conversations${this.range(from, to, search ? { q: search } : {})}`)
  }

  conversation(phone: string) {
    return this.get<BotConversationDetail>(`bot-admin/conversations/${encodeURIComponent(phone)}`)
  }
}

export default new BotAdminService()
