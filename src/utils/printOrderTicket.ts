import type { OrderDTO } from '@/services/OrderService'

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`

export function printOrderTicket(order: OrderDTO) {
  const popup = window.open('', '_blank', 'width=420,height=720')
  if (!popup) return
  const items = (order.items || [])
    .map((item) => `<tr><td>${item.quantity} x ${item.name}</td><td>$${(item.price * item.quantity).toFixed(2)}</td></tr>`)
    .join('')
  const scheduled = order.scheduledFor
    ? `<p class="type">PROGRAMADO: ${new Date(order.scheduledFor).toLocaleString('es-EC', { timeZone: 'America/Guayaquil', dateStyle: 'short', timeStyle: 'short' })}</p>`
    : ''
  const paymentLabel = order.paymentMethod === 'cash' ? 'EFECTIVO — cobra el motorizado' : 'TARJETA (PayPhone)'
  const discountRow = (order.discount || 0) > 0 ? `<tr><td>Descuento puntos (${order.pointsRedeemed} pts)</td><td>-${money(order.discount || 0)}</td></tr>` : ''
  const deliveryRow = (order.deliveryCost || 0) > 0 ? `<tr><td>Envío${order.deliveryDistance ? ` (${order.deliveryDistance.toFixed(1)} km)` : ''}</td><td>${money(order.deliveryCost || 0)}</td></tr>` : ''
  popup.document.write(`<!doctype html><html><head><title>Ticket ${order.orderNumber}</title><style>
    body{color:#000;font:14px Arial;margin:20px;max-width:320px}
    h1{font-size:22px;margin:0;text-align:center}
    h2{font-size:15px;margin:4px 0;text-align:center}
    .meta{font-size:12px;text-align:center}
    .type{border:1px solid #000;font-weight:700;margin:10px 0;padding:7px;text-align:center}
    .datos{border-top:1px dashed #000;font-size:13px;margin-top:10px;padding-top:8px}
    .datos p{margin:3px 0}
    table{border-collapse:collapse;margin-top:12px;width:100%}
    td{border-bottom:1px dashed #000;padding:6px 0}
    td:last-child{text-align:right;white-space:nowrap}
    .resumen td{border-bottom:0;padding:3px 0}
    .total{font-size:18px;font-weight:700;margin-top:10px;text-align:right}
    .puntos{border:2px solid #000;font-size:15px;font-weight:700;margin-top:12px;padding:8px;text-align:center}
    .muted{font-size:12px;margin-top:10px;text-align:center}
  </style></head><body>
    <h1>BOLONCITY</h1>
    <h2>${order.orderNumber}</h2>
    <p class="meta">${order.branch?.name || 'Sucursal'}<br>${new Date(order.createdAt || Date.now()).toLocaleString('es-EC', { timeZone: 'America/Guayaquil' })}</p>
    <p class="type">${order.deliveryType === 'delivery' ? 'ENTREGA A DOMICILIO' : 'RETIRO EN SUCURSAL'}</p>
    ${scheduled}
    <div class="datos">
      <p><strong>Cliente:</strong> ${order.customerName || order.customerEmail}</p>
      ${order.customerPhone ? `<p><strong>Teléfono:</strong> ${order.customerPhone}</p>` : ''}
      ${order.customerEmail ? `<p><strong>Correo:</strong> ${order.customerEmail}</p>` : ''}
      ${order.deliveryType === 'delivery' && order.deliveryAddress ? `<p><strong>Dirección:</strong> ${order.deliveryAddress}</p>` : ''}
      <p><strong>Pago:</strong> ${paymentLabel}</p>
    </div>
    <table>${items}</table>
    <table class="resumen">
      <tr><td>Subtotal</td><td>${money(order.subtotal || 0)}</td></tr>
      ${deliveryRow}
      ${discountRow}
    </table>
    <p class="total">TOTAL: ${money(order.total)}</p>
    <p class="puntos">&#11088; PUNTOS QUE GANA: ${order.pointsEarned || 0}</p>
    ${order.notes ? `<p class="muted"><strong>Notas:</strong> ${order.notes}</p>` : ''}
  </body></html>`)
  popup.document.close()
  popup.focus()
  popup.print()
}
