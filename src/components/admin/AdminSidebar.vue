<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'
import type { AdminNavItem } from '@/composables/useAdminNavigation'
import AdminThemeToggle from './AdminThemeToggle.vue'

defineProps<{
  items: AdminNavItem[]
  isActive: (path: string) => boolean
  mobile?: boolean
}>()

const emit = defineEmits<{
  navigate: [path: string]
  logout: []
  close: []
}>()

const userStore = useUserStore()
const roleLabel = computed(() => (userStore.accountType === 'branch_admin' ? 'Equipo de sucursal' : 'Administración'))
</script>

<template>
  <aside class="admin-sidebar" :class="{ 'admin-sidebar--mobile': mobile }">
    <div class="admin-sidebar__brand">
      <div class="admin-sidebar__mark" aria-hidden="true"><i class="fa-solid fa-bowl-food" /></div>
      <div class="admin-sidebar__brand-copy"><span>Boloncity</span><strong>{{ roleLabel }}</strong></div>
      <button v-if="mobile" class="admin-sidebar__close" type="button" aria-label="Cerrar menú" @click="emit('close')"><i class="fa-solid fa-xmark" /></button>
    </div>

    <nav class="admin-sidebar__nav" aria-label="Menú del panel">
      <button
        v-for="item in items"
        :key="item.path"
        type="button"
        :class="{ active: isActive(item.path) }"
        :aria-current="isActive(item.path) ? 'page' : undefined"
        @click="emit('navigate', item.path)"
      >
        <span class="admin-sidebar__icon" aria-hidden="true"><i :class="item.icon" /></span>
        <span class="admin-sidebar__label">{{ item.label }}</span>
      </button>
    </nav>

    <div class="admin-sidebar__foot">
      <AdminThemeToggle with-label />
      <div class="admin-sidebar__user">
        <span class="admin-sidebar__avatar" aria-hidden="true">{{ (userStore.email || 'A').slice(0, 1).toUpperCase() }}</span>
        <div><strong>{{ userStore.email || 'Admin' }}</strong><small>{{ roleLabel }}</small></div>
        <button type="button" title="Cerrar sesión" aria-label="Cerrar sesión" @click="emit('logout')"><i class="fa-solid fa-arrow-right-from-bracket" /></button>
      </div>
    </div>
  </aside>
</template>

<style scoped lang="scss">
.admin-sidebar {
  background: var(--admin-sidebar);
  border: 1px solid var(--admin-line);
  border-radius: 24px;
  box-shadow: var(--admin-shadow);
  color: var(--admin-text);
  display: flex;
  flex: 0 0 256px;
  flex-direction: column;
  gap: 1.1rem;
  min-height: 0;
  padding: 1rem 0.85rem;
}

.admin-sidebar__brand { align-items: center; display: flex; gap: 0.7rem; padding: 0.25rem 0.35rem 0.4rem; }

.admin-sidebar__mark {
  align-items: center;
  background: linear-gradient(145deg, #2f7a43, #1b4826);
  border-radius: 14px;
  box-shadow: 0 8px 18px -8px rgba(35, 89, 49, 0.7);
  color: var(--admin-yellow);
  display: flex;
  flex: 0 0 42px;
  height: 42px;
  justify-content: center;
}

.admin-sidebar__brand-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;

  span { color: var(--admin-muted); font-size: 0.66rem; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
  strong { font-size: 0.98rem; letter-spacing: -0.02em; }
}

.admin-sidebar__close { background: var(--admin-hover); border-radius: 10px; color: var(--admin-muted); height: 36px; margin-left: auto; width: 36px; }

.admin-sidebar__nav {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.2rem;
  min-height: 0;
  overflow-y: auto;

  button {
    align-items: center;
    background: transparent;
    border-radius: 14px;
    color: var(--admin-muted);
    display: flex;
    font-size: 0.88rem;
    font-weight: 700;
    gap: 0.7rem;
    min-height: 46px;
    padding: 0.45rem 0.55rem;
    position: relative;
    text-align: left;
    transition: background 0.2s ease, color 0.2s ease;

    &:hover { background: var(--admin-hover); color: var(--admin-text); }
    &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }

    &.active {
      background: var(--admin-accent-soft);
      color: var(--admin-text);

      &::before {
        background: var(--admin-accent);
        border-radius: 0 4px 4px 0;
        content: '';
        height: 22px;
        left: -0.85rem;
        position: absolute;
        width: 4px;
      }

      .admin-sidebar__icon { background: var(--admin-accent); color: var(--admin-on-accent); }
    }
  }
}

.admin-sidebar__icon {
  align-items: center;
  background: var(--admin-hover);
  border-radius: 10px;
  color: var(--admin-accent);
  display: flex;
  flex: 0 0 32px;
  font-size: 0.82rem;
  height: 32px;
  justify-content: center;
  transition: background 0.2s ease, color 0.2s ease;
}

.admin-sidebar__foot { display: flex; flex-direction: column; gap: 0.75rem; }

.admin-sidebar__user {
  align-items: center;
  border-top: 1px solid var(--admin-line);
  display: flex;
  gap: 0.6rem;
  padding: 0.85rem 0.25rem 0.1rem;

  > div { display: flex; flex: 1 1 0; flex-direction: column; min-width: 0; }
  strong { font-size: 0.74rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  small { color: var(--admin-muted); font-size: 0.66rem; }

  button {
    background: transparent;
    border-radius: 10px;
    color: var(--admin-muted);
    height: 34px;
    width: 34px;

    &:hover { background: var(--admin-danger-soft); color: var(--admin-danger); }
  }
}

.admin-sidebar__avatar {
  align-items: center;
  background: var(--admin-yellow);
  border-radius: 50%;
  color: var(--admin-on-yellow);
  display: flex;
  flex: 0 0 34px;
  font-size: 0.78rem;
  font-weight: 800;
  height: 34px;
  justify-content: center;
}

.admin-sidebar--mobile { border-radius: 0 24px 24px 0; height: 100%; width: min(84vw, 320px); }
</style>
