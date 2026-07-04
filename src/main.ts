import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import '@/styles/global.scss'
import { useCartStore } from './stores/cart'
import { useBranchStore } from './stores/branch'
import { useUserStore } from './stores/user'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

useCartStore(pinia).hydrate()
useBranchStore(pinia).hydrate()
useUserStore(pinia).hydrate()

app.mount('#app')
