import { ref, watch } from 'vue'

export type AdminTheme = 'light' | 'dark'

const STORAGE_KEY = 'admin_theme'

function initialTheme(): AdminTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* sin almacenamiento: se sigue al sistema */
  }
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Un solo estado para todo el panel: el layout lo pinta y el botón del topbar lo cambia. */
const theme = ref<AdminTheme>(initialTheme())

watch(theme, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* modo privado: el tema vive solo en esta pestaña */
  }
})

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Cambia el tema con una transición circular que nace del botón (View Transitions API).
 * Sin soporte, los colores se funden; con movimiento reducido, cambia al instante.
 */
function toggleTheme(origin?: { x: number; y: number }) {
  const next: AdminTheme = theme.value === 'dark' ? 'light' : 'dark'
  const doc = document as Document & { startViewTransition?: (callback: () => void) => { ready: Promise<void> } }
  if (reducedMotion()) {
    theme.value = next
    return
  }
  if (!doc.startViewTransition) {
    // Sin View Transitions: los colores se funden durante el cambio y luego se quita la clase.
    document.documentElement.classList.add('admin-theme-fading')
    theme.value = next
    window.setTimeout(() => document.documentElement.classList.remove('admin-theme-fading'), 400)
    return
  }
  const x = origin?.x ?? window.innerWidth - 40
  const y = origin?.y ?? 40
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
  const transition = doc.startViewTransition(() => {
    theme.value = next
    // La captura del "después" es inmediata: el atributo se pone ya, sin esperar al watch del layout.
    document.documentElement.dataset.adminTheme = next
    document.documentElement.style.colorScheme = next
  })
  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
    .catch(() => {})
}

export function useAdminTheme() {
  return { theme, toggleTheme }
}
