<script setup lang="ts">
/**
 * Aviso de "no llegamos a esa dirección".
 *
 * Antes esto salía como un `<small>` gris al pie del bloque de ubicación, del
 * mismo tamaño que los textos de ayuda: el cliente no lo veía, reintentaba, y
 * terminaba escribiéndole al local. Por eso ocupa espacio, dice qué pasó en una
 * línea y ofrece la salida —retiro en tienda— como un botón, no como una idea.
 */
defineProps<{
  message: string
}>()

const emit = defineEmits<{
  (e: 'switchToPickup'): void
}>()
</script>

<template>
  <aside class="coverage" role="alert">
    <p class="coverage__title">
      <i class="fa-solid fa-map-location-dot" /> No llegamos hasta esa dirección
    </p>

    <p class="coverage__message">{{ message }}</p>

    <p class="coverage__hint">
      <i class="fa-solid fa-circle-info" />
      Tu pedido no se perdió: el carrito sigue tal como lo armaste.
    </p>

    <button type="button" class="coverage__cta" @click="emit('switchToPickup')">
      <i class="fa-solid fa-store" /> Cambiar a retiro en tienda
    </button>
  </aside>
</template>

<style scoped lang="scss">
.coverage {
  background: #fdeceb;
  border: 1px solid rgba(165, 35, 35, 0.35);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem 1.1rem;
}

.coverage__title {
  align-items: flex-start;
  color: #7c1a1a;
  display: flex;
  font-size: 1.02rem;
  font-weight: 800;
  gap: 0.5rem;
  letter-spacing: -0.02em;

  i {
    margin-top: 0.2rem;
  }
}

.coverage__message {
  color: #5f2020;
  font-size: 0.9rem;
  line-height: 1.55;
}

.coverage__hint {
  align-items: flex-start;
  color: rgba(95, 32, 32, 0.75);
  display: flex;
  font-size: 0.82rem;
  gap: 0.45rem;
  line-height: 1.5;

  i {
    margin-top: 0.2rem;
  }
}

.coverage__cta {
  align-items: center;
  background: #235931;
  border-radius: 999px;
  color: #fff;
  display: inline-flex;
  font-weight: 800;
  gap: 0.55rem;
  justify-content: center;
  min-height: 48px;
  padding: 0.8rem 1.2rem;
  transition: background-color 0.2s ease, transform 0.2s ease;

  &:hover {
    background: #00a523;
    transform: translateY(-2px);
  }
}
</style>
