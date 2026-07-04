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
  }>(),
  {
    label: '',
    placeholder: 'Seleccionar',
    multiple: false,
    bare: false,
  },
)

const emit = defineEmits<{
  (event: 'update:modelValue', value: string | string[]): void
}>()

const open = ref(false)
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

function toggle() {
  open.value = !open.value
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
      <span class="base-select__caret">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
          <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>

    <Transition name="base-select-drop">
      <div v-if="open" ref="panelRef" class="base-select__panel" @keydown="onKeydown">
        <button
          v-if="!multiple && placeholder"
          class="base-select__option"
          :class="{ 'base-select__option--selected': !modelValue }"
          type="button"
          @click="select('')"
        >
          <span>{{ placeholder }}</span>
          <span v-if="!modelValue" class="base-select__check">
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
              <path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>

        <button
          v-for="opt in options"
          :key="opt.value"
          class="base-select__option"
          :class="{ 'base-select__option--selected': isSelected(opt.value) }"
          type="button"
          @click="select(opt.value)"
        >
          <span>{{ opt.label }}</span>
          <span v-if="isSelected(opt.value)" class="base-select__check">
            <svg width="14" height="11" viewBox="0 0 14 11" fill="none">
              <path d="M1 5.5L5 9.5L13 1.5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.base-select {
  display: grid;
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
</style>
