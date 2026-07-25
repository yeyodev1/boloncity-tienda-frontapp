<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BranchService from '@/services/BranchService'
import { useBranchStore } from '@/stores/branch'
import { useUserStore } from '@/stores/user'

const branchStore = useBranchStore()
const userStore = useUserStore()
const open = ref(false)
const searchQuery = ref('')
const root = ref<HTMLElement | null>(null)

onMounted(async () => {
  branchStore.hydrate()
  try {
    const response = await BranchService.getAll()
    branchStore.setBranches(response.data)
  } catch {
    branchStore.setBranches([])
  }
})

const visibleBranches = computed(() => {
  const branches = userStore.allBranches
    ? branchStore.branches
    : userStore.branches.length
      ? branchStore.branches.filter((branch) => userStore.branches.includes(branch._id))
      : branchStore.branches
  return [...branches].sort((a, b) => a.name.localeCompare(b.name, 'es'))
})
const selectedLabel = computed(() => {
  if (!branchStore.selectedBranchId) return 'Todas las sucursales'
  return visibleBranches.value.find((branch) => branch._id === branchStore.selectedBranchId)?.name || 'Seleccionar sucursal'
})
const filteredBranches = computed(() => {
  const query = searchQuery.value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  if (!query) return visibleBranches.value
  return visibleBranches.value.filter((branch) => branch.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(query))
})

function selectBranch(id: string | null) {
  branchStore.setSelectedBranch(id)
  open.value = false
  searchQuery.value = ''
  window.dispatchEvent(new CustomEvent('admin:branch-change'))
}
function closeOutside(event: MouseEvent) { if (root.value && !root.value.contains(event.target as Node)) open.value = false }
function closeOnEscape(event: KeyboardEvent) { if (event.key === 'Escape') open.value = false }

onMounted(() => document.addEventListener('click', closeOutside))
onBeforeUnmount(() => document.removeEventListener('click', closeOutside))
</script>

<template>
  <div ref="root" class="branch-filter" :class="{ 'branch-filter--open': open }" aria-label="Filtrar por sucursal" @keydown="closeOnEscape">
    <button type="button" class="branch-filter__trigger" :aria-expanded="open" @click="open = !open">
      <i class="fa-solid fa-store" /><span><small>Sucursal</small><strong>{{ selectedLabel }}</strong></span><i class="fa-solid fa-chevron-down" />
    </button>
    <Transition name="branch-filter-drop"><div v-if="open" class="branch-filter__panel">
      <label class="branch-filter__search"><i class="fa-solid fa-magnifying-glass" /><input v-model.trim="searchQuery" type="search" placeholder="Buscar sucursal" autocomplete="off" /><button v-if="searchQuery" type="button" aria-label="Limpiar búsqueda" @click="searchQuery = ''">×</button></label>
      <button v-if="userStore.allBranches" type="button" :class="{ active: !branchStore.selectedBranchId }" @click="selectBranch(null)"><i class="fa-solid fa-building" /> Todas las sucursales<i v-if="!branchStore.selectedBranchId" class="branch-filter__check fa-solid fa-check" /></button>
      <button v-for="branch in filteredBranches" :key="branch._id" type="button" :class="{ active: branchStore.selectedBranchId === branch._id }" @click="selectBranch(branch._id)"><i class="fa-solid fa-location-dot" /> {{ branch.name }}<i v-if="branchStore.selectedBranchId === branch._id" class="branch-filter__check fa-solid fa-check" /></button>
      <p v-if="filteredBranches.length === 0" class="branch-filter__empty">No encontramos esa sucursal.</p>
    </div></Transition>
  </div>
</template>

<style scoped lang="scss">
.branch-filter { min-width:0; position:relative; width:min(214px,calc(100vw - 148px)); }.branch-filter--open { z-index:50; }.branch-filter__trigger { align-items:center; background:var(--admin-hover); border:1px solid var(--admin-line); border-radius:12px; color:var(--admin-text); display:flex; gap:.5rem; min-height:42px; padding:.42rem .65rem; text-align:left; width:100%; }.branch-filter__trigger > i:first-child { color:var(--admin-accent); }.branch-filter__trigger span { display:flex; flex:1 1 0; flex-direction:column; min-width:0; }.branch-filter__trigger small { color:var(--admin-muted); font-size:.56rem; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }.branch-filter__trigger strong { font-size:.72rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.branch-filter__trigger > i:last-child { color:var(--admin-muted); font-size:.65rem; transition:transform .2s ease; }.branch-filter--open .branch-filter__trigger > i:last-child { transform:rotate(180deg); }.branch-filter__panel { background:var(--admin-surface); border:1px solid var(--admin-line); border-radius:12px; box-shadow:0 12px 26px rgba(8,17,13,.15); display:flex; flex-direction:column; gap:.1rem; left:0; max-height:min(220px,calc(100vh - 112px)); overflow-y:auto; overscroll-behavior:contain; padding:.25rem; position:absolute; scrollbar-color:rgba(35,89,49,.42) transparent; scrollbar-width:thin; top:calc(100% + 6px); width:100%; z-index:50; }.branch-filter__panel::-webkit-scrollbar { width:4px; }.branch-filter__panel::-webkit-scrollbar-thumb { background:rgba(35,89,49,.42); border-radius:999px; }.branch-filter__search { align-items:center; background:var(--admin-hover); border:1px solid var(--admin-line); border-radius:8px; display:flex; flex:0 0 auto; gap:.4rem; margin-bottom:.15rem; min-height:32px; padding:0 .45rem; }.branch-filter__search > i { color:var(--admin-accent); font-size:.65rem; }.branch-filter__search input { background:transparent; border:0; color:var(--admin-text); flex:1 1 0; font-size:.68rem; min-width:0; outline:0; }.branch-filter__search input::placeholder { color:var(--admin-muted); }.branch-filter__search button { background:transparent; border:0; color:var(--admin-muted); display:block; font-size:1rem; min-height:0; padding:0; width:auto; }.branch-filter__panel > button { align-items:center; background:transparent; border:0; border-radius:8px; color:var(--admin-text); display:flex; font-size:.68rem; font-weight:750; gap:.5rem; min-height:32px; padding:.34rem .45rem; text-align:left; width:100%; }.branch-filter__panel > button:hover,.branch-filter__panel > button.active { background:var(--admin-hover); }.branch-filter__panel > button > i:first-child { color:var(--admin-accent); width:14px; }.branch-filter__check { color:var(--admin-accent); font-size:.62rem; margin-left:auto; }.branch-filter__empty { color:var(--admin-muted); font-size:.65rem; padding:.55rem .45rem; text-align:center; }.branch-filter-drop-enter-active,.branch-filter-drop-leave-active { transform-origin:top left; transition:opacity .18s ease,transform .22s cubic-bezier(.16,1,.3,1); }.branch-filter-drop-enter-from,.branch-filter-drop-leave-to { opacity:0; transform:translateY(-7px) scale(.97); }
@media (min-width:641px) { .branch-filter { width:300px; } }
</style>
