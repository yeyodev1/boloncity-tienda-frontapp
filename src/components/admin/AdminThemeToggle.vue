<script setup lang="ts">
import { computed } from 'vue'
import { useAdminTheme } from '@/composables/useAdminTheme'

defineProps<{ withLabel?: boolean }>()

const { theme, toggleTheme } = useAdminTheme()
const isDark = computed(() => theme.value === 'dark')

function onClick(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
}
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :class="{ 'is-dark': isDark, 'with-label': withLabel }"
    role="switch"
    :aria-checked="isDark"
    :aria-label="isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
    :title="isDark ? 'Modo claro' : 'Modo oscuro'"
    @click="onClick"
  >
    <span class="theme-toggle__track" aria-hidden="true">
      <i class="fa-solid fa-sun" />
      <i class="fa-solid fa-moon" />
      <span class="theme-toggle__thumb" />
    </span>
    <span v-if="withLabel" class="theme-toggle__label">
      <strong>{{ isDark ? 'Modo oscuro' : 'Modo claro' }}</strong>
      <small>Toca para cambiar</small>
    </span>
  </button>
</template>

<style scoped lang="scss">
.theme-toggle {
  align-items: center;
  background: transparent;
  color: var(--admin-text);
  display: inline-flex;
  gap: 0.6rem;
  padding: 0;

  &.with-label {
    background: var(--admin-surface-2);
    border: 1px solid var(--admin-line);
    border-radius: 16px;
    padding: 0.6rem 0.7rem;
    text-align: left;
    width: 100%;
  }

  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 3px; border-radius: 16px; }
}

.theme-toggle__track {
  align-items: center;
  background: var(--admin-hover);
  border: 1px solid var(--admin-line);
  border-radius: 999px;
  display: inline-flex;
  flex: 0 0 auto;
  height: 32px;
  justify-content: space-between;
  padding: 0 0.5rem;
  position: relative;
  width: 62px;

  > i { color: var(--admin-muted); font-size: 0.72rem; position: relative; z-index: 1; transition: color 0.3s ease; }
  > i:first-child { color: #b98a00; }
}

.is-dark .theme-toggle__track > i:first-child { color: var(--admin-muted); }
.is-dark .theme-toggle__track > i:nth-child(2) { color: var(--admin-yellow); }

.theme-toggle__thumb {
  background: var(--admin-surface);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  height: 24px;
  left: 3px;
  position: absolute;
  top: 3px;
  transition: transform 0.35s var(--admin-ease);
  width: 24px;
}

.is-dark .theme-toggle__thumb { transform: translateX(30px); }

.theme-toggle__label {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;

  strong { font-size: 0.78rem; }
  small { color: var(--admin-muted); font-size: 0.66rem; }
}

@media (prefers-reduced-motion: reduce) {
  .theme-toggle__thumb, .theme-toggle__track > i { transition: none; }
}
</style>
