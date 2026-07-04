<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="store-footer panel">
    <div class="store-footer__top">
      <div>
        <p class="store-footer__eyebrow">Boloncity</p>
        <h2>Sabores que se ven y se sienten</h2>
      </div>
      <p class="store-footer__text">
        Compra, sigue y recibe tus pedidos con una experiencia limpia y directa.
      </p>
    </div>

    <div class="store-footer__bottom">
      <span>© Boloncity</span>
      <div class="store-footer__links">
        <RouterLink to="/catalogo">Catálogo</RouterLink>
        <RouterLink to="/pedido">Seguimiento</RouterLink>
        <RouterLink to="/login">Ingresar</RouterLink>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
.store-footer {
  @include section-padding;
  margin: 2rem 1.25rem 1.25rem;
  padding: 1.5rem;
}

.store-footer__top {
  display: grid;
  gap: 1rem;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
}

.store-footer__eyebrow {
  @include eyebrow;
  color: #00a523;
  margin-bottom: 0.45rem;
}

h2 {
  @include section-title;
  font-size: clamp(1.9rem, 4vw, 3rem);
}

.store-footer__text {
  @include body-text;
  max-width: 30rem;
}

.store-footer__bottom {
  align-items: center;
  border-top: 1px solid rgba(26, 26, 26, 0.08);
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1rem;
}

.store-footer__links {
  display: flex;
  gap: 1rem;
}

.store-footer__links a {
  color: rgba(26, 26, 26, 0.72);
  font-weight: 700;
}

@media (max-width: 768px) {
  .store-footer__top,
  .store-footer__bottom {
    grid-template-columns: 1fr;
  }

  .store-footer__bottom {
    align-items: start;
    display: grid;
    gap: 0.75rem;
  }
}
</style>
