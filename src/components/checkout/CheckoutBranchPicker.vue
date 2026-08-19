<script setup lang="ts" generic="T extends { _id: string; name: string }">
defineProps<{
  loading: boolean
  branches: T[]
  selectedBranchId: string | null
  branchName?: string
}>()

const emit = defineEmits<{
  (e: 'detect'): void
  (e: 'reload'): void
  (e: 'select', branch: T): void
}>()
</script>

<template>
  <div class="checkout-branch">
    <div class="checkout-branch__head">
      <span class="checkout-branch__label"><i class="fa-solid fa-store" /> Elige tu sucursal <em>*</em></span>
      <span v-if="loading" class="muted">Detectando...</span>
    </div>
    <button v-if="!selectedBranchId" type="button" class="checkout-branch__nearby" @click="emit('detect')">
      <i class="fa-solid fa-location-crosshairs" /> Usar mi ubicación
    </button>
    <div v-if="!selectedBranchId && branches.length" class="checkout-branch__pills">
      <button v-for="item in branches" :key="item._id" type="button" class="checkout-branch__pill" :class="{ active: selectedBranchId === item._id }" @click="emit('select', item)">
        {{ item.name }}
      </button>
    </div>
    <p v-if="!selectedBranchId && !branches.length && !loading" class="checkout-branch__empty">
      No se cargaron las sucursales. Toca «Recargar sucursales».
    </p>
    <button v-if="!selectedBranchId" type="button" class="checkout-branch__reload" :disabled="loading" @click="emit('reload')">
      <i :class="loading ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-rotate'" /> {{ loading ? 'Cargando...' : 'Recargar sucursales' }}
    </button>
    <p v-if="selectedBranchId || branchName" class="checkout-branch__selected">
      <i class="fa-solid fa-check-circle" /> {{ branchName || 'Sucursal seleccionada' }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.checkout-branch {
  background: rgba(35, 89, 49, 0.03);
  border: 1px solid rgba(35, 89, 49, 0.08);
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.15rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.checkout-branch:focus-within { border-color: rgba(35, 89, 49, 0.3); box-shadow: 0 14px 34px rgba(35, 89, 49, 0.08); }

.checkout-branch__head { align-items: center; display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: space-between; }

.checkout-branch__label {
  align-items: center;
  color: rgba(8, 17, 13, 0.62);
  display: flex;
  font-size: 0.78rem;
  font-weight: 900;
  gap: 0.45rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.checkout-branch__label i { color: #235931; font-size: 0.72rem; opacity: 0.8; }
.checkout-branch__label em { color: #a02828; font-style: normal; }

.checkout-branch__nearby {
  align-items: center;
  background: rgba(35, 89, 49, 0.06);
  border-radius: 999px;
  color: #235931;
  display: flex;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 1rem;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.checkout-branch__nearby:hover { background: rgba(35, 89, 49, 0.12); transform: translateY(-1px); }
.checkout-branch__pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.checkout-branch__empty {
  color: #8a6d1e;
  font-size: 0.85rem;
  margin: 0;
}

.checkout-branch__reload {
  align-items: center;
  background: #235931;
  border: 0;
  border-radius: 999px;
  color: #fff;
  cursor: pointer;
  display: flex;
  font-weight: 800;
  gap: 0.5rem;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 1rem;
}

.checkout-branch__reload:disabled { opacity: 0.7; cursor: default; }

.checkout-branch__pill {
  background: rgba(26, 26, 26, 0.05);
  border: 1px solid rgba(26, 26, 26, 0.06);
  border-radius: 999px;
  cursor: pointer;
  font-weight: 700;
  min-height: 42px;
  padding: 0.75rem 1.05rem;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.checkout-branch__pill:hover { background: rgba(35, 89, 49, 0.06); border-color: rgba(35, 89, 49, 0.15); transform: translateY(-1px); }
.checkout-branch__pill.active { background: #235931; border-color: #235931; color: #fff; }
.checkout-branch__selected { align-items: center; color: #235931; display: flex; font-weight: 700; gap: 0.4rem; }
</style>
