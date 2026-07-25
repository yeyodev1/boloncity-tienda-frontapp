export const PICKER_STEPS = [
  { key: 'ON_HOLD', label: 'Preparando', icon: 'fa-kitchen-set' },
  { key: 'READY_FOR_PICKUP', label: 'Buscando delivery', icon: 'fa-magnifying-glass' },
  { key: 'ACCEPTED', label: 'Delivery asignado', icon: 'fa-motorcycle' },
  { key: 'ARRIVED_AT_PICKUP', label: 'En el local', icon: 'fa-store' },
  { key: 'WAY_TO_DELIVER', label: 'En camino', icon: 'fa-truck-fast' },
  { key: 'ARRIVED_AT_DELIVERY', label: 'Llegó', icon: 'fa-location-dot' },
  { key: 'COMPLETED', label: 'Entregado', icon: 'fa-circle-check' },
]

export const FAILURE_STATUSES = [
  'PROVIDER_NOT_FOUND',
  'CANCELLED_BY_BUSINESS',
  'CANCELLED_BY_ADMIN',
  'CANCELLED_BY_DELIVERY_PROVIDER',
  'NOT_DELIVERED',
  'RETURNING',
  'RETURNED',
]

export const FAILURE_LABELS: Record<string, string> = {
  PROVIDER_NOT_FOUND: 'Sin delivery disponible',
  CANCELLED_BY_BUSINESS: 'Cancelado',
  CANCELLED_BY_ADMIN: 'Cancelado',
  CANCELLED_BY_DELIVERY_PROVIDER: 'Cancelado',
  NOT_DELIVERED: 'No se pudo entregar',
  RETURNING: 'Devolviendo',
  RETURNED: 'Devuelto',
}

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export const STATUS_ICONS: Record<string, string> = {
  pending: 'fa-hourglass-half',
  paid: 'fa-credit-card',
  preparing: 'fa-kitchen-set',
  ready: 'fa-bag-shopping',
  delivered: 'fa-circle-check',
  cancelled: 'fa-ban',
}

export const ACTION_LABELS: Record<string, string> = {
  created: 'Pedido creado',
  status_change: 'Cambio de estado',
  payment_confirmed: 'Pago confirmado',
  user_assigned: 'Usuario asignado',
  note_added: 'Nota agregada',
  branch_assigned: 'Sucursal asignada',
}

export const ACTION_ICONS: Record<string, string> = {
  created: 'fa-receipt',
  status_change: 'fa-route',
  payment_confirmed: 'fa-credit-card',
  user_assigned: 'fa-user-check',
  note_added: 'fa-message',
  branch_assigned: 'fa-store',
}
