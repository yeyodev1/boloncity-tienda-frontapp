const SMALL_WORDS = new Set(['de', 'del', 'con', 'y', 'e', 'o', 'a', 'al', 'en', 'la', 'el', 'los', 'las', 'sin', 'por', 'para'])

/**
 * Los nombres llegan del POS en mayúsculas ("BOLON QUESO VERDE"). En la tienda se leen mejor
 * como título ("Bolon Queso Verde"); las siglas cortas (BBQ, XL, 12CM) se respetan.
 */
export function displayProductName(name: string) {
  const text = String(name || '').trim()
  if (!text || text !== text.toUpperCase()) return text
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (/\d/.test(word) || /^(bbq|xl|xxl)$/.test(word)) return word.toUpperCase()
      if (index > 0 && SMALL_WORDS.has(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/** Descripción en mayúsculas del POS → oración ("ENCEBOLLADO A LA MEJOR CALIDAD" → "Encebollado a la mejor calidad"). */
export function displayDescription(text?: string) {
  const value = String(text || '').trim()
  if (!value || value !== value.toUpperCase() || !/[A-ZÁÉÍÓÚÑ]/.test(value)) return value
  const lower = value.toLowerCase()
  return lower.charAt(0).toUpperCase() + lower.slice(1)
}

/**
 * Categorías internas del POS (grupos de cocina/caja, stock, empaques, adicionales): existen para operar,
 * no para que el cliente elija. Misma regla que usa el bot de WhatsApp (backend: isCustomerCategory).
 */
const INTERNAL_CATEGORY = /^(cocina|caja|general)$|stockeable|agrandar|contenedor|desechable|empaque|adicional|jalea|^extra |extra para|congelado/

export function isCustomerCategory(category: { name: string }) {
  const name = String(category?.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
  return Boolean(name) && !INTERNAL_CATEGORY.test(name)
}
