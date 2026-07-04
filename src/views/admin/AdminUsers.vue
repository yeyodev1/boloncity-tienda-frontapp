<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import BaseSelect from '@/components/global/BaseSelect.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import UserService, { type UserDTO } from '@/services/UserService'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useToast } from '@/composables/useToast'

const users = ref<UserDTO[]>([])
const branches = ref<BranchDTO[]>([])
const loading = ref(true)
const selectedId = ref('')
const selectedBranches = ref<string[]>([])
const accountType = ref<'customer' | 'branch_admin' | 'admin'>('branch_admin')
const allBranches = ref(false)
const { success, error } = useToast()

const accountTypeOptions = [
  { value: 'customer', label: 'Cliente' },
  { value: 'branch_admin', label: 'Administrador sucursal' },
  { value: 'admin', label: 'Administrador' },
]
const branchOptions = computed(() => branches.value.map((b) => ({ value: b._id, label: b.name })))

async function load() {
  loading.value = true
  const [usersResponse, branchesResponse] = await Promise.all([UserService.getAll(), BranchService.getAll()])
  users.value = usersResponse.data
  branches.value = branchesResponse.data
  loading.value = false
}

function fill(user: UserDTO) {
  selectedId.value = user._id
  selectedBranches.value = user.branches?.map((branch) => branch._id) || []
  accountType.value = user.accountType
  allBranches.value = user.allBranches || false
}

async function submit() {
  try {
    const payload = { branches: selectedBranches.value, accountType: accountType.value, allBranches: allBranches.value }
    if (selectedId.value) await UserService.update(selectedId.value, payload)
    success('Usuario actualizado')
    await load()
  } catch {
    error('No se pudo actualizar el usuario')
  }
}

onMounted(load)
</script>

<template>
  <AdminLayout>
    <section class="admin-page">
      <h1>Usuarios</h1>
      <form class="card form-grid" @submit.prevent="submit">
        <BaseSelect v-model="accountType" :options="accountTypeOptions" placeholder="Tipo de cuenta" />
        <label class="full"><input v-model="allBranches" type="checkbox" /> Dueño del negocio (ve todas las sucursales)</label>
        <BaseSelect v-model="selectedBranches" :options="branchOptions" multiple />
        <button class="full" type="submit">Guardar</button>
      </form>

      <SkeletonLoader v-if="loading" type="list" :count="4" />

      <div v-else class="list">
        <article v-for="user in users" :key="user._id" class="card item">
          <div>
            <strong>{{ user.email }}</strong>
            <p>{{ user.accountType }}</p>
            <small>{{ user.branches?.map((branch) => branch.name).join(', ') || 'Sin sucursales' }}</small>
          </div>
          <div class="item-actions">
            <button type="button" @click="fill(user)">Asignar</button>
          </div>
        </article>
      </div>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-page { display:flex; flex-direction: column; gap:1rem; color: $text-dark; padding: clamp(0.75rem, 2vw, 1.5rem); }
.card { background:#fff; border-radius:18px; padding:1rem; box-shadow:0 10px 24px rgba(0,0,0,.08); }
.form-grid { display:flex; flex-wrap: wrap; gap:.75rem; }
.form-grid > * { flex: 1 1 220px; }
.full { grid-column:1 / -1; }
.multi { min-height: 140px; }
.list { display:flex; flex-direction: column; gap:.75rem; }
.item { display:flex; justify-content:space-between; gap:1rem; }
.item-actions { display:flex; gap:.5rem; }
button { min-height:44px; border:0; border-radius:999px; padding:.75rem 1rem; background:$primary-dark; color:$white; }
@media (max-width:768px){ .form-grid{grid-template-columns:1fr;} .item{flex-direction:column;} }
</style>
