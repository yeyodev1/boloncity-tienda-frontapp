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
const selectedEmail = ref('')
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

const accountTypeLabels: Record<string, string> = {
  customer: 'Cliente',
  branch_admin: 'Admin. sucursal',
  admin: 'Admin',
}

async function load() {
  loading.value = true
  const [usersResponse, branchesResponse] = await Promise.all([UserService.getAll(), BranchService.getAll()])
  users.value = usersResponse.data
  branches.value = branchesResponse.data
  loading.value = false
}

function fill(user: UserDTO) {
  selectedId.value = user._id
  selectedEmail.value = user.email
  selectedBranches.value = user.branches?.map((branch) => branch._id) || []
  accountType.value = user.accountType
  allBranches.value = user.allBranches || false
}

function cancel() {
  selectedId.value = ''
  selectedEmail.value = ''
  selectedBranches.value = []
  accountType.value = 'branch_admin'
  allBranches.value = false
}

async function submit() {
  try {
    const payload = { branches: selectedBranches.value, accountType: accountType.value, allBranches: allBranches.value }
    if (selectedId.value) await UserService.update(selectedId.value, payload)
    success('Usuario actualizado')
    cancel()
    await load()
  } catch {
    error('No se pudo actualizar el usuario')
  }
}

onMounted(load)
</script>

<template>
  <AdminLayout>
    <section class="admin-users">
      <header class="admin-users__hero panel">
        <div>
          <p class="admin-users__eyebrow">Gestión</p>
          <h1>Usuarios</h1>
          <p>Asigna roles y sucursales a los usuarios registrados.</p>
        </div>
      </header>

      <form v-if="selectedId" class="panel form-panel" @submit.prevent="submit">
        <div class="form-header">
          <span class="form-header__label">Editando</span>
          <strong class="form-header__email">{{ selectedEmail }}</strong>
          <button type="button" class="form-header__cancel" @click="cancel">Cancelar</button>
        </div>
        <div class="form-grid">
          <BaseSelect v-model="accountType" :options="accountTypeOptions" placeholder="Tipo de cuenta" />
          <label class="field-toggle full">
            <input v-model="allBranches" type="checkbox" />
            <span>Dueño del negocio (ve todas las sucursales)</span>
          </label>
          <BaseSelect v-model="selectedBranches" :options="branchOptions" multiple :disabled="allBranches" />
          <button class="full" type="submit">Guardar cambios</button>
        </div>
      </form>

      <SkeletonLoader v-if="loading" type="card" :count="4" />

      <div v-else class="user-list">
        <article v-for="user in users" :key="user._id" class="panel user-card" :class="{ 'is-selected': user._id === selectedId }">
          <div class="user-card__body">
            <div class="user-card__head">
              <div class="user-card__avatar">{{ (user.name || user.email).slice(0, 1).toUpperCase() }}</div>
              <div>
                <strong>{{ user.name || user.email }}</strong>
                <p v-if="user.name" class="user-card__email">{{ user.email }}</p>
              </div>
            </div>
            <span class="user-card__type">{{ accountTypeLabels[user.accountType] || user.accountType }}</span>
          </div>
          <div class="user-card__foot">
            <small>{{ user.branches?.map((branch) => branch.name).join(', ') || 'Sin sucursales' }}</small>
            <button type="button" @click="fill(user)">Asignar</button>
          </div>
        </article>
      </div>
    </section>
  </AdminLayout>
</template>

<style scoped lang="scss">
.admin-users {
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: clamp(0.75rem, 2vw, 1.5rem);
}

.admin-users__hero,
.form-panel,
.user-card {
  margin-bottom: 0;
}

.admin-users__hero {
  overflow: hidden;
  padding: clamp(1.25rem, 3vw, 2rem);
  position: relative;
}

.admin-users__hero::after {
  background: radial-gradient(circle, rgba(239, 213, 55, 0.18), transparent 64%);
  content: '';
  height: 220px;
  position: absolute;
  right: -80px;
  top: -90px;
  width: 220px;
}

.admin-users__eyebrow {
  color: #235931;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.form-panel {
  padding: 1rem;
}

.form-header {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(8, 17, 13, 0.08);
}

.form-header__label {
  color: rgba(8, 17, 13, 0.58);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.form-header__email {
  font-size: 1rem;
  font-weight: 800;
  color: #08110d;
}

.form-header__cancel {
  margin-left: auto;
  background: rgba(8, 17, 13, 0.06);
  border: 0;
  border-radius: 999px;
  color: rgba(8, 17, 13, 0.72);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
  min-height: 36px;
  padding: 0.5rem 1rem;
  transition: background 0.2s;
}

.form-header__cancel:hover {
  background: rgba(8, 17, 13, 0.12);
}

.form-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.form-grid > * {
  flex: 1 1 220px;
}

.full {
  flex-basis: 100%;
}

.field-toggle {
  align-items: center;
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.12);
  border-radius: 16px;
  display: flex;
  gap: 0.6rem;
  min-height: 52px;
  padding: 0.95rem 1rem;
  cursor: pointer;
}

.field-toggle input {
  min-height: 18px;
  width: 18px;
}

.field-toggle span {
  color: #235931;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.user-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-card {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
  padding: clamp(0.85rem, 2vw, 1.15rem);
  transition: border-color 0.2s;
  border: 1px solid transparent;
}

.user-card.is-selected {
  border-color: #235931;
  background: rgba(35, 89, 49, 0.04);
}

.user-card__body {
  align-items: center;
  display: flex;
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 0.75rem;
  min-width: 0;
}

.user-card__head {
  align-items: center;
  display: flex;
  gap: 0.65rem;
  min-width: 0;
}

.user-card__avatar {
  align-items: center;
  background: #235931;
  border-radius: 999px;
  color: #fff;
  display: flex;
  flex-shrink: 0;
  font-size: 0.85rem;
  font-weight: 800;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.user-card__email {
  color: rgba(8, 17, 13, 0.58);
  font-size: 0.82rem;
}

.user-card__type {
  background: rgba(35, 89, 49, 0.08);
  border-radius: 999px;
  color: #235931;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 0.3rem 0.65rem;
  text-transform: uppercase;
  white-space: nowrap;
}

.user-card__foot {
  align-items: center;
  display: flex;
  gap: 0.75rem;
  flex: 0 0 auto;
}

.user-card__foot small {
  color: rgba(8, 17, 13, 0.58);
  font-size: 0.78rem;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-card__foot button {
  background: #235931;
  border: 0;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  font-weight: 800;
  min-height: 42px;
  padding: 0.6rem 1rem;
  transition: opacity 0.2s;
}

.user-card__foot button:hover {
  opacity: 0.85;
}

button[type='submit'] {
  background: #235931;
  border: 0;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  font-weight: 800;
  min-height: 52px;
  padding: 0.75rem 1.5rem;
  transition: opacity 0.2s;
}

button[type='submit']:hover {
  opacity: 0.85;
}

button[type='submit']:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@media (min-width: 769px) {
  .user-card {
    flex-wrap: nowrap;
  }

  .user-card__body {
    flex-wrap: nowrap;
  }

  .user-card__foot small {
    max-width: 300px;
  }
}
</style>
