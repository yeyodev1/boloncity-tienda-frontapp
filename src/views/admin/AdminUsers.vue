<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import BaseSelect from '@/components/global/BaseSelect.vue'
import ModalShell from '@/components/global/ModalShell.vue'
import SkeletonLoader from '@/components/global/SkeletonLoader.vue'
import UserService, { type UserDTO } from '@/services/UserService'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useUserStore } from '@/stores/user'

const users = ref<UserDTO[]>([])
const branches = ref<BranchDTO[]>([])
const loading = ref(true)
const saving = ref(false)
const editorOpen = ref(false)
const editingId = ref('')
const email = ref('')
const password = ref('')
const name = ref('')
const phone = ref('')
const selectedBranches = ref<string[]>([])
const accountType = ref<'customer' | 'branch_admin' | 'admin'>('branch_admin')
const allBranches = ref(false)
const { success, error } = useToast()
const { confirm } = useConfirm()
const userStore = useUserStore()

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

const modalTitle = computed(() => (editingId.value ? 'Editar usuario' : 'Nuevo usuario'))
const modalSubtitle = computed(() =>
  editingId.value ? 'Actualiza rol, sucursales y datos del usuario.' : 'Crea un nuevo usuario con rol y acceso a sucursales.',
)

async function load() {
  loading.value = true
  const [usersResponse, branchesResponse] = await Promise.all([UserService.getAll(), BranchService.getAll()])
  users.value = usersResponse.data
  branches.value = branchesResponse.data
  loading.value = false
}

function resetForm() {
  editingId.value = ''
  email.value = ''
  password.value = ''
  name.value = ''
  phone.value = ''
  selectedBranches.value = []
  accountType.value = 'branch_admin'
  allBranches.value = false
}

function openCreate() {
  resetForm()
  editorOpen.value = true
}

function fill(user: UserDTO) {
  editingId.value = user._id
  email.value = user.email
  password.value = ''
  name.value = user.name || ''
  selectedBranches.value = user.branches?.map((branch) => branch._id) || []
  accountType.value = user.accountType
  allBranches.value = user.allBranches || false
  editorOpen.value = true
}

function closeEditor() {
  editorOpen.value = false
  setTimeout(() => resetForm(), 150)
}

async function submit() {
  try {
    saving.value = true
    const payload: Record<string, unknown> = {
      email: email.value,
      name: name.value || undefined,
      accountType: accountType.value,
      branches: selectedBranches.value,
      allBranches: allBranches.value,
    }
    if (password.value) payload.password = password.value

    if (editingId.value) {
      await UserService.update(editingId.value, payload)
      success('Usuario actualizado')
    } else {
      await UserService.create(payload)
      success('Usuario creado')
    }
    closeEditor()
    await load()
  } catch {
    error('No se pudo guardar el usuario')
  } finally {
    saving.value = false
  }
}

async function removeUser(user: UserDTO) {
  if (userStore.id === user._id) {
    error('No puedes eliminarte a ti mismo')
    return
  }
  const ok = await confirm({
    title: 'Eliminar usuario',
    message: `¿Estás seguro de eliminar a ${user.name || user.email}? Esta acción no se puede deshacer.`,
    confirmText: 'Eliminar',
    type: 'danger',
  })
  if (!ok) return
  try {
    await UserService.remove(user._id)
    users.value = users.value.filter((u) => u._id !== user._id)
    success('Usuario eliminado')
  } catch {
    error('No se pudo eliminar el usuario')
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
          <p>Administra roles, sucursales y acceso de los usuarios registrados.</p>
        </div>
        <div class="admin-users__hero-actions">
          <button class="admin-users__cta" type="button" @click="openCreate">Nuevo usuario</button>
        </div>
      </header>

      <SkeletonLoader v-if="loading" type="card" :count="6" />

      <div v-else class="user-list">
        <article v-for="user in users" :key="user._id" class="panel user-card" :class="{ 'is-selected': user._id === editingId }">
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
            <button type="button" @click="fill(user)">Editar</button>
            <button class="user-card__delete" type="button" @click="removeUser(user)">Eliminar</button>
          </div>
        </article>
      </div>
    </section>

    <ModalShell :open="editorOpen" :title="modalTitle" :subtitle="modalSubtitle" size="lg" @close="closeEditor">
      <form class="editor-form panel" @submit.prevent="submit">
        <div class="editor-grid">
          <div class="editor-section full">
            <span>Identidad</span>
            <p>Correo y contraseña de acceso al sistema.</p>
          </div>

          <label>
            <span>Correo electrónico</span>
            <input v-model="email" type="email" placeholder="usuario@ejemplo.com" required />
          </label>

          <label>
            <span>{{ editingId ? 'Nueva contraseña (opcional)' : 'Contraseña' }}</span>
            <input v-model="password" type="password" placeholder="••••••••" :required="!editingId" />
          </label>

          <label>
            <span>Nombre</span>
            <input v-model="name" placeholder="Nombre completo" />
          </label>

          <div class="editor-section full">
            <span>Roles y permisos</span>
            <p>Define el tipo de cuenta y las sucursales a las que tiene acceso.</p>
          </div>

          <BaseSelect v-model="accountType" :options="accountTypeOptions" placeholder="Tipo de cuenta" />

          <label class="field-toggle full">
            <input v-model="allBranches" type="checkbox" />
            <span>Dueño del negocio (acceso a todas las sucursales)</span>
          </label>

          <BaseSelect v-model="selectedBranches" :options="branchOptions" multiple :disabled="allBranches" />
        </div>

        <div class="editor-actions">
          <button type="button" class="secondary" @click="closeEditor">Cancelar</button>
          <button type="submit" :disabled="saving">
            {{ saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear usuario' }}
          </button>
        </div>
      </form>
    </ModalShell>
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
.user-card {
  margin-bottom: 0;
}

.admin-users__hero {
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
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

.admin-users__hero-actions {
  position: relative;
  z-index: 1;
}

.admin-users__cta {
  background: #235931;
  border: 0;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  font-weight: 800;
  min-height: 48px;
  padding: 0.75rem 1.5rem;
  transition: opacity 0.2s;
}

.admin-users__cta:hover {
  opacity: 0.85;
}

.admin-users__eyebrow {
  color: #235931;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  margin-bottom: 0.25rem;
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

.user-card__delete {
  background: rgba(200, 32, 32, 0.08) !important;
  color: #c82020 !important;
}

.user-card__delete:hover {
  background: rgba(200, 32, 32, 0.18) !important;
}

.editor-form {
  padding: 1rem;
}

.editor-grid {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.editor-section {
  background: rgba(35, 89, 49, 0.06);
  border: 1px solid rgba(35, 89, 49, 0.1);
  border-radius: 18px;
  padding: 0.85rem 1rem;
}

.editor-section span {
  color: #235931;
  display: block;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.editor-section p {
  color: rgba(8, 17, 13, 0.62);
  margin-top: 0.25rem;
}

.editor-grid {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.editor-grid label {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.editor-grid label span,
.field-toggle span {
  color: #235931;
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.editor-grid input,
.editor-grid select {
  background: #fff;
  border: 1px solid rgba(8, 17, 13, 0.12);
  border-radius: 16px;
  color: #08110d;
  min-height: 52px;
  padding: 1rem 1.05rem;
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

.editor-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.25rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(8, 17, 13, 0.08);
}

.editor-actions button {
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 800;
  min-height: 48px;
  padding: 0.75rem 1.5rem;
  transition: opacity 0.2s;
}

.editor-actions button.secondary {
  background: rgba(8, 17, 13, 0.06);
  color: rgba(8, 17, 13, 0.72);
}

.editor-actions button.secondary:hover {
  background: rgba(8, 17, 13, 0.12);
}

.editor-actions button[type='submit'] {
  background: #235931;
  color: #fff;
}

.editor-actions button[type='submit']:hover {
  opacity: 0.85;
}

.editor-actions button[type='submit']:disabled {
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

  .admin-users__hero {
    align-items: flex-end;
    flex-direction: row;
  }

  .editor-grid {
    flex-flow: row wrap;
  }

  .editor-grid label,
  .editor-section,
  .field-toggle {
    flex: 1 1 260px;
  }

  .editor-grid .full {
    flex-basis: 100%;
  }
}
</style>
