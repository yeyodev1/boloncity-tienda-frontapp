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
    <section class="admin-page">
      <div class="header-row">
        <div>
          <h1>Categorias</h1>
          <p>Crear, editar, jerarquizar y ordenar categorias dinámicas.</p>
        </div>
        <button type="button" @click="router.push('/admin/productos')">Ver productos</button>
      </div>

      <form class="card form-grid" @submit.prevent="submit">
        <input v-model="name" placeholder="Nombre" />
        <input v-model="description" placeholder="Descripcion" />
        <BaseSelect v-model="parentCategory" :options="parentCategoryOptions" placeholder="Sin padre" />
        <input v-model.number="sortOrder" type="number" placeholder="Orden" />
        <label><input v-model="isActive" type="checkbox" /> Activa</label>
        <div class="actions">
          <button type="button" @click="resetForm">Limpiar</button>
          <button type="submit">{{ editingId ? 'Actualizar' : 'Crear' }}</button>
        </div>
      </form>

      <SkeletonLoader v-if="loading" type="list" :count="4" />
      <div v-else class="list">
        <article v-for="(category, index) in categories" :key="category._id" class="item card">
          <div>
            <strong>{{ category.name }}</strong>
            <p>{{ category.description || 'Sin descripcion' }}</p>
            <small>{{ category.slug }} · {{ category.productsCount || 0 }} productos</small>
          </div>
          <div class="item-actions">
            <button type="button" @click="move(index, -1)">↑</button>
            <button type="button" @click="move(index, 1)">↓</button>
            <button type="button" @click="fillForm(category)">Editar</button>
            <button type="button" @click="remove(category._id)">Eliminar</button>
          </div>
        </article>
      </div>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-page { display:flex; flex-direction: column; gap:1rem; color: $text-dark; padding: clamp(0.75rem, 2vw, 1.5rem); }
.header-row { display: flex; justify-content: space-between; align-items: start; gap: 1rem; margin-bottom: 1.5rem; }
.card { background: #fff; border-radius: 18px; padding: 1rem; box-shadow: 0 10px 24px rgba(0,0,0,.08); margin-bottom: 1.5rem; }
.form-grid { display: flex; gap: .75rem; flex-wrap: wrap; }
.form-grid > * { flex: 1 1 220px; }
.form-grid .actions { grid-column: 1 / -1; display: flex; gap: .75rem; justify-content: flex-end; }
.list { display: flex; flex-direction: column; gap: .75rem; }
.item { display:flex; justify-content: space-between; gap: 1rem; padding: 1rem; border-radius: 16px; background: #fff; }
.item-actions { display:flex; gap: .5rem; flex-wrap: wrap; align-items: center; }
button { border:0; border-radius: 999px; padding: .7rem 1rem; background:$primary-dark; color:$white; cursor:pointer; }
button[type='button'] { background:rgba($secondary, 0.16); color:$text-dark; }
@media (max-width: 768px) { .form-grid { grid-template-columns: 1fr; } .item { flex-direction: column; } }
</style>
