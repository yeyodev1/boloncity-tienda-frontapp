<script setup lang="ts">
import type { CategoryDTO } from '@/services/CategoryService'

defineProps<{
  categories: CategoryDTO[]
  modelValue: string
}>()

const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <div class="tabs">
    <button type="button" :class="{ active: modelValue === '' }" @click="emit('update:modelValue', '')">Todas</button>
    <button v-for="category in categories" :key="category._id" type="button" :class="{ active: modelValue === category.slug }" @click="emit('update:modelValue', category.slug)">
      {{ category.name }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.tabs {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.75rem;
  margin-bottom: 1.75rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;

  button {
    align-items: center;
    background: rgba(26, 26, 26, 0.04);
    border: 1px solid rgba(26, 26, 26, 0.08);
    border-radius: 999px;
    color: rgba(26, 26, 26, 0.7);
    display: inline-flex;
    font-weight: 700;
    min-height: 44px;
    padding: 0.7rem 1rem;
    cursor: pointer;
    transition: background-color 0.25s ease, color 0.25s ease, transform 0.25s ease, border-color 0.25s ease;

    &:hover {
      background: rgba(35, 89, 49, 0.08);
      border-color: rgba(35, 89, 49, 0.16);
      color: #235931;
      transform: translateY(-2px);
    }
  }

  .active {
    background: #235931;
    color: #fff;
    border-color: #235931;
    box-shadow: 0 12px 24px rgba(35, 89, 49, 0.16);
  }
}
</style>
