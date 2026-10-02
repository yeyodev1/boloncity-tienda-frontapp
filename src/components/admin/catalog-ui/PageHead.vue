<script setup lang="ts">
/**
 * Encabezado de las pantallas de catálogo y configuración: qué es la pantalla, una línea de ayuda,
 * la acción principal y, si aplica, unos pocos datos en línea (no tarjetas grandes de métricas).
 */
defineProps<{
  eyebrow: string
  title: string
  description?: string
  facts?: Array<{ label: string; value: string | number; tone?: 'good' | 'warn' | 'bad' }>
}>()
</script>

<template>
  <header class="page-head">
    <div class="page-head__row">
      <div class="page-head__copy">
        <p class="page-head__eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p v-if="description" class="page-head__lead">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="page-head__actions"><slot name="actions" /></div>
    </div>
    <ul v-if="facts?.length" class="page-head__facts">
      <li v-for="fact in facts" :key="fact.label" :data-tone="fact.tone">
        <strong>{{ fact.value }}</strong><span>{{ fact.label }}</span>
      </li>
    </ul>
  </header>
</template>

<style scoped lang="scss">
.page-head { display: flex; flex-direction: column; gap: 0.9rem; padding: 0.25rem 0.15rem 0; }

.page-head__row { align-items: flex-start; display: flex; flex-direction: column; gap: 0.9rem; }

.page-head__copy { display: flex; flex-direction: column; min-width: 0; }

.page-head__eyebrow {
  color: var(--admin-accent);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  margin: 0;
  text-transform: uppercase;
}

h1 {
  color: var(--admin-text);
  font-size: clamp(1.6rem, 4.5vw, 2.2rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin: 0.3rem 0 0;
}

.page-head__lead { color: var(--admin-muted); font-size: 0.88rem; line-height: 1.45; margin: 0.4rem 0 0; max-width: 56ch; }

.page-head__actions { display: flex; flex-wrap: wrap; gap: 0.5rem; width: 100%; }
.page-head__actions :deep(> *) { flex: 1 1 auto; }

.page-head__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    align-items: baseline;
    background: var(--admin-surface);
    border: 1px solid var(--admin-line);
    border-radius: 999px;
    display: inline-flex;
    gap: 0.4rem;
    padding: 0.4rem 0.8rem;
  }

  strong { color: var(--admin-text); font-size: 0.92rem; font-variant-numeric: tabular-nums; font-weight: 800; }
  span { color: var(--admin-muted); font-size: 0.76rem; font-weight: 600; }

  li[data-tone='good'] strong { color: var(--admin-success); }
  li[data-tone='warn'] strong { color: var(--admin-warning); }
  li[data-tone='bad'] strong { color: var(--admin-danger); }
}

@media (min-width: 641px) {
  .page-head__row { align-items: flex-end; flex-direction: row; justify-content: space-between; }
  .page-head__actions { flex: 0 0 auto; justify-content: flex-end; width: auto; }
  .page-head__actions :deep(> *) { flex: 0 0 auto; }
}
</style>
