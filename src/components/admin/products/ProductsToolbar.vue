<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ categoryOptions: { value: string; label: string }[]; loading: boolean; resultRange: string }>()
const searchQuery = defineModel<string>('searchQuery', { required: true })
const selectedCategory = defineModel<string>('selectedCategory', { required: true })
const statusFilter = defineModel<'all' | 'visible' | 'hidden'>('statusFilter', { default: 'all' })
const emit = defineEmits<{ reset: [] }>()

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'visible', label: 'Visibles' },
  { value: 'hidden', label: 'Ocultos' },
] as const

// Desplegable propio (no el nativo). El listener de "click fuera" solo cierra si el click cae fuera:
// así el mismo click que abre no lo cierra.
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const selectedLabel = computed(() =>
  selectedCategory.value ? props.categoryOptions.find((o) => o.value === selectedCategory.value)?.label || 'Todas' : 'Todas las categorías',
)
const hasFilters = computed(() => Boolean(searchQuery.value || selectedCategory.value || statusFilter.value !== 'all'))

function toggle() { open.value = !open.value }
function choose(value: string) { selectedCategory.value = value; open.value = false }
function onDocPointer(event: Event) {
  if (open.value && rootEl.value && !rootEl.value.contains(event.target as Node)) open.value = false
}
function onKeydown(event: KeyboardEvent) { if (event.key === 'Escape') open.value = false }

onMounted(() => {
  document.addEventListener('click', onDocPointer)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocPointer)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <section class="toolbar">
    <label class="cui-search toolbar__search">
      <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
      <span class="visually-hidden">Buscar producto</span>
      <input v-model="searchQuery" type="search" placeholder="Buscar por nombre, código o descripción" autocomplete="off" />
      <button v-if="searchQuery" type="button" aria-label="Borrar búsqueda" @click="searchQuery = ''"><i class="fa-solid fa-xmark" /></button>
    </label>

    <div ref="rootEl" class="dropdown" :class="{ open }">
      <button type="button" class="dropdown__trigger" :aria-expanded="open" aria-haspopup="listbox" @click="toggle">
        <i class="fa-solid fa-layer-group" aria-hidden="true" />
        <span :class="{ placeholder: !selectedCategory }">{{ selectedLabel }}</span>
        <i class="fa-solid fa-chevron-down dropdown__chevron" aria-hidden="true" />
      </button>
      <Transition name="dd">
        <ul v-if="open" class="dropdown__menu" role="listbox">
          <li>
            <button type="button" class="dropdown__opt" :class="{ sel: !selectedCategory }" role="option" :aria-selected="!selectedCategory" @click="choose('')">
              Todas las categorías <i v-if="!selectedCategory" class="fa-solid fa-check" />
            </button>
          </li>
          <li v-for="opt in categoryOptions" :key="opt.value">
            <button type="button" class="dropdown__opt" :class="{ sel: selectedCategory === opt.value }" role="option" :aria-selected="selectedCategory === opt.value" @click="choose(opt.value)">
              {{ opt.label }} <i v-if="selectedCategory === opt.value" class="fa-solid fa-check" />
            </button>
          </li>
        </ul>
      </Transition>
    </div>

    <div class="cui-segments toolbar__status" role="radiogroup" aria-label="Visibilidad">
      <button v-for="opt in statusOptions" :key="opt.value" type="button" role="radio" :aria-checked="statusFilter === opt.value" :class="{ 'is-active': statusFilter === opt.value }" @click="statusFilter = opt.value">
        {{ opt.label }}
      </button>
    </div>

    <div class="toolbar__meta">
      <span>{{ loading ? 'Cargando…' : resultRange }}</span>
      <button v-if="hasFilters" type="button" class="toolbar__reset" @click="emit('reset')"><i class="fa-solid fa-rotate-left" /> Limpiar filtros</button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.toolbar { display: flex; flex-wrap: wrap; gap: 0.6rem; position: relative; z-index: 2; }
.toolbar:has(.dropdown.open) { z-index: 200; }
.toolbar__search { flex: 1 1 100%; }
.dropdown { flex: 1 1 100%; position: relative; }
.toolbar__status { flex: 1 1 100%; }

.dropdown__trigger {
  align-items: center;
  background: var(--admin-input-bg);
  border: 1px solid var(--admin-line-strong);
  border-radius: 14px;
  color: var(--admin-text);
  cursor: pointer;
  display: flex;
  font-size: 0.9rem;
  font-weight: 700;
  gap: 0.55rem;
  min-height: 46px;
  padding: 0 0.85rem;
  text-align: left;
  width: 100%;

  > i:first-child { color: var(--admin-accent); font-size: 0.85rem; }
  > span { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .placeholder { color: var(--admin-muted); font-weight: 600; }
  &:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
}

.dropdown__chevron { color: var(--admin-muted); font-size: 0.75rem; transition: transform 0.2s ease; }
.dropdown.open .dropdown__trigger { border-color: var(--admin-accent); box-shadow: 0 0 0 3px var(--admin-accent-soft); }
.dropdown.open .dropdown__chevron { transform: rotate(180deg); }

.dropdown__menu {
  background: var(--admin-surface);
  border: 1px solid var(--admin-line);
  border-radius: 14px;
  box-shadow: var(--admin-shadow-lg);
  left: 0;
  list-style: none;
  margin: 0;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.3rem;
  position: absolute;
  right: 0;
  top: calc(100% + 0.35rem);
  z-index: 1000;
}

.dropdown__opt {
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: 10px;
  color: var(--admin-text);
  cursor: pointer;
  display: flex;
  font-size: 0.88rem;
  justify-content: space-between;
  min-height: 40px;
  padding: 0.5rem 0.7rem;
  text-align: left;
  width: 100%;

  &:hover { background: var(--admin-hover); }
  &.sel { background: var(--admin-accent-soft); color: var(--admin-accent); font-weight: 800; }
  i { font-size: 0.75rem; }
}

.toolbar__meta {
  align-items: center;
  color: var(--admin-muted);
  display: flex;
  flex: 1 1 100%;
  font-size: 0.8rem;
  font-weight: 600;
  gap: 0.75rem;
  justify-content: space-between;
  min-height: 28px;
}

.toolbar__reset {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--admin-accent);
  cursor: pointer;
  display: inline-flex;
  font-size: 0.8rem;
  font-weight: 800;
  gap: 0.35rem;
  padding: 0.25rem 0;
}

.visually-hidden { clip: rect(0 0 0 0); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px; }

.dd-enter-active, .dd-leave-active { transform-origin: top; transition: opacity 0.16s ease, transform 0.18s ease; }
.dd-enter-from, .dd-leave-to { opacity: 0; transform: translateY(-6px); }

@media (min-width: 900px) {
  .toolbar__search { flex: 2 1 320px; }
  .dropdown { flex: 1 1 220px; }
  .toolbar__status { flex: 0 0 auto; min-width: 280px; }
}

@media (prefers-reduced-motion: reduce) {
  .dd-enter-active, .dd-leave-active, .dropdown__chevron { transition: none; }
}
</style>
