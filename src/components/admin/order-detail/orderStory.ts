import type { OrderDTO } from '@/services/OrderService'

/**
 * "Qué pasó con este pedido": convierte la auditoría de la orden (más los datos de PayPhone y Picker que no
 * siempre dejan línea de auditoría) en una historia en palabras, en orden cronológico.
 */

export type StoryTone = 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'accent'

export interface StoryEvent {
  key: string
  at: string
  title: string
  detail?: string
  who?: string
  icon: string
  tone: StoryTone
}

export const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  preparing: 'En preparación',
  awaiting_pickup: 'Lista / por recoger',
  ready: 'En entrega',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
}

const statusIcons: Record<string, string> = {
  pending: 'fa-clock',
  paid: 'fa-credit-card',
  preparing: 'fa-fire-burner',
  awaiting_pickup: 'fa-box',
  ready: 'fa-motorcycle',
  delivered: 'fa-circle-check',
  cancelled: 'fa-ban',
}

const statusTones: Record<string, StoryTone> = {
  paid: 'info',
  preparing: 'warning',
  awaiting_pickup: 'accent',
  ready: 'info',
  delivered: 'success',
  cancelled: 'danger',
}

/** Estados que manda Picker (el motorizado). Llegan a la auditoría como cambios de estado. */
const pickerLabels: Record<string, { label: string; tone: StoryTone; icon: string }> = {
  ON_HOLD: { label: 'Picker en espera', tone: 'neutral', icon: 'fa-clock' },
  READY_FOR_PICKUP: { label: 'Buscando motorizado', tone: 'info', icon: 'fa-magnifying-glass' },
  ACCEPTED: { label: 'Motorizado asignado', tone: 'info', icon: 'fa-motorcycle' },
  WAY_TO_PICKUP: { label: 'Motorizado va al local', tone: 'info', icon: 'fa-motorcycle' },
  ARRIVED_AT_PICKUP: { label: 'Motorizado llegó al local', tone: 'info', icon: 'fa-store' },
  WAY_TO_DELIVER: { label: 'En camino al cliente', tone: 'info', icon: 'fa-truck-fast' },
  ARRIVED_AT_DELIVERY: { label: 'Motorizado llegó donde el cliente', tone: 'info', icon: 'fa-location-dot' },
  COMPLETED: { label: 'Picker entregó el pedido', tone: 'success', icon: 'fa-circle-check' },
  CANCELLED: { label: 'Picker canceló el delivery', tone: 'danger', icon: 'fa-ban' },
  CANCELLED_BY_DELIVERY_PROVIDER: { label: 'Picker canceló el delivery', tone: 'danger', icon: 'fa-ban' },
  CANCELLED_BY_CUSTOMER: { label: 'Delivery cancelado en Picker', tone: 'danger', icon: 'fa-ban' },
  EXPIRED: { label: 'Picker no encontró motorizado', tone: 'danger', icon: 'fa-hourglass-end' },
}

/** "SOME_PICKER_STATE" → "Some picker state" para estados que todavía no conocemos. */
function humanize(value: string) {
  const text = value.replace(/_/g, ' ').toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const isPickerState = (value?: string) => Boolean(value && /^[A-Z][A-Z_]+$/.test(value))

export const statusLabel = (status?: string) => {
  if (!status) return '—'
  if (statusLabels[status]) return statusLabels[status]
  if (isPickerState(status)) return pickerLabels[status]?.label || humanize(status)
  return status
}
export const statusIcon = (status?: string) => (status ? statusIcons[status] || 'fa-circle-info' : 'fa-circle-info')

/** Quién hizo algo, dicho para una persona: sistema, el cliente o el correo del equipo. */
function whoLabel(order: OrderDTO, email?: string) {
  if (!email || email === 'system') return 'Sistema'
  if (email.toLowerCase() === (order.customerEmail || '').toLowerCase()) return 'Cliente'
  return email
}

/** Una línea de auditoría, traducida. */
function fromAudit(order: OrderDTO, entry: NonNullable<OrderDTO['audit']>[number], index: number): StoryEvent {
  const base = { key: `a${index}`, at: entry.timestamp, who: whoLabel(order, entry.performedByEmail) }
  const details = entry.details || ''
  switch (entry.action) {
    case 'created':
      return { ...base, title: 'Pedido recibido', detail: details || undefined, icon: 'fa-receipt', tone: 'neutral' }
    case 'payment_confirmed':
      return { ...base, title: 'Pago confirmado', detail: details || undefined, icon: 'fa-credit-card', tone: 'success' }
    case 'status_change': {
      const to = entry.toValue || ''
      // Cambios del motorizado (Picker): se cuentan como eventos de entrega, no como estado del pedido.
      if (isPickerState(to)) {
        const picker = pickerLabels[to]
        return {
          ...base,
          title: picker?.label || `Picker: ${humanize(to)}`,
          detail: details.replace(/^Picker delivery:\s*/i, '') || undefined,
          icon: picker?.icon || 'fa-motorcycle',
          tone: picker?.tone || 'info',
        }
      }
      return {
        ...base,
        title: `Pasó a «${statusLabel(to)}»`,
        detail: [entry.fromValue ? `Antes: ${statusLabel(entry.fromValue)}` : '', details].filter(Boolean).join(' · ') || undefined,
        icon: statusIcon(to),
        tone: statusTones[to] || 'neutral',
      }
    }
    case 'refund_requested':
      return { ...base, title: 'Devolución solicitada', detail: details || undefined, icon: 'fa-rotate-left', tone: 'warning' }
    case 'refunded':
      return { ...base, title: 'Dinero devuelto al cliente', detail: details || undefined, icon: 'fa-rotate-left', tone: 'success' }
    case 'refund_failed':
      return { ...base, title: 'PayPhone rechazó la devolución', detail: details || undefined, icon: 'fa-triangle-exclamation', tone: 'danger' }
    case 'payment_mismatch':
      return { ...base, title: 'El monto pagado no coincide', detail: details || undefined, icon: 'fa-scale-unbalanced', tone: 'danger' }
    case 'branch_assigned':
      return { ...base, title: 'Sucursal asignada', detail: details || undefined, icon: 'fa-store', tone: 'neutral' }
    case 'user_assigned':
      return { ...base, title: 'Cliente vinculado a su cuenta', detail: details || undefined, icon: 'fa-user', tone: 'neutral' }
    case 'note_added':
      return fromNote(base, details)
    default:
      return { ...base, title: 'Actualización', detail: details || undefined, icon: 'fa-circle-info', tone: 'neutral' }
  }
}

/** Las "notas" del sistema son eventos de Picker, RunFood o puntos: se reconocen por su texto. */
function fromNote(base: { key: string; at: string; who: string }, details: string): StoryEvent {
  if (/^(Delivery reintentado — )?Picker booking #\d+ creado/i.test(details)) {
    return { ...base, title: 'Motorizado pedido a Picker', detail: details.replace(/^Delivery reintentado — /, 'Reintento · '), icon: 'fa-motorcycle', tone: 'info' }
  }
  if (/Picker booking falló|No se pudo (cancelar|solicitar)/i.test(details)) {
    return { ...base, title: 'Problema con Picker', detail: details, icon: 'fa-triangle-exclamation', tone: 'danger' }
  }
  if (/Reserva de Picker .* cancelada/i.test(details)) {
    return { ...base, title: 'Reserva de Picker cancelada', detail: details, icon: 'fa-motorcycle', tone: 'neutral' }
  }
  if (/^RunFood NO/i.test(details)) {
    return { ...base, title: 'La cocina (RunFood) no recibió el pedido', detail: details.replace(/^RunFood NO recibió el pedido: /i, ''), icon: 'fa-triangle-exclamation', tone: 'danger' }
  }
  if (/^RunFood:/i.test(details)) {
    return { ...base, title: 'Enviado a la cocina (RunFood)', detail: details.replace(/^RunFood: /i, ''), icon: 'fa-fire-burner', tone: 'warning' }
  }
  if (/^Canje de puntos/i.test(details)) {
    return { ...base, title: 'Canjeó puntos', detail: details.replace(/^Canje de puntos: /i, ''), icon: 'fa-star', tone: 'accent' }
  }
  return { ...base, title: base.who === 'Sistema' ? 'Nota del sistema' : 'Nota del equipo', detail: details, icon: 'fa-note-sticky', tone: 'neutral' }
}

/** La historia completa del pedido, de lo más viejo a lo más nuevo. */
export function buildStory(order: OrderDTO): StoryEvent[] {
  const audit = order.audit || []
  const events = audit.map((entry, index) => fromAudit(order, entry, index))

  // Pedidos viejos sin "created" en la auditoría: igual arrancan cuando se crearon.
  if (order.createdAt && !audit.some((entry) => entry.action === 'created')) {
    events.push({ key: 'created', at: order.createdAt, title: 'Pedido recibido', icon: 'fa-receipt', tone: 'neutral', who: 'Cliente' })
  }
  // El pago con tarjeta no siempre deja línea propia: se toma de PayPhone.
  const payphone = order.payphone
  if (payphone?.confirmedAt && !audit.some((entry) => entry.action === 'payment_confirmed' || entry.toValue === 'paid')) {
    const card = [payphone.cardBrand, payphone.lastDigits ? `••${payphone.lastDigits}` : ''].filter(Boolean).join(' ')
    events.push({ key: 'paid', at: payphone.confirmedAt, title: 'Pago confirmado', detail: card ? `Tarjeta ${card}` : undefined, icon: 'fa-credit-card', tone: 'success', who: 'PayPhone' })
  }
  if (payphone?.refund?.refundedAt && !audit.some((entry) => entry.action === 'refunded')) {
    events.push({ key: 'refunded', at: payphone.refund.refundedAt, title: 'Dinero devuelto al cliente', detail: payphone.refund.reason, icon: 'fa-rotate-left', tone: 'success', who: payphone.refund.requestedByEmail })
  }
  if (order.cancellation?.at && !audit.some((entry) => entry.toValue === 'cancelled')) {
    events.push({ key: 'cancelled', at: order.cancellation.at, title: 'Pedido cancelado', detail: order.cancellation.reason, icon: 'fa-ban', tone: 'danger', who: order.cancellation.byName || order.cancellation.byEmail })
  }

  return events
    .filter((event) => event.at && !Number.isNaN(new Date(event.at).getTime()))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
}

const TZ = 'America/Guayaquil'

export function absoluteTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-EC', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function clockTime(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-EC', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function dayLabel(value?: string) {
  if (!value) return ''
  return new Intl.DateTimeFormat('es-EC', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(value))
}

/** "hace 5 min", "hace 3 h", "hace 2 días". */
export function relativeTime(value?: string, now = Date.now()) {
  if (!value) return ''
  const minutes = Math.round((now - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'justo ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${days} ${days === 1 ? 'día' : 'días'}`
}

/** "12 min", "1 h 05 min": tiempo entre dos momentos. */
export function duration(from?: string, to?: string) {
  if (!from || !to) return ''
  const minutes = Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 60000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  // Más de un día: en días y horas ("9 días 13 h"), no "229 h 31 min".
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    const restHours = hours % 24
    return `${days} ${days === 1 ? 'día' : 'días'}${restHours ? ` ${restHours} h` : ''}`
  }
  const rest = minutes % 60
  return rest ? `${hours} h ${String(rest).padStart(2, '0')} min` : `${hours} h`
}
