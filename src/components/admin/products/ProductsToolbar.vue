<script setup lang="ts">
defineProps<{ categoryOptions: { value: string; label: string }[]; loading: boolean; resultRange: string }>()
const searchQuery = defineModel<string>('searchQuery', { required: true })
const selectedCategory = defineModel<string>('selectedCategory', { required: true })
const emit = defineEmits<{ reset: [] }>()
</script>

<template>
  <section class="products-toolbar panel">
    <label class="field"><span>Buscar producto</span><div class="input"><i class="fa-solid fa-magnifying-glass" /><input v-model="searchQuery" placeholder="Código, nombre o descripción" /></div></label>
    <label class="field field--cat"><span>Categoría</span>
      <div class="native-wrap">
        <select v-model="selectedCategory" class="native-select">
          <option value="">Todas</option>
          <option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
        <i class="fa-solid fa-chevron-down" />
      </div>
    </label>
    <div class="results"><strong>{{ loading ? 'Cargando...' : resultRange }}</strong><span>mostrados</span></div>
    <button type="button" @click="emit('reset')"><i class="fa-solid fa-rotate-left" /> Limpiar</button>
  </section>
</template>

<style scoped lang="scss">
.products-toolbar { align-items: stretch; display: flex; flex-direction: column; gap: .85rem; padding: 1.15rem; }
.field { display: flex; flex-direction: column; gap: .45rem; } .field > span { color: rgba($text-dark,.68); font-size: .82rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.input { align-items: center; display: flex; position: relative; } .input i { color: rgba(8,17,13,.42); left: 1rem; position: absolute; } input { background: #fff; border: 1px solid rgba(8,17,13,.12); border-radius: 16px; color: #08110d; min-height: 50px; padding: .95rem 1rem .95rem 2.75rem; width: 100%; }
.native-wrap { position: relative; }
.native-wrap > i { color: rgba(8,17,13,.5); pointer-events: none; position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); font-size: .8rem; }
.native-select { -webkit-appearance: none; appearance: none; background: #fff; border: 1px solid rgba(8,17,13,.12); border-radius: 16px; color: #08110d; cursor: pointer; font-size: .95rem; font-weight: 600; min-height: 50px; padding: .95rem 2.5rem .95rem 1rem; width: 100%; }
.native-select:focus { border-color: rgba(35,89,49,.4); outline: none; }
.results { display: flex; flex-direction: column; justify-content: center; min-height: 48px; } .results span { color: rgba(8,17,13,.48); font-size: .75rem; }
button { align-items: center; background: rgba($secondary,.16); border: 0; border-radius: 999px; color: $text-dark; display: inline-flex; font-weight: 800; gap: .5rem; justify-content: center; min-height: 48px; padding: .85rem 1.2rem; }
@media (min-width: 769px) { .products-toolbar { align-items: flex-end; flex-direction: row; } .field:first-child { flex: 1.5 1 0; } .field--cat { flex: 1 1 0; } .results, button { flex: 0 0 auto; } }
</style>
