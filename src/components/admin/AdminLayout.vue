<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ModalShell from '@/components/global/ModalShell.vue'
import { AdminSidebar, AdminTopbar } from '@/components/admin'
import { useAdminNavigation } from '@/composables/useAdminNavigation'
import { useUserStore } from '@/stores/user'
import { useConfirm } from '@/composables/useConfirm'

const router = useRouter()
const userStore = useUserStore()
const { confirm } = useConfirm()
const { items, isAdmin, isActive } = useAdminNavigation()
const menuOpen = ref(false)
const storeModalOpen = ref(false)
const visualMode = ref<'sober' | 'brand'>((localStorage.getItem('admin_visual_mode') as 'sober' | 'brand') || 'sober')

watch(visualMode, (mode) => localStorage.setItem('admin_visual_mode', mode))
watch(menuOpen, (isOpen) => { document.body.style.overflow = isOpen ? 'hidden' : '' })

function closeMenuOnEscape(event: KeyboardEvent) { if (event.key === 'Escape') menuOpen.value = false }
onMounted(() => document.addEventListener('keydown', closeMenuOnEscape))
onBeforeUnmount(() => { document.removeEventListener('keydown', closeMenuOnEscape); document.body.style.overflow = '' })

function navigate(path: string) { router.push(path); menuOpen.value = false }
function openStore(path: string) { storeModalOpen.value = false; window.open(path, '_blank') }
async function logout() {
  if (!await confirm({ title: 'Cerrar sesión', message: '¿Estás seguro de que deseas cerrar sesión?', confirmText: 'Cerrar sesión', type: 'danger' })) return
  userStore.clear()
  router.push('/login')
}
</script>

<template>
  <div class="admin-shell" :data-mode="visualMode">
    <AdminSidebar class="admin-shell__sidebar" :items="items" :is-active="isActive" :visual-mode="visualMode" @navigate="navigate" @logout="logout" @update:visual-mode="visualMode = $event" />
    <Teleport to="body">
      <div class="admin-shell__overlay" :class="{ open: menuOpen }" @click="menuOpen = false" />
      <div class="admin-shell__drawer" :class="{ open: menuOpen }" :data-mode="visualMode" :aria-hidden="!menuOpen">
        <AdminSidebar mobile :items="items" :is-active="isActive" :visual-mode="visualMode" @navigate="navigate" @logout="logout" @close="menuOpen = false" @update:visual-mode="visualMode = $event" />
      </div>
    </Teleport>
    <main class="admin-shell__content">
      <AdminTopbar :is-admin="isAdmin" @menu="menuOpen = !menuOpen" @store="storeModalOpen = true" />
      <section class="admin-shell__slot"><slot /></section>
    </main>

    <ModalShell :open="storeModalOpen" title="Ver tienda" subtitle="Abre la experiencia del cliente en otra pestaña" size="sm" @close="storeModalOpen = false">
      <div class="store-choice">
        <button type="button" @click="openStore('/')"><i class="fa-solid fa-store" /><span><strong>Tienda principal</strong><small>Inicio del e-commerce</small></span></button>
        <button type="button" @click="openStore('/catalogo')"><i class="fa-solid fa-eye" /><span><strong>Catálogo</strong><small>Productos como los ve el cliente</small></span></button>
      </div>
    </ModalShell>
  </div>
</template>

<style lang="scss">
.admin-shell { --admin-bg: #f4f6f4; --admin-surface: #fff; --admin-sidebar: #fff; --admin-mode: #f7f8f7; --admin-line: rgba(8,17,13,.1); --admin-text: #152019; --admin-muted: rgba(21,32,25,.58); --admin-hover: rgba(35,89,49,.08); --admin-accent: #235931; background: var(--admin-bg); color: var(--admin-text); display: flex; flex-direction: column; gap: .75rem; min-height: 100vh; padding: .75rem; }
.admin-shell[data-mode='brand'] { --admin-sidebar: #173e22; --admin-mode: rgba(255,255,255,.08); --admin-line: rgba(255,255,255,.12); --admin-text: #fff; --admin-muted: rgba(255,255,255,.65); --admin-hover: rgba(255,255,255,.1); --admin-accent: #00a523; }
.admin-shell > .admin-shell__sidebar.admin-sidebar { display: none !important; height: calc(100vh - 1.5rem); position: sticky; top: .75rem; }.admin-shell__content { display: flex; flex: 1 1 auto; flex-direction: column; gap: .75rem; min-width: 0; }.admin-shell__slot { flex: 1 1 auto; min-width: 0; }.admin-shell__drawer { --admin-sidebar:#fff; --admin-mode:#f7f8f7; --admin-line:rgba(8,17,13,.1); --admin-text:#152019; --admin-muted:rgba(21,32,25,.58); --admin-hover:rgba(35,89,49,.08); --admin-accent:#235931; bottom:0; left:0; pointer-events:none; position:fixed; top:0; transform:translateX(-105%); transition:transform .3s cubic-bezier(.16,1,.3,1); z-index:99981; }.admin-shell__drawer[data-mode='brand'] { --admin-sidebar:#173e22; --admin-mode:rgba(255,255,255,.08); --admin-line:rgba(255,255,255,.12); --admin-text:#fff; --admin-muted:rgba(255,255,255,.65); --admin-hover:rgba(255,255,255,.1); --admin-accent:#00a523; }.admin-shell__drawer.open { pointer-events:auto; transform:translateX(0); }.admin-shell__overlay { background:rgba(0,0,0,.45); inset:0; opacity:0; pointer-events:none; position:fixed; transition:opacity .25s ease; z-index:99980; }.admin-shell__overlay.open { opacity:1; pointer-events:auto; }
.store-choice { display: flex; flex-direction: column; gap: .75rem; }.store-choice button { align-items: center; background: #fff; border: 1px solid rgba(8,17,13,.1); border-radius: 16px; display: flex; gap: .75rem; padding: 1rem; text-align: left; }.store-choice i { align-items: center; background: rgba(35,89,49,.1); border-radius: 12px; color: #235931; display: flex; flex: 0 0 40px; height: 40px; justify-content: center; }.store-choice span { display: flex; flex-direction: column; }.store-choice small { color: rgba(8,17,13,.55); margin-top: .15rem; }
.panel { background: var(--admin-surface); border: 1px solid var(--admin-line); border-radius: 18px; box-shadow: 0 12px 30px rgba(20,35,24,.06); }.admin-page { color: var(--admin-text); }.admin-page input,.admin-page select,.admin-page textarea { background: #fff !important; border: 1px solid rgba(8,17,13,.12) !important; border-radius: 14px !important; color: #08110d !important; min-height: 48px; padding: .8rem 1rem !important; }.admin-page textarea { min-height: 120px; }.admin-page .form-grid { display: flex; flex-direction: column; gap: .85rem; }.admin-page .actions { display: flex; flex-wrap: wrap; gap: .75rem; justify-content: flex-end; }
@media (min-width:641px) { .admin-page .form-grid { flex-flow: row wrap; }.admin-page .form-grid > * { flex: 1 1 260px; }.admin-page .form-grid .full,.admin-page .form-grid .actions { flex-basis: 100%; } }
@media (min-width:1025px) { .admin-shell { flex-direction: row; }.admin-shell > .admin-shell__sidebar.admin-sidebar { display: flex !important; }.admin-shell__drawer,.admin-shell__overlay { display: none; } }
</style>
