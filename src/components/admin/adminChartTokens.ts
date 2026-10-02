/**
 * Colores de los gráficos (Chart.js dibuja en canvas: no entiende `var(--…)`). Se leen de los tokens del panel en
 * el momento de dibujar, así el gráfico queda bien en modo claro y en oscuro.
 */
function read(name: string, fallback: string) {
  if (typeof document === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

/** Color con transparencia. Acepta #rgb, #rrggbb o rgb()/rgba(). */
function alpha(color: string, opacity: number) {
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)?.[1]
  if (hex) {
    const value = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16))
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  const rgb = color.match(/rgba?\(([^)]+)\)/i)?.[1]
  if (rgb) {
    const [r, g, b] = rgb.split(',').map((part) => part.trim())
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }
  return color
}

export function chartTokens() {
  const dark = typeof document !== 'undefined' && document.documentElement.dataset.adminTheme === 'dark'
  return {
    accent: read('--admin-accent', '#235931'),
    // El amarillo de marca no se lee sobre blanco: en claro se usa uno más oscuro para la línea de ventas.
    yellowStrong: dark ? read('--admin-yellow', '#efd537') : '#b98a00',
    text: read('--admin-text', '#132018'),
    muted: read('--admin-muted', 'rgba(19, 32, 24, 0.6)'),
    grid: read('--admin-line', 'rgba(16, 39, 25, 0.09)'),
    surface: read('--admin-surface', '#ffffff'),
    alpha,
  }
}
