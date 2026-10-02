<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ModalShell from '@/components/global/ModalShell.vue'
import { AdminSidebar, AdminTopbar } from '@/components/admin'
import { useAdminNavigation } from '@/composables/useAdminNavigation'
import { useAdminTheme } from '@/composables/useAdminTheme'
import { useUserStore } from '@/stores/user'
import { useConfirm } from '@/composables/useConfirm'
// Piezas comunes del panel y el modo oscuro de BaseSelect/BaseDatePicker: cargadas siempre, no solo al abrir el catálogo.
import '@/components/admin/catalog-ui/ui.scss'

const router = useRouter()
const userStore = useUserStore()
const { confirm } = useConfirm()
const { items, isAdmin, isActive } = useAdminNavigation()
const { theme } = useAdminTheme()
const menuOpen = ref(false)
const storeModalOpen = ref(false)

// El tema vive en <html>: así lo heredan también los modales y el menú del celular (se dibujan con Teleport).
function applyTheme(value: string) {
  document.documentElement.dataset.adminTheme = value
  document.documentElement.style.colorScheme = value
}
watch(theme, applyTheme)
watch(menuOpen, (isOpen) => { document.body.style.overflow = isOpen ? 'hidden' : '' })

function closeMenuOnEscape(event: KeyboardEvent) { if (event.key === 'Escape') menuOpen.value = false }
onMounted(() => {
  applyTheme(theme.value)
  document.addEventListener('keydown', closeMenuOnEscape)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', closeMenuOnEscape)
  document.body.style.overflow = ''
  // Fuera del panel (la tienda) no se arrastra el tema oscuro.
  delete document.documentElement.dataset.adminTheme
  document.documentElement.style.colorScheme = ''
})

function navigate(path: string) { router.push(path); menuOpen.value = false }
function openStore(path: string) { storeModalOpen.value = false; window.open(path, '_blank') }
async function logout() {
  if (!await confirm({ title: 'Cerrar sesión', message: 'Quieres cerrar sesión?', confirmText: 'Cerrar sesión', type: 'danger' })) return
  userStore.clear()
  router.push('/login')
}
</script>

<template>
  <div class="admin-shell">
    <AdminSidebar class="admin-shell__sidebar" :items="items" :is-active="isActive" @navigate="navigate" @logout="logout" />
    <Teleport to="body">
      <div class="admin-shell__overlay" :class="{ open: menuOpen }" @click="menuOpen = false" />
      <div class="admin-shell__drawer" :class="{ open: menuOpen }" :aria-hidden="!menuOpen">
        <AdminSidebar mobile :items="items" :is-active="isActive" @navigate="navigate" @logout="logout" @close="menuOpen = false" />
      </div>
    </Teleport>
    <main class="admin-shell__content">
      <AdminTopbar :is-admin="isAdmin" @menu="menuOpen = !menuOpen" @store="storeModalOpen = true" />
      <section class="admin-shell__slot"><slot /></section>
    </main>

    <ModalShell :open="storeModalOpen" title="Ver tienda" subtitle="Abre la tienda como la ve el cliente" size="sm" @close="storeModalOpen = false">
      <div class="store-choice">
        <button type="button" @click="openStore('/')"><i class="fa-solid fa-store" /><span><strong>Tienda principal</strong><small>Inicio de la tienda</small></span></button>
        <button type="button" @click="openStore('/catalogo')"><i class="fa-solid fa-eye" /><span><strong>Catálogo</strong><small>Productos como los ve el cliente</small></span></button>
      </div>
    </ModalShell>
  </div>
</template>

<style lang="scss">
/*
 * Tokens del panel (claro y oscuro). TODA vista del panel pinta con estas variables:
 * nada de #fff ni #08110d sueltos, o el modo oscuro se rompe en esa pantalla.
 */
:root[data-admin-theme] {
  --admin-radius: 18px;
  --admin-radius-sm: 12px;
  --admin-ease: cubic-bezier(.2, .8, .2, 1);
  --admin-brand: #235931;
  --admin-yellow: #efd537;
  --admin-on-accent: #fff;
  --admin-on-yellow: #102719;
}

:root[data-admin-theme='light'] {
  --admin-bg: #f3f5f1;
  --admin-surface: #ffffff;
  --admin-surface-2: #f6f8f4;
  --admin-sidebar: #ffffff;
  --admin-line: rgba(16, 39, 25, 0.09);
  --admin-line-strong: rgba(16, 39, 25, 0.16);
  --admin-text: #132018;
  --admin-muted: rgba(19, 32, 24, 0.6);
  --admin-subtle: rgba(19, 32, 24, 0.42);
  --admin-hover: rgba(35, 89, 49, 0.07);
  --admin-accent: #235931;
  --admin-accent-soft: rgba(35, 89, 49, 0.1);
  --admin-input-bg: #ffffff;
  --admin-shadow: 0 1px 2px rgba(16, 39, 25, 0.04), 0 14px 32px -20px rgba(16, 39, 25, 0.28);
  --admin-shadow-lg: 0 24px 60px -28px rgba(16, 39, 25, 0.45);
  --admin-success: #12823a;  --admin-success-soft: rgba(18, 130, 58, 0.12);
  --admin-warning: #a86b00;  --admin-warning-soft: rgba(239, 179, 0, 0.16);
  --admin-danger: #b42318;   --admin-danger-soft: rgba(180, 35, 24, 0.1);
  --admin-info: #1d5fbf;     --admin-info-soft: rgba(29, 95, 191, 0.1);
  /* Estados de la orden: el mismo color en todas las pantallas. */
  --st-pending: #a86b00;         --st-pending-soft: rgba(239, 179, 0, 0.16);
  --st-paid: #1d5fbf;            --st-paid-soft: rgba(29, 95, 191, 0.1);
  --st-preparing: #c2410c;       --st-preparing-soft: rgba(234, 88, 12, 0.12);
  --st-awaiting_pickup: #7c3aed; --st-awaiting_pickup-soft: rgba(124, 58, 237, 0.1);
  --st-ready: #0e7490;           --st-ready-soft: rgba(14, 116, 144, 0.1);
  --st-delivered: #12823a;       --st-delivered-soft: rgba(18, 130, 58, 0.12);
  --st-cancelled: #b42318;       --st-cancelled-soft: rgba(180, 35, 24, 0.1);
}

:root[data-admin-theme='dark'] {
  --admin-bg: #0b120e;
  --admin-surface: #121c16;
  --admin-surface-2: #17241c;
  --admin-sidebar: #0f1813;
  --admin-line: rgba(232, 242, 234, 0.08);
  --admin-line-strong: rgba(232, 242, 234, 0.16);
  --admin-text: #e9f1eb;
  --admin-muted: rgba(233, 241, 235, 0.62);
  --admin-subtle: rgba(233, 241, 235, 0.42);
  --admin-hover: rgba(233, 241, 235, 0.06);
  --admin-accent: #3fae5f;
  --admin-accent-soft: rgba(63, 174, 95, 0.16);
  --admin-on-accent: #07120b;
  --admin-input-bg: #0e1712;
  --admin-shadow: 0 1px 2px rgba(0, 0, 0, 0.4), 0 16px 36px -22px rgba(0, 0, 0, 0.8);
  --admin-shadow-lg: 0 28px 70px -30px rgba(0, 0, 0, 0.9);
  --admin-success: #4ade80;  --admin-success-soft: rgba(74, 222, 128, 0.14);
  --admin-warning: #fbbf24;  --admin-warning-soft: rgba(251, 191, 36, 0.14);
  --admin-danger: #f87171;   --admin-danger-soft: rgba(248, 113, 113, 0.14);
  --admin-info: #60a5fa;     --admin-info-soft: rgba(96, 165, 250, 0.14);
  --st-pending: #fbbf24;         --st-pending-soft: rgba(251, 191, 36, 0.14);
  --st-paid: #60a5fa;            --st-paid-soft: rgba(96, 165, 250, 0.14);
  --st-preparing: #fb923c;       --st-preparing-soft: rgba(251, 146, 60, 0.14);
  --st-awaiting_pickup: #a78bfa; --st-awaiting_pickup-soft: rgba(167, 139, 250, 0.15);
  --st-ready: #22d3ee;           --st-ready-soft: rgba(34, 211, 238, 0.13);
  --st-delivered: #4ade80;       --st-delivered-soft: rgba(74, 222, 128, 0.14);
  --st-cancelled: #f87171;       --st-cancelled-soft: rgba(248, 113, 113, 0.14);
}

:root[data-admin-theme] body { background: var(--admin-bg); }

/*
 * Cambio de tema: con View Transitions el nuevo tema se abre en círculo desde el botón. Sin esa API, los colores
 * se funden SOLO durante el cambio (clase temporal), para no pisar las animaciones propias de cada componente.
 */
::view-transition-old(root),
::view-transition-new(root) { animation: none; mix-blend-mode: normal; }

:root.admin-theme-fading .admin-shell,
:root.admin-theme-fading .admin-shell *,
:root.admin-theme-fading .admin-shell__drawer * {
  transition: background-color .35s var(--admin-ease), border-color .35s var(--admin-ease), color .35s var(--admin-ease), box-shadow .35s var(--admin-ease) !important;
}

.admin-shell { background: var(--admin-bg); color: var(--admin-text); display: flex; flex-direction: column; gap: .75rem; min-height: 100vh; padding: .75rem; }
/* styles/index.scss se inyecta en cada <style scoped> con `* { padding: 0 }` y le borraba el padding al panel:
   esta regla tiene más especificidad. */
:root[data-admin-theme] .admin-shell { padding: .75rem; }
.admin-shell > .admin-shell__sidebar.admin-sidebar { display: none !important; height: calc(100vh - 1.5rem); position: sticky; top: .75rem; }
.admin-shell__content { display: flex; flex: 1 1 auto; flex-direction: column; gap: .75rem; min-width: 0; }
.admin-shell__slot { flex: 1 1 auto; min-width: 0; }
.admin-shell__drawer { bottom: 0; left: 0; pointer-events: none; position: fixed; top: 0; transform: translateX(-105%); transition: transform .3s cubic-bezier(.16,1,.3,1); z-index: 99981; }
.admin-shell__drawer.open { pointer-events: auto; transform: translateX(0); }
.admin-shell__overlay { background: rgba(0,0,0,.5); backdrop-filter: blur(2px); inset: 0; opacity: 0; pointer-events: none; position: fixed; transition: opacity .25s ease; z-index: 99980; }
.admin-shell__overlay.open { opacity: 1; pointer-events: auto; }

.store-choice { display: flex; flex-direction: column; gap: .75rem; }
.store-choice button { align-items: center; background: var(--admin-surface); border: 1px solid var(--admin-line); border-radius: 16px; color: var(--admin-text); display: flex; gap: .75rem; padding: 1rem; text-align: left; transition: border-color .2s ease, background .2s ease; }
.store-choice button:hover { background: var(--admin-hover); border-color: var(--admin-line-strong); }
.store-choice i { align-items: center; background: var(--admin-accent-soft); border-radius: 12px; color: var(--admin-accent); display: flex; flex: 0 0 40px; height: 40px; justify-content: center; }
.store-choice span { display: flex; flex-direction: column; }
.store-choice small { color: var(--admin-muted); margin-top: .15rem; }

/* Piezas compartidas por todas las vistas del panel. */
.panel { background: var(--admin-surface); border: 1px solid var(--admin-line); border-radius: var(--admin-radius); box-shadow: var(--admin-shadow); color: var(--admin-text); }
.admin-page { color: var(--admin-text); }
.admin-page input, .admin-page select, .admin-page textarea { background: var(--admin-input-bg) !important; border: 1px solid var(--admin-line-strong) !important; border-radius: 14px !important; color: var(--admin-text) !important; min-height: 48px; padding: .8rem 1rem !important; }
.admin-page input::placeholder, .admin-page textarea::placeholder { color: var(--admin-subtle); }
.admin-page input:focus, .admin-page select:focus, .admin-page textarea:focus { border-color: var(--admin-accent) !important; box-shadow: 0 0 0 3px var(--admin-accent-soft); outline: none; }
.admin-page textarea { min-height: 120px; }
.admin-page .form-grid { display: flex; flex-direction: column; gap: .85rem; }
.admin-page .actions { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: flex-end; }

/* Pastilla de estado de orden: <span class="status-pill" :data-status="order.status">…</span> */
.status-pill { align-items: center; background: var(--st-pending-soft); border-radius: 999px; color: var(--st-pending); display: inline-flex; font-size: .72rem; font-weight: 800; gap: .35rem; letter-spacing: .01em; padding: .3rem .65rem; white-space: nowrap; }
.status-pill::before { background: currentColor; border-radius: 50%; content: ''; height: 7px; width: 7px; }
@each $status in pending, paid, preparing, awaiting_pickup, ready, delivered, cancelled {
  .status-pill[data-status='#{$status}'] { background: var(--st-#{$status}-soft); color: var(--st-#{$status}); }
}

@media (min-width:641px) { .admin-page .form-grid { flex-flow: row wrap; }.admin-page .form-grid > * { flex: 1 1 260px; }.admin-page .form-grid .full,.admin-page .form-grid .actions { flex-basis: 100%; } }
@media (min-width:1025px) { .admin-shell { flex-direction: row; }.admin-shell > .admin-shell__sidebar.admin-sidebar { display: flex !important; }.admin-shell__drawer,.admin-shell__overlay { display: none; } }
</style>
