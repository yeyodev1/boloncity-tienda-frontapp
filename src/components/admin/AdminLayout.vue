<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BranchSelector from './BranchSelector.vue'
import ModalShell from '@/components/global/ModalShell.vue'
import { useUserStore } from '@/stores/user'
import { useConfirm } from '@/composables/useConfirm'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { confirm } = useConfirm()

const storeModalOpen = ref(false)

const isAdmin = computed(() => userStore.allBranches || userStore.accountType === 'admin')

const navItems = computed(() => [
  { label: 'Dashboard', path: '/admin', icon: 'fa-solid fa-chart-simple' },
  { label: 'Ordenes', path: '/admin/ordenes', icon: 'fa-solid fa-clipboard-list' },
  { label: 'Productos', path: '/admin/productos', icon: 'fa-solid fa-box' },
  { label: 'Categorias', path: '/admin/categorias', icon: 'fa-solid fa-layer-group' },
  ...(isAdmin.value ? [{ label: 'Sucursales', path: '/admin/sucursales', icon: 'fa-solid fa-store' }] : []),
  { label: 'Usuarios', path: '/admin/usuarios', icon: 'fa-solid fa-users' },
])

function go(path: string) {
  router.push(path)
}

function goStore() {
  storeModalOpen.value = true
}

function navigateTo(path: string) {
  storeModalOpen.value = false
  window.open(path, '_blank')
}

async function logout() {
  const ok = await confirm({
    title: 'Cerrar sesión',
    message: '¿Estás seguro de que deseas cerrar sesión?',
    confirmText: 'Cerrar sesión',
    type: 'danger',
  })
  if (!ok) return
  userStore.clear()
  router.push('/login')
}
</script>

<template>
  <div class="admin-shell">
    <aside class="sidebar panel">
      <div class="brand">
        <p class="brand__eyebrow">Panel interno</p>
        <strong>Boloncity</strong>
        <small>Dueño del negocio</small>
      </div>

      <nav class="sidebar__nav">
        <button
          v-for="item in navItems"
          :key="item.path"
          type="button"
          :class="{ active: route.path === item.path }"
          @click="go(item.path)"
        >
          <i :class="item.icon" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="sidebar__footer">
        <div class="sidebar__user">
          <span class="sidebar__avatar">{{ (userStore.email || 'A').slice(0, 1).toUpperCase() }}</span>
          <div>
            <strong>{{ userStore.email || 'Admin' }}</strong>
            <small>{{ userStore.accountType || 'admin' }}</small>
          </div>
        </div>
        <button class="sidebar__logout" type="button" @click="logout">Salir</button>
      </div>
    </aside>

    <main class="content">
      <header class="topbar panel">
        <BranchSelector />
        <div class="topbar__actions">
          <button v-if="isAdmin" class="topbar__store-btn" type="button" @click="goStore">
            <i class="fa-solid fa-store" />
            <span>Tienda</span>
          </button>
        </div>
      </header>
      <section class="slot">
        <slot />
      </section>
    </main>

    <nav class="bottom-nav">
      <button v-for="item in navItems" :key="item.path" type="button" @click="go(item.path)">
        <i :class="item.icon" />
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <ModalShell
      :open="storeModalOpen"
      title="Ir a la tienda"
      subtitle="Elige a dónde quieres ir"
      size="sm"
      @close="storeModalOpen = false"
    >
      <div class="store-choice">
        <button class="store-choice__btn store-choice__btn--primary" type="button" @click="navigateTo('/')">
          <i class="fa-solid fa-store" />
          <div>
            <strong>Tienda principal</strong>
            <small>Ver la p&aacute;gina de inicio del e-commerce</small>
          </div>
        </button>
        <button class="store-choice__btn store-choice__btn--secondary" type="button" @click="navigateTo('/catalogo')">
          <i class="fa-solid fa-eye" />
          <div>
            <strong>Cat&aacute;logo</strong>
            <small>Ver los productos como los ven los clientes</small>
          </div>
        </button>
      </div>
    </ModalShell>
  </div>
</template>

<style lang="scss">
.admin-shell {
  --admin-bg: #{$bg-light};
  --admin-surface: #{$white};
  --admin-surface-strong: #{rgba($secondary, 0.16)};
  --admin-line: #{rgba($text-dark, 0.1)};
  --admin-text: #{$text-dark};
  --admin-muted: #{rgba($text-dark, 0.62)};
  --admin-primary: #{$primary-dark};
  --admin-primary-bright: #{$primary};
  --admin-secondary: #{$secondary};
  align-items: stretch;
  background: linear-gradient(180deg, $white, $bg-light);
  color: var(--admin-text);
  display: flex;
  font-family: Switzer, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  gap: 1rem;
  min-height: 100vh;
  padding: 1rem;
}

.panel {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: 22px;
  box-shadow: 0 18px 38px rgba(28, 22, 12, 0.08);
}

.sidebar {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  flex: 0 0 290px;
  gap: 1.25rem;
  padding: 1.25rem;
  position: sticky;
  top: 1rem;
  height: calc(100vh - 2rem);
}

.brand {
  display: grid;
  gap: 0.2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--admin-line);
}

.brand__eyebrow {
  color: var(--admin-primary);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.brand strong {
  font-size: 1.4rem;
  letter-spacing: -0.04em;
}

.brand small {
  color: var(--admin-muted);
}

.sidebar__nav {
  display: grid;
  gap: 0.5rem;
}

.sidebar__nav button,
.bottom-nav button {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 16px;
  color: rgba(24, 33, 27, 0.76);
  display: flex;
  gap: 0.8rem;
  min-height: 52px;
  padding: 0.9rem 1rem;
  text-align: left;
  transition: background-color 0.25s ease, border-color 0.25s ease, transform 0.25s ease;
}

.sidebar__nav button:hover,
.bottom-nav button:hover {
  background: rgba(35, 89, 49, 0.06);
  transform: translateX(2px);
}

.sidebar__nav button.active {
  background: var(--admin-primary);
  border-color: var(--admin-primary);
  color: $white;
}

.sidebar__nav i,
.bottom-nav i {
  width: 18px;
  text-align: center;
}

.sidebar__footer {
  margin-top: auto;
  border-top: 1px solid var(--admin-line);
  display: grid;
  gap: 0.9rem;
  padding-top: 1rem;
}

.sidebar__user {
  align-items: center;
  display: flex;
  gap: 0.75rem;
}

.sidebar__avatar {
  align-items: center;
  background: rgba($primary-dark, 0.12);
  border: 1px solid rgba($primary-dark, 0.18);
  color: var(--admin-primary);
  border-radius: 50%;
  display: grid;
  height: 42px;
  justify-content: center;
  width: 42px;
}

.sidebar__user strong,
.sidebar__user small {
  display: block;
}

.sidebar__user small {
  color: var(--admin-muted);
}

.sidebar__logout {
  background: var(--admin-surface-strong);
  border: 1px solid var(--admin-line);
  border-radius: 14px;
  color: var(--admin-text);
  cursor: pointer;
  min-height: 48px;
  transition: background 0.2s;
}

.sidebar__logout:hover {
  background: rgba($alert-error, 0.1);
  border-color: rgba($alert-error, 0.2);
  color: $alert-error;
}

.content {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  gap: 1rem;
}

.topbar {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  position: sticky;
  top: 1rem;
  z-index: 20;
}

.topbar__actions {
  display: flex;
  gap: 0.5rem;
}

.topbar__store-btn {
  align-items: center;
  background: rgba($primary-dark, 0.1);
  border: 0;
  border-radius: 999px;
  color: $primary-dark;
  cursor: pointer;
  display: inline-flex;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.6rem 1rem;
  font-weight: 700;
  transition: background 0.2s;
}

.topbar__store-btn:hover {
  background: rgba($primary-dark, 0.2);
}

.slot {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0;
}

.bottom-nav {
  display: none;
}

.store-choice {
  display: grid;
  gap: 1rem;
}

.store-choice__btn {
  align-items: center;
  background: $white;
  border: 1px solid rgba($text-dark, 0.1);
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  gap: 1rem;
  min-height: 80px;
  padding: 1rem 1.25rem;
  text-align: left;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.store-choice__btn:hover {
  border-color: $primary-dark;
  box-shadow: 0 4px 16px rgba($primary-dark, 0.12);
}

.store-choice__btn i {
  flex: 0 0 auto;
  font-size: 1.8rem;
  width: 48px;
  height: 48px;
  align-items: center;
  border-radius: 16px;
  display: inline-flex;
  justify-content: center;
}

.store-choice__btn--primary i {
  background: rgba($primary-dark, 0.1);
  color: $primary-dark;
}

.store-choice__btn--secondary i {
  background: rgba($secondary, 0.2);
  color: darken($secondary, 20%);
}

.store-choice__btn strong {
  display: block;
  font-size: 1.05rem;
  margin-bottom: 0.15rem;
}

.store-choice__btn small {
  color: rgba($text-dark, 0.6);
}

/* Admin form surface styles */
.admin-page {
  color: var(--admin-text);
}

.admin-page h1,
.admin-page h2,
.admin-page h3,
.admin-page p,
.admin-page small,
.admin-page strong,
.admin-page label,
.admin-page span {
  color: inherit;
}

.admin-page input,
.admin-page select,
.admin-page textarea {
  background: #fff !important;
  border: 1px solid rgba(8, 17, 13, 0.12) !important;
  border-radius: 16px !important;
  color: #08110d !important;
  min-height: 52px;
  padding: 1rem 1.1rem !important;
}

.admin-page textarea {
  min-height: 120px;
  resize: vertical;
}

.admin-page label {
  display: grid;
  gap: 0.55rem;
}

.admin-page label:has(input[type='checkbox']) {
  align-items: center;
  display: flex;
  gap: 0.6rem;
}

.admin-page .card {
  background: #fff !important;
  border: 1px solid var(--admin-line) !important;
  border-radius: 22px !important;
  box-shadow: 0 18px 38px rgba(28, 22, 12, 0.08) !important;
}

.admin-page button {
  align-items: center;
  background: var(--admin-primary) !important;
  border: 0;
  border-radius: 999px;
  color: $white !important;
  cursor: pointer;
  display: inline-flex;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.75rem 1rem !important;
}

.admin-page button[type='button'] {
  background: var(--admin-surface-strong) !important;
  color: var(--admin-text) !important;
}

.admin-page .full {
  grid-column: 1 / -1;
}

.admin-page .form-grid {
  gap: 0.85rem;
}

.admin-page .form-grid > label,
.admin-page .form-grid > input,
.admin-page .form-grid > select,
.admin-page .form-grid > textarea {
  width: 100%;
}

.admin-page .form-grid .actions,
.admin-page .actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.admin-page .multi {
  min-height: 160px;
}

.admin-page .item,
.admin-page .column,
.admin-page .audit-item {
  color: var(--admin-text);
}

.admin-page .item-actions button,
.admin-page .actions button {
  min-height: 44px;
}

@media (max-width: 1024px) {
  .admin-shell {
    display: flex;
    flex-direction: column;
    padding-bottom: 86px;
  }

  .sidebar {
    display: none;
  }

  .topbar {
    top: 0.75rem;
  }

  .bottom-nav {
    background: rgba(255, 255, 255, 0.96);
    border-top: 1px solid var(--admin-line);
    bottom: 0;
    display: flex;
    gap: 0.5rem;
    left: 0;
    overflow-x: auto;
    padding: 0.55rem;
    position: fixed;
    right: 0;
    z-index: 30;
  }

  .bottom-nav button {
    flex: 1 0 84px;
    flex-direction: column;
    font-size: 0.72rem;
    gap: 0.3rem;
    min-height: 58px;
    padding: 0.55rem 0.3rem;
  }

  .bottom-nav button span {
    line-height: 1;
    text-align: center;
  }
}

@media (max-width: 640px) {
  .topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .admin-page .form-grid,
  .admin-page .item,
  .admin-page .header-row {
    grid-template-columns: 1fr;
    flex-direction: column;
  }
}
</style>
