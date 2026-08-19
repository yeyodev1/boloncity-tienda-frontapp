<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ categoryOptions: { value: string; label: string }[]; loading: boolean; resultRange: string }>()
const searchQuery = defineModel<string>('searchQuery', { required: true })
const selectedCategory = defineModel<string>('selectedCategory', { required: true })
const emit = defineEmits<{ reset: [] }>()

// Desplegable propio (no el nativo). Patrón simple y confiable de abrir/cerrar:
// el listener de "click fuera" está siempre activo en fase de burbuja y solo cierra
// si el click cae fuera del componente — así el mismo click que abre no lo cierra.
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const selectedLabel = computed(() =>
  selectedCategory.value
    ? props.categoryOptions.find((o) => o.value === selectedCategory.value)?.label || 'Todas'
    : 'Todas',
)

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
  <section class="products-toolbar panel">
    <label class="field"><span>Buscar producto</span><div class="input"><i class="fa-solid fa-magnifying-glass" /><input v-model="searchQuery" placeholder="Código, nombre o descripción" /></div></label>

    <div class="field field--cat">
      <span>Categoría</span>
      <div ref="rootEl" class="dropdown" :class="{ open }">
        <button type="button" class="dropdown__trigger" :aria-expanded="open" @click="toggle">
          <span :class="{ placeholder: !selectedCategory }">{{ selectedLabel }}</span>
          <i class="fa-solid fa-chevron-down" />
        </button>
        <Transition name="dd">
          <ul v-if="open" class="dropdown__menu" role="listbox">
            <li>
              <button type="button" class="dropdown__opt" :class="{ sel: !selectedCategory }" @click="choose('')">
                Todas <i v-if="!selectedCategory" class="fa-solid fa-check" />
              </button>
            </li>
            <li v-for="opt in categoryOptions" :key="opt.value">
              <button type="button" class="dropdown__opt" :class="{ sel: selectedCategory === opt.value }" @click="choose(opt.value)">
                {{ opt.label }} <i v-if="selectedCategory === opt.value" class="fa-solid fa-check" />
              </button>
            </li>
          </ul>
        </Transition>
      </div>
    </div>

    <div class="results"><strong>{{ loading ? 'Cargando...' : resultRange }}</strong><span>mostrados</span></div>
    <button type="button" class="reset" @click="emit('reset')"><i class="fa-solid fa-rotate-left" /> Limpiar</button>
  </section>
</template>

<style scoped lang="scss">
.products-toolbar { align-items: stretch; display: flex; flex-direction: column; gap: .85rem; padding: 1.15rem; }
.field { display: flex; flex-direction: column; gap: .45rem; } .field > span { color: rgba($text-dark,.68); font-size: .82rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.input { align-items: center; display: flex; position: relative; } .input i { color: rgba(8,17,13,.42); left: 1rem; position: absolute; } input { background: #fff; border: 1px solid rgba(8,17,13,.12); border-radius: 16px; color: #08110d; min-height: 50px; padding: .95rem 1rem .95rem 2.75rem; width: 100%; }

/* Desplegable propio */
.dropdown { position: relative; }
.dropdown__trigger { align-items: center; background: #fff; border: 1px solid rgba(8,17,13,.12); border-radius: 16px; color: #08110d; cursor: pointer; display: flex; font-size: .95rem; font-weight: 600; gap: .5rem; justify-content: space-between; min-height: 50px; padding: .95rem 1rem; width: 100%; }
.dropdown__trigger .placeholder { color: rgba(8,17,13,.5); }
.dropdown__trigger > i { color: rgba(8,17,13,.5); font-size: .8rem; transition: transform .2s ease; }
.dropdown.open .dropdown__trigger { border-color: rgba(35,89,49,.45); }
.dropdown.open .dropdown__trigger > i { transform: rotate(180deg); }
.dropdown__menu { background: #fff; border: 1px solid rgba(8,17,13,.12); border-radius: 14px; box-shadow: 0 16px 38px rgba(8,17,13,.16); left: 0; list-style: none; margin: .35rem 0 0; max-height: 280px; overflow-y: auto; padding: .35rem; position: absolute; right: 0; top: 100%; z-index: 80; }
.dropdown__opt { align-items: center; background: transparent; border: 0; border-radius: 10px; color: #152019; cursor: pointer; display: flex; font-size: .9rem; justify-content: space-between; min-height: 42px; padding: .55rem .7rem; text-align: left; width: 100%; }
.dropdown__opt:hover { background: rgba(35,89,49,.09); }
.dropdown__opt.sel { background: rgba(35,89,49,.12); color: #235931; font-weight: 800; }
.dropdown__opt i { color: #235931; font-size: .78rem; }
.dd-enter-active, .dd-leave-active { transition: opacity .16s ease, transform .18s ease; transform-origin: top; }
.dd-enter-from, .dd-leave-to { opacity: 0; transform: translateY(-6px); }

.results { display: flex; flex-direction: column; justify-content: center; min-height: 48px; } .results span { color: rgba(8,17,13,.48); font-size: .75rem; }
.reset { align-items: center; background: rgba($secondary,.16); border: 0; border-radius: 999px; color: $text-dark; display: inline-flex; font-weight: 800; gap: .5rem; justify-content: center; min-height: 48px; padding: .85rem 1.2rem; cursor: pointer; }
@media (min-width: 769px) { .products-toolbar { align-items: flex-end; flex-direction: row; } .field:first-child { flex: 1.5 1 0; } .field--cat { flex: 1 1 0; } .results, .reset { flex: 0 0 auto; } }
</style>
