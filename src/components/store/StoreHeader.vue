<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter, RouterLink, useRoute } from 'vue-router'
import logoImg from '@/assets/logos/logo.png'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const cart = useCartStore()
const user = useUserStore()
const route = useRoute()
const router = useRouter()
const mobileOpen = ref(false)

cart.hydrate()
user.hydrate()

const cartCount = computed(() => cart.count)
const userLabel = computed(() => user.name || user.email || 'Mi cuenta')
const userInitial = computed(() => (userLabel.value?.trim()?.[0] || 'U').toUpperCase())
const isStaff = computed(() => ['admin', 'branch_admin'].includes(user.accountType || ''))

function closeMenu() {
  mobileOpen.value = false
}

function logout() {
  user.clear()
  cart.persist()
  closeMenu()
  router.push('/login')
}

watch(mobileOpen, (isOpen) => {
  document.body.style.overflow = isOpen ? 'hidden' : ''
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <header class="store-header" :class="{ 'is-menu-open': mobileOpen }">
    <div class="store-header__inner" :class="{ 'is-menu-open': mobileOpen }">
      <RouterLink class="store-header__brand" to="/" @click="closeMenu">
        <img :src="logoImg" alt="Boloncity" class="store-header__logo" />
      </RouterLink>

      <nav class="store-header__nav" :class="{ 'is-open': mobileOpen }">
        <RouterLink :class="{ active: route.path === '/' }" to="/" @click="closeMenu">Inicio</RouterLink>
        <RouterLink :class="{ active: route.path === '/catalogo' }" to="/catalogo" @click="closeMenu">Menú</RouterLink>
        <RouterLink :class="{ active: route.path === '/pedido' }" to="/pedido" @click="closeMenu">Seguimiento</RouterLink>
        <RouterLink :class="{ active: route.path === '/carrito' }" to="/carrito" @click="closeMenu">Carrito</RouterLink>
        <RouterLink v-if="user.isAuthenticated && isStaff" :class="{ active: route.path.startsWith('/admin') }" to="/admin" @click="closeMenu">Panel</RouterLink>
      </nav>

      <div class="store-header__actions">
        <RouterLink v-if="!user.isAuthenticated" class="store-header__pill" to="/login">
          Ingresar
        </RouterLink>

        <div v-else class="store-header__session">
          <RouterLink class="store-header__session-link" :to="isStaff ? '/admin' : '/pedido'">
            <span class="store-header__avatar">{{ userInitial }}</span>
            <span class="store-header__session-copy">
              <strong>{{ userLabel }}</strong>
              <small>{{ isStaff ? 'Panel' : 'Mi cuenta' }}</small>
            </span>
          </RouterLink>

          <button class="store-header__logout" type="button" @click="logout">Salir</button>
        </div>

        <RouterLink class="store-header__cart" to="/carrito">
          <span>Carrito</span>
          <strong>{{ cartCount }}</strong>
        </RouterLink>
        <button class="store-header__menu" type="button" @click="mobileOpen = !mobileOpen" aria-label="Abrir menú">
          <span />
          <span />
          <span />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.store-header {
  padding: 0.35rem 0.5rem 0;
  position: sticky;
  top: 0;
  z-index: 60;
}

.store-header.is-menu-open {
  z-index: 200;
}

.store-header__inner {
  align-items: center;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(26, 26, 26, 0.06);
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(26, 26, 26, 0.06);
  display: flex;
  gap: 0.35rem;
  justify-content: space-between;
  padding: 0.35rem;
  position: relative;
  z-index: 3;
}

.store-header__inner.is-menu-open {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}

.store-header.is-menu-open .store-header__cart {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.store-header.is-menu-open .store-header__cart strong {
  background: #fff;
  color: #235931;
}

.store-header.is-menu-open .store-header__menu {
  background: rgba(255, 255, 255, 0.12);
}

.store-header.is-menu-open .store-header__pill {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.14);
}

.store-header.is-menu-open .store-header__session-link {
  background: rgba(255, 255, 255, 0.12);
}

.store-header.is-menu-open .store-header__session-copy strong,
.store-header.is-menu-open .store-header__session-copy small {
  color: #fff;
}

.store-header.is-menu-open .store-header__logout {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.84);
}

.store-header__brand {
  align-items: center;
  display: inline-flex;
  flex: 1 1 auto;
  gap: 0.85rem;
  min-width: 0;
  overflow: hidden;
  position: relative;
  z-index: 2;
}

.store-header__logo {
  display: block;
  flex: 0 1 auto;
  height: auto;
  max-height: 36px;
  max-width: min(38vw, 130px);
  object-fit: contain;
  width: 130px;
}

.store-header__nav {
  align-items: stretch;
  background:
    radial-gradient(circle at 15% 10%, rgba(239, 213, 55, 0.24), transparent 34%),
    linear-gradient(135deg, #235931, #0c2212);
  border: 0;
  border-radius: 0;
  bottom: auto;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  height: 100dvh;
  inset: 0;
  justify-content: flex-start;
  left: auto;
  min-height: 100vh;
  opacity: 0;
  overflow-y: auto;
  padding: clamp(8rem, 28vw, 10rem) clamp(1.25rem, 6vw, 4rem) 2rem;
  pointer-events: none;
  position: fixed;
  transform: translateY(-100%);
  transition: opacity 0.3s ease, transform 0.42s cubic-bezier(0.83, 0, 0.17, 1);
  width: 100vw;
  z-index: 1;
}

.store-header__nav.is-open {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
  z-index: 1;
}

.store-header__nav a {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.84);
  font-size: clamp(2rem, 10vw, 3.8rem);
  font-weight: 900;
  letter-spacing: -0.06em;
  line-height: 1;
  padding: 1rem 0;
  position: relative;
  text-transform: uppercase;
}

.store-header__nav a::after {
  background: #efd537;
  bottom: 0;
  content: '';
  height: 2px;
  left: 0;
  position: absolute;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.25s ease;
  width: 100%;
}

.store-header__nav a:hover::after,
.store-header__nav a.active::after {
  transform: scaleX(1);
}

.store-header__nav a.active {
  color: #efd537;
}

@media (min-width: 901px) {
  .store-header__nav {
    padding: clamp(10rem, 22vw, 12rem) clamp(3rem, 8vw, 6rem) 2rem;
  }

  .store-header__nav a {
    font-size: clamp(2.2rem, 5vw, 4.5rem);
  }

  .store-header__pill {
    display: inline-flex;
  }
}

.store-header__actions {
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  gap: 0.45rem;
  position: relative;
  z-index: 2;
}

.store-header__pill,
.store-header__cart {
  @include pill-button(rgba(26, 26, 26, 0.05), #1a1a1a);
  min-height: 44px;
  padding: 0.6rem 0.7rem;
}

.store-header__cart {
  background: rgba(35, 89, 49, 0.08);
  color: #235931;
  min-width: 48px;
}

.store-header__cart span {
  display: none;
}

.store-header__cart strong {
  background: #235931;
  border-radius: 999px;
  color: #fff;
  align-items: center;
  display: inline-flex;
  height: 24px;
  justify-content: center;
  min-width: 24px;
  padding: 0 0.4rem;
}

.store-header__menu {
  align-items: center;
  background: rgba(26, 26, 26, 0.05);
  border-radius: 999px;
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  height: 44px;
  justify-content: center;
  width: 44px;
  position: relative;
  z-index: 2;
}

.store-header__menu span {
  background: #1a1a1a;
  border-radius: 999px;
  display: block;
  height: 2px;
  width: 18px;
}

.store-header.is-menu-open .store-header__menu span {
  background: #fff;
}

.store-header__pill,
.store-header__session-copy {
  display: none;
}

.store-header__session-link {
  padding-right: 0.45rem;
}

.store-header__session {
  align-items: center;
  display: inline-flex;
  gap: 0.5rem;
}

.store-header__session-link {
  align-items: center;
  background: rgba(35, 89, 49, 0.08);
  border-radius: 999px;
  display: inline-flex;
  gap: 0.65rem;
  min-height: 44px;
  padding: 0.4rem 0.9rem 0.4rem 0.45rem;
}

.store-header__avatar {
  align-items: center;
  background: #235931;
  border-radius: 50%;
  color: #fff;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.85rem;
  font-weight: 800;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.store-header__session-copy {
  flex-direction: column;
  line-height: 1;
}

.store-header__session-copy strong {
  font-size: 0.9rem;
}

.store-header__session-copy small {
  color: rgba(26, 26, 26, 0.62);
  font-size: 0.74rem;
  margin-top: 0.2rem;
}

.store-header__logout {
  @include pill-button(rgba(160, 40, 40, 0.08), #a02828);
  min-height: 44px;
  padding: 0.75rem 1rem;
}

@media (min-width: 641px) {
  .store-header {
    padding: 0.3rem 1rem 0;
  }

  .store-header__inner {
    border-radius: 16px;
    gap: 0.5rem;
    padding: 0.35rem 0.6rem;
  }

  .store-header__logo {
    max-height: 34px;
    max-width: none;
    width: 130px;
  }

  .store-header__cart {
    padding: 0.45rem 0.65rem;
  }

  .store-header__cart span {
    display: inline;
  }

  .store-header__session-copy {
    display: flex;
  }
}

@media (min-width: 901px) {
  .store-header__pill {
    display: inline-flex;
  }
}
</style>
