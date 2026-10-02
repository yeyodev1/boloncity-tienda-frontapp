<script setup lang="ts">
defineProps<{ search: string }>()
const emit = defineEmits<{ (event: 'reset'): void }>()
</script>

<template>
  <div class="catalog-empty">
    <span class="catalog-empty__plate" aria-hidden="true"><i class="fa-solid fa-utensils" /></span>
    <h2 v-if="search">No encontramos “{{ search }}”</h2>
    <h2 v-else>Esta categoría está vacía por ahora</h2>
    <p>Prueba con otra palabra, como “bolón” o “café”, o mira todo el menú.</p>
    <button type="button" @click="emit('reset')">Ver todo el menú</button>
  </div>
</template>

<style scoped lang="scss">
.catalog-empty {
  align-items: center;
  background: #fff;
  border: 1px dashed rgba(35, 89, 49, 0.25);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 2.5rem 1.25rem;
  text-align: center;
}

.catalog-empty__plate {
  align-items: center;
  background: radial-gradient(circle, #fff 0 52%, #eef2e8 53%);
  border: 1px solid rgba(35, 89, 49, 0.12);
  border-radius: 50%;
  color: #235931;
  display: flex;
  font-size: 1.4rem;
  height: 76px;
  justify-content: center;
  margin-bottom: 0.4rem;
  width: 76px;
}

h2 {
  color: #102719;
  font-size: 1.3rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0;
  overflow-wrap: anywhere;
}

p {
  color: rgba(16, 39, 25, 0.6);
  font-size: 0.92rem;
  line-height: 1.5;
  margin: 0;
  max-width: 34ch;
}

button {
  background: #102719;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  font-weight: 800;
  margin-top: 0.6rem;
  min-height: 46px;
  padding: 0.7rem 1.3rem;
}

button:hover { background: #235931; }
</style>
