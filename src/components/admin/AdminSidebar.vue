<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import type { AdminNavItem } from '@/composables/useAdminNavigation'

defineProps<{
  items: AdminNavItem[]
  isActive: (path: string) => boolean
  mobile?: boolean
  visualMode: 'sober' | 'brand'
}>()

const emit = defineEmits<{
  navigate: [path: string]
  logout: []
  'update:visualMode': [mode: 'sober' | 'brand']
  close: []
}>()

const userStore = useUserStore()
</script>

<template>
  <aside class="admin-sidebar" :class="{ 'admin-sidebar--mobile': mobile }">
    <div class="admin-sidebar__brand">
      <div class="admin-sidebar__mark"><i class="fa-solid fa-bowl-food" /></div>
      <div><span>Boloncity</span><strong>Administración</strong></div>
      <button v-if="mobile" class="admin-sidebar__close" type="button" @click="emit('close')"><i class="fa-solid fa-xmark" /></button>
    </div>

    <p class="admin-sidebar__section">Operación</p>
    <nav class="admin-sidebar__nav">
      <button v-for="item in items" :key="item.path" type="button" :class="{ active: isActive(item.path) }" @click="emit('navigate', item.path)">
        <i :class="item.icon" /><span>{{ item.label }}</span><i v-if="isActive(item.path)" class="fa-solid fa-chevron-right" />
      </button>
    </nav>

    <div class="admin-sidebar__mode">
      <div><i class="fa-solid fa-wand-magic-sparkles" /><span><strong>Vista sobria</strong><small>Recomendada</small></span></div>
      <button class="admin-sidebar__switch" :class="{ active: visualMode === 'sober' }" type="button" @click="emit('update:visualMode', visualMode === 'sober' ? 'brand' : 'sober')">
        <span />
      </button>
    </div>

    <div class="admin-sidebar__user">
      <span>{{ (userStore.email || 'A').slice(0, 1).toUpperCase() }}</span>
      <div><strong>{{ userStore.email || 'Admin' }}</strong><small>{{ userStore.accountType || 'admin' }}</small></div>
      <button type="button" title="Cerrar sesión" @click="emit('logout')"><i class="fa-solid fa-arrow-right-from-bracket" /></button>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.admin-sidebar { background: var(--admin-sidebar); border: 1px solid var(--admin-line); border-radius: 24px; color: var(--admin-text); display: flex; flex: 0 0 272px; flex-direction: column; gap: 1rem; min-height: 0; padding: 1rem; }
.admin-sidebar__brand { align-items: center; display: flex; gap: 0.7rem; padding: 0.35rem 0.35rem 1.1rem; position: relative; }
.admin-sidebar__mark { align-items: center; background: var(--admin-accent); border-radius: 14px; color: #fff; display: flex; flex: 0 0 42px; height: 42px; justify-content: center; }
.admin-sidebar__brand div:nth-child(2) { display: flex; flex-direction: column; }.admin-sidebar__brand span { color: var(--admin-muted); font-size: 0.68rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }.admin-sidebar__brand strong { font-size: 1rem; letter-spacing: -0.03em; }
.admin-sidebar__close { background: transparent; color: var(--admin-muted); margin-left: auto; padding: 0.35rem; }.admin-sidebar__section { color: var(--admin-muted); font-size: 0.66rem; font-weight: 800; letter-spacing: 0.12em; margin: 0.5rem 0 0; padding: 0 0.5rem; text-transform: uppercase; }
.admin-sidebar__nav { display: flex; flex-direction: column; gap: 0.25rem; }.admin-sidebar__nav button { align-items: center; background: transparent; border: 1px solid transparent; border-radius: 14px; color: var(--admin-muted); display: flex; font-size: 0.86rem; gap: 0.75rem; min-height: 46px; padding: 0.7rem 0.75rem; text-align: left; transition: 0.2s ease; }.admin-sidebar__nav button:hover { background: var(--admin-hover); color: var(--admin-text); }.admin-sidebar__nav button.active { background: var(--admin-accent); border-color: var(--admin-accent); color: #fff; box-shadow: 0 9px 20px rgba(35, 89, 49, 0.18); }.admin-sidebar__nav button > i:last-child { font-size: 0.65rem; margin-left: auto; }.admin-sidebar__nav button > i:first-child { width: 18px; }
.admin-sidebar__mode { background: var(--admin-mode); border: 1px solid var(--admin-line); border-radius: 16px; display: flex; gap: 0.55rem; margin-top: auto; padding: 0.7rem; }.admin-sidebar__mode > div { align-items: center; display: flex; flex: 1 1 0; gap: 0.45rem; }.admin-sidebar__mode > div > i { color: #b79200; }.admin-sidebar__mode span { display: flex; flex-direction: column; }.admin-sidebar__mode strong { font-size: 0.72rem; }.admin-sidebar__mode small { color: var(--admin-muted); font-size: 0.64rem; }.admin-sidebar__switch { background: #c7cfca; border-radius: 999px; display: flex; height: 24px; padding: 3px; width: 42px; }.admin-sidebar__switch span { background: #fff; border-radius: 50%; display: block; height: 18px; transition: transform 0.2s ease; width: 18px; }.admin-sidebar__switch.active { background: var(--admin-accent); }.admin-sidebar__switch.active span { transform: translateX(18px); }
.admin-sidebar__user { align-items: center; border-top: 1px solid var(--admin-line); display: flex; gap: 0.6rem; padding: 0.85rem 0.25rem 0.1rem; }.admin-sidebar__user > span { align-items: center; background: var(--admin-hover); border-radius: 50%; color: var(--admin-accent); display: flex; flex: 0 0 34px; font-size: 0.75rem; font-weight: 800; height: 34px; justify-content: center; }.admin-sidebar__user div { display: flex; flex: 1 1 0; flex-direction: column; min-width: 0; }.admin-sidebar__user strong { font-size: 0.72rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.admin-sidebar__user small { color: var(--admin-muted); font-size: 0.65rem; }.admin-sidebar__user button { background: transparent; color: var(--admin-muted); padding: 0.35rem; }
.admin-sidebar--mobile { border-radius: 0 24px 24px 0; height: 100%; width: min(84vw, 320px); }
</style>
