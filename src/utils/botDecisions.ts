/**
 * Qué decidió el bot en cada turno, en palabras del equipo (el código R… sale de services/whatsappBot/router.ts
 * del backend). `tone` pinta la etiqueta: good = avanzó, warn = hay que mirar, bad = algo falló, info = neutro.
 */
export type DecisionTone = 'good' | 'warn' | 'bad' | 'info'

const EXACT: Record<string, { label: string; tone: DecisionTone }> = {
  'R0:reinicio': { label: 'Reinició la conversación (prueba)', tone: 'info' },
  'R0:duplicado': { label: 'Mensaje repetido: misma respuesta', tone: 'info' },
  'R0:ocupado': { label: 'Seguía procesando el anterior', tone: 'warn' },
  'R0:mensaje_vacio': { label: 'Llegó un mensaje vacío', tone: 'warn' },
  'R0:media_no_soportada': { label: 'Audio o video: pidió texto o foto', tone: 'info' },
  'R0:error': { label: 'Error del servidor', tone: 'bad' },
  'R1:ubicacion': { label: 'Recibió la ubicación y cotizó el delivery', tone: 'good' },
  'R1:ubicacion_invalida': { label: 'No pudo leer la ubicación', tone: 'warn' },
  'R1:local_mas_cercano': { label: 'Sugirió el local más cercano', tone: 'good' },
  'R2:humano': { label: 'Pasó a un asesor humano', tone: 'warn' },
  'R2:soy_bot': { label: 'Respondió que es un bot', tone: 'info' },
  'R2:opt_out': { label: 'El cliente pidió que no le escriban', tone: 'warn' },
  'R3:consultar_pedido': { label: 'Consultó el estado del pedido', tone: 'good' },
  'R5:repetir_pedido': { label: 'Ofreció repetir el último pedido', tone: 'good' },
  'R7:orden_creada': { label: 'Creó la orden', tone: 'good' },
  'R7:ya_confirmado': { label: 'La orden ya estaba creada', tone: 'info' },
  'R7:error_creando': { label: 'No pudo crear la orden', tone: 'bad' },
  'R7:seguimiento_orden': { label: 'Habló sobre la orden ya creada', tone: 'info' },
  'R8:ver_carrito': { label: 'Mostró lo que lleva', tone: 'info' },
  'R9:menu': { label: 'Mostró el menú', tone: 'good' },
  'R10:ai': { label: 'Entendió el pedido (IA)', tone: 'good' },
  'R10:heuristic': { label: 'Entendió el pedido', tone: 'good' },
  'R10:saludo': { label: 'Saludo / cortesía', tone: 'info' },
  'R10:respuesta_al_paso': { label: 'Respondió la pregunta del paso', tone: 'good' },
  'R10:programar': { label: 'Programó el pedido', tone: 'good' },
  'R11:no_entendido': { label: 'No entendió', tone: 'warn' },
  'R11:ayuda': { label: 'No entendió dos veces: ofreció ayuda', tone: 'warn' },
  'R11:fuera_de_tema': { label: 'Fuera de tema: lo redirigió', tone: 'info' },
  'R11:fuera_de_alcance': { label: 'Pregunta sin respuesta: redirigió', tone: 'info' },
  'R12:foto_producto': { label: 'Foto: encontró el producto', tone: 'good' },
  'R12:foto_parecidos': { label: 'Foto: ofreció parecidos', tone: 'good' },
  'R12:foto_sin_producto': { label: 'Foto: no está en el menú', tone: 'warn' },
  'R12:foto_otra': { label: 'Foto: no supo qué era', tone: 'warn' },
  'R12:foto_ilegible': { label: 'Foto: no se pudo abrir', tone: 'warn' },
  'R12:comprobante_sin_orden': { label: 'Comprobante sin pedido con tarjeta', tone: 'info' },
}

const PAYMENT: Record<string, { label: string; tone: DecisionTone }> = {
  paid_now: { label: 'Verificó el pago: PAGADO', tone: 'good' },
  already_paid: { label: 'El pago ya estaba confirmado', tone: 'good' },
  pending: { label: 'Verificó el pago: aún no llega', tone: 'warn' },
  rejected: { label: 'Verificó el pago: rechazado', tone: 'bad' },
  mismatch: { label: 'Verificó el pago: monto distinto', tone: 'bad' },
  not_applicable: { label: 'Pago en efectivo: nada que verificar', tone: 'info' },
  error: { label: 'No pudo verificar el pago', tone: 'bad' },
}

export function describeDecision(code: string): { label: string; tone: DecisionTone } {
  if (!code) return { label: 'Sin decisión', tone: 'info' }
  if (EXACT[code]) return EXACT[code]
  const payment = code.match(/^R7:pago(?:_captura)?_(\w+)$/)
  if (payment) {
    const found = PAYMENT[payment[1] || ''] || { label: 'Verificó el pago', tone: 'info' as DecisionTone }
    return code.includes('captura') ? { ...found, label: `${found.label} (captura)` } : found
  }
  if (code.startsWith('R4:')) return { label: 'Eligió una opción', tone: 'good' }
  if (code.startsWith('R6:')) return { label: 'Cambió el carrito', tone: 'good' }
  if (code.startsWith('R7:')) return { label: 'En el resumen del pedido', tone: 'info' }
  if (code.startsWith('R9:')) return { label: 'Respondió una pregunta frecuente', tone: 'good' }
  if (code.startsWith('R10:')) return { label: 'Avanzó el pedido', tone: 'good' }
  if (code.startsWith('R1:')) return { label: 'Entrega o ubicación', tone: 'info' }
  return { label: code, tone: 'info' }
}

const STEPS: Record<string, string> = {
  idle: 'Sin pedido',
  choosing: 'Eligiendo opción',
  delivery_type: 'Delivery o retiro',
  location: 'Esperando ubicación',
  address: 'Esperando dirección',
  branch: 'Eligiendo local',
  name: 'Esperando nombre',
  email: 'Esperando correo',
  payment: 'Eligiendo pago',
  invoice_doc: 'Esperando cédula/RUC',
  invoice_name: 'Esperando razón social',
  confirm: 'En el resumen',
  closed: 'Local cerrado',
  ordered: 'Orden creada',
}

export function describeStep(step?: string) {
  return (step && STEPS[step]) || step || '—'
}
