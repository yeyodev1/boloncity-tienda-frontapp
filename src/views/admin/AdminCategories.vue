<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import BaseSelect from '@/components/global/BaseSelect.vue'
import PageHead from '@/components/admin/catalog-ui/PageHead.vue'
import '@/components/admin/catalog-ui/ui.scss'
import { displayProductName, isCustomerCategory } from '@/utils/productName'
import CategoryService, { type CategoryDTO } from '@/services/CategoryService'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from '@/composables/useToast'
import { useRouter } from 'vue-router'

const categories = ref<CategoryDTO[]>([])
const loading = ref(true)
const editingId = ref('')
const name = ref('')
const description = ref('')
const parentCategory = ref('')
const isActive = ref(true)
const sortOrder = ref(0)
const parentCategoryOptions = computed(() =>
  categories.value.filter((item) => item._id !== editingId.value).map((c) => ({ value: c._id, label: c.name })),
)
const activeCategories = computed(() => categories.value.filter((category) => category.isActive).length)
const assignedProducts = computed(() => categories.value.reduce((total, category) => total + (category.productsCount || 0), 0))
const internalCount = computed(() => categories.value.filter((category) => !isCustomerCategory(category)).length)
const facts = computed(() => loading.value ? [] : [
  { label: 'categorías', value: categories.value.length },
  { label: 'activas', value: activeCategories.value, tone: 'good' as const },
  { label: 'internas del POS', value: internalCount.value },
  { label: 'productos asignados', value: assignedProducts.value },
])
const { confirm } = useConfirm()
const { success, error } = useToast()
const router = useRouter()

async function load() {
  loading.value = true
  const response = await CategoryService.getAll()
  categories.value = response.data
  loading.value = false
}

function resetForm() {
  editingId.value = ''
  name.value = ''
  description.value = ''
  parentCategory.value = ''
  isActive.value = true
  sortOrder.value = 0
}

function fillForm(category: CategoryDTO) {
  editingId.value = category._id
  name.value = category.name
  description.value = category.description || ''
  parentCategory.value = category.parentCategory || ''
  isActive.value = category.isActive
  sortOrder.value = category.sortOrder
}

const editorEl = ref<HTMLElement | null>(null)

/** Edita y lleva la vista al formulario (en celular queda arriba de la lista). */
async function startEdit(category: CategoryDTO) {
  fillForm(category)
  await nextTick()
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  editorEl.value?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
}

async function submit() {
  try {
    const payload = { name: name.value, description: description.value, parentCategory: parentCategory.value || null, isActive: isActive.value, sortOrder: sortOrder.value }
    if (editingId.value) {
      await CategoryService.update(editingId.value, payload)
      success('Categoría actualizada')
    } else {
      await CategoryService.create(payload)
      success('Categoría creada')
    }
    resetForm()
    await load()
  } catch {
    error('No se pudo guardar la categoría')
  }
}

async function remove(id: string) {
  const ok = await confirm({ title: 'Eliminar categoría', message: 'Los productos de esta categoría quedarán sin ella. Quieres eliminarla?', confirmText: 'Sí, eliminar', type: 'danger' })
  if (!ok) return
  await CategoryService.remove(id)
  success('Categoria eliminada')
  await load()
}

async function move(index: number, direction: -1 | 1) {
  const nextIndex = index + direction
  if (nextIndex < 0 || nextIndex >= categories.value.length) return
  const next = [...categories.value]
  const current = next[index]
  const swapped = next[nextIndex]
  if (!current || !swapped) return
  next[index] = swapped
  next[nextIndex] = current
  categories.value = next
  await CategoryService.reorder(next.map((category) => category._id))
  success('Orden actualizado')
}

onMounted(load)
</script>

<template>
  <!-- Envoltorio: así el reset del SCSS con scope de esta vista no le quita el padding a AdminLayout. -->
  <div class="cui-root">
  <AdminLayout>
    <main class="cui-page">
      <PageHead eyebrow="Catálogo" title="Categorías" description="Cómo se agrupa el menú. El orden de esta lista es el orden en la tienda." :facts="facts">
        <template #actions>
          <button type="button" class="cui-btn cui-btn--ghost" @click="router.push('/admin/productos')"><i class="fa-solid fa-box-open" /> Ver productos</button>
        </template>
      </PageHead>

      <section class="workspace">
        <form ref="editorEl" class="editor cui-panel" :class="{ 'is-editing': editingId }" @submit.prevent="submit">
          <div class="cui-section__head">
            <i :class="editingId ? 'fa-solid fa-pen' : 'fa-solid fa-plus'" aria-hidden="true" />
            <div><h2>{{ editingId ? 'Editar categoría' : 'Nueva categoría' }}</h2><p>{{ editingId ? 'Cambia lo que necesites y guarda.' : 'Nombre y dónde va en el menú.' }}</p></div>
          </div>
          <label class="cui-field"><span>Nombre</span><input v-model="name" required placeholder="Ej. Bolones clásicos" /></label>
          <label class="cui-field"><span>Descripción <em>opcional</em></span><input v-model="description" placeholder="Para identificarla internamente" /></label>
          <label class="cui-field"><span>Va dentro de <em>opcional</em></span><BaseSelect v-model="parentCategory" :options="parentCategoryOptions" placeholder="Ninguna (categoría principal)" /></label>
          <label class="cui-field"><span>Posición</span><input v-model.number="sortOrder" type="number" min="0" placeholder="0" /><small>Los números menores aparecen primero.</small></label>
          <button type="button" class="cui-switch" :class="{ 'is-on': isActive }" role="switch" :aria-checked="isActive" @click="isActive = !isActive">
            <i class="fa-solid fa-eye" aria-hidden="true" /><span><strong>Activa</strong><small>{{ isActive ? 'Se usa para clasificar productos' : 'Pausada: no aparece en la tienda' }}</small></span><span class="cui-switch__knob" />
          </button>
          <footer class="cui-footer">
            <button type="button" class="cui-btn cui-btn--ghost" @click="resetForm">{{ editingId ? 'Cancelar' : 'Limpiar' }}</button>
            <button type="submit" class="cui-btn cui-btn--primary"><i :class="editingId ? 'fa-solid fa-floppy-disk' : 'fa-solid fa-plus'" /> {{ editingId ? 'Guardar cambios' : 'Crear categoría' }}</button>
          </footer>
        </form>

        <section class="list cui-panel">
          <header class="list__head">
            <h2>Orden en la tienda</h2>
            <p>Usa las flechas para subir o bajar una categoría.</p>
          </header>

          <ul v-if="loading" class="list__items" aria-hidden="true">
            <li v-for="n in 5" :key="n" class="item"><span class="sk sk--num" /><span class="sk sk--line" /></li>
          </ul>
          <TransitionGroup v-else-if="categories.length" tag="ul" name="reorder" class="list__items">
            <li v-for="(category, index) in categories" :key="category._id" class="item" :class="{ 'is-selected': editingId === category._id, 'is-off': !category.isActive }">
              <span class="item__num">{{ index + 1 }}</span>
              <div class="item__body">
                <div class="item__title">
                  <strong>{{ displayProductName(category.name) }}</strong>
                  <span v-if="!category.isActive" class="cui-chip cui-chip--warn">Pausada</span>
                  <span v-if="!isCustomerCategory(category)" class="cui-chip" title="Grupo del sistema de caja: el cliente no lo ve en el menú">Interna</span>
                </div>
                <p>{{ category.productsCount || 0 }} {{ (category.productsCount || 0) === 1 ? 'producto' : 'productos' }}<template v-if="category.description"> · {{ category.description }}</template></p>
              </div>
              <div class="item__actions">
                <button type="button" class="cui-icon-btn" :disabled="index === 0" :aria-label="`Subir ${category.name}`" title="Subir" @click="move(index, -1)"><i class="fa-solid fa-arrow-up" /></button>
                <button type="button" class="cui-icon-btn" :disabled="index === categories.length - 1" :aria-label="`Bajar ${category.name}`" title="Bajar" @click="move(index, 1)"><i class="fa-solid fa-arrow-down" /></button>
                <button type="button" class="cui-icon-btn" :aria-label="`Editar ${category.name}`" title="Editar" @click="startEdit(category)"><i class="fa-solid fa-pen" /></button>
                <button type="button" class="cui-icon-btn is-danger" :aria-label="`Eliminar ${category.name}`" title="Eliminar" @click="remove(category._id)"><i class="fa-solid fa-trash" /></button>
              </div>
            </li>
          </TransitionGroup>
          <div v-else class="cui-empty">
            <i class="fa-solid fa-layer-group" aria-hidden="true" />
            <strong>Aún no hay categorías</strong>
            <p>Crea la primera con el formulario.</p>
          </div>
        </section>
      </section>
    </main>
  </AdminLayout>
  </div>
</template>

<style scoped lang="scss">
.workspace { display: flex; flex-direction: column; gap: 1rem; }

.editor {
  scroll-margin-top: 5.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem;
  transition: box-shadow 0.25s ease, border-color 0.25s ease;

  &.is-editing { border-color: var(--admin-accent); box-shadow: 0 0 0 3px var(--admin-accent-soft), var(--admin-shadow); }
}

.list { overflow: hidden; }
.list__head { border-bottom: 1px solid var(--admin-line); padding: 1rem; }
.list__head h2 { font-size: 1rem; margin: 0; }
.list__head p { color: var(--admin-muted); font-size: 0.8rem; margin: 0.15rem 0 0; }
.list__items { display: flex; flex-direction: column; list-style: none; margin: 0; padding: 0; }

.item {
  align-items: center;
  border-top: 1px solid var(--admin-line);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem 0.8rem;
  padding: 0.75rem 1rem;
  transition: background-color 0.2s ease;

  &:first-child { border-top: 0; }
  &:hover { background: var(--admin-hover); }
  &.is-selected { background: var(--admin-accent-soft); }
  &.is-off .item__title strong { color: var(--admin-muted); }
}

.item__num {
  align-items: center;
  background: var(--admin-surface-2);
  border: 1px solid var(--admin-line);
  border-radius: 10px;
  color: var(--admin-muted);
  display: flex;
  flex: 0 0 34px;
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  font-weight: 800;
  height: 34px;
  justify-content: center;
}

.item__body { display: flex; flex: 1 1 calc(100% - 50px); flex-direction: column; gap: 0.15rem; min-width: 0; }
.item__title { align-items: center; display: flex; flex-wrap: wrap; gap: 0.4rem; }
.item__title strong { font-size: 0.95rem; }
.item__body p { color: var(--admin-muted); font-size: 0.76rem; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.item__actions { display: flex; gap: 0.35rem; margin-left: auto; }

.sk { animation: sk 1.2s ease-in-out infinite; background: var(--admin-hover); border-radius: 8px; display: block; }
.sk--num { flex: 0 0 34px; height: 34px; }
.sk--line { flex: 0 1 50%; height: 14px; }
@keyframes sk { 50% { opacity: 0.45; } }

.reorder-move { transition: transform 0.3s var(--admin-ease, ease); }

@media (min-width: 720px) {
  .item { flex-wrap: nowrap; }
  .item__body { flex: 1 1 auto; }
}

@media (min-width: 1025px) {
  .workspace { align-items: flex-start; flex-direction: row; }
  .editor { flex: 0 0 340px; position: sticky; top: 5.5rem; }
  .list { flex: 1 1 0; }
}

@media (prefers-reduced-motion: reduce) {
  .sk { animation: none; }
  .reorder-move, .editor { transition: none; }
}
</style>
