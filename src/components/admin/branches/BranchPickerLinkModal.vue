<script setup lang="ts">
import { ref, watch } from 'vue'
import ModalShell from '@/components/global/ModalShell.vue'
import BranchService, { type BranchDTO } from '@/services/BranchService'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ open: boolean; branch: BranchDTO | null }>()
const emit = defineEmits<{ close: []; linked: [branch: BranchDTO] }>()

type PickerEnv = 'development' | 'production'
interface PickerStore { companyName: string; token: string; linkedTo: string | null }

const environment = ref<PickerEnv>('production')
const stores = ref<PickerStore[]>([])
const loading = ref(false)
const linkingToken = ref('')
const loadError = ref('')
const { success, error } = useToast()

async function load() {
  if (!props.branch) return
  loading.value = true
  loadError.value = ''
  stores.value = []
  try {
    stores.value = (await BranchService.pickerStores(environment.value)).data.stores
  } catch (requestError: any) {
    loadError.value = requestError?.message || 'No se pudieron listar las tiendas de Picker.'
  } finally {
    loading.value = false
  }
}

async function link(store: PickerStore) {
  if (!props.branch) return
  try {
    linkingToken.value = store.token
    const response = await BranchService.linkPickerStore(props.branch._id, store.token, environment.value)
    success(`${props.branch.name} quedó vinculada a "${store.companyName}"`)
    emit('linked', response.data)
  } catch (requestError: any) {
    error(requestError?.message || 'No se pudo vincular la tienda.')
  } finally {
    linkingToken.value = ''
  }
}

function currentKey(env: PickerEnv) {
  return env === 'production' ? props.branch?.pickerStore?.hasProdKey : props.branch?.pickerStore?.hasDevKey
}

watch(() => [props.open, environment.value], () => { if (props.open) void load() }, { immediate: true })
</script>

<template>
  <ModalShell
    :open="open"
    :title="branch ? `Conectar ${branch.name} con Picker` : 'Conectar con Picker'"
    subtitle="Vincula la sucursal a una tienda que ya existe en Picker. No se crea ninguna nueva."
    size="lg"
    @close="emit('close')"
  >
    <div class="link">
      <div class="link__env">
        <button type="button" :class="{ active: environment === 'production' }" @click="environment = 'production'">
          Producción <i v-if="currentKey('production')" class="fa-solid fa-circle-check" />
        </button>
        <button type="button" :class="{ active: environment === 'development' }" @click="environment = 'development'">
          Desarrollo <i v-if="currentKey('development')" class="fa-solid fa-circle-check" />
        </button>
      </div>

      <p class="link__note">
        <i class="fa-solid fa-circle-info" />
        Cada entorno de Picker tiene sus propias tiendas y llaves. Vincular aquí solo afecta
        al entorno seleccionado.
      </p>

      <p v-if="loading" class="link__state"><i class="fa-solid fa-spinner fa-spin" /> Cargando tiendas de Picker...</p>
      <p v-else-if="loadError" class="link__state link__state--bad"><i class="fa-solid fa-triangle-exclamation" /> {{ loadError }}</p>
      <p v-else-if="!stores.length" class="link__state"><i class="fa-solid fa-store-slash" /> Picker no devolvió tiendas en este entorno.</p>

      <div v-else class="link__list">
        <article v-for="store in stores" :key="store.token" class="store" :class="{ taken: store.linkedTo && store.linkedTo !== branch?.name }">
          <div class="store__info">
            <strong>{{ store.companyName }}</strong>
            <small v-if="store.linkedTo === branch?.name" class="store__mine"><i class="fa-solid fa-link" /> Vinculada a esta sucursal</small>
            <small v-else-if="store.linkedTo"><i class="fa-solid fa-lock" /> Ya usada por {{ store.linkedTo }}</small>
            <small v-else>Disponible</small>
          </div>
          <button
            type="button"
            :disabled="Boolean(linkingToken) || store.linkedTo === branch?.name"
            @click="link(store)"
          >
            <i :class="linkingToken === store.token ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-plug'" />
            {{ store.linkedTo === branch?.name ? 'Vinculada' : linkingToken === store.token ? 'Vinculando…' : 'Vincular' }}
          </button>
        </article>
      </div>
    </div>
  </ModalShell>
</template>

<style scoped lang="scss">
.link { display: flex; flex-direction: column; gap: 0.85rem; }
.link__env { background: var(--admin-hover); border-radius: 999px; display: flex; gap: 0.25rem; padding: 0.28rem; }
.link__env button { align-items: center; background: transparent; border-radius: 999px; color: var(--admin-muted); cursor: pointer; display: flex; flex: 1 1 0; font-size: 0.82rem; font-weight: 800; gap: 0.4rem; justify-content: center; min-height: 42px; padding: 0.5rem 0.8rem; transition: background-color 0.2s ease, color 0.2s ease; }
.link__env button.active { background: var(--admin-accent); color: var(--admin-on-accent); }
.link__env button:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 2px; }
.link__env i { font-size: 0.72rem; }
.link__note { align-items: flex-start; background: var(--admin-surface); border: 1px solid var(--admin-line); border-radius: 12px; color: var(--admin-muted); display: flex; font-size: 0.8rem; gap: 0.45rem; line-height: 1.45; margin: 0; padding: 0.65rem 0.75rem; }
.link__note i { color: var(--admin-info); margin-top: 0.15rem; }
.link__state { align-items: center; color: var(--admin-muted); display: flex; font-size: 0.86rem; gap: 0.45rem; margin: 0; padding: 0.8rem 0; }
.link__state--bad { color: var(--admin-danger); }
.link__list { display: flex; flex-direction: column; gap: 0.5rem; max-height: 52vh; overflow-y: auto; }
.store { align-items: center; background: var(--admin-surface); border: 1px solid var(--admin-line); border-radius: 14px; display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: space-between; padding: 0.7rem 0.8rem; }
.store.taken { opacity: 0.6; }
.store__info { display: flex; flex: 1 1 180px; flex-direction: column; gap: 0.15rem; }
.store__info strong { color: var(--admin-text); font-size: 0.9rem; }
.store__info small { color: var(--admin-muted); font-size: 0.74rem; }
.store__mine { color: var(--admin-success) !important; font-weight: 800; }
.store button { align-items: center; background: var(--admin-accent); border-radius: 999px; color: var(--admin-on-accent); cursor: pointer; display: flex; font-size: 0.76rem; font-weight: 800; gap: 0.4rem; min-height: 40px; padding: 0.5rem 0.95rem; }
.store button:disabled { background: var(--admin-hover); color: var(--admin-muted); cursor: not-allowed; }
</style>
