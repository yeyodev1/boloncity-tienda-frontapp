<script setup lang="ts">
import { computed } from 'vue'

/**
 * Cinta fija que avisa en qué entorno estás.
 *
 * Sin esto los dos entornos se ven idénticos y es fácil cargar productos, cambiar el
 * IVA o probar un cobro en la base equivocada. Se decide por la API a la que apunta
 * el build, que es lo que realmente manda: el dominio no dice nada sobre en qué base
 * escribes.
 *
 * Y justamente por eso hay un segundo aviso. Durante un tiempo dev.boloncity.com
 * sirvió el build de PRODUCCIÓN: el dominio decía "dev", la API era la real, y como
 * esta cinta solo miraba la API, no se mostraba nada. Quien probaba ahí operaba sobre
 * la tienda real sin una sola señal en pantalla. Cuando el host y la API se
 * contradicen, ahora sale un aviso rojo — es el caso peligroso, no el inofensivo.
 */
const apiBase = (import.meta.env.VITE_API_BASE_URL as string) || ''

function looksLikeDev(value: string) {
  return /-dev|dev-|dev\./.test(value)
}

const environment = computed(() => {
  if (/localhost|127\.0\.0\.1/.test(apiBase)) return 'local'
  if (looksLikeDev(apiBase)) return 'development'
  return 'production'
})

/** El host promete pruebas pero la API es la de verdad. */
const lyingHost = computed(() => {
  const host = typeof window === 'undefined' ? '' : window.location.hostname
  return environment.value === 'production' && looksLikeDev(host)
})

const label = computed(() => (environment.value === 'local' ? 'LOCAL' : 'DEVELOPMENT'))
</script>

<template>
  <div v-if="lyingHost" class="env-badge env-badge--danger" role="alert">
    <i class="fa-solid fa-triangle-exclamation" />
    <span>ESTÁS EN PRODUCCIÓN</span>
    <small>el dominio dice «dev», pero esto es la tienda real</small>
  </div>

  <div v-else-if="environment !== 'production'" class="env-badge" :class="`env-badge--${environment}`">
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
.env-badge--danger { background: #a52323; color: #fff; }

.env-badge i { font-size: 0.75rem; }
.env-badge span { font-size: 0.68rem; font-weight: 900; letter-spacing: 0.1em; }
.env-badge small { display: none; }

@media (min-width: 640px) {
  .env-badge small { color: rgba(21, 32, 25, 0.65); display: inline; font-size: 0.68rem; font-weight: 700; }
}
</style>
