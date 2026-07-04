<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="page page--center notfound-page">
    <div class="panel notfound-card">
      <p class="notfound-card__eyebrow">Error</p>
      <p class="notfound-card__code">404</p>
      <h1>Página no encontrada</h1>
      <p class="muted">La ruta que buscas no existe o fue movida.</p>

      <div class="notfound-card__actions">
        <RouterLink class="btn-primary" to="/">Volver al inicio</RouterLink>
        <RouterLink class="btn-secondary" to="/catalogo">Ir al catálogo</RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.notfound-page {
  background: radial-gradient(circle at top, rgba(239, 213, 55, 0.1), transparent 55%),
    linear-gradient(180deg, rgba(26, 26, 26, 0.02), rgba(255, 255, 255, 0));
}

.notfound-card {
  display: grid;
  gap: 0.9rem;
  max-width: 560px;
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.notfound-card__eyebrow {
  @include eyebrow;
  color: #00a523;
}

.notfound-card__code {
  font-size: clamp(6rem, 18vw, 10rem);
  font-weight: 800;
  letter-spacing: -0.08em;
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 2px #235931;
}

.notfound-card h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  line-height: 1;
  text-transform: uppercase;
}

.notfound-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 0.5rem;
}

.notfound-card__actions a {
  min-width: 180px;
}
</style>
