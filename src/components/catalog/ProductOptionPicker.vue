<script setup lang="ts">
import type { ProductOptionDTO } from '@/services/ProductService'

/**
 * Opciones que el cliente elige antes de agregar al carrito (ej. Masa: Pintón / Verde).
 * `modelValue` es { nombreDelGrupo: elección }.
 */
const props = defineProps<{
  options: ProductOptionDTO[]
  modelValue: Record<string, string>
  /** Resalta los grupos obligatorios sin elegir (después de intentar agregar). */
  showErrors?: boolean
}>()
const emit = defineEmits<{ (event: 'update:modelValue', value: Record<string, string>): void }>()

function choose(group: string, choice: string) {
  emit('update:modelValue', { ...props.modelValue, [group]: choice })
}

function isMissing(group: ProductOptionDTO) {
  return Boolean(props.showErrors && group.required && !props.modelValue[group.name])
}
</script>

<template>
  <div class="option-picker">
    <fieldset v-for="group in options" :key="group.name" class="option-picker__group" :class="{ 'is-missing': isMissing(group) }">
      <legend>
        <strong>{{ group.name }}</strong>
        <span v-if="group.required" class="option-picker__badge">{{ isMissing(group) ? 'Elige una' : 'Obligatorio' }}</span>
      </legend>
      <label v-for="choice in group.choices" :key="choice" class="option-picker__choice" :class="{ 'is-selected': modelValue[group.name] === choice }">
        <span>{{ choice }}</span>
        <input type="radio" :name="`option-${group.name}`" :value="choice" :checked="modelValue[group.name] === choice" @change="choose(group.name, choice)" />
        <span class="option-picker__radio" aria-hidden="true" />
      </label>
    </fieldset>
  </div>
</template>

<style scoped lang="scss">
.option-picker { display: flex; flex-direction: column; gap: 0.8rem; }

.option-picker__group {
  border: 1px solid rgba(35, 89, 49, 0.1);
  border-radius: 18px;
  margin: 0;
  overflow: hidden;
  padding: 0;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.option-picker__group.is-missing {
  border-color: #c0392b;
  box-shadow: 0 0 0 3px rgba(192, 57, 43, 0.12);
}

.option-picker__group legend {
  align-items: center;
  background: #f6f7f1;
  display: flex;
  float: left;
  gap: 0.6rem;
  justify-content: space-between;
  padding: 0.8rem 0.95rem;
  width: 100%;
}

.option-picker__group legend strong { color: #102719; font-size: 1rem; }

.option-picker__badge {
  background: rgba(35, 89, 49, 0.1);
  border-radius: 999px;
  color: #235931;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  padding: 0.25rem 0.55rem;
  text-transform: uppercase;
}

.is-missing .option-picker__badge { background: #c0392b; color: #fff; }

.option-picker__choice {
  align-items: center;
  border-top: 1px solid rgba(35, 89, 49, 0.08);
  clear: both;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  min-height: 52px;
  padding: 0.7rem 0.95rem;
  position: relative;
  transition: background-color 0.15s ease;
}

.option-picker__choice:hover { background: rgba(35, 89, 49, 0.04); }
.option-picker__choice.is-selected { background: rgba(0, 165, 35, 0.07); }
.option-picker__choice > span:first-child { color: #1a1a1a; font-weight: 700; }

.option-picker__choice input {
  height: 1px;
  opacity: 0;
  position: absolute;
  width: 1px;
}

.option-picker__radio {
  border: 2px solid rgba(16, 39, 25, 0.55);
  border-radius: 50%;
  flex: 0 0 auto;
  height: 22px;
  position: relative;
  transition: border-color 0.15s ease;
  width: 22px;
}

.option-picker__radio::after {
  background: #00a523;
  border-radius: 50%;
  content: '';
  inset: 3px;
  position: absolute;
  transform: scale(0);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.is-selected .option-picker__radio { border-color: #00a523; }
.is-selected .option-picker__radio::after { transform: scale(1); }
.option-picker__choice input:focus-visible + .option-picker__radio { outline: 2px solid #00a523; outline-offset: 3px; }

@media (prefers-reduced-motion: reduce) {
  .option-picker__radio::after { transition: none; }
}
</style>
