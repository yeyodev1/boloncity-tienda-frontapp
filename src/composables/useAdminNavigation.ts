import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'

export interface AdminNavItem {
  label: string
  path: string
  icon: string
}

export function useAdminNavigation() {
  const route = useRoute()
  const userStore = useUserStore()
  const isAdmin = computed(() => userStore.allBranches || userStore.accountType === 'admin')
  const items = computed<AdminNavItem[]>(() => userStore.accountType === 'branch_admin' ? [
    { label: 'Mi operación', path: '/admin/operacion', icon: 'fa-solid fa-kitchen-set' },
    // Historial con buscador y rango de fechas: el tablero de operación solo trae el mes en
    // curso, y la sucursal necesita ubicar pedidos anteriores (pagos, programados) por número.
    { label: 'Órdenes', path: '/admin/ordenes', icon: 'fa-solid fa-clipboard-list' },
    { label: 'Disponibilidad', path: '/admin/disponibilidad', icon: 'fa-solid fa-list-check' },
    { label: 'Chats del bot', path: '/admin/bot', icon: 'fa-brands fa-whatsapp' },
  ] : [
    { label: 'Resumen', path: '/admin', icon: 'fa-solid fa-chart-pie' },
    { label: 'Órdenes', path: '/admin/ordenes', icon: 'fa-solid fa-clipboard-list' },
    { label: 'Chats del bot', path: '/admin/bot', icon: 'fa-brands fa-whatsapp' },
    { label: 'Productos', path: '/admin/productos', icon: 'fa-solid fa-box-open' },
    { label: 'Disponibilidad', path: '/admin/disponibilidad', icon: 'fa-solid fa-list-check' },
    { label: 'Rewards', path: '/admin/rewards', icon: 'fa-solid fa-gift' },
    { label: 'Clientes', path: '/admin/clientes', icon: 'fa-solid fa-user-group' },
    { label: 'Carritos', path: '/admin/carritos', icon: 'fa-solid fa-cart-arrow-down' },
    { label: 'Categorías', path: '/admin/categorias', icon: 'fa-solid fa-layer-group' },
    ...(isAdmin.value ? [{ label: 'Sucursales', path: '/admin/sucursales', icon: 'fa-solid fa-store' }] : []),
    { label: 'Usuarios', path: '/admin/usuarios', icon: 'fa-solid fa-users' },
    ...(isAdmin.value ? [{ label: 'Configuración', path: '/admin/configuracion', icon: 'fa-solid fa-sliders' }] : []),
  ])

  function isActive(path: string) {
    return path === '/admin' ? route.path === path : route.path.startsWith(path)
  }

  return { items, isAdmin, isActive }
}
