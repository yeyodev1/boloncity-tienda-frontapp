<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { CategoryDTO } from '@/services/CategoryService'
import { displayProductName } from '@/utils/productName'

const props = defineProps<{
  categories: CategoryDTO[]
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()

const track = ref<HTMLElement | null>(null)

// La pestaña elegida siempre queda a la vista (llegando desde un link /catalogo/<categoría>
// o tocando una que estaba medio cortada en el borde del celular).
watch(
  () => [props.modelValue, props.categories.length],
  async () => {
    await nextTick()
    const el = track.value
    const active = el?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!el || !active) return
    // Solo se mueve la fila de pestañas, nunca la página.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: active.offsetLeft - (el.clientWidth - active.clientWidth) / 2, behavior: reduce ? 'auto' : 'smooth' })
  },
)
</script>

<template>
  <div class="tabs">
    <div ref="track" class="tabs__track" role="group" aria-label="Categorías del menú">
      <button type="button" :aria-pressed="modelValue === ''" @click="emit('update:modelValue', '')">
        Todo
      </button>
      <button
        v-for="category in categories"
        :key="category._id"
        type="button"
        :aria-pressed="modelValue === category.slug"
        @click="emit('update:modelValue', category.slug)"
      >
        <span>{{ displayProductName(category.name) }}</span>
        <small v-if="category.productsCount">{{ category.productsCount }}</small>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tabs {
  margin: 0 -1rem;
  position: relative;

  &::before,
  &::after {
    bottom: 0;
    content: '';
    pointer-events: none;
    position: absolute;
    top: 0;
    width: 1.25rem;
    z-index: 1;
  }

  &::before { background: linear-gradient(90deg, var(--catalog-surface, #f8f6ec), transparent); left: 0; }
  &::after { background: linear-gradient(270deg, var(--catalog-surface, #f8f6ec), transparent); right: 0; }
}

.tabs__track {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.35rem 1rem;
  position: relative;
  scroll-padding-inline: 1rem;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
}

button {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(16, 39, 25, 0.1);
  border-radius: 999px;
  color: rgba(16, 39, 25, 0.78);
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.86rem;
  font-weight: 700;
  gap: 0.4rem;
  min-height: 40px;
  padding: 0.5rem 0.95rem;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
  white-space: nowrap;

  &:hover {
    border-color: rgba(35, 89, 49, 0.35);
    color: #235931;
  }

  &:active { transform: scale(0.96); }

  &[aria-pressed='true'] {
    background: #102719;
    border-color: #102719;
    color: #fff;
  }

  &[aria-pressed='true'] small {
    background: #efd537;
    color: #102719;
  }
}

small {
  background: rgba(16, 39, 25, 0.07);
  border-radius: 999px;
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  min-width: 22px;
  padding: 0.12rem 0.4rem;
  text-align: center;
}

@media (min-width: 641px) {
  .tabs { margin: 0 -1.25rem; }
  .tabs__track { padding-inline: 1.25rem; }
}

@media (prefers-reduced-motion: reduce) {
  button { transition: none; }
  button:active { transform: none; }
}
</style>
