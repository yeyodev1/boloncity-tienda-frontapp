<script setup lang="ts">
defineProps<{ count: number }>()
</script>

<template>
  <div class="catalog-grid" aria-busy="true" aria-label="Cargando productos">
    <div v-for="index in count" :key="index" class="skeleton-card" aria-hidden="true">
      <div class="skeleton-card__media" />
      <div class="skeleton-card__line skeleton-card__line--short" />
      <div class="skeleton-card__line" />
      <div class="skeleton-card__line skeleton-card__line--half" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.skeleton-card {
  background: #fff;
  border: 1px solid rgba(16, 39, 25, 0.06);
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.45rem 0.45rem 0.9rem;
}

.skeleton-card__media,
.skeleton-card__line {
  animation: skeleton-shimmer 1.3s ease infinite;
  background: linear-gradient(100deg, #e9eee4 30%, #f6f1d6 50%, #e9eee4 70%);
  background-size: 300% 100%;
}

.skeleton-card__media { aspect-ratio: 1 / 1; border-radius: 17px; margin-bottom: 0.3rem; }
.skeleton-card__line { border-radius: 999px; height: 0.8rem; margin: 0 0.35rem; }
.skeleton-card__line--short { width: 40%; height: 0.55rem; }
.skeleton-card__line--half { width: 55%; }

@media (min-width: 641px) {
  .skeleton-card { padding: 0.55rem 0.55rem 1rem; }
  .skeleton-card__media { aspect-ratio: 5 / 4; }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-card__media,
  .skeleton-card__line { animation: none; }
}

@keyframes skeleton-shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
</style>
