<script setup lang="ts">
import { computed, onMounted } from 'vue'
import BranchService from '@/services/BranchService'
import { useBranchStore } from '@/stores/branch'
import { useUserStore } from '@/stores/user'
import BaseSelect from '@/components/global/BaseSelect.vue'

const branchStore = useBranchStore()
const userStore = useUserStore()

onMounted(async () => {
  branchStore.hydrate()
  const response = await BranchService.getAll()
  branchStore.setBranches(response.data)
})

const visibleBranches = computed(() => {
  if (userStore.allBranches) return branchStore.branches
  if (userStore.branches.length) return branchStore.branches.filter((branch) => userStore.branches.includes(branch._id))
  return branchStore.branches
})

const branchOptions = computed(() => visibleBranches.value.map((b) => ({ value: b._id, label: b.name })))

function onChange(value: string | string[]) {
  branchStore.setSelectedBranch((typeof value === 'string' ? value : '') || null)
}
</script>

<template>
  <BaseSelect
    :model-value="branchStore.selectedBranchId || ''"
    :options="branchOptions"
    label="Sucursal"
    placeholder="Todas"
    bare
    @update:model-value="onChange"
  />
</template>


