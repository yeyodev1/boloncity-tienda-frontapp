<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import UserService, { type UserDTO } from '@/services/UserService'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useUserStore } from '@/stores/user'
import PageHead from '@/components/admin/catalog-ui/PageHead.vue'
import '@/components/admin/catalog-ui/ui.scss'
import UsersList from './UsersList.vue'
import UserEditor from './UserEditor.vue'
import { accountTypes, type UserForm } from './types'
const users = ref<UserDTO[]>([]); const branches = ref<BranchDTO[]>([]); const loading = ref(true); const saving = ref(false); const open = ref(false); const editingId = ref(''); const { success, error } = useToast(); const { confirm } = useConfirm(); const userStore = useUserStore()
const form = reactive<UserForm>({ email:'', password:'', name:'', phone:'', accountType:'branch_admin', branches:[], allBranches:false })
const branchOptions = computed(() => branches.value.map((branch) => ({ value:branch._id, label:branch.name }))); const labels = { customer:'Cliente', branch_admin:'Equipo de sucursal', admin:'Administrador' }
/** El equipo (admin y sucursales) va primero; los clientes se registran solos al comprar. */
const audience = ref<'team' | 'customers' | 'all'>('team')
const search = ref('')
const teamCount = computed(() => users.value.filter((user) => user.accountType !== 'customer').length)
const visibleUsers = computed(() => {
  const q = search.value.trim().toLowerCase()
  return users.value.filter((user) => {
    const matchesAudience = audience.value === 'all' || (audience.value === 'team' ? user.accountType !== 'customer' : user.accountType === 'customer')
    const matchesSearch = !q || [user.name || '', user.email].join(' ').toLowerCase().includes(q)
    return matchesAudience && matchesSearch
  })
})
const facts = computed(() => loading.value ? [] : [
  { label: 'en el equipo', value: teamCount.value },
  { label: 'con acceso a todo', value: users.value.filter((user) => user.allBranches).length },
  { label: 'clientes', value: users.value.length - teamCount.value },
])
function reset() { Object.assign(form, { email:'', password:'', name:'', phone:'', accountType:'branch_admin', branches:[], allBranches:false }); editingId.value = '' }
async function load() { loading.value = true; try { const [usersData, branchesData] = await Promise.all([UserService.getAll(), BranchService.getAll()]); users.value = usersData.data; branches.value = branchesData.data } catch { error('No se pudieron cargar los usuarios') } finally { loading.value = false } }
function create() { reset(); open.value = true }; function edit(user: UserDTO) { Object.assign(form, { email:user.email, password:'', name:user.name || '', phone:'', accountType:user.accountType, branches:user.branches?.map((branch) => branch._id) || [], allBranches:user.allBranches || false }); editingId.value = user._id; open.value = true }; function close() { open.value = false; setTimeout(reset, 150) }
async function save() { try { saving.value = true; const payload: Record<string, unknown> = { email:form.email, name:form.name || undefined, accountType:form.accountType, branches:form.branches, allBranches:form.allBranches }; if (form.password) payload.password = form.password; if (editingId.value) await UserService.update(editingId.value, payload); else await UserService.create(payload); success(editingId.value ? 'Usuario actualizado' : 'Usuario creado'); close(); await load() } catch { error('No se pudo guardar el usuario') } finally { saving.value = false } }
async function remove(user: UserDTO) { if (userStore.id === user._id) return error('No puedes eliminarte a ti mismo'); if (!await confirm({ title:'¿Eliminar usuario?', message:`${user.name || user.email} perderá acceso a Boloncity. Esta acción no se puede deshacer.`, confirmText:'Sí, eliminar usuario', cancelText:'Conservar usuario', type:'danger' })) return; try { await UserService.remove(user._id); users.value = users.value.filter((item) => item._id !== user._id); success('Usuario eliminado') } catch { error('No se pudo eliminar el usuario') } }
onMounted(load)
</script>
<template>
  <!-- Envoltorio: así el reset del SCSS con scope de esta vista no le quita el padding a AdminLayout. -->
  <div class="cui-root">
    <AdminLayout>
      <main class="cui-page">
        <PageHead eyebrow="Equipo y permisos" title="Usuarios" description="Quién entra al panel y a qué locales tiene acceso." :facts="facts">
          <template #actions>
            <button type="button" class="cui-btn cui-btn--primary" @click="create"><i class="fa-solid fa-user-plus" /> Nuevo usuario</button>
          </template>
        </PageHead>
        <div class="filters">
          <label class="cui-search filters__search">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input v-model="search" type="search" placeholder="Buscar por nombre o correo" aria-label="Buscar usuario" autocomplete="off" />
            <button v-if="search" type="button" aria-label="Borrar búsqueda" @click="search = ''"><i class="fa-solid fa-xmark" /></button>
          </label>
          <div class="cui-segments filters__audience" role="radiogroup" aria-label="Tipo de usuario">
            <button type="button" role="radio" :aria-checked="audience === 'team'" :class="{ 'is-active': audience === 'team' }" @click="audience = 'team'">Equipo</button>
            <button type="button" role="radio" :aria-checked="audience === 'customers'" :class="{ 'is-active': audience === 'customers' }" @click="audience = 'customers'">Clientes</button>
            <button type="button" role="radio" :aria-checked="audience === 'all'" :class="{ 'is-active': audience === 'all' }" @click="audience = 'all'">Todos</button>
          </div>
        </div>
        <UsersList :users="visibleUsers" :loading="loading" :labels="labels" :searching="Boolean(search)" @create="create" @edit="edit" @remove="remove" />
        <UserEditor :open="open" :editing="Boolean(editingId)" :saving="saving" :form="form" :account-options="accountTypes" :branch-options="branchOptions" @close="close" @submit="save" />
      </main>
    </AdminLayout>
  </div>
</template>
<style scoped lang="scss">
.filters { display: flex; flex-wrap: wrap; gap: 0.6rem; }
.filters__search { flex: 1 1 280px; }
.filters__audience { flex: 1 1 280px; }
@media (min-width: 900px) { .filters__audience { flex: 0 0 320px; } }
</style>
