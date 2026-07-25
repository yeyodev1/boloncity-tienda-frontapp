<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import BaseSelect from '@/components/global/BaseSelect.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
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

async function submit() {
  try {
    const payload = { name: name.value, description: description.value, parentCategory: parentCategory.value || null, isActive: isActive.value, sortOrder: sortOrder.value }
    if (editingId.value) {
      await CategoryService.update(editingId.value, payload)
      success('Categoria actualizada')
    } else {
      await CategoryService.create(payload)
      success('Categoria creada')
    }
    resetForm()
    await load()
  } catch {
    error('No se pudo guardar la categoria')
  }
}

async function remove(id: string) {
  const ok = await confirm({ title: 'Eliminar categoria', message: 'Los productos quedaran sin categoria. Continuar?', type: 'danger' })
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
  <AdminLayout>
    <main class="categories admin-page">
      <section class="categories__hero panel"><div><p>Organización del catálogo</p><h1>Categorías</h1><span>Crea grupos claros para que los clientes encuentren cada producto con facilidad.</span></div><button type="button" @click="router.push('/admin/productos')"><i class="fa-solid fa-box-open" /> Ver productos</button></section>
      <section class="categories__summary"><article class="panel"><span>Total de categorías</span><strong>{{ categories.length }}</strong><small>Grupos del catálogo</small></article><article class="panel"><span>Activas</span><strong>{{ activeCategories }}</strong><small>Visibles para organizar productos</small></article><article class="panel"><span>Productos asignados</span><strong>{{ assignedProducts }}</strong><small>Relaciones actuales</small></article></section>
      <section class="categories__workspace"><form class="categories__editor panel" @submit.prevent="submit"><header><i :class="editingId ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-folder-plus'" /><div><h2>{{ editingId ? 'Editar categoría' : 'Nueva categoría' }}</h2><p>{{ editingId ? 'Actualiza los datos y guarda los cambios.' : 'Define el nombre y dónde aparecerá en la jerarquía.' }}</p></div></header><label><span>Nombre</span><input v-model="name" required placeholder="Ej. Bolones clásicos" /></label><label><span>Descripción <em>Opcional</em></span><input v-model="description" placeholder="Ayuda a identificar esta categoría" /></label><label><span>Categoría superior <em>Opcional</em></span><BaseSelect v-model="parentCategory" :options="parentCategoryOptions" placeholder="Sin categoría superior" /></label><label><span>Orden</span><input v-model.number="sortOrder" type="number" min="0" placeholder="0" /><small>Los números menores aparecen primero.</small></label><label class="categories__status"><input v-model="isActive" type="checkbox" /><span><strong>Categoria activa</strong><small>Disponible para clasificar productos.</small></span></label><footer><button type="button" class="secondary" @click="resetForm">{{ editingId ? 'Cancelar edición' : 'Limpiar' }}</button><button type="submit"><i :class="editingId ? 'fa-solid fa-floppy-disk' : 'fa-solid fa-plus'" />{{ editingId ? 'Guardar cambios' : 'Crear categoría' }}</button></footer></form>
        <section class="categories__list panel"><header><div><h2>Orden del catálogo</h2><p>Usa las flechas para decidir el orden de aparición.</p></div><span>{{ categories.length }} categorías</span></header><SkeletonLoader v-if="loading" type="list" :count="4" /><div v-else-if="categories.length" class="list"><article v-for="(category, index) in categories" :key="category._id" class="item"><div class="item__order">{{ index + 1 }}</div><div class="item__content"><div><strong>{{ category.name }}</strong><span :class="{ muted: !category.isActive }">{{ category.isActive ? 'Activa' : 'Inactiva' }}</span></div><p>{{ category.description || 'Sin descripción' }}</p><small><i class="fa-solid fa-link" /> {{ category.slug }} <b>·</b> {{ category.productsCount || 0 }} productos</small></div><div class="item-actions"><button type="button" :disabled="index === 0" aria-label="Mover arriba" @click="move(index, -1)"><i class="fa-solid fa-arrow-up" /></button><button type="button" :disabled="index === categories.length - 1" aria-label="Mover abajo" @click="move(index, 1)"><i class="fa-solid fa-arrow-down" /></button><button type="button" class="edit" @click="fillForm(category)"><i class="fa-solid fa-pen" /> Editar</button><button type="button" class="delete" :aria-label="`Eliminar ${category.name}`" @click="remove(category._id)"><i class="fa-solid fa-trash" /></button></div></article></div><div v-else class="empty"><i class="fa-solid fa-folder-open" /><strong>Aún no hay categorías</strong><p>Crea la primera categoría desde el panel de la izquierda.</p></div></section>
      </section>
    </main>
  </AdminLayout>
</template>

<style scoped lang="scss">
.categories { color:var(--admin-text); display:flex; flex-direction:column; gap:1rem; padding:clamp(.75rem,2vw,1.5rem); }.categories__hero { align-items:flex-start; background:linear-gradient(135deg,#235931,#173e22); color:#fff; display:flex; flex-direction:column; gap:1rem; justify-content:space-between; padding:1.25rem; }.categories__hero p { color:#efd537; font-size:.72rem; font-weight:900; letter-spacing:.12em; text-transform:uppercase; }.categories h1 { font-size:clamp(1.7rem,4vw,2.5rem); margin:.35rem 0; }.categories__hero span { color:rgba(255,255,255,.76); }.categories button { align-items:center; background:#235931; border:0; border-radius:999px; color:#fff; cursor:pointer; display:inline-flex; font-weight:900; gap:.45rem; justify-content:center; min-height:42px; padding:.7rem .95rem; }.categories__hero button { background:#efd537; color:#152019; }.categories__summary { display:flex; flex-wrap:wrap; gap:.8rem; }.categories__summary > * { display:flex; flex:1 1 160px; flex-direction:column; padding:1rem; }.categories__summary span { color:var(--admin-muted); font-size:.72rem; font-weight:900; letter-spacing:.06em; text-transform:uppercase; }.categories__summary strong { color:#235931; font-size:2rem; margin:.25rem 0; }.categories__summary small,.categories header p,label small { color:var(--admin-muted); font-size:.76rem; line-height:1.4; }.categories__workspace { display:flex; flex-direction:column; gap:1rem; }.categories__editor,.categories__list { padding:1rem; }.categories__editor { display:flex; flex-direction:column; gap:.8rem; order:2; }.categories__list { order:1; }.categories__editor header,.categories__list header { align-items:flex-start; display:flex; gap:.7rem; justify-content:space-between; }.categories__editor header > i { align-items:center; background:rgba(0,165,35,.1); border-radius:12px; color:#00a523; display:flex; flex:0 0 42px; height:42px; justify-content:center; }.categories h2 { font-size:1.05rem; }.categories__editor label { display:flex; flex-direction:column; gap:.4rem; }.categories label > span { color:#235931; font-size:.72rem; font-weight:900; letter-spacing:.07em; text-transform:uppercase; }.categories label em { color:var(--admin-muted); font-size:.65rem; font-style:normal; text-transform:none; }.categories input { background:#fff; border:1px solid var(--admin-line); border-radius:12px; color:#152019; min-height:44px; padding:.65rem .75rem; }.categories__status { align-items:center; background:rgba(35,89,49,.06); border:1px solid rgba(35,89,49,.13); border-radius:14px; flex-direction:row !important; padding:.75rem; }.categories__status input { accent-color:#235931; min-height:auto; }.categories__status span { display:flex; flex-direction:column; }.categories__status strong { color:#235931; font-size:.82rem; }.categories__editor footer { display:flex; flex-wrap:wrap; gap:.65rem; justify-content:flex-end; }.categories__editor footer button { flex:1 1 150px; }.categories button.secondary,.item-actions button { background:rgba(8,17,13,.07); color:var(--admin-text); }.categories__list header > span { background:rgba(35,89,49,.09); border-radius:999px; color:#235931; font-size:.72rem; font-weight:800; padding:.4rem .55rem; white-space:nowrap; }.list { display:flex; flex-direction:column; }.item { align-items:flex-start; border-top:1px solid var(--admin-line); display:flex; flex-direction:column; gap:.75rem; padding:1rem 0; }.item__order { align-items:center; background:#eef3ef; border-radius:10px; color:#235931; display:flex; flex:0 0 34px; font-size:.78rem; font-weight:900; height:34px; justify-content:center; width:34px; }.item__content { flex:1; min-width:0; }.item__content > div { align-items:center; display:flex; flex-wrap:wrap; gap:.5rem; }.item__content strong { font-size:.95rem; }.item__content span { background:rgba(0,165,35,.1); border-radius:999px; color:#235931; font-size:.65rem; font-weight:900; padding:.25rem .45rem; text-transform:uppercase; }.item__content span.muted { background:rgba(8,17,13,.08); color:var(--admin-muted); }.item__content p { color:var(--admin-muted); font-size:.8rem; margin:.25rem 0; }.item__content small { color:var(--admin-muted); font-size:.7rem; }.item__content b { margin:0 .3rem; }.item-actions { display:flex; flex-wrap:wrap; gap:.45rem; width:100%; }.item-actions button { flex:1 1 42px; padding:.55rem .7rem; }.item-actions button:disabled { cursor:not-allowed; opacity:.35; }.item-actions .edit { background:rgba(35,89,49,.1); color:#235931; }.item-actions .delete { background:rgba(180,35,24,.1); color:#b42318; }.empty { align-items:center; color:var(--admin-muted); display:flex; flex-direction:column; gap:.45rem; padding:2rem 1rem; text-align:center; }.empty i { color:#00a523; font-size:1.5rem; }.empty strong { color:var(--admin-text); } @media (min-width:641px) { .categories__hero { align-items:center; flex-direction:row; }.item { align-items:center; flex-direction:row; }.item-actions { justify-content:flex-end; width:auto; }.item-actions button { flex:0 0 auto; } }
.categories__editor { order:1; }
.categories__list { order:2; }

@media (min-width:1025px) {
  .categories__workspace { align-items:flex-start; flex-direction:row; }
  .categories__editor { flex:0 0 360px; position:sticky; top:5.75rem; }
  .categories__list { flex:1 1 0; }
}
</style>
