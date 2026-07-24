<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter, RouterLink, useRoute } from 'vue-router'
import logoImg from '@/assets/logos/logo.png'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'
import { useConfirm } from '@/composables/useConfirm'
import imagesData from '@/assets/images.json'
import { gsap } from 'gsap'

const cart = useCartStore()
const user = useUserStore()
const route = useRoute()
const router = useRouter()
const { confirm } = useConfirm()
const mobileOpen = ref(false)
const userDropdownOpen = ref(false)
const menuBg = ref(imagesData[6]?.url || imagesData[0]?.url)
const menuOverlay = ref<HTMLElement | null>(null)
const menuLinks = ref<HTMLElement | null>(null)
const menuContent = ref<HTMLElement | null>(null)

cart.hydrate()
user.hydrate()

const cartCount = computed(() => cart.count)
const userLabel = computed(() => user.name || user.email || 'Mi cuenta')
const userInitial = computed(() => (userLabel.value?.trim()?.[0] || 'U').toUpperCase())
const isStaff = computed(() => ['admin', 'branch_admin'].includes(user.accountType || ''))


function closeMenu() {
  if (!mobileOpen.value) return
  gsap.to(menuOverlay.value, {
    scaleY: 0,
    transformOrigin: 'top',
    duration: 0.5,
    ease: 'expo.inOut',
    onComplete: () => {
      mobileOpen.value = false
      document.body.style.overflow = ''
    }
  })
  if (menuLinks.value) {
    gsap.to(Array.from(menuLinks.value.children), {
      y: 40,
      opacity: 0,
      stagger: 0.04,
      duration: 0.3,
      ease: 'power2.in'
    })
  }
  gsap.to(menuContent.value, {
    opacity: 0,
    duration: 0.25,
    ease: 'power2.in'
  })
}

function openMenu() {
  mobileOpen.value = true
  document.body.style.overflow = 'hidden'
  requestAnimationFrame(() => {
    gsap.fromTo(menuOverlay.value,
      { scaleY: 0, transformOrigin: 'top' },
      { scaleY: 1, duration: 0.6, ease: 'expo.inOut' }
    )
    if (menuLinks.value) {
      gsap.fromTo(Array.from(menuLinks.value.children),
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.07, duration: 0.5, ease: 'power3.out', delay: 0.25 }
      )
    }
    gsap.fromTo(menuContent.value,
      { opacity: 0 },
      { opacity: 1, duration: 0.4, ease: 'power2.out', delay: 0.3 }
    )
  })
}

function toggleMenu() {
  if (mobileOpen.value) closeMenu()
  else openMenu()
}

function navigateAndClose(path: string) {
  closeMenu()
  router.push(path)
}

async function logout() {
  const ok = await confirm({
    title: 'Cerrar sesión',
    message: '¿Estás seguro de que quieres salir de tu cuenta?',
    confirmText: 'Cerrar sesión',
    cancelText: 'Cancelar',
    type: 'danger',
    icon: '<svg width="80" height="80" viewBox="0 0 80 80" fill="none"><rect x="4" y="4" width="72" height="72" rx="36" fill="#FEF2F2"/><rect x="4" y="4" width="72" height="72" rx="36" stroke="#FEE2E2" stroke-width="2"/><path d="M34 30l-6 6m0 0l6 6m-6-6h16M48 26h4a2 2 0 012 2v20a2 2 0 01-2 2h-4" stroke="#B42318" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  })
  if (ok) {
    user.clear()
    cart.persist()
    closeMenu()
    userDropdownOpen.value = false
    router.push('/')
  }
}

watch(() => route.path, () => {
  if (mobileOpen.value) closeMenu()
  userDropdownOpen.value = false
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <header class="store-header" :class="{ 'is-menu-open': mobileOpen }">
    <div class="store-header__bar">
      <RouterLink class="store-header__brand" to="/">
        <img :src="logoImg" alt="Boloncity" class="store-header__logo" />
      </RouterLink>

      <nav class="store-header__nav">
        <RouterLink :class="{ active: route.path === '/' }" to="/">Inicio</RouterLink>
        <RouterLink :class="{ active: route.path === '/catalogo' }" to="/catalogo">Menú</RouterLink>
        <RouterLink :class="{ active: route.path === '/pedido' }" to="/pedido">Seguimiento</RouterLink>
        <button v-if="!user.isAuthenticated" class="store-header__cta" @click="navigateAndClose('/login')">
          Ingresar
        </button>
      </nav>

      <div class="store-header__actions">
        <template v-if="user.isAuthenticated">
          <div class="store-header__user-dropdown" @click.stop>
            <button
              class="store-header__avatar-link"
              @click="userDropdownOpen = !userDropdownOpen"
              @keydown.escape="userDropdownOpen = false"
            >
              <span v-if="user.photo" class="store-header__avatar-img">
                <img :src="user.photo" alt="" />
              </span>
              <span v-else class="store-header__avatar">{{ userInitial }}</span>
            </button>
            <Transition name="dropdown">
              <div v-if="userDropdownOpen" class="store-header__dropdown" @click="userDropdownOpen = false">
                <div class="store-header__dropdown-head">
                  <span v-if="user.photo" class="store-header__dropdown-avatar">
                    <img :src="user.photo" alt="" />
                  </span>
                  <span v-else class="store-header__dropdown-avatar store-header__dropdown-avatar--text">{{ userInitial }}</span>
                  <div class="store-header__dropdown-info">
                    <strong>{{ userLabel }}</strong>
                    <small>{{ user.email }}</small>
                  </div>
                </div>
                <RouterLink class="store-header__dropdown-item" to="/perfil">
                  <i class="fa-solid fa-user" /> Mi perfil
                </RouterLink>
                <RouterLink class="store-header__dropdown-item" :to="isStaff ? '/admin' : '/mis-ordenes'">
                  <i class="fa-solid fa-box" /> {{ isStaff ? 'Panel' : 'Mis pedidos' }}
                </RouterLink>
                <button class="store-header__dropdown-item store-header__dropdown-item--danger" @click.stop="logout">
                  <i class="fa-solid fa-arrow-right-from-bracket" /> Cerrar sesión
                </button>
              </div>
            </Transition>
          </div>
        </template>
        <template v-else>
          <RouterLink class="store-header__login" to="/login">
            <i class="fa-regular fa-user" />
            <span>Ingresar</span>
          </RouterLink>
        </template>

        <RouterLink class="store-header__cart" to="/carrito">
          <i class="fa-solid fa-bag-shopping" />
          <strong v-if="cartCount > 0">{{ cartCount }}</strong>
        </RouterLink>

        <button class="store-header__toggle" type="button" @click="toggleMenu" :aria-label="mobileOpen ? 'Cerrar menú' : 'Abrir menú'">
          <span class="store-header__toggle-bar" :class="{ open: mobileOpen }" />
          <span class="store-header__toggle-bar" :class="{ open: mobileOpen }" />
        </button>
      </div>
    </div>

    <Teleport to="body">
      <div v-show="mobileOpen" ref="menuOverlay" class="store-menu">
        <div class="store-menu__bg">
          <img :src="menuBg" alt="" aria-hidden="true" />
        </div>

        <div class="store-menu__inner">
          <div ref="menuLinks" class="store-menu__links">
            <button class="store-menu__link" @click="navigateAndClose('/')">
              <span class="store-menu__link-num">01</span>
              <span class="store-menu__link-label">Inicio</span>
            </button>
            <button class="store-menu__link" @click="navigateAndClose('/catalogo')">
              <span class="store-menu__link-num">02</span>
              <span class="store-menu__link-label">Menú</span>
            </button>
            <button class="store-menu__link" @click="navigateAndClose('/pedido')">
              <span class="store-menu__link-num">03</span>
              <span class="store-menu__link-label">Seguimiento</span>
            </button>
            <button class="store-menu__link" @click="navigateAndClose('/carrito')">
              <span class="store-menu__link-num">04</span>
              <span class="store-menu__link-label">Carrito</span>
            </button>
            <button v-if="isStaff" class="store-menu__link" @click="navigateAndClose('/admin')">
              <span class="store-menu__link-num">05</span>
              <span class="store-menu__link-label">Panel</span>
            </button>
          </div>

          <div ref="menuContent" class="store-menu__content">
            <template v-if="user.isAuthenticated">
              <div class="store-menu__user">
                <span class="store-menu__user-avatar">{{ userInitial }}</span>
                <div class="store-menu__user-info">
                  <strong>{{ userLabel }}</strong>
                  <small>{{ user.email }}</small>
                </div>
              </div>
              <div class="store-menu__user-actions">
                <RouterLink class="store-menu__user-btn" to="/perfil" @click="closeMenu">
                  <i class="fa-regular fa-user" />
                  Mi perfil
                </RouterLink>
                <RouterLink class="store-menu__user-btn" :to="isStaff ? '/admin' : '/mis-ordenes'" @click="closeMenu">
                  <i class="fa-solid fa-box" />
                  {{ isStaff ? 'Panel' : 'Mis pedidos' }}
                </RouterLink>
                <button class="store-menu__user-btn store-menu__user-btn--outline" @click="logout">
                  <i class="fa-solid fa-arrow-right-from-bracket" />
                  Cerrar sesión
                </button>
              </div>
            </template>
            <template v-else>
              <div class="store-menu__guest">
                <p class="store-menu__guest-title">¿Ya probaste Boloncity?</p>
                <p class="store-menu__guest-sub">Crea tu cuenta para pedir más rápido y seguir tus órdenes.</p>
                <div class="store-menu__guest-actions">
                  <RouterLink class="store-menu__guest-btn store-menu__guest-btn--primary" to="/registro" @click="closeMenu">
                    Crear cuenta
                    <i class="fa-solid fa-arrow-right" />
                  </RouterLink>
                  <RouterLink class="store-menu__guest-btn store-menu__guest-btn--ghost" to="/login" @click="closeMenu">
                    Ya tengo cuenta · Ingresar
                  </RouterLink>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </header>
</template>

<style scoped lang="scss">
.store-header {
  left: 0;
  padding: 0.6rem 0.75rem 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 100;
}

.store-header__bar {
  align-items: center;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(26, 26, 26, 0.06);
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(26, 26, 26, 0.06);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  gap: 0.35rem;
  justify-content: space-between;
  margin: 0 auto;
  max-width: 1200px;
  padding: 0.35rem;
  position: relative;
  z-index: 2;
}

.store-header__brand {
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  position: relative;
  z-index: 2;
}

.store-header__logo {
  display: block;
  height: auto;
  max-height: 32px;
  max-width: min(34vw, 110px);
  object-fit: contain;
  width: 100px;
}

.store-header__nav {
  display: none;
  align-items: center;
  gap: 0.15rem;
  flex: 1 1 auto;
  justify-content: center;
}

.store-header__nav a,
.store-header__nav button {
  background: transparent;
  border: none;
  border-radius: 999px;
  color: rgba(26, 26, 26, 0.72);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 0.5rem 0.9rem;
  position: relative;
  text-transform: uppercase;
  transition: color 0.2s ease, background 0.2s ease;
}

.store-header__nav a:hover,
.store-header__nav button:hover {
  background: rgba(35, 89, 49, 0.08);
  color: #235931;
}

.store-header__nav a.active {
  background: rgba(35, 89, 49, 0.1);
  color: #235931;
}

.store-header__cta {
  margin-left: 0.5rem;
  background: #235931 !important;
  color: #fff !important;
}

.store-header__cta:hover {
  background: #00a523 !important;
}

.store-header__actions {
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  gap: 0.3rem;
  position: relative;
  z-index: 2;
}

.store-header__login {
  align-items: center;
  background: transparent;
  border-radius: 999px;
  color: rgba(26, 26, 26, 0.72);
  display: none;
  font-size: 0.82rem;
  font-weight: 700;
  gap: 0.4rem;
  letter-spacing: 0.04em;
  min-height: 38px;
  padding: 0 0.7rem;
  text-transform: uppercase;
  transition: background 0.2s ease, color 0.2s ease;
}

.store-header__login:hover {
  background: rgba(35, 89, 49, 0.08);
  color: #235931;
}

.store-header__login i {
  font-size: 0.9rem;
}

.store-header__user-dropdown {
  position: relative;
}

.store-header__avatar-link {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  display: inline-flex;
  min-height: 38px;
  padding: 0 0.5rem 0 0.3rem;
  transition: background 0.2s ease;
}

.store-header__avatar-link:hover { background: rgba(35, 89, 49, 0.08); }

.store-header__avatar {
  align-items: center;
  background: #235931;
  border-radius: 50%;
  color: #fff;
  display: inline-flex;
  font-size: 0.8rem;
  font-weight: 800;
  height: 32px;
  justify-content: center;
  width: 32px;
}

.store-header__avatar-img {
  border-radius: 50%;
  display: inline-flex;
  height: 32px;
  overflow: hidden;
  width: 32px;
}

.store-header__avatar-img img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.store-header__dropdown {
  background: #fff;
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
  min-width: 220px;
  padding: 0.5rem;
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 999;
}

.store-header__dropdown-head {
  align-items: center;
  border-bottom: 1px solid rgba(35, 89, 49, 0.06);
  display: flex;
  gap: 0.65rem;
  margin-bottom: 0.25rem;
  padding: 0.4rem 0.5rem 0.7rem;
}

.store-header__dropdown-avatar {
  align-items: center;
  background: #235931;
  border-radius: 50%;
  color: #fff;
  display: flex;
  flex: 0 0 36px;
  font-size: 0.85rem;
  font-weight: 800;
  height: 36px;
  justify-content: center;
  overflow: hidden;
  width: 36px;
}

.store-header__dropdown-avatar img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.store-header__dropdown-avatar--text { background: rgba(35, 89, 49, 0.15); color: #235931; }

.store-header__dropdown-info {
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
  min-width: 0;
}

.store-header__dropdown-info strong {
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.store-header__dropdown-info small {
  color: rgba(8, 17, 13, 0.45);
  font-size: 0.74rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.store-header__dropdown-item {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: rgba(8, 17, 13, 0.7);
  cursor: pointer;
  display: flex;
  font-size: 0.85rem;
  font-weight: 600;
  gap: 0.5rem;
  min-height: 38px;
  padding: 0.35rem 0.5rem;
  text-align: left;
  text-decoration: none;
  transition: background 0.15s ease, color 0.15s ease;
  width: 100%;
}

.store-header__dropdown-item i { font-size: 0.82rem; width: 18px; }

.store-header__dropdown-item:hover { background: rgba(35, 89, 49, 0.06); color: #235931; }

.store-header__dropdown-item--danger { color: #a02828; }
.store-header__dropdown-item--danger:hover { background: rgba(160, 40, 40, 0.06); color: #a02828; }

.dropdown-enter-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.dropdown-leave-active { transition: all 0.15s ease; }
.dropdown-enter-from { opacity: 0; transform: translateY(-6px) scale(0.96); }
.dropdown-leave-to { opacity: 0; transform: translateY(-4px) scale(0.96); }

.store-header__cart {
  align-items: center;
  background: transparent;
  border-radius: 999px;
  color: rgba(26, 26, 26, 0.72);
  display: inline-flex;
  gap: 0.35rem;
  min-height: 38px;
  min-width: 38px;
  padding: 0 0.5rem;
  position: relative;
  transition: background 0.2s ease;
}

.store-header__cart:hover {
  background: rgba(35, 89, 49, 0.08);
}

.store-header__cart i {
  font-size: 1.05rem;
}

.store-header__cart strong {
  align-items: center;
  background: #235931;
  border-radius: 50%;
  color: #fff;
  display: inline-flex;
  font-size: 0.65rem;
  font-weight: 800;
  height: 18px;
  justify-content: center;
  min-width: 18px;
  padding: 0 0.2rem;
}

.store-header__toggle {
  align-items: center;
  background: transparent;
  border-radius: 999px;
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  height: 38px;
  justify-content: center;
  position: relative;
  width: 38px;
  z-index: 2;
}

.store-header__toggle-bar {
  background: rgba(26, 26, 26, 0.72);
  border-radius: 2px;
  display: block;
  height: 2px;
  transition: transform 0.3s ease, opacity 0.3s ease;
  width: 18px;
}

.store-header__toggle-bar.open:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}

.store-header__toggle-bar.open:nth-child(2) {
  transform: translateY(-6px) rotate(-45deg);
}

/* === FULLSCREEN MENU === */

.store-menu {
  inset: 0;
  position: fixed;
  z-index: 99;
}

.store-menu__bg {
  inset: 0;
  position: absolute;
  z-index: 0;
}

.store-menu__bg img {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.store-menu__bg::after {
  background: linear-gradient(180deg, rgba(8, 17, 13, 0.38) 0%, rgba(8, 17, 13, 0.86) 60%);
  content: '';
  inset: 0;
  position: absolute;
}

.store-menu__inner {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  height: 100%;
  justify-content: space-between;
  padding: 6rem 1.5rem 2.5rem;
  position: relative;
  z-index: 1;
}

.store-menu__links {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  width: 100%;
}

.store-menu__link {
  align-items: center;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.82);
  display: flex;
  font-size: clamp(2.4rem, 12vw, 4.5rem);
  font-weight: 900;
  gap: 1rem;
  letter-spacing: -0.06em;
  line-height: 1;
  padding: 0.5rem 0;
  text-align: left;
  text-transform: uppercase;
  transition: color 0.2s ease;
}

.store-menu__link:hover {
  color: #efd537;
}

.store-menu__link-num {
  color: rgba(255, 255, 255, 0.22);
  font-size: clamp(0.7rem, 3vw, 1rem);
  font-weight: 700;
  letter-spacing: 0.08em;
  margin-top: 0.4em;
}

.store-menu__content {
  width: 100%;
}

.store-menu__guest {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 1.25rem;
  backdrop-filter: blur(8px);
}

.store-menu__guest-title {
  color: #fff;
  font-size: 1rem;
  font-weight: 800;
  margin-bottom: 0.25rem;
}

.store-menu__guest-sub {
  color: rgba(255, 255, 255, 0.62);
  font-size: 0.85rem;
  line-height: 1.5;
  margin-bottom: 1rem;
}

.store-menu__guest-actions {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.store-menu__guest-btn {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.88rem;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  letter-spacing: 0.04em;
  min-height: 48px;
  padding: 0.7rem 1.2rem;
  text-transform: uppercase;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.store-menu__guest-btn:hover {
  transform: translateY(-2px);
}

.store-menu__guest-btn--primary {
  background: #efd537;
  color: #08110d;
  box-shadow: 0 8px 24px rgba(239, 213, 55, 0.25);
}

.store-menu__guest-btn--primary:hover {
  box-shadow: 0 12px 36px rgba(239, 213, 55, 0.35);
}

.store-menu__guest-btn--ghost {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.84);
}

.store-menu__guest-btn--ghost:hover {
  background: rgba(255, 255, 255, 0.14);
}

.store-menu__user {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.store-menu__user-avatar {
  align-items: center;
  background: #efd537;
  border-radius: 50%;
  color: #08110d;
  display: inline-flex;
  font-size: 1rem;
  font-weight: 900;
  height: 40px;
  justify-content: center;
  width: 40px;
}

.store-menu__user-info {
  display: flex;
  flex-direction: column;
}

.store-menu__user-info strong {
  color: #fff;
  font-size: 1rem;
}

.store-menu__user-info small {
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.8rem;
}

.store-menu__user-actions {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.store-menu__user-btn {
  align-items: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.84);
  display: inline-flex;
  font-size: 0.88rem;
  font-weight: 700;
  gap: 0.5rem;
  justify-content: center;
  letter-spacing: 0.04em;
  min-height: 46px;
  padding: 0.7rem 1.2rem;
  transition: background 0.2s ease;
}

.store-menu__user-btn:hover {
  background: rgba(255, 255, 255, 0.14);
}

.store-menu__user-btn--outline {
  background: rgba(200, 60, 60, 0.1);
  border-color: rgba(200, 60, 60, 0.15);
  color: rgba(255, 180, 180, 0.9);
}

.store-menu__user-btn--outline:hover {
  background: rgba(200, 60, 60, 0.2);
}

@media (min-width: 641px) {
  .store-header {
    padding: 0.8rem 1.25rem 0;
  }

  .store-header__bar {
    border-radius: 20px;
    padding: 0.45rem 0.5rem;
  }

  .store-header__logo {
    max-height: 34px;
    width: 110px;
  }

  .store-header__login {
    display: inline-flex;
  }

  .store-menu__inner {
    padding: 7rem 3rem 3rem;
  }

  .store-menu__guest {
    padding: 1.5rem;
  }

  .store-menu__guest-actions {
    flex-direction: row;
  }

  .store-menu__guest-btn {
    flex: 1;
  }
}

@media (min-width: 1025px) {
  .store-header {
    padding: 1rem 1.5rem 0;
  }

  .store-header__bar {
    border-radius: 999px;
    padding: 0.45rem 0.5rem 0.45rem 1rem;
  }

  .store-header__nav {
    display: flex;
  }

  .store-header__toggle {
    display: none;
  }

  .store-header__login {
    display: inline-flex;
  }

  .store-menu {
    display: none !important;
  }
}
</style>
