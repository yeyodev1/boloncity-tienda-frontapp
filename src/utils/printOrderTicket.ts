import type { OrderDTO } from '@/services/OrderService'

export function printOrderTicket(order: OrderDTO) {
  const popup = window.open('', '_blank', 'width=420,height=720')
  if (!popup) return
  const items = (order.items || []).map((item) => `<tr><td>${item.quantity} x ${item.name}</td><td>$${(item.price * item.quantity).toFixed(2)}</td></tr>`).join('')
  popup.document.write(`<!doctype html><html><head><title>Ticket ${order.orderNumber}</title><style>body{color:#000;font:14px Arial;margin:20px;max-width:320px}h1{font-size:22px;margin:0;text-align:center}h2{font-size:15px;margin:4px 0;text-align:center}.meta{font-size:12px;text-align:center}.type{border:1px solid #000;font-weight:700;margin:12px 0;padding:7px;text-align:center}table{border-collapse:collapse;margin-top:14px;width:100%}td{border-bottom:1px dashed #000;padding:7px 0}td:last-child{text-align:right}.total{font-size:18px;font-weight:700;margin-top:14px;text-align:right}.muted{font-size:12px;text-align:center}</style></head><body><h1>BOLONCITY</h1><h2>${order.orderNumber}</h2><p class="meta">${order.branch?.name || 'Sucursal'}<br>${new Date(order.createdAt || Date.now()).toLocaleString('es-EC')}</p><p class="type">${order.deliveryType === 'delivery' ? 'ENTREGA A DOMICILIO' : 'RETIRO EN SUCURSAL'}</p><p><strong>Cliente:</strong> ${order.customerName || order.customerEmail}</p><table>${items}</table><p class="total">TOTAL: $${(order.total / 100).toFixed(2)}</p><p class="muted">${order.notes || ''}</p></body></html>`)
  popup.document.close()
  popup.focus()
  popup.print()
}
