<script setup lang="ts">
import BranchSelector from './BranchSelector.vue'
import AdminThemeToggle from './AdminThemeToggle.vue'

defineProps<{ isAdmin: boolean }>()
defineEmits<{ menu: []; store: [] }>()
</script>

<template>
  <header class="admin-topbar">
    <div class="admin-topbar__left">
      <button class="admin-topbar__menu" type="button" aria-label="Abrir menú" @click="$emit('menu')"><i class="fa-solid fa-bars-staggered" /></button>
      <BranchSelector />
    </div>
    <div class="admin-topbar__right">
      <AdminThemeToggle />
      <button v-if="isAdmin" class="admin-topbar__store" type="button" @click="$emit('store')">
        <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /><span>Ver tienda</span>
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.admin-topbar {
  align-items: center;
  backdrop-filter: blur(10px);
  background: color-mix(in srgb, var(--admin-surface) 88%, transparent);
  border: 1px solid var(--admin-line);
  border-radius: 18px;
  box-shadow: var(--admin-shadow);
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  padding: 0.5rem 0.6rem;
  position: sticky;
  top: 0.75rem;
  z-index: 40;
}

.admin-topbar__left,
.admin-topbar__right { align-items: center; display: flex; gap: 0.55rem; min-width: 0; }

.admin-topbar__menu {
  align-items: center;
  background: var(--admin-hover);
  border-radius: 12px;
  color: var(--admin-text);
  display: flex;
  flex: 0 0 40px;
  height: 40px;
  justify-content: center;
}

.admin-topbar__store {
  align-items: center;
  background: var(--admin-accent);
  border-radius: 12px;
  color: var(--admin-on-accent);
  display: none;
  font-size: 0.78rem;
  font-weight: 800;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0.5rem 0.85rem;
  transition: filter 0.2s ease;

  &:hover { filter: brightness(1.08); }
}

@media (min-width: 641px) { .admin-topbar__store { display: flex; } }
@media (min-width: 1025px) { .admin-topbar__menu { display: none; } }
</style>
