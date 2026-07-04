<script setup lang="ts">
defineProps<{
  type?: 'card' | 'list' | 'table' | 'kanban'
  count?: number
}>()
</script>

<template>
  <div class="skeleton" :class="type || 'list'">
    <div v-for="index in count || 4" :key="index" class="skeleton-item" />
  </div>
</template>

<style scoped lang="scss">
.skeleton { display: grid; gap: 0.75rem; }
.skeleton-item {
  height: 1rem;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(0,0,0,.08) 25%, rgba(0,0,0,.14) 37%, rgba(0,0,0,.08) 63%);
  background-size: 400% 100%;
  animation: shimmer 1.2s ease infinite;
}
.card .skeleton-item { height: 140px; border-radius: 18px; }
.kanban .skeleton-item { height: 90px; border-radius: 16px; }
@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }
</style>
