<script setup lang="ts">
import BranchSelector from './BranchSelector.vue'

defineProps<{ isAdmin: boolean }>()
defineEmits<{ menu: []; store: [] }>()
</script>

<template>
  <header class="admin-topbar">
    <div><button class="admin-topbar__menu" type="button" @click="$emit('menu')"><i class="fa-solid fa-bars-staggered" /></button><BranchSelector /></div>
    <button v-if="isAdmin" class="admin-topbar__store" type="button" @click="$emit('store')"><i class="fa-solid fa-arrow-up-right-from-square" /><span>Ver tienda</span></button>
  </header>
</template>

<style scoped lang="scss">
.admin-topbar { align-items: center; background: var(--admin-surface); border: 1px solid var(--admin-line); border-radius: 18px; display: flex; gap: 0.75rem; justify-content: space-between; padding: 0.55rem 0.7rem; position: sticky; top: 0.75rem; z-index: 40; }.admin-topbar > div { align-items: center; display: flex; gap: 0.55rem; }.admin-topbar__menu { align-items: center; background: var(--admin-hover); border-radius: 12px; color: var(--admin-text); display: flex; height: 40px; justify-content: center; width: 40px; }.admin-topbar__store { align-items: center; background: var(--admin-accent); border-radius: 12px; color: #fff; display: flex; font-size: 0.78rem; font-weight: 800; gap: 0.4rem; min-height: 40px; padding: 0.5rem 0.8rem; }
@media (min-width: 1025px) { .admin-topbar__menu { display: none; } }
</style>
