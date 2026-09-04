import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/styles/global.scss'
import { useCartStore } from './stores/cart'
import { useBranchStore } from './stores/branch'
import { useUserStore } from './stores/user'
import { initMetaPixel } from './services/metaPixel'

// La tienda nueva NO es una PWA. Si el navegador arrastra un service worker viejo
// (la PWA anterior), sirve datos cacheados y "rompe" cosas como el filtro por
// categoría. Al arrancar, desregistramos cualquier service worker: así el usuario
// queda siempre con la versión real, sin tener que limpiar caché a mano.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((registration) => registration.unregister().catch(() => undefined)))
    .catch(() => undefined)
}

// El pixel se carga antes de montar: así el primer PageView (que dispara el router)
// ya encuentra fbq listo.
initMetaPixel()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

useCartStore(pinia).hydrate()
useBranchStore(pinia).hydrate()
useUserStore(pinia).hydrate()

app.mount('#app')
