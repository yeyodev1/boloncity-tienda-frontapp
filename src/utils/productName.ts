const SMALL_WORDS = new Set(['de', 'del', 'con', 'y', 'e', 'o', 'a', 'al', 'en', 'la', 'el', 'los', 'las', 'sin', 'por', 'para'])

/**
 * Los nombres llegan del POS en mayúsculas ("BOLON QUESO VERDE"). En la tienda se leen mejor
 * como título ("Bolon Queso Verde"); las siglas cortas (BBQ, XL, 12CM) se respetan.
 */
/** El POS no guarda tildes ("BOLON", "CLASICOS"): en la tienda se muestran bien escritas. */
const ACCENTS: Record<string, string> = {
  bolon: 'bolón', bolones: 'bolones', chicharron: 'chicharrón', camaron: 'camarón', camarones: 'camarones',
  clasico: 'clásico', clasicos: 'clásicos', clasica: 'clásica', clasicas: 'clásicas', tipico: 'típico', tipicos: 'típicos',
  tipica: 'típica', tipicas: 'típicas', energetico: 'energético', pinton: 'pintón', cafe: 'café', cafes: 'cafés',
  jamon: 'jamón', limon: 'limón', maracuya: 'maracuyá', platano: 'plátano', azucar: 'azúcar', menu: 'menú',
  corazon: 'corazón', tradicion: 'tradición', guayaca: 'guayaca', mani: 'maní', pina: 'piña', cana: 'caña',
  economico: 'económico', clasicazo: 'clasicazo', salchipapa: 'salchipapa', organico: 'orgánico', te: 'té',
  aguacate: 'aguacate', sanduche: 'sánduche', sandwich: 'sándwich', papas: 'papas', jugo: 'jugo',
}

/** Respeta la mayúscula inicial de la palabra al ponerle la tilde. */
function withAccent(word: string) {
  const lower = word.toLowerCase()
  const accented = ACCENTS[lower]
  if (!accented || accented === lower) return word
  return word.charAt(0) === word.charAt(0).toUpperCase() ? accented.charAt(0).toUpperCase() + accented.slice(1) : accented
}

export function displayProductName(name: string) {
  const text = String(name || '').trim()
  if (!text) return text
  if (text !== text.toUpperCase()) return text.split(/(\s+)/).map(withAccent).join('')
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (/\d/.test(word) || /^(bbq|xl|xxl)$/.test(word)) return word.toUpperCase()
      if (index > 0 && SMALL_WORDS.has(word)) return withAccent(word)
      return withAccent(word.charAt(0).toUpperCase() + word.slice(1))
    })
    .join(' ')
}

/** Descripción en mayúsculas del POS → oración ("ENCEBOLLADO A LA MEJOR CALIDAD" → "Encebollado a la mejor calidad"). */
export function displayDescription(text?: string) {
  const value = String(text || '').trim()
  // "COMBOS · COCINA": las categorías del POS copiadas como descripción al importar. No le dicen nada al cliente.
  if (value.includes('·') && value.split('·').every((part) => part.trim().split(/\s+/).length <= 3)) return ''
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
