<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import CategoryService from '@/services/CategoryService'

const route = useRoute()
const router = useRouter()
// Arranca en true para no mostrarle un 404 de medio segundo a quien sí llegó bien.
const checkingCategory = ref(true)

/**
 * Atajo de una sola palabra: boloncity.com/congelados abre esa categoría.
 *
 * Las campañas piden links cortos, pero no se pueden declarar como rutas porque
 * chocarían con /carrito, /checkout y cualquier ruta futura. Se resuelve acá, que
 * es el único punto donde ya se sabe que ninguna ruta real coincidió: si la
 * palabra es una categoría existente, se redirige; si no, es un 404 de verdad.
 */
onMounted(async () => {
  const path = String(route.path || '').replace(/^\/+|\/+$/g, '')
  if (!path || path.includes('/')) {
    checkingCategory.value = false
    return
  }

  try {
    const response = await CategoryService.getAll()
    const match = response.data.find((category) => category.slug === path.toLowerCase())
    if (match) {
      await router.replace({ name: 'CatalogCategory', params: { categorySlug: match.slug } })
      return
    }
  } catch {
    // Sin categorías que consultar, se muestra el 404 normal.
  }

  checkingCategory.value = false
})
</script>

<template>
  <section v-if="!checkingCategory" class="page page--center notfound-page">
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
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  align-items: center;
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
