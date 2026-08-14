<script setup lang="ts">
import { computed } from 'vue'

/**
 * Cinta fija que avisa que NO estás en producción.
 *
 * Sin esto los dos entornos se ven idénticos y es fácil cargar productos, cambiar el
 * IVA o probar un cobro en la base equivocada. Se muestra según a qué API apunta el
 * build, que es lo que realmente decide en qué base escribes.
 */
const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || ''

const environment = computed(() => {
  if (/localhost|127\.0\.0\.1/.test(apiBase)) return 'local'
  if (/-dev|dev-|dev\./.test(apiBase)) return 'development'
  return 'production'
})

const label = computed(() => (environment.value === 'local' ? 'LOCAL' : 'DEVELOPMENT'))
</script>

<template>
  <div v-if="environment !== 'production'" class="env-badge" :class="`env-badge--${environment}`">
    <i class="fa-solid fa-flask" />
    <span>{{ label }}</span>
    <small>datos de prueba — no es la tienda real</small>
  </div>
</template>

<style scoped lang="scss">
.env-badge {
  align-items: center;
  background: #efd537;
  border-radius: 999px;
  bottom: 1rem;
  box-shadow: 0 10px 24px rgba(8, 17, 13, 0.28);
  color: #152019;
  display: flex;
  gap: 0.4rem;
  // Fija y por encima de todo: el punto es que no se pueda perder de vista.
  left: 50%;
  padding: 0.45rem 0.85rem;
  pointer-events: none;
  position: fixed;
  transform: translateX(-50%);
  z-index: 9999;
}

.env-badge--local { background: #7dd3fc; }

.env-badge i { font-size: 0.75rem; }
.env-badge span { font-size: 0.68rem; font-weight: 900; letter-spacing: 0.1em; }
.env-badge small { display: none; }

@media (min-width: 640px) {
  .env-badge small { color: rgba(21, 32, 25, 0.65); display: inline; font-size: 0.68rem; font-weight: 700; }
}
</style>
