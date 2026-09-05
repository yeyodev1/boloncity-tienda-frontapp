<script setup lang="ts">
/**
 * Un paso del checkout.
 *
 * La pantalla era trece bloques apilados, cada campo dentro de su propia tarjeta
 * con sombra: todo pesaba lo mismo, así que nada guiaba. Agrupar en pasos
 * numerados convierte «llená este muro» en «tres cosas y listo», y el número da
 * la única señal de avance que había faltando.
 */
defineProps<{
  step: number
  title: string
  hint?: string
  icon?: string
}>()
</script>

<template>
  <section class="cs">
    <header class="cs__head">
      <span class="cs__step" aria-hidden="true">{{ step }}</span>
      <div class="cs__titles">
        <h2>{{ title }}</h2>
        <p v-if="hint">{{ hint }}</p>
      </div>
      <i v-if="icon" :class="['fa-solid', icon, 'cs__icon']" aria-hidden="true" />
    </header>

    <div class="cs__body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.cs {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.07);
  border-radius: 24px;
  box-shadow: 0 8px 26px rgba(28, 22, 12, 0.05);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(1.1rem, 3vw, 1.5rem);
}

.cs__head {
  align-items: center;
  display: flex;
  gap: 0.8rem;
}

.cs__step {
  align-items: center;
  background: #235931;
  border-radius: 50%;
  color: #fff;
  display: flex;
  flex-shrink: 0;
  font-size: 0.9rem;
  font-weight: 800;
  height: 1.9rem;
  justify-content: center;
  width: 1.9rem;
}

.cs__titles {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;

  h2 {
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.25;
  }

  p {
    color: rgba(8, 17, 13, 0.52);
    font-size: 0.82rem;
    line-height: 1.4;
  }
}

.cs__icon {
  color: rgba(35, 89, 49, 0.22);
  flex-shrink: 0;
  font-size: 1.4rem;
}

.cs__body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}
</style>
