import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: 'Home' },
  },
  {
    path: '/catalogo',
    name: 'Catalog',
    component: () => import('../views/CatalogView.vue'),
    meta: { title: 'Catálogo | Boloncity' },
  },
  {
    path: '/producto/:slug',
    name: 'ProductDetail',
    component: () => import('../views/ProductDetailView.vue'),
    meta: { title: 'Producto | Boloncity' },
  },
  {
    path: '/carrito',
    name: 'Cart',
    component: () => import('../views/CartView.vue'),
    meta: { title: 'Carrito | Boloncity' },
  },
  {
    path: '/checkout',
    name: 'Checkout',
    component: () => import('../views/CheckoutView.vue'),
    meta: { title: 'Checkout | Boloncity' },
  },
  {
    path: '/pay-response',
    name: 'PayResponse',
    component: () => import('../views/CheckoutResponseView.vue'),
    meta: { title: 'Confirmando pago | Boloncity' },
  },
  {
    path: '/checkout/response',
    name: 'CheckoutResponse',
    component: () => import('../views/CheckoutResponseView.vue'),
    meta: { title: 'Confirmando pago | Boloncity' },
  },
  {
    path: '/pedido',
    name: 'TrackOrder',
    component: () => import('../views/TrackOrderView.vue'),
    meta: { title: 'Seguir pedido | Boloncity' },
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: 'Ingresar | Boloncity' },
  },
  {
    path: '/registro',
    alias: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { title: 'Registro | Boloncity' },
  },
  {
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: () => import('../views/ForgotPasswordView.vue'),
    meta: { title: 'Recuperar contraseña | Boloncity' },
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: () => import('../views/ResetPasswordView.vue'),
    meta: { title: 'Restablecer contraseña | Boloncity' },
  },
  {
    path: '/mis-ordenes',
    name: 'MyOrders',
    component: () => import('../views/MyOrdersView.vue'),
    meta: { title: 'Mis pedidos | Boloncity', requiresAuth: true },
  },
  {
    path: '/mis-ordenes/:id',
    name: 'MyOrderDetail',
    component: () => import('../views/MyOrderDetailView.vue'),
    meta: { title: 'Detalle pedido | Boloncity', requiresAuth: true },
  },
  {
    path: '/perfil',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { title: 'Mi perfil | Boloncity', requiresAuth: true },
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../views/admin/AdminDashboard.vue'),
    meta: { title: 'Admin | Boloncity', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/categorias',
    name: 'AdminCategories',
    component: () => import('../views/admin/AdminCategories.vue'),
    meta: { title: 'Categorias | Boloncity', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/productos',
    name: 'AdminProducts',
    component: () => import('../views/admin/AdminProducts.vue'),
    meta: { title: 'Productos | Boloncity', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/rewards',
    name: 'AdminRewards',
    component: () => import('../views/admin/AdminRewards.vue'),
    meta: { title: 'Rewards | Boloncity', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/ordenes',
    name: 'AdminOrdersKanban',
    component: () => import('../views/admin/AdminOrdersKanban.vue'),
    meta: { title: 'Ordenes | Boloncity', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/ordenes/:id',
    name: 'AdminOrderDetail',
    component: () => import('../views/admin/AdminOrderDetail.vue'),
    meta: { title: 'Detalle orden | Boloncity', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/sucursales',
    name: 'AdminBranches',
    component: () => import('../views/admin/AdminBranches.vue'),
    meta: { title: 'Sucursales | Boloncity', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/usuarios',
    name: 'AdminUsers',
    component: () => import('../views/admin/AdminUsers.vue'),
    meta: { title: 'Usuarios | Boloncity', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/admin/configuracion',
    name: 'AdminSettings',
    component: () => import('../views/admin/AdminSettings.vue'),
    meta: { title: 'Configuración | Boloncity', requiresAuth: true, requiresAdmin: true },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: 'Pagina no encontrada | Boloncity' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0, behavior: 'smooth' }
  },
})

function getAuthenticatedLanding(role: string | null) {
  if (['admin', 'branch_admin'].includes(role || '')) {
    return '/admin'
  }

  return '/mis-ordenes'
}

router.beforeEach((to, _from, next) => {
  const hasToken = !!localStorage.getItem('access_token')
  const role = localStorage.getItem('user_account_type')
  const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth)
  const requiresAdmin = to.matched.some((record) => record.meta?.requiresAdmin)

  if (requiresAuth && !hasToken) {
    return next({ path: '/login', replace: true })
  }

  if ((to.name === 'Login' || to.name === 'Register') && hasToken) {
    return next({ path: getAuthenticatedLanding(role), replace: true })
  }

  if (requiresAdmin && !['admin', 'branch_admin'].includes(role || '')) {
    return next({ path: getAuthenticatedLanding(role), replace: true })
  }

  next()
})

router.afterEach((to) => {
  document.title = (to.meta?.title as string) || 'Boloncity'
})

export default router
