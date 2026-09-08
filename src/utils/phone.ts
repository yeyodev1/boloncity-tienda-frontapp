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
