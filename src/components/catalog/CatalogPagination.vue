<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  page: number
  pageCount: number
  start: number
  end: number
  total: number
}>()

const emit = defineEmits<{ (event: 'go', page: number): void }>()

/** Páginas visibles: primera, última y las vecinas de la actual; el resto se resume con "…". */
const pages = computed(() => {
  const list: Array<number | '…'> = []
  for (let page = 1; page <= props.pageCount; page += 1) {
    const near = Math.abs(page - props.page) <= 1
    if (page === 1 || page === props.pageCount || near) list.push(page)
    else if (list[list.length - 1] !== '…') list.push('…')
  }
  return list
})
</script>

<template>
  <nav v-if="pageCount > 1" class="catalog-pagination" aria-label="Paginación del catálogo">
    <p>{{ start }}–{{ end }} de {{ total }}</p>
    <div class="catalog-pagination__controls">
      <button type="button" class="catalog-pagination__step" :disabled="page === 1" aria-label="Página anterior" @click="emit('go', page - 1)">
        <i class="fa-solid fa-arrow-left" />
      </button>
      <template v-for="(item, index) in pages" :key="`${item}-${index}`">
        <span v-if="item === '…'" class="catalog-pagination__gap">…</span>
        <button
          v-else
          type="button"
          :class="{ active: item === page }"
          :aria-current="item === page ? 'page' : undefined"
          @click="emit('go', item)"
        >
          {{ item }}
        </button>
      </template>
      <button type="button" class="catalog-pagination__step" :disabled="page === pageCount" aria-label="Página siguiente" @click="emit('go', page + 1)">
        <i class="fa-solid fa-arrow-right" />
      </button>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.catalog-pagination {
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  padding-top: 0.5rem;
}

p {
  color: rgba(16, 39, 25, 0.55);
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  margin: 0;
}

.catalog-pagination__controls {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  justify-content: center;
}

button {
  background: #fff;
  border: 1px solid rgba(16, 39, 25, 0.1);
  border-radius: 999px;
  color: #102719;
  cursor: pointer;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  height: 42px;
  min-width: 42px;
  padding: 0 0.6rem;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

button:hover:not(:disabled) { border-color: rgba(35, 89, 49, 0.4); }
button.active { background: #102719; border-color: #102719; color: #fff; }
button:disabled { cursor: not-allowed; opacity: 0.35; }

.catalog-pagination__step { background: #efd537; border-color: transparent; }

.catalog-pagination__gap { color: rgba(16, 39, 25, 0.45); padding: 0 0.2rem; }

@media (min-width: 641px) {
  .catalog-pagination { flex-direction: row; justify-content: space-between; }
}
</style>
