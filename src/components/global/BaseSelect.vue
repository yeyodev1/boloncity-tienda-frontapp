<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

export interface SelectOption {
  value: string
  label: string
}

const props = withDefaults(
  defineProps<{
    modelValue: string | string[]
    options: SelectOption[]
    label?: string
    placeholder?: string
    multiple?: boolean
    bare?: boolean
    disabled?: boolean
    searchable?: boolean
    inlinePanel?: boolean
  }>(),
  {
    label: '',
    placeholder: 'Seleccionar',
    multiple: false,
    bare: false,
    disabled: false,
    searchable: false,
    inlinePanel: false,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | string[]): void
  (event: 'toggle', open: boolean): void
}>()

const open = ref(false)
const search = ref('')
const triggerRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)

const selectedLabels = computed(() => {
  if (props.multiple) {
    const vals = props.modelValue as string[]
    if (!vals.length) return props.placeholder
    return vals.map((v) => props.options.find((o) => o.value === v)?.label || v).join(', ')
  }
  const val = props.modelValue as string
  if (!val) return props.placeholder
  return props.options.find((o) => o.value === val)?.label || val
})
const filteredOptions = computed(() => {
  const query = search.value.trim().toLocaleLowerCase()
  return query ? props.options.filter((option) => option.label.toLocaleLowerCase().includes(query)) : props.options
})

function toggle() {
  if (props.disabled) return
  open.value = !open.value
  emit('toggle', open.value)
  if (!open.value) search.value = ''
}

function select(value: string) {
  if (props.multiple) {
    const current = [...(props.modelValue as string[])]
    const idx = current.indexOf(value)
    if (idx >= 0) {
      current.splice(idx, 1)
    } else {
      current.push(value)
    }
    emit('update:modelValue', current)
  } else {
    emit('update:modelValue', value)
    open.value = false
    emit('toggle', false)
  }
}

function isSelected(value: string) {
  if (props.multiple) {
    return (props.modelValue as string[]).includes(value)
  }
  return props.modelValue === value
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && open.value) {
    open.value = false
    emit('toggle', false)
    search.value = ''
    triggerRef.value?.focus()
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggle()
  }
}

function onClickOutside(event: MouseEvent) {
  const target = event.target as Node
  if (triggerRef.value?.contains(target)) return
  if (panelRef.value?.contains(target)) return
  open.value = false
  emit('toggle', false)
  search.value = ''
}

watch(open, (isOpen) => {
  if (isOpen) {
    document.addEventListener('click', onClickOutside, true)
  } else {
    document.removeEventListener('click', onClickOutside, true)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onClickOutside, true)
})
</script>

<template>
  <div
    class="base-select"
    :class="{
      'base-select--open': open,
      'base-select--multi': multiple,
       'base-select--bare': bare,
       'base-select--inline': inlinePanel,
      'base-select--disabled': disabled,
      'base-select--has-value': multiple ? (modelValue as string[]).length > 0 : !!modelValue,
    }"
  >
    <span v-if="label" class="base-select__label">{{ label }}</span>

    <div
      ref="triggerRef"
      class="base-select__trigger"
      tabindex="0"
      role="combobox"
      :aria-expanded="open"
      @click="toggle"
      @keydown="onKeydown"
    >
      <span class="base-select__text">{{ selectedLabels }}</span>
      <span class="base-select__caret"><i class="fa-solid fa-chevron-down" /></span>
    </div>

    <Transition name="base-select-drop">
      <div v-if="open" ref="panelRef" class="base-select__panel" @keydown="onKeydown">
        <label v-if="searchable" class="base-select__search"><i class="fa-solid fa-magnifying-glass" /><input v-model="search" type="search" placeholder="Buscar sucursal" @click.stop /></label>
        <button
          v-if="!multiple && placeholder"
          class="base-select__option"
          :class="{ 'base-select__option--selected': !modelValue }"
          type="button"
          @click="select('')"
        >
          <span>{{ placeholder }}</span>
          <i v-if="!modelValue" class="base-select__check fa-solid fa-check" />
        </button>

        <button
          v-for="opt in filteredOptions"
          :key="opt.value"
          class="base-select__option"
          :class="{ 'base-select__option--selected': isSelected(opt.value) }"
          type="button"
          @click="select(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <i v-if="isSelected(opt.value)" class="base-select__check fa-solid fa-check" />
        </button>
        <p v-if="!filteredOptions.length" class="base-select__empty">No encontramos una sucursal con ese nombre.</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.base-select {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  width: 100%;
  position: relative;
}

.base-select__label {
  color: rgba($text-dark, 0.68);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.base-select__trigger {
  align-items: center;
  background: $white;
  border: 1px solid rgba($text-dark, 0.12);
  border-radius: 16px;
  color: rgba($text-dark, 0.5);
  cursor: pointer;
  display: flex;
  gap: 0.5rem;
  min-height: 52px;
  padding: 0.85rem 1.1rem;
  transition: border-color 0.2s;
  user-select: none;
}

.base-select--has-value .base-select__trigger {
  color: $text-dark;
}

.base-select__trigger:hover {
  border-color: rgba($text-dark, 0.28);
}

.base-select--open .base-select__trigger {
  border-color: $primary-dark;
}

.base-select__text {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.base-select__caret {
  color: rgba($text-dark, 0.35);
  display: inline-flex;
  flex: 0 0 auto;
  transition: transform 0.25s ease;
}

.base-select--open .base-select__caret {
  transform: rotate(180deg);
}

.base-select__panel {
  background: $white;
  border: 1px solid rgba($text-dark, 0.1);
  border-radius: 18px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.12);
  left: 0;
  max-height: 260px;
  overflow-y: auto;
  position: absolute;
  right: 0;
  top: calc(100% + 6px);
  z-index: 50;
}

.base-select--inline .base-select__panel { margin-top: 0.5rem; position: static; }
.base-select--inline .base-select__panel { border-color: rgba($primary-dark, 0.18); box-shadow: none; }

.base-select__search { align-items: center; background: $white; border-bottom: 1px solid rgba($text-dark, .08); display: flex; gap: .55rem; padding: .7rem .85rem; position: sticky; top: 0; z-index: 1; }
.base-select__search i { color: rgba($text-dark, .45); font-size: .8rem; }
.base-select__search input { border: 0; color: $text-dark; min-width: 0; outline: 0; padding: .2rem 0; width: 100%; }
.base-select__empty { color: rgba($text-dark, .55); font-size: .82rem; padding: 1rem; text-align: center; }

.base-select__option {
  align-items: center;
  background: transparent;
  border: 0;
  color: $text-dark;
  cursor: pointer;
  display: flex;
  gap: 0.75rem;
  min-height: 48px;
  padding: 0.65rem 1rem;
  text-align: left;
  transition: background 0.15s;
  width: 100%;
}

.base-select__option:hover {
  background: rgba($primary-dark, 0.06);
}

.base-select__option--selected {
  background: rgba($primary-dark, 0.08);
  font-weight: 700;
}

.base-select--multi .base-select__option--selected {
  background: rgba($primary-dark, 0.1);
  color: $primary-dark;
}

.base-select__option span {
  flex: 1 1 auto;
  min-width: 0;
}

.base-select__check {
  color: $primary-dark;
  display: inline-flex;
  flex: 0 0 auto;
}

/* Dropdown transitions */
.base-select-drop-enter-active {
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

.base-select-drop-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.base-select-drop-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

.base-select-drop-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

/* Bare style (for inline use like BranchSelector in topbar) */
.base-select--bare .base-select__trigger {
  border: 1px solid rgba($text-dark, 0.1);
  min-height: 44px;
  padding: 0.55rem 0.85rem;
}

.base-select--bare .base-select__label {
  font-size: 0.75rem;
}

/* Multi variant */
.base-select--multi .base-select__text {
  white-space: normal;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Disabled state */
.base-select--disabled .base-select__trigger {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
