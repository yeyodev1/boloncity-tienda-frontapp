/**
 * Arma el teléfono como "+593 968434421" a partir del código del selector y lo
 * que escribió el cliente, tolerando que el número venga ya con prefijo
 * ("+593968434421"), con cero inicial ("0968434421") o con espacios y guiones.
 *
 * ORD-00152 se quedó sin motorizado porque se mandó "+593 +593968434421" y Picker
 * rechazó el teléfono.
 */
export function composePhone(countryCode: string, rawNumber: string): string {
  const code = countryCode.replace(/\D+/g, '')
  const typedIntl = /^\s*(\+|00)/.test(rawNumber)
  let digits = rawNumber.replace(/\D+/g, '')
  if (typedIntl && digits.startsWith('00')) digits = digits.slice(2)
  // Quita el código de país si el cliente lo escribió (una o más veces) en el número.
  if (code && (typedIntl || digits.length > 10)) {
    while (digits.startsWith(code) && digits.length - code.length >= 7) digits = digits.slice(code.length)
  }
  digits = digits.replace(/^0+/, '')
  return digits ? `+${code} ${digits}` : ''
}

/** Un celular ecuatoriano tiene 9 dígitos y empieza en 9; para otros países basta con 7 a 12. */
export function isPhoneValid(countryCode: string, rawNumber: string): boolean {
  const composed = composePhone(countryCode, rawNumber)
  if (!composed) return false
  const local = composed.split(' ')[1] || ''
  if (countryCode.replace(/\D+/g, '') === '593') return /^9\d{8}$/.test(local) || /^[2-7]\d{6,7}$/.test(local)
  return local.length >= 7 && local.length <= 12
}

/**
 * Lo que se muestra en el campo mientras el cliente escribe: solo dígitos, sin el
 * código de país si lo pegó ("+593968434421" → "968434421"), y con tope de largo
 * para que no se pueda seguir tecleando de más. Se respeta el cero inicial
 * ("0991234567") porque así se dicta un celular en Ecuador; se quita al enviar.
 */
export function sanitizePhoneInput(countryCode: string, raw: string): string {
  const code = countryCode.replace(/\D+/g, '')
  const typedIntl = /^\s*(\+|00)/.test(raw)
  let digits = raw.replace(/\D+/g, '')
  if (typedIntl && digits.startsWith('00')) digits = digits.slice(2)
  if (code && (typedIntl || digits.length > 10)) {
    while (digits.startsWith(code) && digits.length - code.length >= 7) digits = digits.slice(code.length)
  }
  const maxLength = code === '593' ? 10 : 12
  return digits.slice(0, maxLength)
}

export type PhoneState = 'empty' | 'valid' | 'invalid'

export function phoneState(countryCode: string, rawNumber: string): PhoneState {
  if (!rawNumber.replace(/\D+/g, '')) return 'empty'
  return isPhoneValid(countryCode, rawNumber) ? 'valid' : 'invalid'
}

/** Mensaje corto bajo el campo cuando el número no sirve. */
export function phoneHint(countryCode: string, rawNumber: string): string {
  if (phoneState(countryCode, rawNumber) !== 'invalid') return ''
  if (countryCode.replace(/\D+/g, '') === '593') {
    const local = rawNumber.replace(/\D+/g, '').replace(/^0+/, '')
    if (local.length < 9) return `Faltan ${9 - local.length} dígitos. Un celular tiene 9, ej. 0991234567.`
    if (!/^9/.test(local)) return 'Un celular ecuatoriano empieza en 09.'
    return 'Revisa el número: un celular tiene 9 dígitos, ej. 0991234567.'
  }
  return 'Escribe entre 7 y 12 dígitos, sin el código de país.'
}
