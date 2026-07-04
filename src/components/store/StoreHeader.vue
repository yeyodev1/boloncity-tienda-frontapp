<script setup lang="ts">
import { computed, ref } from 'vue'
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
</script>

<template>
  <header class="store-header">
    <div class="store-header__inner panel">
      <RouterLink class="store-header__brand" to="/" @click="closeMenu">
        <img :src="logoImg" alt="Boloncity" class="store-header__logo" />
        <span class="store-header__brand-copy">
          <strong>Boloncity</strong>
          <small>La metrópolis del sabor</small>
        </span>
      </RouterLink>

      <nav class="store-header__nav" :class="{ 'is-open': mobileOpen }">
        <RouterLink :class="{ active: route.path === '/catalogo' }" to="/catalogo" @click="closeMenu">Catálogo</RouterLink>
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
  padding: 1rem 1.25rem 0;
  position: sticky;
  top: 0;
  z-index: 60;
}

.store-header__inner {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.85rem 1rem;
}

.store-header__brand {
  align-items: center;
  display: inline-flex;
  gap: 0.85rem;
  min-width: 0;
}

.store-header__logo {
  height: 42px;
  object-fit: contain;
  width: auto;
}

.store-header__brand-copy {
  display: grid;
  line-height: 1;
}

.store-header__brand-copy strong {
  font-size: 0.98rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.store-header__brand-copy small {
  color: rgba(26, 26, 26, 0.62);
  font-size: 0.78rem;
  margin-top: 0.2rem;
}

.store-header__nav {
  align-items: center;
  display: flex;
  gap: 1rem;
}

.store-header__nav a {
  color: rgba(26, 26, 26, 0.72);
  font-size: 0.92rem;
  font-weight: 700;
  position: relative;
}

.store-header__nav a::after {
  background: #235931;
  bottom: -0.35rem;
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
  color: #235931;
}

.store-header__actions {
  align-items: center;
  display: inline-flex;
  gap: 0.65rem;
}

.store-header__pill,
.store-header__cart {
  @include pill-button(rgba(26, 26, 26, 0.05), #1a1a1a);
  min-height: 44px;
  padding: 0.75rem 1rem;
}

.store-header__cart {
  background: rgba(35, 89, 49, 0.08);
  color: #235931;
}

.store-header__cart strong {
  background: #235931;
  border-radius: 999px;
  color: #fff;
  display: grid;
  height: 24px;
  min-width: 24px;
  place-items: center;
  padding: 0 0.4rem;
}

.store-header__menu {
  align-items: center;
  background: rgba(26, 26, 26, 0.05);
  border-radius: 999px;
  display: none;
  flex-direction: column;
  gap: 4px;
  height: 44px;
  justify-content: center;
  width: 44px;
}

.store-header__menu span {
  background: #1a1a1a;
  border-radius: 999px;
  display: block;
  height: 2px;
  width: 18px;
}

@media (max-width: 900px) {
  .store-header__nav {
    background: rgba(244, 244, 240, 0.98);
    border: 1px solid rgba(26, 26, 26, 0.08);
    border-radius: 20px;
    box-shadow: 0 24px 40px rgba(26, 26, 26, 0.12);
    display: grid;
    gap: 0.85rem;
    left: 1.25rem;
    opacity: 0;
    padding: 1rem;
    pointer-events: none;
    position: absolute;
    right: 1.25rem;
    top: calc(100% + 0.75rem);
    transform: translateY(-8px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  .store-header__nav.is-open {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }

  .store-header__menu {
    display: inline-flex;
  }

  .store-header__pill {
    display: none;
  }
}

@media (max-width: 640px) {
  .store-header__brand-copy {
    display: none;
  }

  .store-header__session-copy {
    display: none;
  }

  .store-header__session-link {
    padding-right: 0.45rem;
  }
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
  display: grid;
  flex: 0 0 auto;
  font-size: 0.85rem;
  font-weight: 800;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.store-header__session-copy {
  display: grid;
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
</style>
